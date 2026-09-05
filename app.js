'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const Engine=BeatAIEngine,Rivals=BeatAIRivals,Packs=BeatAIPacks,Questions=BeatAIQuestions,Audio=BeatAIAudio;
const dayKey=()=>new Date().toISOString().slice(0,10),today=dayKey();
let daily=[],dailyPool=[],dailySource='archive',timer=null,transition=null,loadController=null,launchId=0;
let selectedRival=Rivals.list[0],remainingMs=0,deadline=0,paused=false,readHeld=false,lastTick=99;
let state={round:0,correct:0,aiCorrect:0,humanRounds:0,aiRounds:0,score:0,marks:[],mode:'arena',start:0,cats:{},botPicks:[],battle:null};
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function profile(){return Engine.normalizeProfile(Packs.read('beatAIProfile',{}));}
function saveProfile(p){if(!Packs.write('beatAIProfile',p))$('#storageNotice').hidden=false;}
function billing(){const b=Packs.read('beatAIBilling',{tier:'free'});return b&&typeof b==='object'?b:{tier:'free'};}
function setBilling(b){Packs.write('beatAIBilling',b);refreshBilling();}
function persona(){return state.battle?.rival||selectedRival;}
function hashSeed(value){let h=2166136261;for(const ch of String(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function getBotDecision(c,round=state.round){
  if(state.botPicks[round])return state.botPicks[round];
  const rival=persona(),seed=hashSeed(`${state.runId}|${round}|${c.q}|${rival.id}`),difficulty=state.battle?.difficulty||0;
  const accuracy=Math.min(.88,.57+difficulty*.045+(c.category===rival.specialty ? .08 : 0));
  const supplied=Number.isInteger(c.aiAnswer)&&c.aiAnswer>=0&&c.aiAnswer<4?c.aiAnswer:null;
  const wrong=[0,1,2,3].filter(i=>i!==c.answer),answer=supplied??((seed%1000)/1000<accuracy?c.answer:wrong[seed%wrong.length]);
  return state.botPicks[round]={answer,confidence:Math.max(51,Math.min(96,Number(c.aiConfidence)||54+seed%40))};
}
window.getBotDecision=getBotDecision;
function levelFor(xp){return Math.floor(xp/250)+1;}
function titleFor(xp){return xp>=5000?'Human Legend':xp>=1800?'Machine Breaker':xp>=500?'Rising Threat':'Human Challenger';}
function show(id){$$('.screen').forEach(x=>x.classList.toggle('active',x.id===id));document.body.dataset.screen=id;scrollTo(0,0);}
let toastTimer;
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3200);}
function acquisition(){return Packs.read('beatAIAcquisition',{});}
function captureAcquisition(){const q=new URLSearchParams(location.search),a=acquisition();for(const key of ['utm_source','utm_medium','utm_campaign','utm_content','fbclid'])if(q.get(key))a[key]=q.get(key).slice(0,180);Packs.write('beatAIAcquisition',a);}
function track(name,data={}){try{const a=acquisition();window.va?.('event',{name,data:{...data,source:a.utm_source||'direct',campaign:a.utm_campaign||'none'}});}catch{}}
window.beatTrack=track;

function available(r){return r.pro?billing().tier==='pro':profile().arenaWins>=r.unlock;}
function refresh(){
  const p=profile();$('#ratingTop').textContent=`LV ${levelFor(p.xp)}`;$('#titleBadge').textContent=titleFor(p.xp);$('#seasonText').textContent=`LEVEL ${levelFor(p.xp)}`;
  $('#homeXp').style.width=`${p.xp%250/2.5}%`;$('#homeXpLabel').textContent=`${250-p.xp%250} XP to next level`;
  $('#streak').textContent=p.streak;$('#wins').textContent=p.arenaWins;$('#winStreak').textContent=p.winStreak;$('#rating').textContent=p.rating;
  $('#feed').textContent=p.lastBattle?`${p.lastBattle.outcome==='win'?'You defeated':'You fell to'} ${p.lastBattle.rival} · ${p.lastBattle.correct}/${p.lastBattle.total} correct · ${p.lastBattle.combo} answer streak`:'Your first rival is waiting. Give it something to remember.';
  renderRivals();refreshBilling();renderSkills();renderAchievements();
}
function renderRivals(){
  $('#rivalRoster').innerHTML=Rivals.list.map((r,i)=>{const unlocked=available(r),selected=r.id===selectedRival.id;return `<button class="rival-choice ${selected?'selected':''} ${unlocked?'':'locked'}" data-rival="${r.id}" aria-pressed="${selected}" aria-label="${r.name}${unlocked?', select rival':r.pro?', Pro boss':`, unlock at ${r.unlock} wins`}" style="--rival:${r.color}">${Rivals.portrait(r.id)}<span class="rival-number">0${i+1}</span><b>${r.name}</b><small>${unlocked?(r.pro?'PRO BOSS':'READY TO FIGHT'):r.pro?'PRO BOSS':`${r.unlock} WINS TO UNLOCK`}</small></button>`;}).join('');
  $$('[data-rival]').forEach(button=>button.onclick=()=>selectRival(button.dataset.rival));
  const r=selectedRival;$('#heroPortrait').innerHTML=Rivals.portrait(r.id);$('#heroRivalName').textContent=r.name;$('#heroRivalTitle').textContent=r.title;
  $('#heroTaunt').textContent=Rivals.line(r,profile().rivals[r.id]?.plays?'rematch':'intro');
  $('#heroWeakness').textContent=r.weakness;$('#heroTempo').textContent=`${r.seconds}s`;document.documentElement.style.setProperty('--rival',r.color);
  $('#heroPlay').textContent=r.pro?'CHALLENGE OMNI  ↗':`FIGHT ${r.name}  ↗`;
  const next=Rivals.list.find(x=>!x.pro&&x.unlock>profile().arenaWins);$('#unlockNext').textContent=next?`${next.name} unlocks in ${next.unlock-profile().arenaWins} win${next.unlock-profile().arenaWins===1?'':'s'}`:'All arena rivals unlocked. Keep your streak alive.';
}
function selectRival(id){const r=Rivals.list.find(x=>x.id===id);if(!r)return;if(r.pro&&!available(r))return beginCheckout('boss-roster');if(!available(r))return toast(`${r.name} unlocks at ${r.unlock} arena wins. You have ${profile().arenaWins}.`);selectedRival=r;Packs.write('beatAISelectedRival',id);renderRivals();Audio.unlock();}
function refreshBilling(){
  const b=billing(),pro=b.tier==='pro';$('#proBtn').textContent=pro?'PRO ✓':'GET PRO';$('#proTitle').textContent=pro?'RESISTANCE. REINFORCED.':'TAKE ON THE WHOLE MACHINE.';
  $('#proCopy').textContent=pro?'Your existing BeatAI Pro subscription covers the arena and casino.':'Unlimited generated Fresh Packs. Lightning. OMNI boss battles. Casino Pro. One subscription.';
  $('#upgradeBtn').hidden=pro;$('#restoreBtn').hidden=pro;$('#manageBtn').hidden=!(pro&&b.customerId);$('#resultUpgradeBtn').hidden=pro;
  $('#practiceStatus').textContent=pro?'Unlimited with Pro':`${Packs.left()} of 3 free packs left`;
  $('#status').textContent=pro?'PRO ACTIVE · ALL MODES UNLOCKED':'FREE ARENA · NO SIGNUP · YOUR PROGRESS SAVES HERE';
  $$('[data-promode]').forEach(x=>x.classList.toggle('locked',!pro));
}
let checkoutPending=false;
function beginCheckout(surface='home'){
  if(billing().tier==='pro')return toast('BeatAI Pro is active. All modes are unlocked.');
  $('#proOfferContext').textContent='Your Pro membership unlocks unlimited generated Fresh Packs, Lightning, OMNI boss battles, and Casino Pro. The free arena stays free.';
  openModal('proOfferModal');track('pro_offer_viewed',{surface,plays:profile().plays});
}
async function createCheckout(){
  if(checkoutPending)return;checkoutPending=true;$('#confirmCheckoutBtn').disabled=true;$('#checkoutError').hidden=true;
  track('checkout_started',{surface:document.body.dataset.screen||'unknown',plays:profile().plays});
  try{const email=localValue('beatAIEmail');const r=await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})});const d=await r.json();if(!r.ok||!d.url)throw new Error(d.error||'Checkout unavailable');location.href=d.url;}
  catch(e){$('#checkoutError').textContent=e.message||'Could not open checkout. Please try again.';$('#checkoutError').hidden=false;}
  finally{checkoutPending=false;$('#confirmCheckoutBtn').disabled=false;}
}
function localValue(key){try{return localStorage.getItem(key)||'';}catch{return '';}}
async function verifySession(){
  const q=new URLSearchParams(location.search),sessionId=q.get('session_id');if(!sessionId||q.has('team_billing'))return;
  try{const r=await fetch('/api/billing-status?session_id='+encodeURIComponent(sessionId));const d=await r.json();if(r.ok&&d.active){setBilling({tier:'pro',customerId:d.customerId||'',subscriptionId:d.subscriptionId||'',status:d.status||'active'});toast('BeatAI Pro unlocked. Welcome to the resistance.');history.replaceState({},'',location.pathname);}else toast('Purchase not verified yet. Keep this success link and try reloading.');}catch{toast('Could not verify your purchase. Keep this success link to retry.');}
}
async function openPortal(){const b=billing();if(!b.customerId)return toast('Open your original checkout success link to restore this device.');try{const r=await fetch('/api/billing-portal',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({customerId:b.customerId})});const d=await r.json();if(!r.ok||!d.url)throw new Error(d.error||'Portal unavailable');location.href=d.url;}catch(e){toast(e.message||'Could not open billing portal');}}

