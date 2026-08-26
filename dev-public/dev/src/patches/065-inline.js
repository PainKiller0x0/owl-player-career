/* ======================================================================
   Public Beta 1.9 RC22 · Progressive Information UX
   2027 Play-in / 2030 EWC / 2033 short deals / 2035 expansion + Wild Card
   / 2038 home-away era / 2040 global league
   ====================================================================== */
(function(){
  const VER='Public Beta 1.9 RC22';
  const FUTURE_RULES=window.__OWL_FUTURE_RULES_CONFIG;
  if(!FUTURE_RULES)throw new Error('Missing future league rules module');
  const EXPANSION_YEAR=FUTURE_RULES.expansionYear;
  const EXPANSION_TEAMS=FUTURE_RULES.expansionTeams.map(x=>({...x}));
  const RULE_YEARS=new Set(FUTURE_RULES.ruleYears);
  const ALLSTAR_HOSTS=['东京','巴黎','上海','首尔','柏林','洛杉矶','利雅得','伦敦','大阪'];

  const year34=()=>Number(careerState.seasonYear||2019);
  const isFuture34=()=>year34()>=2027;
  const activeTeams34=()=>TEAMS.filter(t=>t.active!==false);
  const conf34=t=>(t?.conference||(t?.division==='Atlantic'?'East':'West'))==='East'?'East':'West';
  const confZh34=t=>conf34(t)==='East'?'东部':'西部';
  const expansionTeam34=t=>!!t?.expansion||EXPANSION_TEAMS.some(x=>x.short===t?.short);
  const clone34=o=>JSON.parse(JSON.stringify(o));

  function ensureExpansionTeams34(targetYear=year34()){
    const y=Number(targetYear);if(y<EXPANSION_YEAR&&!EXPANSION_TEAMS.some(meta=>TEAMS.some(t=>t.short===meta.short)))return [];
    EXPANSION_TEAMS.forEach(meta=>{
      let team=TEAMS.find(t=>t.short===meta.short);
      if(!team){team={...meta};TEAMS.push(team);}
      Object.assign(team,{name:meta.name,short:meta.short,displayShort:meta.short,city:meta.city,englishName:meta.englishName,conference:meta.conference,division:meta.division,color:meta.color,expansion:true,country:meta.country,build:meta.build});
      if(!Number.isFinite(Number(team.strength)))team.strength=meta.strength;
      team.active=y>=EXPANSION_YEAR;
      if(typeof v51OfflineLogoFor==='function')team.logo=v51OfflineLogoFor(team);
    });
    return TEAMS.filter(expansionTeam34);
  }

  const _world34=v50ApplySeasonWorld;
  v50ApplySeasonWorld=function(y){
    const out=_world34.apply(this,arguments);ensureExpansionTeams34(Number(y));
    if(Number(y)>=EXPANSION_YEAR) applyExpansionLeagueStrength34();
    return out;
  };
  const _activeNext34=v50TeamActiveNextYear;
  v50TeamActiveNextYear=function(team,nextYear){if(expansionTeam34(team)&&Number(nextYear)<EXPANSION_YEAR)return false;return _activeNext34.apply(this,arguments);};

  function seasonFormat34(y=year34()){return FUTURE_RULES.seasonFormat(Number(y));}
  function stageBounds34(stage,y=year34()){return FUTURE_RULES.stageBounds(Number(stage),Number(y));}
  function stageNo34(y=year34()){
    const l=seasonFormat34(y).lens,p=Number(seasonState.played||0);return p<l[0]?1:p<l[0]+l[1]?2:3;
  }

  function spreadEntries34(entries){
    const pool=shuffle(entries);
    for(let i=1;i<pool.length;i++){
      if(pool[i].opponent?.name===pool[i-1].opponent?.name){
        const j=pool.findIndex((x,k)=>k>i&&x.opponent?.name!==pool[i-1].opponent?.name&&(!pool[i+1]||x.opponent?.name!==pool[i+1].opponent?.name));
        if(j>i)[pool[i],pool[j]]=[pool[j],pool[i]];
      }
    }
    return pool;
  }
  function buildSchedule34(y=year34()){
    ensureExpansionTeams34(y);const me=careerState.team,all=activeTeams34().filter(t=>t.name!==me?.name),f=seasonFormat34(y),entries=[];
    if(f.total===46){
      all.forEach(o=>{entries.push({opponent:o,venue:'home',tag:'主客场·主场'});entries.push({opponent:o,venue:'away',tag:'主客场·客场'});});
    }else{
      const same=all.filter(t=>conf34(t)===conf34(me)),cross=all.filter(t=>conf34(t)!==conf34(me));
      same.forEach(o=>{entries.push({opponent:o,venue:'home',tag:'同部·主场1'});entries.push({opponent:o,venue:'away',tag:'同部·客场1'});entries.push({opponent:o,venue:'home',tag:'同部·主场2'});entries.push({opponent:o,venue:'away',tag:'同部·客场2'});});
      cross.forEach(o=>{entries.push({opponent:o,venue:'home',tag:'跨部·主场'});entries.push({opponent:o,venue:'away',tag:'跨部·客场'});});
    }
    const pool=spreadEntries34(entries),bounds=[f.lens[0],f.lens[0]+f.lens[1]];
    seasonState.opponents=pool.map(x=>x.opponent);seasonState.venues=pool.map(x=>x.venue);
    seasonState.legs=pool.map((x,i)=>`Stage ${i<bounds[0]?1:i<bounds[1]?2:3} · ${x.tag}`);
  }

  const _setup34=setupSeason;
  setupSeason=function(isRestart=false){
    const out=_setup34.apply(this,arguments),y=year34();if(y<2035)return out;
    ensureExpansionTeams34(y);const f=seasonFormat34(y);
    seasonState.total=f.total;seasonState.played=0;seasonState.wins=0;seasonState.losses=0;seasonState.results=Array(f.total).fill(null);seasonState.userRatings=[];
    seasonState.stageBreakPending=null;seasonState.stageProcessed=[];seasonState.stagePlayoffHistory=[];seasonState.stageTitles=[];seasonState.stageTables={};seasonState.finalStandingsCache=null;
    seasonState.majorBonusLP=0;seasonState.v34StageTables={};seasonState.v34Postseason=null;seasonState.v34PostseasonTeams=null;seasonState.v71LastMajorSummary=null;
    buildSchedule34(y);if(typeof generateSeasonEventSchedule==='function')seasonState.eventSchedule=generateSeasonEventSchedule();
    renderSeason();setTimeout(()=>{if(y===2035&&!expansionState34().resolved)openExpansionSeasonGate34();else maybeRuleIntro34(y);},160);return out;
  };

  const _stageNo34=currentStageNumber;currentStageNumber=function(){return year34()>=2035?stageNo34():_stageNo34.apply(this,arguments);};
  const _slice34=stageSlice;stageSlice=function(s){if(year34()<2035)return _slice34.apply(this,arguments);const[a,b]=stageBounds34(Number(s));return seasonState.results.slice(a,b);};
  const _recordStage34=stageRecord;stageRecord=function(s){if(year34()<2035)return _recordStage34.apply(this,arguments);const a=stageSlice(s);return{wins:a.filter(x=>x==='win').length,losses:a.filter(x=>x==='loss').length};};
  const _mark34=markStageBreakIfNeeded;markStageBreakIfNeeded=function(){
    if(year34()<2035)return _mark34.apply(this,arguments);const f=seasonFormat34(),p=seasonState.played,b1=f.lens[0],b2=b1+f.lens[1],b=p===b1?1:p===b2?2:p===f.total?3:null;
    if(b&&!seasonState.stageProcessed.includes(b)){seasonState.stageBreakPending=b;seasonState.simulating=false;if(seasonState.timer)clearTimeout(seasonState.timer);seasonState.timer=null;}
  };

  function slots34(){
    if(year34()>=2040)return {GLOBAL:8};
    return {East:4,West:4};
  }
  function stageTable34(stage){
    const y=year34(),key=`${y}-${stage}-${seasonState.played}-${seasonState.majorSlotOwner||'base'}`;seasonState.v34StageTables=seasonState.v34StageTables||{};if(seasonState.v34StageTables[key])return seasonState.v34StageTables[key];
    const [a,b]=stageBounds34(stage,y),len=b-a,rec=stageRecord(stage),rows=activeTeams34().map(team=>{
      const isUser=team.name===careerState.team?.name;let wins,mapDiff;
      if(isUser){wins=rec.wins;mapDiff=Math.round((rec.wins-rec.losses)*2.1+(getSeasonAverageRating()-7)*4);}
      else{let str=Number(team.strength||80);if(expansionTeam34(team)&&y===2035)str-=3.5;const rate=clamp(.50+(str-80)*.018+stableSeasonNoise(team.name,y*10+stage,3)*.012,.14,.86);wins=clamp(Math.round(len*rate),0,len);mapDiff=Math.round((wins-(len-wins))*2+stableSeasonNoise(team.name,stage+340,5));}
      return{team,isUser,wins,losses:len-wins,mapDiff,conference:conf34(team)};
    });
    const sorted=[...rows].sort((x,z)=>z.wins-x.wins||z.mapDiff-x.mapDiff||Number(z.team.strength||80)-Number(x.team.strength||80));sorted.forEach((r,i)=>r.globalRank=i+1);
    if(y>=2040){sorted.forEach((r,i)=>{r.rank=i+1;r.qualified=i<8;});}
    else{const sl=slots34();['East','West'].forEach(c=>{const group=rows.filter(r=>r.conference===c).sort((x,z)=>z.wins-x.wins||z.mapDiff-x.mapDiff||Number(z.team.strength||80)-Number(x.team.strength||80));group.forEach((r,i)=>{r.conferenceRank=i+1;r.rank=i+1;r.qualified=i<Number(sl[c]||4);});});}
    seasonState.v34StageTables[key]=sorted;return sorted;
  }
  const _rankStage34=stageEstimatedRank;stageEstimatedRank=function(s){if(year34()<2035)return _rankStage34.apply(this,arguments);const m=stageTable34(Number(s)).find(r=>r.isUser);return year34()>=2040?(m?.globalRank||24):(m?.conferenceRank||12);};
  const _qualStage34=stageQualified;stageQualified=function(s){if(year34()<2035)return _qualStage34.apply(this,arguments);return !!stageTable34(Number(s)).find(r=>r.isUser)?.qualified;};

  function cupProbability34(a,b){
    const power=t=>t?.name===careerState.team?.name?teamDisplayPower(careerState.starters||[]):Number(t?.strength||80);
    return clamp(.5+(power(a?.team||a)-power(b?.team||b))*.027,.20,.80);
  }
  function userPlacement34(result){
    const me=careerState.team?.name;if(result.champion?.name===me)return{label:'冠军',bonus:4};if(result.runnerUp?.name===me)return{label:'亚军',bonus:3};
    const mine=(result.series||[]).filter(s=>s.teamA?.name===me||s.teamB?.name===me);if(!mine.length)return{label:'未参赛',bonus:0};const last=mine.at(-1),idx=(result.series||[]).indexOf(last);return idx>=(result.series||[]).length-3?{label:'季军',bonus:2}:{label:'八强/六强',bonus:1};
  }
  function runCup34(stage){
    const y=year34(),ewc=y>=2030&&stage===3,isGlobal=y>=2040,rows=stageTable34(stage);
    let entries=rows.filter(r=>r.qualified).sort((a,b)=>(a.globalRank||a.rank||99)-(b.globalRank||b.rank||99)).slice(0,8).map((r,i)=>({team:r.team,seed:i+1,isUser:r.isUser,region:isGlobal?'GLOBAL':r.conference}));
    if(entries.length<8){const have=new Set(entries.map(x=>x.team.name));rows.forEach(r=>{if(entries.length<8&&!have.has(r.team.name)){entries.push({team:r.team,seed:entries.length+1,isUser:r.isUser,region:isGlobal?'GLOBAL':r.conference});have.add(r.team.name);}});}
    const title=ewc?'EWC · Overwatch':`Major ${stage}`,config={id:`OWL_${y}_${ewc?'EWC':`MAJOR_${stage}`}`,name:`${y} ${title}`,format:'doubleElimination',participantCount:8,series:{defaultTargetWins:3,finalTargetWins:4}};
    const result=TournamentEngine._internals.runDoubleElimination(config,entries,{probabilityFn:cupProbability34}),participated=entries.some(x=>x.team.name===careerState.team?.name),placement=participated?userPlacement34(result):{label:'未晋级',bonus:0};
    seasonState.majorBonusLP=(seasonState.majorBonusLP||0)+placement.bonus;const champion=result.champion?.name||'待定',championConference=isGlobal?'GLOBAL':conf34(result.champion);
    if(stage===2){seasonState.v71TradeClosed=true;seasonState.v71AllStarPending=true;}if(!ewc&&!isGlobal)seasonState.majorSlotOwner=championConference;
    const rounds=participated?(result.series||[]).filter(s=>s.teamA?.name===careerState.team?.name||s.teamB?.name===careerState.team?.name).map(s=>{const meA=s.teamA?.name===careerState.team?.name,opp=meA?s.teamB:s.teamA,us=meA?s.scoreA:s.scoreB,them=meA?s.scoreB:s.scoreA;return{round:s.roundLabel||s.roundKey||'淘汰赛',opponent:opp?.name||'待定',won:Number(us)>Number(them),score:`${us}:${them}`,target:s.targetWins||3};}):[];const fs=(result.series||[]).find(s=>s.roundKey==='grandFinal')||(result.series||[]).at(-1);const finalScore=fs?(fs.teamA?.name===champion?`${fs.scoreA}:${fs.scoreB}`:`${fs.scoreB}:${fs.scoreA}`):'';
    const h={stage,rank:stageEstimatedRank(stage),result:`${title} ${placement.label}`,rounds,bracketSeries:window.__OWL_SERIES_PROJECTION.archive(result),champion,runnerUp:result.runnerUp?.name||'待定',finalScore,championConference,bonusLP:placement.bonus,competitionId:config.id,v34Type:ewc?'ewc':'major',venue:ewc?'沙特阿拉伯 · 中立场馆':'中立场馆',prizeTier:ewc?'全年最高奖金':'Major奖金'};
    seasonState.stagePlayoffHistory=(seasonState.stagePlayoffHistory||[]).filter(x=>x.stage!==stage);seasonState.stagePlayoffHistory.push(h);
    if(placement.label==='冠军'){const honor=ewc?'EWC冠军':`Major ${stage}冠军`;seasonState.stageTitles=seasonState.stageTitles||[];if(!seasonState.stageTitles.includes(honor))seasonState.stageTitles.push(honor);careerState.popularity=clamp(careerState.popularity+(ewc?12:9),0,100);}
    if(!seasonState.stageProcessed.includes(stage))seasonState.stageProcessed.push(stage);seasonState.stageBreakPending=null;seasonState.v71LastMajorSummary=h;seasonState.finalStandingsCache=null;renderSeason();window.scrollTo({top:0,behavior:'smooth'});
  }
  const _simCup34=simulateStagePlayoff;simulateStagePlayoff=function(stage){if(year34()>=2030&&Number(stage)===3)return runCup34(3);if(year34()>=2040)return runCup34(Number(stage));if(year34()>=2035)return runCup34(Number(stage));return _simCup34.apply(this,arguments);};
  const _skipCup34=skipStageBreak;skipStageBreak=function(stage){if(year34()>=2030&&Number(stage)===3)return runCup34(3);if(year34()>=2040||year34()>=2035)return runCup34(Number(stage));return _skipCup34.apply(this,arguments);};

  function applyExpansionLeagueStrength34(force=false){
    if(!force&&year34()<2035&&Number(careerState.seasonYear||0)<2035)return;careerState.v34ExpansionLeague=careerState.v34ExpansionLeague||{};if(careerState.v34ExpansionLeague.applied)return;
    ensureExpansionTeams34(2035);
    // RC16起，老队实力变化由真实AI扩军选秀的逐人流动决定，不再额外做抽象扣分，避免双重惩罚。
    EXPANSION_TEAMS.forEach(meta=>{const t=TEAMS.find(x=>x.short===meta.short);if(t)t.strength=meta.strength;});careerState.v34ExpansionLeague={applied:true,year:2035,mode:'real-draft'};
  }

  const _roster34=createRoster;createRoster=function(team,includeUser){
    const roster=_roster34.apply(this,arguments);if(!team||!expansionTeam34(team)||year34()!==2035||includeUser)return roster;const p=Number(seasonState.played||0),f=seasonFormat34(2035),penalty=p<f.lens[0]?4:p<f.lens[0]+f.lens[1]?2:1;
    return roster.map(pl=>{const attrs={};Object.entries(pl.attrs||{}).forEach(([k,v])=>attrs[k]=clamp(Number(v)-penalty,55,99));return{...pl,attrs,overall:Math.max(55,Number(pl.overall||78)-penalty)};});
  };
  const _chance34=getRegularSeasonWinChance;getRegularSeasonWinChance=function(our,their,bonus=0,venue='home'){
    let c=_chance34.apply(this,arguments);const y=year34();if(y>=2038&&venue==='away'){let streak=0;for(let i=seasonState.played-1;i>=0&&seasonState.venues?.[i]==='away';i--)streak++;if(streak>=2)c-=Math.min(.018,(streak-1)*.006);}if(y===2035&&expansionTeam34(careerState.team))c-=Math.max(.005,.028-(Number(seasonState.played||0)/Math.max(1,seasonState.total))*.024);return clamp(c,.20,.86);
  };

  function rosterProtection34(){
    const all=[...(careerState.starters||[]),...(careerState.bench||[])],seen=new Set(),rows=all.filter(p=>p&&!seen.has(p.id||p.name)&&(seen.add(p.id||p.name),true)).map(p=>{
      let score=Number(p.overall||78);if(p.isUser){const promise=careerState.contract?.rolePromise||'';score+=/核心/.test(promise)?6:/稳定首发/.test(promise)?4:/首发竞争/.test(promise)?2:0;score+=(Number(careerState.coachTrust||50)-50)*.03;}return{p,score};
    }).sort((a,b)=>b.score-a.score);return rows.slice(0,4).map((x,i)=>({...x,priority:i+1}));
  }
  function expansionState34(){careerState.v34ExpansionDraft=careerState.v34ExpansionDraft||{year:2035,resolved:false};return careerState.v34ExpansionDraft;}
  function chooseExpansionTeam34(){
    const role=state.role,teams=ensureExpansionTeams34(2035).filter(t=>t.active!==false),hash=t=>stableSeasonNoise(`${t.short}-${role}-${getPlayerName()}`,2035,7);return [...teams].sort((a,b)=>(Number(b.strength||75)+hash(b))-(Number(a.strength||75)+hash(a)))[0]||teams[0];
  }
  function resolveExpansionCore34(){
    const st=expansionState34();if(st.resolved){try{window.__OWL_V35_EXPANSION_WORLD?.onPlayerResolved?.(st,{beforeTeamShort:st.playerTeamShort||st.fromShort||null});}catch(_){}return st;}
    applyExpansionLeagueStrength34(true);const sourceTeam=careerState.team,active=Number(careerState.contract?.remaining||0)>0;
    if(!active){st.resolved=true;st.status='free-agent';st.playerTeamShort=sourceTeam?.short||null;try{window.__OWL_V35_EXPANSION_WORLD?.onPlayerResolved?.(st,{beforeTeamShort:sourceTeam?.short||null});}catch(_){}return st;}
    const protectedList=rosterProtection34(),me=protectedList.find(x=>x.p.isUser);st.protected=protectedList.map(x=>({name:x.p.isUser?getPlayerName():x.p.name,priority:x.priority,isUser:!!x.p.isUser}));
    if(me){st.resolved=true;st.status='protected';st.priority=me.priority;st.playerTeamShort=sourceTeam?.short||null;try{window.__OWL_V35_EXPANSION_WORLD?.onPlayerResolved?.(st,{beforeTeamShort:sourceTeam?.short||null});}catch(_){}return st;}
    const ovr=Number(getMyOvr()==='--'?78:getMyOvr()),chance=clamp(.18+(ovr-72)*.045+(careerState.popularity||0)*.002,.20,.88),selected=Math.random()<chance;
    if(selected){const old=sourceTeam,newTeam=chooseExpansionTeam34();st.status='selected';st.from=old?.name;st.fromShort=old?.short||null;st.playerTeamShort=old?.short||null;st.to=newTeam.name;careerState.team=newTeam;if(careerState.contract)careerState.contract.teamName=newTeam.name;careerState.tactic=pick(TACTICS);careerState.rank=16;careerState.goal='完成扩军赛季磨合';careerState.starters=createRoster(newTeam,true);careerState.bench=createBenchForTeam(newTeam);matchState.homeTeam=newTeam;careerState.v34ExpansionHistory=careerState.v34ExpansionHistory||[];careerState.v34ExpansionHistory.push({year:2035,from:old?.name,to:newTeam.name,type:'扩军选秀'});if(year34()===2035)buildSchedule34(2035);}
    else st.status='unselected';
    st.resolved=true;st.playerTeamShort=st.playerTeamShort||sourceTeam?.short||null;
    try{window.__OWL_V35_EXPANSION_WORLD?.onPlayerResolved?.(st,{beforeTeamShort:sourceTeam?.short||null});}catch(_){}
    return st;
  }
  function resolveExpansionDraft34(wrap){resolveExpansionCore34();renderContractMarket(wrap);}
  function openExpansionSeasonGate34(){
    if(year34()!==2035||expansionState34().resolved)return false;const overlay=document.getElementById('seasonEventOverlay'),holder=document.getElementById('seasonEventContent');if(!overlay||!holder)return false;ensureExpansionTeams34(2035);applyExpansionLeagueStrength34(true);const active=Number(careerState.contract?.remaining||0)>0,protectedList=rosterProtection34(),me=protectedList.find(x=>x.p.isUser);
    const list=protectedList.map(x=>`<div class="v34-protect ${x.p.isUser?'mine':''}"><b>#${x.priority}</b><span>${x.p.isUser?getPlayerName():x.p.name}</span><em>${x.p.role||''}</em></div>`).join('');
    const title=!active?'你以自由选手身份进入扩军年':me?`你是 ${careerState.team.name} 第${me.priority}保护顺位`:`你未进入 ${careerState.team.name} 的4人保护名单`;
    const copy=!active?'合同已到期，不参加扩军选秀。':me?'你不会进入扩军选秀池。':'你将进入扩军选秀池；若被选中，现有合同直接转移。';
    holder.innerHTML=`<div class="season-event-top"><span class="season-event-kicker">2035 EXPANSION DRAFT</span><span class="season-event-round">24队扩军</span></div><div class="season-event-icon">🌐</div><h2 class="season-event-title">${title}</h2><div class="season-event-copy">${active?`<div class="v34-protection-list">${list}</div>`:''}<p>${copy}</p></div><div class="season-event-choices"><button class="season-event-choice" id="v34SeasonExpansionResolve"><div><strong>${!active||me?'确认保护名单 →':'进行扩军选秀 →'}</strong></div></button></div>`;overlay.classList.remove('hidden');
    document.getElementById('v34SeasonExpansionResolve')?.addEventListener('click',()=>{const st=resolveExpansionCore34(),selected=st.status==='selected';holder.innerHTML=`<div class="season-event-top"><span class="season-event-kicker">2035 EXPANSION DRAFT · RESULT</span><span class="season-event-round">扩军选秀</span></div><div class="season-event-icon">${selected?'✈️':'🛡️'}</div><h2 class="season-event-title">${selected?`${st.to} 选择了你`:st.status==='protected'?'你留在保护名单中':st.status==='free-agent'?'你直接进入自由市场':'你没有被扩军队选中'}</h2><div class="season-event-copy"><p>${selected?`${st.from} → ${st.to}。原合同由新军继承。`:st.status==='protected'?`保护顺位：第 ${st.priority}。`:st.status==='free-agent'?'扩军选秀不影响自由选手身份。':'你继续履行现有合同。'}</p></div><div class="season-event-choices"><button class="season-event-choice" id="v34SeasonExpansionDone"><div><strong>进入2035赛季 →</strong></div></button></div>`;document.getElementById('v34SeasonExpansionDone')?.addEventListener('click',()=>{overlay.classList.add('hidden');renderSeason();setTimeout(()=>maybeRuleIntro34(2035),80);});});return true;
  }
  function renderExpansionGate34(wrap){
    ensureExpansionTeams34(2035);applyExpansionLeagueStrength34(true);const st=expansionState34(),active=Number(careerState.contract?.remaining||0)>0,protectedList=rosterProtection34(),me=protectedList.find(x=>x.p.isUser);
    if(!active){wrap.innerHTML=`<div class="offseason-kicker">2035 EXPANSION DRAFT</div><h3>联盟扩军 · 你以自由选手身份进入市场</h3><p>东京弧光、大阪风暴、柏林先锋与利雅得日蚀加入联盟。合同已经到期的选手不参加扩军选秀，将直接进入自由市场。</p><button class="primary-btn" id="v34ExpansionContinue">进入自由市场 →</button>`;}
    else if(me){wrap.innerHTML=`<div class="offseason-kicker">2035 EXPANSION DRAFT · PROTECTED</div><h3>你进入了 ${careerState.team.name} 的4人保护名单</h3><div class="v34-protection-list">${protectedList.map(x=>`<div class="v34-protect ${x.p.isUser?'mine':''}"><b>#${x.priority}</b><span>${x.p.isUser?getPlayerName():x.p.name}</span><em>${x.p.role}</em></div>`).join('')}</div><p>你的保护顺位：<strong>第 ${me.priority} 顺位</strong>。你不会进入本届扩军选秀池。</p><button class="primary-btn" id="v34ExpansionContinue">继续休赛期 →</button>`;}
    else{wrap.innerHTML=`<div class="offseason-kicker">2035 EXPANSION DRAFT · UNPROTECTED</div><h3>你未进入 ${careerState.team.name} 的4人保护名单</h3><div class="v34-protection-list">${protectedList.map(x=>`<div class="v34-protect"><b>#${x.priority}</b><span>${x.p.name}</span><em>${x.p.role}</em></div>`).join('')}</div><p>你将进入扩军选秀池。若被新军选中，现有合同剩余年限与薪资会直接转移。</p><button class="primary-btn" id="v34ExpansionContinue">进行扩军选秀 →</button>`;}
    document.getElementById('v34ExpansionContinue')?.addEventListener('click',()=>resolveExpansionDraft34(wrap));
  }
  const _marketRender34=renderContractMarket;renderContractMarket=function(wrap){
    if(year34()===2034&&!expansionState34().resolved){renderExpansionGate34(wrap);return;}
    const out=_marketRender34.apply(this,arguments);const st=careerState.v34ExpansionDraft;if(st?.resolved&&st.year===2035&&st.status==='selected'&&wrap&&!wrap.querySelector('.v34-expansion-result'))wrap.insertAdjacentHTML('afterbegin',`<div class="v34-expansion-result"><strong>🌐 扩军选秀：${st.from} → ${st.to}</strong><span>原合同已由新军继承。</span></div>`);return out;
  };

  const _offers34=generateContractOffers;generateContractOffers=function(){
    if(year34()===2034)ensureExpansionTeams34(2035);const out=_offers34.apply(this,arguments);if(year34()+1<2033)return out;
    const list=offseasonState.offers||[],external=list.filter(o=>!o.renewal);if(external.length){const o=external.sort((a,b)=>(Number(a.teamPower||0)-Number(b.teamPower||0)))[0];o.years=1;o.shortTerm=true;o.salary=Math.max(8,Math.round(Number(o.salary||10)*1.08));const role=o.rolePromise||'轮换选手';o.rolePromise=/轮换/.test(role)?'首发竞争':/首发竞争/.test(role)?'稳定首发':role;o.note='短约救火：合同只有1年，但更容易获得明确的即时出场机会。';}return out;
  };
  const _renderMarket34=renderContractMarket;renderContractMarket=function(wrap){const out=_renderMarket34.apply(this,arguments);if(wrap&&year34()+1>=2033)wrap.querySelectorAll('.offer-card').forEach(btn=>{const o=(offseasonState.offers||[]).find(x=>x.id===btn.dataset.offerId);if(o?.shortTerm&&!btn.querySelector('.v34-short-badge'))btn.insertAdjacentHTML('afterbegin','<span class="v34-short-badge">短约</span>');});return out;};

  function standings34(){
    const y=year34();if(y<2027)return null;if(seasonState.finalStandingsCache?.v34)return seasonState.finalStandingsCache;
    if(Number(seasonState.played||0)>=Number(seasonState.total||0)&&typeof window.__OWL_V34_STANDINGS_OVERRIDE==='function'){
      const rows=window.__OWL_V34_STANDINGS_OVERRIDE();
      if(Array.isArray(rows)&&rows.length){rows.v34=true;seasonState.finalStandingsCache=rows;return rows;}
    }
    const total=Number(seasonState.total||56),teams=activeTeams34(),userLP=Number(seasonState.wins||0)+Number(seasonState.majorBonusLP||0),rows=teams.map(team=>{
      if(team.name===careerState.team?.name)return{team,wins:seasonState.wins,losses:total-seasonState.wins,mapDiff:Math.round((seasonState.wins-seasonState.losses)*2.1),lp:userLP,isUser:true};
      let str=Number(team.strength||80);if(expansionTeam34(team)&&y===2035)str-=3;const rate=clamp(.5+(str-80)*.018+stableSeasonNoise(team.name,y,4)*.01,.18,.82),wins=clamp(Math.round(total*rate),Math.max(2,Math.round(total*.14)),Math.round(total*.86)),major=clamp(Math.round((str-78)/6+stableSeasonNoise(team.name,88+y,2)),0,8);return{team,wins,losses:total-wins,mapDiff:Math.round((wins-total/2)*2+stableSeasonNoise(team.name,177+y,7)),lp:wins+major,isUser:false};
    }).sort((a,b)=>b.lp-a.lp||b.wins-a.wins||b.mapDiff-a.mapDiff||Number(b.team.strength||80)-Number(a.team.strength||80));
    rows.forEach((r,i)=>{r.rank=i+1;r.globalRank=i+1;r.direct=i<6;r.qualifier=i>=6&&i<(y>=2035?14:10);});rows.v34=true;seasonState.finalStandingsCache=rows;return rows;
  }
  const _stand34=syntheticFinalStandings;syntheticFinalStandings=function(){return year34()>=2027?standings34():_stand34.apply(this,arguments);};
  const _est34=estimateSeasonRank;estimateSeasonRank=function(){
    if(year34()<2027)return _est34.apply(this,arguments);if(!seasonState.played)return careerState.rank||7;if(seasonState.played>=seasonState.total)return standings34().find(r=>r.isUser)?.rank||activeTeams34().length;const n=activeTeams34().length,rate=seasonState.wins/Math.max(1,seasonState.played);return clamp(Math.round(n+.5-rate*(n+2)),1,n);
  };

  function strengthScore34(team,salt=0){return Number(team?.strength||80)+stableSeasonNoise(team?.name||'x',year34()*31+salt,4);}
  function aiSeriesWinner34(a,b,salt){return strengthScore34(a,salt)>=strengthScore34(b,salt+7)?a:b;}
  function userSeries34(opponent,seedEdge=0){const our=teamDisplayPower(careerState.starters||[]),opp=Number(opponent?.strength||80),chance=clamp(.5+(our-opp)*.025+seedEdge,.24,.82);let us=0,them=0;while(us<3&&them<3){if(Math.random()<chance)us++;else them++;}return{winner:us===3?careerState.team:opponent,loser:us===3?opponent:careerState.team,score:`${us}:${them}`,won:us===3};}
  function aiSeries34(a,b,salt){const w=aiSeriesWinner34(a,b,salt),l=w.name===a.name?b:a;let loserMaps=Math.abs(Math.round(stableSeasonNoise(`${a.name}-${b.name}`,salt,2)))%3;return{winner:w,loser:l,score:`3:${loserMaps}`};}

  function buildPlayIn2027_34(rows,simulateUser=true){
    const s=n=>rows[n-1]?.team,A=s(7),B=s(8),C=s(9),D=s(10),me=careerState.team?.name,logs=[];
    const play=(a,b,salt,highSeed)=>{let r,score;if(simulateUser&&(a?.name===me||b?.name===me)){const userIsA=a?.name===me,opp=userIsA?b:a;r=userSeries34(opp,highSeed?.name===me?.025:-.01);const [us,them]=String(r.score).split(':');score=userIsA?r.score:`${them}:${us}`;}else{r=aiSeries34(a,b,salt);score=r.score;}logs.push(`${a.name} vs ${b.name} · ${score} · ${r.winner.name}晋级`);return r;};
    const g1=play(A,B,71,A),g2=play(C,D,72,C),g3=play(g1.loser,g2.winner,73,g1.loser);return{teams:[...rows.slice(0,6).map(r=>r.team),g1.winner,g3.winner],logs,userQualified:[g1.winner,g3.winner].some(t=>t.name===me),userSeed:g1.winner.name===me?7:g3.winner.name===me?8:null};
  }
  function buildWildCard2035_34(rows,simulateUser=true){
    const s=n=>rows[n-1]?.team,me=careerState.team?.name,logs=[];
    const play=(a,b,salt,high)=>{let r,score;if(simulateUser&&(a?.name===me||b?.name===me)){const userIsA=a?.name===me,opp=userIsA?b:a;r=userSeries34(opp,high?.name===me?.03:-.012);const [us,them]=String(r.score).split(':');score=userIsA?r.score:`${them}:${us}`;}else{r=aiSeries34(a,b,salt);score=r.score;}logs.push(`${a.name} vs ${b.name} · ${score} · ${r.winner.name}晋级`);return r;};
    const a1=play(s(11),s(14),111,s(11)),a2=play(a1.winner,s(10),112,s(10)),a3=play(a2.winner,s(7),113,s(7));
    const b1=play(s(12),s(13),121,s(12)),b2=play(b1.winner,s(9),122,s(9)),b3=play(b2.winner,s(8),123,s(8));
    return{teams:[...rows.slice(0,6).map(r=>r.team),a3.winner,b3.winner],logs,userQualified:[a3.winner,b3.winner].some(t=>t.name===me),userSeed:a3.winner.name===me?7:b3.winner.name===me?8:null};
  }
  function ensurePostseason34(simulateUser=false){
    if(Number(seasonState.v34Postseason?.year)===year34()&&seasonState.v34PostseasonTeams?.length===8)return{teams:seasonState.v34PostseasonTeams,logs:seasonState.v34Postseason?.logs||[],userQualified:seasonState.v34PostseasonTeams.some(t=>t.name===careerState.team?.name),userSeed:careerState.postseasonSeed||null};
    const rows=standings34(),res=year34()>=2035?buildWildCard2035_34(rows,simulateUser):buildPlayIn2027_34(rows,simulateUser);seasonState.v34PostseasonTeams=res.teams;seasonState.v34Postseason={year:year34(),logs:res.logs,userQualified:res.userQualified,userSeed:res.userSeed,resolved:true};if(res.userSeed)careerState.postseasonSeed=res.userSeed;return res;
  }
  function qualifierLabel34(){return year34()>=2035?'Wild Card':'Play-in';}
  function openQualifier34(){
    const rows=standings34(),mine=rows.find(r=>r.isUser),overlay=document.getElementById('seasonEventOverlay'),holder=document.getElementById('seasonEventContent');if(!overlay||!holder)return;
    const q=qualifierLabel34(),need=year34()>=2035?(mine.rank<=8?1:mine.rank<=10?2:3):(mine.rank<=8?'最多2场':'2场');
    holder.innerHTML=`<div class="season-event-top"><span class="season-event-kicker">${q.toUpperCase()} · POSTSEASON</span><span class="season-event-round">常规赛第 ${mine.rank}</span></div><div class="season-event-icon">🎟️</div><h2 class="season-event-title">${q} · 争夺最后2个季后赛席位</h2><div class="season-event-copy"><p>${year34()>=2035?`全球第1～6直接晋级；第7～14进入Wild Card。第7/8只需赢1轮，第9/10需赢2轮，第11～14需赢3轮。${year34()>=2038?' 高顺位拥有主场权。':''}`:'第1～6直接晋级；第7～10进入Play-in，争夺最后2席。'}</p><div class="v71-pregame-grid"><div><span>你的排名</span><strong>#${mine.rank}</strong></div><div><span>赛制</span><strong>FT3 · 单败</strong></div><div><span>你的路径</span><strong>${need}</strong></div></div></div><div class="season-event-choices"><button class="season-event-choice" id="v34ResolveQualifier"><div><strong>模拟 ${q} →</strong></div></button></div>`;overlay.classList.remove('hidden');
    document.getElementById('v34ResolveQualifier')?.addEventListener('click',()=>{const r=ensurePostseason34(true);holder.innerHTML=`<div class="season-event-top"><span class="season-event-kicker">${q.toUpperCase()} · RESULT</span><span class="season-event-round">FT3 单败</span></div><div class="season-event-icon">${r.userQualified?'🎟️':'💔'}</div><h2 class="season-event-title">${r.userQualified?`晋级正式季后赛 · #${r.userSeed}`:`${q}出局`}</h2><div class="season-event-copy"><p>${r.logs.join('<br>')}</p></div><div class="season-event-choices"><button class="season-event-choice" id="v34QualifierDone"><div><strong>${r.userQualified?'进入八队双败季后赛 →':'进入赛季结算 →'}</strong></div></button></div>`;document.getElementById('v34QualifierDone')?.addEventListener('click',()=>{overlay.classList.add('hidden');if(r.userQualified)enterPlayoffs();else showSeasonSummary();});});
  }

  const _setupPlayoffs34=setupPlayoffs;setupPlayoffs=function(){
    if(year34()<2027)return _setupPlayoffs34.apply(this,arguments);const post=ensurePostseason34(false),teams=post.teams||[];resetPlayoffState();const idx=teams.findIndex(t=>t.name===careerState.team?.name);if(idx<0){playoffState.active=false;return;}playoffState.active=true;playoffState.seed=idx+1;careerState.postseasonSeed=idx+1;playoffState.teams=teams;playoffState.matches=PLAYOFF_MATCH_BLUEPRINT.map(x=>({...x,result:null}));syncDoubleElimBracket(null);renderPlayoffs();
  };
  const _enter34=enterPlayoffs;enterPlayoffs=function(){if(year34()<2027)return _enter34.apply(this,arguments);if(seasonState.played<seasonState.total)return;const post=ensurePostseason34(false);if(!post.teams.some(t=>t.name===careerState.team?.name))return;if(!playoffState.active)setupPlayoffs();renderPlayoffs();showScreen('playoff');};
  const _continueAwards34=continueAfterRegularAwards;continueAfterRegularAwards=function(){if(year34()<2027)return _continueAwards34.apply(this,arguments);const r=estimateSeasonRank(),cut=year34()>=2035?14:10;if(r<=6){ensurePostseason34(false);enterPlayoffs();}else if(r<=cut)openQualifier34();else showSeasonSummary();};
  const _awardRender34=renderRegularSeasonAwards;renderRegularSeasonAwards=function(){const out=_awardRender34.apply(this,arguments);if(year34()>=2027&&seasonState.played>=seasonState.total){const r=estimateSeasonRank(),cut=year34()>=2035?14:10;if(els.awardsContinueBtn)els.awardsContinueBtn.textContent=r<=6?(playoffState.active?'🏆 返回季后赛':'🏆 进入季后赛'):r<=cut?`🎟️ 进入 ${qualifierLabel34()}`:'📊 进入赛季结算';}return out;};

  function venueRecord34(){let hw=0,hl=0,aw=0,al=0;(seasonState.results||[]).forEach((r,i)=>{if(!r)return;if(seasonState.venues?.[i]==='home'){r==='win'?hw++:hl++;}else{r==='win'?aw++:al++;}});return{hw,hl,aw,al};}
  function renderFinal34(area){
    const r=estimateSeasonRank(),cut=year34()>=2035?14:10,q=qualifierLabel34(),txt=r<=6?'直接进入八队双败季后赛。':r<=cut?`进入${q}，争夺最后2个正式季后赛席位。`:'未进入年度季后赛阶段。';
    area.innerHTML=`<div class="season-complete-banner"><strong>常规赛完成：${seasonState.wins} 胜 ${seasonState.losses} 负 · 全联盟第 ${r}。</strong><br>${txt}<div style="margin-top:13px;display:flex;gap:10px;flex-wrap:wrap"><button class="secondary-btn" id="viewRegularAwardsBtn">${seasonState.awardsViewed?'🏅 返回年度奖项':'🏅 揭晓年度奖项'}</button>${r<=6?'<button class="primary-btn" id="enterPlayoffsBtn">🏆 进入季后赛</button>':r<=cut?`<button class="primary-btn" id="v34QualifierBtn">🎟️ 进入 ${q}</button>`:''}<button class="secondary-btn" data-open-season-summary="1">📊 查看赛季结算</button></div></div>`;
    document.getElementById('viewRegularAwardsBtn')?.addEventListener('click',openRegularSeasonAwards);document.getElementById('enterPlayoffsBtn')?.addEventListener('click',()=>{ensurePostseason34(false);enterPlayoffs();});document.getElementById('v34QualifierBtn')?.addEventListener('click',openQualifier34);
  }

  function normalizeLegacyFutureSeason34(){
    const y=year34();if(y<2035||!careerState.team||!seasonState.active)return false;const f=seasonFormat34(y),played=Math.max(0,Number(seasonState.played||0)),oppLen=(seasonState.opponents||[]).length,venueLen=(seasonState.venues||[]).length;
    if(Number(seasonState.total)===f.total&&oppLen>=f.total&&venueLen>=f.total)return false;
    if(played>=f.total){const kept=f.total,results=Array.isArray(seasonState.results)?seasonState.results.slice(0,kept):Array(kept).fill(null),oldOpp=(seasonState.opponents||[]).slice(0,kept),oldVen=(seasonState.venues||[]).slice(0,kept),oldLeg=(seasonState.legs||[]).slice(0,kept);seasonState.total=kept;seasonState.played=kept;seasonState.results=results;seasonState.wins=results.filter(x=>x==='win').length;seasonState.losses=results.filter(x=>x==='loss').length;seasonState.userRatings=(seasonState.userRatings||[]).slice(0,kept);seasonState.opponents=oldOpp;seasonState.venues=oldVen;seasonState.legs=oldLeg;seasonState.v34LegacyScheduleMigration={year:y,mode:'trimmed-to-new-format',fromPlayed:played,target:kept};seasonState.finalStandingsCache=null;return true;}
    const oldOpp=(seasonState.opponents||[]).slice(0,played),oldVen=(seasonState.venues||[]).slice(0,played),oldLeg=(seasonState.legs||[]).slice(0,played),oldResults=(seasonState.results||[]).slice(0,played),oldRatings=(seasonState.userRatings||[]).slice(0,played);
    buildSchedule34(y);const genOpp=[...(seasonState.opponents||[])],genVen=[...(seasonState.venues||[])],genLeg=[...(seasonState.legs||[])];seasonState.opponents=[...oldOpp,...genOpp.slice(played,f.total)];seasonState.venues=[...oldVen,...genVen.slice(played,f.total)];seasonState.legs=[...oldLeg,...genLeg.slice(played,f.total)];seasonState.total=f.total;seasonState.results=[...oldResults,...Array(Math.max(0,f.total-played)).fill(null)];seasonState.userRatings=oldRatings;seasonState.v34LegacyScheduleMigration={year:y,mode:'remaining-rebuilt',played,target:f.total};seasonState.finalStandingsCache=null;return true;
  }

  const _renderSeason34=renderSeason;renderSeason=function(){
    const y0=year34();if(y0>=2035)normalizeLegacyFutureSeason34();const out=_renderSeason34.apply(this,arguments),y=year34();if(y<2027||!careerState.team)return out;
    const f=seasonFormat34(y),league=document.getElementById('seasonLeagueText'),head=document.querySelector('.season-track-head h3+span'),area=document.getElementById('seasonCompleteArea');
    if(y>=2040){if(league)league.innerHTML=`OWL Global League · 全球第 ${seasonState.played?estimateSeasonRank():'—'} · Stage ${stageNo34(y)}`;}
    else if(y>=2035&&league)league.innerHTML=`OWL 2.0 · ${confZh34(careerState.team)} · Stage ${stageNo34(y)}`;
    if(y>=2035&&head)head.textContent=f.summary;
    if(y>=2035){
      const dots=document.getElementById('seasonDots'),l=f.lens,starts=[0,l[0],l[0]+l[1]];if(dots)dots.innerHTML=l.map((len,si)=>`<div class="stage-dot-group"><b>STAGE ${si+1}</b><div class="stage-dot-row">${Array.from({length:len},(_,j)=>{const i=starts[si]+j,r=seasonState.results[i];return`<i class="season-dot ${r||''} ${i===seasonState.played&&seasonState.played<f.total?'current':''}" title="Stage ${si+1} · 第${j+1}场 · ${seasonState.venues?.[i]==='home'?'主场':'客场'}${seasonState.opponents?.[i]?' · '+seasonState.opponents[i].name:''}"></i>`;}).join('')}</div></div>`).join('');
      const stage=stageNo34(y),[a,b]=stageBounds34(stage,y),progress=document.getElementById('seasonProgressCopy'),vr=venueRecord34();if(progress&&seasonState.played<f.total)progress.innerHTML=`Stage ${stage} · <strong>${seasonState.played-a} / ${b-a}</strong> · 全赛季 ${seasonState.played} / ${f.total}${y>=2038?` · 主场 ${vr.hw}-${vr.hl} / 客场 ${vr.aw}-${vr.al}`:''}`;
      const next=seasonState.opponents?.[seasonState.played],n=document.getElementById('seasonNextOpponent');if(n&&seasonState.played<f.total)n.textContent=`下一场：${next?.name||'待定'} · ${seasonState.legs?.[seasonState.played]||''} · ${seasonState.venues?.[seasonState.played]==='home'?'主场':'客场'}`;
    }
    if(area&&seasonState.stageBreakPending&&y>=2030){const s=Number(seasonState.stageBreakPending),rec=stageRecord(s),rank=stageEstimatedRank(s),next=y>=2030&&s===3?'EWC · 沙特中立场':`Major ${s}`;area.innerHTML=`<div class="stage-break-card v32-stage-auto"><div class="offseason-kicker">STAGE ${s} COMPLETE</div><h3>Stage ${s} 已结束</h3><div class="stage-break-stats"><div><span>阶段战绩</span><strong>${rec.wins}-${rec.losses}</strong></div><div><span>${y>=2040?'全球':'阶段'}排名</span><strong>第 ${rank}</strong></div><div><span>下一节点</span><strong>${next}</strong></div></div></div>`;}
    if(area&&seasonState.v71LastMajorSummary?.v34Type==='ewc'){
      const h=seasonState.v71LastMajorSummary;area.innerHTML=`<div class="stage-break-card v71-major-result"><div class="offseason-kicker">EWC · SAUDI ARABIA · NEUTRAL VENUE</div><h3>🏆 ${h.champion}</h3><p>Esports World Cup · Overwatch项目。你的成绩：<strong>${h.result.replace('EWC · Overwatch ','')}</strong>${h.bonusLP?` · +${h.bonusLP} LP`:''} · <strong>全年最高奖金赛事</strong></p><button class="primary-btn" id="v34ContinueEwc">继续赛季 →</button></div>`;document.getElementById('v34ContinueEwc')?.addEventListener('click',()=>{seasonState.v71LastMajorSummary=null;const resume=!!seasonState.v34ResumeWholeAfterMajor;seasonState.v34ResumeWholeAfterMajor=false;renderSeason();if(resume)window.__OWL_RUNTIME?.simulation?.resumeWhole?.(120);});return out;
    }
    if(area&&seasonState.played>=seasonState.total&&!seasonState.stageBreakPending&&!seasonState.v71LastMajorSummary)renderFinal34(area);
    const sim=document.getElementById('seasonSimNote');if(sim&&/56场/.test(sim.textContent||'')&&y>=2035)sim.textContent=(sim.textContent||'').replace(/56场/g,`${seasonState.total}场`);
    return out;
  };

  function allStarEventNames34(r){
    const fn=window.__OWL_ALLSTAR_DECISION?.eventNames;const names=typeof fn==='function'?fn(r):[];
    return names.length?names:(r?.selected?['全明星正赛']:[]);
  }
  function allStarWinnerLabel34(r){if(!r)return'—';if(r.global)return r.winner||'—';return r.winner==='East'?'东部':r.winner==='West'?'西部':r.winner||'—'}
  function allStarDetailHTML34(r,host){
    const events=allStarEventNames34(r),winner=allStarWinnerLabel34(r),selection=r.selected?(r.starter?'全明星首发':'全明星替补'):'未入选正赛';
    const skills=[r.risingEligible?`新星赛：${r.risingMvp?'🏆 最有价值选手':'参赛 / 未获MVP'}`:'新星赛：未获得参赛资格',`狙王挑战：${r.sniperEntered?(r.sniperWin?'🏆 狙王':'参赛 / 未夺冠'):'未参赛'}`,`全能王：${r.allRoundEntered?(r.allRoundWin?'🏆 全能王':'参赛 / 未夺冠'):'未参赛'}`];
    return `<div class="v25-allstar-detail" id="v25FutureAllStarDetail" hidden>
      <div class="v25-allstar-detail-head"><div><span>ALL-STAR DETAILS</span><strong>${r.year} 全明星周末详情</strong></div><em>${host?`举办地 · ${host}`:(r.global?'全球全明星':'Major 2 后')}</em></div>
      <div class="v25-allstar-detail-grid"><div><span>你的身份</span><strong>${selection}</strong></div><div><span>正赛结果</span><strong>${winner}获胜${r.allStarMvp?' · 你获正赛MVP':''}</strong></div><div><span>参加项目</span><strong>${events.length?events.length+'项':'—'}</strong></div></div>
      ${r.userRank?`<div class="v25-allstar-detail-grid compact"><div><span>职责票选/表现序位</span><strong>第 ${r.userRank}</strong></div><div><span>球迷序位</span><strong>第 ${r.fanRank||'—'}</strong></div><div><span>英雄池宽度</span><strong>${r.breadth??'—'}</strong></div></div>`:''}
      <div class="v25-allstar-section"><h4>你实际参加的项目</h4><p>${events.length?events.map(x=>`• ${x}`).join('<br>'):'未进入本届全明星参赛名单。'}</p></div>
      <div class="v25-allstar-section"><h4>娱乐项目结果</h4><p>${skills.join('<br>')}</p><small><strong>狙王规则：</strong>远程英雄1v1，远程英雄池越宽、狙击熟练度越高越占优。<br><strong>全能王规则：</strong>随机英雄1v1，英雄池越宽越占优。两项只增加公众关注，不进入历史地位评分。</small></div>
      ${!r.global?`<div class="v25-allstar-section"><h4>正赛附加价值</h4><p>${winner}获得下一阶段首轮选对手优先权。</p></div>`:''}
    </div>`;
  }
  function bindAllStarDetail34(){const btn=document.getElementById('v25FutureAllStarDetailBtn'),detail=document.getElementById('v25FutureAllStarDetail');if(!btn||!detail)return;btn.onclick=()=>{detail.hidden=!detail.hidden;btn.textContent=detail.hidden?'查看详情':'收起详情';btn.setAttribute('aria-expanded',String(!detail.hidden));if(!detail.hidden)setTimeout(()=>detail.scrollIntoView({block:'nearest',behavior:'smooth'}),30)}}
  function buildAllStar34(){
    const y=year34();if(seasonState.v71AllStar?.year===y)return seasonState.v71AllStar;
    const ratings=seasonState.userRatings||[],avg=ratings.length?ratings.reduce((a,b)=>a+b,0)/ratings.length:6.7,ovr=Number(getMyOvr()==='--'?78:getMyOvr()),pop=Number(careerState.popularity||40),score=avg*10+ovr*.13+pop*.18+Number(seasonState.wins||0)*.12;
    const selected=score>=83||avg>=7.25||pop>=72,starter=selected&&(score>=91||avg>=7.75),allStarMvp=starter&&Math.random()<clamp(.08+(avg-7.4)*.10,.05,.28);
    let hp=[];try{hp=typeof v71HeroPool==='function'?v71HeroPool({...createCareerPlayer(),isUser:true}):[]}catch(e){}const widow=hp.find(h=>h.name==='黑百合'),breadth=hp.filter(h=>Number(h.value||0)>=78).length,damage=['长枪输出','弹道输出'].includes(state.role);
    const risingEligible=selected&&Number(careerState.careerYears||1)<=2,risingMvp=risingEligible&&Math.random()<clamp(.12+(ovr-78)*.012,.10,.38),sniperEntered=selected&&damage&&Number(widow?.value||0)>=78&&Math.random()<clamp(.35+(Number(widow?.value||78)-78)*.025,.35,.78),sniperWin=sniperEntered&&Math.random()<clamp(.10+(Number(widow?.value||78)-78)*.018+(starter?.04:0),.10,.48),allRoundEntered=selected&&breadth>=4&&Math.random()<clamp(.30+breadth*.045,.42,.82),allRoundWin=allRoundEntered&&Math.random()<clamp(.08+(breadth-4)*.025+(ovr-80)*.008,.08,.42);
    const global=y>=2040,side=global?'全明星A队':confZh34(careerState.team),opp=global?'全明星B队':(conf34(careerState.team)==='East'?'西部':'东部'),won=Math.random()<.5,winner=won?side:opp;
    const r={year:y,selected,starter,allStarMvp,risingEligible,risingMvp,sniperEntered,sniperWin,allRoundEntered,allRoundWin,breadth,widow:Number(widow?.value||0),winner,side,opponent:opp,global,participation:selected?null:'not-selected',popApplied:false};
    let popGain=0;if(selected)popGain+=4;if(starter)popGain+=2;if(won&&selected)popGain+=1;if(sniperWin)popGain+=8;if(allRoundWin)popGain+=8;if(risingMvp)popGain+=5;if(allStarMvp)popGain+=6;r.popGain=popGain;
    seasonState.v71AllStar=r;seasonState.v71AllStarDraftPriority=global?null:(winner==='东部'?'East':'West');return r;
  }
  function openAllStar34(resumeWhole=false){
    if(year34()<2027)return false;const overlay=document.getElementById('seasonEventOverlay'),holder=document.getElementById('seasonEventContent');if(!overlay||!holder)return false;const y=year34(),r=buildAllStar34(),host=y>=2038?ALLSTAR_HOSTS[(y-2038)%ALLSTAR_HOSTS.length]:null,selection=r.selected?(r.starter?'⭐ 全明星首发':'⭐ 全明星替补'):'未入选全明星正赛';
    seasonState.simulating=false;seasonState.v18WholeActive=false;seasonState.v34ResumeWholeAfterAllStar=!!resumeWhole||!!seasonState.v34ResumeWholeAfterMajor;
    const finish=()=>{overlay.classList.add('hidden');seasonState.v71AllStarPending=false;seasonState.v71LastMajorSummary=null;const resume=!!seasonState.v34ResumeWholeAfterAllStar;seasonState.v34ResumeWholeAfterAllStar=false;seasonState.v34ResumeWholeAfterMajor=false;renderSeason();if(resume)window.__OWL_RUNTIME?.simulation?.resumeWhole?.(120);};
    if(r.selected&&!r.participation){
      holder.innerHTML=`<div class="season-event-top"><span class="season-event-kicker">ALL-STAR INVITATION${host?` · HOST CITY ${host}`:''}</span><span class="season-event-round">Major 2 后</span></div><div class="season-event-icon">⭐</div><h2 class="season-event-title">${y} OWL 全明星邀请${host?` · ${host}`:''}</h2><div class="season-event-copy"><div class="v71-pregame-grid"><div><span>你的身份</span><strong>${selection}</strong></div><div><span>参加项目</span><strong>${allStarEventNames34(r).length} 个项目</strong></div><div><span>赛事性质</span><strong>表演赛 · 不影响联赛排名</strong></div></div><p><strong>你将参加：</strong><br>${allStarEventNames34(r).map(x=>`• ${x}`).join('<br>')}</p><p>你可以选择退出。退出会降低公众关注并提升本赛季状态，但不扣队友信任。</p></div><div class="season-event-choices"><button class="season-event-choice" id="v34AttendAllStar"><div><strong>参加今年全明星 →</strong></div></button><button class="season-event-choice danger" id="v34WithdrawAllStar"><div><strong>退出今年全明星</strong></div></button></div>`;
      overlay.classList.remove('hidden');document.getElementById('v34AttendAllStar').onclick=()=>{window.__OWL_ALLSTAR_DECISION?.attend?.(r);openAllStar34(resumeWhole);};document.getElementById('v34WithdrawAllStar').onclick=()=>{window.__OWL_ALLSTAR_DECISION?.withdraw?.(r);openAllStar34(resumeWhole);};return true;
    }
    if(r.participation==='decline'){
      const p=r.withdrawPenalty||{};holder.innerHTML=`<div class="season-event-top"><span class="season-event-kicker">ALL-STAR · WITHDRAWN</span><span class="season-event-round">Major 2 后</span></div><div class="season-event-icon">⭐</div><h2 class="season-event-title">你退出了 ${y} OWL 全明星周末</h2><div class="season-event-copy"><div class="v71-pregame-grid"><div><span>公众关注</span><strong>-${p.popLoss||0}</strong></div><div><span>本赛季状态</span><strong>+${p.conditionGain||0}</strong></div><div><span>队友信任</span><strong>不变</strong></div></div><p>保留“全明星入选”，但没有实际参赛，因此不会获得首发或正赛MVP荣誉。</p></div><div class="season-event-choices"><button class="season-event-choice" id="v34CloseAllStar"><div><strong>进入 Stage 3 →</strong></div></button></div>`;overlay.classList.remove('hidden');document.getElementById('v34CloseAllStar').onclick=finish;return true;
    }
    if(r.selected&&r.participation!=='attend')window.__OWL_ALLSTAR_DECISION?.attend?.(r);
    holder.innerHTML=`<div class="season-event-top"><span class="season-event-kicker">ALL-STAR WEEKEND${host?` · HOST CITY ${host}`:''}</span><span class="season-event-round">Major 2 后</span></div><div class="season-event-icon">⭐</div><h2 class="season-event-title">${y} OWL 全明星周末${host?` · ${host}`:''}</h2><div class="season-event-copy"><div class="v71-pregame-grid"><div><span>你的身份</span><strong>${selection}</strong></div><div><span>参加项目</span><strong>${r.selected?allStarEventNames34(r).length+' 项':'—'}</strong></div><div><span>正赛结果</span><strong>${allStarWinnerLabel34(r)}获胜${r.allStarMvp?' · 你获正赛MVP':''}</strong></div></div>${allStarDetailHTML34(r,host)}</div><div class="season-event-choices v25-allstar-actions"><button class="secondary-btn" id="v25FutureAllStarDetailBtn" aria-expanded="false">查看详情</button><button class="season-event-choice" id="v34CloseAllStar"><div><strong>进入 Stage 3 →</strong></div></button></div>`;
    overlay.classList.remove('hidden');bindAllStarDetail34();document.getElementById('v34CloseAllStar').onclick=finish;return true;
  }

  // The old Major-result / All-Star handlers are module-private. Intercept the visible
  // continue button so RC14 whole-season simulation can resume after meaningful result stops.
  // Stage 2 still routes through All-Star; other Major results simply continue the season.
  window.addEventListener('click',e=>{
    const btn=e.target?.closest?.('#v767ContinueMajorBtn,#v742ContinueMajorBtn,#v741ContinueMajorBtn,#v71ContinueMajorBtn');
    const summary=seasonState.v71LastMajorSummary;
    if(!btn||year34()<2027||!summary)return;
    const resume=!!seasonState.v34ResumeWholeAfterMajor;
    if(Number(summary.stage)===2&&seasonState.v71AllStarPending){
      e.preventDefault();e.stopImmediatePropagation();seasonState.v71LastMajorSummary=null;openAllStar34(resume);return;
    }
    if(!resume)return;
    e.preventDefault();e.stopImmediatePropagation();seasonState.v71LastMajorSummary=null;seasonState.v34ResumeWholeAfterMajor=false;
    renderSeason();window.__OWL_RUNTIME?.simulation?.resumeWhole?.(120);
  },true);

  const _toggleFast34=toggleFastSeasonSimulation;
  toggleFastSeasonSimulation=function(){
    const y=year34();if(y<2027)return _toggleFast34.apply(this,arguments);
    if(seasonState.v71AllStarPending){openAllStar34(false);return;}
    if(y<2035)return _toggleFast34.apply(this,arguments);
    if(seasonState.stageBreakPending||seasonState.v71LastMajorSummary){renderSeason();return;}
    if(seasonState.simulating){seasonState.v767StageSimulating=false;if(seasonState.timer){clearTimeout(seasonState.timer);seasonState.timer=null;}seasonState.simulating=false;renderSeason();return;}
    if(Number(seasonState.played)>=Number(seasonState.total))return;const st=stageNo34(y),[,target]=stageBounds34(st,y);seasonState.v767StageSimulating=true;seasonState.v767StageTarget=target;seasonState.simulating=true;const note=document.getElementById('seasonSimNote');if(note)note.textContent=`正在模拟 Stage ${st}：本阶段剩余 ${target-Number(seasonState.played||0)} 场。`;renderSeason();fastSeasonStep();
  };

  const _wholeFutureBase34=window.__OWL_V18_FULL_SEASON;
  let wholeToken34=0;
  function worldCupDue34(){try{const rec=window.__OWL_WORLD_CUP?.maybeMarkDue?.();return rec&&!rec.completed&&rec.pendingStage?rec:null;}catch(_){return null;}}
  function stopWhole34(note=''){window.__OWL_RUNTIME?.simulation?.stopWhole?.(note);}
  function futureWholeSeason34(){
    if(year34()<2027)return typeof _wholeFutureBase34==='function'?_wholeFutureBase34():undefined;if(seasonState.v34WholeActive)return;const wc=worldCupDue34();if(wc){window.__OWL_WORLD_CUP?.open?.();return;}
    if(seasonState.v71AllStarPending){openAllStar34(true);return;}seasonState.v34WholeActive=true;seasonState.simulating=true;const token=++wholeToken34;
    const resolveBreak=()=>{const st=Number(seasonState.stageBreakPending)||0;if(!st)return false;stageQualified(st)?simulateStagePlayoff(st):skipStageBreak(st);seasonState.stageBreakPending=null;if(seasonState.v71LastMajorSummary){seasonState.v34ResumeWholeAfterMajor=true;stopWhole34();return true;}if(st===2&&seasonState.v71AllStarPending){stopWhole34();openAllStar34(true);return true;}return false;};
    if(resolveBreak())return;
    const step=()=>{if(token!==wholeToken34||!seasonState.v34WholeActive)return;let batch=0;while(batch++<10&&Number(seasonState.played)<Number(seasonState.total)){
      const before=Number(seasonState.played);window.__OWL_V16_SEASON_BATCHING=true;try{v32SilentRegularGame();}finally{window.__OWL_V16_SEASON_BATCHING=false;}if(Number(seasonState.played)<=before){stopWhole34('模拟被当前流程节点暂停。');return;}markStageBreakIfNeeded();if(resolveBreak())return;
      if(careerState.v800Trade?.pending){stopWhole34('🔄 模拟在交易节点暂停。');return;}const world=worldCupDue34();if(world){stopWhole34();setTimeout(()=>window.__OWL_WORLD_CUP?.open?.(),60);return;}if(seasonState.currentEvent||seasonState.eventDue){window.__OWL_RUNTIME?.simulation?.pauseWhole?.();seasonState.resumeWholeAfterEvent=true;renderSeason();setTimeout(openScheduledSeasonEvent,60);return;}
    }
    if(Number(seasonState.played)>=Number(seasonState.total)){stopWhole34(`✓ 常规赛与阶段赛事已完成：${seasonState.wins}胜${seasonState.losses}负。`);return;}const note=document.getElementById('seasonSimNote');if(note)note.textContent=`⏳ 正在模拟全部常规赛：${seasonState.played}/${seasonState.total} · ${seasonState.wins}胜${seasonState.losses}负`;renderSeason();setTimeout(step,8);};setTimeout(step,0);
  }
  window.__OWL_V18_FULL_SEASON=function(){return year34()>=2027?futureWholeSeason34():typeof _wholeFutureBase34==='function'?_wholeFutureBase34():undefined;};v35SimulateWholeSeason=window.__OWL_V18_FULL_SEASON;

  function futureRulebook34(){
    const y=year34(),f=seasonFormat34(y);let bullets=[];
    if(y>=2040)bullets=[`24队取消东西部竞争框架，统一全球排名；常规赛 ${f.total} 场，每个对手1主1客。`,'第1～6直通季后赛；第7～14进入Wild Card争最后2席；正式季后赛8队双败。','Stage 3阶段赛事为EWC · Overwatch，沙特阿拉伯中立场；All-Star保留。'];
    else if(y>=2038)bullets=[`${y===2038?'主客场元年采用全球完整双循环':'同部4回合 / 跨部2回合'}，常规赛 ${f.total} 场。`,'第1～6直通季后赛；第7～14进入Wild Card，高顺位拥有主场权。','Major与正式八强为中立场；Stage 3阶段赛事为沙特中立场EWC；All-Star轮换举办城市。'];
    else if(y>=2035)bullets=[`联盟24队，东西部各12队；常规赛 ${f.total} 场。`,'第1～6直通季后赛；第7～14进入FT3单败Wild Card，争最后2席。','Stage 3阶段赛事为EWC · Overwatch；All-Star保留。'];
    else if(y>=2033)bullets=['20队、56场、3个Stage；第1～6直通季后赛，第7～10进入Play-in。','自由市场开始出现1年短约救火合同。','Stage 3阶段赛事为EWC · Overwatch，沙特中立场；All-Star保留。'];
    else if(y>=2030)bullets=['20队、56场、3个Stage；第1～6直通季后赛，第7～10进入Play-in。','Stage 3阶段赛事改为EWC · Overwatch，沙特阿拉伯中立场、高奖金。','All-Star继续在Major 2后举行。'];
    else bullets=['20队、56场、3个Stage。','第1～6直通正式季后赛；第7～10进入Play-in，争最后2席。','2026起回归基础竞技流程，不额外叠加Hero Ban复杂度。'];
    return{title:`${y} OWL · 赛季规则`,summary:f.summary,bullets};
  }
  function openFutureRulebook34(){const overlay=document.getElementById('seasonEventOverlay'),holder=document.getElementById('seasonEventContent');if(!overlay||!holder)return;const r=futureRulebook34();holder.innerHTML=`<div class="season-event-top"><span class="season-event-kicker">OWL ${year34()} · SEASON RULEBOOK</span><span class="season-event-round">未来规则</span></div><div class="season-event-icon">📖</div><h2 class="season-event-title">${r.title}</h2><div class="season-event-copy"><p>${r.summary}</p><ul>${r.bullets.map(x=>`<li>${x}</li>`).join('')}</ul></div><div class="season-event-choices"><button class="season-event-choice" id="v34RulebookDone"><div><strong>返回常规赛 →</strong></div></button></div>`;document.getElementById('v34RulebookDone')?.addEventListener('click',()=>overlay.classList.add('hidden'));overlay.classList.remove('hidden');}
  document.addEventListener('click',e=>{const btn=e.target?.closest?.('#v13RulebookBtn');if(!btn||year34()<2027)return;e.preventDefault();e.stopImmediatePropagation();openFutureRulebook34();},true);

  function ruleCopy34(y){
    if(y===2027)return['2027 · Play-in上线','常规赛第1～6直接晋级；第7～10进入Play-in，争夺最后2个季后赛席位。','正式季后赛仍为8队双败。'];
    if(y===2030)return['2030 · EWC进入核心赛历','Stage 3阶段赛事改为EWC · Overwatch；比赛在沙特阿拉伯中立场举行。','EWC是全年最高奖金赛事之一；All-Star继续保留。'];
    if(y===2033)return['2033 · 短约制度','自由市场开始出现1年短约救火合同。','短约保障更弱，但更容易换取明确的即时出场机会。'];
    if(y===2035)return['2035 · Expansion Era','联盟扩军至24队：东京弧光、大阪风暴、柏林先锋、利雅得日蚀加入；东西部各12队。','老队保护4人；第1～6直通季后赛，第7～14打Wild Card争最后2席。'];
    if(y===2038)return['2038 · 主客场时代','主客场元年采用完整双循环：24队每个对手1主1客，共46场。','2039恢复同部4回合 / 跨部2回合；Major、EWC与正式八强保持中立场。'];
    if(y===2040)return['2040 · Global League Era','东西部竞争框架取消，24支队进入统一全球排名。','常规赛采用全球完整主客场双循环，共46场；第1～6直通、第7～14 Wild Card、最终8队双败继续保留。'];return null;
  }
  function maybeRuleIntro34(y=year34()){
    if(!RULE_YEARS.has(Number(y)))return;careerState.v34RuleIntroSeen=careerState.v34RuleIntroSeen||{};if(careerState.v34RuleIntroSeen[y])return;const c=ruleCopy34(Number(y)),overlay=document.getElementById('seasonEventOverlay'),holder=document.getElementById('seasonEventContent');if(!c||!overlay||!holder)return;
    careerState.v34RuleIntroSeen[y]=true;holder.innerHTML=`<div class="season-event-top"><span class="season-event-kicker">OWL ${y} · LEAGUE EVOLUTION</span><span class="season-event-round">规则变化</span></div><div class="season-event-icon">🌐</div><h2 class="season-event-title">${c[0]}</h2><div class="season-event-copy"><p>${c[1]}</p><p>${c[2]}</p></div><div class="season-event-choices"><button class="season-event-choice" id="v34RuleDone"><div><strong>开始 ${y} 赛季 →</strong></div></button></div>`;document.getElementById('v34RuleDone')?.addEventListener('click',()=>overlay.classList.add('hidden'));overlay.classList.remove('hidden');
  }

  const style=document.createElement('style');style.id='v34FutureLeagueStyle';style.textContent=`.v34-protection-list{display:grid;gap:7px;margin:14px 0}.v34-protect{display:grid;grid-template-columns:42px 1fr auto;gap:8px;align-items:center;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:rgba(255,255,255,.35)}.v34-protect.mine{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent) inset}.v34-protect b{font-size:16px}.v34-protect em{font-style:normal;color:var(--muted);font-size:11px}.v34-expansion-result{display:flex;justify-content:space-between;gap:10px;padding:10px 12px;margin-bottom:12px;border:1px solid var(--line);border-radius:12px}.v34-expansion-result span{color:var(--muted)}.v34-short-badge{position:absolute;right:8px;top:8px;padding:2px 7px;border-radius:999px;background:var(--ink);color:var(--paper);font-size:9px;font-weight:800}@media(max-width:720px){.v34-protect{grid-template-columns:36px 1fr}.v34-protect em{grid-column:2}.v34-expansion-result{display:block}.v34-expansion-result span{display:block;margin-top:4px}}`;document.head.appendChild(style);

  window.__OWL_V34_FUTURE={version:VER,format:seasonFormat34,ensureExpansionTeams:ensureExpansionTeams34,standings:standings34,postseason:ensurePostseason34,stageTable:stageTable34,ruleIntro:maybeRuleIntro34,rulebook:futureRulebook34,allStar:openAllStar34,expansionState:expansionState34,protection:rosterProtection34,playIn:buildPlayIn2027_34,wildCard:buildWildCard2035_34,openQualifier:openQualifier34,resolveExpansion:resolveExpansionCore34};
})();
