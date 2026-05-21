const fs = require('fs');
const path = require('path');

const publicDir = 'c:/Users/gurup/Downloads/Agritech-main/Agritech-main/artifacts/agrihub-monolith/public';

const newDict = `const dict = {
      EN: {
        navHome: "Home", navMarket: "Marketplace", navFeed: "Social Feed", navLand: "Real Estate", navAnalytics: "Profile", navLearn: "Academy", navSmarthome: "Smart Home",
        langBtn: "தமிழ்"
      },
      'தமிழ்': {
        navHome: "முகப்பு", navMarket: "சந்தை", navFeed: "சமூக ஊடகம்", navLand: "ரியல் எஸ்டேட்", navAnalytics: "விவரங்கள்", navLearn: "பயிற்சி", navSmarthome: "ஸ்மார்ட் ஹோம்",
        langBtn: "English"
      }
    };`;

const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

files.forEach(file => {
  const filePath = path.join(publicDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace dict block
  const dictRegex = /const dict = \{[\s\S]*?\};\s*$/m;
  
  // Also we can just replace the specific block more safely
  const startIdx = content.indexOf('const dict = {');
  if (startIdx !== -1) {
    const endIdx = content.indexOf('};', startIdx) + 2;
    if (endIdx > startIdx) {
      content = content.substring(0, startIdx) + newDict + content.substring(endIdx);
      
      // Also force EN as default instead of the broken tamil
      content = content.replace(/let currentLang = localStorage\.getItem\("lang"\) \|\| ".*?";/, 'let currentLang = localStorage.getItem("lang") || "EN";');
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed dictionary in ${file}`);
    }
  }
});
