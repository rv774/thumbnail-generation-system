import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import path from 'path';

if (ffmpegStatic) ffmpeg.setFfmpegPath(ffmpegStatic);
if (ffprobeStatic && ffprobeStatic.path) ffmpeg.setFfprobePath(ffprobeStatic.path);

const filePath = String.raw`C:\Users\viradiya rohit\.gemini\antigravity\scratch\thumbnail-generator\uploads\originals\1766309088941-855289-hd_1920_1080_25fps.mp4`;

console.log('Probing file:', filePath);

ffmpeg.ffprobe(filePath, (err, metadata) => {
    if (err) {
        console.error('Probe failed:', err);
    } else {
        console.log('Duration:', metadata.format.duration);
        console.log('Streams:', metadata.streams.length);
        metadata.streams.forEach((s, i) => {
            console.log(`Stream ${i}: ${s.codec_type} / ${s.codec_name} - Duration: ${s.duration}`);
        });
    }
});
