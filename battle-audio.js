/* Synthesized effects, one reusable AudioContext, unlocked only by a gesture. */
window.BeatAIAudio=(()=>{
  let context=null,muted=false;
  try{muted=localStorage.getItem('beatAISound')==='off';}catch{}
  const notes={hit:[[150,.09,0],[70,.13,.03]],critical:[[320,.07,0],[160,.1,.035],[650,.12,.07]],
    miss:[[160,.14,0],[65,.18,.08]],shield:[[470,.12,0],[720,.18,.05]],power:[[240,.12,0],[480,.14,.06],[960,.18,.12]],
    combo:[[440,.08,0],[660,.1,.055],[880,.12,.11]],tick:[[360,.04,0]],
    intro:[[90,.16,0],[135,.16,.08],[180,.2,.18]],boss:[[50,.35,0],[54,.35,.08],[110,.25,.25]],
    win:[[392,.14,0],[494,.14,.12],[587,.14,.24],[784,.35,.36]],loss:[[220,.2,0],[196,.2,.17],[147,.4,.34]]};
  function unlock(){if(muted)return;try{if(!context){const C=window.AudioContext||window.webkitAudioContext;if(C)context=new C();}if(context?.state==='suspended')context.resume().catch(()=>{});}catch{}}
  function play(kind){if(muted||!context||context.state!=='running')return;try{for(const [freq,duration,delay]of(notes[kind]||notes.hit)){const o=context.createOscillator(),g=context.createGain(),at=context.currentTime+delay;o.type=['hit','miss','boss'].includes(kind)?'triangle':'sine';o.frequency.setValueAtTime(freq,at);o.frequency.exponentialRampToValueAtTime(Math.max(30,freq*.6),at+duration);g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(.11,at+.008);g.gain.exponentialRampToValueAtTime(.0001,at+duration);o.connect(g);g.connect(context.destination);o.start(at);o.stop(at+duration+.02);o.onended=()=>{o.disconnect();g.disconnect();};}}catch{}}
  function toggle(){muted=!muted;try{localStorage.setItem('beatAISound',muted?'off':'on');}catch{}if(!muted){unlock();play('power');}return muted;}
  return {unlock,play,toggle,get muted(){return muted;}};
})();
