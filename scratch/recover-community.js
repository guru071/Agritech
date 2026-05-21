const fs = require('fs');

const lines = fs.readFileSync('C:/Users/gurup/.gemini/antigravity/brain/ae352a75-efdf-483a-acf9-55e5570e7783/.system_generated/logs/transcript.jsonl', 'utf8').split('\n');

for (const line of lines) {
  if (!line) continue;
  try {
    const obj = JSON.parse(line);
    if (obj.type === 'VIEW_FILE' && obj.content && obj.content.includes('community.html')) {
      let content = obj.content;
      const marker = 'leading space.\n';
      const idx = content.indexOf(marker);
      if (idx !== -1) {
        let text = content.substring(idx + marker.length);
        text = text.replace(/The above content shows the entire.*/g, '');
        text = text.replace(/The above content does NOT show the entire.*/g, '');
        // Replace line numbers like "1: "
        text = text.replace(/^[0-9]+: /gm, '');
        fs.writeFileSync('c:/Users/gurup/Downloads/Agritech-main/Agritech-main/artifacts/agrihub-monolith/public/community.html', text);
        console.log('Successfully restored community.html!');
        break;
      }
    }
  } catch (e) {
    console.error(e);
  }
}
