const FALLBACK=[
{type:'LOGIC DUEL',category:'Logic',difficulty:2,q:'A drawer has 5 red socks and 5 blue socks. In the dark, how many socks guarantee a matching pair?',sub:'Worst-case thinking wins.',options:['2','3','4','5'],answer:1,why:'With two colors, the third sock must match one of the first two.',aiTake:'The trap is assuming luck instead of guaranteeing the outcome.'},
{type:'PATTERN HACK',category:'Patterns',difficulty:3,q:'What comes next: 2, 6, 12, 20, 30, ?',sub:'Look at the gaps.',options:['36','40','42','44'],answer:2,why:'The differences are 4, 6, 8, 10, so the next difference is 12.',aiTake:'The sequence is driven by increasing even-number gaps.'},
{type:'TRUTH TEST',category:'Reasoning',difficulty:2,q:'Which statement must be true?',sub:'One counterexample can destroy a universal claim.',options:['Every rectangle is a square.','Every square is a rectangle.','Every odd number is prime.','Every triangle is right-angled.'],answer:1,why:'A square satisfies all rectangle properties.',aiTake:'Category inclusion matters more than everyday naming.'},
{type:'LANGUAGE TRAP',category:'Language',difficulty:2,q:'Which sentence is more likely to be AI-generated?',sub:'Look for generic polish over concrete detail.',options:['The coffee spilled on my left shoe.','This experience underscores the importance of embracing meaningful opportunities.','I missed the 8:10 bus again.','My neighbor left his keys in the door.'],answer:1,why:'It is polished but vague and abstract.',aiTake:'Generic abstraction can sound fluent while saying very little.'},
{type:'LATERAL',category:'Reasoning',difficulty:4,q:'A man shaves several times a day but still has a beard. Who is he?',sub:'Reconsider who is being shaved.',options:['An actor','A barber','A sailor','A doctor'],answer:1,why:'A barber shaves other people throughout the day.',aiTake:'The wording nudges you to assume he is shaving himself.'}
];
const json=(res,status,body)=>{res.status(status).setHeader('Cache-Control','no-store').json(body)};
function clamp(n,a,b){return Math.max(a,Math.min(b,n))}
function normalize(q){return String(q||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ')}
function valid(list){return Array.isArray(list)&&list.length===5&&list.every(x=>typeof x.type==='string'&&typeof x.category==='string'&&typeof x.q==='string'&&Array.isArray(x.options)&&x.options.length===4&&Number.isInteger(x.answer)&&x.answer>=0&&x.answer<=3&&typeof x.why==='string'&&typeof x.aiTake==='string')}
function uniqueAgainst(list,avoid){const seen=new Set(avoid.map(normalize).filter(Boolean));const own=new Set();return list.every(x=>{const k=normalize(x.q);if(!k||seen.has(k)||own.has(k))return false;own.add(k);return true})}
async function requestGenerated({seed,difficulty,avoid,attempt}){
  const key=process.env.OPENAI_API_KEY;
  if(!key)return null;
  const prompt=`Create exactly 5 fresh multiple-choice challenges for Beat AI infinite practice. Seed: ${seed}. Generation attempt: ${attempt}. Target difficulty 1-5: ${difficulty}. NEVER repeat, lightly rewrite, or closely paraphrase any question in this player's history: ${JSON.stringify(avoid.slice(0,120))}. Mix Logic, Patterns, Language, Reasoning, Science, History, Entertainment, Sports, Technology, and occasional visual-style text puzzles. Each item: type, category, difficulty (1-5), q, sub, options exactly four strings, answer integer 0-3, why, aiTake. Make every question objectively answerable, meaningfully distinct, and playable in under 30 seconds. Avoid politics, medical advice, sexual content, copyrighted passages, trick answers that depend on opinion, and browsing. Return only JSON {"challenges":[...]}.`;
  const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-5-mini',input:prompt,text:{format:{type:'json_object'}}})});
  if(!r.ok)throw new Error(`OpenAI ${r.status}`);
  const d=await r.json();
  const text=d.output_text||d.output?.flatMap(x=>x.content||[]).map(x=>x.text||'').join('')||'';
  const list=JSON.parse(text).challenges;
  if(!valid(list))throw new Error('Invalid practice set');
  return list;
}
async function generate({seed,difficulty,avoid}){
  const key=process.env.OPENAI_API_KEY;
  if(!key)return {challenges:FALLBACK,source:'fallback'};
  let history=[...avoid];
  let lastError=null;
  for(let attempt=1;attempt<=3;attempt++){
    try{
      const list=await requestGenerated({seed:`${seed}-${attempt}`,difficulty,avoid:history,attempt});
      if(uniqueAgainst(list,avoid))return {challenges:list,source:'generated'};
      history=[...list.map(x=>x.q),...history].slice(0,180);
      lastError=new Error('Generator returned a repeated question');
    }catch(e){lastError=e}
  }
  throw lastError||new Error('Unable to generate a unique practice set');
}
module.exports=async(req,res)=>{
  if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
  let raw='';for await(const c of req)raw+=c;
  let body={};try{body=JSON.parse(raw||'{}')}catch{}
  const difficulty=clamp(Number(body.difficulty)||2,1,5);
  const avoid=Array.isArray(body.avoid)?body.avoid.map(x=>String(x).slice(0,220)).filter(Boolean).slice(0,2000):[];
  const seed=String(body.seed||`${Date.now()}-${Math.random()}`).slice(0,120);
  const requireFresh=body.requireFresh===true;
  try{
    const result=await generate({seed,difficulty,avoid});
    if(requireFresh&&result.source!=='generated')return json(res,503,{error:'Fresh AI generator is temporarily unavailable. No repeated pack was served.',difficulty,seed});
    return json(res,200,{...result,difficulty,seed});
  }catch(e){
    if(requireFresh)return json(res,503,{error:e.message||'Fresh pack unavailable',difficulty,seed});
    return json(res,200,{challenges:FALLBACK,source:'fallback',difficulty,warning:e.message});
  }
};
