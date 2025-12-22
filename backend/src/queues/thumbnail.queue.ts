import { Queue } from 'bullmq';
import { IFile } from '../models/file.model.js';

const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
};

export const thumbnailQueue = new Queue('thumbnail-queue', { connection });

export const addThumbnailJob = async (file: IFile) => {
    await thumbnailQueue.add(
        'generate-thumbnail',
        {
            fileId: file._id,
            filePath: file.originalFilePath,
            mimeType: file.mimeType,
            userId: file.userId,
        },
        {
            // 🔥 Ensures FIFO per user

            attempts: 50, // High attempts to allow for "User Busy" retries
            backoff: { type: 'fixed', delay: 2000 },
            removeOnComplete: true,
            removeOnFail: 500
        }
    );
};
