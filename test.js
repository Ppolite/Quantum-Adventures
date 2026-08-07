const fs=require('fs');
const assert=require('assert');
const html=fs.readFileSync('index.html','utf8');
const daily=fs.readFileSync('api/daily.js','utf8');
const scores=fs.readFileSync('api/scores.js','utf8');

const lower=html.toLowerCase();
for(const token of ['arena rating','weekly boss','lightning','impossible question','achievements','mystery crate','ai replay','challenge a friend','live human feed']){
  assert(lower.includes(token),`missing engagement feature: ${token}`);
}
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert(scripts.length,'inline game script missing');
for(const [,script] of scripts)new Function(script);
assert(daily.includes("category:'Logic'")||daily.includes('category'), 'daily API lacks categories');
assert(daily.includes('aiTake'),'daily API lacks AI replay field');
new Function('require','module','exports',daily);
new Function('require','module','exports',scores);
console.log('Beat AI smoke tests passed');
