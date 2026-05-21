const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/gurup/Downloads/Agritech-main/Agritech-main/artifacts/agrihub-monolith/public';

const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') && f !== 'home.html');

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 1. Desktop Nav Replacement
  content = content.replace(/<a href="home\.html"[^>]*>.*?<\/a>/gs, function(match) {
    if (match.includes('id="nav-home"')) {
       // Replace with Social Feed
       return `<a href="community.html" class="text-gray-300 transition hover:text-emerald-300" id="nav-feed">Social Feed</a>`;
    }
    if (match.includes('flex items-center gap-2')) {
       // Logo link
       return `<a href="index.html" class="flex items-center gap-2">`;
    }
    return `<a href="index.html" class="text-sm text-gray-500 hover:text-gray-300 transition mt-1">  Back to Home</a>`;
  });

  // 2. Mobile Nav Replacement
  if (!content.includes('href="community.html"') && content.includes('href="learning.html"')) {
    const mobileLink = `
    <a href="community.html" class="flex flex-col items-center gap-1 text-gray-400 hover:text-primary transition">
      <i data-lucide="layout-list" class="w-5 h-5"></i>
      <span class="text-[9px]" id="m-nav-feed">Feed</span>
    </a>
    <a href="learning.html"`;
    content = content.replace('    <a href="learning.html"', mobileLink);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Processed', file);
}

const homePath = path.join(dir, 'home.html');
if (fs.existsSync(homePath)) {
  fs.unlinkSync(homePath);
  console.log('Deleted home.html');
}
