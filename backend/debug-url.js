import http from 'http';

const testUrl = 'http://localhost:3001/files/thumbnails/694667bec68d74816465d740/1766306413138-p1_thumb.png';

console.log(`Testing URL: ${testUrl}`);

http.get(testUrl, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Content-Type: ${res.headers['content-type']}`);
    console.log(`Content-Length: ${res.headers['content-length']}`);

    if (res.statusCode === 200) {
        console.log('✅ File is accessible!');
    } else {
        console.error('❌ File is NOT accessible.');
    }
}).on('error', (err) => {
    console.error('Error fetching URL:', err.message);
});
