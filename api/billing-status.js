function json(res,status,body){res.statusCode=status;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(body));}

const ACTIVE=new Set(['active','trialing']);

module.exports=async(req,res)=>{
  if(req.method!=='GET') return json(res,405,{error:'Method not allowed'});
  const key=process.env.STRIPE_SECRET_KEY;
  const sessionId=String(req.query?.session_id||'').trim();
  if(!key) return json(res,503,{error:'Billing is not configured yet.'});
  if(!/^cs_/.test(sessionId)) return json(res,400,{error:'Invalid checkout session'});
  try{
    const r=await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}?expand[]=subscription`,{headers:{Authorization:`Bearer ${key}`}});
    const s=await r.json();
    if(!r.ok) throw new Error(s?.error?.message||'Unable to verify checkout');
    const sub=s.subscription;
    const meta={...(typeof sub==='object'&&sub?.metadata?sub.metadata:{}),...(s.metadata||{})};
    const isBeatAI=s.mode==='subscription'&&meta.app==='beat-ai'&&meta.tier==='pro';
    if(!isBeatAI) return json(res,403,{error:'Checkout session is not a Beat AI Pro purchase'});
    const status=typeof sub==='object'?sub.status:null;
    const active=ACTIVE.has(status)||s.payment_status==='paid';
    return json(res,200,{
      active,
      tier:active?'pro':'free',
      entitlement:active?'fresh-packs-unlimited':null,
      customerId:typeof s.customer==='string'?s.customer:s.customer?.id||null,
      subscriptionId:typeof sub==='string'?sub:sub?.id||null,
      status,
      paymentStatus:s.payment_status||null
    });
  }catch(e){return json(res,500,{error:e.message||'Verification failed'});}
};
