import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

console.log('Sharp imported successfully');

const test = async () => {
    try {
        const img = sharp({
            create: {
                width: 100,
                height: 100,
                channels: 4,
                background: { r: 255, g: 0, b: 0, alpha: 0.5 }
            }
        });
        const meta = await img.metadata();
        console.log('Sharp working:', meta);
    } catch (e) {
        console.error('Sharp failed:', e);
    }
};

test();
