(function(){
  'use strict';
  const cfg=window.__OWL_FUTURE_RULES_CONFIG;
  OWLCore.register('league',{
    futureRules:()=>cfg,
    seasonFormat:year=>OWLCore.clone(cfg.seasonFormat(year)),
    postseason:year=>OWLCore.clone(cfg.postseason(year)),
    stageBounds:(stage,year)=>cfg.stageBounds(stage,year).slice(),
    specialEvents:year=>OWLCore.clone(cfg.specialEvents(year)),
    historicalRule:year=>typeof v762Rule==='function'?OWLCore.clone(v762Rule(year)):null,
    currentFormat:()=>Number(careerState?.seasonYear)>=2027?OWLCore.clone(cfg.seasonFormat(careerState.seasonYear)):(typeof v762Rule==='function'?OWLCore.clone(v762Rule(careerState?.seasonYear)):null),
    ensureExpansionTeams:year=>window.__OWL_V34_FUTURE?.ensureExpansionTeams?.(year)||[],
    standings:()=>OWLCore.clone(window.__OWL_V34_FUTURE?.standings?.()||[])
  },{domain:'league',managerReady:true,stability:'stable'});
})();
