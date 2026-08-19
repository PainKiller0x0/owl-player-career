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

  function syncVersion(){
    document.title='OWL 选手之路 · Public Beta 1.9 RC22';
    document.querySelectorAll('.cover-version b').forEach(x=>x.textContent='PUBLIC BETA · 1.9 RC22');
    [...document.querySelectorAll('.setting-row')].forEach(r=>{
      if(r.querySelector('.setting-copy strong')?.textContent==='当前版本'){
        const box=r.lastElementChild;if(box)box.textContent=FULL;
      }
    });
    if(window.OWLCore){OWLCore.version=VER;OWLCore.release=FULL;}
    if(window.__OWL_PUBLIC_BETA)window.__OWL_PUBLIC_BETA.version=VER;
    if(window.__OWL_WORLD_CUP)window.__OWL_WORLD_CUP.version=VER;
  }

  const baseSummary=renderSeasonSummary;
  renderSeasonSummary=function(){
    const out=baseSummary.apply(this,arguments);
    compactSeasonSummaryActions();syncVersion();return out;
  };
  const baseOffseason=renderOffseason;
  renderOffseason=function(){const out=baseOffseason.apply(this,arguments);syncVersion();return out;};
  const baseCareer=renderCareerHub;
  renderCareerHub=function(){const out=baseCareer.apply(this,arguments);syncVersion();return out;};

  syncVersion();
  window.__OWL_V22_FULL_FLOW_QA=Object.freeze({version:VER,release:FULL,compactSeasonSummaryActions});
})();
