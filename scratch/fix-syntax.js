const fs = require('fs');
const path = 'c:/Users/gurup/Downloads/Agritech-main/Agritech-main/artifacts/agrihub-monolith/public/community.html';
let c = fs.readFileSync(path, 'utf8');
c = c.replace(/\\\$\\{/g, '${');
fs.writeFileSync(path, c);
console.log("Fixed template literals.");
