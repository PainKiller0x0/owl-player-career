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

  const baseOffseason=renderOffseason;
  renderOffseason=function(){
    const out=baseOffseason.apply(this,arguments);
    arrangeMarketProfile();return out;
  };
  window.__OWL_V21_FLOW_UI=Object.freeze({version:VER,release:FULL,arrangeMarketProfile});
})();
