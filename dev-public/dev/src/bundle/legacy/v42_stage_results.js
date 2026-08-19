/* ===== BUNDLE MODULE: legacy/v42_stage_results.js ===== */
/* ==========================================================================
   MODULE: legacy/v42_stage_results.js
   Compatibility layer: Stage playoff result persistence
   Migrated from V6.2 lines 9984-10126; execution order is defined by manifest.json.
   ========================================================================== */
    /* ================= V4.2 · Stage季后赛结果展示修复 ================= */

    // Stage季后赛改为真正结完整个8队单败签表，并保存冠军/亚军与玩家每轮结果。
    // 这样阶段赛模拟结束后，赛程页有完整结果可展示，而不是只在后台写一条history。
    function v42StageSeries(teamA,teamB,target){
      const me=careerState.team?.name;
      let chanceA;
      if(teamA.name===me){
        chanceA=stagePlayoffChance(teamB,target);
      }else if(teamB.name===me){
        chanceA=1-stagePlayoffChance(teamA,target);
      }else{
        chanceA=clamp(.50+((teamA.strength||80)-(teamB.strength||80))*.025,.24,.76);
      }
      const aWon=Math.random()<chanceA;
      const winner=aWon?teamA:teamB,loser=aWon?teamB:teamA;
      const loserScore=rand(0,target-1);
      return {
        teamA,teamB,winner,loser,target,
        scoreA:aWon?target:loserScore,
        scoreB:aWon?loserScore:target
      };
    }

    function v42RecordUserStageRound(roundLabel,series,rounds){
      const me=careerState.team?.name;
      if(series.teamA.name!==me&&series.teamB.name!==me)return;
      const won=series.winner.name===me;
      const opp=series.teamA.name===me?series.teamB:series.teamA;
      const myScore=series.teamA.name===me?series.scoreA:series.scoreB;
      const oppScore=series.teamA.name===me?series.scoreB:series.scoreA;
      rounds.push({round:roundLabel,opponent:opp.name,won,target:series.target,score:`${myScore}:${oppScore}`});
    }

    simulateStagePlayoff=function(stageNo){
      const table=buildStageTable(stageNo);
      let qualifiers=table.filter(r=>r.qualified).slice(0,8);
      // 极端情况下缓存表异常时兜底补满8队，避免阶段赛卡死。
      if(qualifiers.length<8){
        const have=new Set(qualifiers.map(r=>r.team.name));
        table.forEach(r=>{if(qualifiers.length<8&&!have.has(r.team.name)){qualifiers.push(r);have.add(r.team.name);}});
      }
      qualifiers=qualifiers.sort((a,b)=>a.rank-b.rank);
      const seeds=qualifiers.map(r=>r.team);
      const seedOf=name=>qualifiers.findIndex(r=>r.team.name===name)+1;
      const playerRank=table.find(r=>r.isUser)?.rank||20;
      const rounds=[];

      const qfPairs=[[0,7],[3,4],[1,6],[2,5]];
      const qf=qfPairs.map(([a,b])=>v42StageSeries(seeds[a],seeds[b],3));
      qf.forEach(s=>v42RecordUserStageRound('八强',s,rounds));

      const sf1=v42StageSeries(qf[0].winner,qf[1].winner,4);
      const sf2=v42StageSeries(qf[2].winner,qf[3].winner,4);
      [sf1,sf2].forEach(s=>v42RecordUserStageRound('半决赛',s,rounds));

      const final=v42StageSeries(sf1.winner,sf2.winner,4);
      v42RecordUserStageRound('决赛',final,rounds);

      const me=careerState.team?.name;
      let result='Stage 八强';
      const myLast=rounds.at(-1);
      if(final.winner.name===me)result='Stage 冠军';
      else if(final.loser.name===me)result='Stage 亚军';
      else if(myLast?.round==='半决赛')result='Stage 四强';

      const history={
        stage:stageNo,rank:playerRank,result,rounds,
        champion:final.winner.name,
        runnerUp:final.loser.name,
        finalScore:final.teamA?.name===final.winner?.name?`${final.scoreA}:${final.scoreB}`:`${final.scoreB}:${final.scoreA}`,
        championSeed:seedOf(final.winner.name),runnerUpSeed:seedOf(final.loser.name)
      };
      seasonState.stagePlayoffHistory=seasonState.stagePlayoffHistory||[];
      seasonState.stagePlayoffHistory=seasonState.stagePlayoffHistory.filter(x=>x.stage!==stageNo);
      seasonState.stagePlayoffHistory.push(history);
      seasonState.stageResultSeen=seasonState.stageResultSeen||[];
      seasonState.stageResultSeen=seasonState.stageResultSeen.filter(x=>x!==stageNo);

      if(result==='Stage 冠军'){
        seasonState.stageTitles=seasonState.stageTitles||[];
        if(!seasonState.stageTitles.includes(`Stage ${stageNo}冠军`))seasonState.stageTitles.push(`Stage ${stageNo}冠军`);
        careerState.popularity=clamp(careerState.popularity+7,0,100);
        careerState.coachTrust=clamp(careerState.coachTrust+5,0,100);
      }
      seasonState.stageProcessed=seasonState.stageProcessed||[];
      if(!seasonState.stageProcessed.includes(stageNo))seasonState.stageProcessed.push(stageNo);
      seasonState.stageBreakPending=null;
      renderSeason();
      window.scrollTo({top:0,behavior:'smooth'});
    };

    const _v42SetupSeasonBase=setupSeason;
    setupSeason=function(isRestart=false){
      _v42SetupSeasonBase(isRestart);
      seasonState.stageResultSeen=[];
    };

    function v42StageResultCard(history){
      const playerRounds=(history.rounds||[]).map(r=>`<span class="v42-stage-round ${r.won?'win':'loss'}"><b>${r.round}</b> vs ${r.opponent} · ${r.score|| (r.won?'胜':'负')}</span>`).join('');
      let displayFinalScore=history.finalScore||'';if(displayFinalScore){const p=displayFinalScore.split(':').map(Number);if(p.length===2&&p[1]>p[0])displayFinalScore=`${p[1]}:${p[0]}`;}if(displayFinalScore&&displayFinalScore!==history.finalScore)history.finalScore=displayFinalScore;
      const next=history.stage+1;
      return `<div class="stage-break-card v35-inline-stage v42-stage-result-card">
        <div class="offseason-kicker">STAGE ${history.stage} PLAYOFFS · FINAL</div>
        <h3>Stage ${history.stage} 季后赛结束</h3>
        <p>阶段季后赛已经全部结算。结果会保留在本赛季记录中。</p>
        <div class="stage-break-stats">
          <div><span>你的成绩</span><strong>${history.result}</strong></div>
          <div><span>冠军</span><strong>${history.champion}</strong></div>
          <div><span>亚军</span><strong>${history.runnerUp}</strong></div>
        </div>
        <div class="v42-stage-rounds">${playerRounds||'<span class="v42-stage-round">本次未产生玩家对局记录</span>'}</div>
        <div class="v42-stage-final">🏆 总决赛：${history.champion} ${displayFinalScore} ${history.runnerUp}</div>
        <button class="primary-btn" id="v42ContinueStageBtn">进入 Stage ${next} →</button>
      </div>`;
    }

    const _v42RenderSeasonBase=renderSeason;
    renderSeason=function(){
      document.querySelectorAll('#seasonScreen .v42-stage-result-card').forEach(n=>n.remove());
      _v42RenderSeasonBase();
      seasonState.stageResultSeen=seasonState.stageResultSeen||[];
      const history=(seasonState.stagePlayoffHistory||[]).slice().sort((a,b)=>b.stage-a.stage).find(h=>
        h.stage<=3 &&
        seasonState.played===h.stage*7 &&
        !seasonState.stageBreakPending &&
        !seasonState.stageResultSeen.includes(h.stage)
      );
      if(!history)return;
      const track=document.querySelector('#seasonScreen .season-track-card');
      if(!track)return;
      track.insertAdjacentHTML('afterbegin',v42StageResultCard(history));
      const play=document.getElementById('playNextSeasonMatchBtn');
      const stage=document.getElementById('fastSimSeasonBtn');
      const full=document.getElementById('fullSimSeasonBtn');
      if(play)play.disabled=true;if(stage)stage.disabled=true;if(full)full.disabled=true;
      document.getElementById('v42ContinueStageBtn')?.addEventListener('click',()=>{
        if(!seasonState.stageResultSeen.includes(history.stage))seasonState.stageResultSeen.push(history.stage);
        renderSeason();
        window.scrollTo({top:document.querySelector('#seasonScreen .season-track-card')?.offsetTop||0,behavior:'smooth'});
      });
    };




