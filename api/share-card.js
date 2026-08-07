const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number(n)||0));
module.exports=async(req,res)=>{
  const q=req.query||{},name=esc((q.name||'A human').slice(0,28)),score=clamp(q.score,0,15),total=clamp(q.total||5,1,15),streak=clamp(q.streak,0,9999),rating=clamp(q.rating||1000,0,9999),kind=(q.kind||'victory').slice(0,20),marks=esc((q.marks||'').slice(0,30));
  const pct=Math.round((score/total)*100),perfect=score===total;
  const themes={challenge:['#7c3aed','#22d3ee'],achievement:['#9333ea','#ec4899'],streak:['#f97316','#facc15'],victory:['#22d3ee','#8b5cf6'],stats:['#0ea5e9','#6366f1']};
  const [a,b]=themes[kind]||themes.victory;
  const title=kind==='challenge'?'YOU WERE CHALLENGED':kind==='streak'?`${streak} DAY STREAK`:kind==='achievement'?(perfect?'PERFECT SCORE!':'ACHIEVEMENT UNLOCKED'):'I BEAT AI TODAY!';
  const subtitle=kind==='challenge'?`${name} says: beat ${score}/${total}`:`${name} scored ${score}/${total}`;
  const grid=marks||Array.from({length:total},(_,i)=>i<score?'🟩':'🟥').join('');
  const bot=`<g transform="translate(825 118)">
    <ellipse cx="132" cy="338" rx="104" ry="24" fill="#000" opacity=".34"/>
    <path d="M132 14 V-14" stroke="${b}" stroke-width="8" stroke-linecap="round" filter="url(#glow)"/>
    <circle cx="132" cy="-20" r="10" fill="${b}" filter="url(#glow)"/>
    <path d="M54 78 Q132 18 210 78 L198 184 Q132 232 66 184 Z" fill="#12192a" stroke="#5e6d8a" stroke-width="7"/>
    <path d="M72 92 Q132 52 192 92 L181 165 Q132 196 83 165 Z" fill="#05070b" stroke="${b}" stroke-width="4" opacity=".98"/>
    <ellipse cx="105" cy="126" rx="15" ry="18" fill="${a}" filter="url(#glow)"/><ellipse cx="159" cy="126" rx="15" ry="18" fill="${a}" filter="url(#glow)"/>
    <path d="M104 162 Q132 178 160 162" fill="none" stroke="#b9d8ff" stroke-width="7" stroke-linecap="round"/>
    <path d="M43 106 L12 86 M221 106 L252 86" stroke="${b}" stroke-width="8" stroke-linecap="round" opacity=".8" filter="url(#glow)"/>
    <path d="M63 199 Q132 234 201 199 L221 300 Q132 342 43 300 Z" fill="#111827" stroke="#4f5d78" stroke-width="7"/>
    <path d="M72 224 Q132 260 192 224" fill="none" stroke="url(#g)" stroke-width="9" stroke-linecap="round" filter="url(#glow)"/>
    <path d="M60 230 L16 286 M204 230 L248 286" stroke="#596783" stroke-width="20" stroke-linecap="round"/>
    <circle cx="132" cy="276" r="22" fill="#0a0f18" stroke="${a}" stroke-width="5"/><path d="M122 276 h20" stroke="${b}" stroke-width="5" stroke-linecap="round"/>
  </g>`;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient><radialGradient id="r"><stop stop-color="${b}" stop-opacity=".35"/><stop offset="1" stop-color="#05070b" stop-opacity="0"/></radialGradient><filter id="glow"><feGaussianBlur stdDeviation="10" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect width="1200" height="630" fill="#070a10"/><circle cx="930" cy="140" r="430" fill="url(#r)"/><rect x="56" y="46" width="1088" height="538" rx="38" fill="#0e1420" stroke="#293448" stroke-width="2"/><text x="90" y="108" fill="${b}" font-family="Arial,sans-serif" font-size="28" font-weight="800">BEAT AI • DAILY CHALLENGE</text><text x="90" y="192" fill="#fff" font-family="Arial,sans-serif" font-size="60" font-weight="900">${esc(title)}</text><text x="90" y="246" fill="#b6c0d2" font-family="Arial,sans-serif" font-size="30" font-weight="700">${esc(subtitle)}</text><text x="90" y="360" fill="url(#g)" font-family="Arial,sans-serif" font-size="112" font-weight="900" filter="url(#glow)">${score}/${total}</text><text x="90" y="420" fill="#fff" font-family="Arial,sans-serif" font-size="30">${grid}</text><text x="90" y="472" fill="#b6c0d2" font-family="Arial,sans-serif" font-size="25">🔥 ${streak} day streak   •   🧠 ${rating} Arena   •   ${pct}%</text><text x="90" y="510" fill="#718096" font-family="Arial,sans-serif" font-size="22">Think you're smarter than the machine?</text>${bot}<rect x="90" y="528" width="1020" height="72" rx="18" fill="url(#g)"/><text x="600" y="574" text-anchor="middle" fill="#05070b" font-family="Arial,sans-serif" font-size="28" font-weight="900">PLAY BEATAI.GAMES</text></svg>`;
  res.status(200).setHeader('Content-Type','image/svg+xml; charset=utf-8').setHeader('Cache-Control','public, max-age=300, s-maxage=86400').send(svg);
};