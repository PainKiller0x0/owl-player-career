(function(){
  'use strict';
  OWLCore.register('simulation',{
    tournament:(configOrId,participants,context={})=>TournamentEngine.run(configOrId,participants,context),
    series:(a,b,opts={})=>TournamentEngine.simulateSeries(a,b,opts),
    seriesForTeam:(result,teamName)=>window.__OWL_SERIES_PROJECTION.forTeam(result,teamName),
    tournamentSelfTest:()=>TournamentEngine.selfTest(),
    teamPower:team=>typeof careerLikeTeamPower==='function'?careerLikeTeamPower(team):Number(team?.strength||80),
    currentTeamPower:()=>typeof teamDisplayPower==='function'?teamDisplayPower(careerState?.starters||[]):0
  },{domain:'simulation',managerReady:true,stability:'stable'});
})();
