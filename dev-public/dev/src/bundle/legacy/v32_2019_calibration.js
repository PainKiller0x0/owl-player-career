/* ===== BUNDLE MODULE: legacy/v32_2019_calibration.js ===== */
/* ==========================================================================
   MODULE: legacy/v32_2019_calibration.js
   Compatibility layer: Chinese names, divisions, roster/season calibration
   Migrated from V6.2 lines 9046-9319; execution order is defined by manifest.json.
   ========================================================================== */
    /* ==================== V3.2 · 2019 真实联盟校准 ==================== */

    const V32_TEAM_META = {
      'ATL':{enName:'Atlanta Reign',name:'亚特兰大君临'},
      'BOS':{enName:'Boston Uprising',name:'波士顿崛起'},
      'CDH':{enName:'Chengdu Hunters',name:'成都猎人'},
      'DAL':{enName:'Dallas Fuel',name:'达拉斯燃料'},
      'FLA':{enName:'Florida Mayhem',name:'佛罗里达狂欢'},
      'GZC':{enName:'Guangzhou Charge',name:'广州冲锋'},
      'HZS':{enName:'Hangzhou Spark',name:'杭州闪电'},
      'HOU':{enName:'Houston Outlaws',name:'休斯顿神枪手'},
      'LDN':{enName:'London Spitfire',name:'伦敦喷火战斗机'},
      'GLA':{enName:'Los Angeles Gladiators',name:'洛杉矶角斗士'},
      'VAL':{enName:'Los Angeles Valiant',name:'洛杉矶英勇'},
      'NYXL':{enName:'New York Excelsior',name:'纽约九霄天擎'},
      'PAR':{enName:'Paris Eternal',name:'巴黎永生'},
      'PHI':{enName:'Philadelphia Fusion',name:'费城融合'},
      'SFS':{enName:'San Francisco Shock',name:'旧金山震动'},
      'SEO':{enName:'Seoul Dynasty',name:'首尔王朝'},
      'SHD':{enName:'Shanghai Dragons',name:'上海龙之队'},
      'TOR':{enName:'Toronto Defiant',name:'多伦多捍卫者'},
      'VAN':{enName:'Vancouver Titans',name:'温哥华泰坦'},
      'WAS':{enName:'Washington Justice',name:'华盛顿正义'}
    };
    function divisionZh(division){return division==='Atlantic'?'大西洋赛区':'太平洋赛区';}
    function divisionBadge(team){const cls=team?.division==='Atlantic'?'atlantic':'pacific';return `<span class="division-badge ${cls}">${team?.division==='Atlantic'?'ATL':'PAC'} · ${divisionZh(team?.division)}</span>`;}

    // 官方中文队名作为游戏内主显示名；英文名只保留给历史名单索引。
    TEAMS.forEach(team=>{
      const meta=V32_TEAM_META[team.short];
      if(meta){team.enName=meta.enName;team.name=meta.name;}
    });
    // 2019 基准战绩表原本以英文队名为键，复制一份中文键避免改名后失效。
    TEAMS.forEach(team=>{
      if(team.enName && typeof OWL2019_BASE_WINS!=='undefined' && OWL2019_BASE_WINS[team.enName]!=null) OWL2019_BASE_WINS[team.name]=OWL2019_BASE_WINS[team.enName];
      if(team.enName && typeof OWL2019_BASE_MD!=='undefined' && OWL2019_BASE_MD[team.enName]!=null) OWL2019_BASE_MD[team.name]=OWL2019_BASE_MD[team.enName];
    });

    // 2019 DPS职责重新校准。自定义体系中，“弹道输出”承担传统Flex DPS/Projectile/Flex的定位。
    function v32SetRole(teamEn,playerName,newRole){
      const list=OWL2019_ROSTERS[teamEn]||[];const row=list.find(x=>x[0]===playerName);if(row)row[1]=newRole;
    }
    [
      ['San Francisco Shock','sinatraa','弹道输出'],
      ['Houston Outlaws','Danteh','弹道输出'],
      ['Vancouver Titans','SeoMinSoo','弹道输出'],
      ['Vancouver Titans','Hooreg','长枪输出'],
      ['Boston Uprising','Colourhex','弹道输出'],
      ['Los Angeles Valiant','KSF','弹道输出'],
      ['Los Angeles Gladiators','Decay','长枪输出'],
      ['Seoul Dynasty','Fleta','弹道输出'],
      ['Toronto Defiant','ivy','弹道输出']
    ].forEach(x=>v32SetRole(...x));
    // Leave 2020才正式加入成都OWL阵容，不放在2019名单里；补回部分2019赛季内实际在册选手。
    OWL2019_ROSTERS['Chengdu Hunters']=(OWL2019_ROSTERS['Chengdu Hunters']||[]).filter(x=>x[0]!=='leave');
    function v32AddRoster(teamEn,row){const list=OWL2019_ROSTERS[teamEn]||[];if(!list.some(x=>x[0]===row[0]))list.push(row);OWL2019_ROSTERS[teamEn]=list;}
    v32AddRoster('Dallas Fuel',['EFFECT','长枪输出',86]);
    v32AddRoster('Boston Uprising',['NotE','坦克',86]);
    v32AddRoster('Seoul Dynasty',['Fissure','坦克',90]);
    v32AddRoster('Seoul Dynasty',['Munchkin','长枪输出',85]);
    v32AddRoster('Toronto Defiant',['Asher','长枪输出',82]);
    v32AddRoster('Toronto Defiant',['Envy','坦克',85]);
    v32AddRoster('Florida Mayhem',['TviQ','弹道输出',79]);

    historicalRosterEntries=function(team){return OWL2019_ROSTERS[team?.enName||team?.name]||[];};

    // 选手模板改为：从真实2019名单里寻找与玩家属性最接近的同位置选手。
    getRevealTemplates=function(){
      const user=Object.fromEntries(ATTRS.map(a=>[a.key,state.locked[a.key]?.value||70]));
      const weights=roleBias[state.role]||{};const pool=[];
      TEAMS.forEach(team=>historicalRosterEntries(team).filter(e=>e[1]===state.role).forEach(entry=>{
        const attrs=historicalAttributes(entry);let dist=0,weightSum=0;
        ATTRS.forEach(a=>{const w=1+Math.max(0,weights[a.key]||0)/8;dist+=Math.abs((attrs[a.key]||70)-user[a.key])*w;weightSum+=w;});
        pool.push({entry,team,dist:dist/weightSum});
      }));
      return pool.sort((a,b)=>a.dist-b.dist||b.entry[2]-a.entry[2]).slice(0,3).map(x=>`${x.entry[0]} · ${x.team.name} · OVR ${x.entry[2]}`);
    };

    // 队伍选择页：中文队名 + 2019赛区标签。
    renderTeamChoiceWheel=function(){
      const wheel=els.careerTeamWheel;if(!wheel)return;
      const target=careerState.teamSelectionTarget||pick(TEAMS);if(!careerState.teamSelectionTarget)careerState.teamSelectionTarget=target;
      const idx=TEAMS.findIndex(t=>t.name===target.name),list=[];for(let offset=-2;offset<=2;offset++)list.push(TEAMS[(idx+offset+TEAMS.length)%TEAMS.length]);
      wheel.innerHTML=list.map(team=>`<div class="team-pick-row ${team.name===target.name?'current':''}" ${team.name===target.name?'aria-current="true"':''}><span class="team-pick-name"><img class="team-mini-logo" src="${team.logo}" onerror="this.style.visibility='hidden'">${team.name}</span><span class="team-pick-selected">${team.name===target.name?'✓ 当前选择':divisionZh(team.division)}</span></div>`).join('');
      els.careerTeamManualGrid.innerHTML=TEAMS.map(team=>`<button class="team-manual-item ${careerState.teamSelectionTarget?.name===team.name?'active':''}" data-manual-team="${team.name}"><img class="team-mini-logo" src="${team.logo}" onerror="this.style.visibility='hidden'"><span>${team.name}</span>${divisionBadge(team)}</button>`).join('');
      els.careerTeamManualGrid.querySelectorAll('[data-manual-team]').forEach(btn=>btn.addEventListener('click',()=>chooseManualCareerTeam(btn.dataset.manualTeam)));
      els.careerTeamManualGrid.classList.toggle('ui-hidden',!careerState.teamSelectManual);
      els.confirmCareerTeamBtn.textContent=`加入 ${target.name} →`;els.manualCareerTeamBtn.textContent=careerState.teamSelectManual?'收起队伍列表':'🎯 自选队伍';
    };

    // 2019赛程：同赛区9个对手各打2次，跨赛区10个对手各打1次，共28场；仍切成4个Stage×7场。
    buildOwl2019Schedule=function(){
      const me=careerState.team;const all=TEAMS.filter(t=>t.name!==me.name),same=all.filter(t=>t.division===me.division),cross=all.filter(t=>t.division!==me.division);
      const entries=[];
      same.forEach(opponent=>{const firstHome=Math.random()<.5;entries.push({opponent,venue:firstHome?'home':'away',tag:'同赛区·首回合'});entries.push({opponent,venue:firstHome?'away':'home',tag:'同赛区·次回合'});});
      cross.forEach(opponent=>entries.push({opponent,venue:Math.random()<.5?'home':'away',tag:'跨赛区'}));
      let pool=shuffle(entries);
      // 尽量避免同一对手背靠背。
      for(let i=1;i<pool.length;i++){if(pool[i].opponent.name===pool[i-1].opponent.name){const j=pool.findIndex((x,k)=>k>i&&x.opponent.name!==pool[i-1].opponent.name);if(j>i)[pool[i],pool[j]]=[pool[j],pool[i]];}}
      seasonState.opponents=pool.map(x=>x.opponent);seasonState.venues=pool.map(x=>x.venue);seasonState.legs=pool.map((x,i)=>`Stage ${Math.floor(i/7)+1} · ${x.tag}`);
    };

    // 新秀进入强队不再自动挤掉90+的真实首发。
    function v32BuildHistoricalStarters(team){
      return ROLES.map((role,index)=>{const entry=bestHistoricalForRole(team,role.name);if(entry)return historicalPlayer(entry,team,index);const talent=clamp((team.strength||80)+rand(-4,1),72,91),attrs=generateMatchAttributes(role.name,talent);return{id:`fallback-${team.short}-${role.name}`,name:pick(NAMES),role:role.name,attrs,overall:talent,color:team.color,isUser:false};});
    }
    function v32AssessLineup(team,forcePromise=null){
      const userOvr=Number(getMyOvr()==='--'?78:getMyOvr()),entry=bestHistoricalForRole(team,state.role),incumbent=entry?.[2]??(team.strength||80);
      if(forcePromise&&/核心首发|稳定首发/.test(forcePromise))return{key:'starter',label:forcePromise,gap:userOvr-incumbent,incumbent};
      if(forcePromise&&/首发竞争/.test(forcePromise))return{key:'competition',label:'首发竞争',gap:userOvr-incumbent,incumbent};
      if(forcePromise&&/轮换/.test(forcePromise))return{key:'bench',label:'轮换选手',gap:userOvr-incumbent,incumbent};
      const form=(seasonState.userRatings?.length?getSeasonAverageRating()-7:0)*1.8+(careerState.coachTrust-60)*.035;const adjusted=userOvr-incumbent+form;
      if(adjusted>=-1.5)return{key:'starter',label:'稳定首发',gap:userOvr-incumbent,incumbent};
      if(adjusted>=-6)return{key:'competition',label:'首发竞争',gap:userOvr-incumbent,incumbent};
      return{key:'bench',label:'轮换选手',gap:userOvr-incumbent,incumbent};
    }
    function v32RebuildLineup(team,forcePromise=null,updateContract=true){
      const real=v32BuildHistoricalStarters(team),user={...createCareerPlayer(),color:team.color},status=v32AssessLineup(team,forcePromise);
      careerState.userLineupStatus=status;
      const displaced=[];
      if(status.key==='starter'){const idx=real.findIndex(p=>p.role===state.role);if(idx>=0){displaced.push(real[idx]);real[idx]=user;}else real[0]=user;}
      careerState.starters=real;
      const used=new Set(real.map(p=>p.name));let bench=[];
      if(status.key!=='starter'){bench.push(user);used.add(user.name);}else displaced.forEach(p=>{if(!used.has(p.name)){bench.push(p);used.add(p.name);}});
      historicalRosterEntries(team).sort((a,b)=>b[2]-a[2]).forEach((e,i)=>{if(bench.length>=4||used.has(e[0]))return;const p=historicalPlayer(e,team,30+i);bench.push(p);used.add(p.name);});
      careerState.bench=bench.slice(0,4);
      if(updateContract&&careerState.contract)careerState.contract.rolePromise=status.label;
      return status;
    }
    const _v32SetupCareerTeamBase=setupCareerTeam;
    setupCareerTeam=function(forceNew,fixedTeam=null){
      _v32SetupCareerTeamBase(forceNew,fixedTeam);if(!careerState.team)return;
      if(careerState.careerYears===1&&!careerState.initialOvr)careerState.initialOvr=Number(getMyOvr()==='--'?78:getMyOvr());
      const status=v32RebuildLineup(careerState.team,null,true);
      if(careerState.careerYears===1&&careerState.contract){careerState.contract.rolePromise=status.label;careerState.contract.salary=Math.max(careerState.contract.salary||12,10);}
      renderCareerTeam();
    };
    const _v32ContinueContractBase=continueExistingContract;
    continueExistingContract=function(){
      _v32ContinueContractBase();
      if(careerState.team){const status=v32RebuildLineup(careerState.team,null,true);careerState.contract.rolePromise=status.label;renderCareerTeam();}
    };
    const _v32ApplyOfferBase=applyTeamFromOffer;
    applyTeamFromOffer=function(offer){
      _v32ApplyOfferBase(offer);
      if(careerState.team){v32RebuildLineup(careerState.team,offer.rolePromise,false);careerState.contract.rolePromise=offer.rolePromise;renderCareerTeam();}
    };

    const _v32RenderCareerTeamBase=renderCareerTeam;
    renderCareerTeam=function(){
      _v32RenderCareerTeamBase();if(!careerState.team||careerState.awaitingTeamChoice)return;
      const meta=document.getElementById('careerContractMeta');if(meta)meta.textContent=`守望先锋联赛 · ${divisionZh(careerState.team.division)} · ${careerState.contract?`${careerState.contract.years}年合同 · 剩余${careerState.contract.remaining}年 · 年薪${careerState.contract.salary}万 · ${careerState.contract.rolePromise}`:'合同待定'} · 季前排名第${careerState.rank}`;
      const squad=document.getElementById('careerSquadCard');if(squad&&careerState.userLineupStatus){let note=squad.querySelector('.lineup-status-note');if(!note){note=document.createElement('div');note.className='lineup-status-note';squad.appendChild(note);}const s=careerState.userLineupStatus;note.innerHTML=`<strong>当前队内定位：${s.label}</strong> · 你的OVR与同职责首发参考相差 ${s.gap>=0?'+':''}${s.gap}。${s.key==='starter'?'教练组会优先把你放进首发。':s.key==='competition'?'你会从轮换与首发竞争开始。':'先从替补轮换开始；表现和教练信任会影响定位。'}`;}
    };

    // 常规赛页明确显示大西洋/太平洋赛区；三种模拟方式各司其职。
    const _v32RenderSeasonBase=renderSeason;
    renderSeason=function(){
      _v32RenderSeasonBase();if(!careerState.team)return;
      const stage=currentStageNumber();const league=document.getElementById('seasonLeagueText');if(league)league.innerHTML=`守望先锋联赛 · ${divisionZh(careerState.team.division)} · Stage ${stage}`;
      const play=document.getElementById('playNextSeasonMatchBtn'),fast=document.getElementById('fastSimSeasonBtn'),full=document.getElementById('fullSimSeasonBtn');
      if(play&&seasonState.played<28)play.textContent=gameSettings.matchDetailsEnabled?'🎮 比赛详情':'⚡ 模拟单场';
      if(fast)fast.textContent=seasonState.simulating?'⏸ 暂停':'⏩ 模拟本赛段';
      if(full){full.disabled=seasonState.played>=28||seasonState.simulating;full.textContent='🚀 模拟全部常规赛';}
      const next=seasonState.opponents[seasonState.played];if(next&&seasonState.played<28){const venue=seasonState.venues[seasonState.played]==='home'?'主场':'客场';document.getElementById('seasonNextOpponent').textContent=`下一场：${next.name} · ${seasonState.legs[seasonState.played]||''} · ${venue}`;}
    };

    function v32AutoResolveSeasonEvent(){
      if(!seasonState.eventDue)return;const event=chooseSeasonEvent(),choice=pick(event.choices);applySeasonEventEffects(choice.effects);seasonState.eventHistory.push({id:event.id,icon:event.icon,title:event.title,choice:choice.label,summary:'完整赛季模拟自动处理',afterMatch:seasonState.played});careerState.recentEventIds=[...(careerState.recentEventIds||[]).filter(id=>id!==event.id),event.id].slice(-12);seasonState.eventTriggeredAt.push(seasonState.played);seasonState.eventDue=false;
    }
    function v32SilentRegularGame(){
      const idx=seasonState.played,opponent=seasonState.opponents[idx];if(!opponent)return;const ourRoster=careerState.starters.map(p=>({...p,attrs:{...p.attrs}})),theirRoster=createRoster(opponent,false),careerBonus=currentCareerMatchBonus(),venue=regularVenueAt(idx),won=Math.random()<getRegularSeasonWinChance(ourRoster,theirRoster,careerBonus,venue);seasonState.results[idx]=won?'win':'loss';seasonState.played++;if(won)seasonState.wins++;else seasonState.losses++;const rating=quickCareerRating(won,careerBonus);seasonState.userRatings.push(rating);updateCareerAfterMatch(won,rating);markSeasonEventDue();v32AutoResolveSeasonEvent();
    }
    function simulateWholeSeason(){
      if(seasonState.simulating||seasonState.played>=28)return;seasonState.simulating=true;
      if(seasonState.stageBreakPending){const s=seasonState.stageBreakPending;stageQualified(s)?simulateStagePlayoff(s):skipStageBreak(s);}
      let guard=0;while(seasonState.played<28&&guard++<40){v32SilentRegularGame();const boundary={7:1,14:2,21:3}[seasonState.played];if(boundary&&!seasonState.stageProcessed.includes(boundary)){seasonState.stageBreakPending=boundary;if(stageQualified(boundary))simulateStagePlayoff(boundary);else skipStageBreak(boundary);}}
      seasonState.simulating=false;seasonState.stageBreakPending=null;document.getElementById('seasonSimNote').textContent=`✓ 已模拟完整常规赛：${seasonState.wins}胜${seasonState.losses}负。前三个Stage的阶段赛资格也已同步处理。`;renderSeason();window.scrollTo({top:0,behavior:'smooth'});
    }
    document.getElementById('fullSimSeasonBtn')?.addEventListener('click',simulateWholeSeason);

    // 最佳新秀只能拿一次；MVP对连续同一位AI得主加入“审美疲劳”，但不硬性禁止连庄。
    const V32_ROOKIE_CLASSES={
      2020:[['Alarm','输出支援',94,'费城融合'],['ANS','长枪输出',93,'旧金山震动'],['LIP','长枪输出',94,'上海龙之队'],['Hanbin','坦克',94,'巴黎永生'],['SP9RK1E','弹道输出',92,'巴黎永生'],['Xzi','长枪输出',91,'巴黎永生'],['Cr0ng','坦克',92,'广州冲锋'],['Yaki','弹道输出',91,'佛罗里达狂欢'],['Gangnamjin','输出支援',90,'佛罗里达狂欢'],['LeeJaeGon','战术支援',92,'上海龙之队']],
      2021:[['Pelican','弹道输出',94,'亚特兰大君临'],['Shy','长枪输出',92,'杭州闪电'],['Piggy','坦克',89,'休斯顿神枪手'],['Mmonk','输出支援',89,'成都猎人'],['Nisha','战术支援',88,'成都猎人'],['Mag','坦克',90,'华盛顿正义']],
      2022:[['Proper','弹道输出',97,'旧金山震动'],['Someone','坦克',92,'佛罗里达狂欢'],['Reiner','坦克',92,'洛杉矶角斗士'],['Finn','输出支援',91,'旧金山震动'],['CH0R0NG','战术支援',91,'多伦多捍卫者'],['ZEST','弹道输出',91,'费城融合'],['AlphaYi','弹道输出',90,'杭州闪电']],
      2023:[['Sugarfree','弹道输出',90,'温哥华泰坦'],['Spectra','弹道输出',90,'多伦多捍卫者'],['Bliss','战术支援',90,'达拉斯燃料'],['Donghak','坦克',91,'亚特兰大君临'],['Viper','弹道输出',89,'上海龙之队']]
    };
    const V32_2019_ROOKIES=new Set(['Haksal','guxue','Corey','DDing','Erster','Happy','shu','Masaa','Diem','Decay','GodsB','JinMu']);
    buildRegularAwardLeaguePool=function(){
      const pool=[];TEAMS.forEach(team=>historicalRosterEntries(team).forEach((e,i)=>{const[name,role,ovr]=e;pool.push({id:`ai-${team.short}-${name}`,isUser:false,name,team:team.name,role,rating:clamp(6.35+(ovr-78)*.095+(team.strength-80)*.022+randomCentered(.34),5.8,9.15),ovr,wins:clamp(Math.round(14+(team.strength-80)*.75+rand(-3,3)),4,26),popularity:clamp(30+(ovr-78)*3+rand(-12,12),10,98),rookie:careerState.seasonYear===2019&&V32_2019_ROOKIES.has(name),roleQuality:ovr});}));
      const future=V32_ROOKIE_CLASSES[careerState.seasonYear]||[];future.forEach((e,i)=>pool.push({id:`rookie-${careerState.seasonYear}-${i}`,isUser:false,name:e[0],team:e[3],role:e[1],rating:clamp(6.7+(e[2]-80)*.09+randomCentered(.25),6.3,9.2),ovr:e[2],wins:rand(11,22),popularity:rand(35,85),rookie:true,roleQuality:e[2]}));
      pool.push(getSeasonUserAwardProfile());return pool;
    };
    function v32PastAwardWinners(type){return careerState.careerArchive.map(r=>r.awards?.[type]?.winner?.name).filter(Boolean);}
    ensureRegularSeasonAwards=function(){
      if(seasonState.awards?.roleStars&&Object.values(seasonState.awards.roleStars)[0]?.winners)return seasonState.awards;
      const pool=buildRegularAwardLeaguePool(),mvpHistory=v32PastAwardWinners('mvp'),rookieHistory=new Set(v32PastAwardWinners('rookie'));
      const last=mvpHistory.at(-1),recent=new Set(mvpHistory.slice(-3));
      const mvp=rankAwardCandidates(pool,p=>p.rating*11.5+p.ovr*.16+p.wins*.62+(!p.isUser&&p.name===last?-7.0:!p.isUser&&recent.has(p.name)?-3.0:0));
      let rookiePool=pool.filter(p=>p.rookie&&!rookieHistory.has(p.name));if(careerState.careerYears>1)rookiePool=rookiePool.filter(p=>!p.isUser);
      if(!rookiePool.length){const fallbackName=`新秀${careerState.seasonYear}`;rookiePool=[{id:`fallback-rookie-${careerState.seasonYear}`,isUser:false,name:fallbackName,team:pick(TEAMS).name,role:pick(ROLES).name,rating:rand(69,78)/10,ovr:rand(78,88),wins:rand(9,19),popularity:rand(20,65),rookie:true,roleQuality:rand(78,90)}];}
      const rookie=rankAwardCandidates(rookiePool,p=>p.rating*10.5+p.ovr*.16+p.wins*.48);rookie.userEligible=careerState.careerYears===1;if(!rookie.userEligible)rookie.userRank=null;
      const community=rankAwardCandidates(pool,p=>p.popularity*.72+p.rating*2.7+p.wins*.18),roleStars={};
      ROLES.forEach(role=>{const r=rankAwardCandidates(pool.filter(p=>p.role===role.name),p=>p.rating*9.8+p.ovr*.21+p.wins*.34+p.roleQuality*.08);r.winners=r.top5.slice(0,2);roleStars[role.name]=r;});
      seasonState.awards={mvp,rookie,community,roleStars,generatedYear:careerState.seasonYear};return seasonState.awards;
    };

    // 玩家评分再放开一点：高OVR+高胜率赛季可以稳定进入8分档，而不是冠军拿到手软还卡在7.0。
    quickCareerRating=function(won,careerBonus=0){const ovr=Number(getMyOvr()==='--'?78:getMyOvr()),form=(careerState.condition-70)*.004;return clamp(6.95+(ovr-78)*.086+(won?.64:-.04)+careerBonus*.080+form+careerState.nextRatingBonus+randomCentered(.64),5.0,10.0);};

    // 22岁前提高训练基础，并给低初始OVR更多成长空间；赛季表现仍只影响1.2~1.8倍率。
    Object.assign(AGE_BASE_TRAINING_POINTS,{17:12,18:11,19:10,20:9,21:8,22:6});
    getTrainingPointBreakdown=function(nextAge){
      const ageBase=AGE_BASE_TRAINING_POINTS[nextAge]??0,initial=careerState.initialOvr||Number(getMyOvr()==='--'?78:getMyOvr());
      const developmentBonus=nextAge<=21?(initial<=72?3:initial<=76?2:initial<=80?1:0):0;const base=ageBase+developmentBonus;
      const avg=getSeasonAverageRating(),winRate=seasonState.total?seasonState.wins/seasonState.total:.5,ratingBonus=clamp((avg-6.5)*.12,-.12,.24),seasonBonus=winRate>=.70?.12:winRate>=.60?.09:winRate>=.52?.05:winRate>=.44?.01:winRate>=.35?-.04:-.08,playoffRatings=(playoffState.results||[]).map(result=>Number(result.rating)).filter(Number.isFinite),playoffAverage=playoffRatings.length?playoffRatings.reduce((sum,rating)=>sum+rating,0)/playoffRatings.length:0,playoffPerformanceBonus=playoffAverage>=8.2?.08:playoffAverage>=7.6?.05:playoffAverage>=7.0?.02:0,achievementBase=playoffState.round==='champion'?.18:playoffState.round==='runnerup'?.12:getPlayoffResultLabel()==='季后赛季军'?.08:estimateSeasonRank()<=8?.04:0,achievementBonus=achievementBase+playoffPerformanceBonus,multiplier=clamp(1.34+ratingBonus+seasonBonus+achievementBonus,1.2,1.8),total=clamp(Math.round(base*multiplier),0,24);
      return{base,ageBase,developmentBonus,total,multiplier:Number(multiplier.toFixed(2)),avg,winRate,ratingBonus,seasonBonus,achievementBonus,playoffPerformanceBonus};
    };
    const _v32RenderTrainingBase=renderTrainingCamp;
    renderTrainingCamp=function(wrap){_v32RenderTrainingBase(wrap);const b=offseasonState.trainingBreakdown||getTrainingPointBreakdown(careerState.age);const first=wrap.querySelector('.training-summary-item strong');if(first)first.textContent=b.developmentBonus?`${b.base}（年龄${b.ageBase}+潜力${b.developmentBonus}）`:String(b.base);};

    // 赛区标签与中文文案收尾。
    const _v32FinalRenderSeason=renderSeason;
    renderSeason=function(){_v32FinalRenderSeason();document.querySelectorAll('.stage-break-card p').forEach(p=>p.innerHTML=p.innerHTML.replaceAll('Atlantic / Pacific','大西洋 / 太平洋').replaceAll('Atlantic','大西洋').replaceAll('Pacific','太平洋'));};


    const _v32ResetBuildOnlyBase=resetBuildOnly;
    resetBuildOnly=function(){_v32ResetBuildOnlyBase();delete careerState.initialOvr;delete careerState.userLineupStatus;};


    // 2019公开规则只固定20队、28场、4个Stage×7场，并非传统主客双循环。
    // 这里保留每个对手至少交手一次，再将9个额外对局按同赛区更高权重抽取，允许部分对手赛季内多次相遇，更接近当年不均衡赛程的体验。
    buildOwl2019Schedule=function(){
      const me=careerState.team,all=TEAMS.filter(x=>x.name!==me.name),same=all.filter(x=>x.division===me.division),cross=all.filter(x=>x.division!==me.division);
      const first=shuffle([...all]).map(opponent=>({opponent,venue:Math.random()<.5?'home':'away',tag:'首次交手'}));
      const weighted=shuffle([...same,...same,...cross]);
      const extras=weighted.slice(0,9).map(opponent=>({opponent,venue:Math.random()<.5?'home':'away',tag:'追加对局'}));
      let pool=[...first,...extras];
      for(let i=1;i<pool.length;i++){
        if(pool[i].opponent.name===pool[i-1].opponent.name){
          const j=pool.findIndex((x,k)=>k>i&&x.opponent.name!==pool[i-1].opponent.name);
          if(j>i)[pool[i],pool[j]]=[pool[j],pool[i]];
        }
      }
      seasonState.opponents=pool.slice(0,28).map(x=>x.opponent);
      seasonState.venues=pool.slice(0,28).map(x=>x.venue);
      seasonState.legs=pool.slice(0,28).map((x,i)=>`Stage ${Math.floor(i/7)+1} · ${x.tag}`);
    };

    // 替补身份时，训练属性也要同步更新替补席上的玩家对象。
    const _v32SetCareerAttributeValueBase=setCareerAttributeValue;
    setCareerAttributeValue=function(key,value){
      _v32SetCareerAttributeValueBase(key,value);
      const user=(careerState.bench||[]).find(p=>p.isUser);
      if(user){user.attrs[key]=state.locked[key].value;user.overall=Math.round(Object.values(user.attrs).reduce((a,b)=>a+b,0)/ATTRS.length);}
    };

    // 当玩家主动开启比赛详情时，视为本场获得出场机会；即使赛季定位是轮换，也把玩家放进本场阵容，避免详细比赛找不到主角。
    function v32EnsureUserInActiveRoster(roster,team){
      if(roster.some(p=>p.isUser))return roster;
      const user={...createCareerPlayer(),color:team.color};const idx=roster.findIndex(p=>p.role===state.role);
      if(idx>=0)roster[idx]=user;else roster[0]=user;return roster;
    }
    const _v32SetupMatchBase=setupMatch;
    setupMatch=function(...args){_v32SetupMatchBase(...args);if(matchState.homeTeam?.name===careerState.team?.name&&matchState.homeRoster)matchState.homeRoster=v32EnsureUserInActiveRoster(matchState.homeRoster,careerState.team);};

    const _v32OpenNextPlayoffMatchBase=openNextPlayoffMatch;
    openNextPlayoffMatch=function(mode='quick'){
      _v32OpenNextPlayoffMatchBase(mode);
      if(mode==='detail'&&matchState.context==='playoff'&&matchState.homeRoster&&careerState.team){matchState.homeRoster=v32EnsureUserInActiveRoster(matchState.homeRoster,careerState.team);renderMatch();}
    };



