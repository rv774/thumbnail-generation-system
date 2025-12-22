const fs = require('fs');
const path = require('path');

// This specific path was from the user's log
const brokenPath = path.join(__dirname, '../../../uploads/thumbnails/694667bec68d74816465d740/1766311293249-856787-hd_1920_1080_30fps_thumb.png');
const dirPath = path.dirname(brokenPath);

console.log(`Checking file: ${brokenPath}`);

if (fs.existsSync(brokenPath)) {
    console.log('✅ File exists!');
    console.log('Size:', fs.statSync(brokenPath).size);
} else {
    console.log('❌ File does NOT exist.');

    if (fs.existsSync(dirPath)) {
        console.log(`Directory ${dirPath} exists. Contents:`);
        fs.readdirSync(dirPath).forEach(f => console.log(` - ${f}`));
    } else {
        console.log(`❌ Directory ${dirPath} does NOT exist.`);
    }
}
