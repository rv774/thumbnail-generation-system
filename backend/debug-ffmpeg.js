import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import path from 'path';
import fs from 'fs';

// Setup static paths
if (ffmpegStatic) ffmpeg.setFfmpegPath(ffmpegStatic);
if (ffprobeStatic && ffprobeStatic.path) ffmpeg.setFfprobePath(ffprobeStatic.path);

const filePath = String.raw`C:\Users\viradiya rohit\.gemini\antigravity\scratch\thumbnail-generator\uploads\originals\1766309088941-855289-hd_1920_1080_25fps.mp4`;
// Midpoint from logs: 7.8825
const midpoint = 7.8825;
const outputDir = path.join(process.cwd(), 'temp_test');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

const testCompareSeeking = async () => {
    // 1. Output Seeking
    await new Promise((resolve) => {
        const out = path.join(outputDir, 'output_seek.png');
        if (fs.existsSync(out)) fs.unlinkSync(out);
        console.log('Testing Output Seeking...');
        ffmpeg(filePath)
            .outputOptions([`-ss ${midpoint}`])
            .frames(1)
            .output(out)
            .on('end', () => {
                if (fs.existsSync(out) && fs.statSync(out).size > 0) console.log('✅ Output Seeking SUCCESS');
                else console.log('❌ Output Seeking FAILED (No File)');
                resolve();
            })
            .on('error', (err) => { console.log('❌ Output Seeking Error:', err.message); resolve(); })
            .run();
    });

    console.log('---');

    // 2. Input Seeking
    await new Promise((resolve) => {
        const out = path.join(outputDir, 'input_seek.png');
        if (fs.existsSync(out)) fs.unlinkSync(out);
        console.log('Testing Input Seeking...');
        ffmpeg(filePath)
            .inputOptions([`-ss ${midpoint}`])
            .frames(1)
            .output(out)
            .on('end', () => {
                if (fs.existsSync(out) && fs.statSync(out).size > 0) console.log('✅ Input Seeking SUCCESS');
                else console.log('❌ Input Seeking FAILED (No File)');
                resolve();
            })
            .on('error', (err) => { console.log('❌ Input Seeking Error:', err.message); resolve(); })
            .run();
    });
};

const run = async () => {
    await testCompareSeeking();
};

run();
