
/* ===== Public Beta 1.0 RC1 · settlement/tip hotfix diagnostics ===== */
(function(){
  window.__OWL_PUBLIC_BETA_091_QA=()=>{
    const major=seasonState.v71LastMajorSummary||null;
    const tipCounts=[...document.querySelectorAll('.v800-context-tip[data-v800-tip]')].reduce((o,n)=>(o[n.dataset.v800Tip]=(o[n.dataset.v800Tip]||0)+1,o),{});
    const ids=[...document.querySelectorAll('[id]')].map(n=>n.id),dups=[...new Set(ids.filter((x,i)=>ids.indexOf(x)!==i))];
    let scoreOk=true;if(major?.finalScore){const [a,b]=major.finalScore.split(':').map(Number);scoreOk=Number.isFinite(a)&&Number.isFinite(b)&&a>b;}
    return{version:'Public Beta 1.0 RC1',majorScoreOk:scoreOk,major,tipCounts,duplicateIds:dups,majorTipHost:document.querySelector('.v800-context-tip[data-v800-tip="major"]')?.parentElement?.id||null};
  };
})();
