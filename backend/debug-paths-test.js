
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Current __dirname:', __dirname);

// Mimic server.ts logic (assuming this script is in backend/src/debug-paths-test.js)
// But I am writing it to backend/debug-paths-test.js, so I need to adjust or simulate the deep path.

// Let's simulate being in src/server.ts
const simulatedSrcDir = path.join(__dirname, 'src');
console.log('Simulated src dir:', simulatedSrcDir);

const wrongPath = path.join(simulatedSrcDir, '../../uploads');
const correctPath = path.join(simulatedSrcDir, '../uploads');

console.log('Path "../../uploads":', wrongPath);
console.log('Exists?', fs.existsSync(wrongPath));

console.log('Path "../uploads":', correctPath);
console.log('Exists?', fs.existsSync(correctPath));
