/* OWL Alpha1 Batch 2 · repair the 2027+ regular-awards entry point */
(() => {
  'use strict';

  function owl93OpenRegularAwards(){
    const played=Number(seasonState?.played||0),total=Number(seasonState?.total||0);
    if(total&&played<total)return;
    const pending=Number(seasonState?.stageBreakPending||0),processed=(seasonState?.stageProcessed||[]).map(Number);
    if(pending&&!processed.includes(pending)){renderSeason();showScreen('season');return;}
    seasonState.awardsViewed=true;
    renderRegularSeasonAwards();
    showScreen('awards');
  }

  // 2027+ moves the final card into the primary action slot after rendering.
  // Delegate at capture phase so the moved button always reaches the same flow.
  document.addEventListener('click',e=>{
    const btn=e.target?.closest?.('#viewRegularAwardsBtn');
    if(!btn||Number(seasonState?.played||0)<Number(seasonState?.total||0))return;
    e.preventDefault();
    e.stopImmediatePropagation();
    owl93OpenRegularAwards();
  },true);
})();
