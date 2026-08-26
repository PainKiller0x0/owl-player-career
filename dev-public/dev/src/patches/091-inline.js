
(function(){
  'use strict';
  const B2_PATCH='Alpha1-Batch2-10-18';
  const b2Esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const b2Clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
  function b2Hash01(text){let h=2166136261>>>0;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return(h>>>0)/4294967295}
  const b2Year=()=>Number(careerState?.seasonYear||2019);

  /* 10 · 队伍信息补当前年龄 */
  function b2DecorateAge(){
    const facts=document.querySelector('#careerTeamScreen .rc27-contract-facts');if(!facts)return;facts.classList.add('b2-four-facts');
    let age=facts.querySelector('.b2-age-fact');if(!age){age=document.createElement('div');age.className='b2-age-fact';facts.appendChild(age)}
    age.innerHTML=`<span>当前年龄</span><strong>${Number(careerState?.age||state?.playerStartAge||16)} 岁</strong>`;
  }
  window.__OWL_RUNTIME?.render?.register('renderCareerTeam','b2-age',b2DecorateAge);
  b2DecorateAge();

  /* 11 · “原定首发”不是递补，改回正常赛事身份文案 */
  function b2AllStarNames(r){
    if(!r?.selected)return[];const out=[`全明星正赛（${r.starter?'首发':'替补'}）`];
    if(r.risingEligible)out.push('新星赛');if(r.sniperEntered)out.push('狙王挑战');if(r.allRoundEntered)out.push('全能王');return out;
  }
  if(window.__OWL_ALLSTAR_DECISION)window.__OWL_ALLSTAR_DECISION.eventNames=b2AllStarNames;
  function b2CleanAllStarCopy(){const root=document.getElementById('seasonEventContent');if(!root)return;const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while((n=walker.nextNode()))if(n.nodeValue?.includes('原定首发'))n.nodeValue=n.nodeValue.replaceAll('原定首发','首发');}

  /* 12 · 国家队磨合继承：俱乐部队友 + 近年国家队旧搭档 */
  function b2WcRoot(){careerState.worldCup=careerState.worldCup&&typeof careerState.worldCup==='object'?careerState.worldCup:{seasons:{}};careerState.worldCup.seasons=careerState.worldCup.seasons||{};return careerState.worldCup;}
  function b2PrevWc(rec){return Object.values(b2WcRoot().seasons||{}).filter(x=>x&&Number(x.year)<Number(rec.year)&&x.completed).sort((a,b)=>Number(b.year)-Number(a.year))[0]||null;}
  function b2SeedWcPre(rec){
    if(!rec||rec.b2PreCohesionSeeded||rec.matches?.length)return rec;const prev=b2PrevWc(rec);let base=46,notes=[];
    if(prev?.selected&&prev.representingCountry===rec.representingCountry){base+=4;notes.push('保留上届国家队经验');}
    if(prev&&/冠军/.test(String(prev.result||''))){base+=3;notes.push('上届冠军班底惯性');}else if(prev&&/亚军|决赛/.test(String(prev.result||''))){base+=2;notes.push('上届深轮次经验');}
    rec.nationalCohesion=b2Clamp(base,38,72);rec.b2PreCohesionSeeded=true;rec.b2CohesionNotes=notes;return rec;
  }
  function b2ApplyWcRosterChemistry(rec){
    if(!rec?.selected||rec.b2RosterCohesionSeeded||!Array.isArray(rec.roster)||!rec.roster.length||rec.matches?.length)return rec;
    const clubKeys=new Set([careerState.team?.name,careerState.team?.short].filter(Boolean).map(String));
    const mates=rec.roster.filter(p=>!p.isUser&&clubKeys.has(String(p.club||'')));
    const prior=Object.values(b2WcRoot().seasons||{}).filter(x=>x&&Number(x.year)<Number(rec.year)&&x.selected&&x.representingCountry===rec.representingCountry&&Array.isArray(x.roster)&&Number(rec.year)-Number(x.year)<=4);
    let oldBonus=0;const oldNames=[];
    for(const p of rec.roster.filter(x=>!x.isUser)){let best=0;for(const pr of prior){if(pr.roster.some(x=>x.name===p.name)){const gap=Number(rec.year)-Number(pr.year);best=Math.max(best,gap<=1?4:gap===2?3:2);}}if(best){oldBonus+=best;oldNames.push(p.name);}}
    const clubBonus=Math.min(15,mates.length*5),historyBonus=Math.min(16,oldBonus);rec.nationalCohesion=b2Clamp(Number(rec.nationalCohesion||46)+clubBonus+historyBonus,0,100);
    rec.b2RosterCohesionSeeded=true;rec.b2CohesionNotes=[...(rec.b2CohesionNotes||[]),...(mates.length?[`${mates.length}名俱乐部队友直接带来熟悉配合`]:[]),...(oldNames.length?[`${oldNames.length}名近年国家队旧搭档保留部分默契`]:[])];return rec;
  }

  /* 13 + 14 · 赛事地图池 + OWCS 2025+ Loser's Pick：首图控制，之后败者先选未使用模式，再从该模式赛事池选图 */
  const B2_MODE_GROUPS=['control','hybrid','flash_clash','escort','push'];
  const B2_MODE_LABEL={control:'控制',hybrid:'混合',flash_clash:'闪点 / 攻防阵线',escort:'运载',push:'推进',assault:'攻防作战'};
  const B2_rawCompetitive=typeof v71CompetitiveMaps==='function'?v71CompetitiveMaps:null;
  function b2MapEventKey(){
    const y=b2Year(),ctx=matchState?.context||'regular';let stage=1;try{stage=typeof v71StageNo==='function'?v71StageNo():1}catch(_){}
    if(ctx==='worldcup'){const r=b2WcRoot().seasons?.[y];return`${y}|worldcup|${r?.phase||r?.pendingStage||'main'}`;}
    if(ctx==='playoff')return`${y}|annual-playoffs`;if(ctx==='regular')return`${y}|stage-${stage}`;return`${y}|${ctx}|stage-${stage}`;
  }
  function b2PickGroup(list,count,key){if(list.length<=count)return[...list];const ranked=[...list].sort((a,b)=>b2Hash01(`${key}|${a.id}`)-b2Hash01(`${key}|${b.id}`));return ranked.slice(0,count);}
  function b2TournamentMapPool(){
    const raw=B2_rawCompetitive?B2_rawCompetitive(b2Year()):[];if(!raw?.length)return[];const key=b2MapEventKey(),groups={};for(const m of raw)(groups[m.modeGroup]??=[]).push(m);const out=[];
    for(const [g,list] of Object.entries(groups)){const count=g==='assault'?3:3;out.push(...b2PickGroup(list,count,`${key}|${g}`));}
    return out;
  }
  if(typeof v71MapPoolForMatch==='function')v71MapPoolForMatch=function(){return b2TournamentMapPool();};
  function b2OwcsEligibleModes(){
    if(b2Year()<2025)return null;const idx=Number(matchState?.mapIndex||0);if(idx===0)return['control'];
    const used=new Set(matchState?.usedModeGroups||[]),chosen=matchState?.b2ChosenMode;
    const remain=B2_MODE_GROUPS.filter(g=>!used.has(g));const legal=remain.length?remain:B2_MODE_GROUPS;
    if(chosen&&legal.includes(chosen))return[chosen];return legal;
  }
  if(typeof v71EligibleModeGroups==='function'){
    const base=v71EligibleModeGroups;v71EligibleModeGroups=function(){const legal=b2OwcsEligibleModes();return legal||base.apply(this,arguments);};
  }
  if(typeof v71EligibleMaps==='function'){
    v71EligibleMaps=function(){const ids=typeof v71UsedMapIds==='function'?v71UsedMapIds():new Set((matchState.mapSequence||[]).filter(Boolean).map(m=>m.id||m.name));const groups=new Set(typeof v71EligibleModeGroups==='function'?v71EligibleModeGroups():[]);return b2TournamentMapPool().filter(m=>(!groups.size||groups.has(m.modeGroup))&&!ids.has(m.id||m.name));};
  }
  if(typeof commitSeriesMap==='function'){
    const base=commitSeriesMap;commitSeriesMap=function(){const out=base.apply(this,arguments);if(matchState)matchState.b2ChosenMode=null;return out;};
  }
  function b2DecorateMapPool(){
    if(!document.getElementById('matchScreen')||!matchState?.homeTeam)return;const area=document.getElementById('mapControlArea');if(!area)return;document.querySelector('#matchScreen .b2-map-pool-card')?.remove();const pool=b2TournamentMapPool();if(!pool.length)return;
    const legal=b2Year()>=2025?(b2OwcsEligibleModes()||[]):[];const current=legal.length===1?legal[0]:matchState?.b2ChosenMode;
    const order=['control','hybrid','flash_clash','escort','push','assault'];const groups=order.map(g=>[g,pool.filter(m=>m.modeGroup===g)]).filter(([,a])=>a.length);const box=document.createElement('div');box.className='b2-map-pool-card';
    box.innerHTML=`<div class="b2-map-pool-head"><div><span>TOURNAMENT MAP POOL · ${b2Esc(b2MapEventKey().replaceAll('|',' · '))}</span><strong>本赛事只从下列地图中选择</strong></div>${b2Year()>=2025?'<em style="font-size:9px;color:var(--muted);font-style:normal">首图控制；之后败者先选未使用模式 → 再从该模式地图池选图</em>':''}</div><div class="b2-map-pool-grid">${groups.map(([g,a])=>`<div class="b2-map-pool-group ${b2Year()>=2025&&g===current?'active':''}"><b>${B2_MODE_LABEL[g]||g}</b><small>${a.map(m=>b2Esc(m.name)).join(' · ')}</small></div>`).join('')}</div>`;area.insertAdjacentElement('beforebegin',box);
  }
  if(typeof renderMapControl==='function'){
    const base=renderMapControl;renderMapControl=function(){
      try{
        const strategic=typeof v71HasStrategicDraft==='function'&&v71HasStrategicDraft(),map=typeof currentMatchMap==='function'?currentMatchMap():null;
        if(strategic&&!matchState?.finished&&!map&&matchState?.mapPicker==='home'){
          const groups=b2OwcsEligibleModes()||[];
          if(Number(matchState.mapIndex||0)>0&&!matchState.b2ChosenMode&&groups.length>1){
            const area=document.getElementById('mapControlArea');if(area){area.innerHTML=`<div class="map-header"><div><div class="map-kicker">MAP ${Number(matchState.mapIndex||0)+1} · 第1层博弈</div><h3 class="map-title">先选择地图模式</h3></div><div class="map-count"><span>选图权</span><strong>上一图败者</strong></div></div><div class="map-pick-panel"><div class="map-pick-head"><strong>选择本图模式</strong><span>已使用的模式在五种模式走完前不能重复</span></div><div class="map-pick-grid">${groups.map(g=>`<button class="map-pick-option" data-b2-map-mode="${g}"><strong>${B2_MODE_LABEL[g]||g}</strong><span>进入该模式的赛事地图池</span></button>`).join('')}</div><div class="map-picker-note">先定模式，再选具体地图；不会再把十几张不同模式地图一次性全塞给你。</div></div>`;area.querySelectorAll('[data-b2-map-mode]').forEach(btn=>btn.addEventListener('click',()=>{matchState.b2ChosenMode=btn.dataset.b2MapMode;renderMatch();}));return;}
          }
        }
      }catch(_){}
      return base.apply(this,arguments);
    };
  }
  window.__OWL_RUNTIME?.render?.register('renderMatch','b2-map-pool',b2DecorateMapPool);

  /* 15 · 点击赛季年份查看联盟战绩，总榜 / 东部 / 西部 */
  function b2Conf(team){try{if(b2Year()>=2024&&typeof v71Conference==='function')return v71Conference(team);if(typeof v762Region==='function')return v762Region(team,b2Year());}catch(_){}return team?.conference||((team?.division==='Atlantic')?'East':team?.division==='Pacific'?'West':'GLOBAL');}
  function b2ActiveTeams(){try{if(b2Year()>=2027&&typeof activeTeams34==='function')return activeTeams34();if(typeof v50ActiveTeams==='function')return v50ActiveTeams();}catch(_){}return(TEAMS||[]).filter(t=>t?.active!==false);}
  function b2ComputedStandingsRows(){
    const y=b2Year(),played=Number(seasonState?.played||0),teams=b2ActiveTeams();if(!played)return teams.map((team,i)=>({team,wins:0,losses:0,mapDiff:0,lp:0,isUser:team.name===careerState.team?.name,region:b2Conf(team),rank:i+1}));const mean=teams.reduce((n,t)=>n+Number(t.strength||80),0)/Math.max(1,teams.length);const rows=teams.map(team=>{const isUser=team.name===careerState.team?.name;if(isUser)return{team,isUser,wins:Number(seasonState.wins||0),losses:Number(seasonState.losses||0),mapDiff:Math.round((Number(seasonState.wins||0)-Number(seasonState.losses||0))*2.1),lp:Number(seasonState.wins||0)+Number(seasonState.majorBonusLP||0),region:b2Conf(team)};const rate=b2Clamp(.5+(Number(team.strength||80)-mean)*.016+(b2Hash01(`${y}|${played}|${team.short}`)-.5)*.12,.22,.78),wins=Math.round(played*rate),losses=played-wins;return{team,isUser,wins,losses,mapDiff:Math.round((wins-losses)*2+(b2Hash01(`${team.name}|md|${played}`)-.5)*8),lp:wins,region:b2Conf(team)};});rows.sort((a,b)=>Number(b.lp??b.wins)-Number(a.lp??a.wins)||b.wins-a.wins||b.mapDiff-a.mapDiff);rows.forEach((r,i)=>{r.rank=i+1;r.globalRank=i+1;r.direct=i<6;r.qualifier=i>=6&&i<(y>=2035?14:10);});return rows;
  }
  function b2StandingsRows(){
    const y=b2Year(),played=Number(seasonState?.played||0),total=Number(seasonState?.total||0);try{if(y>=2027&&played>=total&&typeof window.__OWL_V34_STANDINGS_OVERRIDE==='function')return window.__OWL_V34_STANDINGS_OVERRIDE().map(r=>({...r,region:b2Conf(r.team)}));if(y>=2027&&played>=total&&typeof syntheticFinalStandings==='function')return syntheticFinalStandings().map(r=>({...r,region:b2Conf(r.team)}));if(y>=2024&&y<=2026&&played>=total&&typeof syntheticFinalStandings==='function')return syntheticFinalStandings().map(r=>({...r,region:b2Conf(r.team)}));if(y>=2024&&y<=2026&&typeof v741LiveStandings==='function')return v741LiveStandings().map(r=>({...r,region:b2Conf(r.team)}));if(y>=2020&&y<=2023&&typeof v762Rows==='function'&&played>0)return v762Rows(played).map(r=>({...r,rank:r.globalRank||r.rank,region:r.region||b2Conf(r.team)}));}catch(_){}
    return b2ComputedStandingsRows();
  }
  window.__OWL_V34_STANDINGS_OVERRIDE=b2ComputedStandingsRows;
  function b2EnsureStandingsModal(){let o=document.getElementById('b2StandingsOverlay');if(o)return o;o=document.createElement('div');o.id='b2StandingsOverlay';o.className='b2-standings-overlay ui-hidden';o.innerHTML=`<section class="b2-standings-modal"><header class="b2-standings-head"><div><span>LEAGUE STANDINGS</span><h2 id="b2StandingsTitle">联盟战绩</h2><p id="b2StandingsSub"></p></div><button class="b2-standings-close" id="b2StandingsClose">×</button></header><nav class="b2-standings-tabs" id="b2StandingsTabs"></nav><div class="b2-standings-body" id="b2StandingsBody"></div></section>`;document.body.appendChild(o);o.addEventListener('click',e=>{if(e.target===o)o.classList.add('ui-hidden')});o.querySelector('#b2StandingsClose').onclick=()=>o.classList.add('ui-hidden');return o;}
  let b2StandingsTab='ALL';
  function b2TeamName(team){return typeof team==='string'?team:team?.name||team?.city||team?.englishName||team?.short||'—';}
  function b2RenderStandings(){const o=b2EnsureStandingsModal(),rows=b2StandingsRows(),hasRegions=rows.some(r=>r.region==='East'||r.region==='West');if(!hasRegions)b2StandingsTab='ALL';const tabs=[['ALL','总战绩'],...(hasRegions?[['East','东部战绩'],['West','西部战绩']]:[])];o.querySelector('#b2StandingsTitle').textContent=`${b2Year()} 赛季 · 联盟战绩`;o.querySelector('#b2StandingsSub').textContent=`已进行 ${Number(seasonState.played||0)} / ${Number(seasonState.total||0)} 场 · 点击年份可随时回来查看`;o.querySelector('#b2StandingsTabs').innerHTML=tabs.map(([k,l])=>`<button class="b2-standings-tab ${b2StandingsTab===k?'active':''}" data-b2-tab="${k}">${l}</button>`).join('');const shown=(b2StandingsTab==='ALL'?rows:rows.filter(r=>r.region===b2StandingsTab));const lp=shown.some(r=>Number(r.lp||0)!==Number(r.wins||0));o.querySelector('#b2StandingsBody').innerHTML=`<table class="b2-standings-table"><thead><tr><th>#</th><th>队伍</th><th>胜</th><th>负</th><th>净胜图</th>${lp?'<th>LP</th>':''}</tr></thead><tbody>${shown.map((r,i)=>`<tr class="${r.isUser?'user':''}"><td class="b2-rank">${i+1}</td><td><div class="b2-team-cell">${r.team?.logo?`<img src="${b2Esc(r.team.logo)}" onerror="this.style.display='none'">`:''}<div><b>${b2Esc(b2TeamName(r.team))}</b><small>${r.isUser?'你的队伍 · ':''}${r.region==='East'?'东部':r.region==='West'?'西部':'全联盟'}</small></div></div></td><td>${r.wins}</td><td>${r.losses}</td><td>${Number(r.mapDiff||0)>0?'+':''}${Number(r.mapDiff||0)}</td>${lp?`<td>${Number(r.lp??r.wins)}</td>`:''}</tr>`).join('')}</tbody></table>`;o.querySelectorAll('[data-b2-tab]').forEach(b=>b.onclick=()=>{b2StandingsTab=b.dataset.b2Tab;b2RenderStandings()});}
  function b2OpenStandings(){b2StandingsTab='ALL';b2RenderStandings();b2EnsureStandingsModal().classList.remove('ui-hidden');}
  function b2BindStandingsTrigger(){const chip=document.getElementById('seasonYearChip');if(!chip||chip.dataset.b2Standings)return;chip.dataset.b2Standings='1';chip.classList.add('b2-standings-trigger');chip.title='查看整个联盟战绩';chip.setAttribute('role','button');chip.setAttribute('tabindex','0');chip.addEventListener('click',b2OpenStandings);chip.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();b2OpenStandings();}});}
  window.__OWL_RUNTIME?.render?.register('renderSeason','b2-standings-trigger',b2BindStandingsTrigger);
  b2BindStandingsTrigger();

  /* 16 · 整季模拟性能：快速模式不再偷偷跑完整地图/选图/Ban内核 */
  const B2_oldChance=typeof getRegularSeasonWinChance==='function'?getRegularSeasonWinChance:null;let B2_wholeToken=0;const B2_rosterCache=new Map();const B2_heroFitCache=new WeakMap();
  function b2QuickRoster(team){const key=`${b2Year()}|${team?.short||team?.name}`;if(!B2_rosterCache.has(key))B2_rosterCache.set(key,createRoster(team,false));return B2_rosterCache.get(key);}
  function b2RosterHeroFit(roster){if(!roster||!roster.length||typeof v71HeroPool!=='function')return 80;let sub=B2_heroFitCache.get(roster);const stage=typeof v71StageNo==='function'?v71StageNo():1,key=`${b2Year()}|${stage}`;if(sub?.has(key))return sub.get(key);if(!sub){sub=new Map();B2_heroFitCache.set(roster,sub)}const vals=[];for(const p of roster){const pool=v71HeroPool(p).slice(0,4);if(!pool.length)continue;const best=Math.max(...pool.map(h=>Number(h.value||78)+(typeof v74MetaRaw==='function'?Number(v74MetaRaw(h,b2Year(),stage)||0)*1.1:0)));vals.push(best)}const v=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:80;sub.set(key,v);return v;}
  if(B2_oldChance)getRegularSeasonWinChance=function(ourRoster,theirRoster,careerBonus=0,venue='home'){if(!window.__OWL_B2_FAST_BATCH)return B2_oldChance.apply(this,arguments);const diff=teamDisplayPower(ourRoster)-teamDisplayPower(theirRoster)+Number(careerBonus||0)*.85,rank=Number(careerState.rank||10),teamContext=b2Clamp((11-rank)*.003,-.018,.018),rookie=Number(careerState.careerYears||1)===1?.012:0,venueSwing=venue==='home'?.02:-.02;let chance=b2Clamp(.56+diff*.022+teamContext+rookie+venueSwing,.28,.84);try{const hook=window.__OWL_V20_ALPHA1?.adjustRegularChance;if(typeof hook==='function')chance=hook(chance,{ourRoster,theirRoster,careerBonus,venue,index:Number(seasonState.played||0),opponent:seasonState.opponents?.[seasonState.played]||null});}catch(_){}const heroSwing=b2Clamp((b2RosterHeroFit(ourRoster)-b2RosterHeroFit(theirRoster))*.0038,-.035,.035);return b2Clamp(Number(chance)+heroSwing,.22,.87);};
  function b2FastRegularGame(){
    const idx=Number(seasonState.played||0),opp=seasonState.opponents?.[idx];if(!opp)return false;const our=careerState.starters||[],their=b2QuickRoster(opp),bonus=typeof currentCareerMatchBonus==='function'?currentCareerMatchBonus():0,venue=typeof regularVenueAt==='function'?regularVenueAt(idx):(seasonState.venues?.[idx]||'home'),chance=getRegularSeasonWinChance(our,their,bonus,venue),won=Math.random()<chance;seasonState.results[idx]=won?'win':'loss';seasonState.played=idx+1;if(won)seasonState.wins++;else seasonState.losses++;
    const status=careerState.userLineupStatus?.key||'starter',playChance=status==='bench'?.46:status==='competition'?.78:.97,plays=Math.random()<playChance;if(plays){const rating=typeof quickCareerRating==='function'?quickCareerRating(won,bonus):b2Clamp(6.8+(won?.55:-.12)+(Number(getMyOvr()==='--'?78:getMyOvr())-78)*.07+(Math.random()-.5)*1.0,4.8,9.8);seasonState.userRatings.push(rating);if(typeof updateCareerAfterMatch==='function')updateCareerAfterMatch(won,rating);try{if(typeof v74EnsureStageFocus==='function')v74EnsureStageFocus();if(typeof v74AbstractMatchPractice==='function')v74AbstractMatchPractice(won,rating);}catch(_){}}else{careerState.condition=b2Clamp(Number(careerState.condition||70)+.7,20,98);}
    if(typeof markSeasonEventDue==='function')markSeasonEventDue();try{if(typeof maybeAutoTrade==='function')maybeAutoTrade();}catch(_){}return true;
  }
  function b2WorldCupDue(){try{const r=window.__OWL_WORLD_CUP?.maybeMarkDue?.();return r&&!r.completed&&r.pendingStage?r:null}catch(_){return null}}
  function b2ResolveStage(){const st=Number(seasonState.stageBreakPending||0);if(!st)return;window.__OWL_V16_SEASON_BATCHING=true;try{if(typeof stageQualified==='function'&&stageQualified(st))simulateStagePlayoff(st);else skipStageBreak(st);}finally{window.__OWL_V16_SEASON_BATCHING=false}seasonState.stageBreakPending=null;seasonState.v71LastMajorSummary=null;seasonState.v769TournamentResultPending=null;}
  function b2PaintWholeSeasonPulse(){
    const played=Number(seasonState.played||0),total=Number(seasonState.total||0),wins=Number(seasonState.wins||0),losses=Number(seasonState.losses||0),results=seasonState.results||[];
    document.querySelectorAll('#seasonDots .season-dot').forEach((dot,index)=>{
      const result=results[index]||'';
      dot.classList.toggle('win',result==='win');dot.classList.toggle('loss',result==='loss');dot.classList.toggle('current',index===played&&played<total);
    });
    const stageNo=typeof v71StageNo==='function'?Number(v71StageNo()||1):0,rec=stageNo&&typeof stageRecord==='function'?stageRecord(stageNo):null;
    const groups=[...document.querySelectorAll('#seasonDots .stage-dot-group')],head=groups[stageNo-1]?.querySelector('.stage-dot-head'),stat=head?.querySelector('span,small');
    if(rec&&stat)stat.textContent=`${Number(rec.wins||0)}胜 ${Number(rec.losses||0)}负`;
    const progress=document.getElementById('seasonProgressCopy');
    if(progress){
      if(rec)progress.innerHTML=`Stage ${stageNo} · <strong>${Number(rec.wins||0)}胜 ${Number(rec.losses||0)}负</strong> · 全赛季 ${wins}胜 ${losses}负 · Major加分 ${Number(seasonState.majorBonusLP||0)}`;
      else progress.innerHTML=`${seasonState.simulating?'模拟中 · ':'赛季进行中 · '}<strong>${wins}胜 ${losses}负</strong>`;
    }
    const note=document.getElementById('seasonSimNote');if(note)note.textContent=`⏳ 正在逐场模拟：${wins}胜 ${losses}负`;
  }
  function b2StopWhole(msg=''){window.__OWL_RUNTIME?.simulation?.stopWhole?.(msg);}
  function b2OpenPendingEvent(){
    if(!seasonState.eventDue||seasonState.currentEvent)return false;
    window.__OWL_RUNTIME?.simulation?.pauseWhole?.();seasonState.resumeWholeAfterEvent=true;renderSeason();setTimeout(()=>openScheduledSeasonEvent(),50);return true;
  }
  function b2WholeSeason(){
    if(seasonState.b2WholeActive||seasonState.simulating||Number(seasonState.played)>=Number(seasonState.total))return;
    const wc=b2WorldCupDue();if(wc){window.__OWL_WORLD_CUP?.open?.();return;}
    if(b2OpenPendingEvent())return;
    seasonState.b2WholeActive=true;seasonState.simulating=true;window.__OWL_B2_FAST_BATCH=true;const token=++B2_wholeToken,delay=160;
    const tick=()=>{
      if(token!==B2_wholeToken||!seasonState.b2WholeActive)return;
      const before=Number(seasonState.played);let ok=false;
      window.__OWL_V16_SEASON_BATCHING=true;try{ok=b2FastRegularGame();}finally{window.__OWL_V16_SEASON_BATCHING=false;}
      if(!ok||Number(seasonState.played)<=before){b2StopWhole('模拟被当前流程节点暂停，请先处理当前节点。');return;}
      if(typeof markStageBreakIfNeeded==='function')markStageBreakIfNeeded();if(seasonState.stageBreakPending){const stage=Number(seasonState.stageBreakPending);b2ResolveStage();if(stage===2&&seasonState.v71AllStarPending){seasonState.b2WholeActive=false;seasonState.simulating=false;if(Number(careerState.seasonYear||0)>=2027&&typeof window.__OWL_V34_FUTURE?.allStar==='function'){window.__OWL_V34_FUTURE.allStar(true);}else{seasonState.v71ResumeWholeAfterAllStar=true;renderSeason();setTimeout(()=>typeof v71OpenAllStarWeekend==='function'&&v71OpenAllStarWeekend(),90);}return;}}
      if(careerState.v800Trade?.pending){b2StopWhole('🔄 模拟在交易节点暂停。');return;}
      const world=b2WorldCupDue();if(world){window.__OWL_RUNTIME?.simulation?.pauseWhole?.();renderSeason();setTimeout(()=>window.__OWL_WORLD_CUP?.open?.(),40);return;}
      if(b2OpenPendingEvent())return;
      try{window.__OWL_PUBLIC_BETA?.autosave?.('whole-season-match',120)}catch(_){}
      try{b2PaintWholeSeasonPulse();}catch(_){renderSeason();}
      if(Number(seasonState.played)>=Number(seasonState.total)){b2StopWhole(`✓ 常规赛与阶段赛事已完成：${seasonState.wins}胜${seasonState.losses}负。年终季后赛保留。`);return;}
      if(!seasonState.b2WholeActive)return;
      setTimeout(tick,delay);
    };
    renderSeason();setTimeout(tick,delay);
  }
  window.__OWL_V18_FULL_SEASON=b2WholeSeason;try{v35SimulateWholeSeason=b2WholeSeason}catch(_){}

  /* 17 · 世界杯事件：跨届去重 + 根据职业成绩 / 上届世界杯动态改文案 */
  const B2_WC_STAGE_EVENTS={conference:['club-country','shotcall','role-rival','meta','extra-scrim'],qualifier:['club-country','shotcall','role-rival','meta','extra-scrim','wrist'],group:['jetlag','shotcall','role-rival','media','meta','scrim','wrist','extra-scrim','food-poison'],knockout:['shotcall','media','scrim','wrist','food-poison']};
  function b2DiversifyWcEvent(rec){if(!rec?.pendingEvent)return false;rec.b2Diversified=rec.b2Diversified||{};const stage=rec.pendingEvent.stage,key=`${stage}|${rec.pendingEvent.id}`;if(rec.b2Diversified[key])return false;const prev=b2PrevWc(rec),prevIds=new Set((prev?.events||[]).filter(e=>e.kind==='random').map(e=>e.eventId)),used=new Set((rec.events||[]).filter(e=>e.kind==='random').map(e=>e.eventId));const candidates=(B2_WC_STAGE_EVENTS[stage]||[]).filter(id=>!used.has(id)&&!prevIds.has(id));if(prevIds.has(rec.pendingEvent.id)&&candidates.length){const pick=candidates[Math.floor(b2Hash01(`${rec.year}|${rec.representingCountry}|${stage}|b2-variety`)*candidates.length)];rec.pendingEvent.id=pick;rec.b2Diversified[`${stage}|${pick}`]=true;return true;}rec.b2Diversified[key]=true;return false;}
  function b2CareerWcContext(rec){const archive=(careerState.careerArchive||[]).filter(x=>Number(x.year)<=Number(rec.year)).sort((a,b)=>Number(b.year)-Number(a.year)),last=archive[0],prev=b2PrevWc(rec),lines=[];if(prev){if(/冠军/.test(String(prev.result||'')))lines.push('你以上届世界杯冠军成员的身份回归，外界默认目标已经不是“打得不错”，而是卫冕。');else if(/亚军|决赛/.test(String(prev.result||'')))lines.push('上届世界杯已经摸到决赛门口，本届每个失误都会被拿来和那次机会比较。');else if(prev.result)lines.push(`上届世界杯结果：${prev.result}。本届国家队会更在意你是否真正解决了上次暴露的问题。`);}if(last){const honors=(last.honors||[]).join('|');if(/总冠军/.test(honors))lines.push('你刚带着俱乐部冠军履历进入国家队，媒体和队友都会自然提高对你的期待。');else if(/MVP/.test(honors))lines.push('你刚打出MVP级俱乐部赛季，国家队不会再把你当普通轮换候选人看待。');else if(Number(last.rating||0)>=8)lines.push(`你带着一个高水平俱乐部赛季进入国家队，近期比赛状态本身就是最硬的简历。`);}if(rec.b2CohesionNotes?.length)lines.push(`磨合基础：${rec.b2CohesionNotes.join('；')}。`);return lines.slice(0,2);}
  function b2DecorateWorldCup(){const y=b2Year(),rec=b2WcRoot().seasons?.[y];if(!rec)return;b2SeedWcPre(rec);b2ApplyWcRosterChemistry(rec);const body=document.getElementById('vwcBody');if(!body)return;const lines=b2CareerWcContext(rec),sig=lines.join('|'),existing=body.querySelector('.b2-wc-context');if(!lines.length){existing?.remove();return;}if(existing){if(existing.dataset.sig!==sig){existing.dataset.sig=sig;existing.innerHTML=`<b>本届背景</b><br>${lines.map(b2Esc).join('<br>')}`;}return;}const target=body.querySelector('.vwc-event p')||body.querySelector('.vwc-card p')||body.firstElementChild;if(target){const box=document.createElement('div');box.className='b2-wc-context';box.dataset.sig=sig;box.innerHTML=`<b>本届背景</b><br>${lines.map(b2Esc).join('<br>')}`;target.insertAdjacentElement('afterend',box);}}
  const wcApi=window.__OWL_WORLD_CUP;if(wcApi){const oldEnsure=wcApi.ensure?.bind(wcApi),oldOpen=wcApi.open?.bind(wcApi);if(oldEnsure)wcApi.ensure=function(y){const r=oldEnsure(y);b2SeedWcPre(r);b2ApplyWcRosterChemistry(r);return r;};if(oldOpen)wcApi.open=function(){const r=wcApi.ensure?.();b2SeedWcPre(r);b2ApplyWcRosterChemistry(r);const out=oldOpen();setTimeout(()=>{const cur=wcApi.ensure?.();if(b2DiversifyWcEvent(cur)){oldOpen();setTimeout(b2DecorateWorldCup,0);}else b2DecorateWorldCup();},0);return out;};}
  document.addEventListener('click',e=>{if(e.target?.closest?.('[data-vwc-select]'))setTimeout(()=>{const r=window.__OWL_WORLD_CUP?.ensure?.();b2ApplyWcRosterChemistry(r);window.__OWL_WORLD_CUP?.open?.();},0);});

  /* 18 · 退役生涯记录倒序，最近赛季在最上面 */
  function b2ReverseChildren(el){if(!el)return;const nodes=[...el.children];if(nodes.length<2)return;const year=n=>{const m=String(n?.textContent||'').match(/(?:19|20)\d{2}/);return m?Number(m[0]):null;},first=year(nodes[0]),last=year(nodes[nodes.length-1]);if(first!=null&&last!=null&&first<last)nodes.reverse().forEach(n=>el.appendChild(n));}
  function b2DecorateRetirement(){const tl=document.getElementById('retirementTimeline');if(tl){b2ReverseChildren(tl);if(!tl.previousElementSibling?.classList?.contains('retirement-timeline-b2-note'))tl.insertAdjacentHTML('beforebegin','<div class="retirement-timeline-b2-note">按最近赛季 → 生涯早期倒序展示</div>');}b2ReverseChildren(document.getElementById('retiredResumeSeasons'));}
  window.__OWL_RUNTIME?.render?.register('renderRetirementScreen','b2-retirement',b2DecorateRetirement);
  window.__OWL_RUNTIME?.render?.register('renderRetiredCareerResume','b2-retirement-resume',b2DecorateRetirement);

  let B2_wcRefreshQueued=false;const B2_observer=new MutationObserver(()=>{b2CleanAllStarCopy();const rec=b2WcRoot().seasons?.[b2Year()];if(rec&&b2DiversifyWcEvent(rec)&&!B2_wcRefreshQueued){B2_wcRefreshQueued=true;setTimeout(()=>{B2_wcRefreshQueued=false;window.__OWL_WORLD_CUP?.open?.();},0);return;}b2DecorateWorldCup();});const eventRoot=document.getElementById('seasonEventContent');if(eventRoot)B2_observer.observe(eventRoot,{subtree:true,childList:true,characterData:true});const wcBody=document.getElementById('vwcBody');if(wcBody)B2_observer.observe(wcBody,{subtree:true,childList:true,characterData:false});
  window.__OWL_ALPHA1_BATCH2={patch:B2_PATCH,openStandings:b2OpenStandings,mapPool:b2TournamentMapPool,mapRules:'2025+: Control first, then loser picks an unused mode and a map from that mode pool',fastWholeSeason:b2WholeSeason,worldCupChemistry:b2ApplyWcRosterChemistry,diagnostics:()=>({year:b2Year(),played:seasonState.played,total:seasonState.total,mapPool:b2TournamentMapPool().map(m=>({name:m.name,type:m.type})),eligibleModes:b2OwcsEligibleModes(),wc:b2WcRoot().seasons?.[b2Year()]||null})};
})();
