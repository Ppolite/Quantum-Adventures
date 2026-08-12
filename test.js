const fs=require('fs');
const assert=require('assert');
const read=p=>fs.readFileSync(p,'utf8');

const html=read('index.html');
const app=read('app.js');
const replay=read('infinite-replay.js');
const teams=read('teams.js');
const css=read('styles.css');
const social=read('social.js');
const socialCss=read('social.css');
const api={
  shareCard:read('api/share-card.js'),
  daily:read('api/daily.js'),
  practice:read('api/practice.js'),
  scores:read('api/scores.js'),
  checkout:read('api/checkout.js'),
  billingStatus:read('api/billing-status.js'),
  subscriptionStatus:read('api/subscription-status.js'),
  billingPortal:read('api/billing-portal.js'),
  teamsApi:read('api/teams.js'),
  teamStore:read('api/team-store.js'),
  teamCheckout:read('api/team-checkout.js'),
  teamBillingStatus:read('api/team-billing-status.js'),
  stripeWebhook:read('api/stripe-webhook.js')
};

for(const id of ['rating','lightningBtn','bossBtn','practiceBtn','friendBtn','impossibleBtn','feed','achievements','proBtn','upgradeBtn','midgameProBtn','manageBtn','share','sharePreview','challengeBanner','acceptChallengeBtn','companyCard','companyInterestBtn','companyModal','saveCompanyInterest','companyWorkspace','workspaceCompany','departmentBoard','teamBoard','heroPlay','stickyPlay']){
  assert(new RegExp(`id=["']${id}["']`).test(html),`missing UI hook: ${id}`);
}
for(const asset of ['/app.js','/infinite-replay.js','/teams.js','/social.js','/styles.css','/social.css'])assert(html.includes(asset),`asset not loaded: ${asset}`);
for(const token of ['hero-rival','visual-modes','cinematic-card','Turn AI literacy into a team sport','SHARED PRIVATE LEAGUE'])assert(html.includes(token),`missing homepage/Teams token: ${token}`);
for(const token of ['.hero-juiced','.visual-modes','.cinematic-card','.workspace-board','.hero-conversion','.sticky-play'])assert(css.includes(token),`missing style: ${token}`);
assert(socialCss.includes('.social-grid')&&socialCss.includes('.challenge-banner'),'social styles missing');

for(const source of [app,replay,teams,social])new Function(source);
for(const hook of ['beginCheckout','verifySession','openPortal','renderAchievements','renderSkills','landing_view','battle_started','question_answered','battle_completed','checkout_started'])assert(app.includes(hook),`missing client behavior: ${hook}`);

// Fresh Packs + battle layer
for(const token of ['/api/practice','beatAIRecentQuestionsV2','MAX_HISTORY=2000','requireFresh:true','AVOID_WINDOW=300','buildPack(3','FREE_PACK_LIMIT=3','FREE_PACK_ROUNDS=15','PLAY A FRESH 15 →','GO PRO — UNLOCK UNLIMITED →','battleHud','power5050','powerShield','powerDouble','COMBO ×','syncProEntitlement','/api/subscription-status']){
  assert(replay.includes(token),`missing Fresh Pack/battle behavior: ${token}`);
}
for(const token of ['OPENAI_API_KEY','uniqueAgainst','requireFresh','NEVER repeat','closely paraphrase','attempt<=3'])assert(api.practice.includes(token),`missing unique generation behavior: ${token}`);

// Stripe Pro entitlement
for(const token of ['STRIPE_SECRET_KEY','/v1/checkout/sessions','metadata[tier]','fresh-packs-unlimited','subscription_data[metadata][tier]','https://beatai.games'])assert(api.checkout.includes(token),`missing Pro checkout behavior: ${token}`);
for(const token of ['/v1/checkout/sessions/','meta.app===\'beat-ai\'','meta.tier===\'pro\'','fresh-packs-unlimited'])assert(api.billingStatus.includes(token),`missing checkout verification: ${token}`);
for(const token of ['/v1/subscriptions/','metadata?.app===\'beat-ai\'','metadata?.tier===\'pro\'','ACTIVE.has','fresh-packs-unlimited'])assert(api.subscriptionStatus.includes(token),`missing subscription verification: ${token}`);
assert(api.billingPortal.includes('/v1/billing_portal/sessions'),'billing portal does not create portal sessions');

// Teams billing/security stays intact
for(const token of ['beatAITeamSession','/api/teams','/api/team-checkout','/api/team-billing-status','UPGRADE TEAM PLAN','TEAM PLAN ACTIVE ✓'])assert(teams.includes(token),`missing Teams client behavior: ${token}`);
for(const token of ['action===\'create\'','action===\'join\'','action===\'recordScore\'','Admin required'])assert(api.teamsApi.includes(token),`missing Teams API behavior: ${token}`);
for(const token of ['KV_REST_API_URL','TEAM_AUTH_SECRET','createHmac','timingSafeEqual'])assert(api.teamStore.includes(token),`missing Teams store/security behavior: ${token}`);
for(const token of ['STRIPE_TEAM_PRICE_ID','MIN_TEAM_SEATS=10','metadata[team_id]','client_reference_id'])assert(api.teamCheckout.includes(token),`missing Teams billing behavior: ${token}`);
assert(!api.teamCheckout.includes('STRIPE_PRO_PRICE_ID'),'Teams checkout must never use consumer Pro price');
for(const token of ['STRIPE_WEBHOOK_SECRET','stripe-signature','checkout.session.completed','customer.subscription.updated','invoice.payment_failed','duplicate:true'])assert(api.stripeWebhook.includes(token),`missing Stripe webhook lifecycle behavior: ${token}`);

for(const network of ['twitter.com/intent/tweet','facebook.com/sharer/sharer.php','reddit.com/submit','wa.me/'])assert(social.includes(network),`missing social share target: ${network}`);
assert(api.shareCard.includes('image/svg+xml'),'share card does not return an image');
assert(api.daily.includes('category')&&api.daily.includes('aiTake'),'daily API lacks challenge metadata');

for(const [name,source] of Object.entries(api)){
  new Function('require','module','exports',source);
  assert(source.includes('module.exports'),`${name} API has no handler export`);
}

console.log('Beat AI smoke tests passed');
