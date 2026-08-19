
(function(){
  const _v765RenderSeasonBase = renderSeason;
  renderSeason = function(){
    _v765RenderSeasonBase();
    try {
      const y=Number(careerState.seasonYear||2019);
      if(y >= 2020 && y <= 2023){
        document.querySelectorAll('#seasonScreen .v42-stage-result-card').forEach(n=>n.remove());
      }
    } catch(e) {
      console.warn('[V7.6.5] legacy stage result cleanup skipped:', e);
    }
  };
  window.__OWL_V765_DIAGNOSTICS = function(){
    const cards=[...document.querySelectorAll('#seasonScreen .v42-stage-result-card')];
    return {
      version:'7.6.5',
      year: Number(careerState.seasonYear||2019),
      legacyStageCards: cards.length,
      stageCardTitles: cards.map(x=>x.querySelector('h3')?.textContent||'')
    };
  };
})();
