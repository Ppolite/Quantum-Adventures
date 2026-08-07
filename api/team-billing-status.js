const {getJson,setJson,bearer,publicWorkspace}=require('./team-store');
const teamKey=id=>`beat-ai:team:${id}`;
const ACTIVE=new Set(['active','trialing']);

module.exports=async(req,res)=>{
  try{
    if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
    const teamId=String(req.query?.teamId||'').trim();
    const sessionId=String(req.query?.session_id||'').trim();
    if(!teamId||!sessionId)return res.status(400).json({error:'teamId and session_id required'});
    const auth=bearer(req);
    if(!auth||auth.teamId!==teamId||auth.role!=='admin')return res.status(403).json({error:'Admin required'});
    const key=process.env.STRIPE_SECRET_KEY;
    if(!key)return res.status(500).json({error:'STRIPE_SECRET_KEY is missing'});
    const workspace=await getJson(teamKey(teamId));
    if(!workspace)return res.status(404).json({error:'Workspace not found'});

    const sr=await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,{headers:{Authorization:`Bearer ${key}`}});
    const checkout=await sr.json();
    if(!sr.ok)return res.status(sr.status).json({error:checkout.error?.message||'Stripe session lookup failed'});
    const checkoutTeam=checkout.metadata?.team_id||checkout.client_reference_id;
    if(checkoutTeam!==teamId||checkout.metadata?.tier!=='teams')return res.status(400).json({error:'Checkout session does not belong to this team'});
    if(checkout.status!=='complete'||!checkout.subscription)return res.status(409).json({error:'Teams checkout is not complete yet'});

    const subId=typeof checkout.subscription==='string'?checkout.subscription:checkout.subscription.id;
    const rr=await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(subId)}`,{headers:{Authorization:`Bearer ${key}`}});
    const sub=await rr.json();
    if(!rr.ok)return res.status(rr.status).json({error:sub.error?.message||'Stripe subscription lookup failed'});
    const seats=Math.max(0,Number(sub.items?.data?.[0]?.quantity||checkout.metadata?.seat_count||0));
    workspace.billingStatus=sub.status||'incomplete';
    workspace.billingCustomerId=typeof checkout.customer==='string'?checkout.customer:checkout.customer?.id||'';
    workspace.billingSubscriptionId=subId;
    workspace.billingSeatCount=seats;
    workspace.billingUpdatedAt=Date.now();
    await setJson(teamKey(teamId),workspace);
    return res.status(200).json({active:ACTIVE.has(workspace.billingStatus),status:workspace.billingStatus,seats,workspace:publicWorkspace(workspace)});
  }catch(e){return res.status(500).json({error:e.message||'Teams billing verification failed'});}
};
