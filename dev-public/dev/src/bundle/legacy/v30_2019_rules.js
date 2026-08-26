/* ===== BUNDLE MODULE: legacy/v30_2019_rules.js ===== */
/* ==========================================================================
   MODULE: legacy/v30_2019_rules.js
   Compatibility layer: 2019 OWL rules/data overrides
   Migrated from V6.2 lines 8547-9045; execution order is defined by manifest.json.
   ========================================================================== */
    /* ================= V3.0 · OWL 2019 规则 / 数据覆盖层 ================= */
    function teamLogoMarkup(team,alt='') {
      if(!team) return '<span class="team-logo-fallback" style="display:grid">—</span>';
      const safe=(alt||team.name).replace(/"/g,'&quot;');
      return `<img class="owl-logo-img" src="${team.logo}" alt="${safe}" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span class="team-logo-fallback">${team.short}</span>`;
    }
    function deterministicJitter(seed,key,range=3){
      const s=`${seed}-${key}`; let h=0; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0;
      return (h%(range*2+1))-range;
    }
    function historicalAttributes(entry){
      const [name,role,ovr]=entry; const attrs={}; const bias=roleBias[role]||{};
      ATTRS.forEach(a=>{
        const roleLift=Math.round((bias[a.key]||0)*.42);
        attrs[a.key]=clamp(ovr-2+roleLift+deterministicJitter(name,a.key,3),58,99);
      });
      return attrs;
    }
    function historicalPlayer(entry,team,index=0){
      const [name,role,ovr]=entry; const attrs=historicalAttributes(entry);
      return {id:`hist-${team.short}-${name}-${index}`,name,role,attrs,overall:ovr,color:team.color,isUser:false,historical:true};
    }
    function historicalRosterEntries(team){ return OWL2019_ROSTERS[team?.name]||[]; }

    // 创角抽属性时也直接抽取该队 2019 名单，不再生成虚构候选。
    generatePlayers=function(team){
      const entries=shuffle([...historicalRosterEntries(team)]).slice(0,4);
      if(!entries.length) return [];
      return entries.map((entry,index)=>{
        const p=historicalPlayer(entry,team,index);
        const best=[...ATTRS].sort((a,b)=>p.attrs[b.key]-p.attrs[a.key]).slice(0,2).map(a=>`${a.name} ${p.attrs[a.key]}`).join(' / ');
        return {...p,best};
      });
    };

    function bestHistoricalForRole(team,role){
      return historicalRosterEntries(team).filter(e=>e[1]===role).sort((a,b)=>b[2]-a[2])[0]||null;
    }

    // 比赛中心也使用真实队徽。
    const _v31RenderMatchLogos=renderMatch;
    renderMatch=function(){
      _v31RenderMatchLogos();
      const home=document.getElementById('homeLogo'),away=document.getElementById('awayLogo');
      if(home&&matchState.homeTeam){home.innerHTML=teamLogoMarkup(matchState.homeTeam);home.style.background='transparent';}
      if(away&&matchState.awayTeam){away.innerHTML=teamLogoMarkup(matchState.awayTeam);away.style.background='transparent';}
    };

    // Real 2019 rosters replace generic AI names. Player takes the starting slot of their chosen role.
    createRoster = function(team, includeUser) {
      const user=includeUser?createCareerPlayer():null;
      return ROLES.map((r,index)=>{
        if(includeUser && r.name===user.role) return {...user,color:team.color};
        const entry=bestHistoricalForRole(team,r.name);
        if(entry) return historicalPlayer(entry,team,index);
        const talent=clamp((team.strength||80)+rand(-3,3),70,94);
        const attrs=generateMatchAttributes(r.name,talent);
        return {id:`fallback-${team.short}-${index}-${Math.random()}`,name:pick(NAMES),role:r.name,attrs,overall:talent,color:team.color,isUser:false};
      });
    };

    createBenchForTeam = function(team) {
      const starterNames=new Set((careerState.starters||[]).map(p=>p.name));
      const historical=historicalRosterEntries(team)
        .filter(e=>!starterNames.has(e[0]))
        .sort((a,b)=>b[2]-a[2])
        .slice(0,4)
        .map((e,i)=>historicalPlayer(e,team,20+i));
      while(historical.length<4){
        const role=pick(ROLES).name, talent=clamp((team.strength||78)+rand(-8,-1),68,86), attrs=generateMatchAttributes(role,talent);
        historical.push({id:`bench-fallback-${team.short}-${historical.length}`,name:pick(NAMES),role,attrs,overall:talent,color:team.color,isUser:false});
      }
      return historical;
    };

    const _v30SetupCareerTeam=setupCareerTeam;
    setupCareerTeam=function(forceNew,fixedTeam=null){
      _v30SetupCareerTeam(forceNew,fixedTeam);
      if(!careerState.team) return;
      const power=careerState.team.strength||80;
      careerState.rank=clamp(Math.round(20-(power-73)*.78+rand(-2,2)),1,20);
      careerState.goal=careerState.rank<=6?'争夺联赛冠军':careerState.rank<=12?'冲击季后赛':'完成阵容磨合';
      careerState.starters=createRoster(careerState.team,true);
      careerState.bench=createBenchForTeam(careerState.team);
      careerState.seasonYear=(careerState.careerYears===1&&careerState.simulationMode!=='fantasy')?2019:(Number(careerState.seasonYear)||Number(careerState.startYear)||2019);
      renderCareerTeam();
    };

    careerLikeTeamPower=function(team){
      if(!team) return 0;
      if(team.name===careerState.team?.name && careerState.starters?.length) return teamDisplayPower(careerState.starters);
      return (team.strength||80)+randomCentered(.9);
    };

    // Logo rendering in the most visible team surfaces.
    const _v30RenderCareerTeam=renderCareerTeam;
    renderCareerTeam=function(){
      _v30RenderCareerTeam();
      if(careerState.team){
        const logo=document.getElementById('careerTeamLogo'); if(logo){logo.innerHTML=teamLogoMarkup(careerState.team);logo.style.background='transparent';}
      }
      if(careerState.awaitingTeamChoice) renderTeamChoiceWheel();
    };
    renderTeamChoiceWheel=function(){
      const wheel=els.careerTeamWheel; if(!wheel) return;
      const target=careerState.teamSelectionTarget||pick(TEAMS); if(!careerState.teamSelectionTarget) careerState.teamSelectionTarget=target;
      const idx=TEAMS.findIndex(t=>t.name===target.name),list=[];
      for(let offset=-2;offset<=2;offset++) list.push(TEAMS[(idx+offset+TEAMS.length)%TEAMS.length]);
      wheel.innerHTML=list.map(team=>`<div class="team-pick-row ${team.name===target.name?'current':''}" ${team.name===target.name?'aria-current="true"':''}><span class="team-pick-name"><img class="team-mini-logo" src="${team.logo}" onerror="this.style.visibility='hidden'">${team.name}</span><span class="team-pick-selected">✓ 当前选择</span></div>`).join('');
      els.careerTeamManualGrid.innerHTML=TEAMS.map(team=>`<button class="team-manual-item ${careerState.teamSelectionTarget?.name===team.name?'active':''}" data-manual-team="${team.name}"><img class="team-mini-logo" src="${team.logo}" onerror="this.style.visibility='hidden'"><span>${team.name}</span></button>`).join('');
      els.careerTeamManualGrid.querySelectorAll('[data-manual-team]').forEach(btn=>btn.addEventListener('click',()=>chooseManualCareerTeam(btn.dataset.manualTeam)));
      els.careerTeamManualGrid.classList.toggle('ui-hidden',!careerState.teamSelectManual);
      els.confirmCareerTeamBtn.textContent=`确认加入 ${target.name} →`;
      els.manualCareerTeamBtn.textContent=careerState.teamSelectManual?'收起队伍列表':'🎯 自选队伍';
    };

    // Appearance is now part of settings.
    const _v30RenderGameSettings=renderGameSettings;
    renderGameSettings=function(){
      _v30RenderGameSettings();
      if(els.appearanceModeToggle){
        const dark=document.documentElement.dataset.theme==='dark';
        els.appearanceModeToggle.textContent=dark?'切到日间':'切到夜间';
        els.appearanceModeToggle.classList.toggle('on',dark);
      }
    };
    const _v30ToggleTheme=toggleTheme;
    toggleTheme=function(){_v30ToggleTheme();renderGameSettings();};

    // 2019-style regular season: four stages, 7 matches per stage, 28 total.
    function buildOwl2019Schedule(){
      const me=careerState.team; const all=TEAMS.filter(t=>t.name!==me.name);
      const same=all.filter(t=>t.division===me.division), cross=all.filter(t=>t.division!==me.division);
      const first=shuffle([...all]);
      const extras=shuffle([...same,...same,...cross]).slice(0,9);
      const pool=[...first,...extras];
      // Keep 4 stages readable and avoid obvious immediate rematches.
      for(let i=1;i<pool.length;i++){
        if(pool[i].name===pool[i-1].name){
          const j=Math.min(pool.length-1,i+2); [pool[i],pool[j]]=[pool[j],pool[i]];
        }
      }
      seasonState.opponents=pool.slice(0,28);
      seasonState.venues=seasonState.opponents.map((_,i)=>i%2===0?'home':'away');
      seasonState.legs=seasonState.opponents.map((_,i)=>`Stage ${Math.floor(i/7)+1}`);
    }
    function currentStageNumber(){ return clamp(Math.floor(Math.min(seasonState.played,27)/7)+1,1,4); }
    function stageSlice(stageNo){ const s=(stageNo-1)*7; return seasonState.results.slice(s,s+7); }
    function stageRecord(stageNo){ const arr=stageSlice(stageNo); return {wins:arr.filter(x=>x==='win').length,losses:arr.filter(x=>x==='loss').length}; }
    function stageEstimatedRank(stageNo){
      const rec=stageRecord(stageNo); const myScore=rec.wins*10+(careerState.team.strength||80)*.22+randomCentered(1.2);
      const scores=TEAMS.filter(t=>t.name!==careerState.team.name).map(t=>({team:t,score:((t.strength||80)-72)*.42+rand(0,7)*10+randomCentered(4)}));
      return 1+scores.filter(x=>x.score>myScore).length;
    }
    function stagePlayoffChance(opponent,target){
      const our=teamDisplayPower(careerState.starters); const opp=opponent.strength||80;
      return clamp(.52+(our-opp)*.025+(careerState.condition-70)*.0025+(target===4?.01:0),.22,.84);
    }
    function simulateStagePlayoff(stageNo){
      const rank=stageEstimatedRank(stageNo); const qualifiers=TEAMS.filter(t=>t.name!==careerState.team.name).sort((a,b)=>(b.strength+randomCentered(4))-(a.strength+randomCentered(4))).slice(0,7);
      const qfOpp=qualifiers[Math.min(6,Math.max(0,7-rank))]||pick(qualifiers);
      let rounds=[];
      let won=Math.random()<stagePlayoffChance(qfOpp,3); rounds.push({round:'八强',opponent:qfOpp.name,won,target:3});
      if(won){const sfOpp=pick(qualifiers.filter(t=>t.name!==qfOpp.name));won=Math.random()<stagePlayoffChance(sfOpp,4);rounds.push({round:'半决赛',opponent:sfOpp.name,won,target:4});}
      if(won){const used=new Set(rounds.map(r=>r.opponent));const finOpp=pick(qualifiers.filter(t=>!used.has(t.name)))||pick(qualifiers);won=Math.random()<stagePlayoffChance(finOpp,4);rounds.push({round:'决赛',opponent:finOpp.name,won,target:4});}
      const result=won?'Stage 冠军':rounds.at(-1)?.round==='决赛'?'Stage 亚军':rounds.at(-1)?.round==='半决赛'?'Stage 四强':'Stage 八强';
      seasonState.stagePlayoffHistory.push({stage:stageNo,rank,result,rounds});
      if(won){seasonState.stageTitles.push(`Stage ${stageNo}冠军`);careerState.popularity=clamp(careerState.popularity+7,0,100);careerState.coachTrust=clamp(careerState.coachTrust+5,0,100);}
      seasonState.stageProcessed.push(stageNo); seasonState.stageBreakPending=null;
      renderSeason(); window.scrollTo({top:0,behavior:'smooth'});
    }
    function skipStageBreak(stageNo){ seasonState.stageProcessed.push(stageNo);seasonState.stagePlayoffHistory.push({stage:stageNo,rank:stageEstimatedRank(stageNo),result:'未晋级Stage季后赛',rounds:[]});seasonState.stageBreakPending=null;renderSeason();window.scrollTo({top:0,behavior:'smooth'}); }
    function markStageBreakIfNeeded(){
      const boundaries={7:1,14:2,21:3}; const stageNo=boundaries[seasonState.played];
      if(stageNo && !seasonState.stageProcessed.includes(stageNo)){
        seasonState.stageBreakPending=stageNo;seasonState.simulating=false;if(seasonState.timer)clearTimeout(seasonState.timer);seasonState.timer=null;
      }
    }

    const _v30SetupSeason=setupSeason;
    setupSeason=function(isRestart=false){
      seasonState.total=28; _v30SetupSeason(isRestart); seasonState.total=28;
      seasonState.results=Array(28).fill(null); buildOwl2019Schedule();
      seasonState.stageBreakPending=null;seasonState.stageProcessed=[];seasonState.stagePlayoffHistory=[];seasonState.stageTitles=[];seasonState.stageTables={};seasonState.finalStandingsCache=null;careerState.postseasonSeed=null;
      renderSeason();
    };
    const _v30RenderSeason=renderSeason;
    renderSeason=function(){
      _v30RenderSeason(); if(!careerState.team)return;
      const stage=currentStageNumber(), stagePlayed=seasonState.played-(stage-1)*7;
      const logo=document.getElementById('seasonTeamLogo'); if(logo){logo.innerHTML=teamLogoMarkup(careerState.team);logo.style.background='transparent';}
      const league=document.getElementById('seasonLeagueText'); if(league)league.textContent=`Overwatch League · ${careerState.team.division} · Stage ${stage}`;
      const head=document.querySelector('.season-track-head h3+span'); if(head)head.textContent='20 支队伍 · 4 个 Stage × 7 场 · 共 28 场';
      const dots=document.getElementById('seasonDots'); if(dots){
        dots.innerHTML=Array.from({length:4},(_,si)=>`<div class="stage-dot-group"><b>STAGE ${si+1}</b><div class="stage-dot-row">${Array.from({length:7},(_,j)=>{const i=si*7+j,r=seasonState.results[i];return `<i class="season-dot ${r||''} ${i===seasonState.played&&seasonState.played<28?'current':''}" title="Stage ${si+1} · 第${j+1}场${seasonState.opponents[i]?' · '+seasonState.opponents[i].name:''}"></i>`}).join('')}</div></div>`).join('');
      }
      const progress=document.getElementById('seasonProgressCopy'); if(progress && seasonState.played<28)progress.innerHTML=`Stage ${stage} · <strong>${stagePlayed} / 7</strong> · 全赛季 ${seasonState.played} / 28`;
      if(seasonState.stageBreakPending){
        const s=seasonState.stageBreakPending,rec=stageRecord(s),rank=stageEstimatedRank(s),qualified=(typeof stageQualified==='function'?stageQualified(s):rank<=8);
        const area=document.getElementById('seasonCompleteArea');
        area.innerHTML=`<div class="stage-break-card"><div class="offseason-kicker">STAGE ${s} COMPLETE</div><h3>Stage ${s} 常规阶段结束</h3><p>该阶段战绩已经锁定。2019规则下，前三个 Stage 由两分区头名 + 其余最佳6队进入阶段季后赛；Stage 4 不设阶段季后赛。</p><div class="stage-break-stats"><div><span>阶段战绩</span><strong>${rec.wins}-${rec.losses}</strong></div><div><span>阶段排名</span><strong>第 ${rank}</strong></div><div><span>资格</span><strong>${qualified?'晋级':'未晋级'}</strong></div></div><button class="primary-btn" id="resolveStageBreakBtn">${qualified?`模拟 Stage ${s} 季后赛 →`:`进入 Stage ${s+1} →`}</button></div>`;
        const btn=document.getElementById('resolveStageBreakBtn'); if(btn)btn.addEventListener('click',()=>qualified?simulateStagePlayoff(s):skipStageBreak(s));
        document.getElementById('playNextSeasonMatchBtn').disabled=true;document.getElementById('fastSimSeasonBtn').disabled=true;
      }
      if(seasonState.played>=28){
        const rank=estimateSeasonRank(),area=document.getElementById('seasonCompleteArea');
        const awardLabel=seasonState.awardsViewed?'🏅 返回常规赛奖项':'🏅 揭晓常规赛奖项';
        let q=rank<=6?'直接晋级赛季季后赛':rank<=12?'进入入围赛 争夺最后2席':'无缘季后赛与入围赛';
        area.innerHTML=`<div class="season-complete-banner"><strong>常规赛完成：${seasonState.wins} 胜 ${seasonState.losses} 负，排名第 ${rank}。</strong><br>${q}。<div style="margin-top:13px;display:flex;gap:10px;flex-wrap:wrap"><button class="secondary-btn" id="viewRegularAwardsBtn">${awardLabel}</button>${rank<=6?'<button class="primary-btn" id="enterPlayoffsBtn">🏆 进入季后赛</button>':rank<=12?'<button class="primary-btn" id="enterPlayInBtn">🎟️ 进入入围赛</button>':''}<button class="secondary-btn" data-open-season-summary="1">📊 查看赛季结算</button></div></div>`;
        document.getElementById('viewRegularAwardsBtn')?.addEventListener('click',openRegularSeasonAwards);
        document.getElementById('enterPlayoffsBtn')?.addEventListener('click',()=>{careerState.postseasonSeed=rank;enterPlayoffs();});
        document.getElementById('enterPlayInBtn')?.addEventListener('click',openPlayInTournament);
      }
    };
    const _v30Single=simulateSingleRegularMatch;
    simulateSingleRegularMatch=function(){ if(seasonState.stageBreakPending)return; _v30Single(); markStageBreakIfNeeded(); renderSeason(); };
    const _v30Manual=recordManualSeasonMatch;
    recordManualSeasonMatch=function(){ _v30Manual(); markStageBreakIfNeeded(); renderSeason(); };
    const _v30Fast=fastSeasonStep;
    fastSeasonStep=function(){ if(seasonState.stageBreakPending){seasonState.simulating=false;renderSeason();return;} _v30Fast(); markStageBreakIfNeeded(); if(seasonState.stageBreakPending){if(seasonState.timer)clearTimeout(seasonState.timer);seasonState.timer=null;seasonState.simulating=false;renderSeason();} };
    const _v30OpenNext=openNextSeasonMatch;
    openNextSeasonMatch=function(){ if(seasonState.stageBreakPending){renderSeason();return;} _v30OpenNext(); };
    const _v30ToggleFast=toggleFastSeasonSimulation;
    toggleFastSeasonSimulation=function(){ if(seasonState.stageBreakPending){renderSeason();return;} _v30ToggleFast(); };

    // 2019 postseason gate: top 6 direct, ranks 7–12 enter 入围赛 for two final slots.
    function openPlayInTournament(){
      const rank=estimateSeasonRank(); if(rank<7||rank>12){if(rank<=6){careerState.postseasonSeed=rank;enterPlayoffs();}else showSeasonSummary();return;}
      const overlay=document.getElementById('seasonEventOverlay'),holder=document.getElementById('seasonEventContent');
      const bye=rank<=8;
      holder.innerHTML=`<div class="season-event-top"><span class="season-event-kicker">2019 季后赛 · 入围赛</span><span class="season-event-round">第 ${rank} 种子</span></div><h2 class="season-event-title">最后两张季后赛门票</h2><p class="season-event-copy">常规赛第7–12名进入入围赛。${bye?'你作为7/8号种子首轮轮空，只需要赢下一场FT4。':'你需要先赢下9–12号种子首轮，再挑战7/8号种子。'} 高顺位拥有首图选图权。</p><div class="season-event-choices"><button class="season-event-choice" id="simulatePlayInBtn"><div><strong>⚡ 模拟入围赛</strong><p>${bye?'一场定生死。':'最多连续两场FT4，输一场赛季结束。'}</p></div></button></div>`;
      document.getElementById('simulatePlayInBtn').addEventListener('click',simulatePlayerPlayIn); overlay.classList.remove('hidden');
    }
    function simulatePlayerPlayIn(){
      const rank=estimateSeasonRank(),holder=document.getElementById('seasonEventContent'); let alive=true,rounds=[];
      const opponents=TEAMS.filter(t=>t.name!==careerState.team.name).sort((a,b)=>(b.strength||80)-(a.strength||80));
      function play(label,opp){const chance=clamp(.53+(teamDisplayPower(careerState.starters)-(opp.strength||80))*.023+(12-rank)*.006,.24,.82);const won=Math.random()<chance;rounds.push({label,opp:opp.name,won});return won;}
      if(rank>=9){const firstOpp=opponents[Math.min(opponents.length-1,rank+3)]||pick(opponents);alive=play('入围赛 首轮',firstOpp);}
      if(alive){const gateOpp=opponents[rank===7?7:rank===8?6:5]||pick(opponents);alive=play('入围赛 晋级战',gateOpp);}
      if(alive)careerState.postseasonSeed=rank<=8?rank:8;
      holder.innerHTML=`<div class="season-event-result"><div class="result-mark">${alive?'✓':'×'}</div><h3>${alive?'成功晋级八强季后赛':'入围赛 止步'}</h3><p>${rounds.map(r=>`${r.label} vs ${r.opp}：${r.won?'胜':'负'}`).join(' · ')}</p><button class="primary-btn" id="finishPlayInBtn">${alive?'进入双败季后赛 →':'查看赛季结算 →'}</button></div>`;
      document.getElementById('finishPlayInBtn').addEventListener('click',()=>{document.getElementById('seasonEventOverlay').classList.add('hidden');alive?enterPlayoffs():showSeasonSummary();});
    }
    continueAfterRegularAwards=function(){const rank=estimateSeasonRank();if(rank<=6){careerState.postseasonSeed=rank;enterPlayoffs();}else if(rank<=12)openPlayInTournament();else showSeasonSummary();};
    const _v30AwardsRender=renderRegularSeasonAwards;
    renderRegularSeasonAwards=function(){_v30AwardsRender();const rank=estimateSeasonRank();els.awardsContinueBtn.textContent=rank<=6?'🏆 进入季后赛':rank<=12?'🎟️ 进入入围赛':'📊 进入赛季结算';};

    const _v30SetupPlayoffs=setupPlayoffs;
    setupPlayoffs=function(){
      resetPlayoffState();playoffState.active=true;playoffState.seed=clamp(careerState.postseasonSeed||estimateSeasonRank(),1,8);
      const sorted=TEAMS.filter(t=>t.name!==careerState.team.name).sort((a,b)=>(b.strength+randomCentered(2))-(a.strength+randomCentered(2))).slice(0,7);
      const seeds=Array(8).fill(null);seeds[playoffState.seed-1]=careerState.team;let oi=0;for(let i=0;i<8;i++)if(!seeds[i])seeds[i]=sorted[oi++];
      playoffState.teams=seeds;playoffState.matches=PLAYOFF_MATCH_BLUEPRINT.map(item=>({...item,result:null}));syncDoubleElimBracket(null);renderPlayoffs();
    };
    const _v30RenderPlayoffs=renderPlayoffs;
    renderPlayoffs=function(){_v30RenderPlayoffs();const logo=document.getElementById('playoffTeamLogo');if(logo&&careerState.team){logo.innerHTML=teamLogoMarkup(careerState.team);logo.style.background='transparent';}};


    // 2019 standings model: division leaders + next four qualify directly;
    // the next six enter 入围赛. AI teams use the real 2019 win totals as their season-one baseline.
    const OWL2019_BASE_WINS={
      'Vancouver Titans':25,'San Francisco Shock':23,'New York Excelsior':22,'Hangzhou Spark':18,
      'Los Angeles Gladiators':17,'Atlanta Reign':16,'London Spitfire':16,'Seoul Dynasty':15,
      'Guangzhou Charge':15,'Philadelphia Fusion':15,'Shanghai Dragons':13,'Chengdu Hunters':13,
      'Los Angeles Valiant':12,'Paris Eternal':11,'Dallas Fuel':10,'Houston Outlaws':9,
      'Toronto Defiant':8,'Washington Justice':8,'Boston Uprising':8,'Florida Mayhem':6
    };
    const OWL2019_BASE_MD={
      'Vancouver Titans':61,'San Francisco Shock':66,'New York Excelsior':40,'Hangzhou Spark':12,
      'Los Angeles Gladiators':19,'Atlanta Reign':19,'London Spitfire':6,'Seoul Dynasty':14,
      'Guangzhou Charge':4,'Philadelphia Fusion':-3,'Shanghai Dragons':-10,'Chengdu Hunters':-11,
      'Los Angeles Valiant':-5,'Paris Eternal':-21,'Dallas Fuel':-27,'Houston Outlaws':-22,
      'Toronto Defiant':-33,'Washington Justice':-33,'Boston Uprising':-37,'Florida Mayhem':-39
    };
    function stableSeasonNoise(teamName,year,range=3){
      const key=`${teamName}-${year}`;let h=2166136261;for(let i=0;i<key.length;i++){h^=key.charCodeAt(i);h=Math.imul(h,16777619);}return (Math.abs(h)%(range*2+1))-range;
    }
    function syntheticFinalStandings(){
      if(seasonState.finalStandingsCache) return seasonState.finalStandingsCache;
      const year=careerState.seasonYear||2019;
      const rows=TEAMS.map(team=>{
        if(team.name===careerState.team?.name){
          const md=Math.round((seasonState.wins-seasonState.losses)*2.4+(seasonState.userRatings.reduce((a,b)=>a+b,0)/(seasonState.userRatings.length||1)-7)*5);
          return {team,wins:seasonState.wins,losses:28-seasonState.wins,mapDiff:md,isUser:true};
        }
        const base=OWL2019_BASE_WINS[team.name]??Math.round(14+(team.strength-80)*.65);
        const drift=year===2019?stableSeasonNoise(team.name,year,1):stableSeasonNoise(team.name,year,4);
        const wins=clamp(base+drift,3,26),md=(OWL2019_BASE_MD[team.name]??(wins-14)*3)+stableSeasonNoise(team.name,year+99,6);
        return {team,wins,losses:28-wins,mapDiff:md,isUser:false};
      }).sort((a,b)=>b.wins-a.wins||b.mapDiff-a.mapDiff||b.team.strength-a.team.strength);
      rows.forEach((r,i)=>r.rank=i+1);
      const atl=rows.filter(r=>r.team.division==='Atlantic')[0],pac=rows.filter(r=>r.team.division==='Pacific')[0];
      const direct=[atl,pac].sort((a,b)=>a.rank-b.rank);
      for(const row of rows){if(direct.includes(row))continue;if(direct.length<6)direct.push(row);else break;}
      const directSet=new Set(direct.map(r=>r.team.name));
      const playIn=rows.filter(r=>!directSet.has(r.team.name)).slice(0,6);
      rows.forEach(r=>{r.divisionLeader=direct.slice(0,2).includes(r);r.direct=directSet.has(r.team.name);r.directSeed=r.direct?direct.findIndex(x=>x.team.name===r.team.name)+1:null;r.playIn=playIn.some(x=>x.team.name===r.team.name);});
      seasonState.finalStandingsCache=rows;return rows;
    }
    function postseasonStatus(){
      const rows=syntheticFinalStandings(),mine=rows.find(r=>r.isUser)||rows[0];
      return {rank:mine.rank,direct:mine.direct,playIn:mine.playIn,divisionLeader:mine.divisionLeader,seed:mine.directSeed,rows};
    }
    const _v31EstimateSeasonRank=estimateSeasonRank;
    estimateSeasonRank=function(){
      if(seasonState.played>=28 && careerState.team) return postseasonStatus().rank;
      return _v31EstimateSeasonRank();
    };

    // Stage qualification follows 2019: the two division leaders are seeds 1/2,
    // then the six best remaining teams. Cache the table so the rank cannot change just by re-rendering.
    function buildStageTable(stageNo){
      seasonState.stageTables=seasonState.stageTables||{};
      if(seasonState.stageTables[stageNo]) return seasonState.stageTables[stageNo];
      const rec=stageRecord(stageNo),year=careerState.seasonYear||2019;
      const rows=TEAMS.map(team=>{
        if(team.name===careerState.team?.name)return {team,wins:rec.wins,losses:7-rec.wins,mapDiff:(rec.wins-(7-rec.wins))*2+stableSeasonNoise(team.name,stageNo,2),isUser:true};
        const expected=3.5+(team.strength-80)*.12+stableSeasonNoise(team.name,year*10+stageNo,2)*.55;
        const wins=clamp(Math.round(expected),0,7);
        return {team,wins,losses:7-wins,mapDiff:Math.round((wins-(7-wins))*2+stableSeasonNoise(team.name,stageNo+30,3)),isUser:false};
      }).sort((a,b)=>b.wins-a.wins||b.mapDiff-a.mapDiff||b.team.strength-a.team.strength);
      rows.forEach((r,i)=>r.rank=i+1);
      const atl=rows.filter(r=>r.team.division==='Atlantic')[0],pac=rows.filter(r=>r.team.division==='Pacific')[0];
      const qualifiers=[atl,pac];
      for(const row of rows){if(qualifiers.includes(row))continue;if(qualifiers.length<8)qualifiers.push(row);else break;}
      const qset=new Set(qualifiers.map(r=>r.team.name));rows.forEach(r=>r.qualified=qset.has(r.team.name));
      seasonState.stageTables[stageNo]=rows;return rows;
    }
    stageEstimatedRank=function(stageNo){const mine=buildStageTable(stageNo).find(r=>r.isUser);return mine?.rank||20;};
    function stageQualified(stageNo){return !!buildStageTable(stageNo).find(r=>r.isUser)?.qualified;}

    // Patch the Stage-break decision to use division-leader qualification, not raw top-eight only.
    const _v31RenderSeason=renderSeason;
    renderSeason=function(){
      _v31RenderSeason();
      if(seasonState.stageBreakPending){
        const s=seasonState.stageBreakPending,qualified=stageQualified(s),btn=document.getElementById('resolveStageBreakBtn');
        const card=btn?.closest('.stage-break-card');
        if(card){
          const strongs=card.querySelectorAll('.stage-break-stats strong');
          if(strongs[2]) strongs[2].textContent=qualified?'晋级':'未晋级';
          const p=card.querySelector('p');if(p)p.textContent='2019规则：Atlantic / Pacific 两个分区头名锁定前两号种子，其余6席按该Stage战绩产生。Stage 4不设阶段季后赛。';
        }
        if(btn){
          btn.textContent=qualified?`模拟 Stage ${s} 季后赛 →`:`进入 Stage ${s+1} →`;
          btn.onclick=null; const fresh=btn.cloneNode(true);btn.replaceWith(fresh);fresh.addEventListener('click',()=>qualified?simulateStagePlayoff(s):skipStageBreak(s));
        }
      }
      if(seasonState.played>=28){
        const status=postseasonStatus(),area=document.getElementById('seasonCompleteArea');
        if(area){
          const awardLabel=seasonState.awardsViewed?'🏅 返回常规赛奖项':'🏅 揭晓常规赛奖项';
          const q=status.direct?(status.divisionLeader?'分区头名，直接晋级季后赛':'直接晋级赛季季后赛'):status.playIn?'进入入围赛 争夺最后2席':'无缘季后赛与入围赛';
          area.innerHTML=`<div class="season-complete-banner"><strong>常规赛完成：${seasonState.wins} 胜 ${seasonState.losses} 负，排名第 ${status.rank}。</strong><br>${q}。<div style="margin-top:13px;display:flex;gap:10px;flex-wrap:wrap"><button class="secondary-btn" id="viewRegularAwardsBtn">${awardLabel}</button>${status.direct?'<button class="primary-btn" id="enterPlayoffsBtn">🏆 进入季后赛</button>':status.playIn?'<button class="primary-btn" id="enterPlayInBtn">🎟️ 进入入围赛</button>':''}<button class="secondary-btn" data-open-season-summary="1">📊 查看赛季结算</button></div></div>`;
          document.getElementById('viewRegularAwardsBtn')?.addEventListener('click',openRegularSeasonAwards);
          document.getElementById('enterPlayoffsBtn')?.addEventListener('click',()=>{careerState.postseasonSeed=status.seed||clamp(status.rank,1,6);enterPlayoffs();});
          document.getElementById('enterPlayInBtn')?.addEventListener('click',openPlayInTournament);
          area.querySelectorAll('[data-open-season-summary]').forEach(b=>b.addEventListener('click',showSeasonSummary));
        }
      }
    };

    // Final gate uses the authentic direct/入围赛 groups above.
    openPlayInTournament=function(){
      const status=postseasonStatus(),rank=status.rank;if(!status.playIn){if(status.direct){careerState.postseasonSeed=status.seed||clamp(rank,1,6);enterPlayoffs();}else showSeasonSummary();return;}
      const overlay=document.getElementById('seasonEventOverlay'),holder=document.getElementById('seasonEventContent');
      const playInRows=status.rows.filter(r=>r.playIn),localSeed=playInRows.findIndex(r=>r.isUser)+1,bye=localSeed<=2;
      holder.innerHTML=`<div class="season-event-top"><span class="season-event-kicker">2019 季后赛 · 入围赛</span><span class="season-event-round">入围赛 · ${localSeed}号种子</span></div><h2 class="season-event-title">最后两张季后赛门票</h2><p class="season-event-copy">6支入围赛队伍中，前2号种子首轮轮空；后4队先打一轮，胜者再挑战前2号种子。${bye?'你首轮轮空，只需赢下晋级战。':'你需要连赢两场。'} 每场FT4，高顺位首图选图。</p><div class="season-event-choices"><button class="season-event-choice" id="simulatePlayInBtn"><div><strong>⚡ 模拟入围赛</strong><p>${bye?'一场定生死。':'两轮都没有复活甲。'}</p></div></button></div>`;
      overlay.classList.remove('hidden');document.getElementById('simulatePlayInBtn').addEventListener('click',()=>resolveV31PlayIn(status,localSeed));
    };
    function resolveV31PlayIn(status,localSeed){
      const holder=document.getElementById('seasonEventContent'),rows=status.rows.filter(r=>r.playIn),mine=rows.find(r=>r.isUser),opps=rows.filter(r=>!r.isUser);let alive=true,rounds=[];
      function play(label,opp){const our=teamDisplayPower(careerState.starters),chance=clamp(.52+(our-(opp.team.strength||80))*.024+(careerState.condition-72)*.0025+(opp.rank-mine.rank)*.006,.24,.84),won=Math.random()<chance;rounds.push({label,opp:opp.team.name,won});return won;}
      if(localSeed>2){const lower=opps.slice(2);alive=play('入围赛 首轮',lower[Math.min(lower.length-1,Math.max(0,localSeed-3))]||pick(opps));}
      if(alive){const top=opps.slice(0,2);alive=play('入围赛 晋级战',top[localSeed%2]||top[0]||pick(opps));}
      if(alive)careerState.postseasonSeed=7+Math.min(1,localSeed-1);
      holder.innerHTML=`<div class="season-event-result"><div class="result-mark">${alive?'✓':'×'}</div><h3>${alive?'成功晋级八强季后赛':'入围赛 止步'}</h3><p>${rounds.map(r=>`${r.label} vs ${r.opp}：${r.won?'胜':'负'}`).join(' · ')}</p><button class="primary-btn" id="finishPlayInBtn">${alive?'进入双败季后赛 →':'查看赛季结算 →'}</button></div>`;
      document.getElementById('finishPlayInBtn').addEventListener('click',()=>{document.getElementById('seasonEventOverlay').classList.add('hidden');alive?enterPlayoffs():showSeasonSummary();});
    }
    continueAfterRegularAwards=function(){const s=postseasonStatus();if(s.direct){careerState.postseasonSeed=s.seed||clamp(s.rank,1,6);enterPlayoffs();}else if(s.playIn)openPlayInTournament();else showSeasonSummary();};

    // Make role-star / awards continuation label match actual qualification.
    const _v31RenderAwards=renderRegularSeasonAwards;
    renderRegularSeasonAwards=function(){_v31RenderAwards();if(seasonState.played>=28){const s=postseasonStatus();els.awardsContinueBtn.textContent=s.direct?'🏆 进入季后赛':s.playIn?'🎟️ 进入入围赛':'📊 进入赛季结算';}};

    // Stats: K/D/A in one tile; role-specific signature stat.
    function roleSignatureStat(role,scale,maps){
      if(role==='坦克') return {label:'阻挡伤害',value:`${Math.round((9200*scale*maps)/1000)}k`};
      if(role==='长枪输出'||role==='弹道输出') return {label:'最后一击',value:String(Math.round((role==='长枪输出'?5.4:4.7)*scale*maps))};
      return {label:'治疗量',value:`${Math.round(((role==='输出支援'?9200:10800)*scale*maps)/1000)}k`};
    }
    synthesizeStageStats=function(kind='regular'){
      const role=state.role||'长枪输出',ovr=Number(getMyOvr()==='--'?78:getMyOvr());
      const playoffApps=playoffState.results.filter(x=>!x.rested&&!x.dnp&&(x.mapsPlayed==null||Number(x.mapsPlayed)>0));
      const games=kind==='regular'?seasonState.userRatings.length:playoffApps.length;if(!games)return null;
      const avgRating=kind==='regular'?(seasonState.userRatings.reduce((a,b)=>a+b,0)/seasonState.userRatings.length):(playoffApps.reduce((a,b)=>a+(Number(b.rating)||0),0)/playoffApps.length);
      const base={'坦克':{k:14.2,a:19.1,d:6.6},'长枪输出':{k:20.6,a:8.4,d:5.9},'弹道输出':{k:18.9,a:10.8,d:6.3},'输出支援':{k:12.6,a:17.2,d:5.5},'战术支援':{k:9.4,a:22.6,d:5.1}}[role];
      const scale=clamp(1+(avgRating-7.0)*.095+(ovr-80)*.008+(kind==='playoff'?.05:0),.75,1.42),deathScale=clamp(1-(avgRating-7.0)*.05-(ovr-80)*.003,.7,1.2);
      const k=(base.k*scale).toFixed(1),a=(base.a*scale).toFixed(1),d=clamp(base.d*deathScale,3.3,8.8).toFixed(1),maps=Math.max(3,Math.round(games*3.7));
      const signature=roleSignatureStat(role,scale,maps),mvpGames=Math.max(0,Math.round(games*clamp((avgRating-6.4)*.22,.08,.7)));
      return {games,avgRating,boxes:[{label:'平均评分',value:avgRating.toFixed(1)},{label:'K / D / A',value:`${k} / ${d} / ${a}`},signature,{label:'系列赛 MVP',value:String(mvpGames)}],line:`位置核心数据会随职责变化 · ${role==='坦克'?'坦克关注阻挡与空间':role.includes('输出')&&!role.includes('支援')?'输出关注最后一击':'支援关注治疗与存活'}`};
    };

    const _v30BuildCareerStats=buildSeasonCareerStats;
    buildSeasonCareerStats=function(record,playoffSeries=0){
      const s=_v30BuildCareerStats(record,playoffSeries),maps=s.maps,scale=clamp(1+(record.rating-7)*.09+(record.ovr-80)*.006,.75,1.45);
      s.finalBlows=Math.round((record.role==='长枪输出'?5.4:record.role==='弹道输出'?4.7:2.1)*scale*maps);
      s.blockedDamage=record.role==='坦克'?Math.round(9200*scale*maps):0;
      s.healing=(record.role==='输出支援'||record.role==='战术支援')?Math.round((record.role==='输出支援'?9200:10800)*scale*maps):0;
      return s;
    };
    function roleCareerKeyTotal(t){
      if(state.role==='坦克')return ['总阻挡伤害',`${Math.round((t.blockedDamage||0)/1000)}k`];
      if(state.role==='长枪输出'||state.role==='弹道输出')return ['总最后一击',t.finalBlows||0];
      return ['总治疗量',`${Math.round((t.healing||0)/1000)}k`];
    }
    const _v30GetCareerTotals=getCareerTotals;
    getCareerTotals=function(){const t=_v30GetCareerTotals();t.finalBlows=0;t.blockedDamage=0;t.healing=0;careerState.careerArchive.forEach(r=>{t.finalBlows+=r.stats?.finalBlows||0;t.blockedDamage+=r.stats?.blockedDamage||0;t.healing+=r.stats?.healing||0;});return t;};
    renderCareerOverview=function(){
      const t=getCareerTotals(),archive=careerState.careerArchive,avg=t.ratingWeight?t.ratingSum/t.ratingWeight:0,key=roleCareerKeyTotal(t);
      els.careerTabContent.innerHTML=`<section class="career-block"><h3>📊 生涯累计</h3><div class="career-total-grid">${[['总出场',t.appearances],['总地图',t.maps],['K / D / A',`${t.eliminations} / ${t.deaths} / ${t.assists}`],key,['系列赛战绩',`${t.wins}-${t.losses}`],['最高OVR',careerState.peakOvr||getMyOvr()]].map(([l,v])=>`<div class="career-total-item"><strong>${v}</strong><span>${l}</span></div>`).join('')}</div></section><section class="career-block"><h3>📈 生涯评分</h3><div class="career-total-grid">${[['平均评分',avg?avg.toFixed(1):'未出场'],['当前职责',state.role],['完整赛季',archive.length],['当前年龄',`${careerState.age}岁`]].map(([l,v])=>`<div class="career-total-item"><strong>${v}</strong><span>${l}</span></div>`).join('')}</div></section><section class="career-block"><h3>📋 每赛季</h3><div class="career-season-list">${[...archive].reverse().map(r=>`<div class="career-season-row"><div class="year">${r.year}赛季</div><div><strong>${r.team}</strong><div class="meta">${r.age}岁 · ${r.role} · OVR ${r.ovr} · ${r.result}</div></div><div class="rating">${r.rating?`${r.rating.toFixed(1)}分`:'未出场'}</div></div>`).join('')||'<div class="summary-note-empty">还没有完整赛季记录。</div>'}</div></section>`;
    };

    // More generous personal ratings; elite winning seasons can actually produce MVP-level numbers.
    function quickCareerRating(won,careerBonus=0){
      const ovr=Number(getMyOvr()==='--'?78:getMyOvr());
      return clamp(6.80+(ovr-78)*.075+(won?.58:-.10)+careerBonus*.070+careerState.nextRatingBonus+randomCentered(.58),4.9,9.9);
    }
    // Replace the two quick-sim rating formulas in their source functions through wrappers by correcting the latest pushed value.
    const _v30QuickSingle=simulateSingleRegularMatch;
    simulateSingleRegularMatch=function(){
      if(seasonState.stageBreakPending)return;
      const before=seasonState.userRatings.length,beforePlayed=seasonState.played;_v30QuickSingle();
      if(seasonState.userRatings.length>before){const won=seasonState.results[beforePlayed]==='win';const corrected=quickCareerRating(won,currentCareerMatchBonus());seasonState.userRatings[seasonState.userRatings.length-1]=corrected;}
      markStageBreakIfNeeded();renderSeason();
    };
    // fastSeasonStep wrapper above uses original formula internally; correct the newest entry after every step.
    const _v30FastStageAware=fastSeasonStep;
    fastSeasonStep=function(){
      if(seasonState.stageBreakPending){seasonState.simulating=false;renderSeason();return;}
      const before=seasonState.userRatings.length,beforePlayed=seasonState.played;_v30FastStageAware();
      if(seasonState.userRatings.length>before){const won=seasonState.results[beforePlayed]==='win';seasonState.userRatings[seasonState.userRatings.length-1]=quickCareerRating(won,currentCareerMatchBonus());}
      markStageBreakIfNeeded();if(seasonState.stageBreakPending){if(seasonState.timer)clearTimeout(seasonState.timer);seasonState.timer=null;seasonState.simulating=false;}renderSeason();
    };

    // Awards use the real historical roster pool instead of placeholder names. Role Stars follow OWL's three official roles.
    buildRegularAwardLeaguePool=function(){
      const pool=[];TEAMS.forEach(team=>historicalRosterEntries(team).forEach((e,i)=>{const [name,role,ovr]=e;pool.push({id:`ai-${team.short}-${name}`,isUser:false,name,team:team.name,role,rating:clamp(6.30+(ovr-78)*.088+(team.strength-80)*.020+randomCentered(.30),5.8,8.75),ovr,wins:clamp(Math.round(14+(team.strength-80)*.75+rand(-3,3)),4,26),popularity:clamp(30+(ovr-78)*3+rand(-12,12),10,98),rookie:['Haksal','guxue','Corey','DDing','Erster'].includes(name),roleQuality:ovr});}));pool.push(getSeasonUserAwardProfile());return pool;
    };
    const _v30EnsureAwards=ensureRegularSeasonAwards;
    ensureRegularSeasonAwards=function(){
      if(seasonState.awards?.roleStars && Object.values(seasonState.awards.roleStars)[0]?.winners)return seasonState.awards;
      const pool=buildRegularAwardLeaguePool(),mvp=rankAwardCandidates(pool,p=>p.rating*11+p.ovr*.15+p.wins*.62),rookiePool=pool.filter(p=>p.rookie),rookie=rankAwardCandidates(rookiePool,p=>p.rating*10+p.ovr*.15+p.wins*.5),community=rankAwardCandidates(pool,p=>p.popularity*.72+p.rating*2.7+p.wins*.18),roleStars={};
      rookie.userEligible=careerState.careerYears===1;if(!rookie.userEligible)rookie.userRank=null;
      ROLES.forEach(role=>{const r=rankAwardCandidates(pool.filter(p=>p.role===role.name),p=>p.rating*9.5+p.ovr*.2+p.wins*.34+p.roleQuality*.08);r.winners=r.top5.slice(0,2);roleStars[role.name]=r;});
      seasonState.awards={mvp,rookie,community,roleStars,generatedYear:careerState.seasonYear};return seasonState.awards;
    };
    renderRegularSeasonAwards=function(){
      const awards=ensureRegularSeasonAwards();document.getElementById('awardsSeasonChip').textContent=`🏆 ${careerState.seasonYear} 赛季`;
      const quotas=window.__OWL_ROLE_STAR_RULES?.quotas?.(careerState.seasonYear)||{tank:4,damage:4,support:4},groups=[['tank','🛡️','坦克'],['damage','🎯','输出'],['support','💉','支援']];
      const roleRows=groups.map(([group,icon,label])=>{const result=awards.roleStars[group],mine=window.__OWL_ROLE_STAR_RULES?.group?.(state.role)===group,winners=result.winners||result.top5.slice(0,quotas[group]);return `<div class="award-role-row ${mine?'mine':''}"><div class="award-role-label">${icon} ${label}</div><div class="award-role-winner">${winners.map(w=>`<strong>${w.name}</strong><span>${w.team}</span>`).join('<br>')}</div><div class="award-role-rank">${mine?`你的排名<br><strong>${result.userRank<=quotas[group]?'🏆 入选':result.userRank?`第 ${result.userRank} 名`:'未入榜'}</strong>`:'年度职责之星'}</div></div>`;}).join('');
      els.regularAwardsContent.innerHTML=`${awardSpotlightCard('👑','最有价值选手','只展示得主与你是否进入前五',awards.mvp,true)}<article class="award-card"><div class="award-card-head"><h3>🎯 职责之星</h3><span>坦克${quotas.tank}人 · 输出${quotas.damage}人 · 支援${quotas.support}人</span></div><div class="award-role-list">${roleRows}</div><div class="award-footnote">按 OWL 当年三大职责评选，你只参与当前主职责「${groups.find(([group])=>window.__OWL_ROLE_STAR_RULES?.group?.(state.role)===group)?.[2]||state.role}」的评选。</div></article>${awardSpotlightCard('🌱','最佳新秀','新秀赛季限定',awards.rookie,awards.rookie.userEligible)}${awardSpotlightCard('🤝','社区之星','综合公众关注与赛季影响力',awards.community,true)}`;
      const rank=estimateSeasonRank();els.awardsContinueBtn.textContent=rank<=6?'🏆 进入季后赛':rank<=12?'🎟️ 进入入围赛':'📊 进入赛季结算';
    };
    const _v30DeriveHonors=deriveSeasonHonors;
    deriveSeasonHonors=function(record,index){const h=_v30DeriveHonors(record,index).filter(x=>x!=='职责之星');const awards=ensureRegularSeasonAwards(),group=window.__OWL_ROLE_STAR_RULES?.group?.(state.role),quotas=window.__OWL_ROLE_STAR_RULES?.quotas?.(careerState.seasonYear)||{tank:4,damage:4,support:4};if(group&&((awards.roleStars[group]?.userRank||99)<=quotas[group]))h.push('职责之星');(seasonState.stageTitles||[]).forEach(x=>h.push(x));return [...new Set(h)];};

    const _v31FinalAwardsRenderer=renderRegularSeasonAwards;
    renderRegularSeasonAwards=function(){
      _v31FinalAwardsRenderer();
      if(seasonState.played>=28 && els.awardsContinueBtn){
        const s=postseasonStatus();
        els.awardsContinueBtn.textContent=s.direct?'🏆 进入季后赛':s.playIn?'🎟️ 进入入围赛':'📊 进入赛季结算';
      }
    };

    // Contract interest varies with performance: usually 2–5, but very poor years can fall to one guaranteed offer.
    generateContractOffers=function(){
      const avg=seasonState.userRatings.length?seasonState.userRatings.reduce((a,b)=>a+b,0)/seasonState.userRatings.length:6.8,ovr=Number(getMyOvr()==='--'?78:getMyOvr()),rank=estimateSeasonRank(),post=playoffState.round==='champion'?2:playoffState.results.length?1:0;
      let count=avg>=8.2||post===2?5:avg>=7.65||rank<=6?4:avg>=7.0||rank<=12?3:avg>=6.35?2:1;count=clamp(count+rand(-1,1),1,5);
      const market=ovr*.62+avg*4.2+(21-rank)*.35+post*7+careerState.popularity*.05;
      const selected=[careerState.team,...shuffle(TEAMS.filter(t=>t.name!==careerState.team.name)).slice(0,Math.max(0,count-1))];
      offseasonState.offers=selected.map((team,index)=>{const renewal=index===0,teamPower=Math.round(careerLikeTeamPower(team)),tactic=renewal?careerState.tactic:pick(TACTICS),fit=clamp(Math.round(roleTacticFit(state.role,tactic)+(calculateRoleFit(state.role)-80)*.65+rand(-5,5)),55,98),years=rand(1,3),salary=Math.max(8,Math.round((market-55)*.8+(teamPower-78)*.6+rand(-3,5))),starterScore=market+fit*.2-teamPower*.18+rand(-5,5),rolePromise=starterScore>=77?'核心首发':starterScore>=67?'稳定首发':starterScore>=58?'首发竞争':'轮换选手';return{id:`offer-${index}-${Date.now()}-${Math.random()}`,team,renewal,tactic,fit,years,salary,rolePromise,teamPower,note:renewal?'熟悉的体系与队友，留队成本最低。':fit>=88?'体系高度适配，教练组愿意围绕你的特点安排位置。':teamPower>=87?'强队机会，竞争激烈。':'出场空间更大，但需要承担更多胜负。'};});
    };
    const _v30RenderMarket=renderContractMarket;
    renderContractMarket=function(wrap){
      _v30RenderMarket(wrap);
      const offerLogos=[...wrap.querySelectorAll('.offer-logo')];
      offerLogos.forEach((node,i)=>{const offer=offseasonState.offers[i];if(offer){node.innerHTML=teamLogoMarkup(offer.team);node.style.background='transparent';}});
      if(!offseasonState.contractExpired && careerState.team && offerLogos[0]){offerLogos[0].innerHTML=teamLogoMarkup(careerState.team);offerLogos[0].style.background='transparent';}
      setTimeout(()=>window.scrollTo(0,0),0);
    };

    // After a completed season, the career hub opens on offseason first.
    const _v30OpenCareerHub=openCareerHub;
    openCareerHub=function(tab='offseason',allowRetired=false){_v30OpenCareerHub(tab||'offseason',allowRetired);};

    // Refresh season/player labels and hide old basketball wording.
    document.querySelectorAll('.season-chip').forEach(node=>{if(node.textContent.includes('2026'))node.textContent=node.textContent.replace('2026','2019');});




