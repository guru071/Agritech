const fs = require('fs');
const path = require('path');

const publicDir = 'c:/Users/gurup/Downloads/Agritech-main/Agritech-main/artifacts/agrihub-monolith/public';
const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

files.forEach(file => {
  const filePath = path.join(publicDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('id="nav-land">Land</a>')) {
    content = content.replace(/id="nav-land">Land<\/a>/g, 'id="nav-land">Real Estate</a>');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
