(()=>{
  const recentKey='beatAIRecentQuestions';
  const originalStart=window.start;
  if(typeof originalStart!=='function') return;

  function recent(){try{return JSON.parse(localStorage.getItem(recentKey)||'[]')}catch{return[]}}
  function remember(list){const merged=[...list.map(x=>x.q),...recent()].filter(Boolean);const unique=[];for(const q of merged){if(!unique.includes(q))unique.push(q);if(unique.length>=30)break}localStorage.setItem(recentKey,JSON.stringify(unique))}
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

  async function infiniteStart(mode='practice'){
    if(['practice','lightning','boss'].includes(mode)&&typeof billing==='function'&&billing().tier!=='pro'){
      return typeof requirePro==='function'?requirePro(()=>infiniteStart(mode)):originalStart(mode);
    }
    if(!['practice','lightning','boss'].includes(mode))return originalStart(mode);
    try{
      toast?.(mode==='boss'?'Summoning this week’s boss…':'Generating a fresh challenge pack…');
      if(mode==='boss'){
        const first=await fetchFresh('boss-a');
        const second=await fetchFresh('boss-b');
        daily=[...first,...second];
      }else{
        daily=await fetchFresh(mode);
      }
      clearInterval(timer);
      state={round:0,correct:0,score:0,marks:[],mode,start:Date.now(),cats:{}};
      confidence=1;
      show('game');
      render();
    }catch(e){
      toast?.('AI generator unavailable — using backup pack');
      return originalStart(mode);
    }
  }

  window.start=infiniteStart;
  const practice=document.getElementById('practiceBtn');
  const lightning=document.getElementById('lightningBtn');
  const boss=document.getElementById('bossBtn');
  const again=document.getElementById('again');
  if(practice)practice.onclick=()=>infiniteStart('practice');
  if(lightning)lightning.onclick=()=>infiniteStart('lightning');
  if(boss)boss.onclick=()=>infiniteStart('boss');
  if(again)again.onclick=()=>infiniteStart('practice');
})();
