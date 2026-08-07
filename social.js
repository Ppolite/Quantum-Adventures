(()=>{
  const SITE='https://quantum-adventures.vercel.app';
  const byId=id=>document.getElementById(id);
  if(!document.querySelector('link[href="/social.css"]')){
    const link=document.createElement('link');link.rel='stylesheet';link.href='/social.css';document.head.appendChild(link);
  }

  function referralId(){
    let id=localStorage.getItem('beatAIReferralId');
    if(!id){
      const raw=(crypto?.randomUUID?.()||`${Date.now()}-${Math.random()}`).replace(/-/g,'');
      id=raw.slice(0,10).toLowerCase();
      localStorage.setItem('beatAIReferralId',id);
    }
    return id;
  }

  function playerName(){return (localStorage.getItem('beatAIName')||'A human').slice(0,32)}
  function currentTarget(){
    try{
      const hasRun=state&&Array.isArray(state.marks)&&state.marks.length>0;
      if(hasRun)return {correct:state.correct,total:totalRounds(),mode:state.mode,marks:state.marks.join('')};
    }catch{}
    const p=typeof profile==='function'?profile():{best:0};
    return {correct:p.best||0,total:5,mode:'daily',marks:''};
  }

  function challengeUrl(){
    const t=currentTarget(),u=new URL(SITE);
    u.searchParams.set('challenge','1');
    u.searchParams.set('beat',`${t.correct}-${t.total}`);
    u.searchParams.set('mode',t.mode||'daily');
    u.searchParams.set('ref',referralId());
    u.searchParams.set('from',playerName());
    return u.toString();
  }

  function shareCopy(){
    const t=currentTarget();
    const grid=t.marks?`\n${t.marks} ${t.correct}/${t.total}`:`\nTarget: ${t.correct}/${t.total}`;
    return `I challenged you to Beat AI.${grid}\n🧠 Think you're smarter than the machine?\nBeat my score: ${challengeUrl()}`;
  }

  function bumpShare(network){
    const key='beatAISocialStats',s=JSON.parse(localStorage.getItem(key)||'{}');
    s[network]=(s[network]||0)+1;s.total=(s.total||0)+1;s.lastSharedAt=Date.now();
    localStorage.setItem(key,JSON.stringify(s));
  }

  function popup(url){window.open(url,'beat-ai-share','popup,width=720,height=640,noopener,noreferrer')}

  async function nativeShare(){
    const text=shareCopy(),url=challengeUrl();
    try{
      if(navigator.share){await navigator.share({title:'Beat AI Challenge',text,url});bumpShare('native');return}
      await navigator.clipboard.writeText(text);bumpShare('copy');toast?.('Challenge copied — send it anywhere 🔗');
    }catch(e){if(e?.name!=='AbortError')toast?.('Share cancelled')}
  }

  async function shareTo(network){
    const text=shareCopy(),url=challengeUrl(),enc=encodeURIComponent;
    if(network==='x')popup(`https://twitter.com/intent/tweet?text=${enc(text)}`);
    else if(network==='facebook')popup(`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`);
    else if(network==='reddit')popup(`https://www.reddit.com/submit?url=${enc(url)}&title=${enc('Can you beat my Beat AI score?')}`);
    else if(network==='whatsapp')popup(`https://wa.me/?text=${enc(text)}`);
    else if(network==='copy'){
      try{await navigator.clipboard.writeText(text);toast?.('Challenge link copied 🔗')}catch{toast?.('Could not copy link')}
    }
    bumpShare(network);
  }

  function readIncomingChallenge(){
    const q=new URLSearchParams(location.search);
    if(q.get('challenge')!=='1')return;
    const beat=(q.get('beat')||'').match(/^(\d+)-(\d+)$/),from=(q.get('from')||'A human').slice(0,32),ref=(q.get('ref')||'').slice(0,32);
    if(ref&&ref!==referralId())localStorage.setItem('beatAIInvitedBy',ref);
    if(!beat)return;
    const correct=Math.max(0,+beat[1]),total=Math.max(1,+beat[2]);
    const banner=byId('challengeBanner');
    byId('challengeHeadline').textContent=`${from} challenged you.`;
    byId('challengeDetail').textContent=`Beat ${correct}/${total}. No pressure. Your dignity is merely on the line.`;
    banner.hidden=false;
    localStorage.setItem('beatAIIncomingChallenge',JSON.stringify({from,correct,total,ref,openedAt:Date.now()}));
    byId('acceptChallengeBtn').onclick=()=>{
      banner.hidden=true;
      try{start('daily')}catch{byId('play')?.click()}
    };
  }

  function wire(){
    byId('share') && (byId('share').onclick=nativeShare);
    byId('friendBtn') && (byId('friendBtn').onclick=nativeShare);
    document.querySelectorAll('[data-social]').forEach(btn=>btn.onclick=()=>shareTo(btn.dataset.social));
    readIncomingChallenge();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
  window.BeatAISocial={challengeUrl,shareCopy,shareTo};
})();