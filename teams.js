(()=>{
  const $=id=>document.getElementById(id);
  const key='beatAITeamWorkspace';
  const modal=$('companyModal');
  const open=()=>{hydrate();modal?.classList.add('open')};
  const close=()=>modal?.classList.remove('open');
  const load=()=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
  const save=v=>localStorage.setItem(key,JSON.stringify(v));
  const code=()=>Math.random().toString(36).slice(2,8).toUpperCase();
  const sampleMembers=['Avery','Jordan','Maya','Chris','Taylor','Morgan'];
  const linkedinCopy=()=>`We’re testing Beat AI for Teams — private company leagues, department battles, weekly AI challenges and team leaderboards that make AI literacy feel like a competition instead of another training module.\n\nWould your team play this?\n\nhttps://beatai.games`;

  function createWorkspace(){
    const company=($('companyName')?.value||'').trim();
    const size=$('companySize')?.value||'';
    const dept=($('companyDepartment')?.value||'').trim()||'General';
    if(!company){window.toast?.('Add a company or team name');return;}
    const ws={company,size,inviteCode:code(),season:1,department:dept,createdAt:Date.now(),members:[{name:'You',dept,score:980,weekly:1240},{name:'Maya',dept:'Marketing',score:944,weekly:1160},{name:'Jordan',dept:'Operations',score:921,weekly:1080}],departments:[dept,'Marketing','Operations'].filter((v,i,a)=>a.indexOf(v)===i),challenge:{title:'Human vs Machine: Week 1',rounds:15,endsIn:'4d 8h',reward:'Company Crown 👑'}};
    save(ws);renderWorkspace(ws);window.toast?.('Company league created 🏢');
  }
  function addDepartment(){const ws=load();if(!ws)return;const d=($('newDepartment')?.value||'').trim();if(!d)return;ws.departments=ws.departments||[];if(!ws.departments.includes(d))ws.departments.push(d);save(ws);renderWorkspace(ws);$('newDepartment').value='';}
  function inviteCopy(){const ws=load();if(!ws)return;const text=`Join ${ws.company} on Beat AI for Teams. Invite code: ${ws.inviteCode}\nhttps://beatai.games`;
    navigator.clipboard?.writeText(text).then(()=>window.toast?.('Team invite copied')).catch(()=>window.toast?.(text));}
  function simulateInvite(){const ws=load();if(!ws)return;const n=sampleMembers[(ws.members?.length||0)%sampleMembers.length];ws.members.push({name:n,dept:ws.departments[(ws.members.length)%ws.departments.length]||'General',score:880+Math.floor(Math.random()*120),weekly:900+Math.floor(Math.random()*400)});save(ws);renderWorkspace(ws);window.toast?.(`${n} joined the league`);}
  function renderWorkspace(ws){
    const box=$('companyWorkspace');if(!box)return;
    box.hidden=false;
    $('companySetup')?.setAttribute('hidden','');
    $('workspaceCompany').textContent=ws.company;
    $('workspaceMeta').textContent=`Season ${ws.season} · ${ws.members.length} members · Invite ${ws.inviteCode}`;
    $('workspaceChallenge').innerHTML=`<b>${ws.challenge.title}</b><span>${ws.challenge.rounds} questions · ends ${ws.challenge.endsIn}</span><strong>${ws.challenge.reward}</strong>`;
    const deptTotals=(ws.departments||[]).map(d=>{const m=ws.members.filter(x=>x.dept===d);return{dept:d,score:m.reduce((a,x)=>a+(x.weekly||0),0),members:m.length}}).sort((a,b)=>b.score-a.score);
    $('departmentBoard').innerHTML=deptTotals.map((d,i)=>`<div class="team-row"><span>${i===0?'👑':'#'+(i+1)} <b>${d.dept}</b><small>${d.members} member${d.members===1?'':'s'}</small></span><strong>${d.score.toLocaleString()} pts</strong></div>`).join('');
    $('teamBoard').innerHTML=[...ws.members].sort((a,b)=>b.weekly-a.weekly).map((m,i)=>`<div class="team-row"><span>${i===0?'🔥':'#'+(i+1)} <b>${m.name}</b><small>${m.dept}</small></span><strong>${m.weekly.toLocaleString()}</strong></div>`).join('');
    $('companyInterestNote').textContent=`${ws.company} league ready · invite code ${ws.inviteCode}`;
    $('companyInterestBtn').textContent='OPEN COMPANY LEAGUE →';
  }
  function hydrate(){const ws=load();if(ws){renderWorkspace(ws);$('companySetup')?.setAttribute('hidden','')}else{$('companySetup')?.removeAttribute('hidden');if($('companyWorkspace'))$('companyWorkspace').hidden=true}}

  $('companyInterestBtn')?.addEventListener('click',open);
  $('saveCompanyInterest')?.addEventListener('click',createWorkspace);
  $('copyCompanyLinkedIn')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(linkedinCopy());window.toast?.('LinkedIn post copied')}catch{window.toast?.('Could not copy post')}});
  $('copyTeamInvite')?.addEventListener('click',inviteCopy);
  $('simulateTeamJoin')?.addEventListener('click',simulateInvite);
  $('addDepartmentBtn')?.addEventListener('click',addDepartment);
  modal?.querySelector('[data-close]')?.addEventListener('click',close);
  modal?.addEventListener('click',e=>{if(e.target===modal)close()});
  hydrate();
})();