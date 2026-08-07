const crypto=require('crypto');

const base=()=>String(process.env.KV_REST_API_URL||process.env.UPSTASH_REDIS_REST_URL||'').replace(/\/$/,'');
const token=()=>process.env.KV_REST_API_TOKEN||process.env.UPSTASH_REDIS_REST_TOKEN||'';
const secret=()=>process.env.TEAM_AUTH_SECRET||'';

async function cmd(...parts){
  if(!base()||!token())throw new Error('Teams storage is not configured');
  const r=await fetch(base()+'/'+parts.map(x=>encodeURIComponent(String(x))).join('/'),{headers:{Authorization:`Bearer ${token()}`}});
  const d=await r.json();
  if(!r.ok||d.error)throw new Error(d.error||'Teams storage request failed');
  return d.result;
}
async function getJson(key){const v=await cmd('get',key);if(!v)return null;try{return JSON.parse(v)}catch{return null}}
async function setJson(key,value){await cmd('set',key,JSON.stringify(value));return value}
async function del(key){return cmd('del',key)}
function id(prefix='t'){return `${prefix}_${crypto.randomBytes(8).toString('hex')}`}
function code(){return crypto.randomBytes(4).toString('hex').toUpperCase()}
function sign(payload){
  if(!secret())throw new Error('TEAM_AUTH_SECRET is not configured');
  const raw=Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig=crypto.createHmac('sha256',secret()).update(raw).digest('base64url');
  return `${raw}.${sig}`;
}
function verify(raw){
  if(!raw||!secret())return null;
  const [body,sig]=String(raw).split('.');if(!body||!sig)return null;
  const expected=crypto.createHmac('sha256',secret()).update(body).digest('base64url');
  try{if(!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return null}catch{return null}
  try{const p=JSON.parse(Buffer.from(body,'base64url').toString());if(p.exp&&Date.now()>p.exp)return null;return p}catch{return null}
}
function bearer(req){return verify((req.headers.authorization||'').replace(/^Bearer\s+/i,''))}
function publicWorkspace(w){
  if(!w)return null;
  const {billingCustomerId,billingSubscriptionId,...safe}=w;
  return safe;
}
module.exports={getJson,setJson,del,id,code,sign,verify,bearer,publicWorkspace};
