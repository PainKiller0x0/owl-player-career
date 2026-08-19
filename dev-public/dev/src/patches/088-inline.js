/* ===== Public Beta 1.9 RC25 · All-Star Details ===== */
(function(){
  'use strict';
  const VER='Public Beta 1.9 RC25';
  const FULL='Public Beta 1.9 RC25 · All-Star Details';
  function syncVersion(){
    document.title='OWL 选手之路 · Public Beta 1.9 RC25';
    document.querySelectorAll('.cover-version b').forEach(x=>x.textContent='PUBLIC BETA · 1.9 RC25');
    [...document.querySelectorAll('.setting-row')].forEach(r=>{
      if(r.querySelector('.setting-copy strong')?.textContent==='当前版本'){
        const box=r.lastElementChild;if(box)box.textContent=FULL;
      }
    });
    if(window.OWLCore){OWLCore.version=VER;OWLCore.release=FULL;}
    if(window.__OWL_PUBLIC_BETA){window.__OWL_PUBLIC_BETA.version=VER;window.__OWL_PUBLIC_BETA.release=FULL;}
    if(window.__OWL_WORLD_CUP)window.__OWL_WORLD_CUP.version=VER;
  }
  ['renderContractMarket','setupSeason','renderSeason','renderOffseason','renderSeasonSummary','renderCareerHub','renderRetirementScreen'].forEach(name=>{
    const base=globalThis[name];if(typeof base!=='function')return;
    globalThis[name]=function(){const out=base.apply(this,arguments);syncVersion();return out;};
  });
  syncVersion();
  window.__OWL_V25_ALLSTAR_DETAILS=Object.freeze({version:VER,release:FULL,syncVersion});
})();
