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

for(const id of ['rating','lightningBtn','bossBtn','practiceBtn','friendBtn','impossibleBtn','feed','achievements','proBtn','upgradeBtn','midgameProBtn','manageBtn','share','sharePreview','challengeBanner','acceptChallengeBtn','companyCard','companyInterestBtn','companyModal','saveCompanyInterest','copyCompanyLinkedIn','companyWorkspace','workspaceCompany','workspaceMeta','workspaceChallenge','departmentBoard','teamBoard','copyTeamInvite','simulateTeamJoin','newDepartment','addDepartmentBtn'])assert(new RegExp(`id=["']${id}["']`).test(html),`missing UI hook: ${id}`);
for(const asset of ['/app.js','/infinite-replay.js','/teams.js','/social.js','/styles.css','/social.css'])assert(html.includes(asset),`asset not loaded: ${asset}`);
for(const token of ['og:title','og:image','twitter:card','summary_large_image','twitter:image'])assert(html.includes(token),`social preview metadata missing: ${token}`);
for(const token of ['beatai.games','Turn AI literacy into a team sport','CREATE PRIVATE LEAGUE','PRIVATE LEAGUE','Department battle','Team leaderboard','COPY TEAM INVITE'])assert(html.includes(token),`missing Teams page token: ${token}`);
assert(css.includes('.workspace-challenge')&&css.includes('.workspace-board')&&css.includes('.team-row')&&css.includes('.department-add'),'Teams workspace styles missing');
assert(socialCss.includes('.social-grid')&&socialCss.includes('.challenge-banner')&&socialCss.includes('.share-preview'),'social styles missing');

for(const hook of ['beginCheckout','verifySession','openPortal',"$('#proBtn').onclick=beginCheckout","$('#midgameProBtn').onclick=beginCheckout",'renderAchievements','renderSkills','openReward'])assert(app.includes(hook),`missing client behavior: ${hook}`);
new Function(app);new Function(replay);new Function(teams);new Function(social);

for(const token of ['/api/practice','beatAIRecentQuestions','difficulty()','avoid:recent()','crypto?.randomUUID'])assert(replay.includes(token),`missing infinite replay behavior: ${token}`);
for(const token of ['beatAIFreePacksUsed','FREE_PACK_LIMIT=3','FREE_PACK_ROUNDS=15','buildPack(3','roundLimit','freePacksLeft','consumeFreePack',"PLAY TODAY'S 15 →",'GO PRO — UNLOCK UNLIMITED →','PLAY A FRESH 15 →'])assert(replay.includes(token),`missing 15-question hero funnel behavior: ${token}`);
assert(practice.includes('OPENAI_API_KEY'),'practice generator missing OpenAI integration');
new Function('require','module','exports',practice);

for(const token of ['beatAITeamWorkspace','createWorkspace','inviteCode','Human vs Machine: Week 1','departments','Department','teamBoard','departmentBoard','copyTeamInvite','simulateTeamJoin','addDepartment','private company leagues','LinkedIn post copied'])assert(teams.includes(token),`missing company workspace behavior: ${token}`);
for(const network of ['twitter.com/intent/tweet','facebook.com/sharer/sharer.php','reddit.com/submit','wa.me/'])assert(social.includes(network),`missing social share target: ${network}`);
assert(shareCard.includes('image/svg+xml'),'share card does not return an image');
new Function('require','module','exports',shareCard);

assert(daily.includes('category'),'daily API lacks categories');
assert(daily.includes('aiTake'),'daily API lacks AI replay field');
for(const [name,source] of Object.entries({daily,practice,scores,checkout,billingStatus,billingPortal,shareCard})){new Function('require','module','exports',source);assert(source.includes('module.exports'),`${name} API has no handler export`)}
assert(checkout.includes('STRIPE_SECRET_KEY'),'checkout missing STRIPE_SECRET_KEY');
assert(checkout.includes('/v1/checkout/sessions'),'checkout does not call Stripe Checkout Sessions');
assert(billingStatus.includes('/v1/checkout/sessions/'),'billing status does not verify Checkout sessions');
assert(billingPortal.includes('/v1/billing_portal/sessions'),'billing portal does not create portal sessions');

console.log('Beat AI smoke tests passed');