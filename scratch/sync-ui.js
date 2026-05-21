const fs = require('fs');
const path = require('path');

const publicDir = 'c:/Users/gurup/Downloads/Agritech-main/Agritech-main/artifacts/agrihub-monolith/public';

// 1. Extract Master Header from index.html
const indexContent = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8');
const headerStart = indexContent.indexOf('<header class="agri-nav');
const headerEnd = indexContent.indexOf('</header>') + 9;
const masterHeader = indexContent.substring(headerStart, headerEnd);

// Remove the search bar from the master header for non-index pages
const searchRegex = /<div class="agri-search[^>]*>[\s\S]*?<\/div>/;
let nonIndexHeader = masterHeader.replace(searchRegex, '');

// Link mappings to IDs for active state
const pageToNavId = {
  'community.html': 'nav-feed',
  'land-market.html': 'nav-land',
  'learning.html': 'nav-learn',
  'smart-home.html': 'nav-smarthome',
  'profile.html': 'nav-analytics',
  'messages.html': 'nav-feed', // groups under social
  'public-profile.html': 'nav-feed' // groups under social
};

const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.html') && f !== 'index.html');

files.forEach(file => {
  const filePath = path.join(publicDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find existing nav or header
  const navStart = content.search(/<(nav|header) [^>]*>/);
  if (navStart !== -1) {
    const isNav = content.substring(navStart, navStart + 4) === '<nav';
    const endTag = isNav ? '</nav>' : '</header>';
    const navEnd = content.indexOf(endTag, navStart) + endTag.length;
    
    if (navEnd > navStart) {
      // Customize header for this specific page
      let customizedHeader = nonIndexHeader;
      
      // Remove 'active' from all links first
      customizedHeader = customizedHeader.replace(/class="agri-nav-link active"/g, 'class="agri-nav-link"');
      
      // Add 'active' to the correct link
      const activeId = pageToNavId[file];
      if (activeId) {
        const targetStr = `id="${activeId}"`;
        customizedHeader = customizedHeader.replace(
          new RegExp(`class="agri-nav-link"\\s+id="${activeId}"`),
          `class="agri-nav-link active" id="${activeId}"`
        );
      }
      
      // Replace the old block with the new header
      content = content.substring(0, navStart) + customizedHeader + content.substring(navEnd);
      
      // Also ensure agrihub-ui.css is linked
      if (!content.includes('agrihub-ui.css')) {
        content = content.replace('</head>', '  <link rel="stylesheet" href="/agrihub-ui.css">\n</head>');
      }
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated UI for ${file}`);
    }
  }
});
