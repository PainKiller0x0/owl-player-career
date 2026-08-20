/* ======================================================================
   Public Beta 1.9 RC11 · Long-Career Experience Cleanup
   - remove the obsolete Career Archive -> Offseason route
   - trim repeated implementation/explanatory copy from high-frequency screens
   - fix stale retirement/archive wording
   - keep rules, costs, conditions and decision-relevant information intact
   ====================================================================== */
(function(){
  const VER='Public Beta 1.9 RC11';

  function trimStatic31(){
    // Career Archive is now archive-only. Offseason has its own direct flow.
    document.querySelector('[data-career-tab="offseason"]')?.remove();
    const back=document.getElementById('backRetirementDecisionBtn');
    if(back)back.textContent='← 返回退役总览';
    const footer=document.getElementById('summaryFooterCopy');
    if(footer)footer.textContent='';

    // Cover guide: the settings button is already permanently visible.
    const guide=document.getElementById('coverGuide');
    if(guide){
      [...guide.querySelectorAll('p')].forEach(p=>{
        if(/日夜主题|开发者模式.*设置/.test(p.textContent||''))p.remove();
      });
    }
  }

  // Archive should never reopen the removed offseason route, including old saves/UI state.
  const _openCareer31=openCareerHub;
  openCareerHub=function(tab='overview',allowRetired=false){
    return _openCareer31.call(this,tab==='offseason'?'overview':tab,allowRetired);
  };
  const _tab31=setCareerTab;
  setCareerTab=function(tab){return _tab31.call(this,tab==='offseason'?'overview':tab);};
  const _hub31=renderCareerHub;
  renderCareerHub=function(){
    if(careerViewState.tab==='offseason')careerViewState.tab='overview';
    const out=_hub31.apply(this,arguments);
    trimStatic31();
    return out;
  };

  // High-frequency match copy: say what the player needs to do, not how the system records it.
  const _nextMatch31=openNextSeasonMatch;
  openNextSeasonMatch=function(){
    const out=_nextMatch31.apply(this,arguments);
    if(document.querySelector('.screen.active')?.id==='matchScreen'&&matchState.context==='regular'){
      const d=document.getElementById('matchDesc');
      if(d)d.textContent='比赛会在关键团战暂停，由你做决定。';
    }
    return out;
  };

  const _playoffs31=renderPlayoffs;
  renderPlayoffs=function(){
    const out=_playoffs31.apply(this,arguments);
    const note=document.getElementById('playoffModeNote');
    if(note&&gameSettings.matchDetailsUnlocked&&!/季后赛已经结束/.test(note.textContent||''))note.textContent='每轮可选择快速结算或比赛详情。';
    return out;
  };

  // Historical roster changes are useful; implementation details about OVR recalculation are not.
  const _sign31=renderSigningComplete;
  renderSigningComplete=function(wrap){
    const out=_sign31.apply(this,arguments);
    const card=wrap?.querySelector?.('.v50-roster-transition');
    if(card){
      const p=card.querySelector('p');
      if(p&&/OVR|重新估值|世界模拟结果|动态AI世界/.test(p.textContent||'')){
        p.textContent=Number(careerState.seasonYear)<=2023
          ?`阵容已切换为 ${careerState.seasonYear} 赛季名单。`
          :'新赛季阵容已经确定。';
      }
    }
    return out;
  };

  // Copy cleanup is applied in the source modules; this final patch only handles flow migration/version sync.

  trimStatic31();
  ['renderSeason','renderSeasonSummary','renderCareerTeam','renderMatch'].forEach(name=>window.__OWL_RUNTIME?.render?.register(name,'v31-static-trim',trimStatic31));

  window.__OWL_V25_UX={version:VER};
})();
