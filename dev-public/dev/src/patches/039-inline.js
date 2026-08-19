
/* ===== V7.7.3 · Compact playoffs / unified hero market / legacy Career Feed / conference fix / auto training / remote dev unlock ===== */
(function(){
  const VER='V7.7.3';

  /* 1) OWL 2.0 conferences are independent of the old Atlantic/Pacific divisions.
        Keep this as a single explicit 10/10 map so historical division metadata can never leak into Major slots again. */
  const EAST_SHORTS=new Set(['CDH','GZC','HZS','VAL','PHI','SEO','SHD','NYXL','BOS','TOR','TYO','OSA']);
  function teamObject(x){
    if(!x)return null;
    if(x.team)return x.team;
    if(x.short)return x;
    if(x.name)return TEAMS.find(t=>t.name===x.name)||x;
    return null;
  }
  function v772ConferenceOf(x){
    const t=teamObject(x);
    if(!t)return 'West';
    return EAST_SHORTS.has(t.short)?'East':'West';
  }
  function v772ApplyConferenceMeta(){
    const y=Number(careerState.seasonYear||careerState.startYear||2019);
    TEAMS.forEach(t=>{
      if(!t.v772HistoricalDivision)t.v772HistoricalDivision=t.division;
      if(y>=2024){
        const east=EAST_SHORTS.has(t.short);
        /* private V7.1 conference helper reads the old division first, so align both fields before it runs */
        t.division=east?'Atlantic':'Pacific';
        t.conference=east?'East':'West';
      }else{
        t.division=t.v772HistoricalDivision||t.division;
        if(t.conference)delete t.conference;
      }
    });
  }
  const _setupSeasonConference=setupSeason;
  setupSeason=function(isRestart=false){
    v772ApplyConferenceMeta();
    const out=_setupSeasonConference(isRestart);
    v772ApplyConferenceMeta();
    return out;
  };
  function v772RepairMajorConference(){
    if(Number(careerState.seasonYear||0)<2024)return;
    const h=seasonState.v71LastMajorSummary;
    if(!h?.champion)return;
    const champ=TEAMS.find(t=>t.name===h.champion);
    if(!champ)return;
    const conf=v772ConferenceOf(champ);
    h.championConference=conf;
    seasonState.majorSlotOwner=conf;
    if(Number(h.stage)===3)careerState.nextMajor1ChampionConference=conf;
  }

  /* 2) Postseason defaults to the player's own compact card.
        Full bracket is opt-in, especially important on mobile. */
  const _setupPlayoffs=setupPlayoffs;
  setupPlayoffs=function(){
    const out=_setupPlayoffs();
    playoffState.v772BracketExpanded=false;
    return out;
  };
  function v772PatchPlayoffView(){
    const screen=document.getElementById('playoffScreen');
    const teamCard=screen?.querySelector('.playoff-team-card');
    const bracket=screen?.querySelector('.bracket-card');
    if(!screen||!teamCard||!bracket)return;
    const expanded=!!playoffState.v772BracketExpanded;
    screen.classList.toggle('v772-playoff-collapsed',!expanded);
    screen.classList.toggle('v772-playoff-expanded',expanded);
    teamCard.querySelector('.v772-playoff-mini-status')?.remove();
    const current=(typeof currentPlayoffMatch==='function'?currentPlayoffMatch():null);
    let opponent=null;
    try{opponent=typeof currentPlayoffOpponent==='function'?currentPlayoffOpponent():null}catch(_){}
    const result=(typeof getPlayoffResultLabel==='function'?getPlayoffResultLabel():'季后赛进行中');
    const node=document.createElement('div');node.className='v772-playoff-mini-status';
    node.innerHTML=`<div class="v772-playoff-mini-copy"><span>${current?'当前对阵':'当前状态'}</span><strong>${current?`${current.stage}${opponent?` · vs ${opponent.name}`:''}`:result}</strong></div><button class="v772-playoff-toggle" type="button">${expanded?'收起完整对阵':'展开完整对阵'}</button>`;
    teamCard.appendChild(node);
    node.querySelector('.v772-playoff-toggle')?.addEventListener('click',()=>{
      playoffState.v772BracketExpanded=!expanded;
      renderPlayoffs();
    });
  }
  const _renderPlayoffs=renderPlayoffs;
  renderPlayoffs=function(){
    const out=_renderPlayoffs();
    v772PatchPlayoffView();
    return out;
  };

  /* 3) Hero-pool market value is a PLAYER property. Show it once above the offers,
        while the numeric effect still applies to every team's actual offer calculation. */
  const _renderContractMarket=renderContractMarket;
  renderContractMarket=function(wrap){
    const out=_renderContractMarket(wrap);
    if(!wrap)return out;
    wrap.querySelectorAll('.v75-offer-hero').forEach(n=>n.remove());
    wrap.querySelector('.v772-personal-hero-market')?.remove();
    const h=(typeof window.__OWL_V75_DIAGNOSTICS==='function'?window.__OWL_V75_DIAGNOSTICS().heroMarket:null);
    if(!h)return out;
    const box=document.createElement('div');box.className='v772-personal-hero-market';
    box.innerHTML=`<div><span>🎮 你的英雄池市场画像</span><strong>${h.label}</strong><small>这项评价属于你本人，会统一影响各队报价与角色承诺，不再在每支队伍卡片里重复展示。</small></div><div class="v772-hero-stats"><strong>${h.topHeroes.slice(0,4).map(x=>`${x.name} ${Math.round(x.value)}`).join(' · ')||'—'}</strong><small>${Number(careerState.seasonYear||2019)+1>=2025?`抗Ban深度 ${h.breadth}`:`英雄池宽度 ${h.breadth}`} · 精通以上 ${h.elite} · 市场修正 ${h.premium>=0?'+':''}${h.premium}</small></div>`;
    const grid=wrap.querySelector('.offers-grid');
    if(grid)wrap.insertBefore(box,grid);else wrap.appendChild(box);
    return out;
  };

  /* 4) Career Feed now works in every historical season too.
        Pre-2024 doesn't invent map/Ban detail: it records the real match result + rating that the old sim actually produced. */
  function stageForIndex(year,idx){
    const f=typeof getSeasonFormat==='function'?getSeasonFormat(year):null;
    if(!f||!Array.isArray(f.stageGames))return 1;
    let sum=0;
    for(let i=0;i<f.stageGames.length;i++){sum+=Number(f.stageGames[i]||0);if(idx<sum)return i+1;}
    return f.stageGames.length||1;
  }
  function legacyStoryExists(year,matchNo){
    return (seasonState.v75StoryLog||[]).some(r=>r.year===year&&r.matchNo===matchNo);
  }
  function captureLegacyStory(idx,opponent,rating,won){
    const year=Number(careerState.seasonYear||2019),matchNo=idx+1;
    if(year>=2024||legacyStoryExists(year,matchNo))return;
    seasonState.v75StoryLog=seasonState.v75StoryLog||[];
    careerState.v75StoryHistory=careerState.v75StoryHistory||[];
    const rec={
      year,stage:stageForIndex(year,idx),matchNo,opponent:opponent?.name||'未知对手',won:!!won,
      score:won?'系列赛胜':'系列赛负',mapsPlayed:1,totalMaps:1,avg:Number.isFinite(Number(rating))?Number(Number(rating).toFixed(1)):null,
      targetedBans:0,banObserved:0,directBans:0,severeBans:0,hero:null,wasBenched:false,returned:false,lineupNotes:[]
    };
    seasonState.v75StoryLog.push(rec);
    careerState.v75StoryHistory.push({...rec});
    careerState.v75StoryHistory=careerState.v75StoryHistory.slice(-300);
    if(rec.avg!=null&&rec.avg>=9){
      careerState.careerMemories=careerState.careerMemories||[];
      const key=`legacy-9plus-${year}-${matchNo}`;
      if(!careerState.careerMemories.some(x=>x.key===key)){
        careerState.careerMemories.push({key,icon:'🔥',title:'爆炸级系列赛',text:`${year}赛季对阵${rec.opponent}打出${rec.avg.toFixed(1)}评分。`,weight:1,year,age:careerState.age,team:careerState.team?.name||'—'});
      }
    }
  }
  function legacyAfter(before,opp,ratingIndex,winsBefore){
    if(Number(careerState.seasonYear||2019)>=2024||seasonState.played<=before)return;
    const rating=seasonState.userRatings?.[ratingIndex]??seasonState.userRatings?.at(-1)??null;
    captureLegacyStory(before,opp,rating,seasonState.wins>winsBefore);
  }
  const _single=simulateSingleRegularMatch;
  simulateSingleRegularMatch=function(){
    const before=Number(seasonState.played||0),opp=seasonState.opponents?.[before],ri=seasonState.userRatings?.length||0,w=Number(seasonState.wins||0);
    const out=_single();
    legacyAfter(before,opp,ri,w);
    return out;
  };
  const _silent=v32SilentRegularGame;
  v32SilentRegularGame=function(){
    const before=Number(seasonState.played||0),opp=seasonState.opponents?.[before],ri=seasonState.userRatings?.length||0,w=Number(seasonState.wins||0);
    const out=_silent();
    legacyAfter(before,opp,ri,w);
    return out;
  };
  const _fast=fastSeasonStep;
  fastSeasonStep=function(){
    const before=Number(seasonState.played||0),opp=seasonState.opponents?.[before],ri=seasonState.userRatings?.length||0,w=Number(seasonState.wins||0);
    const out=_fast();
    legacyAfter(before,opp,ri,w);
    return out;
  };
  const _manualRecord=recordManualSeasonMatch;
  recordManualSeasonMatch=function(){
    const before=Number(seasonState.played||0),idx=seasonState.pendingManualIndex,opp=idx!=null?seasonState.opponents?.[idx]:null,ri=seasonState.userRatings?.length||0,w=Number(seasonState.wins||0),decBefore=Number(seasonState.decisionTotal||0);
    const out=_manualRecord();
    if(Number(careerState.seasonYear||2019)<2024&&seasonState.played>before)legacyAfter(before,opp,ri,w);

    /* 5) Some 2024 headless/full-series routes contain no explicit critical-choice UI,
          which used to leave decision success as "—". If a played series contributed zero decisions,
          generate the same abstract tactical decisions that legacy quick sim already uses. */
    if(seasonState.played>before && (seasonState.userRatings?.length||0)>ri && Number(seasonState.decisionTotal||0)===decBefore){
      const rating=Number(seasonState.userRatings?.at(-1)||6.8),ovr=Number(getMyOvr()==='--'?78:getMyOvr());
      const decisions=Math.max(1,Math.min(4,Math.round(1.4+(matchState.results?.length||3)*.35)));
      const rate=clamp(.46+(ovr-75)*.010+(rating-6.5)*.055,.32,.88);
      let success=0;for(let i=0;i<decisions;i++)if(Math.random()<rate)success++;
      seasonState.decisionTotal+=decisions;seasonState.decisionSuccess+=success;
    }
    return out;
  };

  /* 6) One-click auto training: role weighting + balance pressure.
        It spends all currently useful points and immediately continues; no second confirmation. */
  function autoTrainingScore(attr,mean){
    const weights=ROLE_WEIGHTS[state.role]||{};
    const value=Number(state.locked[attr.key]?.value||75);
    const allocation=Number(offseasonState.trainingAllocations?.[attr.key]||0);
    const cost=trainingPointCost(value);
    const roleWeight=Number(weights[attr.key]||0);
    const balance=Math.max(-8,Math.min(12,mean-value));
    return roleWeight*8 + balance*.42 - allocation*1.35 - cost*.32 + (attr.key==='pool'?.25:0);
  }
  function v772AutoTraining(){
    if(!offseasonState.ageTransitionApplied)return;
    let guard=0;
    while(offseasonState.trainingRemaining>0&&canSpendTrainingPoint()&&guard++<160){
      const vals=ATTRS.map(a=>Number(state.locked[a.key]?.value||75));
      const mean=vals.reduce((a,b)=>a+b,0)/Math.max(1,vals.length);
      const candidates=ATTRS.map(attr=>{
        const value=Number(state.locked[attr.key]?.value||75),count=Number(offseasonState.trainingAllocations[attr.key]||0),cost=trainingPointCost(value);
        return{attr,value,count,cost,score:autoTrainingScore(attr,mean)};
      }).filter(x=>x.value<99&&x.count<4&&x.cost<=offseasonState.trainingRemaining).sort((a,b)=>b.score-a.score||a.value-b.value);
      const x=candidates[0];if(!x)break;
      offseasonState.trainingRemaining-=x.cost;
      offseasonState.trainingAllocations[x.attr.key]=x.count+1;
      offseasonState.trainingHistory[x.attr.key]=offseasonState.trainingHistory[x.attr.key]||[];
      offseasonState.trainingHistory[x.attr.key].push(x.cost);
      setCareerAttributeValue(x.attr.key,x.value+1);
    }
    careerState.peakOvr=Math.max(careerState.peakOvr,Number(getMyOvr()==='--'?0:getMyOvr()));
    renderOffseason();
  }
  const _renderTraining=renderTrainingCamp;
  renderTrainingCamp=function(wrap){
    const out=_renderTraining(wrap);
    const actions=wrap?.querySelector('.training-actions');if(!actions||document.getElementById('v772AutoTrainingBtn'))return out;
    const btn=document.createElement('button');btn.className='secondary-btn v772-auto-training';btn.id='v772AutoTrainingBtn';btn.textContent='⚡ 自动加点';
    actions.insertBefore(btn,actions.firstChild);
    btn.addEventListener('click',v772AutoTraining);
    return out;
  };

  /* 7) Remote developer unlock.
        Local files still work as before. On a hosted build, creating the player ID jack1995hjj
        makes the Developer Mode setting available for that career. */
  const _localDev=isLocalDeveloperEnvironment;
  isLocalDeveloperEnvironment=function(){
    const local=!!_localDev();
    let name='';try{name=String(getPlayerName?.()||state.playerName||'').trim().toLowerCase()}catch(_){name=String(state.playerName||'').trim().toLowerCase()}
    return local||name==='jack1995hjj';
  };

  const _renderSeasonConference=renderSeason;
  renderSeason=function(){
    v772ApplyConferenceMeta();
    v772RepairMajorConference();
    const out=_renderSeasonConference();
    if(Number(careerState.seasonYear||2019)<2024){
      const storyNote=document.querySelector('.v75-story-head small');
      if(storyNote)storyNote.textContent='赛果、个人评分与生涯事件同步记录';
    }
    return out;
  };

  /* Diagnostics for automated QA. */
  window.__OWL_V772_QA=()=>({
    version:VER,
    year:Number(careerState.seasonYear||0),
    gzcConference:v772ConferenceOf(TEAMS.find(t=>t.short==='GZC')),
    majorSlotOwner:seasonState.majorSlotOwner||null,
    decisionTotal:Number(seasonState.decisionTotal||0),
    decisionSuccess:Number(seasonState.decisionSuccess||0),
    storyCount:(seasonState.v75StoryLog||[]).length,
    playoffExpanded:!!playoffState.v772BracketExpanded,
    devAuthorized:isLocalDeveloperEnvironment(),
    offerHeroRepeats:document.querySelectorAll('.v75-offer-hero').length,
    personalHeroCards:document.querySelectorAll('.v772-personal-hero-market').length
  });
})();
