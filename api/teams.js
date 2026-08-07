const {getJson,setJson,del,id,code,sign,bearer,publicWorkspace}=require('./team-store');

const json=(res,status,body)=>res.status(status).setHeader('Content-Type','application/json').send(JSON.stringify(body));
const normalize=s=>String(s||'').trim().slice(0,80);
const teamKey=id=>`beat-ai:team:${id}`;
const inviteKey=c=>`beat-ai:invite:${c}`;
const now=()=>Date.now();

function authorize(req,teamId,admin=false){
  const session=bearer(req);
  if(!session||session.teamId!==teamId)return null;
  if(admin&&session.role!=='admin')return null;
  return session;
}
function recalc(workspace){
  workspace.members.sort((a,b)=>(b.points||0)-(a.points||0));
  workspace.departments.forEach(d=>{
    const members=workspace.members.filter(m=>m.departmentId===d.id);
    d.points=members.reduce((sum,m)=>sum+(m.points||0),0);
    d.members=members.length;
  });
  workspace.departments.sort((a,b)=>(b.points||0)-(a.points||0));
  workspace.updatedAt=now();
  return workspace;
}
async function save(workspace){recalc(workspace);await setJson(teamKey(workspace.id),workspace);return workspace}

module.exports=async(req,res)=>{
  try{
    if(req.method==='GET'){
      const teamId=normalize(req.query?.teamId);
      if(!teamId)return json(res,400,{error:'teamId required'});
      if(!authorize(req,teamId))return json(res,401,{error:'Unauthorized'});
      const w=await getJson(teamKey(teamId));
      return w?json(res,200,{workspace:publicWorkspace(recalc(w))}):json(res,404,{error:'Workspace not found'});
    }
    if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
    const b=req.body||{},action=normalize(b.action);

    if(action==='create'){
      const company=normalize(b.company),adminName=normalize(b.adminName||'Team Admin'),size=normalize(b.size||'2–10'),departmentName=normalize(b.departmentName);
      if(!company)return json(res,400,{error:'Company name required'});
      const teamId=id('team'),adminId=id('member'),invite=code();
      const firstDepartment=departmentName?{id:id('dept'),name:departmentName,points:0,members:1}:null;
      const workspace={id:teamId,company,size,season:1,inviteCode:invite,createdAt:now(),updatedAt:now(),billingStatus:'trial',billingSeatCount:0,departments:firstDepartment?[firstDepartment]:[],members:[{id:adminId,name:adminName,role:'admin',departmentId:firstDepartment?.id||null,points:0,correct:0,total:0,joinedAt:now()}],weekly:{title:'Weekly AI Challenge',questions:15,endsAt:now()+7*86400000,crown:null}};
      await save(workspace);await setJson(inviteKey(invite),teamId);
      const session=sign({teamId,memberId:adminId,role:'admin',exp:now()+30*86400000});
      return json(res,201,{workspace:publicWorkspace(workspace),session});
    }

    if(action==='join'){
      const inviteCode=normalize(b.inviteCode).toUpperCase(),name=normalize(b.name),departmentName=normalize(b.departmentName);
      if(!inviteCode||!name)return json(res,400,{error:'Invite code and name required'});
      const teamId=await getJson(inviteKey(inviteCode));
      if(!teamId)return json(res,404,{error:'Invite code not found'});
      const w=await getJson(teamKey(teamId));if(!w)return json(res,404,{error:'Workspace not found'});
      let departmentId=null;
      if(departmentName){let d=w.departments.find(x=>x.name.toLowerCase()===departmentName.toLowerCase());if(!d){d={id:id('dept'),name:departmentName,points:0,members:0};w.departments.push(d)}departmentId=d.id}
      const memberId=id('member');w.members.push({id:memberId,name,role:'member',departmentId,points:0,correct:0,total:0,joinedAt:now()});await save(w);
      const session=sign({teamId,memberId,role:'member',exp:now()+30*86400000});
      return json(res,200,{workspace:publicWorkspace(w),session});
    }

    const teamId=normalize(b.teamId);if(!teamId)return json(res,400,{error:'teamId required'});
    const w=await getJson(teamKey(teamId));if(!w)return json(res,404,{error:'Workspace not found'});

    if(action==='addDepartment'){
      if(!authorize(req,teamId,true))return json(res,403,{error:'Admin required'});
      const name=normalize(b.name);if(!name)return json(res,400,{error:'Department name required'});
      if(!w.departments.some(d=>d.name.toLowerCase()===name.toLowerCase()))w.departments.push({id:id('dept'),name,points:0,members:0});
      await save(w);return json(res,200,{workspace:publicWorkspace(w)});
    }
    if(action==='rotateInvite'){
      if(!authorize(req,teamId,true))return json(res,403,{error:'Admin required'});
      const old=w.inviteCode;w.inviteCode=code();await save(w);await del(inviteKey(old));await setJson(inviteKey(w.inviteCode),teamId);
      return json(res,200,{workspace:publicWorkspace(w)});
    }
    if(action==='removeMember'){
      const session=authorize(req,teamId,true);if(!session)return json(res,403,{error:'Admin required'});
      const memberId=normalize(b.memberId);if(memberId===session.memberId)return json(res,400,{error:'Admin cannot remove self'});
      w.members=w.members.filter(m=>m.id!==memberId);await save(w);return json(res,200,{workspace:publicWorkspace(w)});
    }
    if(action==='recordScore'){
      const session=authorize(req,teamId);if(!session)return json(res,401,{error:'Unauthorized'});
      const member=w.members.find(m=>m.id===session.memberId);if(!member)return json(res,404,{error:'Member not found'});
      const total=Math.max(1,Math.min(15,Math.floor(Number(b.total)||15)));
      const correct=Math.max(0,Math.min(total,Math.floor(Number(b.correct)||0)));
      const submitted=Math.max(0,Number(b.points)||correct*100);
      const points=Math.min(total*200,Math.round(submitted));
      member.correct+=correct;member.total+=total;member.points+=points;member.lastPlayedAt=now();
      if(correct===total)w.weekly.crown={memberId:member.id,name:member.name,score:`${correct}/${total}`,at:now()};
      await save(w);return json(res,200,{workspace:publicWorkspace(w)});
    }
    return json(res,400,{error:'Unknown action'});
  }catch(e){return json(res,500,{error:e.message||'Teams request failed'});}
};
