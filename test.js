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
const teamsApi=read('api/teams.js');
const teamStore=read('api/team-store.js');
const teamCheckout=read('api/team-checkout.js');

for(const id of ['rating','lightningBtn','bossBtn','practiceBtn','friendBtn','impossibleBtn','feed','achievements','proBtn','upgradeBtn','midgameProBtn','manageBtn','share','sharePreview','challengeBanner','acceptChallengeBtn','companyCard','companyInterestBtn','companyModal','saveCompanyInterest','copyCompanyLinkedIn','companyWorkspace','workspaceCompany','workspaceMeta','workspaceChallenge','departmentBoard','teamBoard','newDepartment','addDepartmentBtn'])assert(new RegExp(`id=["']${id}["']`).test(html),`missing UI hook: ${id}`);
for(const asset of ['/app.js','/infinite-replay.js','/teams.js','/social.js','/styles.css','/social.css'])assert(html.includes(asset),`asset not loaded: ${asset}`);
for(const token of ['One fresh 15-question daily pack. Prove it.',"PLAY TODAY'S 15 →",'hero-rival','hero-bot-head','visual-modes','mode-lightning','mode-boss','mode-pack','mode-friend','cinematic-card','city-art','Turn AI literacy into a team sport','CREATE PRIVATE LEAGUE','SHARED PRIVATE LEAGUE','Department battle','Team leaderboard'])assert(html.includes(token),`missing juiced homepage/Teams token: ${token}`);
assert(!html.includes('Five fast daily questions plus three free 15-question fresh packs'),'old mixed 5 + 3x15 hero copy still present');
for(const token of ['.hero-juiced','.hero-rival','.hero-bot-head','.visual-modes','.mode-lightning','.mode-boss','.mode-pack','.mode-friend','.cinematic-card','.city-art','.workspace-challenge','.workspace-board','.team-row','.department-add'])assert(css.includes(token),`missing homepage/Teams style: ${token}`);
assert(socialCss.includes('.social-grid')&&socialCss.includes('.challenge-banner')&&socialCss.includes('.share-preview'),'social styles missing');

for(const hook of ['beginCheckout','verifySession','openPortal',"$('#proBtn').onclick=beginCheckout","$('#midgameProBtn').onclick=beginCheckout",'renderAchievements','renderSkills','openReward'])assert(app.includes(hook),`missing client behavior: ${hook}`);
new Function(app);new Function(replay);new Function(teams);new Function(social);

for(const token of ['/api/practice','beatAIRecentQuestions','difficulty()','avoid:recent()','crypto?.randomUUID'])assert(replay.includes(token),`missing infinite replay behavior: ${token}`);
for(const token of ['beatAIFreePacksUsed','FREE_PACK_LIMIT=3','FREE_PACK_ROUNDS=15','buildPack(3','roundLimit','freePacksLeft','consumeFreePack',"PLAY TODAY'S 15 →",'GO PRO — UNLOCK UNLIMITED →','PLAY A FRESH 15 →'])assert(replay.includes(token),`missing 15-question hero funnel behavior: ${token}`);
assert(practice.includes('OPENAI_API_KEY'),'practice generator missing OpenAI integration');
new Function('require','module','exports',practice);

for(const token of ['beatAITeamSession','beatAITeamWorkspace','/api/teams','action:\'create\'','action:\'join\'','action:\'recordScore\'','team_invite','/api/team-checkout','MANAGE TEAM PLAN','recordLatestRun','copyTeamInvite','rotateInvite','addDepartment','private company leagues','LinkedIn post copied'])assert(teams.includes(token),`missing persistent Teams client behavior: ${token}`);
for(const token of ['action===\'create\'','action===\'join\'','action===\'addDepartment\'','action===\'rotateInvite\'','action===\'removeMember\'','action===\'recordScore\'','Admin required','weekly.crown'])assert(teamsApi.includes(token),`missing Teams API behavior: ${token}`);
for(const token of ['KV_REST_API_URL','UPSTASH_REDIS_REST_URL','TEAM_AUTH_SECRET','createHmac','timingSafeEqual','publicWorkspace'])assert(teamStore.includes(token),`missing Teams store/security behavior: ${token}`);
for(const token of ['STRIPE_SECRET_KEY','STRIPE_TEAM_PRICE_ID','subscription','metadata[team_id]','line_items[0][quantity]'])assert(teamCheckout.includes(token),`missing Teams billing behavior: ${token}`);
for(const source of [teamsApi,teamStore,teamCheckout])new Function('require','module','exports',source);

for(const network of ['twitter.com/intent/tweet','facebook.com/sharer/sharer.php','reddit.com/submit','wa.me/'])assert(social.includes(network),`missing social share target: ${network}`);
assert(shareCard.includes('image/svg+xml'),'share card does not return an image');
new Function('require','module','exports',shareCard);

assert(daily.includes('category'),'daily API lacks categories');
assert(daily.includes('aiTake'),'daily API lacks AI replay field');
for(const [name,source] of Object.entries({daily,practice,scores,checkout,billingStatus,billingPortal,shareCard,teamsApi,teamStore,teamCheckout})){new Function('require','module','exports',source);assert(source.includes('module.exports'),`${name} API has no handler export`)}
assert(checkout.includes('STRIPE_SECRET_KEY'),'checkout missing STRIPE_SECRET_KEY');
assert(checkout.includes('/v1/checkout/sessions'),'checkout does not call Stripe Checkout Sessions');
assert(billingStatus.includes('/v1/checkout/sessions/'),'billing status does not verify Checkout sessions');
assert(billingPortal.includes('/v1/billing_portal/sessions'),'billing portal does not create portal sessions');

console.log('Beat AI smoke tests passed');