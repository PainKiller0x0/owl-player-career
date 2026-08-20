/* ===== Public Beta 1.9 RC22 · Full-flow QA fixes ===== */
(function(){
  'use strict';
  const VER='Public Beta 1.9 RC22';
  const FULL='Public Beta 1.9 RC22 · Full Flow QA';

  function compactSeasonSummaryActions(){
    const host=document.querySelector('#summaryScreen .summary-bottom-actions');
    if(!host)return false;
    const brief=host.querySelector('.v20-summary-brief');
    const primary=document.getElementById('summaryOffseasonBtn');
    const archive=document.getElementById('v20CareerArchiveBtn');
    const footer=document.getElementById('summaryFooterCopy');
    if(!brief||!primary||!archive)return false;

    let actions=host.querySelector('.v22-summary-side-actions');
    if(!actions){
      actions=document.createElement('div');
      actions.className='v22-summary-side-actions';
      brief.insertAdjacentElement('afterend',actions);
    }
    if(primary.parentElement!==actions)actions.appendChild(primary);
    if(archive.parentElement!==actions)actions.appendChild(archive);
    if(footer?.parentElement===host)host.appendChild(footer);
    host.classList.add('v22-summary-compact');
    return true;
  }

  const baseSummary=renderSeasonSummary;
  renderSeasonSummary=function(){
    const out=baseSummary.apply(this,arguments);
    compactSeasonSummaryActions();return out;
  };
  window.__OWL_V22_FULL_FLOW_QA=Object.freeze({version:VER,release:FULL,compactSeasonSummaryActions});
})();
