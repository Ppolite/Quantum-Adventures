const json=(res,status,body)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(body));};
const env=()=>({url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SERVICE_ROLE_KEY});
const headers=(key,extra={})=>({apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',...extra});

module.exports=async(req,res)=>{
  const {url,key}=env();
  if(!url||!key) return json(res,200,{enabled:false,leaderboard:[]});
  try{
    if(req.method==='GET'){
      const day=/^\d{4}-\d{2}-\d{2}$/.test(req.query?.date||'')?req.query.date:new Date().toISOString().slice(0,10);
      const r=await fetch(`${url}/rest/v1/scores?day_key=eq.${day}&select=display_name,score,correct,elapsed_ms&order=score.desc,elapsed_ms.asc&limit=20`,{headers:headers(key)});
      if(!r.ok) throw new Error(`Supabase ${r.status}`);
      return json(res,200,{enabled:true,dayKey:day,leaderboard:await r.json()});
    }
    if(req.method==='POST'){
      let body='';for await(const chunk of req) body+=chunk;
      const b=JSON.parse(body||'{}');
      const day=/^\d{4}-\d{2}-\d{2}$/.test(b.dayKey||'')?b.dayKey:new Date().toISOString().slice(0,10);
      const display=String(b.displayName||'Player').trim().slice(0,24).replace(/[^\p{L}\p{N} _.-]/gu,'')||'Player';
      const correct=Math.max(0,Math.min(5,Number(b.correct)||0));
      const score=Math.max(0,Math.min(5000,Number(b.score)||0));
      const elapsed=Math.max(0,Math.min(3600000,Number(b.elapsedMs)||0));
      const fingerprint=String(b.fingerprint||'').slice(0,120);
      const r=await fetch(`${url}/rest/v1/scores`,{method:'POST',headers:headers(key,{Prefer:'return=minimal'}),body:JSON.stringify({day_key:day,display_name:display,score,correct,elapsed_ms:elapsed,fingerprint})});
      if(!r.ok) throw new Error(`Supabase ${r.status}`);
      return json(res,201,{ok:true});
    }
    return json(res,405,{error:'Method not allowed'});
  }catch(e){return json(res,500,{error:'Leaderboard unavailable'});}
};