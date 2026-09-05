/* One source of truth for damage, timing, powers and outcomes. Also runs in Node. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BeatAIEngine = api;
})(typeof window === 'object' ? window : this, function() {
  'use strict';
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, Number(n) || 0));
  function create({rival, mode = 'arena', rounds = 7, difficulty = 0}) {
    const boss = mode === 'boss';
    return {phase:'asking', round:0, rounds, mode, rival, difficulty:clamp(difficulty,0,2),
      human:100, humanMax:100, ai:boss?170:100, aiMax:boss?170:100,
      combo:0, bestCombo:0, energy:0, bossPhase:1, correct:0, misses:0,
      shield:false, double:false, overdrive:false, used:{fifty:false,shield:false,double:false},
      removed:[], score:0, outcome:null, suddenDeath:false, criticals:0, comeback:false, last:null};
  }
  function seconds(b) {
    if(b.suddenDeath) return 10;
    const base=b.mode==='lightning'?10:b.rival.seconds;
    return Math.max(8,base-(b.bossPhase===2?4:0));
  }
  function counter(b) {return b.rival.counter+b.difficulty*2+(b.combo>=3?4:0)+(b.bossPhase===2?8:0);}
  function power(b, kind, correctIndex) {
    if(b.phase!=='asking'||b.suddenDeath) return b;
    if(kind==='overdrive') return b.energy===100&&!b.overdrive?{...b,energy:0,overdrive:true}:b;
    if(!Object.hasOwn(b.used,kind)||b.used[kind]) return b;
    const next={...b,used:{...b.used,[kind]:true}};
    if(kind==='fifty') {
      if(!Number.isInteger(correctIndex)||correctIndex<0||correctIndex>3) return b;
      next.removed=[0,1,2,3].filter(i=>i!==correctIndex).slice(0,2);
    } else next[kind]=true;
    return next;
  }
  function resolve(b, {index, answer, elapsedMs, category='', botCorrect=false, timedOut=false}) {
    if(b.phase!=='asking') return b;
    if(!Number.isInteger(index)||index < -1||index>3||b.removed.includes(index)) return b;
    const elapsed=clamp(elapsedMs,0,seconds(b)*1000);
    const timeout=timedOut||elapsed>=seconds(b)*1000;
    const ok=!timeout&&index===answer;
    const combo=ok?b.combo+1:0, fast=ok&&elapsed<=seconds(b)*250;
    const exposed=category.toLowerCase()===b.rival.weakness.toLowerCase();
    const low=b.human<=30;
    let damage=ok?20+(fast?8:0)+Math.min(8,(combo-1)*2)+(exposed?5:0)+(!botCorrect?3:0):counter(b);
    if(ok&&b.double)damage*=2;
    if(ok&&b.overdrive)damage=Math.round(damage*1.7);
    const blocked=!ok&&b.shield;
    if(blocked)damage=0;
    if(b.suddenDeath)damage=1;
    const human=ok?b.human:Math.max(0,b.human-damage), ai=ok?Math.max(0,b.ai-damage):b.ai;
    const outcome=ai===0?'win':human===0?'loss':null;
    const phaseShift=b.mode==='boss'&&b.bossPhase===1&&ai>0&&ai<=b.aiMax/2;
    const last={ok,index:timeout?-1:index,answer,damage,blocked,fast,exposed,timeout,phaseShift,
      overdrive:b.overdrive&&ok,double:b.double&&ok,botCorrect};
    return {...b,phase:outcome?'ended':'resolved',human,ai,combo,bestCombo:Math.max(b.bestCombo,combo),
      energy:Math.min(100,b.energy+(ok?24:36)+(low?15:0)),shield:blocked?false:b.shield,
      double:false,overdrive:false,correct:b.correct+(ok?1:0),misses:b.misses+(ok?0:1),
      criticals:b.criticals+(fast?1:0),score:b.score+(ok?100+(fast?30:0)+Math.min(100,(combo-1)*15):0),
      bossPhase:phaseShift?2:b.bossPhase,outcome,comeback:b.comeback||(low&&outcome==='win'),last};
  }
  function advance(b) {
    if(b.phase!=='resolved')return b;
    if(b.round+1>=b.rounds) {
      const delta=b.human/b.humanMax-b.ai/b.aiMax;
      // A tied fight gets a visible one-hit tiebreak. No coin flip or hidden score.
      if(Math.abs(delta)<0.000001)return {...b,phase:'asking',round:b.round+1,human:1,ai:1,suddenDeath:true,shield:false,double:false,overdrive:false,removed:[],last:null};
      const outcome=delta>0?'win':'loss';
      return {...b,phase:'ended',outcome,comeback:b.comeback||(b.human<=30&&outcome==='win')};
    }
    return {...b,phase:'asking',round:b.round+1,removed:[],last:null};
  }
  function normalizeProfile(raw) {
    const p=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
    const cats=Object.fromEntries(Object.entries(p.cats&&typeof p.cats==='object'?p.cats:{}).filter(([key,v])=>key.length<60&&v&&typeof v==='object').map(([key,v])=>{const total=clamp(v.total,0,1e8);return [key,{total,right:clamp(v.right,0,total)}];}));
    return {...p,streak:clamp(p.streak,0,100000),best:clamp(p.best,0,5),rating:clamp(p.rating??1000,600,100000),
      xp:clamp(p.xp,0,1e9),plays:clamp(p.plays,0,1e8),wins:clamp(p.wins,0,1e8),
      arenaWins:clamp(p.arenaWins??0,0,1e8),winStreak:clamp(p.winStreak,0,1e8),
      unlocked:Array.isArray(p.unlocked)?p.unlocked:[],rewards:Array.isArray(p.rewards)?p.rewards:[],
      cats,
      rivals:p.rivals&&typeof p.rivals==='object'&&!Array.isArray(p.rivals)?p.rivals:{},
      recentRuns:Array.isArray(p.recentRuns)?p.recentRuns.slice(0,20):[],last:p.last||''};
  }
  function award(raw,b,{runId,day,mode,correct,total,score}) {
    const p=normalizeProfile(raw);
    if(b.phase!=='ended'||!runId||p.recentRuns.includes(runId))return {p,xpGain:0,duplicate:true};
    const win=b.outcome==='win',xpGain=30+correct*12+(win?70:0)+b.bestCombo*5;
    const prev=new Date(day+'T00:00:00Z');prev.setUTCDate(prev.getUTCDate()-1);
    const streak=p.last===day?p.streak:p.last===prev.toISOString().slice(0,10)?p.streak+1:1;
    const record=p.rivals[b.rival.id]||{wins:0,losses:0,plays:0};
    const change=mode==='daily'?(win?18:-10):0;
    const next={...p,xp:p.xp+xpGain,plays:p.plays+1,wins:p.wins+(win?1:0),arenaWins:p.arenaWins+(win?1:0),
      winStreak:win?p.winStreak+1:0,streak,last:day,rating:Math.max(600,p.rating+change),
      best:mode==='daily'?Math.max(p.best,Math.min(5,correct)):p.best,
      rivals:{...p.rivals,[b.rival.id]:{wins:(record.wins||0)+(win?1:0),losses:(record.losses||0)+(win?0:1),plays:(record.plays||0)+1}},
      recentRuns:[runId,...p.recentRuns].slice(0,20),
      lastBattle:{rival:b.rival.name,outcome:b.outcome,correct,total,score,combo:b.bestCombo,day}};
    return {p:next,xpGain,change,old:p.rating,duplicate:false};
  }
  return {create,seconds,counter,power,resolve,advance,normalizeProfile,award};
});
