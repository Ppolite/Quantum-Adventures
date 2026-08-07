const FALLBACK = [
  {type:'HUMAN OR AI',q:'Which line sounds AI-generated?',sub:'One was written naturally. One was engineered to sound natural.',options:['I forgot my umbrella, which is basically a tradition at this point.','The rainfall created a profoundly atmospheric experience that enhanced my emotional connection to the environment.'],answer:1,why:'The second sentence is unusually polished, abstract, and stacked with generic emotional language.'},
  {type:'LOGIC DUEL',q:'A farmer has 17 sheep. All but 9 run away. How many remain?',sub:'The AI claims the answer is 8. Beat it.',options:['8','9','17','26'],answer:1,why:'“All but 9” means 9 stayed. The AI took the bait.'},
  {type:'PATTERN HACK',q:'What comes next: 1, 11, 21, 1211, 111221, ?',sub:'Read the previous number out loud.',options:['312211','122211','1113213211','311221'],answer:0,why:'111221 reads as “three 1s, two 2s, one 1” → 312211.'},
  {type:'TRUTH TEST',q:'Which statement is definitely true?',sub:'No browsing. Just reasoning.',options:['Every prime number is odd.','Some even numbers are prime.','Every square number is even.','No negative number can be squared.'],answer:1,why:'2 is both even and prime, so the second statement is definitely true.'},
  {type:'AI LANGUAGE TRAP',q:'Which phrase is the stronger clue that text may be AI-written?',sub:'Neither proves anything by itself.',options:['“I dunno, it just felt weird.”','“In today’s rapidly evolving landscape…”','“Honestly, I missed the bus.”','“My dog ate the corner of it.”'],answer:1,why:'That broad, polished setup phrase is a common generic transition pattern in generated prose.'}
];

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.end(JSON.stringify(body));
};

async function readCached(dayKey) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const r = await fetch(`${url}/rest/v1/daily_challenges?day_key=eq.${dayKey}&select=payload&limit=1`, {
    headers: { apikey:key, Authorization:`Bearer ${key}` }
  });
  if (!r.ok) return null;
  const rows = await r.json();
  return rows?.[0]?.payload || null;
}

async function saveCached(dayKey, payload) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  await fetch(`${url}/rest/v1/daily_challenges?on_conflict=day_key`, {
    method:'POST',
    headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates'},
    body:JSON.stringify({day_key:dayKey,payload})
  });
}

async function generate(dayKey) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return FALLBACK;
  const prompt = `Create exactly 5 short, addictive multiple-choice challenges for a daily game called Beat AI for ${dayKey}. Mix logic traps, human-vs-AI language detection, pattern recognition, truth tests, and lateral reasoning. Each challenge must have: type, q, sub, options (exactly 4 strings), answer (0-3), why. Keep each playable in under 30 seconds. Avoid politics, medical advice, sexual content, copyrighted trivia, subjective answers, or anything requiring browsing. Return JSON only as {"challenges":[...]}.`;
  const r = await fetch('https://api.openai.com/v1/responses', {
    method:'POST',
    headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
    body:JSON.stringify({model:process.env.OPENAI_MODEL || 'gpt-5-mini',input:prompt})
  });
  if (!r.ok) throw new Error(`OpenAI ${r.status}`);
  const data = await r.json();
  const text = data.output_text || data.output?.flatMap(x=>x.content||[]).map(x=>x.text||'').join('') || '';
  const parsed = JSON.parse(text.replace(/^```json\s*|\s*```$/g,''));
  const list = parsed.challenges;
  if (!Array.isArray(list) || list.length !== 5) throw new Error('Invalid generated challenge set');
  return list;
}

module.exports = async (req,res) => {
  if (req.method !== 'GET') return json(res,405,{error:'Method not allowed'});
  const dayKey = /^\d{4}-\d{2}-\d{2}$/.test(req.query?.date || '') ? req.query.date : new Date().toISOString().slice(0,10);
  try {
    const cached = await readCached(dayKey);
    if (cached) return json(res,200,{dayKey,challenges:cached,source:'cache'});
    const challenges = await generate(dayKey);
    await saveCached(dayKey,challenges).catch(()=>{});
    return json(res,200,{dayKey,challenges,source:process.env.OPENAI_API_KEY?'generated':'fallback'});
  } catch (e) {
    return json(res,200,{dayKey,challenges:FALLBACK,source:'fallback',warning:e.message});
  }
};