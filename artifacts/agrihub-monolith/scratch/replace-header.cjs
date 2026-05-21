const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/gurup/Downloads/Agritech-main/Agritech-main/artifacts/agrihub-monolith/public';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const standardHeader = `  <header class="agri-nav glass sticky top-0 z-50">
    <div class="container mx-auto px-4 md:px-6 py-3 flex flex-wrap justify-between items-center gap-3">
      <a href="index.html" class="agri-logo">
        <div class="agri-logo-mark">🌾</div>
        <div class="agri-logo-text">
          <strong>AgriHub</strong>
          <span>Harvest Exchange</span>
        </div>
      </a>

      <div class="agri-search order-3 md:order-none w-full md:w-auto">
        <input type="text" id="search-input" oninput="typeof loadProducts === 'function' ? loadProducts() : null" placeholder="Search rice, seeds, land, tools…">
        <span class="agri-search-icon" data-icon-size="sm"><i data-lucide="search"></i></span>
      </div>

      <div class="flex items-center gap-3 md:gap-5">
        <div class="hidden lg:flex gap-5">
          <a href="community.html" class="agri-nav-link" id="nav-feed">Stories</a>
          <a href="index.html" class="agri-nav-link" id="nav-market">Harvest Mart</a>
          <a href="land-market.html" class="agri-nav-link" id="nav-land">Land</a>
          <a href="learning.html" class="agri-nav-link" id="nav-learn">Academy</a>
          <a href="smart-home.html" class="agri-nav-link" id="nav-smarthome">IoT Farm</a>
          <a href="profile.html" class="agri-nav-link" id="nav-analytics">Profile</a>
        </div>
        <div id="auth-actions"></div>
        <button onclick="toggleLang()" id="lang-btn" class="hidden md:inline text-xs font-semibold text-gray-400 hover:text-white px-2 py-1 rounded border border-white/10">தமிழ்</button>
      </div>
    </div>
  </header>`;

let changed = [];
files.forEach(file => {
  let p = path.join(dir, file);
  let c = fs.readFileSync(p, 'utf8');
  let orig = c;
  
  // Replace anything that looks like the header
  c = c.replace(/<header class="agri-nav[^>]*>[\s\S]*?<\/header>/i, '__HEADER_PLACEHOLDER__');
  
  let newHeader = standardHeader;
  
  // Set the active class based on the file
  let linkTarget = file;
  if (file === 'messages.html' || file === 'public-profile.html') {
    linkTarget = 'community.html'; // Messages/Profiles fall under Community navigation active state usually
  } else if (file === 'payment.html') {
    linkTarget = 'profile.html';
  } else if (file === 'prosurvey.html') {
    linkTarget = 'land-market.html';
  }
  
  newHeader = newHeader.replace(`href="${linkTarget}" class="agri-nav-link"`, `href="${linkTarget}" class="agri-nav-link active"`);
  
  c = c.replace('__HEADER_PLACEHOLDER__', newHeader);
  
  if (c !== orig) { 
    fs.writeFileSync(p, c); 
    changed.push(file); 
  }
});
console.log('Updated Headers:', changed.join(', '));
