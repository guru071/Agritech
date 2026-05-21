const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/gurup/Downloads/Agritech-main/Agritech-main/artifacts/agrihub-monolith/public';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
const utilsTag = '<link rel="stylesheet" href="/agrihub-utils.css">';
let changed = [];
files.forEach(file => {
  let p = path.join(dir, file);
  let c = fs.readFileSync(p, 'utf8');
  let orig = c;
  
  // Replace Tailwind CDN script with utils CSS
  c = c.replace(/<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>/g, utilsTag);
  
  // If agrihub-utils.css not already there and no replacement was done, add after agrihub-ui.css
  if (!c.includes('agrihub-utils.css')) {
    c = c.replace('<link rel="stylesheet" href="/agrihub-ui.css">', '<link rel="stylesheet" href="/agrihub-ui.css">\n  ' + utilsTag);
  }
  
  if (c !== orig) { 
    fs.writeFileSync(p, c); 
    changed.push(file); 
  }
});
console.log('Updated:', changed.join(', '));
