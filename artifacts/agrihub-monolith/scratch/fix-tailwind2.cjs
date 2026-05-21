const fs = require('fs');
const dir = 'c:/Users/gurup/Downloads/Agritech-main/Agritech-main/artifacts/agrihub-monolith/public';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

for (const f of files) {
  let c = fs.readFileSync(dir+'/'+f, 'utf8');
  let o = c;
  
  c = c.replace(/<link[^>]*href="\/agrihub-utils\.css"[^>]*>\r?\n?/g, '');
  
  if (!c.includes('cdn.tailwindcss.com')) {
    c = c.replace('</head>', '  <script src="https://cdn.tailwindcss.com"></script>\n</head>');
  }
  
  if (c !== o) {
    fs.writeFileSync(dir+'/'+f, c);
    console.log('Fixed ' + f);
  }
}
