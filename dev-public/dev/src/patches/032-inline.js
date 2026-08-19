
(function(){
  const V766_VERSION='V7.6.6';
  const _v766SetupSeason = setupSeason;
  setupSeason = function(isRestart=false){
    const result = _v766SetupSeason(isRestart);
    seasonState.boundSeasonYear = Number(careerState.seasonYear||2019);
    return result;
  };

  function v766PrepareCurrentSeason(){
    const year=Number(careerState.seasonYear||careerState.startYear||2019);
    if(!careerState.team) return false;
    if(seasonState.timer) clearTimeout(seasonState.timer);
    seasonState.timer=null;
    seasonState.simulating=false;
    seasonState.resumeFastAfterEvent=false;
    seasonState.resumeWholeAfterEvent=false;
    seasonState.stageBreakPending=null;
    seasonState.currentEvent=null;
    seasonState.eventDue=false;
    seasonState.active=false;
    if(document.getElementById('seasonEventOverlay')) document.getElementById('seasonEventOverlay').classList.add('hidden');
    const decision=document.getElementById('decisionOverlay');
    if(decision) decision.classList.add('hidden');
    if(typeof resetPlayoffState==='function') resetPlayoffState();
    if(typeof v50ApplySeasonWorld==='function') v50ApplySeasonWorld(year);
    _v766SetupSeason(false);
    seasonState.boundSeasonYear=year;
    renderSeason();
    showScreen('season');
    return true;
  }

  const startBtn=document.getElementById('startSeasonBtn');
  if(startBtn){
    startBtn.addEventListener('click',function(e){
      e.preventDefault();
      e.stopImmediatePropagation();
      const year=Number(careerState.seasonYear||careerState.startYear||2019);
      const bound=Number(seasonState.boundSeasonYear||0);
      // 只要赛季状态不是“当前年份已经初始化完成”，就重新建立当前赛季。
      // 这样即使旧状态把 active 错留成 true，也不会把上一年的赛程带进来。
      if(!seasonState.active || bound!==year){
        v766PrepareCurrentSeason();
      }else{
        renderSeason();
        showScreen('season');
      }
    },true);
  }

  window.__OWL_V766_DIAGNOSTICS=()=>({
    version:V766_VERSION,
    year:Number(careerState.seasonYear||2019),
    active:!!seasonState.active,
    boundSeasonYear:Number(seasonState.boundSeasonYear||0),
    total:Number(seasonState.total||0),
    played:Number(seasonState.played||0),
    screen:document.querySelector('.screen.active')?.id||null,
    startButton:document.getElementById('startSeasonBtn')?.textContent||null
  });
})();
