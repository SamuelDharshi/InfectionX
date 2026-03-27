const https = require('https');
const fs = require('fs');

const url = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzJiMTJiYjYyZWRlZDRkMmVhNTkwODJiMGMwNjYwYTgzEgoSBhD_3ePFERgBkgEkCgpwcm9qZWN0X2lkEhZCFDE0Mjg4NTM4MjMyNDYyMjYzNDQz&filename=&opi=96797242";

https.get(url, (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
        try {
            fs.writeFileSync('D:/InfectionX/app/stitch.html', rawData);
            console.log('Done');
        } catch (e) {
            console.error(e.message);
        }
    });
}).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
});
