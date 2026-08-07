const SITE_URL=process.env.SITE_URL||'https://quantum-adventures.vercel.app';
function json(res,status,body){res.statusCode=status;res.setHeader('Content-Type','application/json');res.end(JSON.stringify(body));}

module.exports=async(req,res)=>{
  if(req.method!=='POST') return json(res,405,{error:'Method not allowed'});
  const key=process.env.STRIPE_SECRET_KEY;
  if(!key) return json(res,503,{error:'Billing is not configured yet.'});
  try{
    let raw='';for await(const c of req) raw+=c;
    const body=JSON.parse(raw||'{}');
    const customerId=String(body.customerId||'').trim();
    if(!/^cus_/.test(customerId)) return json(res,400,{error:'Missing customer'});
    const params=new URLSearchParams();
    params.set('customer',customerId);
    params.set('return_url',`${SITE_URL}/?billing=portal-return`);
    const r=await fetch('https://api.stripe.com/v1/billing_portal/sessions',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/x-www-form-urlencoded'},body:params});
    const data=await r.json();
    if(!r.ok) throw new Error(data?.error?.message||'Portal unavailable');
    return json(res,200,{url:data.url});
  }catch(e){return json(res,500,{error:e.message||'Portal unavailable'});}
};
