
import http from 'http';

const pingUrl = 'http://localhost:3001/ping';

console.log(`Checking ${pingUrl}...`);
http.get(pingUrl, (res) => {
    console.log(`Status: ${res.statusCode}`);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log('Body:', data));
}).on('error', (err) => {
    console.error('Error:', err.message);
});
