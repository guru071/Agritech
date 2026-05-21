const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/gurup/Downloads/Agritech-main/Agritech-main/artifacts/agrihub-monolith/public';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

for (const file of files) {
  const p = path.join(dir, file);
  let c = fs.readFileSync(p, 'utf8');
  let orig = c;

  c = c.replace(/navSmarthome:\s*"Smart Home"/g, 'navSmarthome: "IoT Farm"');
  c = c.replace(/navSmarthome:\s*"ஸ்மார்ட் ஹோம்"/g, 'navSmarthome: "IoT பண்ணை"');

  if (file === 'smart-home.html') {
    c = c.replace(/Smart Farm Home/g, 'IoT Farm');
    c = c.replace(/Smart Farm Hub/g, 'IoT Farm Hub');
    c = c.replace(/Smart Home Dashboard/g, 'IoT Farm Dashboard');
    c = c.replace(/Smart Ecosystem/g, 'IoT Ecosystem');
  }

  if (c !== orig) {
    fs.writeFileSync(p, c);
    console.log('Updated ' + file);
  }
}
