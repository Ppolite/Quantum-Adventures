/* Pack and entitlement services. Combat lives exclusively in battle-engine.js. */
window.BeatAIPacks=(()=>{
  'use strict';
  const recentKey='beatAIRecentQuestionsV2',legacyKey='beatAIRecentQuestions';
  const FREE_PACK_LIMIT=3,FREE_PACK_ROUNDS=15,MAX_HISTORY=2000,AVOID_WINDOW=300;
  const memory=new Map();
  function read(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'null')??fallback;}catch{return memory.get(key)??fallback;}}
  function write(key,value){memory.set(key,value);try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
  function history(){const current=read(recentKey,[]);if(Array.isArray(current)&&current.length)return current.filter(x=>typeof x==='string');const old=read(legacyKey,[]);if(!Array.isArray(old))return [];const migrated=[...new Set(old.filter(x=>typeof x==='string'))].slice(0,MAX_HISTORY);if(migrated.length)write(recentKey,migrated);return migrated;}
  function remember(list){const own=new Set();const merged=[...list.map(x=>typeof x==='string'?x:x.q),...history()].filter(q=>{const key=BeatAIQuestions.canon(q);if(!key||own.has(key))return false;own.add(key);return true;}).slice(0,MAX_HISTORY);write(recentKey,merged);}
  function used(){return Math.max(0,Math.min(FREE_PACK_LIMIT,Number(read('beatAIFreePacksUsed',0))||0));}
  function left(){return FREE_PACK_LIMIT-used();}
  function consume(){write('beatAIFreePacksUsed',Math.min(FREE_PACK_LIMIT,used()+1));}
  function difficulty(){try{const p=profile(),values=Object.values(p.cats||{}),played=values.reduce((n,v)=>n+(v.total||0),0),right=values.reduce((n,v)=>n+(v.right||0),0);return Math.max(1,Math.min(5,2+Math.floor(((p.rating||1000)-1000)/250)+(played>10&&right/played>.8?1:0)));}catch{return 2;}}
  async function fetchFresh(mode,{signal,avoid=[]}={}){
    const seed=`${mode}-${Date.now()}-${window.crypto?.randomUUID?.()||Math.random()}`,recent=[...avoid,...history()];
    for(let attempt=1;attempt<=3;attempt++){
      const r=await fetch('/api/practice',{method:'POST',headers:{'Content-Type':'application/json'},signal,body:JSON.stringify({seed:`${seed}-${attempt}`,difficulty:difficulty(),avoid:recent.slice(0,AVOID_WINDOW),requireFresh:true})});
      const d=await r.json();if(!r.ok)throw new Error(d.error||'The pack generator is unavailable.');
      if(!Array.isArray(d.challenges)||d.challenges.length!==5||!d.challenges.every(BeatAIQuestions.valid))throw new Error('The generator returned an invalid pack. No pack was charged.');
      const seen=new Set(recent.map(BeatAIQuestions.canon)),own=new Set();
      if(d.challenges.every(c=>{const k=BeatAIQuestions.canon(c.q);if(seen.has(k)||own.has(k))return false;own.add(k);return true;}))return {challenges:d.challenges,source:d.source};
    }
    throw new Error('The generator repeated a question. No pack was charged.');
  }
  async function buildPack(parts,prefix,{signal,onProgress}={}){
    const challenges=[],sources=[];
    for(let i=0;i<parts;i++){if(signal?.aborted)throw new DOMException('Cancelled','AbortError');onProgress?.(i,parts);const set=await fetchFresh(`${prefix}-${i+1}`,{signal,avoid:challenges.map(c=>c.q)});challenges.push(...set.challenges);sources.push(set.source);}
    return {challenges,source:sources.every(s=>s==='generated')?'generated':'mixed'};
  }
  async function syncProEntitlement(){
    const b=billing();if(b.tier!=='pro'||!b.subscriptionId)return;
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
    try{const r=await fetch('/api/subscription-status?subscription_id='+encodeURIComponent(b.subscriptionId),{cache:'no-store',signal:controller.signal});const d=await r.json();if(!r.ok)return;
      if(d.active)setBilling({...b,tier:'pro',status:d.status||b.status,customerId:d.customerId||b.customerId,subscriptionId:d.subscriptionId||b.subscriptionId,entitlement:'fresh-packs-unlimited',verifiedAt:Date.now()});
      else setBilling({tier:'free',customerId:b.customerId||'',subscriptionId:b.subscriptionId||'',status:d.status||'inactive'});
    }catch{/* Network failure must not revoke a purchase. */}finally{clearTimeout(timeout);}
  }
  return {history,remember,used,left,consume,difficulty,fetchFresh,buildPack,syncProEntitlement,read,write,limit:FREE_PACK_LIMIT,rounds:FREE_PACK_ROUNDS};
})();
window.BeatAIFreePacks=window.BeatAIPacks;
