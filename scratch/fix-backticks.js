const fs = require('fs');
const path = 'c:/Users/gurup/Downloads/Agritech-main/Agritech-main/artifacts/agrihub-monolith/public/community.html';

let content = fs.readFileSync(path, 'utf8');
content = content.replace(/\\`/g, '`');
fs.writeFileSync(path, content, 'utf8');
console.log("Fixed backticks in community.html");
