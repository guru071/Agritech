const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/gurup/Downloads/Agritech-main/Agritech-main/artifacts/agrihub-monolith/public';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

for (const file of files) {
  const p = path.join(dir, file);
  let c = fs.readFileSync(p, 'utf8');
  let orig = c;

  // Replace agrihub-utils with Tailwind CDN
  c = c.replace(/<link rel="stylesheet" href="\/agrihub-utils\.css">/g, '<script src="https://cdn.tailwindcss.com"></script>');
  
  // If it didn't have it (e.g. prosurvey.html), ensure Tailwind is there
  if (!c.includes('cdn.tailwindcss.com')) {
    c = c.replace('</head>', '  <script src="https://cdn.tailwindcss.com"></script>\n</head>');
  }

  if (c !== orig) {
    fs.writeFileSync(p, c);
    console.log('Restored Tailwind in: ' + file);
  }
}
