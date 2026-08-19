/* Manager-facing facade: deliberately DOM-free. */
(function(){
  'use strict';
  OWLCore.register('manager',{
    leagueDefinition:year=>({
      year:Number(year),season:OWLCore.get('league').seasonFormat(year),postseason:OWLCore.get('league').postseason(year),specialEvents:OWLCore.get('league').specialEvents(year)
    }),
    teams:()=>OWLCore.get('data').activeTeams(),
    roster:(teamShort,year)=>OWLCore.get('world').roster(teamShort,year),
    simulateTournament:(configOrId,participants,context={})=>OWLCore.get('simulation').tournament(configOrId,participants,context),
    seriesForTeam:(result,teamName)=>OWLCore.get('simulation').seriesForTeam(result,teamName),
    evaluatePlayer:(player,role=player?.role)=>({name:player?.name||'',role,ovr:OWLCore.get('players').roleOverall(player?.attrs||{},role),potential:Number(player?.potential??player?.ovr??0)}),
    expansionPolicy:()=>OWLCore.get('world').expansionPolicy()
  },{domain:'manager',managerReady:true,stability:'stable',note:'DOM-free facade intended as extraction seam for OWL Manager.'});
})();
