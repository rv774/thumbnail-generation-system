import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:3001';
const TEST_EMAIL = `test_${Date.now()}@example.com`;
const TEST_PASSWORD = 'password';

async function verify() {
    console.log(`1. Signing up user: ${TEST_EMAIL}`);
    const signupRes = await fetch(`${BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD })
    });

    if (!signupRes.ok) {
        const txt = await signupRes.text();
        console.error('Signup failed:', txt);
        process.exit(1);
    }

    const { token } = await signupRes.json();
    console.log('   Signup success. Token received.');

    console.log('2. Creating dummy image...');
    const dummyPath = path.join(__dirname, 'test-image.txt');
    fs.writeFileSync(dummyPath, 'This is not a real image, but it verifies the upload flow.');

    console.log('3. Uploading file...');

    const blob = new Blob([fs.readFileSync(dummyPath)], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('files', blob, 'test.png'); // Lie about extension/type to trigger worker

    const uploadRes = await fetch(`${BASE_URL}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
    });

    if (!uploadRes.ok) {
        const txt = await uploadRes.text();
        console.error('Upload failed:', txt);
        process.exit(1);
    }

    const uploadData = await uploadRes.json();
    console.log('   Upload success:', JSON.stringify(uploadData.files[0]));
    const fileId = uploadData.files[0]._id;

    console.log('4. Polling for status update...');
    let attempts = 0;
    while (attempts < 10) {
        attempts++;
        await new Promise(r => setTimeout(r, 1000));

        const checkRes = await fetch(`${BASE_URL}/upload`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const files = await checkRes.json();
        const myFile = files.find(f => f._id === fileId);

        console.log(`   Attempt ${attempts}: Status = ${myFile.status}`);

        if (myFile.status === 'completed' || myFile.status === 'failed') {
            console.log('   Final Status Reached!');
            if (myFile.status === 'failed') {
                console.log('   (Expected failure since we uploaded text as image, but Worker DID pick it up!)');
            }
            return;
        }
    }

    console.error('Timeout waiting for worker.');
    process.exit(1);
}

verify().catch(console.error);
