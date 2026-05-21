const fs = require('fs');
const path = require('path');

const publicDir = 'c:/Users/gurup/Downloads/Agritech-main/Agritech-main/artifacts/agrihub-monolith/public';

// 1. Get Master Header
const indexContent = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8');
const headerStart = indexContent.indexOf('<header class="agri-nav');
const headerEnd = indexContent.indexOf('</header>') + 9;
let masterHeader = indexContent.substring(headerStart, headerEnd);

// Remove search bar
masterHeader = masterHeader.replace(/<div class="agri-search[^>]*>[\s\S]*?<\/div>/, '');
// Set active state to Profile
masterHeader = masterHeader.replace(/class="agri-nav-link active"/g, 'class="agri-nav-link"');
masterHeader = masterHeader.replace(/class="agri-nav-link"\s+id="nav-analytics"/, 'class="agri-nav-link active" id="nav-analytics"');

// 2. Fix prosurvey.html
const prosurveyPath = path.join(publicDir, 'prosurvey.html');
let proContent = fs.readFileSync(prosurveyPath, 'utf8');

// Inject tailwind and css if missing
if (!proContent.includes('agrihub-ui.css')) {
  proContent = proContent.replace('</head>', '  <script src="https://cdn.tailwindcss.com"></script>\n  <link rel="stylesheet" href="/agrihub-ui.css">\n</head>');
}

// Inject Header if missing
if (!proContent.includes('<header class="agri-nav')) {
  proContent = proContent.replace('<body class="min-h-screen flex flex-col">', '<body class="min-h-screen flex flex-col">\n' + masterHeader);
}

// 3. Fix Auth Bug
// Replace alert(data.error) with graceful logout
const authFix = `
        if (data.error) {
          if (data.error === "User record not found." || data.error === "Invalid Token") {
             localStorage.removeItem("token");
             localStorage.removeItem("user");
             window.location.href = "profile.html";
             return;
          }
          alert(data.error);
`;
proContent = proContent.replace(`        if (data.error) {\n          alert(data.error);`, authFix);

// Fix loadLandFromDatabase bug
const loadFix = `
        let land = null;
        try { land = JSON.parse(resText); } catch(e) { land = null; }
        if (land && land.error && (land.error === "User record not found." || land.error === "Invalid Token")) {
           localStorage.removeItem("token");
           localStorage.removeItem("user");
           window.location.href = "profile.html";
           return;
        }
        if (land && land.pts) {
`;
proContent = proContent.replace(`        let land = null;\n        try { land = JSON.parse(resText); } catch(e) { land = null; }\n        if (land && land.pts) {`, loadFix);

fs.writeFileSync(prosurveyPath, proContent, 'utf8');
console.log("Fixed prosurvey.html");
