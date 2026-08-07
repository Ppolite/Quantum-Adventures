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
const shareCard=read('api/share-card.js');
const daily=read('api/daily.js');
const practice=read('api/practice.js');
const scores=read('api/scores.js');
const checkout=read('api/checkout.js');
const billingStatus=read('api/billing-status.js');
const billingPortal=read('api/billing-portal.js');

for(const id of ['rating','lightningBtn','bossBtn','practiceBtn','friendBtn','impossibleBtn','feed','achievements','proBtn','upgradeBtn','midgameProBtn','manageBtn','share','sharePreview','challengeBanner','acceptChallengeBtn','companyCard','companyInterestBtn','companyModal','saveCompanyInterest','copyCompanyLinkedIn'])assert(new RegExp(`id=["']${id}["']`).test(html),`missing UI hook: ${id}`);
for(const asset of ['/app.js','/infinite-replay.js','/teams.js','/social.js','/styles.css','/social.css'])assert(html.includes(asset),`asset not loaded: ${asset}`);
for(const token of ['og:title','og:image','twitter:card','summary_large_image','twitter:image'])assert(html.includes(token),`social preview metadata missing: ${token}`);
for(const token of ['beatai.games','Turn AI literacy into a team sport','3 packs · 15 new AI-generated questions each','SHARE YOUR SCORE','Beat AI coolbot','rival-bot','UPGRADE TO PRO'])assert(html.includes(token),`missing page token: ${token}`);
assert(css.includes('.rival-bot')&&css.includes('.midgame-pro')&&css.includes('.pro-live'),'live rival/Pro styles missing');
assert(socialCss.includes('.social-grid')&&socialCss.includes('.challenge-banner')&&socialCss.includes('.share-preview'),'social styles missing');
assert(socialCss.includes('object-fit:contain')&&socialCss.includes('object-position:center'),'share preview is not centered/contained');

for(const hook of ['beginCheckout','verifySession','openPortal',"$('#proBtn').onclick=beginCheckout","$('#midgameProBtn').onclick=beginCheckout",'renderAchievements','renderSkills','openReward'])assert(app.includes(hook),`missing client behavior: ${hook}`);
for(const route of ['/api/checkout','/api/billing-status','/api/billing-portal','/api/daily','/api/scores'])assert(app.includes(route),`client is not wired to ${route}`);
new Function(app);new Function(replay);new Function(teams);new Function(social);

for(const token of ['/api/practice','beatAIRecentQuestions','difficulty()','avoid:recent()','crypto?.randomUUID'])assert(replay.includes(token),`missing infinite replay behavior: ${token}`);
for(const token of ['beatAIFreePacksUsed','FREE_PACK_LIMIT=3','FREE_PACK_ROUNDS=15','buildPack(3','roundLimit','freePacksLeft','consumeFreePack',"PLAY TODAY'S 15 →",'GO PRO — UNLOCK UNLIMITED →','PLAY A FRESH 15 →','launchPro','Unlimited fresh 15-question AI packs'])assert(replay.includes(token),`missing 15-question hero funnel behavior: ${token}`);
assert(replay.includes("mode==='practice'&&!pro&&freePacksLeft()===0"),'practice paywall is not enforced after free packs');
assert(replay.includes("else if(mode==='practice') daily=await buildPack(3"),'practice packs are not consistently 15 questions');
assert(practice.includes('OPENAI_API_KEY'),'practice generator missing OpenAI integration');
new Function('require','module','exports',practice);

for(const token of ['beatAICompanyInterest','private company leagues','LinkedIn post copied'])assert(teams.includes(token),`missing company behavior: ${token}`);
for(const network of ['twitter.com/intent/tweet','facebook.com/sharer/sharer.php','reddit.com/submit','wa.me/'])assert(social.includes(network),`missing social share target: ${network}`);
for(const token of ['incomingChallenge','I beat AI today','shareKind','roundLimit','challengeUrl','cardUrl','beatAIInvitedBy','navigator.share','/api/share-card'])assert(social.includes(token),`missing victory-aware social behavior: ${token}`);
assert(shareCard.includes('image/svg+xml'),'share card does not return an image');
for(const token of ['1200','630','PLAY BEATAI.GAMES','I BEAT AI TODAY!','YOU WERE CHALLENGED','translate(825 118)','ellipse cx="132" cy="338"','${bot}'])assert(shareCard.includes(token),`share card missing rival token: ${token}`);
assert(shareCard.includes('const bot=`<g transform=')&&shareCard.includes('ellipse cx="132" cy="338"')&&shareCard.includes('${bot}'),'share card rival bot structure missing');
new Function('require','module','exports',shareCard);

assert(daily.includes('category'),'daily API lacks categories');
assert(daily.includes('aiTake'),'daily API lacks AI replay field');
for(const [name,source] of Object.entries({daily,practice,scores,checkout,billingStatus,billingPortal,shareCard})){new Function('require','module','exports',source);assert(source.includes('module.exports'),`${name} API has no handler export`)}
assert(checkout.includes('STRIPE_SECRET_KEY'),'checkout missing STRIPE_SECRET_KEY');
assert(checkout.includes('/v1/checkout/sessions'),'checkout does not call Stripe Checkout Sessions');
assert(billingStatus.includes('/v1/checkout/sessions/'),'billing status does not verify Checkout sessions');
assert(billingPortal.includes('/v1/billing_portal/sessions'),'billing portal does not create portal sessions');

console.log('Beat AI smoke tests passed');