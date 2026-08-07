const qs=require('querystring');
const {getJson,bearer}=require('./team-store');
const teamKey=id=>`beat-ai:team:${id}`;
module.exports=async(req,res)=>{
  try{
    if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
    const {teamId,seats=10}=req.body||{},session=bearer(req);
    if(!session||session.teamId!==teamId||session.role!=='admin')return res.status(403).json({error:'Admin required'});
    const workspace=await getJson(teamKey(teamId));if(!workspace)return res.status(404).json({error:'Workspace not found'});
    const key=process.env.STRIPE_SECRET_KEY,price=process.env.STRIPE_TEAM_PRICE_ID;
    if(!key||!price)return res.status(500).json({error:'Teams billing is not configured'});
    const origin=`${req.headers['x-forwarded-proto']||'https'}://${req.headers.host}`;
    const qty=Math.max(2,Math.min(5000,Number(seats)||10));
    const body=qs.stringify({'mode':'subscription','line_items[0][price]':price,'line_items[0][quantity]':qty,'success_url':`${origin}/?team_billing=success&session_id={CHECKOUT_SESSION_ID}`,'cancel_url':`${origin}/?team_billing=cancelled`,'metadata[team_id]':teamId,'metadata[company]':workspace.company,'subscription_data[metadata][team_id]':teamId,'allow_promotion_codes':'true'});
    const r=await fetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/x-www-form-urlencoded'},body});
    const d=await r.json();if(!r.ok)return res.status(r.status).json({error:d.error?.message||'Stripe error'});
    return res.status(200).json({url:d.url,id:d.id});
  }catch(e){return res.status(500).json({error:e.message||'Teams checkout failed'});}
};
