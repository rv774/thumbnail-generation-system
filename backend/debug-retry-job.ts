import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { FileModel } from './src/models/file.model.js';
import { addThumbnailJob, thumbnailQueue } from './src/queues/thumbnail.queue.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/thumbnail-db';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryLastJob() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        const file = await FileModel.findOne().sort({ createdAt: -1 });
        if (!file) {
            console.error('No files found to retry.');
            return;
        }

        console.log(`Found last file: ${file.originalFilename} (Status: ${file.status})`);

        // Reset status
        file.status = 'queued';
        file.error = undefined;
        file.thumbnailPath = undefined;
        await file.save();
        console.log('Reset file status to queued.');

        // Add to queue
        await addThumbnailJob(file);
        console.log('Added job to queue.');

        // Poll for completion
        console.log('Polling for completion...');
        const startTime = Date.now();
        while (Date.now() - startTime < 30000) { // 30s timeout
            const updatedFile = await FileModel.findById(file._id);
            if (updatedFile?.status === 'completed') {
                console.log('✅ Job completed successfully!');
                console.log('Thumbnail Path:', updatedFile.thumbnailPath);

                // Optional: Verify file exists on disk (if path is local)
                // Note: thumbnailPath is relative url, e.g. /files/thumbnails/...
                // Worker stores in uploads/thumbnails/...
                process.exit(0);
            }
            if (updatedFile?.status === 'failed') {
                console.error('❌ Job failed again:', updatedFile.error);
                process.exit(1);
            }
            if (updatedFile?.status === 'processing') {
                process.stdout.write('.');
            }
            await wait(1000);
        }

        console.error('❌ Timeout waiting for job completion.');
        process.exit(1);

    } catch (err) {
        console.error(err);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        await thumbnailQueue.close();
    }
}

retryLastJob();
