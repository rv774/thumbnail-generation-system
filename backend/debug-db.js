import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/thumbnail-db';

const fileSchema = new mongoose.Schema({
    userId: String,
    originalFilename: String,
    status: String,
    thumbnailPath: String,
    error: String
}, { timestamps: true });

const FileModel = mongoose.model('File', fileSchema);

async function checkLastFile() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        const lastFile = await FileModel.findOne().sort({ createdAt: -1 });
        if (lastFile) {
            console.log('Last File Record:', JSON.stringify(lastFile.toJSON(), null, 2));
        } else {
            console.log('No files found.');
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkLastFile();
