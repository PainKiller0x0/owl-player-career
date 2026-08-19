(function(){
  'use strict';
  OWLCore.register('data',{
    teams:()=>OWLCore.clone(TEAMS),
    activeTeams:()=>OWLCore.clone(typeof v50ActiveTeams==='function'?v50ActiveTeams():TEAMS.filter(t=>t.active!==false)),
    team:(shortOrName)=>OWLCore.clone(TEAMS.find(t=>t.short===shortOrName||t.name===shortOrName)||null),
    roles:()=>OWLCore.clone(ROLES),
    attributes:()=>OWLCore.clone(ATTRS),
    competitionPreset:id=>OWLCore.clone(competitionPreset(id)),
    competitionPresets:()=>OWLCore.clone(COMPETITION_PRESETS)
  },{domain:'data',managerReady:true,stability:'stable'});
})();
