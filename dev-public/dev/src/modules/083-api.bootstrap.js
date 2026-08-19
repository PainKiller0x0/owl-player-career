(function(){
  'use strict';
  const VER='Public Beta 1.9 RC22';
  const FULL='Public Beta 1.9 RC22 · Full Flow QA';
  OWLCore.version=VER;OWLCore.release=FULL;
  function sync(){
    document.title='OWL 选手之路 · Public Beta 1.9 RC22';
    document.querySelectorAll('.cover-version b').forEach(x=>x.textContent='PUBLIC BETA · 1.9 RC22');
    [...document.querySelectorAll('.setting-row')].forEach(r=>{if(r.querySelector('.setting-copy strong')?.textContent==='当前版本'){const box=r.lastElementChild;if(box)box.textContent=VER;}});
    if(window.__OWL_PUBLIC_BETA)window.__OWL_PUBLIC_BETA.version=VER;
    if(window.__OWL_WORLD_CUP)window.__OWL_WORLD_CUP.version=VER;
    if(window.__OWL_V34_FUTURE)window.__OWL_V34_FUTURE.version=VER;
    if(window.__OWL_V35_EXPANSION_WORLD)window.__OWL_V35_EXPANSION_WORLD.version=VER;
  }
  ['renderSeason','renderCareerHub','renderCareerTeam','renderSeasonSummary','renderMatch','renderOffseason','renderPlayoffs'].forEach(name=>{
    const fn=window[name];if(typeof fn!=='function'||fn.__owlRc18Wrapped)return;
    const wrapped=function(){const out=fn.apply(this,arguments);sync();return out;};wrapped.__owlRc18Wrapped=true;window[name]=wrapped;
  });
  window.__OWL_MODULAR_CORE={version:VER,contractVersion:OWLCore.contractVersion,modules:()=>OWLCore.list(),manager:()=>OWLCore.get('manager')};
  sync();
})();
