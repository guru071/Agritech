const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/gurup/Downloads/Agritech-main/Agritech-main/artifacts/agrihub-monolith/public';

// 1. Remove navigation links from all HTML files
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') && f !== 'community.html');
for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const newLines = lines.filter(line => !line.includes('href="community.html"'));
  if (lines.length !== newLines.length) {
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
    console.log('Removed community links from', file);
  }
}

// 2. Delete the community.html file itself
const commPath = path.join(dir, 'community.html');
if (fs.existsSync(commPath)) {
  fs.unlinkSync(commPath);
  console.log('Deleted community.html');
}

// 3. Remove the Comments section from learning.html
const learningPath = path.join(dir, 'learning.html');
if (fs.existsSync(learningPath)) {
  let lContent = fs.readFileSync(learningPath, 'utf8');
  // Remove the comment section by matching the HTML block
  const commentRegex = /<!-- YouTube Comment Section -->[\s\S]*?<!-- RIGHT COLUMN/m;
  if (commentRegex.test(lContent)) {
    lContent = lContent.replace(commentRegex, '<!-- RIGHT COLUMN');
    fs.writeFileSync(learningPath, lContent, 'utf8');
    console.log('Removed comments section from learning.html');
  }
}
