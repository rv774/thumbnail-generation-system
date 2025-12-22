import { Job } from 'bullmq';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import os from 'os';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';

// Set ffmpeg paths for local development
if (ffmpegStatic) {
    ffmpeg.setFfmpegPath(ffmpegStatic);
}
if (ffprobeStatic && ffprobeStatic.path) {
    ffmpeg.setFfprobePath(ffprobeStatic.path);
}
import { FileModel } from '../models/file.model.js';
import { Redis } from 'ioredis';

const redisForPubSub = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
});

import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ensureDir = (dir: string) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const getVideoMidpoint = (filePath: string): Promise<number> => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) return reject(err);
            const duration = metadata.format.duration || 0;
            resolve(duration / 2);
        });
    });
};

export const processThumbnailJob = async (job: Job) => {
    let { fileId, filePath, mimeType, userId } = job.data;
    let uploadBase = path.join(__dirname, '../../uploads'); // Default for Docker/Backend-local

    // Fix for local runtime handling Docker paths from DB
    // Ideally we want to use the backend/server's upload directory which is ../../uploads relative to this worker file
    uploadBase = path.join(__dirname, '../../uploads');

    if (filePath.startsWith('/app/uploads/')) {
        const relativePath = filePath.replace('/app/uploads/', '');
        const backendPath = path.join(uploadBase, relativePath);

        // Check if file exists in our target directory
        if (fs.existsSync(backendPath)) {
            filePath = backendPath;
        } else {
            // Fallback: Check if it exists in root uploads (development confusion)
            const rootPath = path.join(__dirname, '../../../uploads', relativePath);
            if (fs.existsSync(rootPath)) {
                filePath = rootPath;
                // But we still want to output to backend uploads so we don't change uploadBase
                console.log(`[Worker] Reading source from ROOT uploads: ${filePath}`);
            } else {
                console.log(`[Worker] Could not find file at ${backendPath} or ${rootPath}`);
            }
        }
    } else if (filePath.startsWith('/app/') && !fs.existsSync(filePath)) {
        // Fallback for other /app/ paths
        const localPath = path.join(__dirname, '../../', filePath.replace('/app/', ''));
        if (fs.existsSync(localPath)) {
            filePath = localPath;
        }
    }

    const lockKey = `lock:thumbnail:${userId}`;

    // 🔒 Try to acquire lock for this user (5 min expiration safety)
    const acquired = await redisForPubSub.set(lockKey, '1', 'EX', 300, 'NX');
    if (!acquired) {
        // User has another job running. Fail this job so it retries later (backoff).
        throw new Error('USER_BUSY: Processing another job for this user.');
    }

    try {
        // 1. Update status to processing
        await FileModel.findByIdAndUpdate(fileId, { status: 'processing' });
        await redisForPubSub.publish('updates', JSON.stringify({ userId, fileId, status: 'processing' }));



        const outputDir = path.join(uploadBase, 'thumbnails', userId);
        ensureDir(outputDir);
        const outputFilename = `${path.basename(filePath, path.extname(filePath))}_thumb.png`;
        const outputPath = path.join(outputDir, outputFilename);

        if (mimeType.startsWith('image/')) {
            await sharp(filePath)
                .resize(128, 128)
                .toFile(outputPath);
        } else if (mimeType.startsWith('video/')) {
            console.log(`[Worker] Processing video file: ${filePath}`);
            const midpoint = await getVideoMidpoint(filePath);

            // Helper function to attempt frame extraction
            const extractFrame = (seekTime: number) => {
                return new Promise((resolve, reject) => {
                    const tempPath = path.join(os.tmpdir(), `${fileId}_${seekTime}_temp.png`);
                    console.log(`[Worker] Attempting to extract frame at ${seekTime}s for ${filePath}`);

                    ffmpeg(filePath)
                        .inputOptions([`-ss ${seekTime}`])
                        // .frames(1) // fluent-ffmpeg frames(1) might not be sufficient for some versions with image2
                        .frames(1) // Use standard frames(1) instead of -update 1
                        // .outputOptions(['-vframes 1', '-update 1']) // Explicitly tell it to just update the file (single image)
                        .output(tempPath)
                        .on('start', (cmd) => console.log(`[Worker] FFmpeg command: ${cmd}`))
                        .on('stderr', (line) => console.log(`[Worker] FFmpeg stderr: ${line}`))
                        .on('end', async () => {
                            if (!fs.existsSync(tempPath) || fs.statSync(tempPath).size === 0) {
                                console.error(`[Worker] Error: Temp file missing or empty at ${tempPath}`);
                                if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
                                return reject(new Error(`FFmpeg finished but temp file missing/empty`));
                            }

                            try {
                                await sharp(tempPath)
                                    .resize(128, 128)
                                    .toFile(outputPath);
                                fs.unlinkSync(tempPath);
                                resolve(true);
                            } catch (err) {
                                if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
                                reject(err);
                            }
                        })
                        .on('error', (err) => {
                            console.error(`[Worker] FFmpeg error for ${fileId} at ${seekTime}s:`, err);
                            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
                            reject(err);
                        })
                        .run();
                });
            };

            try {
                // Try midpoint first
                await extractFrame(midpoint);
            } catch (err) {
                console.warn(`[Worker] Midpoint extraction failed for ${fileId}, entering fallback retry loop (0s)...`);

                let fallbackSuccess = false;
                let lastError = null;

                // Retry fallback up to 3 times
                for (let i = 0; i < 3; i++) {
                    try {
                        console.log(`[Worker] Fallback attempt ${i + 1}/3 for ${fileId}`);
                        await extractFrame(0);
                        fallbackSuccess = true;
                        break; // Success!
                    } catch (fallbackErr: any) {
                        console.error(`[Worker] Fallback attempt ${i + 1} failed:`, fallbackErr.message);
                        lastError = fallbackErr;
                        // Wait 1 second before retrying
                        await new Promise(res => setTimeout(res, 1000));
                    }
                }

                if (!fallbackSuccess) {
                    console.error(`[Worker] All fallback attempts failed for ${fileId}`);
                    throw lastError; // Throw the final error to fail the job
                }
            }
        }

        // 2. Update status to completed
        const relativePath = `/files/thumbnails/${userId}/${outputFilename}`;
        await FileModel.findByIdAndUpdate(fileId, {
            status: 'completed',
            thumbnailPath: relativePath
        });

        await redisForPubSub.publish('updates', JSON.stringify({
            userId,
            fileId,
            status: 'completed',
            thumbnailPath: relativePath
        }));

    } catch (error: any) {
        // 3. Handle failure
        console.error(`Job failed for ${fileId}:`, error);
        await FileModel.findByIdAndUpdate(fileId, {
            status: 'failed',
            error: error.message
        });

        await redisForPubSub.publish('updates', JSON.stringify({
            userId,
            fileId,
            status: 'failed',
            error: error.message
        }));
        throw error;
    } finally {
        // 🔓 Release lock
        await redisForPubSub.del(lockKey);
    }
};
