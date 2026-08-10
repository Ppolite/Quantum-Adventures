const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'crazygames-build');
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(out,{recursive:true});
const copy=(src,dest)=>{const a=path.join(root,src),b=path.join(out,dest||src);if(fs.existsSync(a)){fs.mkdirSync(path.dirname(b),{recursive:true});fs.copyFileSync(a,b)}};
['styles.css','social.css','app.js','infinite-replay.js','teams.js','social.js','og-beat-ai.png'].forEach(f=>copy(f));
copy('crazygames/api-adapter.js','api-adapter.js');
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
html=html.replaceAll('href="/styles.css"','href="styles.css"').replaceAll('href="/social.css"','href="social.css"')
  .replaceAll('src="/app.js"','src="app.js"').replaceAll('src="/infinite-replay.js"','src="infinite-replay.js"')
  .replaceAll('src="/teams.js"','src="teams.js"').replaceAll('src="/social.js"','src="social.js"')
  .replace('<script>\n  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };\n</script>\n<script defer src="/_vercel/insights/script.js"></script>','')
  .replace('<script src="app.js"></script>','<script src="api-adapter.js"></script><script src="app.js"></script>');
fs.writeFileSync(path.join(out,'index.html'),html);
const casino=path.join(root,'casino');if(fs.existsSync(casino))fs.cpSync(casino,path.join(out,'casino'),{recursive:true});
console.log('CrazyGames build ready:',fs.readdirSync(out));
