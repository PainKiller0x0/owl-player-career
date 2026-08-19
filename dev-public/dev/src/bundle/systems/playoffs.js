/* ===== BUNDLE MODULE: systems/playoffs.js ===== */
/* ==========================================================================
   MODULE: systems/playoffs.js
   Double-elimination postseason and finals MVP
   Migrated from V6.2 lines 6307-6613; execution order is defined by manifest.json.
   ========================================================================== */
    /* ---------------- 八强双败季后赛 ---------------- */
    const PLAYOFF_MATCH_BLUEPRINT = [
      {id:'U1',lane:'upper',stage:'胜者组首轮',order:1,target:3,sources:['S1','S8']},
      {id:'U2',lane:'upper',stage:'胜者组首轮',order:1,target:3,sources:['S4','S5']},
      {id:'U3',lane:'upper',stage:'胜者组首轮',order:1,target:3,sources:['S2','S7']},
      {id:'U4',lane:'upper',stage:'胜者组首轮',order:1,target:3,sources:['S3','S6']},
      {id:'U5',lane:'upper',stage:'胜者组半决赛',order:2,target:3,sources:['W:U1','W:U2']},
      {id:'U6',lane:'upper',stage:'胜者组半决赛',order:2,target:3,sources:['W:U3','W:U4']},
      {id:'L1',lane:'lower',stage:'败者组首轮',order:2,target:3,sources:['L:U1','L:U2']},
      {id:'L2',lane:'lower',stage:'败者组首轮',order:2,target:3,sources:['L:U3','L:U4']},
      {id:'L3',lane:'lower',stage:'败者组第二轮',order:3,target:3,sources:['W:L1','L:U6']},
      {id:'L4',lane:'lower',stage:'败者组第二轮',order:3,target:3,sources:['W:L2','L:U5']},
      {id:'U7',lane:'upper',stage:'胜者组决赛',order:3,target:3,sources:['W:U5','W:U6']},
      {id:'L5',lane:'lower',stage:'败者组第三轮',order:4,target:3,sources:['W:L3','W:L4']},
      {id:'L6',lane:'lower',stage:'败者组决赛',order:5,target:3,sources:['W:L5','L:U7']},
      {id:'G1',lane:'grand',stage:'总决赛',order:6,target:4,sources:['W:U7','W:L6']}
    ];

    const playoffState = {
      active:false,seed:0,teams:[],matches:[],round:'active',results:[],nextMatchId:null,
      pendingMatchId:null,manualRecorded:false,injuryPromptUsed:false,injuryChecks:{},fmvp:null,aiResolvedThrough:0
    };

    function resetPlayoffState() {
      playoffState.active=false; playoffState.seed=0; playoffState.teams=[]; playoffState.matches=[];
      playoffState.round='active'; playoffState.results=[]; playoffState.nextMatchId=null;
      playoffState.pendingMatchId=null; playoffState.manualRecorded=false; playoffState.injuryPromptUsed=false; playoffState.injuryChecks={}; playoffState.fmvp=null; playoffState.aiResolvedThrough=0;
    }

    function enterPlayoffs() {
      if(seasonState.played<seasonState.total) return;
      if(typeof postseasonStatus==='function') {
        const ps=postseasonStatus();
        const qualified=ps.direct || (ps.playIn && Number(careerState.postseasonSeed)>=7);
        if(!qualified) return;
        if(ps.direct && !careerState.postseasonSeed) careerState.postseasonSeed=ps.seed||clamp(ps.rank,1,6);
      } else if(estimateSeasonRank()>8) return;
      if(!playoffState.active) setupPlayoffs();
      renderPlayoffs(); showScreen('playoff');
    }

    function setupPlayoffs() {
      resetPlayoffState(); playoffState.active=true; playoffState.seed=clamp(estimateSeasonRank(),1,8);
      const others=shuffle(TEAMS.filter(t=>t.name!==careerState.team.name)).slice(0,7);
      const seeds=Array(8).fill(null); seeds[playoffState.seed-1]=careerState.team;
      let oi=0; for(let i=0;i<8;i++) if(!seeds[i]) seeds[i]=others[oi++];
      playoffState.teams=seeds;
      playoffState.matches=PLAYOFF_MATCH_BLUEPRINT.map(item=>({...item,result:null}));
      syncDoubleElimBracket(null); renderPlayoffs();
    }

    function careerLikeTeamPower(team) {
      if(!team) return 0;
      if(team.name===careerState.team?.name) return teamDisplayPower(careerState.starters);
      const nameScore=[...team.name].reduce((s,c)=>s+c.charCodeAt(0),0);
      return 77+(nameScore%9)+randomCentered(1.2);
    }

    function simulatePlayoffWinner(teamA,teamB) {
      const chance=clamp(.5+(careerLikeTeamPower(teamA)-careerLikeTeamPower(teamB))*.018,.28,.72);
      return Math.random()<chance?teamA:teamB;
    }

    function getBracketMatch(id) { return playoffState.matches.find(m=>m.id===id)||null; }
    function resolveBracketSource(source) {
      if(!source) return null;
      if(source.startsWith('S')) return playoffState.teams[Number(source.slice(1))-1]||null;
      const [kind,id]=source.split(':'); const match=getBracketMatch(id);
      if(!match?.result) return null;
      return kind==='W'?match.result.winner:match.result.loser;
    }
    function getBracketTeams(match) { return match?match.sources.map(resolveBracketSource):[null,null]; }
    function teamSeed(team) { const index=playoffState.teams.findIndex(t=>t?.name===team?.name); return index>=0?index+1:null; }
    function matchHasPlayer(match) { return getBracketTeams(match).some(t=>t?.name===careerState.team?.name); }
    function matchReady(match) { const [a,b]=getBracketTeams(match); return !!a&&!!b&&!match.result; }

    function seriesSeedEdge(teamA,teamB) {
      const a=teamSeed(teamA)||8,b=teamSeed(teamB)||8;
      return a===b?0:(a<b?.02:-.02);
    }

    function simulateBracketMatch(match) {
      const [teamA,teamB]=getBracketTeams(match); if(!teamA||!teamB) return null;
      const target=match.target;
      // 高顺位拥有首图选图权与轻微系列赛优势。
      const chance=clamp(.5+(careerLikeTeamPower(teamA)-careerLikeTeamPower(teamB))*.021+seriesSeedEdge(teamA,teamB),.23,.77);
      let a=0,b=0; while(a<target&&b<target){ if(Math.random()<chance)a++; else b++; }
      const winner=a===target?teamA:teamB, loser=a===target?teamB:teamA;
      match.result={teamA,teamB,winner,loser,scoreA:a,scoreB:b,score:`${a}:${b}`,isPlayer:false};
      return match.result;
    }

    function advanceBracketAI(maxOrder) {
      if(maxOrder==null)return;
      let changed=true,guard=0;
      while(changed&&guard++<40) {
        changed=false;
        playoffState.matches.sort((a,b)=>a.order-b.order).forEach(match=>{
          if(match.order<=maxOrder && matchReady(match)&&!matchHasPlayer(match)) { simulateBracketMatch(match); changed=true; }
        });
      }
      playoffState.aiResolvedThrough=Math.max(playoffState.aiResolvedThrough||0,maxOrder);
    }

    function findPlayerNextMatch() {
      return playoffState.matches.filter(match=>matchReady(match)&&matchHasPlayer(match)).sort((a,b)=>a.order-b.order)[0]||null;
    }
    function countPlayerLosses() {
      return playoffState.matches.filter(m=>m.result?.loser?.name===careerState.team?.name).length;
    }
    function currentPlayoffMatch() { return getBracketMatch(playoffState.nextMatchId); }
    function currentPlayoffOpponent() {
      const match=currentPlayoffMatch(); if(!match)return null;
      return getBracketTeams(match).find(t=>t?.name!==careerState.team?.name)||null;
    }

    function syncDoubleElimBracket(completedOrder=null) {
      // 初次进入季后赛时不提前模拟任何其他比赛。只有玩家完成一轮后，才结算同阶段及生成下一位对手所必需的比赛。
      if(completedOrder!=null) advanceBracketAI(completedOrder);
      const grand=getBracketMatch('G1');
      if(grand?.result&&(grand.result.winner.name===careerState.team.name||grand.result.loser.name===careerState.team.name)) {
        playoffState.nextMatchId=null;
        playoffState.round=grand.result.winner.name===careerState.team.name?'champion':'runnerup';
        return;
      }
      if(countPlayerLosses()>=2) { playoffState.nextMatchId=null; playoffState.round='eliminated'; return; }
      let next=findPlayerNextMatch();
      if(!next && completedOrder!=null) {
        for(let order=completedOrder+1;order<=6&&!next;order++) {
          advanceBracketAI(order);
          next=findPlayerNextMatch();
        }
      }
      if(next) { playoffState.nextMatchId=next.id; playoffState.round=next.id==='G1'?'final':'active'; return; }
      playoffState.nextMatchId=null;
      playoffState.round='active';
    }

    function setPlayerBracketResult(match,won,ourScore,theirScore,rating,extra={}) {
      const [teamA,teamB]=getBracketTeams(match); const opponent=teamA.name===careerState.team.name?teamB:teamA;
      const winner=won?careerState.team:opponent, loser=won?opponent:careerState.team;
      const scoreA=teamA.name===careerState.team.name?ourScore:theirScore;
      const scoreB=teamB.name===careerState.team.name?ourScore:theirScore;
      match.result={teamA,teamB,winner,loser,scoreA,scoreB,score:`${scoreA}:${scoreB}`,isPlayer:true};
      playoffState.results.push({matchId:match.id,round:match.id,stage:match.stage,lane:match.lane,won,score:`${ourScore}:${theirScore}`,rating,...extra});
      playoffState.pendingMatchId=null; playoffState.manualRecorded=true;
      syncDoubleElimBracket(match.order);
      if(match.id==='G1') { resolveFinalsMVP(); if(won) playChampionBurst(); }
    }

    function resolveFinalsMVP() {
      if(playoffState.fmvp) return playoffState.fmvp;
      const grand=getBracketMatch('G1'); if(!grand?.result) return null;
      const championTeam=grand.result.winner;
      const userFinal=playoffState.results.find(r=>r.matchId==='G1');
      let candidates=[];
      if(championTeam.name===careerState.team.name) {
        candidates=careerState.starters.map(player=>{
          const rating=player.isUser?(userFinal?.rating||7.2):clamp(6.75+(player.overall-78)*.045+randomCentered(.55),5.6,9.5);
          return {name:player.name||getPlayerName(),team:championTeam.name,role:player.role||state.role,rating,isUser:!!player.isUser};
        });
      } else {
        candidates=createRoster(championTeam,false).map(player=>({name:player.name,team:championTeam.name,role:player.role,rating:clamp(6.9+(player.overall-78)*.05+randomCentered(.55),5.8,9.6),isUser:false}));
      }
      candidates.sort((a,b)=>b.rating-a.rating);
      playoffState.fmvp={...candidates[0],season:careerState.seasonYear}; return playoffState.fmvp;
    }

    function renderFmvpCard() {
      const award=resolveFinalsMVP(); if(!award)return '';
      return `<div class="fmvp-card"><div class="fmvp-icon">👑</div><div><small>总决赛 MVP</small><strong>${award.name}${award.isUser?' · 你':''}</strong><em>${award.team} · ${award.role}</em></div><div class="fmvp-rating">${award.rating.toFixed(1)}</div></div>`;
    }

    function bracketMatchCard(match) {
      if(!match)return '';
      const [teamA,teamB]=getBracketTeams(match); const result=match.result;
      const row=(team,index)=>{
        const isWinner=result&&team?.name===result.winner.name; const isLoser=result&&team?.name===result.loser.name;
        const score=result?(index===0?result.scoreA:result.scoreB):null;
        return `<div class="bracket-team ${team?.name===careerState.team?.name?'me':''} ${isWinner?'winner':''} ${isLoser?'loser':''}"><span class="bracket-seed">${team?'#'+teamSeed(team):'#—'}</span><strong class="bracket-name">${team?.name||'待定'}${score!==null?`<span class="bracket-score">${score} 图</span>`:''}</strong><span class="bracket-status">${result?(isWinner?'晋级':'落败'):(matchReady(match)?'等待开赛':'等待前序')}</span></div>`;
      };
      return `<div class="bracket-match ${playoffState.nextMatchId===match.id?'current':''}">${row(teamA,0)}${row(teamB,1)}</div>`;
    }

    function renderDoubleRound(title,ids) {
      return `<div class="double-round"><div class="double-round-title">${title}</div>${ids.map(id=>bracketMatchCard(getBracketMatch(id))).join('')}</div>`;
    }

    function getPlayoffResultLabel() {
      if(playoffState.round==='champion') return '总冠军';
      if(playoffState.round==='runnerup') return '联赛亚军';
      if(playoffState.round!=='eliminated') return '季后赛进行中';
      const last=[...playoffState.results].reverse().find(r=>!r.won);
      if(!last) return '季后赛八强';
      if(last.matchId==='L6') return '季后赛季军';
      if(last.matchId==='L5') return '季后赛四强';
      if(['L3','L4'].includes(last.matchId)) return '季后赛六强';
      return '季后赛八强';
    }

    function renderPlayoffs() {
      if(!playoffState.active||!careerState.team)return;
      const logo=document.getElementById('playoffTeamLogo'); logo.textContent=careerState.team.short; logo.style.background=careerState.team.color;
      document.getElementById('playoffTeamName').textContent=careerState.team.name;
      document.getElementById('playoffSeedText').innerHTML=`常规赛第 ${playoffState.seed} 名 · ${seasonState.wins}胜${seasonState.losses}负 <span class="bracket-loss-dot">${countPlayerLosses()} 负</span>`;
      const current=currentPlayoffMatch();
      document.getElementById('playoffStageText').textContent=current?.stage||getPlayoffResultLabel();
      document.getElementById('playoffRecordText').textContent=`你已完成 ${playoffState.results.length} 场 · ${countPlayerLosses()} 次失利`;
      document.getElementById('playoffSeasonChip').textContent=`🏆 ${careerState.seasonYear} 季后赛`;
      const pipWrap=document.getElementById('playoffStagePips');
      if(pipWrap){const step=current?Math.min(5,current.order-1):6;pipWrap.innerHTML=[0,1,2,3,4,5,6].map(i=>`<i class="playoff-stage-pip ${i<step?'done':i===step?'current':''}"></i>`).join('');}
      document.getElementById('playoffBracket').innerHTML=`<div class="double-bracket">
        <section class="double-lane"><div class="double-lane-head"><h4>⬆️ 胜者组</h4><span>保持不败，路线更短</span></div><div class="double-rounds">${renderDoubleRound('UPPER ROUND 1 · FT3',['U1','U2','U3','U4'])}${renderDoubleRound('UPPER SEMIFINALS · FT3',['U5','U6'])}${renderDoubleRound('UPPER FINAL · FT3',['U7'])}</div></section>
        <section class="double-lane"><div class="double-lane-head"><h4>⬇️ 败者组</h4><span>再输一次，赛季结束</span></div><div class="double-rounds">${renderDoubleRound('LOWER ROUND 1 · FT3',['L1','L2'])}${renderDoubleRound('LOWER ROUND 2 · FT3',['L3','L4'])}${renderDoubleRound('LOWER ROUND 3 · FT3',['L5'])}${renderDoubleRound('LOWER FINAL · FT3',['L6'])}</div></section>
        <section class="double-lane double-grand"><div class="double-lane-head"><h4>🏆 总决赛</h4><span>胜者组冠军 vs 败者组冠军</span></div><div class="double-rounds">${renderDoubleRound('GRAND FINAL · FT4',['G1'])}</div></section>
      </div>`;
      const btn=document.getElementById('playNextPlayoffMatchBtn'),detailBtn=document.getElementById('playDetailedMatchBtn'),modeNote=document.getElementById('playoffModeNote'),complete=document.getElementById('playoffCompleteArea'); btn.disabled=false;detailBtn.disabled=false;detailBtn.classList.remove('ui-hidden');complete.innerHTML='';
      if(current) {
        const opponent=currentPlayoffOpponent(); const danger=countPlayerLosses()===1&&current.id!=='G1';
        document.getElementById('playoffNextKicker').textContent=`${current.lane==='upper'?'UPPER':current.lane==='lower'?'LOWER':'GRAND FINAL'} · FT${current.target}`;
        document.getElementById('playoffNextTitle').textContent=`${current.stage} vs ${opponent?.name||'待定'}`;
        const opponentSeed=teamSeed(opponent)||8;
        const seedRight=playoffState.seed<opponentSeed?'你方顺位更高，拥有首图选图权与小幅状态优势。':'对方顺位更高，拥有首图选图权与小幅状态优势。';
        document.getElementById('playoffNextDesc').textContent=(current.id==='G1'?'总决赛采用 FT4，先拿到4张地图胜利者成为联盟冠军。':danger?'你已经有一次失利。这一轮再输，赛季立即结束。':'本轮采用 FT3。双败赛制允许一次失误，但绝不允许第二次。')+` ${seedRight} 后续每张地图由上一张地图的败者选择。`;
        btn.textContent=`⚡ 快速模拟${current.stage}`;
        detailBtn.textContent=`🎮 比赛详情 · ${current.stage}`;
        detailBtn.disabled=!gameSettings.matchDetailsUnlocked;
        modeNote.textContent=gameSettings.matchDetailsUnlocked?'每轮可选择快速结算或比赛详情。':'完成首段生涯并退役后解锁比赛详情；当前仅可快速模拟。';
      } else {
        btn.disabled=true;btn.textContent='本赛季已结束';detailBtn.disabled=true;detailBtn.classList.add('ui-hidden');modeNote.textContent='季后赛已经结束。';
        if(playoffState.round==='champion') {
          document.getElementById('playoffNextKicker').textContent='CHAMPIONS'; document.getElementById('playoffNextTitle').textContent='联盟总冠军'; document.getElementById('playoffNextDesc').textContent='你走完了八强双败的整条路线。输过也好，没输过也好，最后站着的只有冠军。';
          complete.innerHTML=`<div class="playoff-result-banner champion"><strong>🏆 夺得 ${careerState.seasonYear} 赛季总冠军</strong><br>总决赛 FMVP 同步揭晓。${renderFmvpCard()}<div style="margin-top:16px"><button class="primary-btn" data-open-season-summary="1">📊 查看赛季结算</button></div></div>`;
        } else if(playoffState.round==='runnerup') {
          document.getElementById('playoffNextKicker').textContent='SEASON FINISHED';document.getElementById('playoffNextTitle').textContent='止步总决赛';document.getElementById('playoffNextDesc').textContent='你走到了双败赛制的最后一场，但奖杯不会因为路线更长就发两份。';
          complete.innerHTML='<div class="playoff-result-banner"><strong>赛季成绩：亚军</strong><br>本赛季已经结束，可进入结算与休赛期。<div style="margin-top:13px"><button class="primary-btn" data-open-season-summary="1">📊 查看赛季结算</button></div></div>';
        } else {
          const label=getPlayoffResultLabel();document.getElementById('playoffNextKicker').textContent='ELIMINATED';document.getElementById('playoffNextTitle').textContent=label;document.getElementById('playoffNextDesc').textContent='第二次失利已经发生，双败赛制也没有第三条命。';
          complete.innerHTML=`<div class="playoff-result-banner"><strong>赛季成绩：${label}</strong><br>本赛季已经结束，可进入结算与休赛期。<div style="margin-top:13px"><button class="primary-btn" data-open-season-summary="1">📊 查看赛季结算</button></div></div>`;
        }
      }
    }

    function openNextPlayoffMatch(mode='quick') {
      const bracketMatch=currentPlayoffMatch(); if(!playoffState.active||!bracketMatch)return;
      if(shouldTriggerInjuryInquiry('playoff')) { injuryState.pendingPlayoffMode=mode; openInjuryInquiry('playoff'); return; }
      if(mode!=='detail') { simulateSinglePlayoffSeries(); return; }
      if(!gameSettings.matchDetailsUnlocked) return;
      const opponent=currentPlayoffOpponent();
      const playerHigher=(teamSeed(careerState.team)||8)<(teamSeed(opponent)||8);
      setupMatch(false,bracketMatch.target,{playerVenue:playerHigher?'home':'away',mapSelectionEnabled:true,firstMapPicker:playerHigher?'home':'away',playoffMatchId:bracketMatch.id});
      matchState.context='playoff';matchState.homeTeam=careerState.team;matchState.homeRoster=careerState.starters.map(p=>({...p,attrs:{...p.attrs}}));applyCareerMatchModifiers(matchState.homeRoster);
      matchState.awayTeam=opponent;matchState.awayRoster=createRoster(opponent,false);
      matchState.logs=[{map:'赛前',side:'event',text:`${bracketMatch.stage}：${careerState.team.name} 对阵 ${opponent.name}。${playerHigher?'我方':'对方'}顺位更高，拥有首图选图权和小幅状态优势；后续每张地图由上一图败者选择。`}];
      matchState.currentTactics=null;matchState.mapSequence=[];matchState.availableMaps=[...MATCH_MAPS];matchState.mapPicker=playerHigher?'home':'away';ensureCurrentMapSelected(false);
      playoffState.pendingMatchId=bracketMatch.id;playoffState.manualRecorded=false;
      document.getElementById('matchKicker').textContent=`Playoffs · ${bracketMatch.lane==='lower'?'Lower Bracket':bracketMatch.id==='G1'?'Grand Final':'Upper Bracket'}`;
      document.getElementById('matchTitle').textContent=bracketMatch.stage;
      document.getElementById('matchDesc').textContent=(bracketMatch.id==='G1'?'总决赛采用 FT4，先拿到4张地图胜利者夺冠。':'本轮采用 FT3。双败赛制允许一次失利，第二次失利将直接淘汰。')+' 高顺位首图选图，之后由上一图败者选择。';
      document.getElementById('matchWeekText').textContent=bracketMatch.stage;renderMatch();showScreen('match');
    }

    function simulateSinglePlayoffSeries() {
      const match=currentPlayoffMatch();if(!match)return;
      const opponent=currentPlayoffOpponent(),target=match.target;
      const ourRoster=careerState.starters.map(p=>({...p,attrs:{...p.attrs}})),theirRoster=createRoster(opponent,false);
      const playerHigher=(teamSeed(careerState.team)||8)<(teamSeed(opponent)||8);
      matchState.playerVenue=playerHigher?'home':'away';
      let picker=playerHigher?'home':'away',available=[...MATCH_MAPS],ourMaps=0,theirMaps=0,mapLog=[];
      const regularMomentum=seasonState.total?clamp((seasonState.wins/seasonState.total-.5)*.10,-.015,.035):0;
      while(ourMaps<target&&theirMaps<target){
        const roster=picker==='home'?ourRoster:theirRoster;
        const map=[...available].sort((a,b)=>mapFitValue(roster,b)-mapFitValue(roster,a))[0]||MATCH_MAPS[0];
        available=available.filter(item=>item.name!==map.name);
        const ourTac=chooseTactic(ourRoster,map),theirTac=chooseTactic(theirRoster,map);
        const ourFit=teamMapPower(ourRoster,map,ourTac,theirTac,true).power;
        const theirFit=teamMapPower(theirRoster,map,theirTac,ourTac,false).power;
        const chance=clamp(.5+(ourFit-theirFit)*.028+regularMomentum+(playerHigher?.012:-.012)+currentCareerMatchBonus()*.012,.24,.82);
        const homeWon=Math.random()<chance;
        if(homeWon)ourMaps++;else theirMaps++;
        mapLog.push(`${picker==='home'?'我方':'对方'}选${map.name}·${homeWon?'我方胜':'对方胜'}`);
        picker=homeWon?'away':'home';
      }
      const won=ourMaps===target,userOvr=Number(getMyOvr()==='--'?78:getMyOvr()),avg=clamp(6.45+(userOvr-78)*.05+(won?.45:-.18)+randomCentered(.65),4.6,9.6);
      setPlayerBracketResult(match,won,ourMaps,theirMaps,avg,{quick:true,mapLog});renderPlayoffs();showScreen('playoff');
    }

    function recordPlayoffMatch() {
      if(!playoffState.pendingMatchId||playoffState.manualRecorded||!matchState.finished)return;
      const match=getBracketMatch(playoffState.pendingMatchId);if(!match)return;
      const won=matchState.homeScore>matchState.awayScore,user=matchState.homeRoster.find(p=>p.isUser),vals=user?(matchState.ratings.home[user.id]||[]):[],avg=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:(won?7.4:6.3);
      setPlayerBracketResult(match,won,matchState.homeScore,matchState.awayScore,avg);renderPlayoffs();
    }

    function returnFromMatch() {
      if(matchState.context==='regular') {
        if(matchState.finished) recordManualSeasonMatch();
        returnToSeasonAfterMatch();
      } else if(matchState.context==='playoff') {
        if(matchState.finished) recordPlayoffMatch();
        renderPlayoffs();
        showScreen('playoff');
      } else {
        showScreen(careerState.team?'team':'builder');
      }
    }




