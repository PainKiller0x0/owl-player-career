
/* ===== V7.7.1 P0 · Authoritative season formats / invariant guard / fixed regression surface ===== */
(function(){
  const VER='7.7.1';
  const FORMAT_TABLE=Object.freeze({
    2019:Object.freeze({year:2019,total:28,stageGames:[7,7,7,7],stageNames:['Stage 1','Stage 2','Stage 3','Stage 4'],milestones:[7,14,21],allStarAfter:null,heroBan:false,mapVoting:false}),
    2020:Object.freeze({year:2020,total:21,stageGames:[6,5,5,5],stageNames:['赛季前段','May Melee资格期','Summer Showdown资格期','Countdown Cup资格期'],milestones:[11,16,21],allStarAfter:null,heroBan:false,mapVoting:false}),
    2021:Object.freeze({year:2021,total:16,stageGames:[4,4,4,4],stageNames:['May Melee资格赛','June Joust资格赛','Summer Showdown资格赛','Countdown Cup资格赛'],milestones:[4,8,12,16],allStarAfter:null,heroBan:false,mapVoting:false}),
    2022:Object.freeze({year:2022,total:24,stageGames:[6,6,6,6],stageNames:['Kickoff Clash资格赛','Midseason Madness资格赛','Summer Showdown资格赛','Countdown Cup资格赛'],milestones:[6,12,18,24],allStarAfter:null,heroBan:false,mapVoting:false}),
    2023:Object.freeze({year:2023,total:16,stageGames:[8,8],stageNames:['Spring Stage','Summer Stage'],milestones:[8],allStarAfter:null,heroBan:false,mapVoting:false}),
    2024:Object.freeze({year:2024,total:56,stageGames:[19,18,19],stageNames:['Stage 1','Stage 2','Stage 3'],milestones:[19,37,56],allStarAfter:2,heroBan:false,mapVoting:false}),
    2025:Object.freeze({year:2025,total:56,stageGames:[19,18,19],stageNames:['Stage 1','Stage 2','Stage 3'],milestones:[19,37,56],allStarAfter:2,heroBan:true,mapVoting:true}),
    2035:Object.freeze({year:2035,total:68,stageGames:[23,22,23],stageNames:['Stage 1','Stage 2','Stage 3'],milestones:[23,45,68],allStarAfter:2,heroBan:true,mapVoting:true}),
    2038:Object.freeze({year:2038,total:46,stageGames:[15,15,16],stageNames:['Stage 1','Stage 2','Stage 3'],milestones:[15,30,46],allStarAfter:2,heroBan:true,mapVoting:true}),
    2039:Object.freeze({year:2039,total:68,stageGames:[23,22,23],stageNames:['Stage 1','Stage 2','Stage 3'],milestones:[23,45,68],allStarAfter:2,heroBan:true,mapVoting:true}),
    2040:Object.freeze({year:2040,total:46,stageGames:[15,15,16],stageNames:['Stage 1','Stage 2','Stage 3'],milestones:[15,30,46],allStarAfter:2,heroBan:true,mapVoting:true})
  });
  function year(){return Number(careerState.seasonYear||careerState.startYear||2019)}
  function format(y=year()){
    y=Number(y)||2019;
    if(y>=2040)return FORMAT_TABLE[2040];
    if(y===2039)return FORMAT_TABLE[2039];
    if(y===2038)return FORMAT_TABLE[2038];
    if(y>=2035)return FORMAT_TABLE[2035];
    if(y>=2025)return FORMAT_TABLE[2025];
    if(y>=2024)return FORMAT_TABLE[2024];
    return FORMAT_TABLE[y]||FORMAT_TABLE[2019];
  }
  function boundaries(f=format()){
    let n=0;return f.stageGames.map(g=>(n+=g));
  }
  function phase(){
    if(seasonState.v769TournamentResultPending)return 'tournament-result';
    if(seasonState.v71LastMajorSummary)return 'major-result';
    if(seasonState.v71AllStarPending)return 'all-star';
    if(seasonState.stageBreakPending)return 'stage-break';
    if(Number(seasonState.played||0)>=Number(seasonState.total||format().total))return 'regular-complete';
    return 'regular';
  }
  function repair(tag='runtime'){
    const f=format(),y=year(),issues=[];
    if(!seasonState.active){seasonState.v771Phase='inactive';return {ok:true,tag,year:y,phase:'inactive',issues};}
    let bound=Number(seasonState.boundSeasonYear||0);
    if(!bound){seasonState.boundSeasonYear=y;bound=y;}
    if(bound!==y){
      // Cross-year dirty state is intentionally not silently reused; startSeason's v7.6.6 guard will rebuild it.
      issues.push(`bound-year:${bound}->${y}`);
      seasonState.v771Phase='stale-year';
      return {ok:false,tag,year:y,bound,phase:'stale-year',issues};
    }
    const expected=f.total;
    if(Number(seasonState.total)!==expected){
      issues.push(`total:${seasonState.total}->${expected}`);
      seasonState.total=expected;
      if(!Array.isArray(seasonState.results))seasonState.results=[];
      if(seasonState.results.length<expected)seasonState.results.push(...Array(expected-seasonState.results.length).fill(null));
      else if(seasonState.results.length>expected)seasonState.results=seasonState.results.slice(0,expected);
    }
    seasonState.played=Math.max(0,Math.min(expected,Number(seasonState.played||0)));
    const pending=Number(seasonState.stageBreakPending||0);
    if(pending){
      const validStage=pending>=1&&pending<=f.stageGames.length;
      const validPlayed=f.milestones.includes(Number(seasonState.played||0));
      if(!validStage||!validPlayed){issues.push(`invalid-stage-break:${pending}@${seasonState.played}`);seasonState.stageBreakPending=null;}
    }
    if(y>=2024 && Number(seasonState.stageBreakPending||0)>3){issues.push('owl2-stage4-cleared');seasonState.stageBreakPending=null;}
    seasonState.v771FormatYear=f.year;
    seasonState.v771Phase=phase();
    return {ok:issues.length===0,tag,year:y,bound,phase:seasonState.v771Phase,issues};
  }
  window.SEASON_FORMATS=FORMAT_TABLE;
  window.getSeasonFormat=(y=year())=>format(y);
  window.__OWL_V771_REPAIR=(tag='manual')=>repair(tag);

  const _setup=setupSeason;
  setupSeason=function(isRestart=false){
    const out=_setup(isRestart);
    seasonState.boundSeasonYear=year();
    seasonState.v771FormatVersion=VER;
    repair('setup');
    return out;
  };
  const _render=renderSeason;
  renderSeason=function(){
    repair('pre-render');
    _render();
    repair('post-render');
  };

  function stateSnapshot(){
    const f=format(),b=boundaries(f),p=phase(),milestones=[...document.querySelectorAll('#seasonScreen .stage-break-card,#seasonScreen .season-complete-banner')],primary=document.getElementById('v768SeasonPrimaryAction');
    const ids=[...document.querySelectorAll('[id]')].reduce((m,n)=>(m[n.id]=(m[n.id]||0)+1,m),{});
    return {version:VER,year:year(),bound:Number(seasonState.boundSeasonYear||0),active:!!seasonState.active,played:Number(seasonState.played||0),total:Number(seasonState.total||0),expectedTotal:f.total,stageGames:[...f.stageGames],boundaries:b,phase:p,stageBreakPending:seasonState.stageBreakPending||null,duplicateIds:Object.entries(ids).filter(([,n])=>n>1).map(([id,n])=>({id,n})),milestoneCount:milestones.length,outsidePrimary:milestones.filter(n=>!primary?.contains(n)).length,stage4Ghost:year()>=2024&&(/Stage\s*4/i.test(primary?.innerText||'')||!!document.querySelector('#seasonScreen #v42ContinueStageBtn')),prematureFinal:year()>=2024&&Number(seasonState.played||0)<f.total&&!!document.querySelector('#seasonScreen .season-complete-banner')};
  }
  window.__OWL_V771_STATE_QA=stateSnapshot;

  // Stable in-page regression hooks. External Playwright runner calls these after every build.
  window.__OWL_V771_REGRESSION=()=>{
    const tournament=typeof owlTournamentSelfTest==='function'?owlTournamentSelfTest():{pass:false,cases:[]};
    const formatChecks=Object.values(FORMAT_TABLE).map(f=>({year:f.year,total:f.total,sum:f.stageGames.reduce((a,b)=>a+b,0),pass:f.total===f.stageGames.reduce((a,b)=>a+b,0)&&f.milestones.every(x=>x<=f.total)}));
    return {version:VER,tournament,formatChecks,formatPass:formatChecks.every(x=>x.pass),state:stateSnapshot()};
  };
})();

