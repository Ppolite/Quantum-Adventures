(()=>{
  const recentKey='beatAIRecentQuestions';
  const freePackKey='beatAIFreePacksUsed';
  const FREE_PACK_LIMIT=3;
  const FREE_PACK_ROUNDS=15;
  const originalStart=window.start;
  if(typeof originalStart!=='function') return;

  function recent(){try{return JSON.parse(localStorage.getItem(recentKey)||'[]')}catch{return[]}}
  function remember(list){const merged=[...list.map(x=>x.q),...recent()].filter(Boolean);const unique=[];for(const q of merged){if(!unique.includes(q))unique.push(q);if(unique.length>=60)break}localStorage.setItem(recentKey,JSON.stringify(unique))}
  function freePacksUsed(){return Math.max(0,Math.min(FREE_PACK_LIMIT,Number(localStorage.getItem(freePackKey)||0)||0))}
  function freePacksLeft(){return Math.max(0,FREE_PACK_LIMIT-freePacksUsed())}
  function consumeFreePack(){const used=Math.min(FREE_PACK_LIMIT,freePacksUsed()+1);localStorage.setItem(freePackKey,String(used));updateFreePackUI();return FREE_PACK_LIMIT-used}
  function isPro(){try{return typeof billing==='function'&&billing().tier==='pro'}catch{return false}}
  function updateFreePackUI(){
    const practice=document.getElementById('practiceBtn');
    if(!practice)return;
    const small=practice.querySelector('small');
    if(isPro()){
      practice.classList.remove('locked');
      if(small)small.textContent='PRO · New AI-generated questions every run.';
      return;
    }
    const left=freePacksLeft();
    practice.classList.toggle('locked',left===0);
    if(small)small.textContent=left>0?`FREE · ${left} pack${left===1?'':'s'} left · 15 fresh questions each.`:'PRO · Your 3 free packs are used.';
  }
  function difficulty(){
    try{
      const p=profile();
      const rating=p.rating||1000;
      const played=Object.values(p.cats||{}).reduce((a,v)=>a+(v.total||0),0);
      const right=Object.values(p.cats||{}).reduce((a,v)=>a+(v.right||0),0);
      const acc=played?right/played:.6;
      const ratingBand=rating>=1500?5:rating>=1300?4:rating>=1100?3:rating>=900?2:1;
      return Math.max(1,Math.min(5,Math.round((ratingBand+(acc>.8?1:acc<.45?-1:0)))))
    }catch{return 2}
  }
  async function fetchFresh(mode){
    const seed=`${mode}-${Date.now()}-${crypto?.randomUUID?.()||Math.random()}`;
    const r=await fetch('/api/practice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({seed,difficulty:difficulty(),avoid:recent()})});
    const d=await r.json();
    if(!r.ok||!Array.isArray(d.challenges)||d.challenges.length!==5)throw new Error(d.error||'Fresh pack unavailable');
    remember(d.challenges);
    return d.challenges;
  }
  async function buildPack(parts,prefix){const sets=[];for(let i=0;i<parts;i++)sets.push(await fetchFresh(`${prefix}-${i+1}`));return sets.flat()}

  async function infiniteStart(mode='practice'){
    const pro=isPro();
    if(mode==='practice'&&!pro&&freePacksLeft()===0){
      toast?.('Your 3 free packs are used — unlock infinite practice with Pro ✦');
      return typeof requirePro==='function'?requirePro(()=>infiniteStart(mode)):originalStart(mode);
    }
    if(['lightning','boss'].includes(mode)&&!pro){
      return typeof requirePro==='function'?requirePro(()=>infiniteStart(mode)):originalStart(mode);
    }
    if(!['practice','lightning','boss'].includes(mode))return originalStart(mode);
    try{
      toast?.(mode==='boss'?'Summoning this week’s boss…':mode==='practice'&&!pro?'Generating your 15-question free pack…':'Generating a fresh challenge pack…');
      if(mode==='boss') daily=await buildPack(2,'boss');
      else if(mode==='practice'&&!pro) daily=await buildPack(3,'free-pack');
      else daily=await fetchFresh(mode);
      if(mode==='practice'&&!pro){
        const left=consumeFreePack();
        toast?.(left?`${left} free 15-question pack${left===1?'':'s'} left`:'That was free pack #3 — Pro unlocks infinite play ✦');
      }
      clearInterval(timer);
      state={round:0,correct:0,score:0,marks:[],mode,start:Date.now(),cats:{},roundLimit:mode==='practice'&&!pro?FREE_PACK_ROUNDS:daily.length};
      confidence=1;
      window.totalRounds=()=>state.roundLimit||daily.length||5;
      show('game');
      render();
    }catch(e){
      toast?.('AI generator unavailable — using backup pack');
      return originalStart(mode);
    }
  }

  window.start=infiniteStart;
  window.BeatAIFreePacks={limit:FREE_PACK_LIMIT,rounds:FREE_PACK_ROUNDS,used:freePacksUsed,left:freePacksLeft,refresh:updateFreePackUI};
  const practice=document.getElementById('practiceBtn');
  const lightning=document.getElementById('lightningBtn');
  const boss=document.getElementById('bossBtn');
  const again=document.getElementById('again');
  if(practice)practice.onclick=()=>infiniteStart('practice');
  if(lightning)lightning.onclick=()=>infiniteStart('lightning');
  if(boss)boss.onclick=()=>infiniteStart('boss');
  if(again)again.onclick=()=>infiniteStart('practice');
  updateFreePackUI();
})();