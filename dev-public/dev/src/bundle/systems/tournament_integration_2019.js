/* ===== BUNDLE MODULE: systems/tournament_integration_2019.js ===== */
/* ============================================================================
   MODULE: systems/tournament_integration_2019.js
   First live integration of the generic TournamentEngine:
   2019 Stage Playoffs now resolve through the engine instead of bespoke logic.
   ========================================================================== */

(function(){
  function stageProbability(a,b){
    const me=careerState.team?.name;
    if(a.team?.name===me){
      return stagePlayoffChance(b.team,3);
    }
    if(b.team?.name===me){
      return 1-stagePlayoffChance(a.team,3);
    }
    return clamp(.50+((a.team?.strength||80)-(b.team?.strength||80))*.025,.24,.76);
  }

  function stageParticipants(stageNo){
    const table=buildStageTable(stageNo);
    let qualifiers=table.filter(r=>r.qualified).slice(0,8);
    if(qualifiers.length<8){
      const have=new Set(qualifiers.map(r=>r.team.name));
      table.forEach(r=>{if(qualifiers.length<8&&!have.has(r.team.name)){qualifiers.push(r);have.add(r.team.name);}});
    }
    return {table,entries:qualifiers.sort((a,b)=>a.rank-b.rank).slice(0,8).map((r,i)=>({team:r.team,seed:i+1,stageRank:r.rank,isUser:r.isUser}))};
  }

  function seriesForUser(result){
    return window.__OWL_SERIES_PROJECTION.forTeam(result,careerState.team?.name);
  }

  function saveStageEngineHistory(stageNo,result,table,participated){
    const me=careerState.team?.name;
    const playerRank=table.find(r=>r.isUser)?.rank||v50ActiveTeams().length;
    const rounds=participated?seriesForUser(result):[];
    let label='未晋级';
    if(participated){
      const last=rounds.at(-1);
      if(result.champion?.name===me)label='Stage 冠军';
      else if(result.runnerUp?.name===me)label='Stage 亚军';
      else if(last?.round==='半决赛')label='Stage 四强';
      else label='Stage 八强';
    }
    const final=result.series.find(s=>s.roundKey==='R3')||result.series.at(-1);
    const history={
      stage:stageNo,rank:playerRank,result:label,rounds,
      bracketSeries:window.__OWL_SERIES_PROJECTION.archive(result),
      champion:result.champion?.name||'阶段冠军待定',
      runnerUp:result.runnerUp?.name||'阶段亚军待定',
      finalScore:final?(final.teamA?.name===result.champion?.name?`${final.scoreA}:${final.scoreB}`:`${final.scoreB}:${final.scoreA}`):'',
      engine:'TournamentEngine',competitionId:'OWL2019_STAGE_PLAYOFFS'
    };
    seasonState.stagePlayoffHistory=seasonState.stagePlayoffHistory||[];
    seasonState.stagePlayoffHistory=seasonState.stagePlayoffHistory.filter(x=>x.stage!==stageNo);
    seasonState.stagePlayoffHistory.push(history);
    seasonState.stageResultSeen=seasonState.stageResultSeen||[];
    seasonState.stageResultSeen=seasonState.stageResultSeen.filter(x=>x!==stageNo);
    if(label==='Stage 冠军'){
      seasonState.stageTitles=seasonState.stageTitles||[];
      const title=`Stage ${stageNo}冠军`;
      if(!seasonState.stageTitles.includes(title))seasonState.stageTitles.push(title);
      careerState.popularity=clamp(careerState.popularity+7,0,100);
      careerState.coachTrust=clamp(careerState.coachTrust+5,0,100);
    }
    seasonState.stageProcessed=seasonState.stageProcessed||[];
    if(!seasonState.stageProcessed.includes(stageNo))seasonState.stageProcessed.push(stageNo);
    seasonState.stageBreakPending=null;
    renderSeason();window.scrollTo({top:0,behavior:'smooth'});
  }

  simulateStagePlayoff=function(stageNo){
    const {table,entries}=stageParticipants(stageNo);
    const me=careerState.team?.name,participated=entries.some(x=>x.team.name===me);
    const result=TournamentEngine.run('OWL2019_STAGE_PLAYOFFS',entries,{probabilityFn:stageProbability});
    saveStageEngineHistory(stageNo,result,table,participated);
  };

  skipStageBreak=function(stageNo){
    const {table,entries}=stageParticipants(stageNo);
    const me=careerState.team?.name;
    const field=entries.filter(x=>x.team.name!==me);
    // If user was not actually qualified, field is already 8. Defensive refill if stale save data says otherwise.
    if(field.length<8){
      table.filter(r=>r.team.name!==me&&!field.some(x=>x.team.name===r.team.name)).forEach(r=>{
        if(field.length<8)field.push({team:r.team,seed:field.length+1,stageRank:r.rank,isUser:false});
      });
    }
    field.forEach((x,i)=>x.seed=i+1);
    const result=TournamentEngine.run('OWL2019_STAGE_PLAYOFFS',field.slice(0,8),{probabilityFn:stageProbability});
    saveStageEngineHistory(stageNo,result,table,false);
  };


})();
