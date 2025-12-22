import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Correct path resolution relative to backend
const thumbnailsDir = path.join(__dirname, '../../uploads/thumbnails');
const userId = '694667bec68d74816465d740';
const userThumbDir = path.join(thumbnailsDir, userId);

console.log(`Checking user thumbnail dir: ${userThumbDir}`);

if (fs.existsSync(userThumbDir)) {
    console.log('✅ User directory exists.');
    const files = fs.readdirSync(userThumbDir);
    console.log(`Contents (${files.length} files):`);
    files.forEach(f => {
        const fullPath = path.join(userThumbDir, f);
        const size = fs.statSync(fullPath).size;
        console.log(` - ${f} (${size} bytes)`);
    });
} else {
    console.log('❌ User directory NOT found.');
}
