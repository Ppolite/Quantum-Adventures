(()=>{
  function byId(id){return document.getElementById(id)}
  function openTeamModal(){
    const modal=byId('companyModal');
    if(!modal)return;
    modal.hidden=false;
    modal.classList.add('open','show');
    modal.setAttribute('aria-hidden','false');
    Object.assign(modal.style,{display:'grid',position:'fixed',inset:'0',zIndex:'9999',placeItems:'center',background:'rgba(3,6,12,.78)',backdropFilter:'blur(10px)',overflowY:'auto',padding:'18px'});
    const sheet=modal.querySelector('.sheet');
    if(sheet)Object.assign(sheet.style,{display:'block',maxHeight:'90vh',overflowY:'auto',width:'min(100%,680px)'});
  }
  function closeTeamModal(){
    const modal=byId('companyModal');
    if(!modal)return;
    modal.classList.remove('open','show');
    modal.setAttribute('aria-hidden','true');
    modal.style.display='none';
  }
  function wire(){
    const btn=byId('companyInterestBtn');
    if(btn){btn.type='button';btn.onclick=(e)=>{e.preventDefault();e.stopPropagation();openTeamModal()}}
    const modal=byId('companyModal');
    modal?.querySelectorAll('[data-close]').forEach(x=>x.addEventListener('click',closeTeamModal));
    modal?.addEventListener('click',e=>{if(e.target===modal)closeTeamModal()});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
  document.addEventListener('click',e=>{const hit=e.target?.closest?.('#companyInterestBtn');if(hit){e.preventDefault();openTeamModal()}},true);
})();
