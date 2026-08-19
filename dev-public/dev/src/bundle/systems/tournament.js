/* ===== BUNDLE MODULE: systems/tournament.js ===== */
/* ============================================================================
   MODULE: systems/tournament.js
   Milestone B: generic tournament engine.
   Supports ladder, single elimination, double elimination, byes,
   automatic opponent draft and regional qualification pipelines.
   ========================================================================== */

const TournamentEngine = (()=>{
  const asEntry=(value,index)=>{
    if(value?.team) return {...value,seed:Number(value.seed)||index+1};
    return {team:value,seed:index+1};
  };
  const nameOf=entry=>entry?.team?.name||entry?.name||'未知队伍';
  const strengthOf=entry=>Number(entry?.team?.strength??entry?.strength??80);
  const seeded=participants=>participants.map(asEntry).sort((a,b)=>a.seed-b.seed);
  const cloneEntries=participants=>seeded(participants).map(x=>({...x}));
  const clamp01=v=>Math.max(.02,Math.min(.98,v));

  function targetWins(config,roundIndex,isFinal=false){
    const series=config?.series||{};
    if(Array.isArray(series.roundTargets)&&series.roundTargets[roundIndex]!=null) return Number(series.roundTargets[roundIndex]);
    if(isFinal&&series.finalTargetWins!=null) return Number(series.finalTargetWins);
    return Number(series.defaultTargetWins||3);
  }

  function defaultChance(a,b){
    return clamp01(.50+(strengthOf(a)-strengthOf(b))*.025+(Number(b.seed||99)-Number(a.seed||99))*.0025);
  }

  function simulateSeries(a,b,opts={}){
    if(!a||!b) throw new Error('simulateSeries requires two participants');
    const target=Math.max(1,Number(opts.targetWins||3));
    const probabilityFn=opts.probabilityFn||defaultChance;
    const chanceA=clamp01(Number(probabilityFn(a,b,opts)));
    const aWon=Math.random()<chanceA;
    const loserScore=typeof opts.loserScoreFn==='function'
      ? Math.max(0,Math.min(target-1,Number(opts.loserScoreFn(target,a,b))||0))
      : Math.floor(Math.random()*target);
    const winner=aWon?a:b, loser=aWon?b:a;
    return {
      id:`series-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      roundKey:opts.roundKey||'', roundLabel:opts.roundLabel||'', bracket:opts.bracket||'main',
      targetWins:target, chanceA,
      teamA:a.team, teamB:b.team, seedA:a.seed, seedB:b.seed,
      winner:winner.team, loser:loser.team, winnerSeed:winner.seed, loserSeed:loser.seed,
      scoreA:aWon?target:loserScore, scoreB:aWon?loserScore:target,
      winnerEntry:winner, loserEntry:loser
    };
  }

  function balancedPairings(entries){
    const list=[...entries].sort((a,b)=>a.seed-b.seed);
    if(list.length===8){
      const idx=[[0,7],[3,4],[1,6],[2,5]];
      return idx.map(([a,b])=>[list[a],list[b]]);
    }
    const pairs=[];
    while(list.length>1) pairs.push([list.shift(),list.pop()]);
    return pairs;
  }

  function chooseWeakest(selector,candidates){
    return [...candidates].sort((a,b)=>strengthOf(a)-strengthOf(b)||b.seed-a.seed)[0];
  }

  function draftPairings(entries,selectors=1){
    const pool=[...entries].sort((a,b)=>a.seed-b.seed);
    const selectorEntries=pool.slice(0,Math.min(selectors,pool.length-1));
    const remaining=pool.filter(x=>!selectorEntries.includes(x));
    const pairs=[];
    selectorEntries.forEach(selector=>{
      if(!remaining.length)return;
      const target=chooseWeakest(selector,remaining);
      remaining.splice(remaining.indexOf(target),1);
      pairs.push([selector,target]);
    });
    while(remaining.length>1) pairs.push([remaining.shift(),remaining.pop()]);
    return pairs;
  }

  function roundLabelFor(count,roundIndex,isFinal){
    if(isFinal)return '决赛';
    if(count===8&&roundIndex===0)return '八强';
    if(count===4)return '半决赛';
    if(count===2)return '决赛';
    return `第 ${roundIndex+1} 轮`;
  }

  function runSingleElimination(config,participants,context={}){
    let active=cloneEntries(participants);
    const originalCount=active.length;
    const stopAt=Math.max(1,Number(config.stopAt||1));
    const series=[]; let roundIndex=0;
    while(active.length>stopAt){
      const isFinal=active.length===2&&stopAt===1;
      const label=roundLabelFor(active.length,roundIndex,isFinal);
      let pairs;
      if(config.opponentDraft?.round===roundIndex+1){
        pairs=draftPairings(active,config.opponentDraft.selectors||1);
      }else{
        pairs=balancedPairings(active);
      }
      const paired=new Set(pairs.flat());
      const byes=active.filter(x=>!paired.has(x));
      const winners=[];
      pairs.forEach(([a,b])=>{
        const s=simulateSeries(a,b,{
          targetWins:targetWins(config,roundIndex,isFinal),
          probabilityFn:context.probabilityFn,
          roundKey:`R${roundIndex+1}`,roundLabel:label,bracket:'single',context
        });
        series.push(s); winners.push(s.winnerEntry);
      });
      active=[...byes,...winners].sort((a,b)=>a.seed-b.seed);
      roundIndex++;
      if(roundIndex>20)throw new Error('Single elimination guard exceeded');
    }
    const champion=stopAt===1?active[0]?.team:null;
    const finalSeries=stopAt===1?series.at(-1):null;
    return {
      id:config.id,name:config.name,format:'singleElimination',participantCount:originalCount,
      champion,runnerUp:finalSeries?.loser||null,advancers:active.map(x=>x.team),
      advancerEntries:active,series,rounds:roundIndex,complete:true
    };
  }

  function runLadder3(config,participants,context={}){
    const entries=cloneEntries(participants);
    if(entries.length<3)throw new Error('ladder3 requires 3 participants');
    const [one,two,three]=entries.slice(0,3);
    const series=[];
    const semi=simulateSeries(two,three,{targetWins:targetWins(config,0,false),probabilityFn:context.probabilityFn,roundKey:'challenge',roundLabel:'挑战赛',bracket:'ladder',context});
    series.push(semi);
    const final=simulateSeries(one,semi.winnerEntry,{targetWins:targetWins(config,1,true),probabilityFn:context.probabilityFn,roundKey:'final',roundLabel:'决赛',bracket:'ladder',context});
    series.push(final);
    return {id:config.id,name:config.name,format:'ladder3',participantCount:3,champion:final.winner,runnerUp:final.loser,series,complete:true};
  }

  function pairPool(pool){
    const list=[...pool].sort((a,b)=>a.seed-b.seed),pairs=[];
    while(list.length>1)pairs.push([list.shift(),list.pop()]);
    return {pairs,byes:list};
  }

  function playPoolRound(pool,opts){
    const {pairs,byes}=pairPool(pool),winners=[...byes],losers=[],series=[];
    pairs.forEach(([a,b])=>{
      const s=simulateSeries(a,b,opts);series.push(s);winners.push(s.winnerEntry);losers.push(s.loserEntry);
    });
    return {winners:winners.sort((a,b)=>a.seed-b.seed),losers:losers.sort((a,b)=>a.seed-b.seed),series};
  }

  function runDoubleElimination(config,participants,context={}){
    let entries=cloneEntries(participants),series=[],eliminated=[],roundNo=0;
    const originalCount=entries.length;
    let upper=[],lower=[];

    const byes=Math.max(0,Math.min(entries.length-2,Number(config.initialByes||0)));
    if(byes>0){
      const byeTeams=entries.slice(0,byes),qualifierPool=entries.slice(byes);
      const initial=playPoolRound(qualifierPool,{targetWins:targetWins(config,0,false),probabilityFn:context.probabilityFn,roundKey:'playin',roundLabel:'首轮',bracket:'upper',context});
      series.push(...initial.series);lower.push(...initial.losers);
      const qualifierWinners=initial.winners;
      if(config.opponentDraftAfterByes&&byeTeams.length===qualifierWinners.length){
        const selectors=Math.min(config.opponentDraftAfterByes.selectors||byeTeams.length,byeTeams.length-1);
        const remaining=[...qualifierWinners]; const pairs=[];
        byeTeams.slice(0,selectors).forEach(selector=>{
          const opponent=chooseWeakest(selector,remaining);remaining.splice(remaining.indexOf(opponent),1);pairs.push([selector,opponent]);
        });
        byeTeams.slice(selectors).forEach(selector=>{if(remaining.length)pairs.push([selector,remaining.shift()]);});
        const winners=[];
        pairs.forEach(([a,b])=>{
          const s=simulateSeries(a,b,{targetWins:targetWins(config,1,false),probabilityFn:context.probabilityFn,roundKey:'upper1',roundLabel:'胜者组首轮',bracket:'upper',context});
          series.push(s);winners.push(s.winnerEntry);lower.push(s.loserEntry);
        });
        upper=winners.sort((a,b)=>a.seed-b.seed);
      }else upper=[...byeTeams,...qualifierWinners].sort((a,b)=>a.seed-b.seed);
      roundNo=1;
    }else{
      upper=entries;
    }

    while(!(upper.length===1&&lower.length===1)){
      roundNo++;
      // Existing lower-bracket teams eliminate each other before new upper losers drop in.
      if(lower.length>1){
        const lb=playPoolRound(lower,{targetWins:targetWins(config,roundNo,false),probabilityFn:context.probabilityFn,roundKey:`lower${roundNo}`,roundLabel:`败者组第${roundNo}轮`,bracket:'lower',context});
        series.push(...lb.series);eliminated.push(...lb.losers);lower=lb.winners;
      }
      if(upper.length>1){
        const ub=playPoolRound(upper,{targetWins:targetWins(config,roundNo,false),probabilityFn:context.probabilityFn,roundKey:`upper${roundNo}`,roundLabel:`胜者组第${roundNo}轮`,bracket:'upper',context});
        series.push(...ub.series);upper=ub.winners;lower=[...lower,...ub.losers].sort((a,b)=>a.seed-b.seed);
      }
      // If upper is already resolved, continue reducing lower until one remains.
      if(upper.length===1&&lower.length>1){
        const lb=playPoolRound(lower,{targetWins:targetWins(config,roundNo,false),probabilityFn:context.probabilityFn,roundKey:`lower${roundNo}b`,roundLabel:`败者组第${roundNo}轮`,bracket:'lower',context});
        series.push(...lb.series);eliminated.push(...lb.losers);lower=lb.winners;
      }
      if(roundNo>30)throw new Error('Double elimination guard exceeded');
    }

    let finalistA=upper[0],finalistB=lower[0];
    if(!finalistB){ // Defensive fallback for tiny/odd brackets.
      finalistB=eliminated.pop();
    }
    const grand=simulateSeries(finalistA,finalistB,{targetWins:targetWins(config,roundNo,true),probabilityFn:context.probabilityFn,roundKey:'grandFinal',roundLabel:'总决赛',bracket:'final',context});
    series.push(grand);
    return {
      id:config.id,name:config.name,format:'doubleElimination',participantCount:originalCount,
      champion:grand.winner,runnerUp:grand.loser,series,complete:true,
      metadata:{initialByes:byes,eliminated:eliminated.map(x=>x.team)}
    };
  }

  function runRegionalToGlobal(config,participants,context={}){
    const all=cloneEntries(participants),regionalResults={},globalEntries=[];
    config.regions.forEach(region=>{
      const regionPool=all.filter(x=>(x.region||x.team?.region||x.team?.division)===region.key).slice(0,region.participantCount);
      if(regionPool.length<region.advance)throw new Error(`Region ${region.key} has insufficient participants`);
      const qConfig={...config.qualifier,id:`${config.id}_${region.key}`,name:`${config.name} · ${region.key}`,stopAt:region.advance};
      const q=runSingleElimination(qConfig,regionPool,context);regionalResults[region.key]=q;
      q.advancerEntries.forEach((entry,i)=>globalEntries.push({...entry,seed:globalEntries.length+1,region:region.key,regionalSeed:i+1}));
    });
    const globalConfig={...config.global,id:`${config.id}_GLOBAL`,name:`${config.name} · 全球赛`};
    const global=runCompetition(globalConfig,globalEntries,context);
    return {id:config.id,name:config.name,format:'regionalToGlobal',regionalResults,global,champion:global.champion,runnerUp:global.runnerUp,series:[...Object.values(regionalResults).flatMap(x=>x.series),...global.series],complete:true};
  }

  function runCompetition(configOrId,participants,context={}){
    const config=typeof configOrId==='string'?competitionPreset(configOrId):configOrId;
    if(!config)throw new Error('Missing tournament config');
    if(config.participantCount&&participants.length<config.participantCount)throw new Error(`${config.id||config.name}: expected ${config.participantCount} participants, got ${participants.length}`);
    const field=config.participantCount?participants.slice(0,config.participantCount):participants;
    switch(config.format){
      case 'ladder3':return runLadder3(config,field,context);
      case 'singleElimination':return runSingleElimination(config,field,context);
      case 'doubleElimination':return runDoubleElimination(config,field,context);
      case 'regionalToGlobal':return runRegionalToGlobal(config,field,context);
      default:throw new Error(`Unsupported tournament format: ${config.format}`);
    }
  }

  function selfTest(){
    const make=(n,prefix='T',regionFn=null)=>Array.from({length:n},(_,i)=>({team:{name:`${prefix}${i+1}`,strength:90-i},seed:i+1,region:regionFn?regionFn(i):undefined}));
    const cases=[];
    const check=(name,fn)=>{try{const r=fn();cases.push({name,pass:!!r,detail:r===true?'OK':r});}catch(err){cases.push({name,pass:false,detail:err.message});}};
    check('2018 ladder3',()=>{const r=runCompetition('OWL2018_STAGE_TITLE_LADDER',make(3));return r.series.length===2&&!!r.champion;});
    check('2019 single8',()=>{const r=runCompetition('OWL2019_STAGE_PLAYOFFS',make(8));return r.series.length===7&&!!r.champion&&!!r.runnerUp;});
    check('2021 regional→global',()=>{const r=runCompetition('OWL2021_REGIONAL_TO_GLOBAL',make(10,'R',i=>i<6?'West':'East'));return r.global?.format==='doubleElimination'&&!!r.champion;});
    check('2022 double12',()=>{const r=runCompetition('OWL2022_MIDSEASON_MADNESS',make(12));return r.metadata.initialByes===4&&!!r.champion&&r.series.length>=12;});
    return {pass:cases.every(x=>x.pass),cases};
  }

  return {run:runCompetition,simulateSeries,selfTest,_internals:{runSingleElimination,runDoubleElimination,runLadder3,runRegionalToGlobal}};
})();

// Console-only developer diagnostic. It does not mutate career state.
window.owlTournamentSelfTest=()=>TournamentEngine.selfTest();


