(()=>{
  const $=id=>document.getElementById(id);
  const sessionKey='beatAITeamSession',workspaceKey='beatAITeamWorkspace';
  const modal=$('companyModal');
  const getSession=()=>localStorage.getItem(sessionKey)||'';
  const setSession=v=>v?localStorage.setItem(sessionKey,v):localStorage.removeItem(sessionKey);
  const loadCache=()=>{try{return JSON.parse(localStorage.getItem(workspaceKey)||'null')}catch{return null}};
  const cache=w=>w&&localStorage.setItem(workspaceKey,JSON.stringify(w));
  const close=()=>modal?.classList.remove('open');
  const linkedinCopy=()=>`We’re testing Beat AI for Teams — private company leagues, department battles, weekly AI challenges and team leaderboards that make AI literacy feel like a competition instead of another training module.\n\nWould your team play this?\n\nhttps://beatai.games`;
  const authHeaders=()=>({'Content-Type':'application/json',...(getSession()?{Authorization:`Bearer ${getSession()}`}:{})});
  async function api(body){const r=await fetch('/api/teams',{method:'POST',headers:authHeaders(),body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw new Error(d.error||'Teams request failed');return d}
  async function refreshWorkspace(){const ws=loadCache();if(!ws?.id||!getSession())return ws;const r=await fetch('/api/teams?teamId='+encodeURIComponent(ws.id),{headers:{Authorization:`Bearer ${getSession()}`}});const d=await r.json();if(r.ok&&d.workspace){cache(d.workspace);renderWorkspace(d.workspace);return d.workspace}return ws}
  function memberDept(ws,m){return ws.departments?.find(d=>d.id===m.departmentId)?.name||'Unassigned'}
  function workspaceRole(){try{const raw=getSession().split('.')[0];return JSON.parse(atob(raw.replace(/-/g,'+').replace(/_/g,'/'))).role||'member'}catch{return'member'}}
  async function createWorkspace(){
    const company=($('companyName')?.value||'').trim(),size=$('companySize')?.value||'',dept=($('companyDepartment')?.value||'').trim();
    if(!company)return window.toast?.('Add a company or team name');
    try{const d=await api({action:'create',company,size,adminName:'You'});setSession(d.session);cache(d.workspace);if(dept)await addDepartment(dept);else renderWorkspace(d.workspace);window.toast?.('Private company league is live 🏢')}catch(e){window.toast?.(e.message)}
  }
  async function joinWorkspace(inviteCode){
    const name=prompt('Your name for the company leaderboard:');if(!name)return;const departmentName=prompt('Department (optional):')||'';
    try{const d=await api({action:'join',inviteCode,name,departmentName});setSession(d.session);cache(d.workspace);renderWorkspace(d.workspace);modal?.classList.add('open');window.toast?.(`Joined ${d.workspace.company} ⚔️`)}catch(e){window.toast?.(e.message)}
  }
  async function addDepartment(forced){const ws=loadCache();if(!ws)return;const name=(forced||$('newDepartment')?.value||'').trim();if(!name)return;try{const d=await api({action:'addDepartment',teamId:ws.id,name});cache(d.workspace);renderWorkspace(d.workspace);if($('newDepartment'))$('newDepartment').value=''}catch(e){window.toast?.(e.message)}}
  async function rotateInvite(){const ws=loadCache();if(!ws)return;try{const d=await api({action:'rotateInvite',teamId:ws.id});cache(d.workspace);renderWorkspace(d.workspace);window.toast?.('New invite code created')}catch(e){window.toast?.(e.message)}}
  async function inviteCopy(){const ws=await refreshWorkspace();if(!ws)return;const url=`https://beatai.games/?team_invite=${encodeURIComponent(ws.inviteCode)}`;const text=`Join ${ws.company} on Beat AI for Teams.\n${url}`;try{await navigator.clipboard.writeText(text);window.toast?.('Team invite copied')}catch{window.toast?.(text)}}
  async function teamCheckout(){const ws=loadCache();if(!ws)return;const raw=prompt('How many seats?',String(Math.max(10,ws.members?.length||10)));if(raw===null)return;try{const r=await fetch('/api/team-checkout',{method:'POST',headers:authHeaders(),body:JSON.stringify({teamId:ws.id,seats:Number(raw)||10})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Checkout failed');location.href=d.url}catch(e){window.toast?.(e.message)}}
  async function recordLatestRun(){
    const ws=loadCache();if(!ws?.id||!getSession())return;
    try{const marker=`${state?.start||0}:${state?.correct||0}:${state?.score||0}`;if(sessionStorage.getItem('beatAITeamRunSynced')===marker)return;sessionStorage.setItem('beatAITeamRunSynced',marker);const d=await api({action:'recordScore',teamId:ws.id,correct:state.correct,total:(state.roundLimit||state.marks?.length||5),points:Math.max(0,Math.round(state.score||0))});cache(d.workspace)}catch{}
  }
  function renderWorkspace(ws){
    const box=$('companyWorkspace');if(!box)return;box.hidden=false;$('companySetup')?.setAttribute('hidden','');
    $('workspaceCompany').textContent=ws.company;$('workspaceMeta').textContent=`Season ${ws.season||1} · ${ws.members?.length||0} members · Invite ${ws.inviteCode} · ${ws.billingStatus||'trial'}`;
    const weekly=ws.weekly||{};$('workspaceChallenge').innerHTML=`<b>${weekly.title||'Weekly AI Challenge'}</b><span>${weekly.questions||15} questions · shared company competition</span><strong>${weekly.crown?`👑 ${weekly.crown.name} ${weekly.crown.score}`:'Company Crown 👑'}</strong>`;
    $('departmentBoard').innerHTML=(ws.departments||[]).map((d,i)=>`<div class="team-row"><span>${i===0?'👑':'#'+(i+1)} <b>${d.name}</b><small>${d.members||0} member${d.members===1?'':'s'}</small></span><strong>${(d.points||0).toLocaleString()} pts</strong></div>`).join('')||'<div class="muted small">Add departments to start the rivalry.</div>';
    $('teamBoard').innerHTML=(ws.members||[]).map((m,i)=>`<div class="team-row"><span>${i===0?'🔥':'#'+(i+1)} <b>${m.name}</b><small>${memberDept(ws,m)} · ${m.role}</small></span><strong>${(m.points||0).toLocaleString()}</strong></div>`).join('');
    $('companyInterestNote').textContent=`${ws.company} league live · invite ${ws.inviteCode}`;$('companyInterestBtn').textContent='OPEN COMPANY LEAGUE →';
    const actions=$('companyWorkspace')?.querySelector('.workspace-actions');if(actions){const admin=workspaceRole()==='admin';actions.innerHTML=`<button class="secondary" id="copyTeamInvite">COPY TEAM INVITE</button>${admin?'<button class="secondary" id="rotateTeamInvite">ROTATE CODE</button><button class="secondary" id="teamBillingBtn">MANAGE TEAM PLAN</button>':''}`;$('copyTeamInvite')?.addEventListener('click',inviteCopy);$('rotateTeamInvite')?.addEventListener('click',rotateInvite);$('teamBillingBtn')?.addEventListener('click',teamCheckout);const add=$('addDepartmentBtn');if(add)add.hidden=!admin;const input=$('newDepartment');if(input)input.hidden=!admin}
  }
  async function hydrate(){const ws=loadCache();if(ws){renderWorkspace(ws);await refreshWorkspace()}else{$('companySetup')?.removeAttribute('hidden');if($('companyWorkspace'))$('companyWorkspace').hidden=true}}
  function open(){hydrate();modal?.classList.add('open')}
  $('companyInterestBtn')?.addEventListener('click',open);$('saveCompanyInterest')?.addEventListener('click',createWorkspace);$('copyCompanyLinkedIn')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(linkedinCopy());window.toast?.('LinkedIn post copied')}catch{window.toast?.('Could not copy post')}});$('addDepartmentBtn')?.addEventListener('click',()=>addDepartment());modal?.querySelector('[data-close]')?.addEventListener('click',close);modal?.addEventListener('click',e=>{if(e.target===modal)close()});
  const result=$('result');if(result)new MutationObserver(()=>{if(result.classList.contains('active'))recordLatestRun()}).observe(result,{attributes:true,attributeFilter:['class']});
  const invite=new URLSearchParams(location.search).get('team_invite');if(invite&&!getSession())setTimeout(()=>joinWorkspace(invite),500);hydrate();
})();