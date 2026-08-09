const PRICE_ID=process.env.STRIPE_PRO_PRICE_ID||'price_1U1merHsXnRKu4CMnRL36SED';
const CANONICAL_SITE_URL='https://beatai.games';

function json(res,status,body){res.statusCode=status;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(body));}

module.exports=async(req,res)=>{
  if(req.method!=='POST') return json(res,405,{error:'Method not allowed'});
  const key=process.env.STRIPE_SECRET_KEY;
  if(!key) return json(res,503,{error:'Billing is not configured yet.'});
  try{
    let raw='';for await(const c of req) raw+=c;
    const body=JSON.parse(raw||'{}');
    const email=String(body.email||'').trim().slice(0,254);
    const params=new URLSearchParams();
    params.set('mode','subscription');
    params.set('line_items[0][price]',PRICE_ID);
    params.set('line_items[0][quantity]','1');
    // Never let a stale Vercel SITE_URL send a paid customer to a retired deployment.
    params.set('success_url',`${CANONICAL_SITE_URL}/?billing=success&session_id={CHECKOUT_SESSION_ID}`);
    params.set('cancel_url',`${CANONICAL_SITE_URL}/?billing=cancelled`);
    params.set('allow_promotion_codes','true');
    params.set('metadata[app]','beat-ai');
    params.set('metadata[tier]','pro');
    params.set('metadata[entitlement]','fresh-packs-unlimited');
    params.set('subscription_data[metadata][app]','beat-ai');
    params.set('subscription_data[metadata][tier]','pro');
    params.set('subscription_data[metadata][entitlement]','fresh-packs-unlimited');
    if(email) params.set('customer_email',email);
    const r=await fetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/x-www-form-urlencoded'},body:params});
    const data=await r.json();
    if(!r.ok) throw new Error(data?.error?.message||'Stripe checkout failed');
    return json(res,200,{url:data.url,sessionId:data.id});
  }catch(e){return json(res,500,{error:e.message||'Checkout unavailable'});}
};
