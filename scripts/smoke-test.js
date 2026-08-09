const fs=require('fs');
const cp=require('child_process');
const assert=require('assert');

const jsFiles=['app.js','infinite-replay.js','api/checkout.js','api/billing-status.js','api/subscription-status.js','api/practice.js'];
for(const file of jsFiles){cp.execFileSync(process.execPath,['--check',file],{stdio:'pipe'});}

const checkout=fs.readFileSync('api/checkout.js','utf8');
assert(checkout.includes("metadata[tier]','pro"),'checkout must tag Pro tier');
assert(checkout.includes("fresh-packs-unlimited"),'checkout must tag Fresh Pack entitlement');
assert(checkout.includes("https://beatai.games"),'checkout must return to production domain by default');

const status=fs.readFileSync('api/billing-status.js','utf8');
assert(status.includes("meta.app==='beat-ai'"),'billing verification must validate Beat AI app metadata');
assert(status.includes("meta.tier==='pro'"),'billing verification must validate Pro tier');

const practice=fs.readFileSync('api/practice.js','utf8');
assert(practice.includes('requireFresh'),'practice API must support strict fresh generation');
assert(practice.includes('uniqueAgainst'),'practice API must reject exact repeats');

const replay=fs.readFileSync('infinite-replay.js','utf8');
assert(replay.includes('MAX_HISTORY=2000'),'client must retain long question history');
assert(replay.includes('requireFresh:true'),'Fresh Packs must request strict no-repeat generation');
assert(replay.includes('battleHud'),'battle HUD must be present');
assert(replay.includes('power5050'),'50/50 power-up must be present');
assert(replay.includes('powerShield'),'shield power-up must be present');
assert(replay.includes('powerDouble'),'double-strike power-up must be present');

console.log('Beat AI smoke tests passed.');