async function loadDaily(){
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
  try{const r=await fetch('/api/daily',{signal:controller.signal});if(!r.ok)throw new Error('Daily unavailable');const d=await r.json();
    // Production returns 15, not 5. A late request never replaces the active battle.
    if(!Array.isArray(d.challenges)||d.challenges.length<5||!d.challenges.every(Questions.valid))throw new Error('Invalid daily set');
    dailyPool=d.challenges.map(x=>({...x,category:x.category||'Reasoning'}));dailySource=d.source==='generated'||d.source==='cache'?'daily':'archive';$('#dailyStatus').textContent=`${dailySource==='daily'?'Today’s shared five':'Today’s archive five'} · rating challenge`;
  }catch{dailyPool=Questions.bank.slice((new Date().getUTCDate()%12)*5,(new Date().getUTCDate()%12)*5+5);$('#dailyStatus').textContent='Daily service offline · archive challenge available';}
  finally{clearTimeout(timeout);}
}
function stopClocks(){clearInterval(timer);clearTimeout(transition);timer=null;transition=null;}
function goHome(){stopClocks();loadController?.abort();launchId++;paused=false;$('#pauseOverlay').hidden=true;show('home');refresh();}
function requirePro(action){if(billing().tier==='pro')return action();beginCheckout('locked-mode');}
async function start(mode='arena',rivalId=selectedRival.id){
  if(['boss','lightning'].includes(mode)&&billing().tier!=='pro')return requirePro(()=>start(mode,rivalId));
  if(mode==='practice'&&billing().tier!=='pro'&&!Packs.left())return beginCheckout('fresh-pack-limit');
  const rival=mode==='boss'?Rivals.list.find(x=>x.id==='omni'):Rivals.list.find(x=>x.id===rivalId&&!x.pro)||Rivals.list[0];
  if(!available(rival))return toast(`Win ${rival.unlock} arena battles to unlock ${rival.name}.`);
  stopClocks();loadController?.abort();Audio.unlock();const request=++launchId;
  let pack,source='archive',rounds=mode==='daily'?5:mode==='impossible'?1:7;
  if(['practice','lightning','boss'].includes(mode)){
    show('loading');$('#loadError').hidden=true;$('#retryLoad').hidden=true;$('#loadingActivity').hidden=false;
    $('#loadTitle').textContent=mode==='boss'?'WAKING OMNI.':'BUILDING YOUR NEXT FIGHT.';
    const controller=new AbortController();loadController=controller;const timeout=setTimeout(()=>controller.abort(),45000);
    try{const parts=mode==='practice'?3:mode==='boss'?2:1;
      const result=await Packs.buildPack(parts,mode,{signal:controller.signal,onProgress:i=>{$('#loadDetail').textContent=`Preparing question set ${i+1} of ${parts}. Checking your history for repeats…`;}});
      if(request!==launchId||controller.signal.aborted)return;
      if(['boss','lightning'].includes(mode)&&billing().tier!=='pro'){goHome();beginCheckout('entitlement-expired');return;}
      pack=result.challenges;source=result.source;rounds=pack.length;
      if(mode==='practice'&&billing().tier!=='pro')Packs.consume();
    }catch(e){if(request!==launchId)return;$('#loadingActivity').hidden=true;$('#loadError').hidden=false;$('#loadError').textContent=e.name==='AbortError'?'The generator took too long. Your free pack was not used.':e.message;$('#retryLoad').hidden=false;$('#retryLoad').onclick=()=>start(mode,rival.id);return;}
    finally{clearTimeout(timeout);if(loadController===controller)loadController=null;}
  }else if(mode==='daily'){
    pack=(dailyPool.length>=5?dailyPool:Questions.bank.slice(0,5)).slice(0,5);source=dailySource;
  }else{
    pack=Questions.select([...dailyPool,...Questions.bank],rounds+1,Packs.history());
    if(pack.length<rounds){show('exhausted');return;}
  }
  if(request!==launchId)return;
  daily=pack;
  const p=profile(),played=Object.values(p.cats).reduce((n,v)=>n+(v.total||0),0),right=Object.values(p.cats).reduce((n,v)=>n+(v.right||0),0);
  const difficulty=played>15&&right/played>.8?2:played>10&&right/played>.65?1:0;
  state={round:0,correct:0,aiCorrect:0,humanRounds:0,aiRounds:0,score:0,marks:[],mode,start:Date.now(),cats:{},botPicks:[],roundLimit:rounds,
    runId:window.crypto?.randomUUID?.()||`${Date.now()}-${Math.random()}`,day:dayKey(),source,battle:Engine.create({rival,mode,rounds,difficulty}),finished:false};
  if(mode==='practice')state.battle={...state.battle,human:200,humanMax:200,ai:260,aiMax:260};
  if(mode==='impossible')state.battle={...state.battle,human:1,humanMax:1,ai:1,aiMax:1,suddenDeath:true};
  paused=false;$('#pauseOverlay').hidden=true;$('#battleRivalArt').innerHTML=Rivals.portrait(rival.id);$('#aiName').textContent=rival.name;
  $('#game').style.setProperty('--rival',rival.color);$('#battleIntro').textContent=mode==='boss'?'BOSS ENCOUNTER':`YOU VS ${rival.name}`;
  $('#battleIntro').classList.remove('enter');void $('#battleIntro').offsetWidth;$('#battleIntro').classList.add('enter');
  show('game');track('battle_started',{mode,rival:rival.id,source});Audio.play(mode==='boss'?'boss':'intro');render();
}
function totalRounds(){return state.roundLimit||7;}
function render(){
  stopClocks();readHeld=false;lastTick=99;const b=state.battle;if(b.phase==='ended')return finish();state.round=b.round;
  if(!daily[state.round]){const extra=Questions.select(Questions.bank,1,[...Packs.history(),...daily.map(c=>c.q)]);daily[state.round]=extra[0]||Questions.bank.find(c=>c.q!==daily[state.round-1]?.q);}
  const c=daily[state.round];c.category=typeof c.category==='string'?c.category.slice(0,50):'Reasoning';const bot=getBotDecision(c);Packs.remember([c]);
  $('#round').textContent=b.suddenDeath?'SUDDEN DEATH':`ATTACK ${state.round+1} / ${totalRounds()}`;$('#modeLabel').textContent=state.mode==='daily'?'DAILY CHALLENGE':state.mode==='practice'?'FRESH PACK · ENDURANCE':state.mode==='boss'?'BOSS BATTLE':state.mode==='lightning'?'LIGHTNING':'HUMAN VS AI';
  $('#bar').style.width=`${Math.min(100,(state.round+1)/totalRounds()*100)}%`;$('#type').textContent=c.category.toUpperCase();$('#q').textContent=c.q;
  $('#questionCard').classList.toggle('long-question',c.q.length>130||c.options.some(x=>x.length>75));
  $('#sub').textContent=c.category===b.rival.weakness?`${b.rival.name}’S WEAKNESS · +5 DAMAGE`:state.round===0?'Correct = attack. Wrong = counter. Faster hits harder.':'Choose your attack.';
  $('#answers').innerHTML=c.options.map((o,i)=>`<button class="answer" data-i="${i}"><span class="answer-key">${String.fromCharCode(65+i)}</span><span>${escapeHtml(o)}</span><span class="answer-check" aria-hidden="true"></span></button>`).join('');
  $$('.answer').forEach(button=>button.onclick=()=>answer(+button.dataset.i));
  $('#feedback').hidden=true;$('#next').hidden=true;$('#reviewAnswer').hidden=true;$('#autoAdvance').textContent='';$('#battleStage').dataset.impact='';$('#damageNumber').textContent='';
  const r=b.rival,record=profile().rivals[r.id];
  const talk=b.suddenDeath?'One hit settles it. No powers. No excuses.':state.round===0?Rivals.line(r,record?.plays?'rematch':'intro',record?.plays||0):b.bossPhase===2?Rivals.line(r,'phase'):b.ai<=30?Rivals.line(r,'danger'):b.combo>=3?Rivals.line(r,'combo',state.round):Rivals.line(r,'intro',state.round);
  $('#taunt').textContent=talk;$('#botCommit').textContent=`AI ANSWER LOCKED · ${bot.confidence}% CONFIDENT`;
  updateBattleUI();remainingMs=Engine.seconds(b)*1000;startClock();
}
function startClock(){deadline=performance.now()+remainingMs;clearInterval(timer);timer=setInterval(tick,80);tick();}
function tick(){
  if(paused||state.battle?.phase!=='asking')return;remainingMs=Math.max(0,deadline-performance.now());
  const seconds=Math.ceil(remainingMs/1000),pct=remainingMs/(Engine.seconds(state.battle)*1000)*100;
  $('#timerLabel').textContent=String(seconds).padStart(2,'0');$('#attackClock').style.setProperty('--time',`${pct}%`);$('#attackClock').classList.toggle('urgent',seconds<=5);
  if(seconds<=3&&seconds!==lastTick){Audio.play('tick');lastTick=seconds;}if(remainingMs<=0)answer(-1,true);
}
function updateBattleUI(){
  const b=state.battle;if(!b)return;$('#humanHp').style.width=`${b.human/b.humanMax*100}%`;$('#aiHp').style.width=`${b.ai/b.aiMax*100}%`;$('#humanHpText').textContent=b.human;$('#aiHpText').textContent=b.ai;
  $('#humanMeter').setAttribute('aria-valuenow',b.human);$('#humanMeter').setAttribute('aria-valuemax',b.humanMax);$('#aiMeter').setAttribute('aria-valuenow',b.ai);$('#aiMeter').setAttribute('aria-valuemax',b.aiMax);
  $('#humanFighter').classList.toggle('critical-health',b.human<=30);$('#aiFighter').classList.toggle('critical-health',b.ai<=b.aiMax*.25);
  $('#comboText').textContent=b.combo>=2?`${b.combo} HIT COMBO`:b.combo===1?'FIRST HIT':'MAKE YOUR MOVE';$('#comboText').dataset.tier=b.combo>=4?'high':b.combo>=2?'mid':'low';
  $('#humanStatus').textContent=b.shield?'SHIELD ARMED':b.overdrive?'OVERDRIVE ARMED':b.double?'DOUBLE STRIKE ARMED':b.human<=30?'CRITICAL · FIGHT BACK':'HUMAN · UNPREDICTABLE';
  $('#aiStatus').textContent=b.suddenDeath?'ONE HIT TO FINISH':b.bossPhase===2?'PHASE 2 · ENRAGED':b.combo>=3?'ADAPTING · COUNTERS +4':b.mode==='boss'?'PHASE 1 · RESTRAINED':`COUNTER: ${Engine.counter(b)} HP`;
  $('#phaseAlert').hidden=b.bossPhase!==2;$('#phaseAlert').textContent='PHASE 2 — COUNTERS +8 · CLOCK −4s';
  $('#energyFill').style.width=`${b.energy}%`;$('#energyText').textContent=b.overdrive?'ARMED':b.energy===100?'READY':`${b.energy}%`;
  const locked=b.phase!=='asking'||paused;
  for(const [id,key]of [['power5050','fifty'],['powerShield','shield'],['powerDouble','double']]){const button=$('#'+id);button.disabled=locked||b.used[key]||b.suddenDeath;button.classList.toggle('armed',!!b[key]);button.setAttribute('aria-pressed',String(!!b[key]));}
  $('#overdriveBtn').disabled=locked||b.energy<100||b.overdrive||b.suddenDeath;$('#overdriveBtn').classList.toggle('ready',b.energy===100&&!b.overdrive);$('#points').textContent=`${state.score} PTS`;
}
function usePower(kind){if(paused)return;const b=Engine.power(state.battle,kind,daily[state.round]?.answer);if(b===state.battle)return;state.battle=b;Audio.unlock();Audio.play(kind==='shield'?'shield':'power');
  if(kind==='fifty')$$('.answer').forEach((x,i)=>{if(b.removed.includes(i)){x.disabled=true;x.classList.add('eliminated');}});
  updateBattleUI();$('#sub').textContent=kind==='fifty'?'TWO WRONG ANSWERS REMOVED':kind==='shield'?'SHIELD: YOUR NEXT MISS DOES NO DAMAGE':kind==='double'?'DOUBLE STRIKE: NEXT ANSWER — HIT OR LOSE IT':'OVERDRIVE: NEXT ANSWER HITS 70% HARDER';
}
function answer(index,timedOut=false){
  if(paused||state.battle?.phase!=='asking')return;const c=daily[state.round],bot=getBotDecision(c),elapsed=Engine.seconds(state.battle)*1000-Math.max(0,deadline-performance.now());
  const b=Engine.resolve(state.battle,{index,answer:c.answer,elapsedMs:elapsed,category:c.category,botCorrect:bot.answer===c.answer,timedOut});if(b===state.battle)return;stopClocks();state.battle=b;const hit=b.last;
  state.correct=b.correct;state.aiCorrect+=hit.botCorrect?1:0;state.humanRounds+=hit.ok?1:0;state.aiRounds+=hit.ok?0:1;state.score=b.score;state.marks.push(hit.ok?'🟩':'🟥');if(!Object.hasOwn(state.cats,c.category))Object.defineProperty(state.cats,c.category,{value:{right:0,total:0},enumerable:true,writable:true});state.cats[c.category].total++;if(hit.ok)state.cats[c.category].right++;
  $$('.answer').forEach((button,n)=>{button.disabled=true;if(n===c.answer){button.classList.add('correct');button.querySelector('.answer-check').textContent='✓';}if(n===hit.index&&!hit.ok){button.classList.add('wrong');button.querySelector('.answer-check').textContent='×';}});
  updateBattleUI();const label=hit.blocked?'SHIELD BLOCK':hit.timeout?'TIME’S UP':hit.ok?(b.outcome==='win'?'KNOCKOUT':hit.overdrive?'OVERDRIVE':hit.double?'DOUBLE STRIKE':hit.fast?'CRITICAL HIT':b.combo>=3?`${b.combo} HIT COMBO`:'DIRECT HIT'):'COUNTERATTACK';
  $('#damageNumber').textContent=hit.blocked?'BLOCK':`−${hit.damage}`;$('#impactLabel').textContent=label;$('#battleStage').dataset.impact=hit.ok?'hit':hit.blocked?'block':'miss';$('#damageNumber').className=hit.ok?'damage-number on-ai':'damage-number on-human';
  const event=hit.phaseShift?'phase':b.outcome==='win'?'win':b.outcome==='loss'?'lose':b.ai<=30?'danger':hit.ok?b.combo>=3?'combo':'hit':'miss';
  $('#taunt').textContent=Rivals.line(b.rival,event,state.round);$('#botCommit').textContent=`AI PICK: ${String.fromCharCode(65+bot.answer)} · ${hit.botCorrect?'CORRECT':'MISSED — ARMOUR EXPOSED'}`;
  $('#feedback').hidden=false;$('#feedbackTitle').textContent=label;$('#feedbackWhy').textContent=c.why;$('#feedback').dataset.outcome=hit.ok?'hit':'miss';
  $('#next').hidden=false;$('#next').textContent=b.phase==='ended'||b.round+1>=b.rounds?'SEE RESULT  ↗':'NEXT ATTACK  ↗';$('#reviewAnswer').hidden=false;$('#reviewAnswer').textContent='HOLD TO READ';$('#autoAdvance').textContent='Next attack in 2.4s';
  Audio.play(hit.phaseShift?'boss':hit.blocked?'shield':hit.ok?hit.fast?'critical':b.combo>=3?'combo':'hit':'miss');track('question_answered',{mode:state.mode,round:state.round+1,correct:hit.ok?1:0,ai_correct:hit.botCorrect?1:0,damage:hit.damage,combo:b.combo});scheduleNext();
}
function scheduleNext(){clearTimeout(transition);transition=setTimeout(()=>{if(!paused&&!readHeld)nextAttack();},2400);}
function nextAttack(){if(paused||state.battle?.phase==='asking')return;stopClocks();state.battle=Engine.advance(state.battle);if(state.battle.phase==='ended')finish();else render();}
function pause(){if(paused||document.body.dataset.screen!=='game')return;paused=true;remainingMs=Math.max(0,deadline-performance.now());stopClocks();$('#pauseOverlay').hidden=false;$('#resumeBtn').focus();updateBattleUI();}
function resume(){if(!paused)return;paused=false;$('#pauseOverlay').hidden=true;Audio.unlock();updateBattleUI();if(state.battle.phase==='asking')startClock();else if(!readHeld)scheduleNext();}
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});

