const fs=require('fs');
const assert=require('assert');
const read=p=>fs.readFileSync(p,'utf8');

const html=read('index.html');
const app=read('app.js');
const css=read('styles.css');
const daily=read('api/daily.js');
const scores=read('api/scores.js');
const checkout=read('api/checkout.js');
const billingStatus=read('api/billing-status.js');
const billingPortal=read('api/billing-portal.js');

for(const id of ['rating','lightningBtn','bossBtn','practiceBtn','friendBtn','impossibleBtn','feed','achievements','proBtn','upgradeBtn','manageBtn']){
  assert(new RegExp(`id=["']${id}["']`).test(html),`missing UI hook: ${id}`);
}
assert(html.includes('/app.js'),'app.js is not loaded');
assert(html.includes('/styles.css'),'styles.css is not loaded');
assert(css.includes('.impossible')&&css.includes('.procard'),'game/billing styles missing');

for(const hook of ["start('lightning')","start('boss')","start('practice')","start('impossible')",'renderAchievements','renderSkills','openReward','Arena rating']){
  assert(app.includes(hook),`missing engagement behavior: ${hook}`);
}
for(const route of ['/api/checkout','/api/billing-status','/api/billing-portal','/api/daily','/api/scores']){
  assert(app.includes(route),`client is not wired to ${route}`);
}
new Function(app);

assert(daily.includes('category'),'daily API lacks categories');
assert(daily.includes('aiTake'),'daily API lacks AI replay field');
for(const [name,source] of Object.entries({daily,scores,checkout,billingStatus,billingPortal})){
  new Function('require','module','exports',source);
  assert(source.includes('module.exports'),`${name} API has no handler export`);
}

assert(checkout.includes('STRIPE_SECRET_KEY'),'checkout missing STRIPE_SECRET_KEY');
assert(checkout.includes('STRIPE_PRO_PRICE_ID'),'checkout missing configurable Pro price');
assert(checkout.includes("params.set('mode','subscription')"),'checkout is not subscription mode');
assert(checkout.includes('/v1/checkout/sessions'),'checkout does not call Stripe Checkout Sessions');
assert(billingStatus.includes('STRIPE_SECRET_KEY'),'billing status missing Stripe secret');
assert(billingStatus.includes('/v1/checkout/sessions/'),'billing status does not verify Checkout sessions');
assert(billingStatus.includes("['active','trialing']"),'billing status does not recognize active subscriptions');
assert(billingPortal.includes('STRIPE_SECRET_KEY'),'billing portal missing Stripe secret');
assert(billingPortal.includes('/v1/billing_portal/sessions'),'billing portal does not create portal sessions');

console.log('Beat AI smoke tests passed');
