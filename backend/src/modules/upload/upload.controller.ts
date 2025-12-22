import { FastifyReply, FastifyRequest } from 'fastify';
import { FileModel } from '../../models/file.model.js';
import { addThumbnailJob } from '../../queues/thumbnail.queue.js';
import fs from 'fs';
import path from 'path';
import util from 'util';
import { pipeline } from 'stream';

const pump = util.promisify(pipeline);
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const uploadFile = async (req: FastifyRequest, reply: FastifyReply) => {
    const parts = req.files();
    const user = req.user as any; // JWT payload
    const savedFiles = [];

    for await (const part of parts) {
        if (part.file) {
            const filename = `${Date.now()}-${part.filename}`;
            const savePath = path.join(__dirname, '../../../uploads/originals', filename);

            await pump(part.file, fs.createWriteStream(savePath));

            const fileDoc = await FileModel.create({
                userId: user.id,
                originalFilename: part.filename,
                originalFilePath: savePath,
                mimeType: part.mimetype,
                size: 0, // In a real app we'd count bytes during stream or stat file after
                status: 'queued'
            });

            await addThumbnailJob(fileDoc);
            savedFiles.push(fileDoc);
        }
    }

    return { message: 'Files uploaded', files: savedFiles };
};

export const getFiles = async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.user as any;
    const files = await FileModel.find({ userId: user.id }).sort({ createdAt: -1 });
    return files;
};
