/* ============================================================================
   MODULE: simulation/series_projection.js
   Pure projection helpers for TournamentEngine results.
   Keeps player/manager consumers independent from player-career singleton and UI globals.
   ========================================================================== */
(function(root){
  'use strict';
  function forTeam(result, teamName){
    const series=Array.isArray(result?.series)?result.series:[];
    if(!teamName)return [];
    return series.filter(s=>s?.teamA?.name===teamName||s?.teamB?.name===teamName).map(s=>{
      const left=s.teamA?.name===teamName;
      return {
        round:s.roundLabel,
        roundKey:s.roundKey||'',
        bracket:s.bracket||'main',
        opponent:left?(s.teamB?.name||''):(s.teamA?.name||''),
        won:s.winner?.name===teamName,
        target:s.targetWins,
        score:`${left?s.scoreA:s.scoreB}:${left?s.scoreB:s.scoreA}`
      };
    });
  }
  // Save only the information needed to reconstruct a readable bracket later.
  // The simulation result itself can contain entry objects and transient engine state;
  // none of that belongs in a long career save.
  function archive(result){
    const series=Array.isArray(result?.series)?result.series:[];
    return series.map((s,index)=>({
      index,
      round:s.roundLabel||'',
      roundKey:s.roundKey||'',
      bracket:s.bracket||'main',
      target:Number(s.targetWins||0),
      teamA:s.teamA?.name||'',
      teamB:s.teamB?.name||'',
      scoreA:Number(s.scoreA||0),
      scoreB:Number(s.scoreB||0),
      winner:s.winner?.name||'',
      loser:s.loser?.name||''
    }));
  }
  root.__OWL_SERIES_PROJECTION=Object.freeze({forTeam,archive});
})(window);
