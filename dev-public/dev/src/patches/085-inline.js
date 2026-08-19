/* ===== Public Beta 1.9 RC22 · Career Flow & UI Fixes ===== */
(function(){
  'use strict';
  const VER='Public Beta 1.9 RC22';
  const FULL='Public Beta 1.9 RC22 · Career Flow & UI Fixes';

  function arrangeMarketProfile(){
    if(offseasonState?.phase!=='market')return;
    const wrap=document.getElementById('offseasonContent');if(!wrap)return;
    const hero=wrap.querySelector('.v772-personal-hero-market');
    const self=wrap.querySelector('.v16-market-self');
    const offers=wrap.querySelector('.offers-grid');
    if(!hero||!self||!offers)return;
    let row=wrap.querySelector('.v21-market-profile-row');
    if(!row){row=document.createElement('div');row.className='v21-market-profile-row';wrap.insertBefore(row,offers);}
    if(hero.parentElement!==row)row.appendChild(hero);
    if(self.parentElement!==row)row.appendChild(self);
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

  const baseOffseason=renderOffseason;
  renderOffseason=function(){
    const out=baseOffseason.apply(this,arguments);
    arrangeMarketProfile();syncVersion();return out;
  };
  const baseCareer=renderCareerHub;
  renderCareerHub=function(){const out=baseCareer.apply(this,arguments);syncVersion();return out;};
  const basePlayoffs=renderPlayoffs;
  renderPlayoffs=function(){const out=basePlayoffs.apply(this,arguments);syncVersion();return out;};
  const baseSeason=renderSeason;
  renderSeason=function(){const out=baseSeason.apply(this,arguments);syncVersion();return out;};

  syncVersion();
  window.__OWL_V21_FLOW_UI=Object.freeze({version:VER,release:FULL,arrangeMarketProfile});
})();
