const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number(n)||0));
module.exports=async(req,res)=>{
  const q=req.query||{},name=esc((q.name||'A human').slice(0,28)),score=clamp(q.score,0,10),total=clamp(q.total||5,1,10),streak=clamp(q.streak,0,9999),rating=clamp(q.rating||1000,0,9999),kind=(q.kind||'challenge').slice(0,20),marks=esc((q.marks||'').slice(0,10));
  const pct=Math.round((score/total)*100),perfect=score===total;
  const themes={challenge:['#7c3aed','#22d3ee'],achievement:['#9333ea','#ec4899'],streak:['#f97316','#facc15'],victory:['#16a34a','#22c55e'],stats:['#0ea5e9','#6366f1']};
  const [a,b]=themes[kind]||themes.challenge;
  const title=kind==='streak'?`${streak} DAY STREAK`:kind==='achievement'?(perfect?'PERFECT SCORE!':'ACHIEVEMENT UNLOCKED'):kind==='victory'?'HUMANITY WINS':'YOU WERE CHALLENGED';
  const subtitle=kind==='stats'?`Today in Beat AI`:kind==='challenge'?`${name} says: beat ${score}/${total}`:`${name} scored ${score}/${total}`;
  const grid=marks||Array.from({length:total},(_,i)=>i<score?'🟩':'⬛').join('');
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient><radialGradient id="r"><stop stop-color="${b}" stop-opacity=".35"/><stop offset="1" stop-color="#05070b" stop-opacity="0"/></radialGradient></defs>
  <rect width="1200" height="630" fill="#070a10"/><circle cx="920" cy="120" r="420" fill="url(#r)"/><rect x="56" y="56" width="1088" height="518" rx="38" fill="#0e1420" stroke="#293448" stroke-width="2"/>
  <text x="90" y="118" fill="${b}" font-family="Arial,sans-serif" font-size="28" font-weight="800">BEAT AI • SOCIAL CHALLENGE</text>
  <text x="90" y="205" fill="#fff" font-family="Arial,sans-serif" font-size="62" font-weight="900">${esc(title)}</text>
  <text x="90" y="260" fill="#b6c0d2" font-family="Arial,sans-serif" font-size="30" font-weight="700">${esc(subtitle)}</text>
  <text x="90" y="380" fill="url(#g)" font-family="Arial,sans-serif" font-size="118" font-weight="900">${score}/${total}</text>
  <text x="90" y="442" fill="#fff" font-family="Arial,sans-serif" font-size="38">${grid}</text>
  <text x="90" y="505" fill="#b6c0d2" font-family="Arial,sans-serif" font-size="26">🔥 ${streak} day streak   •   🧠 ${rating} Arena   •   ${pct}%</text>
  <rect x="760" y="402" width="320" height="88" rx="20" fill="url(#g)"/><text x="920" y="458" text-anchor="middle" fill="#05070b" font-family="Arial,sans-serif" font-size="30" font-weight="900">PLAY AT BEATAI.GAMES</text>
  <text x="90" y="548" fill="#718096" font-family="Arial,sans-serif" font-size="22">Think you're smarter than the machine?</text>
  </svg>`;
  res.status(200).setHeader('Content-Type','image/svg+xml; charset=utf-8').setHeader('Cache-Control','public, max-age=300, s-maxage=86400').send(svg);
};
