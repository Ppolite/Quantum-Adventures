const qs=require('querystring');
const {getJson,bearer}=require('./team-store');
const teamKey=id=>`beat-ai:team:${id}`;
const MIN_TEAM_SEATS=10;
const MAX_TEAM_SEATS=5000;

module.exports=async(req,res)=>{
  try{
    if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});

    const {teamId,seats=MIN_TEAM_SEATS}=req.body||{};
    const session=bearer(req);
    if(!session||session.teamId!==teamId||session.role!=='admin')return res.status(403).json({error:'Admin required'});

    const workspace=await getJson(teamKey(teamId));
    if(!workspace)return res.status(404).json({error:'Workspace not found'});

    const stripeSecret=process.env.STRIPE_SECRET_KEY;
    const teamPriceId=process.env.STRIPE_TEAM_PRICE_ID;
    if(!stripeSecret)return res.status(500).json({error:'STRIPE_SECRET_KEY is missing'});
    if(!teamPriceId)return res.status(500).json({error:'STRIPE_TEAM_PRICE_ID is missing'});
    if(!teamPriceId.startsWith('price_'))return res.status(500).json({error:'STRIPE_TEAM_PRICE_ID must be a Stripe price_ ID'});

    const origin=`${req.headers['x-forwarded-proto']||'https'}://${req.headers.host}`;
    const qty=Math.max(MIN_TEAM_SEATS,Math.min(MAX_TEAM_SEATS,Math.floor(Number(seats)||MIN_TEAM_SEATS)));
    const body=qs.stringify({
      mode:'subscription',
      'line_items[0][price]':teamPriceId,
      'line_items[0][quantity]':qty,
      success_url:`${origin}/?team_billing=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:`${origin}/?team_billing=cancelled`,
      client_reference_id:teamId,
      'metadata[app]':'beat-ai',
      'metadata[tier]':'teams',
      'metadata[team_id]':teamId,
      'metadata[company]':workspace.company,
      'metadata[seat_count]':String(qty),
      'subscription_data[metadata][app]':'beat-ai',
      'subscription_data[metadata][tier]':'teams',
      'subscription_data[metadata][team_id]':teamId,
      'subscription_data[metadata][company]':workspace.company,
      'subscription_data[metadata][seat_count]':String(qty),
      allow_promotion_codes:'true'
    });

    const r=await fetch('https://api.stripe.com/v1/checkout/sessions',{
      method:'POST',
      headers:{Authorization:`Bearer ${stripeSecret}`,'Content-Type':'application/x-www-form-urlencoded'},
      body
    });
    const d=await r.json();
    if(!r.ok)return res.status(r.status).json({error:d.error?.message||'Stripe error'});
    return res.status(200).json({url:d.url,id:d.id,seats:qty,priceId:teamPriceId});
  }catch(e){
    return res.status(500).json({error:e.message||'Teams checkout failed'});
  }
};
