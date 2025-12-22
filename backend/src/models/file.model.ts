import mongoose, { Schema, Document } from 'mongoose';

export interface IFile extends Document {
    userId: mongoose.Types.ObjectId;
    originalFilename: string;
    originalFilePath: string;
    thumbnailPath?: string;
    mimeType: string;
    size: number;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    error?: string;
    createdAt: Date;
    updatedAt: Date;
}

const FileSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    originalFilename: { type: String, required: true },
    originalFilePath: { type: String, required: true },
    thumbnailPath: { type: String },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    status: {
        type: String,
        enum: ['queued', 'processing', 'completed', 'failed'],
        default: 'queued'
    },
    error: { type: String }
}, { timestamps: true });

export const FileModel = mongoose.model<IFile>('File', FileSchema);
