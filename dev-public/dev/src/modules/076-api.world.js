(function(){
  'use strict';
  function roster(short,year){
    if(window.__OWL_V35_EXPANSION_WORLD&&Number(year)>=2035)return OWLCore.clone(window.__OWL_V35_EXPANSION_WORLD.roster(short,year));
    try{return OWLCore.clone((v50RosterEntriesFor(TEAMS.find(t=>t.short===short),year)||[]).map(e=>Array.isArray(e)?{name:e[0],role:e[1],ovr:e[2]}:e));}catch(_){return[];}
  }
  OWLCore.register('world',{
    ensure:year=>OWLCore.clone(typeof v60EnsureWorldToYear==='function'?v60EnsureWorldToYear(Number(year)):null),
    roster,
    expansion:()=>OWLCore.clone(window.__OWL_V35_EXPANSION_WORLD?.summary?.()||null),
    expansionPolicy:()=>window.__OWL_EXPANSION_DRAFT_POLICY,
    export:()=>OWLCore.clone(window.__OWL_V800_WORLD_IO?.export?.()||null),
    health:year=>OWLCore.clone(window.__OWL_V800_WORLD_IO?.health?.(year)||null)
  },{domain:'world',managerReady:true,stability:'stable'});
})();