/* ===== V7.7.1 · Character creation reroll budget: 5 per attribute round, never reset by team reroll ===== */
(function(){
  const LIMIT=5;
  // The old rollTeamData implementations regenerate the team and candidates AND reset rerolls.
  // Preserve the current round budget across a team reroll; a new attribute round still resets to five.
  const _rollTeamData=rollTeamData;
  rollTeamData=function(){
    const before=Number.isFinite(Number(state.rerolls))?Number(state.rerolls):LIMIT;
    const out=_rollTeamData();
    state.rerolls=Math.max(0,Math.min(LIMIT,before));
    return out;
  };
  const _resetBuildOnly=resetBuildOnly;
  resetBuildOnly=function(){const out=_resetBuildOnly();state.rerolls=LIMIT;return out;};
  window.__OWL_V771_REROLL_QA=()=>({limit:LIMIT,remaining:Number(state.rerolls||0),round:Number(state.round||0),hasRolled:!!state.hasRolled});
})();

/* ===== V7.7.1 · Team selection: region first, alphabetical inside region ===== */
(function(){
  const EAST_BY_YEAR={
    2020:new Set(['CDH','GZC','HZS','LDN','NYE','SEO','SHD']),
    2021:new Set(['CDH','GZC','HZS','VAL','NYE','PHI','SEO','SHD']),
    2022:new Set(['CDH','GZC','HZS','VAL','PHI','SEO','SHD']),
    2023:new Set(['DAL','GZC','HZS','PHI','SEO','SHD'])
  };
  function y(){return Number(careerState.seasonYear||careerState.startYear||2019)}
  function region(team){
    const yr=y();
    if(yr===2019)return team.division==='Atlantic'?'East':'West';
    if(yr>=2020&&yr<=2023)return EAST_BY_YEAR[yr]?.has(team.short)?'East':'West';
    return team.conference==='East'||team.division==='Atlantic'?'East':'West';
  }
  function label(key){
    if(y()===2019)return key==='East'?'大西洋赛区':'太平洋赛区';
    return key==='East'?'东部赛区':'西部赛区';
  }
  function badge(key){return `<span class="division-badge ${key==='East'?'atlantic':'pacific'}">${key==='East'?'EAST':'WEST'} · ${label(key)}</span>`;}
  function orderedPool(){
    const raw=(typeof v50ActiveTeams==='function'?v50ActiveTeams():TEAMS.filter(t=>t.active!==false));
    const sort=(a,b)=>String(a.enName||a.name).localeCompare(String(b.enName||b.name),'en',{sensitivity:'base'});
    return {East:raw.filter(t=>region(t)==='East').sort(sort),West:raw.filter(t=>region(t)==='West').sort(sort)};
  }
  const _render=renderTeamChoiceWheel;
  renderTeamChoiceWheel=function(){
    const out=_render();
    const grid=els.careerTeamManualGrid;if(!grid)return out;
    const groups=orderedPool();
    grid.classList.add('v771-grouped-team-grid');
    grid.innerHTML=['East','West'].map(key=>{
      const teams=groups[key];
      return `<section class="v771-team-region" data-team-region="${key}"><div class="v771-team-region-head"><strong>${label(key)}</strong><span>${key}</span><span class="v771-team-region-count">${teams.length}支</span></div><div class="v771-team-region-grid">${teams.map(team=>`<button class="team-manual-item ${careerState.teamSelectionTarget?.name===team.name?'active':''}" data-manual-team="${team.name}" data-team-short="${team.short}"><img class="team-mini-logo" src="${team.logo}" onerror="this.style.visibility='hidden'"><span>${team.name}</span>${badge(key)}</button>`).join('')}</div></section>`;
    }).join('');
    grid.querySelectorAll('[data-manual-team]').forEach(btn=>btn.addEventListener('click',()=>chooseManualCareerTeam(btn.dataset.manualTeam)));
    grid.classList.toggle('ui-hidden',!careerState.teamSelectManual);
    return out;
  };
  window.__OWL_V771_TEAM_QA=()=>[...document.querySelectorAll('#careerTeamManualGrid .v771-team-region')].map(sec=>({region:sec.dataset.teamRegion,label:sec.querySelector('.v771-team-region-head strong')?.textContent||'',teams:[...sec.querySelectorAll('[data-team-short]')].map(b=>b.dataset.teamShort)}));
})();
