import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import path from 'path';
import fs from 'fs';

// Setup static paths
if (ffmpegStatic) ffmpeg.setFfmpegPath(ffmpegStatic);
if (ffprobeStatic && ffprobeStatic.path) ffmpeg.setFfprobePath(ffprobeStatic.path);

const filePath = String.raw`C:\Users\viradiya rohit\.gemini\antigravity\scratch\thumbnail-generator\uploads\originals\1766309483699-855289-hd_1920_1080_25fps.mp4`;
const outputDir = path.join(process.cwd(), 'temp_test');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

const testSeekZero = () => {
    return new Promise((resolve, reject) => {
        const out = path.join(outputDir, 'seek_zero.png');
        console.log('Testing Seek to 0.0 (Fallback Strategy)...');
        ffmpeg(filePath)
            .inputOptions([`-ss 0`]) // Seek to beginning
            .frames(1)
            .output(out)
            .on('end', () => { console.log('Seek to 0 success'); resolve(); })
            .on('error', (err) => { console.error('Seek to 0 failed:', err.message); resolve(); })
            .run();
    });
};

testSeekZero();
