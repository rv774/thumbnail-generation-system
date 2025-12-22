
import http from 'http';

const pingUrl = 'http://localhost:3001/ping';
const fileUrl = 'http://localhost:3001/files/thumbnails/6946606412bc971f6cb30916/1766392278721-p1_thumb.png';

const check = (url) => {
    console.log(`Checking ${url}...`);
    return new Promise((resolve) => {
        http.get(url, (res) => {
            console.log(`[${url}] Status: ${res.statusCode}`);
            let data = [];
            res.on('data', chunk => data.push(chunk));
            res.on('end', () => {
                const body = Buffer.concat(data);
                console.log(`[${url}] Body Length: ${body.length}`);
                if (body.length < 1000) {
                    console.log(`[${url}] Body:`, body.toString().slice(0, 200));
                }
                resolve();
            });
        }).on('error', (err) => {
            console.error(`[${url}] Error:`, err.message);
            resolve();
        });
    });
};

async function run() {
    await check(pingUrl);
    await check(fileUrl);
}

run();
