
/* ===== V7.7.0 QA REFACTOR · Authoritative season milestone actions ===== */
(function(){
  const VER='7.7.0';
  function y(){return Number(careerState.seasonYear||2019)}
  function currentStage(){return Number(seasonState.stageBreakPending||0)}
  function resolveCurrentStage(){
    const s=currentStage(); if(!s)return false;
    // 2020-2023: result screen is an explicit interactive stop; keep the flag local to the authoritative action.
    if(y()>=2020&&y()<=2023)seasonState.v769InteractiveTournamentResolve=true;
    const q=!!stageQualified(s);
    q?simulateStagePlayoff(s):skipStageBreak(s);
    return true;
  }
  function continueHistorical(){
    seasonState.v769TournamentResultPending=null;
    renderSeason();
  }
  // One delegated action router. Milestone cards are frequently moved/rebuilt by legacy renderers;
  // therefore critical buttons must not depend on node-bound listeners surviving DOM replacement.
  document.addEventListener('click',function(e){
    const resolve=e.target.closest?.('#resolveStageBreakBtn');
    if(resolve){
      e.preventDefault(); e.stopImmediatePropagation();
      resolveCurrentStage();
      return;
    }
    const cont=e.target.closest?.('#v769ContinueHistoricalTournament');
    if(cont){
      e.preventDefault(); e.stopImmediatePropagation();
      continueHistorical();
      return;
    }
  },true);
  window.__OWL_V770_DIAGNOSTICS=()=>({
    version:VER,year:y(),played:Number(seasonState.played||0),total:Number(seasonState.total||0),
    stageBreakPending:seasonState.stageBreakPending||null,tournamentResultPending:seasonState.v769TournamentResultPending||null,
    primaryCards:document.querySelectorAll('#v768SeasonPrimaryAction .stage-break-card,#v768SeasonPrimaryAction .season-complete-banner').length,
    outsideCards:[...document.querySelectorAll('#seasonScreen .stage-break-card,#seasonScreen .season-complete-banner')].filter(n=>!document.getElementById('v768SeasonPrimaryAction')?.contains(n)).length,
    resolveButtons:document.querySelectorAll('#resolveStageBreakBtn').length
  });
})();