const achievementDefs=[['first','FIRST BLOOD','Win a battle'],['perfect','UNTOUCHABLE','Win without a wrong answer'],['combo5','HUMAN HIGHLIGHT REEL','Land five correct answers in a row'],['comeback','STILL BREATHING','Win with 30 HP or less'],['streak7','SEVEN DAYS HUMAN','Play on seven consecutive days'],['boss','GOD COMPLEX, BROKEN','Defeat OMNI'],['lightning','QUICKER THAN SILICON','Win a Lightning battle'],['rivals','KNOW YOUR ENEMY','Defeat five different rivals']];
function unlockChecks(p){const b=state.battle,win=b.outcome==='win',tests={first:p.wins>=1,perfect:win&&b.misses===0,combo5:b.bestCombo>=5,comeback:win&&b.human<=30,streak7:p.streak>=7,boss:win&&state.mode==='boss',lightning:win&&state.mode==='lightning',rivals:Object.values(p.rivals).filter(r=>r.wins>0).length>=5};const got=[];for(const [id]of achievementDefs)if(tests[id]&&!p.unlocked.includes(id)){p.unlocked.push(id);got.push(id);}return got;}
function renderAchievements(){const p=profile();$('#achievements').innerHTML=achievementDefs.map(([id,name,desc])=>`<div class="achievement ${p.unlocked.includes(id)?'earned':'locked'}"><span>${p.unlocked.includes(id)?'◆':'◇'}</span><div><b>${name}</b><small>${desc}</small></div></div>`).join('');$('#achievementCount').textContent=`${achievementDefs.filter(x=>p.unlocked.includes(x[0])).length} / ${achievementDefs.length} EARNED`;}
function renderSkills(){const p=profile();$('#skills').innerHTML=Object.entries(p.cats).filter(([,v])=>v.total>0).map(([name,v])=>`<div class="skillrow"><label><b>${escapeHtml(name)}</b><span>${Math.round(v.right/v.total*100)}%</span></label><div class="meter"><div style="width:${Math.round(v.right/v.total*100)}%"></div></div></div>`).join('')||'<p class="muted">Finish a battle to reveal your strengths.</p>';$('#skillSummary').textContent=`${Object.values(p.cats).reduce((n,v)=>n+(v.total||0),0)} ANSWERS ANALYZED`;}
function finish(){
  if(state.finished||state.battle.phase!=='ended')return;state.finished=true;stopClocks();const b=state.battle,win=b.outcome==='win';
  const result=Engine.award(profile(),b,{runId:state.runId,day:state.day,mode:state.mode,correct:state.correct,total:state.marks.length,score:state.score});const p=result.p;
  for(const [cat,v]of Object.entries(state.cats)){if(!Object.hasOwn(p.cats,cat))Object.defineProperty(p.cats,cat,{value:{right:0,total:0},enumerable:true,writable:true});p.cats[cat].right+=v.right;p.cats[cat].total+=v.total;}
  const earned=unlockChecks(p);saveProfile(p);const newLevel=levelFor(p.xp)>levelFor(p.xp-result.xpGain);
  $('#result').dataset.outcome=b.outcome;$('#resultKicker').textContent=win?(b.ai===0?'KNOCKOUT · HUMANITY WINS':'DECISION · HUMANITY WINS'):'DEFEAT · THE MACHINE TAKES IT';$('#verdict').textContent=win?'HUMAN 1. AI 0.':'NOT OVER. JUST ROUND ONE.';
  $('#resultRivalArt').innerHTML=Rivals.portrait(b.rival.id);$('#resultRival').textContent=`${b.rival.name} ${win?'DEFEATED':'SURVIVES'}`;$('#resultQuote').textContent=`“${Rivals.line(b.rival,win?'win':'lose')}”`;
  $('#final').textContent=`${state.correct}/${state.marks.length}`;$('#resultCombo').textContent=b.bestCombo;$('#resultHp').textContent=b.human;$('#sharegrid').textContent=state.marks.join('');$('#meta').textContent=`${state.score} points · ${b.criticals} critical hit${b.criticals===1?'':'s'} · ${b.human} vs ${b.ai} HP`;
  $('#ratingResult').textContent=state.mode==='daily'?`${result.old} → ${p.rating}`:'UNRANKED ARENA';$('#xpResult').textContent=`+${result.xpGain} XP`;$('#xpBar').style.width=`${p.xp%250/2.5}%`;$('#levelResult').textContent=`${newLevel?'LEVEL UP! · ':''}LEVEL ${levelFor(p.xp)} · ${250-p.xp%250} XP TO GO`;
  $('#earnedResult').textContent=earned.length?`UNLOCKED: ${earned.map(id=>achievementDefs.find(x=>x[0]===id)[1]).join(' · ')}`:win?`${p.winStreak} WIN STREAK · KEEP IT ALIVE`:'You earned XP. The machine earned a grudge.';
  $('#again').textContent=`REMATCH ${b.rival.name}  ↗`;$('#again').onclick=()=>start(state.mode==='daily'?'arena':state.mode,b.rival.id);
  const next=Rivals.list.find(r=>!r.pro&&r.unlock<=p.arenaWins&&r.unlock>0&&!p.rivals[r.id]?.wins);$('#nextRival').hidden=!next;$('#nextRival').textContent=next?`CHALLENGE ${next.name}`:'';$('#nextRival').onclick=()=>{if(next){selectedRival=next;start('arena',next.id);}};
  $('#resultMoment').textContent=win?(b.human<=30?'COMEBACK COMPLETE':b.misses===0?'PERFECT FIGHT':state.mode==='boss'?'BOSS DESTROYED':'MACHINE HUMBLED'):'RUN. IT. BACK.';$('#shareLabel').textContent=win?'MAKE IT EVERYONE’S PROBLEM.':'THE REMATCH STARTS WITH YOU.';
  show('result');refresh();Audio.play(win?'win':'loss');track('battle_completed',{mode:state.mode,rival:b.rival.id,outcome:b.outcome,correct:state.correct,total:state.marks.length,score:state.score,combo:b.bestCombo});
  window.dispatchEvent(new CustomEvent('beat-ai:result-ready',{detail:{correct:state.correct,total:state.marks.length,score:state.score,outcome:b.outcome,rival:b.rival.id,combo:b.bestCombo,hp:b.human}}));loadBoard();if(state.mode==='daily'&&!b.suddenDeath)submitScore();
}
async function submitScore(){try{await fetch('/api/scores',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dayKey:state.day,displayName:localValue('beatAIName')||'Player',score:state.score,correct:Math.min(5,state.correct),elapsedMs:Date.now()-state.start,fingerprint:localValue('beatAIFingerprint')})});}catch{/* Local progress remains saved. */}}
async function loadBoard(){
  $('#leaderboard').textContent='Loading rankings…';const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
  try{const r=await fetch('/api/scores?date='+dayKey(),{signal:controller.signal});if(!r.ok)throw new Error();const d=await r.json(),rows=Array.isArray(d.leaderboard)?d.leaderboard:[];
    $('#leaderboard').innerHTML=rows.length?rows.slice(0,10).map((row,i)=>`<div class="row"><span>${i+1}. ${escapeHtml(row.display_name)}</span><b>${Number(row.score)||0} PTS</b></div>`).join(''):`<p class="muted">${d.enabled===false?'Global rankings are not connected. Your progress is saved on this device.':'No scores posted yet. Play the daily challenge to enter.'}</p>`;
  }catch{$('#leaderboard').textContent='Rankings are temporarily unavailable. Your battle progress is safe.';}finally{clearTimeout(timeout);}
}
let modalFocus=null;
function openModal(id){pause();modalFocus=document.activeElement;const el=$('#'+id);el.classList.add('open');el.setAttribute('aria-hidden','false');el.querySelector('button')?.focus();}
function closeModal(el){el.classList.remove('open');el.setAttribute('aria-hidden','true');modalFocus?.focus();}
$$('[data-close]').forEach(x=>x.onclick=()=>closeModal(x.closest('.modal')));$$('.modal').forEach(el=>el.addEventListener('click',e=>{if(e.target===el)closeModal(el);}));
document.addEventListener('keydown',e=>{
  const modal=$('.modal.open');if(modal){if(e.key==='Escape'){e.preventDefault();closeModal(modal);}if(e.key==='Tab'){const focus=[...modal.querySelectorAll('button:not([disabled]),input,select,a[href]')].filter(x=>!x.hidden);const first=focus[0],last=focus.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}return;}
  if(document.body.dataset.screen!=='game'||e.repeat)return;if(e.key==='Escape'){e.preventDefault();paused?resume():pause();return;}if(paused||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
  const key=e.key.toLowerCase(),index='abcd'.indexOf(key);if(index>=0){e.preventDefault();answer(index);}else if(/^[1-4]$/.test(key)){e.preventDefault();answer(Number(key)-1);}else if(e.key==='Enter'&&state.battle.phase!=='asking'){e.preventDefault();nextAttack();}
});
$('#heroPlay').onclick=()=>start(selectedRival.pro?'boss':'arena');$('#play').onclick=()=>start('daily');$('#practiceBtn').onclick=()=>start('practice');$('#lightningBtn').onclick=()=>start('lightning');$('#bossBtn').onclick=()=>start('boss');$('#impossibleBtn').onclick=()=>start('impossible');
$('#pauseBtn').onclick=pause;$('#resumeBtn').onclick=resume;$('#leaveBattle').onclick=goHome;$('#resultHome').onclick=goHome;$('#cancelLoad').onclick=goHome;$('#archiveDaily').onclick=()=>start('daily');$('#archiveFresh').onclick=()=>start('practice');$('#archiveHome').onclick=goHome;
$('#power5050').onclick=()=>usePower('fifty');$('#powerShield').onclick=()=>usePower('shield');$('#powerDouble').onclick=()=>usePower('double');$('#overdriveBtn').onclick=()=>usePower('overdrive');$('#next').onclick=nextAttack;
$('#reviewAnswer').onclick=()=>{readHeld=!readHeld;clearTimeout(transition);$('#reviewAnswer').textContent=readHeld?'CONTINUE AUTO-PLAY':'HOLD TO READ';$('#autoAdvance').textContent=readHeld?'Take your time. Next attack when you’re ready.':'Next attack in 2.4s';if(!readHeld)scheduleNext();};
$('#muteBtn').onclick=()=>{Audio.toggle();refreshSound();};function refreshSound(){$('#muteBtn').textContent=Audio.muted?'SOUND OFF':'SOUND ON';$('#muteBtn').setAttribute('aria-pressed',String(!Audio.muted));}
$('#profileBtn').onclick=()=>{const p=profile();$('#profileTitle').textContent=titleFor(p.xp);$('#profileMeta').textContent=`Level ${levelFor(p.xp)} · ${p.xp} XP · Arena rating ${p.rating}`;$('#profileContent').textContent=`${p.plays} battles · ${p.wins} wins · ${p.streak} day streak. Your legacy progress is preserved on this browser. New rival unlocks use arena wins.`;openModal('profileModal');};
$('#upgradeBtn').onclick=()=>beginCheckout('home');$('#proBtn').onclick=()=>beginCheckout('header');$('#resultUpgradeBtn').onclick=()=>beginCheckout('result');$('#confirmCheckoutBtn').onclick=createCheckout;$('#manageBtn').onclick=openPortal;$('#restoreBtn').onclick=()=>openModal('restoreModal');
window.BeatAIBattle={get state(){return state.battle;},refresh:updateBattleUI};
const savedRival=Rivals.list.find(r=>r.id===Packs.read('beatAISelectedRival','static'));if(savedRival&&available(savedRival))selectedRival=savedRival;
captureAcquisition();document.body.dataset.screen='home';refresh();refreshSound();loadDaily();verifySession();Packs.syncProEntitlement().then(()=>{if(!available(selectedRival))selectedRival=Rivals.list[0];refresh();});track('landing_view',{new_player:profile().plays?0:1});
