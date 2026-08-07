const crypto=require('crypto');
const {getJson,setJson}=require('./team-store');

const teamKey=id=>`beat-ai:team:${id}`;
const eventKey=id=>`beat-ai:stripe-event:${id}`;
const ACTIVE=new Set(['active','trialing']);

function parseStripeSignature(header){
  const parts=String(header||'').split(',').map(x=>x.trim());
  const out={t:'',v1:[]};
  for(const part of parts){const i=part.indexOf('=');if(i<0)continue;const k=part.slice(0,i),v=part.slice(i+1);if(k==='t')out.t=v;else if(k==='v1')out.v1.push(v)}
  return out;
}
function verifySignature(raw,header,secret){
  if(!secret)return false;
  const {t,v1}=parseStripeSignature(header);if(!t||!v1.length)return false;
  const age=Math.abs(Math.floor(Date.now()/1000)-Number(t));if(!Number.isFinite(age)||age>300)return false;
  const expected=crypto.createHmac('sha256',secret).update(`${t}.${raw}`).digest('hex');
  return v1.some(sig=>{try{return crypto.timingSafeEqual(Buffer.from(sig,'hex'),Buffer.from(expected,'hex'))}catch{return false}});
}
function bodyText(req){
  if(typeof req.body==='string')return req.body;
  if(Buffer.isBuffer(req.body))return req.body.toString('utf8');
  if(req.rawBody)return Buffer.isBuffer(req.rawBody)?req.rawBody.toString('utf8'):String(req.rawBody);
  return '';
}
async function retrieveSubscription(id,key){
  const r=await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(id)}`,{headers:{Authorization:`Bearer ${key}`}});
  const d=await r.json();if(!r.ok)throw new Error(d.error?.message||'Stripe subscription lookup failed');return d;
}
function teamIdFrom(obj){return obj?.metadata?.team_id||obj?.client_reference_id||''}
async function reconcileSubscription(sub,eventType){
  if(sub?.metadata?.tier!=='teams'||sub?.metadata?.app!=='beat-ai')return {ignored:true};
  const teamId=teamIdFrom(sub);if(!teamId)return {ignored:true};
  const workspace=await getJson(teamKey(teamId));if(!workspace)return {ignored:true};
  const seats=Math.max(0,Number(sub.items?.data?.[0]?.quantity||sub.metadata?.seat_count||0));
  workspace.billingStatus=sub.status||'incomplete';
  workspace.billingSubscriptionId=sub.id||workspace.billingSubscriptionId||'';
  workspace.billingCustomerId=typeof sub.customer==='string'?sub.customer:sub.customer?.id||workspace.billingCustomerId||'';
  workspace.billingSeatCount=seats;
  workspace.billingCancelAtPeriodEnd=!!sub.cancel_at_period_end;
  workspace.billingCurrentPeriodEnd=Number(sub.current_period_end||0)*1000||null;
  workspace.billingUpdatedAt=Date.now();
  workspace.billingLastEvent=eventType;
  workspace.billingActive=ACTIVE.has(workspace.billingStatus);
  await setJson(teamKey(teamId),workspace);
  return {teamId,status:workspace.billingStatus,seats};
}

module.exports=async(req,res)=>{
  try{
    if(req.method!=='POST')return res.status(405).send('Method not allowed');
    const raw=bodyText(req);
    if(!raw)return res.status(400).send('Raw webhook body required');
    const secret=process.env.STRIPE_WEBHOOK_SECRET;
    if(!secret)return res.status(500).send('STRIPE_WEBHOOK_SECRET is missing');
    if(!verifySignature(raw,req.headers['stripe-signature'],secret))return res.status(400).send('Invalid Stripe signature');
    const event=JSON.parse(raw);
    if(!event?.id||!event?.type)return res.status(400).send('Invalid Stripe event');
    if(await getJson(eventKey(event.id)))return res.status(200).json({received:true,duplicate:true});

    let result={ignored:true};
    const obj=event.data?.object||{};
    if(event.type==='checkout.session.completed'&&obj.metadata?.tier==='teams'&&obj.metadata?.app==='beat-ai'&&obj.subscription){
      const key=process.env.STRIPE_SECRET_KEY;if(!key)return res.status(500).send('STRIPE_SECRET_KEY is missing');
      const sub=await retrieveSubscription(typeof obj.subscription==='string'?obj.subscription:obj.subscription.id,key);
      result=await reconcileSubscription(sub,event.type);
    }else if(['customer.subscription.created','customer.subscription.updated','customer.subscription.deleted'].includes(event.type)){
      result=await reconcileSubscription(obj,event.type);
    }else if(['invoice.payment_failed','invoice.paid'].includes(event.type)){
      const subId=typeof obj.subscription==='string'?obj.subscription:obj.subscription?.id;
      if(subId){const key=process.env.STRIPE_SECRET_KEY;if(!key)return res.status(500).send('STRIPE_SECRET_KEY is missing');const sub=await retrieveSubscription(subId,key);result=await reconcileSubscription(sub,event.type)}
    }
    await setJson(eventKey(event.id),{type:event.type,processedAt:Date.now(),result});
    return res.status(200).json({received:true,...result});
  }catch(e){return res.status(500).json({error:e.message||'Stripe webhook failed'});}
};
