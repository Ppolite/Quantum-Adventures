function json(res,status,body){res.statusCode=status;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(body));}

const ACTIVE=new Set(['active','trialing']);

module.exports=async(req,res)=>{
  if(req.method!=='GET') return json(res,405,{error:'Method not allowed'});
  const key=process.env.STRIPE_SECRET_KEY;
  const subscriptionId=String(req.query?.subscription_id||'').trim();
  if(!key) return json(res,503,{error:'Billing is not configured yet.'});
  if(!/^sub_/.test(subscriptionId)) return json(res,400,{error:'Invalid subscription'});
  try{
    const r=await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}`,{headers:{Authorization:`Bearer ${key}`}});
    const sub=await r.json();
    if(!r.ok) throw new Error(sub?.error?.message||'Unable to verify subscription');
    const isBeatAI=sub?.metadata?.app==='beat-ai'&&sub?.metadata?.tier==='pro';
    if(!isBeatAI) return json(res,403,{error:'Subscription is not Beat AI Pro'});
    const active=ACTIVE.has(sub.status);
    return json(res,200,{
      active,
      tier:active?'pro':'free',
      entitlement:active?'fresh-packs-unlimited':null,
      status:sub.status||null,
      cancelAtPeriodEnd:!!sub.cancel_at_period_end,
      currentPeriodEnd:Number(sub.current_period_end||0)*1000||null,
      customerId:typeof sub.customer==='string'?sub.customer:sub.customer?.id||null,
      subscriptionId:sub.id||subscriptionId
    });
  }catch(e){return json(res,500,{error:e.message||'Subscription verification failed'});}
};
