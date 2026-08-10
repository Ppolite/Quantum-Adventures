const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'dist');

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const rootFiles = [
  'index.html',
  'styles.css',
  'social.css',
  'app.js',
  'infinite-replay.js',
  'social.js',
  'teams.js',
  'team-hotfix.js',
  'og-beat-ai.png'
];

for (const file of rootFiles) {
  const src = path.join(root, file);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(out, file));
}

for (const dir of ['public', 'casino', 'beat-ai']) {
  const src = path.join(root, dir);
  const dest = path.join(out, dir);
  if (fs.existsSync(src)) fs.cpSync(src, dest, { recursive: true });
}

const indexPath = path.join(out, 'index.html');
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');
  if (!html.includes('/team-hotfix.js')) {
    html = html.replace('</body>', '<script src="/team-hotfix.js"></script></body>');
    fs.writeFileSync(indexPath, html);
  }
}

console.log('Beat AI static build complete:', fs.readdirSync(out));
