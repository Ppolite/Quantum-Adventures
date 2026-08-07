const fs=require('fs');
const assert=require('assert');

const read=p=>fs.readFileSync(p,'utf8');
const html=read('index.html');
const daily=read('api/daily.js');
const scores=read('api/scores.js');
const checkout=read('api/checkout.js');
const billingStatus=read('api/billing-status.js');
const billingPortal=read('api/billing-portal.js');

// Validate stable UI hooks instead of brittle display copy/capitalization.
for(const id of ['rating','lightningBtn','bossBtn','practiceBtn','friendBtn','impossibleBtn','feed','achievements','proBtn']){
  assert(new RegExp(`id=["']${id}["']`).test(html),`missing UI hook: ${id}`);
}

// Billing routes must actually be wired into the client.
for(const route of ['/api/checkout','/api/billing-status','/api/billing-portal']){
  assert(html.includes(route),`client is not wired to ${route}`);
}

// Every inline browser script should at least parse as JavaScript.
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert(scripts.length,'inline game script missing');
for(const [,script] of scripts)new Function(script);

// Core game APIs should parse and retain the generated-content fields used by the UI.
assert(daily.includes('category'),'daily API lacks categories');
assert(daily.includes('aiTake'),'daily API lacks AI replay field');
for(const [name,source] of Object.entries({daily,scores,checkout,billingStatus,billingPortal})){
  new Function('require','module','exports',source);
  assert(source.includes('module.exports'),`${name} API has no handler export`);
}

// Stripe integration invariants: secret stays server-side, live price is configurable,
// checkout is subscription mode, success is verified, and portal uses Stripe's API.
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
