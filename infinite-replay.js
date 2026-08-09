(()=>{
  const recentKey='beatAIRecentQuestionsV2';
  const legacyRecentKey='beatAIRecentQuestions';
  const freePackKey='beatAIFreePacksUsed';
  const FREE_PACK_LIMIT=3;
  const FREE_PACK_ROUNDS=15;
  const MAX_HISTORY=2000;
  const AVOID_WINDOW=300;
  const originalStart=window.start;
  const originalAnswer=window.answer;
  const originalRender=window.render;
  if(typeof originalStart!=='function') return;

  const battle={human:100,ai:100,combo:0,bestCombo:0,shield:false,double:false,used:{fifty:false,shield:false,double:false},mode:'practice'};

  function canon(q){return String(q||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ')}
  function recent(){
    try{
      const current=JSON.parse(localStorage.getItem(recentKey)||'[]');
      if(Array.isArray(current)&&current.length)return current;
      const legacy=JSON.parse(localStorage.getItem(legacyRecentKey)||'[]');
      if(Array.isArray(legacy)&&legacy.length){const migrated=[...new Set(legacy.filter(Boolean))].slice(0,MAX_HISTORY);localStorage.setItem(recentKey,JSON.stringify(migrated));return migrated}
    }catch{}
    return [];
  }
  function remember(list){
    const old=recent();
    const seen=new Set();
    const merged=[...list.map(x=>x.q),...old].filter(Boolean).filter(q=>{const k=canon(q);if(!k||seen.has(k))return false;seen.add(k);return true}).slice(0,MAX_HISTORY);
    localStorage.setItem(recentKey,JSON.stringify(merged));
  }
  function hasSeen(q){const k=canon(q);return !!k&&recent().some(x=>canon(x)===k)}
  function freePacksUsed(){return Math.max(0,Math.min(FREE_PACK_LIMIT,Number(localStorage.getItem(freePackKey)||0)||0))}
  function freePacksLeft(){return Math.max(0,FREE_PACK_LIMIT-freePacksUsed())}
  function consumeFreePack(){const used=Math.min(FREE_PACK_LIMIT,freePacksUsed()+1);localStorage.setItem(freePackKey,String(used));updateFreePackUI();return FREE_PACK_LIMIT-used}
  function isPro(){try{return typeof billing==='function'&&billing().tier==='pro'}catch{return false}}
  function launchPro(){
    if(typeof beginCheckout==='function')return beginCheckout();
    const proBtn=document.getElementById('proBtn');
    if(proBtn)return proBtn.click();
    toast?.('Beat AI Pro unlocks unlimited fresh 15-question packs ✦');
  }

  async function syncProEntitlement(){
    try{
      if(typeof billing!=='function')return;
      const b=billing();
      if(b.tier!=='pro'||!b.subscriptionId)return;
      const r=await fetch('/api/subscription-status?subscription_id='+encodeURIComponent(b.subscriptionId),{cache:'no-store'});
      const d=await r.json();
      if(!r.ok)return;
      if(d.active){
        if(typeof setBilling==='function')setBilling({...b,tier:'pro',status:d.status||b.status,customerId:d.customerId||b.customerId,subscriptionId:d.subscriptionId||b.subscriptionId,entitlement:'fresh-packs-unlimited',verifiedAt:Date.now()});
      }else{
        if(typeof setBilling==='function')setBilling({tier:'free',customerId:b.customerId||'',subscriptionId:b.subscriptionId||'',status:d.status||'inactive'});
        updateFreePackUI();
      }
    }catch{}
  }

  function updateFreePackUI(){
    const practice=document.getElementById('practiceBtn');
    const hero=document.getElementById('play');
    const status=document.getElementById('status');
    const pro=isPro();
    const left=freePacksLeft();
    if(practice){
      const small=practice.querySelector('small');
      practice.classList.toggle('locked',!pro&&left===0);
      if(small)small.textContent=pro?'PRO · Unlimited fresh 15-question AI packs · no exact repeats on this profile.':left>0?`FREE · ${left} pack${left===1?'':'s'} left · 15 fresh questions each.`:'PRO · Your 3 free packs are used.';
    }
    if(hero){
      if(pro){
        hero.textContent='PLAY A FRESH 15 →';
        hero.onclick=()=>infiniteStart('practice');
      }else if(left>0){
        hero.textContent="PLAY TODAY'S 15 →";
        hero.onclick=()=>infiniteStart('practice');
      }else{
        hero.textContent='GO PRO — UNLOCK UNLIMITED →';
        hero.onclick=launchPro;
      }
    }
    if(status){
      status.textContent=pro?'Pro active · unlimited fresh 15-question packs unlocked.':left>0?`${left} free 15-question pack${left===1?'':'s'} remaining.`:'Free packs complete. Go Pro for unlimited 15-question packs.';
    }
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
    let lastError=null;
    for(let attempt=1;attempt<=3;attempt++){
      try{
        const history=recent();
        const r=await fetch('/api/practice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({seed:`${seed}-${attempt}`,difficulty:difficulty(),avoid:history.slice(0,AVOID_WINDOW),requireFresh:true})});
        const d=await r.json();
        if(!r.ok)throw new Error(d.error||'Fresh pack unavailable');
        if(!Array.isArray(d.challenges)||d.challenges.length!==5)throw new Error('Fresh pack malformed');
        const own=new Set();
        const trulyFresh=d.challenges.every(c=>{const k=canon(c.q);if(!k||hasSeen(c.q)||own.has(k))return false;own.add(k);return true});
        if(!trulyFresh)throw new Error('AI attempted a repeated question; regenerating');
        remember(d.challenges);
        return d.challenges;
      }catch(e){lastError=e}
    }
    throw lastError||new Error('Fresh pack unavailable');
  }

  async function buildPack(parts,prefix){const sets=[];for(let i=0;i<parts;i++)sets.push(await fetchFresh(`${prefix}-${i+1}`));return sets.flat()}

  function injectBattleUI(){
    const game=document.getElementById('game');
    if(!game||document.getElementById('battleHud'))return;
    const style=document.createElement('style');
    style.id='battleEnhancementStyles';
    style.textContent=`
      #battleHud{margin:10px 0 14px;padding:12px;border:1px solid rgba(82,214,255,.24);border-radius:18px;background:linear-gradient(180deg,rgba(17,23,38,.96),rgba(8,11,18,.96));box-shadow:0 0 28px rgba(75,91,255,.12)}
      .battle-top{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center}.battle-side{display:grid;gap:5px}.battle-side.ai{text-align:right}.battle-label{font-size:11px;letter-spacing:.13em;font-weight:900;opacity:.82}.battle-meter{height:9px;border-radius:999px;background:#171c2a;overflow:hidden}.battle-meter span{display:block;height:100%;width:100%;background:linear-gradient(90deg,#4de6ff,#7c5cff);transition:width .25s ease}.battle-side.ai .battle-meter span{margin-left:auto;background:linear-gradient(90deg,#ff3d79,#a855f7)}.battle-vs{font-weight:1000;font-size:13px;opacity:.72}.battle-meta{display:flex;justify-content:space-between;gap:10px;margin-top:9px;font-size:12px;font-weight:850}.battle-meta b{color:#7de7ff}.power-row{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}.power{border:1px solid rgba(125,231,255,.22);background:#111827;color:#fff;border-radius:12px;padding:9px 7px;font-weight:850;font-size:11px;cursor:pointer}.power[disabled]{opacity:.35;cursor:not-allowed}.power.active{box-shadow:0 0 18px rgba(124,92,255,.28);border-color:#8b5cf6}.combo-pop{animation:comboPop .25s ease}@keyframes comboPop{50%{transform:scale(1.08)}}
    `;
    document.head.appendChild(style);
    const hud=document.createElement('div');
    hud.id='battleHud';
    hud.innerHTML=`<div class="battle-top"><div class="battle-side"><div class="battle-label">🧠 HUMAN <span id="humanHpText">100</span></div><div class="battle-meter"><span id="humanHp"></span></div></div><div class="battle-vs">VS</div><div class="battle-side ai"><div class="battle-label"><span id="aiHpText">100</span> AI 🤖</div><div class="battle-meter"><span id="aiHp"></span></div></div></div><div class="battle-meta"><span id="comboText">COMBO ×0</span><span id="aiLevelText">AI LEVEL ${difficulty()}</span><span id="categoryText">WILD CARD</span></div>`;
    const bubble=game.querySelector('.ai-bubble');
    game.insertBefore(hud,bubble||game.firstChild);
    const power=document.createElement('div');
    power.className='power-row';
    power.id='powerRow';
    power.innerHTML=`<button class="power" id="power5050">⚡ 50/50</button><button class="power" id="powerShield">🛡 SHIELD</button><button class="power" id="powerDouble">💥 DOUBLE</button>`;
    const card=game.querySelector('.card');
    const confidence=card?.querySelector('.confidence');
    if(card)card.insertBefore(power,confidence||card.firstChild);
    document.getElementById('power5050')?.addEventListener('click',use5050);
    document.getElementById('powerShield')?.addEventListener('click',useShield);
    document.getElementById('powerDouble')?.addEventListener('click',useDouble);
  }

  function resetBattle(mode){
    battle.human=100;
    battle.ai=mode==='boss'?160:100;
    battle.combo=0;
    battle.bestCombo=0;
    battle.shield=false;
    battle.double=false;
    battle.used={fifty:false,shield:false,double:false};
    battle.mode=mode;
    updateBattleUI();
    refreshPowerUI();
  }

  function currentChallenge(){try{return daily?.[state?.round]||null}catch{return null}}
  function use5050(){
    if(battle.used.fifty)return;
    const c=currentChallenge();if(!c)return;
    const wrong=[...document.querySelectorAll('.answer')].filter((b,i)=>i!==c.answer&&!b.disabled);
    wrong.slice(0,2).forEach(b=>{b.style.opacity='.18';b.disabled=true});
    battle.used.fifty=true;refreshPowerUI();toast?.('50/50 deployed ⚡')
  }
  function useShield(){if(battle.used.shield)return;battle.used.shield=true;battle.shield=true;refreshPowerUI();toast?.('Shield armed — your next miss does no battle damage 🛡')}
  function useDouble(){if(battle.used.double)return;battle.used.double=true;battle.double=true;refreshPowerUI();toast?.('Double Strike armed — next correct answer hits twice 💥')}
  function refreshPowerUI(){
    const f=document.getElementById('power5050'),s=document.getElementById('powerShield'),d=document.getElementById('powerDouble');
    if(f)f.disabled=battle.used.fifty;
    if(s){s.disabled=battle.used.shield;s.classList.toggle('active',battle.shield)}
    if(d){d.disabled=battle.used.double;d.classList.toggle('active',battle.double)}
  }
  function updateBattleUI(){
    injectBattleUI();
    const humanMax=100,aiMax=battle.mode==='boss'?160:100;
    const h=document.getElementById('humanHp'),a=document.getElementById('aiHp');
    if(h)h.style.width=`${Math.max(0,Math.min(100,battle.human/humanMax*100))}%`;
    if(a)a.style.width=`${Math.max(0,Math.min(100,battle.ai/aiMax*100))}%`;
    const ht=document.getElementById('humanHpText'),at=document.getElementById('aiHpText');if(ht)ht.textContent=Math.max(0,battle.human);if(at)at.textContent=Math.max(0,battle.ai);
    const combo=document.getElementById('comboText');if(combo){combo.textContent=`COMBO ×${battle.combo}`;combo.classList.remove('combo-pop');void combo.offsetWidth;combo.classList.add('combo-pop')}
    const level=document.getElementById('aiLevelText');if(level)level.textContent=`AI LEVEL ${difficulty()}${battle.mode==='boss'?' · BOSS':''}`;
    const cat=document.getElementById('categoryText');const c=currentChallenge();if(cat)cat.textContent=String(c?.category||'WILD CARD').toUpperCase();
    refreshPowerUI();
  }

  function afterAnswer(i,ok){
    if(ok){
      battle.combo++;
      battle.bestCombo=Math.max(battle.bestCombo,battle.combo);
      const multiplier=battle.double?2:1;
      const damage=(7+Math.min(5,battle.combo)*2)*multiplier;
      battle.ai=Math.max(0,battle.ai-damage);
      if(battle.double){battle.double=false;try{state.score+=100;document.getElementById('points').textContent=`${Math.max(0,Math.round(state.score))} pts`}catch{}toast?.('DOUBLE STRIKE! 💥')}
      if(battle.combo>=3){try{const bonus=25*(battle.combo-2);state.score+=bonus;document.getElementById('points').textContent=`${Math.max(0,Math.round(state.score))} pts`}catch{}}
      const taunt=document.getElementById('taunt');if(taunt&&battle.combo>=4)taunt.textContent='Okay. You are becoming a statistical problem.';
    }else{
      battle.combo=0;
      if(battle.shield){battle.shield=false;toast?.('Shield absorbed the hit 🛡')}
      else battle.human=Math.max(0,battle.human-(battle.mode==='boss'?14:11));
      battle.double=false;
      const taunt=document.getElementById('taunt');if(taunt)taunt.textContent=battle.human<=30?'Human systems approaching critical.':'Pattern detected: human overconfidence.';
    }
    updateBattleUI();
  }

  if(typeof originalAnswer==='function'){
    window.answer=function(i){
      const c=currentChallenge();
      const alreadyAnswered=document.getElementById('next')?.style.display==='block';
      const ok=!alreadyAnswered&&!!c&&i===c.answer;
      const out=originalAnswer.call(this,i);
      if(!alreadyAnswered&&c)afterAnswer(i,ok);
      return out;
    };
  }
  if(typeof originalRender==='function'){
    window.render=function(){const out=originalRender.apply(this,arguments);setTimeout(updateBattleUI,0);return out};
  }

  async function infiniteStart(mode='practice'){
    const pro=isPro();
    if(mode==='practice'&&!pro&&freePacksLeft()===0){
      toast?.('Your 3 free packs are complete — unlock unlimited 15-question packs with Pro ✦');
      return launchPro();
    }
    if(['lightning','boss'].includes(mode)&&!pro){
      return typeof requirePro==='function'?requirePro(()=>infiniteStart(mode)):originalStart(mode);
    }
    if(!['practice','lightning','boss'].includes(mode))return originalStart(mode);
    try{
      toast?.(mode==='boss'?'Summoning this week’s boss…':mode==='practice'?'Generating 15 questions you have not seen before…':'Generating a fresh challenge pack…');
      if(mode==='boss') daily=await buildPack(2,'boss');
      else if(mode==='practice') daily=await buildPack(3,pro?'pro-pack':'free-pack');
      else daily=await fetchFresh(mode);
      if(mode==='practice'&&!pro){
        const left=consumeFreePack();
        toast?.(left?`${left} free 15-question pack${left===1?'':'s'} left`:'Free pack #3 complete — Go Pro for unlimited 15-question packs ✦');
      }
      clearInterval(timer);
      state={round:0,correct:0,score:0,marks:[],mode,start:Date.now(),cats:{},roundLimit:mode==='practice'?FREE_PACK_ROUNDS:daily.length};
      confidence=1;
      resetBattle(mode);
      window.totalRounds=()=>state.roundLimit||daily.length||5;
      show('game');
      render();
    }catch(e){
      toast?.(e?.message||'Fresh AI generator is temporarily unavailable — no repeated pack was served.');
      updateFreePackUI();
      return;
    }
  }

  window.start=infiniteStart;
  window.BeatAIFreePacks={limit:FREE_PACK_LIMIT,rounds:FREE_PACK_ROUNDS,used:freePacksUsed,left:freePacksLeft,history:recent,refresh:updateFreePackUI};
  window.BeatAIBattle={state:battle,refresh:updateBattleUI};
  const practice=document.getElementById('practiceBtn');
  const lightning=document.getElementById('lightningBtn');
  const boss=document.getElementById('bossBtn');
  const again=document.getElementById('again');
  if(practice)practice.onclick=()=>infiniteStart('practice');
  if(lightning)lightning.onclick=()=>infiniteStart('lightning');
  if(boss)boss.onclick=()=>infiniteStart('boss');
  if(again)again.onclick=()=>isPro()||freePacksLeft()>0?infiniteStart('practice'):launchPro();
  injectBattleUI();
  updateFreePackUI();
  syncProEntitlement().finally(updateFreePackUI);
})();
