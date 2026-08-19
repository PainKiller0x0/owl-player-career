/* ===== Public Beta 1.9 RC22 · Contract Card UX ===== */
(function(){
  'use strict';
  const VER='Public Beta 1.9 RC22';
  const FULL='Public Beta 1.9 RC22 · Contract Card UX';

  function integrateOfferCards(wrap){
    if(!wrap)return;
    wrap.querySelectorAll('.offer-roster-btn').forEach(btn=>{btn.textContent='📄 查看合同';btn.classList.add('v21-offer-contract-btn');});
    if(!offseasonState?.contractExpired)return;
    wrap.querySelectorAll('.offer-card-shell').forEach((shell,index)=>{
      const card=shell.querySelector(':scope > .offer-card');
      const detail=shell.querySelector(':scope > .v19-offer-details');
      const roster=shell.querySelector(':scope > .offer-roster-btn, :scope > .v21-offer-card-actions > .offer-roster-btn');
      if(!card||!detail||!roster)return;
      shell.classList.add('v21-offer-card-shell');
      detail.classList.add('v21-offer-detail-panel');
      detail.open=false;
      let actions=shell.querySelector(':scope > .v21-offer-card-actions');
      if(!actions){
        actions=document.createElement('div');
        actions.className='v21-offer-card-actions';
        shell.insertBefore(actions,detail);
      }
      let detailBtn=actions.querySelector('.v21-offer-detail-btn');
      if(!detailBtn){
        detailBtn=document.createElement('button');
        detailBtn.type='button';
        detailBtn.className='secondary-btn v21-offer-detail-btn';
        detailBtn.textContent='ⓘ 详细信息';
        detailBtn.setAttribute('aria-expanded','false');
        detailBtn.addEventListener('click',e=>{
          e.preventDefault();e.stopPropagation();
          detail.open=!detail.open;
          detailBtn.setAttribute('aria-expanded',detail.open?'true':'false');
          detailBtn.textContent=detail.open?'收起详细信息':'ⓘ 详细信息';
        });
        actions.appendChild(detailBtn);
      }
      roster.textContent='📄 查看合同';
      roster.classList.add('v21-offer-contract-btn');
      actions.appendChild(roster);
      detail.id=detail.id||`v21OfferDetail${index}`;
      detailBtn.setAttribute('aria-controls',detail.id);
    });
  }

  const baseMarket=renderContractMarket;
  renderContractMarket=function(wrap){
    const out=baseMarket.apply(this,arguments);
    integrateOfferCards(wrap);
    syncVersion();
    return out;
  };

  function syncVersion(){
    document.title='OWL 选手之路 · Public Beta 1.9 RC22';
    document.querySelectorAll('.cover-version b').forEach(x=>x.textContent='PUBLIC BETA · 1.9 RC22');
    [...document.querySelectorAll('.setting-row')].forEach(r=>{
      if(r.querySelector('.setting-copy strong')?.textContent==='当前版本'){
        const box=r.lastElementChild;if(box)box.textContent=FULL;
      }
    });
    if(window.__OWL_PUBLIC_BETA)window.__OWL_PUBLIC_BETA.version=VER;
    if(window.__OWL_WORLD_CUP)window.__OWL_WORLD_CUP.version=VER;
  }

  const baseSeason=renderSeason;
  renderSeason=function(){const out=baseSeason.apply(this,arguments);syncVersion();return out;};
  syncVersion();
  window.__OWL_V21_CONTRACT_UX=Object.freeze({version:VER,integrate:integrateOfferCards});
})();
