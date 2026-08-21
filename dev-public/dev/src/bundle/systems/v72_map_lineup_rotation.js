/* ===== BUNDLE MODULE: systems/v72_map_lineup_rotation.js ===== */
/* ==========================================================================
   V7.2 · 地图阵容轮换
   - 2025+: 地图先公开 → 教练按地图/英雄池锁定5人 → Hero Ban
   - 玩家可能真实被换下，也可能从替补席被换上
   - 阵容锁定后Ban只针对本图真实上场5人
   - 未上场地图采用观战结算，不伪造玩家操作与评分
   ========================================================================== */

  function v72ClonePlayer(p){return {...p,attrs:{...(p.attrs||{})}};}
  function v72PlayerKey(p){return p?.id||`${p?.name||'unknown'}|${p?.role||''}`;}
  function v72UniquePlayers(list){const seen=new Set();return (list||[]).filter(Boolean).filter(p=>{const k=v72PlayerKey(p);if(seen.has(k))return false;seen.add(k);return true;});}
  function v72RoleSlots(group){return group==='tank'?1:2;}
  function v72RoleZh(group){return group==='tank'?'坦克':group==='damage'?'输出':'支援';}

  function v72FallbackPlayer(team,role,index,used){
    const talent=clamp(Math.round((team?.strength||80)+v71Hash01(`${team?.short}|${role}|${index}|v72`)*10-7),70,91);
    const attrs=generateMatchAttributes(role,talent);
    let name=pick(NAMES),guard=0;while(used.has(name)&&guard++<30)name=pick(NAMES);used.add(name);
    return {id:`v72-${team?.short||'AI'}-${role}-${index}-${Math.round(v71Hash01(name+index)*1e7)}`,name,role,attrs,overall:Math.round(Object.values(attrs).reduce((a,b)=>a+b,0)/ATTRS.length),color:team?.color,isUser:false};
  }

  function v72BuildFullSquad(team,starterRoster,isHome=false){
    let squad=[];
    if(isHome){
      squad=v72UniquePlayers([...(careerState.starters||[]),...(careerState.bench||[])]).map(v72ClonePlayer);
      const currentUser=(starterRoster||[]).find(p=>p.isUser),idx=squad.findIndex(p=>p.isUser);
      if(currentUser&&idx>=0)squad[idx]=v72ClonePlayer(currentUser);
      else if(idx>=0)applyCareerMatchModifiers([squad[idx]]);
    }else{
      squad=v72UniquePlayers(starterRoster||[]).map(v72ClonePlayer);
      const used=new Set(squad.map(p=>p.name));
      try{
        (historicalRosterEntries(team)||[]).sort((a,b)=>Number(b[2]||0)-Number(a[2]||0)).forEach((entry,i)=>{
          if(squad.length>=9||used.has(entry[0]))return;
          const hp=historicalPlayer(entry,team,70+i);squad.push(v72ClonePlayer(hp));used.add(entry[0]);
        });
      }catch(e){}
      const roleCycle=['坦克','长枪输出','弹道输出','输出支援','战术支援'];
      let guard=0;while(squad.length<9&&guard<20){const role=roleCycle[guard%roleCycle.length];squad.push(v72FallbackPlayer(team,role,guard,used));guard++;}
    }
    // 保底：每个大职责至少够首发人数。否则随机板凳全挤到一个职责时，教练只能对着空椅子排阵。
    const used=new Set(squad.map(p=>p.name));
    [['tank',1,'坦克'],['damage',2,'长枪输出'],['support',2,'输出支援']].forEach(([g,need,role])=>{
      let n=squad.filter(p=>v71RoleGroup(p.role)===g).length;
      while(n<need){squad.push(v72FallbackPlayer(team,role,90+squad.length,used));n++;}
    });
    return v72UniquePlayers(squad).slice(0,11);
  }

  function v72EnsureMatchSquads(force=false){
    if(!v71HasStrategicDraft())return;
    const homeKey=matchState.homeTeam?.name,awayKey=matchState.awayTeam?.name;
    if(force||!matchState.homeSquad||matchState.v72HomeSquadTeam!==homeKey){matchState.homeSquad=v72BuildFullSquad(matchState.homeTeam,matchState.homeRoster,true);matchState.v72HomeSquadTeam=homeKey;}
    if(force||!matchState.awaySquad||matchState.v72AwaySquadTeam!==awayKey){matchState.awaySquad=v72BuildFullSquad(matchState.awayTeam,matchState.awayRoster,false);matchState.v72AwaySquadTeam=awayKey;}
    matchState.v72LineupHistory=matchState.v72LineupHistory||[];
    matchState.v72PlayerMaps=matchState.v72PlayerMaps||[];
  }

  function v72RecentUserForm(){const rows=seasonState.userRatings||[];if(!rows.length)return 0;const take=rows.slice(-5);return take.reduce((a,b)=>a+b,0)/take.length-7;}
  function v72DnpStreak(){
    const year=Number(careerState.seasonYear||v71Year()),rows=(careerState.v75StoryHistory||[]).filter(x=>Number(x.year)===year);
    let streak=0;for(const r of [...rows].reverse()){if(Number(r.mapsPlayed||0)===0)streak++;else break;}return streak;
  }
  function v72PromiseLevel(){
    const p=String(careerState.contract?.rolePromise||careerState.userLineupStatus?.label||'');
    if(/核心首发/.test(p))return 3;
    if(/稳定首发/.test(p))return 2;
    if(/首发竞争/.test(p))return 1;
    // 1.9 RC3：轮换合同不再等同“无承诺”。0.5 只提供有限保护，仍明显弱于首发竞争。
    if(/主要轮换|轮换选手/.test(p))return .5;
    return 0;
  }
  function v72PromiseTargetShare(){
    const p=String(careerState.contract?.rolePromise||careerState.userLineupStatus?.label||'');
    if(/核心首发/.test(p))return .86;
    if(/稳定首发/.test(p))return .76;
    if(/首发竞争/.test(p))return .55;
    if(/主要轮换|轮换选手/.test(p))return .38;
    if(/深度轮换/.test(p))return .20;
    return null;
  }
  function v72UserMapShare(){
    const year=Number(careerState.seasonYear||v71Year()),rows=(careerState.v75StoryHistory||[]).filter(x=>Number(x.year)===year);
    const total=rows.reduce((s,r)=>s+Math.max(0,Number(r.totalMaps||0)),0),played=rows.reduce((s,r)=>s+Math.max(0,Number(r.mapsPlayed||0)),0);
    return {rows:rows.length,total,played,share:total>0?played/total:null};
  }
  function v72PromiseCatchupBonus(){
    const target=v72PromiseTargetShare(),m=v72UserMapShare(),promise=v72PromiseLevel();
    if(target==null||m.share==null)return 0;
    // 1.9 RC3：只对“首发竞争”提前加强纠偏；稳定首发/轮换/深度轮换继续沿用旧强度，避免全板凳一起被抬高。
    const earlyCompetition=promise===1;
    const minMaps=earlyCompetition?8:12,cap=earlyCompetition?6:4.5,scale=earlyCompetition?12:11;
    if(m.total<minMaps)return 0;
    const deficit=target-m.share;
    return Math.max(0,Math.min(cap,deficit*scale));
  }
  function v72LineupScore(player,map,side,previousIds=new Set()){
    const best=v71BestHeroFor(player,map,[]),breadth=v71HeroPoolBreadth(player),overall=Number(player.overall||78);
    let score=overall*.40+Number(best?.mapScore||74)*.48+Math.min(10,breadth)*.24;
    if(previousIds.has(v72PlayerKey(player)))score+=1.15; // 连续阵容略有惯性，避免每张图像公交换乘。
    if(player.isUser){
      const key=careerState.userLineupStatus?.key||'competition',promise=v72PromiseLevel(),age=Number(careerState.age||22),years=Number(careerState.careerYears||1),dnp=v72DnpStreak();
      // 1.6：定位承诺必须真的影响上场，而不是报价单上写“首发”进队以后继续守饮水机。
      score+=key==='starter'?3.0:key==='bench'?-0.30:1.10;
      score+=promise===3?2.25:promise===2?1.55:promise===1?.85:promise===.5?.35:0;
      score+=(Number(careerState.coachTrust||60)-60)*.055;
      score+=(Number(careerState.condition||72)-72)*.030;
      score+=v72RecentUserForm()*1.10;
      // 青年培养价值：最需要比赛经验的年龄段，教练更愿意给真实轮换机会。
      score+=age<=18?2.10:age<=20?1.45:age<=22?.70:0;
      if(years<=2)score+=1.00;
      // 连续DNP后的轮换补偿。它不会把70分新人硬顶掉95分超巨，但会避免五六场完全不给机会。
      score+=Math.min(5,dnp)*1.35;
      score+=v72PromiseCatchupBonus();
    }else score+=(v71Hash01(`${player.name}|${map?.id}|${v71Year()}|lineup`)-.5)*.7;
    return {player,best,breadth,score};
  }

  function v72SelectLineup(side,map,commit=false){
    v72EnsureMatchSquads();
    const squad=side==='home'?matchState.homeSquad:matchState.awaySquad;
    const current=side==='home'?matchState.homeRoster:matchState.awayRoster;
    const previousIds=new Set((current||[]).map(v72PlayerKey));
    const ranked={};
    ['tank','damage','support'].forEach(group=>{
      ranked[group]=(squad||[]).filter(p=>v71RoleGroup(p.role)===group).map(p=>v72LineupScore(p,map,side,previousIds)).sort((a,b)=>b.score-a.score);
    });
    let chosenRows=[...ranked.tank.slice(0,1),...ranked.damage.slice(0,2),...ranked.support.slice(0,2)];
    const user=(squad||[]).find(p=>p.isUser),userGroup=user?v71RoleGroup(user.role):null,userRow=userGroup?ranked[userGroup].find(x=>x.player.isUser):null;
    let cutoff=userGroup?ranked[userGroup][v72RoleSlots(userGroup)-1]:null,forcedDevelopment=false;
    let chosenIds=new Set(chosenRows.map(x=>v72PlayerKey(x.player)));
    if(side==='home'&&user&&userRow&&!chosenIds.has(v72PlayerKey(user))){
      const age=Number(careerState.age||22),years=Number(careerState.careerYears||1),dnp=v72DnpStreak(),promise=v72PromiseLevel(),gap=cutoff?userRow.score-cutoff.score:0;
      const protectedYouth=age<=21||years<=2,promiseStarter=promise>=2;
      const competitionProtection=promise===1&&dnp>=2;
      const rotationProtection=promise===.5&&dnp>=2;
      let threshold=promiseStarter?-13:age<=19?-11:protectedYouth?-8:-5;
      // 首发竞争连续两场DNP后放宽到 -8；轮换选手连续两场DNP后放宽到 -7。
      // 仍保留硬实力门槛，避免70分选手仅靠合同挤掉95分核心。
      if(competitionProtection)threshold=Math.min(threshold,-8);
      if(rotationProtection)threshold=Math.min(threshold,-7);
      if(dnp>=1&&(protectedYouth||promise>=1||rotationProtection)&&gap>=threshold){
        const groupRows=chosenRows.filter(x=>v71RoleGroup(x.player.role)===userGroup).sort((a,b)=>a.score-b.score),replace=groupRows[0];
        if(replace){chosenRows=chosenRows.filter(x=>x!==replace);chosenRows.push(userRow);forcedDevelopment=true;chosenIds=new Set(chosenRows.map(x=>v72PlayerKey(x.player)));}
      }
    }
    const chosen=chosenRows.map(x=>x.player),oldIds=new Set((current||[]).map(v72PlayerKey));
    const ins=chosen.filter(p=>!oldIds.has(v72PlayerKey(p))),outs=(current||[]).filter(p=>!chosenIds.has(v72PlayerKey(p)));
    const userRank=userGroup?ranked[userGroup].findIndex(x=>x.player.isUser)+1:null;
    cutoff=userGroup?ranked[userGroup][v72RoleSlots(userGroup)-1]:null;
    const selected=!!user&&chosenIds.has(v72PlayerKey(user));
    let userReason='';
    if(user){
      const gap=cutoff&&userRow?userRow.score-cutoff.score:0,best=userRow?.best;
      if(selected){
        userReason=forcedDevelopment?`你获得培养轮换机会；连续DNP后教练组主动给年轻/承诺选手实战时间，首选 ${best?.name||'—'}`:oldIds.has(v72PlayerKey(user))?`你继续首发；本图首选 ${best?.name||'—'}（${best?.value||'—'}）`:`你被换上；本图适配进入${v72RoleZh(userGroup)}前${v72RoleSlots(userGroup)}，首选 ${best?.name||'—'}`;
      }else userReason=`你本图替补；同职责竞争线落后 ${Math.abs(gap).toFixed(1)}，首选 ${best?.name||'—'}（${best?.value||'—'}）`;
    }
    const team=side==='home'?matchState.homeTeam:matchState.awayTeam;
    const swapText=ins.length?`换人 ↑ ${ins.map(p=>p.name).join(' / ')}　↓ ${outs.map(p=>p.name).join(' / ')}`:'保持上一图阵容';
    const result={side,team,chosen,ranked,ins,outs,selected,userReason,swapText,userRank,forcedDevelopment,dnpStreak:side==='home'?v72DnpStreak():0};
    if(commit){if(side==='home')matchState.homeRoster=chosen;else matchState.awayRoster=chosen;}
    return result;
  }

  function v72LineupSummary(decision,map){
    const team=decision.team?.name||'队伍';
    const user=decision.side==='home'&&matchState.homeSquad?.some(p=>p.isUser)?` · ${decision.userReason}`:'';
    return `${team}：${decision.swapText}${user}`;
  }

  // 真正覆盖V7.1的“只写一句阵容确认”。现在这一步会实际改matchState的5人名单。
  v71ConfirmRosters=function(){
    const map=currentMatchMap();if(!map)return;
    v72EnsureMatchSquads();
    const home=v72SelectLineup('home',map,true),away=v72SelectLineup('away',map,true);
    matchState.v72LastLineup={home,away};
    matchState.lineupNotes={home:v72LineupSummary(home,map),away:v72LineupSummary(away,map)};
    const user=matchState.homeSquad?.find(p=>p.isUser),played=!!matchState.homeRoster.find(p=>p.isUser);
    if(user)matchState.v72PlayerMaps.push({mapIndex:matchState.mapIndex,map:map.name,played,best:v71BestHeroFor(user,map,[])?.name||'—',reason:home.userReason});
    matchState.v72LineupHistory.push({mapIndex:matchState.mapIndex,map:map.name,home:home.chosen.map(p=>p.name),away:away.chosen.map(p=>p.name),homeSwap:home.swapText,awaySwap:away.swapText});
    matchState.pregamePhase='ban';
    matchState.logs.push({map:`M${matchState.mapIndex+1}`,side:'event',text:`阵容锁定：${matchState.lineupNotes.home}；${matchState.lineupNotes.away}。现在对手已经看见真正上场的5个人，进入Hero Ban。`});
    renderMatch();
  };

  // 每次打开正式比赛都建立完整9人左右的一线阵容池；系列赛内保持同一批人。
  const _v72OpenSeasonBase=openNextSeasonMatch;
  openNextSeasonMatch=function(){
    _v72OpenSeasonBase();
    if(v71HasStrategicDraft()&&matchState.context==='regular'&&seasonState.pendingManualIndex!=null&&matchState.homeTeam&&matchState.awayTeam){v72EnsureMatchSquads(true);renderMatch();}
  };
  const _v72OpenPlayoffBase=openNextPlayoffMatch;
  openNextPlayoffMatch=function(mode='quick'){
    _v72OpenPlayoffBase(mode);
    if(mode==='detail'&&v71HasStrategicDraft()&&matchState.context==='playoff'&&matchState.homeTeam&&matchState.awayTeam){v72EnsureMatchSquads(true);renderMatch();}
  };

  function v72UserRatingValues(){return matchState.ratings?.home?.['career-player']||[];}
  function v72UserMapsPlayed(){return v72UserRatingValues().length;}

  function v72SpectatorMap(){
    const map=currentMatchMap();if(!map)return null;
    const tactics=matchState.currentTactics||{home:chooseTactic(matchState.homeRoster,map),away:chooseTactic(matchState.awayRoster,map)};
    const homeData=teamMapPower(matchState.homeRoster,map,tactics.home,tactics.away,true),awayData=teamMapPower(matchState.awayRoster,map,tactics.away,tactics.home,false);
    let homeFights=0,awayFights=0,momentum=0;const logs=[{map:`M${matchState.mapIndex+1}`,side:'event',text:`${map.name} 开始。你本图未进入首发，比赛切换为观战结算。`}];
    for(let i=1;i<=map.fights;i++){
      const diff=(homeData.power-awayData.power)+momentum+randomCentered(3.0),homeWin=Math.random()<mapFightWinProbability(diff);
      if(homeWin){homeFights++;momentum=clamp(momentum+.55,-2.5,2.5);}else{awayFights++;momentum=clamp(momentum-.55,-2.5,2.5);}
      if(i===Math.ceil(map.fights/2))logs.push({map:`M${matchState.mapIndex+1}·中段`,side:homeWin?'home':'away',text:homeWin?'我方轮换阵容在中段抢到节奏。':'对方利用阵容适配取得中段主动。'});
    }
    if(homeFights===awayFights){if(homeData.power-awayData.power+randomCentered(4)>=0)homeFights++;else awayFights++;}
    const winner=homeFights>awayFights?'home':'away';
    applyMapRatings('home',matchState.homeRoster,homeData.individual,winner==='home',null);applyMapRatings('away',matchState.awayRoster,awayData.individual,winner==='away',null);
    logs.push({map:`M${matchState.mapIndex+1}`,side:winner,text:`地图结束，${winner==='home'?matchState.homeTeam.name:matchState.awayTeam.name} 以 ${homeFights}:${awayFights} 赢下 ${map.name}。`});
    return {mapName:map.name,winner,homeFights,awayFights,userRating:null,highlight:'本图未登场',logs,decisions:0,dnp:true};
  }

  const _v72SimMapBase=simulateMap;
  simulateMap=function(){
    if(!v71HasStrategicDraft())return _v72SimMapBase();
    v71AutoResolvePregame();
    if(matchState.homeRoster.some(p=>p.isUser))return _v72SimMapBase();
    return v72SpectatorMap();
  };

  const _v72StartInteractiveBase=startInteractiveMap;
  startInteractiveMap=function(){
    if(!v71HasStrategicDraft())return _v72StartInteractiveBase();
    if(matchState.simulating||matchState.finished||matchState.mapSession)return;
    v71AutoResolvePregame();
    if(matchState.homeRoster.some(p=>p.isUser))return _v72StartInteractiveBase();
    const result=v72SpectatorMap();if(!result)return;
    matchState.results.push(result);if(result.winner==='home')matchState.homeScore++;else matchState.awayScore++;result.logs.forEach(l=>matchState.logs.push(l));
    if(matchState.homeScore>=matchState.targetWins||matchState.awayScore>=matchState.targetWins)matchState.finished=true;else advanceSeriesMapAfterResult(result.winner);
    renderMatch();scrollLiveToEnd();
  };

  // V7.1的完整系列赛直接调用旧simulateMap，会在玩家替补时寻找不存在的主角。这里改为走当前动态simulateMap。
  const _v72FullSeriesLegacy=simulateFullSeries;
  simulateFullSeries=function(){
    if(!v71HasStrategicDraft())return _v72FullSeriesLegacy();
    if(matchState.simulating||matchState.finished||matchState.mapSession)return;matchState.simulating=true;
    while(!matchState.finished){
      v71AutoResolvePregame();const result=simulateMap();if(!result)break;matchState.results.push(result);
      if(result.winner==='home')matchState.homeScore++;else matchState.awayScore++;result.logs.forEach(l=>matchState.logs.push(l));
      if(matchState.homeScore>=matchState.targetWins||matchState.awayScore>=matchState.targetWins)matchState.finished=true;else advanceSeriesMapAfterResult(result.winner);
    }
    matchState.simulating=false;renderMatch();
  };

  // 阵容卡只显示本图5人；若玩家本图替补，明确挂一张替补提示，别让人怀疑自己被网页吞了。
  const _v72RenderRostersBase=renderRosters;
  renderRosters=function(){
    _v72RenderRostersBase();if(!v71HasStrategicDraft())return;
    v72EnsureMatchSquads();
    const box=document.getElementById('homeRoster'),user=matchState.homeSquad?.find(p=>p.isUser);
    if(box&&user&&!matchState.homeRoster.some(p=>p.isUser)){
      const best=currentMatchMap()?v71BestHeroFor(user,currentMatchMap(),[]):null,div=document.createElement('div');div.className='v72-bench-card';
      div.innerHTML=`<span>↪ 本图替补</span><strong>${user.name}</strong><small>${user.role} · ${best?`首选 ${best.name} ${best.value}`:'等待地图'}</small>`;box.appendChild(div);
    }
  };

  // 系列赛结束评分要包含曾经上过、但最后一图被换下的人。
  const _v72RenderRatingsBase=renderRatings;
  renderRatings=function(){
    if(!v71HasStrategicDraft()||!matchState.finished)return _v72RenderRatingsBase();
    const panel=document.getElementById('ratingsPanel');if(!panel)return;panel.classList.remove('hidden');v72EnsureMatchSquads();
    const collect=(side,squad,team)=>v72UniquePlayers([...(squad||[]),...(side==='home'?matchState.homeRoster:matchState.awayRoster)]).map(p=>({...p,side:team.name,values:matchState.ratings[side][p.id]||[]})).filter(p=>p.values.length).map(p=>({...p,avg:p.values.reduce((a,b)=>a+b,0)/p.values.length}));
    const all=[...collect('home',matchState.homeSquad,matchState.homeTeam),...collect('away',matchState.awaySquad,matchState.awayTeam)].sort((a,b)=>b.avg-a.avg),mvp=all[0]?.id;
    document.getElementById('ratingsTable').innerHTML=`<table class="rating-table"><thead><tr><th>排名</th><th>选手</th><th>队伍</th><th>位置</th><th>地图</th><th style="text-align:right">评分</th></tr></thead><tbody>${all.map((p,i)=>`<tr><td>${i+1}</td><td class="${p.id===mvp?'mvp':''}"><strong>${p.name}${p.isUser?'（你）':''}</strong>${p.id===mvp?' · MVP':''}</td><td>${p.side}</td><td>${p.role}</td><td>${p.values.length}</td><td class="num ${p.id===mvp?'mvp':''}">${p.avg.toFixed(1)}</td></tr>`).join('')}</tbody></table>`;
  };

  // 完赛卡也不能再假设玩家最后一张地图一定在场。
  const _v72RenderMapControlBase=renderMapControl;
  renderMapControl=function(){
    if(v71HasStrategicDraft()&&matchState.finished){
      const area=document.getElementById('mapControlArea'),won=matchState.homeScore>matchState.awayScore,vals=v72UserRatingValues(),maps=vals.length,avg=maps?(vals.reduce((a,b)=>a+b,0)/maps).toFixed(1):'—';
      area.innerHTML=`<div class="series-finish"><div class="series-finish-icon">${won?'🏆':'📋'}</div><h3>${won?'系列赛取胜':'系列赛失利'}</h3><p>系列赛 ${matchState.homeScore}:${matchState.awayScore} · ${maps?`你出场 ${maps} 张地图，平均评分 ${avg}`:'你本场系列赛未获得出场机会'}。</p><div style="display:flex;gap:9px;justify-content:center;flex-wrap:wrap;margin-top:13px">${matchState.context==='regular'?'<button class="primary-btn" id="returnSeasonBtn">返回常规赛</button>':matchState.context==='playoff'?'<button class="primary-btn" id="returnPlayoffBtn">返回季后赛</button>':'<button class="primary-btn" id="playAgainBtn">再模拟一场</button>'}</div></div>`;
      document.getElementById('returnSeasonBtn')?.addEventListener('click',()=>{recordManualSeasonMatch();returnToSeasonAfterMatch();});
      document.getElementById('returnPlayoffBtn')?.addEventListener('click',()=>{recordPlayoffMatch();renderPlayoffs();showScreen('playoff');});
      document.getElementById('playAgainBtn')?.addEventListener('click',()=>setupMatch(true));return;
    }
    _v72RenderMapControlBase();
    if(!v71HasStrategicDraft()||matchState.finished)return;
    const area=document.getElementById('mapControlArea'),map=currentMatchMap();if(!area||!map)return;
    if(matchState.pregamePhase==='roster'){
      v72EnsureMatchSquads();const preview=v72SelectLineup('home',map,false),user=matchState.homeSquad?.find(p=>p.isUser),row=user?preview.ranked[v71RoleGroup(user.role)].find(x=>x.player.isUser):null;
      const hint=document.createElement('div');hint.className=`v72-lineup-hint ${preview.selected?'in':'out'}`;hint.innerHTML=`<span>👥 教练组本图倾向</span><strong>${preview.selected?'预计首发':'存在替补风险'}</strong><small>${preview.userReason||'阵容确认后公布最终5人'}</small>`;
      area.querySelector('.v71-pregame')?.prepend(hint);
    }
    if(matchState.pregamePhase==='ready'&&!matchState.homeRoster.some(p=>p.isUser)){
      const btn=area.querySelector('#simMapBtn');if(btn&&/开始|地图|团战/.test(btn.textContent||''))btn.textContent='👀 观战结算本图';
    }
  };

  // 记录常规赛：只有真正上过图才产生个人评分。DNP不再凭队伍胜负硬造一个7.2。
  const _v72RecordSeasonBase=recordManualSeasonMatch;
  recordManualSeasonMatch=function(){
    if(!v71HasStrategicDraft())return _v72RecordSeasonBase();
    if(seasonState.pendingManualIndex==null||seasonState.manualRecorded||!matchState.finished)return;
    const won=matchState.homeScore>matchState.awayScore,idx=seasonState.pendingManualIndex,vals=v72UserRatingValues();
    seasonState.results[idx]=won?'win':'loss';seasonState.played++;if(won)seasonState.wins++;else seasonState.losses++;
    if(vals.length){const baseAvg=vals.reduce((a,b)=>a+b,0)/vals.length,avg=clamp(baseAvg+careerState.nextRatingBonus,4,10);seasonState.userRatings.push(avg);const decisions=matchState.results.reduce((s,r)=>s+(r.decisions||0),0);seasonState.decisionTotal+=decisions;seasonState.decisionSuccess+=Math.round(decisions*clamp((avg-4.5)/5,.25,.9));updateCareerAfterMatch(won,avg);}
    else{seasonState.userDNP=(seasonState.userDNP||0)+1;careerState.condition=clamp(careerState.condition+1,0,100);if(careerState.injuryGames>0){careerState.injuryGames--;if(careerState.injuryGames<=0){careerState.injuryGames=0;careerState.injuryPenalty=0;}}if(careerState.illnessGames>0){careerState.illnessGames--;if(careerState.illnessGames<=0){careerState.illnessGames=0;careerState.illnessPenalty=0;}}consumeCareerMatchModifiers();}
    seasonState.manualRecorded=true;seasonState.pendingManualIndex=null;markSeasonEventDue();renderSeason();
  };

  const _v72RecordPlayoffBase=recordPlayoffMatch;
  recordPlayoffMatch=function(){
    if(!v71HasStrategicDraft())return _v72RecordPlayoffBase();
    if(!playoffState.pendingMatchId||playoffState.manualRecorded||!matchState.finished)return;const match=getBracketMatch(playoffState.pendingMatchId);if(!match)return;
    const won=matchState.homeScore>matchState.awayScore,vals=v72UserRatingValues(),avg=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:5.5;
    setPlayerBracketResult(match,won,matchState.homeScore,matchState.awayScore,avg,{dnp:!vals.length,mapsPlayed:vals.length});renderPlayoffs();
  };

  // 诊断：快速确认这一刀不是“UI说换人，底层还是原5人”。
  window.__OWL_V72_DIAGNOSTICS=()=>{
    const map=currentMatchMap(),home=map&&v71HasStrategicDraft()?v72SelectLineup('home',map,false):null;
    return {version:'7.2',year:v71Year(),strategicDraft:v71HasStrategicDraft(),map:map?.name||null,homeSquad:matchState.homeSquad?.length||0,awaySquad:matchState.awaySquad?.length||0,currentHome:(matchState.homeRoster||[]).map(p=>p.name),previewHome:home?.chosen?.map(p=>p.name)||[],userProjected:home?.selected??null,userMapsPlayed:v72UserMapsPlayed(),promiseLevel:v72PromiseLevel(),promiseTarget:v72PromiseTargetShare(),mapShare:v72UserMapShare(),promiseCatchup:v72PromiseCatchupBonus()};
  };

  if(!document.getElementById('v72LineupStyle')){const st=document.createElement('style');st.id='v72LineupStyle';st.textContent=`.v72-bench-card{grid-column:1/-1;display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:center;margin-top:5px;padding:8px 10px;border:1px dashed var(--line);border-radius:11px;background:rgba(0,0,0,.025);font-size:10px}.v72-bench-card span{color:var(--muted)}.v72-bench-card strong{color:var(--ink)}.v72-bench-card small{color:var(--muted);text-align:right}.v72-lineup-hint{display:grid;grid-template-columns:1fr auto;gap:3px 10px;margin-bottom:12px;padding:10px 12px;border-radius:12px;border:1px solid var(--line);background:rgba(255,255,255,.5)}.v72-lineup-hint span{font-size:10px;color:var(--muted)}.v72-lineup-hint strong{font-size:12px}.v72-lineup-hint small{grid-column:1/-1;color:var(--muted)}.v72-lineup-hint.in strong{color:#25875f}.v72-lineup-hint.out strong{color:#c26a36}html[data-theme="dark"] .v72-bench-card,html[data-theme="dark"] .v72-lineup-hint{background:rgba(255,255,255,.045)}@media(max-width:720px){.v72-bench-card{grid-template-columns:1fr}.v72-bench-card small{text-align:left}}`;document.head.appendChild(st);}

