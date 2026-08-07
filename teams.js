(()=>{
  const $=id=>document.getElementById(id);
  const modal=$('companyModal');
  const open=()=>modal?.classList.add('open');
  const close=()=>modal?.classList.remove('open');
  const linkedinCopy=()=>`We’re testing a fun new idea: Beat AI for Teams — private company leagues, department battles, weekly AI challenges and team leaderboards designed to make AI literacy and critical thinking feel like a competition instead of another training module.\n\nWould your team play this?\n\nhttps://quantum-adventures.vercel.app`;

  $('companyInterestBtn')?.addEventListener('click',open);
  $('saveCompanyInterest')?.addEventListener('click',()=>{
    const company=($('companyName')?.value||'').trim();
    const size=$('companySize')?.value||'';
    if(!company){window.toast?.('Add a company or team name');return;}
    const interest={company,size,createdAt:Date.now(),source:'beat-ai-web'};
    localStorage.setItem('beatAICompanyInterest',JSON.stringify(interest));
    close();
    window.toast?.('Team interest saved 🏢');
  });
  $('copyCompanyLinkedIn')?.addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(linkedinCopy());window.toast?.('LinkedIn post copied');}
    catch{window.toast?.('Could not copy post');}
  });
  modal?.querySelector('[data-close]')?.addEventListener('click',close);
  modal?.addEventListener('click',e=>{if(e.target===modal)close();});
})();