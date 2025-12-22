import { Worker } from 'bullmq';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { processThumbnailJob } from './workers/thumbnail.worker.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/thumbnail-db';
const REDIS_CONFIG = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
};

mongoose.connect(MONGO_URI).then(() => console.log('Worker DB Connected'));

const worker = new Worker('thumbnail-queue', processThumbnailJob, {
    connection: REDIS_CONFIG,
    concurrency: 5, // Process up to 5 users in parallel
    // Note: 'group' in queue.add ensures sequential processing per user
});

worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed!`);
});

worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed: ${err.message}`);
});

console.log('Thumbnail Worker Started 🚀');
