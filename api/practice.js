const json=(res,status,body)=>{res.status(status).setHeader('Cache-Control','no-store').json(body)};
function clamp(n,a,b){return Math.max(a,Math.min(b,n))}
function normalize(q){return String(q||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ')}
function valid(list){return Array.isArray(list)&&list.length===5&&list.every(x=>typeof x.type==='string'&&typeof x.category==='string'&&typeof x.q==='string'&&Array.isArray(x.options)&&x.options.length===4&&Number.isInteger(x.answer)&&x.answer>=0&&x.answer<=3&&typeof x.why==='string'&&typeof x.aiTake==='string')}
function uniqueAgainst(list,avoid){const seen=new Set(avoid.map(normalize).filter(Boolean));const own=new Set();return list.every(x=>{const k=normalize(x.q);if(!k||seen.has(k)||own.has(k))return false;own.add(k);return true})}
function hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){let x=hash(seed)||1;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296}}
function shuffle(a,r){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function choice(a,r){return a[Math.floor(r()*a.length)]}
function makeOptions(correct,wrong,r){const vals=[correct,...wrong].map(String);const opts=shuffle([...new Set(vals)],r).slice(0,4);while(opts.length<4)opts.push(String(Number(correct)+opts.length+1));return {options:opts,answer:opts.indexOf(String(correct))}}
function localFresh({seed,difficulty,avoid}){
  const r=rng(seed);const out=[];const seen=new Set(avoid.map(normalize));let tries=0;
  const add=q=>{const k=normalize(q.q);if(!k||seen.has(k)||out.some(x=>normalize(x.q)===k))return false;out.push(q);return true};
  while(out.length<5&&tries++<300){
    const kind=Math.floor(r()*6);
    if(kind===0){const a=5+Math.floor(r()*45),b=4+Math.floor(r()*36),c=2+Math.floor(r()*8);const ans=a+b*c;const o=makeOptions(ans,[a*b+c,ans+c,ans-b],r);add({type:'LOGIC DUEL',category:'Logic',difficulty,q:`Calculate ${a} + ${b} × ${c}.`,sub:'Order of operations matters.',...o,why:`Multiplication comes first: ${b} × ${c} = ${b*c}, then add ${a} to get ${ans}.`,aiTake:'The machine wins when humans calculate left-to-right without checking precedence.'})}
    else if(kind===1){const start=2+Math.floor(r()*9),step=2+Math.floor(r()*8),n=4+Math.floor(r()*3);const seq=Array.from({length:n},(_,i)=>start+i*step);const ans=start+n*step;const o=makeOptions(ans,[ans-step,ans+step,ans+2*step],r);add({type:'PATTERN HACK',category:'Patterns',difficulty,q:`What comes next: ${seq.join(', ')}, ?`,sub:'Find the constant gap.',...o,why:`Each term increases by ${step}, so the next value is ${ans}.`,aiTake:'Steady differences are easy to miss when the numbers look noisy.'})}
    else if(kind===2){const base=20*(2+Math.floor(r()*20)),pct=choice([10,20,25,50],r),ans=base*pct/100;const o=makeOptions(ans,[base/10,ans+base/20,ans*2],r);add({type:'NUMBER SENSE',category:'Reasoning',difficulty,q:`What is ${pct}% of ${base}?`,sub:'Turn the percent into a fraction or decimal.',...o,why:`${pct}% of ${base} is ${ans}.`,aiTake:'Percent questions become simple once you anchor them to 10%, 25%, or 50%.'})}
    else if(kind===3){const red=2+Math.floor(r()*6),blue=2+Math.floor(r()*6),ans=3;const o=makeOptions(ans,[2,4,red+blue],r);add({type:'GUARANTEE TEST',category:'Logic',difficulty,q:`A bag has ${red} red marbles and ${blue} blue marbles. Without looking, how many draws guarantee two marbles of the same color?`,sub:'Think worst case, not average luck.',...o,why:'With only two colors, the first two draws could differ; the third must match one of them.',aiTake:'Guarantee problems punish probabilistic thinking when certainty is required.'})}
    else if(kind===4){const total=5+Math.floor(r()*15),used=1+Math.floor(r()*(total-1)),left=total-used;const o=makeOptions(left,[used,total,left+1],r);add({type:'QUICK REASON',category:'Reasoning',difficulty,q:`A robot has ${total} battery cells and uses ${used}. How many remain?`,sub:'Simple arithmetic under pressure.',...o,why:`${total} - ${used} = ${left}.`,aiTake:'Fast questions are where careless humans donate points.'})}
    else {const x=3+Math.floor(r()*12),ans=x*x;const o=makeOptions(ans,[x*2,ans+x,ans-x],r);add({type:'PATTERN HACK',category:'Patterns',difficulty,q:`A number is multiplied by itself. If the number is ${x}, what is the result?`,sub:'Square the number.',...o,why:`${x} × ${x} = ${ans}.`,aiTake:'Pattern recognition is often just arithmetic wearing a costume.'})}
  }
  if(!valid(out)||!uniqueAgainst(out,avoid))throw new Error('Local fresh generator could not produce a unique set');
  return out;
}
async function requestGenerated({seed,difficulty,avoid,attempt}){
  const key=process.env.OPENAI_API_KEY;if(!key)return null;
  const prompt=`Create exactly 5 fresh multiple-choice challenges for Beat AI infinite practice. Seed: ${seed}. Generation attempt: ${attempt}. Target difficulty 1-5: ${difficulty}. NEVER repeat, lightly rewrite, or closely paraphrase any question in this player's history: ${JSON.stringify(avoid.slice(0,120))}. Mix Logic, Patterns, Language, Reasoning, Science, History, Entertainment, Sports, Technology, and occasional visual-style text puzzles. Each item: type, category, difficulty (1-5), q, sub, options exactly four strings, answer integer 0-3, why, aiTake. Make every question objectively answerable, meaningfully distinct, and playable in under 30 seconds. Avoid politics, medical advice, sexual content, copyrighted passages, trick answers that depend on opinion, and browsing. Return only JSON {"challenges":[...]}.`;
  const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-5-mini',input:prompt,text:{format:{type:'json_object'}}})});
  if(!r.ok)throw new Error(`OpenAI ${r.status}`);const d=await r.json();const text=d.output_text||d.output?.flatMap(x=>x.content||[]).map(x=>x.text||'').join('')||'';const list=JSON.parse(text).challenges;if(!valid(list))throw new Error('Invalid practice set');return list;
}
async function generate({seed,difficulty,avoid}){
  const key=process.env.OPENAI_API_KEY;let history=[...avoid];let lastError=null;
  if(key){for(let attempt=1;attempt<=3;attempt++){try{const list=await requestGenerated({seed:`${seed}-${attempt}`,difficulty,avoid:history,attempt});if(uniqueAgainst(list,avoid))return {challenges:list,source:'generated'};history=[...list.map(x=>x.q),...history].slice(0,180);lastError=new Error('Generator returned a repeated question')}catch(e){lastError=e}}}
  try{return {challenges:localFresh({seed:`local-${seed}`,difficulty,avoid}),source:'generated-local',warning:lastError?.message||(!key?'OPENAI_API_KEY unavailable':'')}}catch(e){throw lastError||e}
}
module.exports=async(req,res)=>{
  if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
  let body=req.body&&typeof req.body==='object'?req.body:{};
  if(!req.body){let raw='';try{for await(const c of req)raw+=c;if(raw)body=JSON.parse(raw)}catch{}}
  const difficulty=clamp(Number(body.difficulty)||2,1,5);const avoid=Array.isArray(body.avoid)?body.avoid.map(x=>String(x).slice(0,220)).filter(Boolean).slice(0,2000):[];const seed=String(body.seed||`${Date.now()}-${Math.random()}`).slice(0,120);const requireFresh=body.requireFresh===true;
  try{const result=await generate({seed,difficulty,avoid});if(requireFresh&&!String(result.source).startsWith('generated'))return json(res,503,{error:'Fresh AI generator is temporarily unavailable. No repeated pack was served.',difficulty,seed});return json(res,200,{...result,difficulty,seed})}catch(e){return json(res,503,{error:e.message||'Fresh pack unavailable',difficulty,seed})}
};
