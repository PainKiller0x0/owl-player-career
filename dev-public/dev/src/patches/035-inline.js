
/* ===== V7.7.0 HOTFIX · Single-source milestone renderer + browser smoke hooks ===== */
(function(){
  const V769_VERSION='7.6.9';
  function year(){return Number(careerState.seasonYear||2019)}
  function track(){return document.querySelector('#seasonScreen .season-track-card')}
  function slot(){return document.getElementById('v768SeasonPrimaryAction')}
  function historicalModern(){const n=year();return n>=2020&&n<=2023}
  function ensureSlot(){
    const t=track();if(!t)return null;
    const head=t.querySelector('.season-track-head');if(!head)return null;
    let s=slot();
    if(!s){s=document.createElement('div');s.id='v768SeasonPrimaryAction';s.className='v768-season-primary-action';head.insertAdjacentElement('afterend',s);}
    if(s.parentNode!==t||s.previousElementSibling!==head)head.insertAdjacentElement('afterend',s);
    return s;
  }

  // V3.5 会把旧2019通用Stage卡搬到赛程卡最顶部。2020+已经有年份专属节点，旧卡只能删除。
  function removeLegacyDirectMilestones(){
    const t=track(); if(!t)return;
    [...t.children].forEach(node=>{
      if(!node.classList?.contains('stage-break-card'))return;
      if(node.closest('#v768SeasonPrimaryAction'))return;
      const title=node.querySelector('h3')?.textContent||'';
      const legacyGeneric=/^Stage\s+\d+\s+常规阶段结束/.test(title);
      const legacyV42=node.classList.contains('v42-stage-result-card');
      if((historicalModern()&&legacyGeneric)||(year()>=2024&&legacyV42))node.remove();
    });
  }
  function cards(){
    const s=slot();
    return [...document.querySelectorAll('#seasonScreen .stage-break-card,#seasonScreen .season-complete-banner')].map(node=>({
      node,inSlot:!!s&&s.contains(node),
      title:node.querySelector('h3')?.textContent?.trim()||node.querySelector('strong')?.textContent?.trim()||''
    }));
  }
  function enforceSingleMilestone(){
    removeLegacyDirectMilestones();
    const s=ensureSlot(),all=cards();
    if(!all.length){s?.classList.remove('show');return;}
    if(all.length===1){
      if(s&&!all[0].inSlot)s.appendChild(all[0].node);
      s?.classList.add('show');return;
    }
    // 槽内节点优先；否则优先年份专属/正式赛事节点，最后才退化为最后生成的卡。
    let keep=all.find(x=>x.inSlot)?.node;
    if(!keep)keep=all.findLast(x=>/Qualification|资格赛|Major|常规赛完成|常规赛结束|结算/i.test(x.title))?.node||all.at(-1)?.node;
    all.forEach(x=>{if(x.node!==keep)x.node.remove();});
    if(s&&keep&&!s.contains(keep))s.appendChild(keep);
    s?.classList.toggle('show',!!keep);
  }

  // 2020-2023历史赛事之前只记“玩家成绩”，却没有真正生成冠亚军，导致结算卡缺信息。
  function enrichHistoricalTournament(stageNo){
    if(!historicalModern())return null;
    const list=seasonState.stagePlayoffHistory||[];
    const h=[...list].reverse().find(x=>Number(x.stage)===Number(stageNo));if(!h)return null;
    const teams=v50ActiveTeams().filter(t=>t.name!==careerState.team?.name);
    const ranked=[...teams].sort((a,b)=>((Number(b.strength)||80)+stableSeasonNoise(b.name,year()*71+stageNo,3))-((Number(a.strength)||80)+stableSeasonNoise(a.name,year()*71+stageNo,3)));
    const userResult=String(h.result||'');
    if(/冠军/.test(userResult)&&!/亚军/.test(userResult)){
      h.champion=careerState.team?.name||'你的队伍';h.runnerUp=ranked[0]?.name||'另一支决赛队伍';
    }else if(/亚军/.test(userResult)){
      h.champion=ranked[0]?.name||'冠军队伍';h.runnerUp=careerState.team?.name||'你的队伍';
    }else{
      h.champion=ranked[0]?.name||'冠军队伍';h.runnerUp=ranked[1]?.name||'亚军队伍';
    }
    return h;
  }
  function tournamentName(stageNo){
    const h=(seasonState.stagePlayoffHistory||[]).find(x=>Number(x.stage)===Number(stageNo));
    if(h?.competitionId){
      const m=String(h.result||'').match(/^(.+?)(?:\s·\s|冠军|亚军|四强|八强|未晋级)/);if(m?.[1])return m[1].trim();
    }
    const names2022=['Kickoff Clash','Midseason Madness','Summer Showdown','Countdown Cup'];
    const names2021=['May Melee','June Joust','Summer Showdown','Countdown Cup'];
    const names2020=['May Melee','Summer Showdown','Countdown Cup'];
    const map=year()===2022?names2022:year()===2021?names2021:names2020;
    return map[stageNo-1]||`阶段赛事 ${stageNo}`;
  }
  function renderHistoricalTournamentResult(){
    const stageNo=Number(seasonState.v769TournamentResultPending)||0;if(!stageNo||!historicalModern())return;
    const h=enrichHistoricalTournament(stageNo);if(!h)return;
    const s=ensureSlot();if(!s)return;
    const name=tournamentName(stageNo),rounds=(h.rounds||[]).map(r=>`<span class="v42-stage-round ${r.won?'win':'loss'}"><b>${r.round||name}</b> vs ${r.opponent||'对手'} · ${r.score||(r.won?'胜':'负')}</span>`).join('');
    s.innerHTML=`<div class="stage-break-card v769-historical-result"><div class="offseason-kicker">${name} · FINAL</div><h3>🏆 ${name} 结算</h3><p>阶段赛事已经完成，结果已写入本赛季记录。</p><div class="stage-break-stats"><div><span>你的成绩</span><strong>${h.result||'未晋级'}</strong></div><div><span>冠军</span><strong>${h.champion||'待定'}</strong></div><div><span>亚军</span><strong>${h.runnerUp||'待定'}</strong></div></div><div class="v42-stage-rounds">${rounds||'<span class="v42-stage-round">本次未产生玩家对局记录</span>'}</div><div class="v42-stage-final">🏆 决赛：${h.champion||'待定'} 击败 ${h.runnerUp||'待定'}</div><button class="primary-btn" id="v769ContinueHistoricalTournament" type="button">${seasonState.played>=seasonState.total?'进入常规赛结算 →':'继续下一阶段 →'}</button></div>`;
    s.classList.add('show');
    document.querySelector('#seasonScreen .season-actions')?.classList.add('v741-milestone-blocked');
    document.getElementById('v769ContinueHistoricalTournament')?.addEventListener('click',()=>{seasonState.v769TournamentResultPending=null;renderSeason();});
  }

  // 只有玩家亲手点击“模拟/结算阶段赛事”时才停下来展示结果；整季快速模拟与开发者跳季不被打断。
  document.addEventListener('click',e=>{
    if(historicalModern()&&e.target?.closest?.('#resolveStageBreakBtn'))seasonState.v769InteractiveTournamentResolve=true;
  },true);
  const _sim=simulateStagePlayoff;
  simulateStagePlayoff=function(stageNo){
    const interactive=!!seasonState.v769InteractiveTournamentResolve;seasonState.v769InteractiveTournamentResolve=false;
    const out=_sim(stageNo);if(historicalModern()){enrichHistoricalTournament(stageNo);if(interactive){seasonState.v769TournamentResultPending=Number(stageNo);renderSeason();}}return out;
  };
  const _skip=skipStageBreak;
  skipStageBreak=function(stageNo){
    const interactive=!!seasonState.v769InteractiveTournamentResolve;seasonState.v769InteractiveTournamentResolve=false;
    const out=_skip(stageNo);if(historicalModern()){enrichHistoricalTournament(stageNo);if(interactive){seasonState.v769TournamentResultPending=Number(stageNo);renderSeason();}}return out;
  };

  const _render=renderSeason;
  renderSeason=function(){
    // 历史年份必须在旧render链执行前先清空2024+内联Major，否则它会抢“唯一节点”的位置。
    if(year()<2024){
      const inline=document.getElementById('v741SeasonInlineMilestone');
      if(inline){inline.innerHTML='';inline.classList.remove('show');delete inline.dataset.v743State;}
      seasonState.v71LastMajorSummary=null;seasonState.v71AllStarPending=false;
    }
    _render();
    enforceSingleMilestone();
    if(seasonState.v769TournamentResultPending)renderHistoricalTournamentResult();
    // 非里程碑状态恢复普通操作区。
    if(!seasonState.stageBreakPending&&!seasonState.v71LastMajorSummary&&!seasonState.v769TournamentResultPending){document.querySelector('#seasonScreen .season-actions')?.classList.remove('v741-milestone-blocked');}
  };

  window.__OWL_V769_DIAGNOSTICS=()=>{
    const s=ensureSlot(),all=cards();
    return {version:V769_VERSION,year:year(),played:Number(seasonState.played||0),stageBreakPending:seasonState.stageBreakPending||null,tournamentResultPending:seasonState.v769TournamentResultPending||null,milestoneCount:all.length,titles:all.map(x=>x.title),cardsOutsidePrimary:all.filter(x=>!x.inSlot).length,primaryTitle:s?.querySelector('.stage-break-card h3,.season-complete-banner strong')?.textContent?.trim()||null,trackDirectStageCards:track()?[...track().children].filter(n=>n.classList?.contains('stage-break-card')).length:0};
  };

  // 浏览器自动回归钩子：直接构造赛段边界，避免每次人工点击几十场。
  window.__OWL_V769_TEST_STAGE_BREAK=(testYear=2022,stageNo=1,teamShort='GZC')=>{
    careerState.simulationMode=Number(testYear)<=2023?'fantasy':'history';careerState.startYear=Math.min(Number(testYear)||2019,2023);careerState.seasonYear=Number(testYear)||2019;
    if(typeof v50ApplySeasonWorld==='function')v50ApplySeasonWorld(careerState.seasonYear);
    careerState.team=TEAMS.find(t=>t.short===teamShort)||v50ActiveTeams()[0];careerState.starters=createRoster(careerState.team,true);careerState.bench=createBenchForTeam(careerState.team);setupSeason(false);
    const targets={2019:[7,14,21],2020:[7,14,21],2021:[4,8,12,16],2022:[6,12,18,24],2023:[8,16],2024:[19,37,56]};
    const arr=targets[careerState.seasonYear]||[19,37,56],target=arr[Math.max(0,stageNo-1)]||arr.at(-1);
    seasonState.played=target;seasonState.wins=Math.ceil(target*.58);seasonState.losses=target-seasonState.wins;seasonState.results=Array(seasonState.total).fill(null).map((_,i)=>i<target?(i%3===0?'loss':'win'):null);seasonState.stageProcessed=(seasonState.stageProcessed||[]).filter(n=>n!==stageNo);seasonState.stageBreakPending=stageNo;seasonState.v769TournamentResultPending=null;renderSeason();showScreen('season');return window.__OWL_V769_DIAGNOSTICS();
  };

  try{enforceSingleMilestone();}catch(e){console.warn('[V7.7.0] milestone cleanup skipped',e)}
})();
