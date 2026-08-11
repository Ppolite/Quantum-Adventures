const FALLBACK_BANK=[
{type:'LOGIC DUEL',category:'Logic',q:'A farmer has 17 sheep. All but 9 run away. How many remain?',sub:'Read the wording carefully.',options:['8','9','17','26'],answer:1,why:'“All but 9” means 9 stayed.',aiTake:'The trap is treating the sentence as a subtraction problem.'},
{type:'PATTERN HACK',category:'Patterns',q:'What comes next: 3, 6, 12, 24, ?',sub:'Find the operation.',options:['30','36','42','48'],answer:3,why:'Each term doubles, so 24 × 2 = 48.',aiTake:'A simple multiplication pattern can hide in plain sight.'},
{type:'TRUTH TEST',category:'Reasoning',q:'Which statement is definitely true?',sub:'One counterexample can kill a universal claim.',options:['Every prime is odd.','Some even numbers are prime.','Every square is even.','Negative numbers cannot be squared.'],answer:1,why:'2 is both even and prime.',aiTake:'Universal claims should be tested against edge cases.'},
{type:'LANGUAGE TRAP',category:'Language',q:'Which sentence is the strongest clue of generic AI-style writing?',sub:'Look for polished vagueness.',options:['I left my keys upstairs.','In today’s rapidly evolving landscape, meaningful transformation is essential.','The bus came five minutes early.','My coffee is cold.'],answer:1,why:'It is polished but abstract and unusually generic.',aiTake:'Fluency without concrete detail can be a useful clue.'},
{type:'NUMBER SENSE',category:'Reasoning',q:'What is 25% of 240?',sub:'A quarter is your friend.',options:['40','50','60','80'],answer:2,why:'25% is one quarter, and 240 ÷ 4 = 60.',aiTake:'Turning percentages into familiar fractions simplifies the problem.'},
{type:'LATERAL',category:'Logic',q:'A man shaves several times a day but still has a beard. Who is he?',sub:'Reconsider who is being shaved.',options:['An actor','A barber','A sailor','A doctor'],answer:1,why:'A barber shaves other people throughout the day.',aiTake:'The wording encourages an unnecessary assumption.'},
{type:'SCIENCE SNAP',category:'Science',q:'Which planet is known for having the most prominent ring system?',sub:'No telescope required.',options:['Mars','Venus','Saturn','Mercury'],answer:2,why:'Saturn is famous for its extensive visible rings.',aiTake:'Distinctive visual features make some facts easier to retrieve.'},
{type:'HISTORY FLASH',category:'History',q:'Which invention came first?',sub:'Think chronology.',options:['Telephone','Printing press','Airplane','Television'],answer:1,why:'The movable-type printing press predates the telephone, airplane, and television by centuries.',aiTake:'Ordering technologies by era is more reliable than guessing by familiarity.'},
{type:'SPORTS QUICK',category:'Sports',q:'How many points is a standard free throw worth in basketball?',sub:'Basic scoreboard math.',options:['1','2','3','4'],answer:0,why:'A made free throw is worth one point.',aiTake:'Simple rules questions punish overthinking.'},
{type:'TECH CHECK',category:'Technology',q:'What does “CPU” stand for?',sub:'Core computer vocabulary.',options:['Central Processing Unit','Computer Primary Utility','Core Program User','Central Program Upload'],answer:0,why:'CPU stands for Central Processing Unit.',aiTake:'Acronyms are easiest when tied to their actual role.'},
{type:'WORD LOGIC',category:'Language',q:'Which word is the odd one out?',sub:'Group by meaning.',options:['Rapid','Fast','Quick','Heavy'],answer:3,why:'Rapid, fast, and quick are synonyms; heavy is not.',aiTake:'Semantic grouping beats surface similarity.'},
{type:'GUARANTEE TEST',category:'Logic',q:'A drawer contains black and white socks. How many socks guarantee a matching pair?',sub:'Worst-case thinking.',options:['2','3','4','5'],answer:1,why:'The first two could be different colors; the third must match one.',aiTake:'Guarantee questions require reasoning about the worst possible draw.'},
{type:'PATTERN HACK',category:'Patterns',q:'What comes next: 1, 4, 9, 16, ?',sub:'These are familiar powers.',options:['20','24','25','32'],answer:2,why:'These are square numbers: 1², 2², 3², 4², so next is 5² = 25.',aiTake:'Recognizing the sequence family is faster than comparing differences.'},
{type:'QUICK MATH',category:'Reasoning',q:'If 6 machines make 6 widgets in 6 minutes, how many widgets do 6 machines make in 12 minutes?',sub:'Keep the production rate straight.',options:['6','12','18','36'],answer:1,why:'The same six machines make another six widgets in the next six minutes, for 12 total.',aiTake:'The trap is multiplying every number together instead of tracking rate.'},
{type:'HUMAN OR AI',category:'Language',q:'Which line sounds more naturally conversational?',sub:'Prefer concrete, imperfect detail.',options:['I missed the train because I went back for my charger.','This unfortunate occurrence highlights the importance of proactive preparedness.','The circumstances generated a meaningful learning opportunity.','The situation underscores the value of adaptive planning.'],answer:0,why:'The first sentence is concrete and naturally specific.',aiTake:'Human conversational language often contains mundane specifics rather than abstract framing.'}
];
const SLOT_MS=12*60*60*1000;
const json=(res,status,body)=>{res.status(status).setHeader('Cache-Control','public, s-maxage=300, stale-while-revalidate=60').json(body)};
function slotInfo(now=Date.now()){
  const slot=Math.floor(now/SLOT_MS);
  const startsAt=slot*SLOT_MS;
  return {slot,slotKey:`12h-${slot}`,startsAt,nextRotationAt:startsAt+SLOT_MS};
}
async function cached(key){const u=process.env.SUPABASE_URL,k=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!u||!k)return null;const r=await fetch(`${u}/rest/v1/daily_challenges?day_key=eq.${encodeURIComponent(key)}&select=payload&limit=1`,{headers:{apikey:k,Authorization:`Bearer ${k}`}});if(!r.ok)return null;const rows=await r.json();return rows?.[0]?.payload||null}
async function save(key,payload){const u=process.env.SUPABASE_URL,k=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!u||!k)return;await fetch(`${u}/rest/v1/daily_challenges?on_conflict=day_key`,{method:'POST',headers:{apikey:k,Authorization:`Bearer ${k}`,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates'},body:JSON.stringify({day_key:key,payload})})}
function valid(list){return Array.isArray(list)&&list.length===15&&list.every(x=>typeof x.type==='string'&&typeof x.category==='string'&&typeof x.q==='string'&&Array.isArray(x.options)&&x.options.length===4&&Number.isInteger(x.answer)&&x.answer>=0&&x.answer<=3&&typeof x.why==='string'&&typeof x.aiTake==='string')}
function normalize(s){return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function fallbackFor(slot){const rotated=[...FALLBACK_BANK.slice(slot%FALLBACK_BANK.length),...FALLBACK_BANK.slice(0,slot%FALLBACK_BANK.length)];return rotated.slice(0,15)}
async function previousQuestions(slot){const prev=await cached(`12h-${slot-1}`);return Array.isArray(prev)?prev.map(x=>x?.q).filter(Boolean).slice(0,30):[]}
async function generate(slotKey,avoid=[]){
  const key=process.env.OPENAI_API_KEY;if(!key)return null;
  const prompt=`Create exactly 15 fresh multiple-choice challenges for Beat AI rotation ${slotKey}. None may repeat, lightly rewrite, or closely paraphrase these recent questions: ${JSON.stringify(avoid)}. Mix Logic, Patterns, Language, Reasoning, Science, History, Entertainment, Sports, and Technology. Each item must contain: type, category, q, sub, options (exactly four strings), answer (integer 0-3), why, and aiTake. Make every question objectively answerable and playable in under 30 seconds. Vary question structures aggressively. Avoid politics, medical advice, sexual content, copyrighted passages, subjective answers, and anything requiring live web browsing. Return only JSON {"challenges":[...]}.`;
  const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-5-mini',input:prompt,text:{format:{type:'json_object'}}})});
  if(!r.ok)throw new Error(`OpenAI ${r.status}`);const d=await r.json();const text=d.output_text||d.output?.flatMap(x=>x.content||[]).map(x=>x.text||'').join('')||'';const list=JSON.parse(text).challenges;
  if(!valid(list))throw new Error('Invalid 15-question challenge set');
  const seen=new Set(avoid.map(normalize));if(list.some(x=>seen.has(normalize(x.q))))throw new Error('Generated set repeated a recent question');
  return list;
}
module.exports=async(req,res)=>{
  if(req.method!=='GET')return json(res,405,{error:'Method not allowed'});
  const info=slotInfo();
  try{
    const hit=await cached(info.slotKey);if(hit&&valid(hit))return json(res,200,{...info,challenges:hit,source:'cache',rotationHours:12});
    const avoid=await previousQuestions(info.slot);
    let challenges=null,source='generated';
    try{challenges=await generate(info.slotKey,avoid)}catch(e){source='fallback';challenges=fallbackFor(info.slot)}
    if(!challenges){source='fallback';challenges=fallbackFor(info.slot)}
    await save(info.slotKey,challenges).catch(()=>{});
    return json(res,200,{...info,challenges,source,rotationHours:12});
  }catch(e){return json(res,200,{...info,challenges:fallbackFor(info.slot),source:'fallback',rotationHours:12,warning:e.message})}
};
