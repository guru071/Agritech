const fs = require('fs');
const path = require('path');

function fixDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      fixDir(p);
    } else if (f.endsWith('.html')) {
      let content = fs.readFileSync(p, 'utf8');
      const badObserver = "if (node.nodeType === 1 && (node.hasAttribute('data-lucide') || node.querySelector('[data-lucide]')))";
      const goodObserver = "if (node.nodeType === 1 && ((node.tagName === 'I' && node.hasAttribute('data-lucide')) || node.querySelector('i[data-lucide]')))";
      if (content.includes(badObserver)) {
        content = content.replace(badObserver, goodObserver);
        fs.writeFileSync(p, content);
        console.log('Fixed loop in ' + p);
      }
    }
  }
}

fixDir('c:\\\\Users\\\\gurup\\\\Downloads\\\\Agritech-main\\\\Agritech-main\\\\artifacts');
