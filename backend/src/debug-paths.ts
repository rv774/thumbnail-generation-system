
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('__dirname:', __dirname);

const path1 = path.join(__dirname, '../uploads');
const path2 = path.join(__dirname, '../../uploads');
const path3 = path.join(__dirname, '../../../uploads');

console.log('path1 (../uploads):', path1, 'Exists:', fs.existsSync(path1));
console.log('path2 (../../uploads):', path2, 'Exists:', fs.existsSync(path2));
console.log('path3 (../../../uploads):', path3, 'Exists:', fs.existsSync(path3));
