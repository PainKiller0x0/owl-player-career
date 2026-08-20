/* ===== BUNDLE MODULE: systems/regular_season.js ===== */
/* ==========================================================================
   MODULE: systems/regular_season.js
   Regular-season state, awards, scheduling and simulation
   Migrated from V6.2 lines 5812-6306; execution order is defined by manifest.json.
   ========================================================================== */
    function returnToSeasonAfterMatch() {
      renderSeason();
      showScreen('season');
      if(seasonState.played>=seasonState.total && !seasonState.awardsViewed) setTimeout(openRegularSeasonAwards,260);
      else setTimeout(openScheduledSeasonEvent,80);
    }

    const seasonState = {
      active:false,
      total:28,
      played:0,
      wins:0,
      losses:0,
      results:[],
      opponents:[],
      userRatings:[],
      decisionSuccess:0,
      decisionTotal:0,
      simulating:false,
      timer:null,
      pendingManualIndex:null,
      manualRecorded:false,
      eventSchedule:[],
      eventTriggeredAt:[],
      eventHistory:[],
      eventDue:false,
      currentEvent:null,
      resumeFastAfterEvent:false,
      baseLocked:null,
      resetArmed:false,
      resetArmTimer:null,
      injuryAt:7,
      injuryPromptUsed:false,
      venues:[],
      legs:[],
      lastMinorInjuryAt:-99,
      gamesMissed:0,
      awards:null,
      awardsViewed:false,
      startDynamics:null
    };

    function enterSeasonHub() {
      if (!careerState.team) setupCareerTeam(false);
      if (!seasonState.active) setupSeason(false);
      renderSeason();
      showScreen('season');
    }

    function cloneLockedAttributes(source) {
      return JSON.parse(JSON.stringify(source || {}));
    }

    function clearSeasonRestartArm() {
      if (seasonState.resetArmTimer) clearTimeout(seasonState.resetArmTimer);
      seasonState.resetArmTimer=null;
      seasonState.resetArmed=false;
      if (els.resetSeasonBtn) {
        els.resetSeasonBtn.classList.remove('danger-armed');
        els.resetSeasonBtn.textContent='重开赛季';
      }
    }

    function handleSeasonRestartClick() {
      const hasProgress = seasonState.played>0 || seasonState.eventHistory.length>0 || playoffState.active;
      if (hasProgress && !seasonState.resetArmed) {
        seasonState.resetArmed=true;
        els.resetSeasonBtn.classList.add('danger-armed');
        els.resetSeasonBtn.textContent='再次点击确认重开';
        document.getElementById('seasonSimNote').textContent='再次点击“重开赛季”才会清空战绩、事件与季后赛进度。';
        seasonState.resetArmTimer=setTimeout(clearSeasonRestartArm,3500);
        return;
      }
      restartCurrentSeason();
    }

    function restartCurrentSeason() {
      clearSeasonRestartArm();
      if (seasonState.timer) clearTimeout(seasonState.timer);
      seasonState.simulating=false;
      seasonState.resumeFastAfterEvent=false;
      seasonState.pendingManualIndex=null;
      seasonState.manualRecorded=false;
      document.getElementById('seasonEventOverlay').classList.add('hidden');
      const decisionOverlay=document.getElementById('decisionOverlay');
      if(decisionOverlay) decisionOverlay.classList.add('hidden');
      matchState.simulating=false;
      matchState.finished=false;
      matchState.context='demo';
      setupSeason(true);
      showScreen('season');
      renderSeason();
      const note=document.getElementById('seasonSimNote');
      note.textContent='✓ 赛季已完整重开：战绩、赛程、随机事件、职业状态和季后赛进度均已重置。';
      els.resetSeasonBtn.textContent='✓ 已重开';
      setTimeout(()=>{ if(!seasonState.resetArmed) els.resetSeasonBtn.textContent='重开赛季'; },1200);
      window.scrollTo({top:0,behavior:'instant'});
    }

    function setupSeason(isRestart=false) {
      if (seasonState.timer) clearTimeout(seasonState.timer);
      if (isRestart && seasonState.baseLocked) state.locked=cloneLockedAttributes(seasonState.baseLocked);
      else seasonState.baseLocked=cloneLockedAttributes(state.locked);
      renderLockedAttrs();
      renderBuildSummary();
      const opponents = TEAMS.filter(t=>t.name!==careerState.team.name);
      seasonState.active=true;
      seasonState.played=0;
      seasonState.wins=0;
      seasonState.losses=0;
      seasonState.results=Array(seasonState.total).fill(null);
      seasonState.userRatings=[];
      seasonState.decisionSuccess=0;
      seasonState.decisionTotal=0;
      seasonState.simulating=false;
      seasonState.pendingManualIndex=null;
      seasonState.manualRecorded=false;
      seasonState.eventSchedule=generateSeasonEventSchedule();
      seasonState.eventTriggeredAt=[];
      seasonState.eventHistory=[];
      seasonState.eventDue=false;
      seasonState.currentEvent=null;
      seasonState.resumeFastAfterEvent=false;
      if (seasonState.resetArmTimer) clearTimeout(seasonState.resetArmTimer);
      seasonState.resetArmTimer=null;
      seasonState.resetArmed=false;
      const seasonInjuryChance=clamp(.10+Math.max(0,careerState.age-23)*.012+(careerState.condition<45?.05:0),.08,.24);
      seasonState.injuryAt=Math.random()<seasonInjuryChance?pick([8,15,22,26]):null;
      seasonState.injuryPromptUsed=false;
      seasonState.lastMinorInjuryAt=-99;
      seasonState.gamesMissed=0;
      seasonState.awards=null;
      seasonState.awardsViewed=false;
      prepareCareerDynamicsForSeason(isRestart);
      document.getElementById('seasonEventOverlay').classList.add('hidden');
      document.getElementById('seasonSimNote').textContent='';
      resetPlayoffState();
      // 20 队双循环：每个对手各打一主一客，两回合分别洗牌。
      const firstEntries=shuffle([...opponents]).map(opponent=>({opponent,venue:Math.random()<.5?'home':'away',leg:'首回合'}));
      let secondEntries=shuffle(firstEntries.map(item=>({opponent:item.opponent,venue:item.venue==='home'?'away':'home',leg:'次回合'})));
      if(firstEntries.length>1 && secondEntries[0]?.opponent.name===firstEntries[firstEntries.length-1]?.opponent.name) {
        [secondEntries[0],secondEntries[1]]=[secondEntries[1],secondEntries[0]];
      }
      const fullSchedule=[...firstEntries,...secondEntries];
      seasonState.opponents=fullSchedule.map(item=>item.opponent);
      seasonState.venues=fullSchedule.map(item=>item.venue);
      seasonState.legs=fullSchedule.map(item=>item.leg);
      renderSeason();
    }

    function renderSeason() {
      if (!careerState.team) return;
      const team=careerState.team;
      const logo=document.getElementById('seasonTeamLogo');
      logo.textContent=team.short; logo.style.background=team.color;
      document.getElementById('seasonTeamName').textContent=team.name;
      document.getElementById('seasonLeagueText').textContent=`${careerState.seasonYear<=2023?'OWL':'OWL 2.0'} · ${careerState.goal}`;
      const yearChip=document.getElementById('seasonYearChip');
      if(yearChip) yearChip.textContent=`🏆 ${careerState.seasonYear} 赛季`;
      document.getElementById('seasonWins').textContent=seasonState.wins;
      document.getElementById('seasonLosses').textContent=seasonState.losses;
      const pct=seasonState.played ? seasonState.wins/seasonState.played*100 : 0;
      document.getElementById('seasonWinRate').textContent=`${pct.toFixed(1)}%`;
      const ovr=getMyOvr()==='--'?78:getMyOvr();
      const avg=seasonState.userRatings.length ? seasonState.userRatings.reduce((a,b)=>a+b,0)/seasonState.userRatings.length : null;
      document.getElementById('seasonPlayerStrip').innerHTML=`<strong>${state.role}</strong> · ${careerState.age}岁 · OVR ${ovr} · 平均评分 ${avg?avg.toFixed(1):'未出场'} · 已出战 ${seasonState.userRatings.length} 场 · 位置适应 ${Math.round(careerState.roleAdaptation)}%${careerState.positionTrial?` · 转位试训：${careerState.positionTrial}`:''}`;
      document.getElementById('seasonDots').innerHTML=seasonState.results.map((r,i)=>`<i class="season-dot ${r||''} ${i===seasonState.played && seasonState.played<seasonState.total?'current':''}" title="第 ${i+1} 场 · ${seasonState.legs[i]||''} · ${seasonState.venues[i]==='home'?'主场':'客场'}${seasonState.opponents[i]?' · '+seasonState.opponents[i].name:''}"></i>`).join('');
      const next=seasonState.opponents[seasonState.played];
      const nextVenue=seasonState.venues[seasonState.played]==='home'?'主场':'客场';
      document.getElementById('seasonNextOpponent').textContent=seasonState.played>=seasonState.total?'常规赛已结束':`下一场：${next?.name||'待定'} · ${seasonState.legs[seasonState.played]||''} · ${nextVenue}`;
      document.getElementById('seasonProgressCopy').innerHTML=seasonState.simulating?`模拟中 · <strong>${seasonState.played} / ${seasonState.total}</strong>`:seasonState.played>=seasonState.total?`常规赛结束 · <strong>${seasonState.played} / ${seasonState.total}</strong>`:`赛季进行中 · <strong>${seasonState.played} / ${seasonState.total}</strong>`;
      const rank=estimateSeasonRank();
      document.getElementById('seasonRankText').textContent=seasonState.played?`第 ${rank}`:'—';
      document.getElementById('seasonAvgRating').textContent=avg?avg.toFixed(1):'未出场';
      document.getElementById('seasonDecisionRate').textContent=seasonState.decisionTotal?`${Math.round(seasonState.decisionSuccess/seasonState.decisionTotal*100)}%`:'—';
      renderCareerDynamics();
      const playBtn=document.getElementById('playNextSeasonMatchBtn');
      const fastBtn=document.getElementById('fastSimSeasonBtn');
      playBtn.disabled=seasonState.played>=seasonState.total || seasonState.simulating || seasonState.eventDue || !!seasonState.currentEvent;
      fastBtn.disabled=seasonState.played>=seasonState.total || !!seasonState.currentEvent;
      playBtn.textContent=seasonState.played>=seasonState.total?'✓ 常规赛结束':gameSettings.matchDetailsEnabled?`🎮 出战第 ${seasonState.played+1} 场`:`⚡ 模拟第 ${seasonState.played+1} 场`;
      fastBtn.textContent=seasonState.simulating?'⏸ 停止模拟':'⚡ 快速模拟剩余赛季';
      const completeArea=document.getElementById('seasonCompleteArea');
      if(seasonState.played>=seasonState.total) {
        const awardLabel=seasonState.awardsViewed?'🏅 返回常规赛奖项':'🏅 揭晓常规赛奖项';
        if(!seasonState.awardsViewed) {
          completeArea.innerHTML=`<div class="season-complete-banner"><strong>常规赛完成：${seasonState.wins} 胜 ${seasonState.losses} 负，排名第 ${rank}。</strong><br>季后赛之前，先揭晓本赛季个人奖项。<div style="margin-top:13px"><button class="primary-btn" id="viewRegularAwardsBtn">${awardLabel}</button></div></div>`;
        } else if(rank<=8) {
          const label=playoffState.active?'返回季后赛':'进入季后赛';
          completeArea.innerHTML=`<div class="season-complete-banner"><strong>常规赛完成：${seasonState.wins} 胜 ${seasonState.losses} 负，排名第 ${rank}。</strong><br>队伍获得季后赛资格。<div style="margin-top:13px;display:flex;gap:10px;flex-wrap:wrap"><button class="secondary-btn" id="viewRegularAwardsBtn">${awardLabel}</button><button class="primary-btn" id="enterPlayoffsBtn">🏆 ${label}</button><button class="secondary-btn" data-open-season-summary="1">📊 查看赛季结算</button></div></div>`;
          const btn=document.getElementById('enterPlayoffsBtn');
          if(btn) btn.addEventListener('click', enterPlayoffs);
        } else {
          completeArea.innerHTML=`<div class="season-complete-banner"><strong>常规赛完成：${seasonState.wins} 胜 ${seasonState.losses} 负，排名第 ${rank}。</strong><br>未能进入季后赛。<div style="margin-top:13px;display:flex;gap:10px;flex-wrap:wrap"><button class="secondary-btn" id="viewRegularAwardsBtn">${awardLabel}</button><button class="primary-btn" data-open-season-summary="1">📊 查看赛季结算</button></div></div>`;
        }
        const awardBtn=document.getElementById('viewRegularAwardsBtn');
        if(awardBtn) awardBtn.addEventListener('click',openRegularSeasonAwards);
      } else completeArea.innerHTML='';
    }

    function estimateSeasonRank() {
      if (!seasonState.played) return careerState.rank||7;
      const rate=seasonState.wins/seasonState.played;
      // 20队、38场环境下，约55%胜率应处在季后赛线附近，而不是被判成联盟中游。
      return clamp(Math.round(20.5-rate*22),1,20);
    }


    function getSeasonUserAwardProfile() {
      const avg=seasonState.userRatings.length?seasonState.userRatings.reduce((a,b)=>a+b,0)/seasonState.userRatings.length:0;
      return {
        id:'user', isUser:true, name:getPlayerName(), team:careerState.team?.name||'未知队伍', role:state.role,
        rating:avg, ovr:Number(getMyOvr()==='--'?78:getMyOvr()), wins:seasonState.wins,
        popularity:careerState.popularity, rookie:careerState.careerYears===1,
        roleQuality:calculateRoleFit(state.role)
      };
    }

    function buildRegularAwardLeaguePool() {
      const pool=[];
      const used=new Set([getPlayerName()]);
      let nameIndex=0;
      TEAMS.forEach((team,teamIndex)=>{
        ROLES.forEach((role,roleIndex)=>{
          let base=NAMES[(nameIndex++ + careerState.seasonYear + teamIndex*3 + roleIndex) % NAMES.length];
          let name=base, suffix=2;
          while(used.has(name)) name=`${base}${suffix++}`;
          used.add(name);
          const strength=rand(72,94);
          const rating=clamp(5.9+(strength-70)*.075+randomCentered(.55),5.7,9.2);
          pool.push({
            id:`ai-${teamIndex}-${roleIndex}`,isUser:false,name,team:team.name,role:role.name,
            rating,ovr:strength,wins:rand(11,30),popularity:rand(18,96),
            rookie:((teamIndex+roleIndex+careerState.seasonYear)%4===0),roleQuality:rand(72,95)
          });
        });
      });
      pool.push(getSeasonUserAwardProfile());
      return pool;
    }

    function rankAwardCandidates(pool,scoreFn) {
      const ranked=pool.map(p=>({...p,awardScore:scoreFn(p)+randomCentered(.7)})).sort((a,b)=>b.awardScore-a.awardScore);
      const userIndex=ranked.findIndex(p=>p.isUser);
      return {winner:ranked[0],top5:ranked.slice(0,5),userRank:userIndex>=0?userIndex+1:null};
    }

    function ensureRegularSeasonAwards() {
      if(seasonState.awards) return seasonState.awards;
      const pool=buildRegularAwardLeaguePool();
      const mvp=rankAwardCandidates(pool,p=>p.rating*10+p.ovr*.16+p.wins*.65);
      const rookiePool=pool.filter(p=>p.rookie);
      const rookie=rankAwardCandidates(rookiePool,p=>p.rating*10+p.ovr*.15+p.wins*.5);
      rookie.userEligible=careerState.careerYears===1;
      if(!rookie.userEligible) rookie.userRank=null;
      const community=rankAwardCandidates(pool,p=>p.popularity*.75+p.rating*2.5+p.wins*.2);
      const roleStars={};
      ROLES.forEach(role=>{
        roleStars[role.name]=rankAwardCandidates(pool.filter(p=>p.role===role.name),p=>p.rating*9+p.ovr*.20+p.wins*.35+p.roleQuality*.08);
      });
      seasonState.awards={mvp,rookie,community,roleStars,generatedYear:careerState.seasonYear};
      return seasonState.awards;
    }

    function awardRankText(rank,eligible=true) {
      if(!eligible) return '不参与评选';
      if(rank===1) return '🏆 获奖';
      if(rank && rank<=5) return `第 ${rank} 名`;
      return '未进前五';
    }

    function awardSpotlightCard(icon,title,subtitle,result,eligible=true) {
      const winner=result?.winner||{isUser:false,name:'暂无符合条件的选手',team:'联盟数据不足',role:'—'};
      const won=eligible&&result.userRank===1;
      return `<article class="award-card">
        <div class="award-card-head"><h3>${icon} ${title}</h3><span>${subtitle}</span></div>
        <div class="award-main-row">
          <div class="award-winner"><div class="award-avatar">${winner.isUser?'你':winner.name.slice(0,2).toUpperCase()}</div><div class="award-winner-copy"><small>本赛季得主</small><strong>${winner.name}</strong><span>${winner.team} · ${winner.role}</span></div></div>
          <div class="award-rank-box ${won?'won':''}"><span>你的排名</span><strong>${awardRankText(result.userRank,eligible)}</strong></div>
        </div>
      </article>`;
    }

    function renderRegularSeasonAwards() {
      const awards=ensureRegularSeasonAwards();
      document.getElementById('awardsSeasonChip').textContent=`🏆 ${careerState.seasonYear} 赛季`;
      const roleRows=ROLES.map(role=>{
        const result=awards.roleStars[role.name];
        const winner=result.winner;
        const mine=role.name===state.role;
        return `<div class="award-role-row ${mine?'mine':''}"><div class="award-role-label">${role.icon} ${role.name}</div><div class="award-role-winner"><strong>${winner.name}</strong><span>${winner.team}</span></div><div class="award-role-rank">${mine?`你的排名<br><strong>${awardRankText(result.userRank,true)}</strong>`:'职责之星'}</div></div>`;
      }).join('');
      els.regularAwardsContent.innerHTML=`
        ${awardSpotlightCard('👑','最有价值选手','只展示得主与你是否进入前五',awards.mvp,true)}
        <article class="award-card"><div class="award-card-head"><h3>🎯 职责之星</h3><span>五个位置分别评选</span></div><div class="award-role-list">${roleRows}</div><div class="award-footnote">只参与当前主位置「${state.role}」的职责之星评选。</div></article>
        ${awardSpotlightCard('🌱','最佳新秀','新秀赛季限定',awards.rookie,awards.rookie.userEligible)}
        ${awardSpotlightCard('🤝','社区之星','综合公众关注与赛季影响力',awards.community,true)}
      `;
      const rank=estimateSeasonRank();
      els.awardsContinueBtn.textContent=rank<=8?(playoffState.active?'🏆 返回季后赛':'🏆 进入季后赛'):'📊 进入赛季结算';
    }

    function openRegularSeasonAwards() {
      if(seasonState.played<seasonState.total) return;
      seasonState.awardsViewed=true;
      renderRegularSeasonAwards();
      showScreen('awards');
    }

    function continueAfterRegularAwards() {
      if(estimateSeasonRank()<=8) enterPlayoffs();
      else showSeasonSummary();
    }

    function regularVenueAt(index=seasonState.played) { return seasonState.venues[index]||'home'; }
    function regularVenueLabel(index=seasonState.played) { return regularVenueAt(index)==='home'?'主场':'客场'; }
    function regularHomeChanceSwing(index=seasonState.played) { return regularVenueAt(index)==='home'?.02:-.02; }

    function simulateIllnessRestRegularMatch(resumeFast=false) {
      if(seasonState.played>=seasonState.total||careerState.illnessRestGames<=0)return;
      const idx=seasonState.played,opponent=seasonState.opponents[idx],venue=regularVenueAt(idx);
      const ourPower=teamDisplayPower(careerState.starters)-2.4;
      const theirPower=teamDisplayPower(createRoster(opponent,false));
      const chance=clamp(.53+(ourPower-theirPower)*.021+(venue==='home'?.02:-.02),.24,.80);
      const won=Math.random()<chance;
      seasonState.results[idx]=won?'win':'loss';seasonState.played++;seasonState.gamesMissed++;careerState.illnessRestGames--;
      if(won)seasonState.wins++;else seasonState.losses++;
      careerState.condition=clamp(careerState.condition+5,0,100);
      seasonState.eventHistory.push({id:`illness-rest-${careerState.seasonYear}-${idx}`,icon:'🤒',title:'因病缺席',choice:'休息恢复',summary:`队伍在你缺席的${venue==='home'?'主场':'客场'}比赛中${won?'取胜':'失利'}；本次不计入伤病记录`,afterMatch:seasonState.played});
      const eventNow=markSeasonEventDue();
      document.getElementById('seasonSimNote').textContent=`第 ${seasonState.played} 场：你因病缺席，队伍${won?'赢下':'输掉'}了${venue==='home'?'主场':'客场'}比赛。本次不会计入伤病次数。`;
      renderSeason();showScreen('season');
      if(seasonState.played>=seasonState.total){seasonState.simulating=false;setTimeout(openRegularSeasonAwards,360);return;}
      if(eventNow){if(resumeFast)window.__OWL_RUNTIME?.simulation?.pauseFast?.();else seasonState.simulating=false;setTimeout(openScheduledSeasonEvent,180);return;}
      if(resumeFast){seasonState.simulating=true;seasonState.timer=setTimeout(fastSeasonStep,420);}
    }

    function openNextSeasonMatch() {
      if (seasonState.eventDue) { openScheduledSeasonEvent(); return; }
      if (careerState.illnessRestGames>0) { simulateIllnessRestRegularMatch(false); return; }
      if (shouldTriggerInjuryInquiry('regular')) { openInjuryInquiry('regular'); return; }
      if (seasonState.played>=seasonState.total || seasonState.simulating || seasonState.currentEvent) return;
      if(!gameSettings.matchDetailsEnabled) { simulateSingleRegularMatch(); return; }
      const opponent=seasonState.opponents[seasonState.played];
      const venue=regularVenueAt(seasonState.played);
      matchState.homeTeam=careerState.team;
      setupMatch(false,3,{playerVenue:venue,mapSelectionEnabled:false});
      matchState.awayTeam=opponent;
      matchState.awayRoster=createRoster(opponent,false);
      const careerBonus=applyCareerMatchModifiers(matchState.homeRoster);
      matchState.logs=[{map:'赛前',side:'event',text:`常规赛第 ${seasonState.played+1} 场（${venue==='home'?'主场':'客场'}）：${careerState.team.name} 对阵 ${opponent.name}。主场拥有小幅状态加成，当前职业状态带来 ${careerBonus>=0?'+':''}${careerBonus.toFixed(1)} 的个人发挥修正。`}];
      matchState.currentTactics=null;
      seasonState.pendingManualIndex=seasonState.played;
      seasonState.manualRecorded=false;
      matchState.context='regular';
      document.getElementById('matchKicker').textContent='Regular Season · Key Match';
      document.getElementById('matchTitle').textContent=`常规赛第 ${seasonState.played+1} 场`;
      document.getElementById('matchDesc').textContent='比赛会在关键团战暂停，由你做决定。';
      document.getElementById('matchWeekText').textContent=`第 ${seasonState.played+1} 轮 · ${venue==='home'?'主场':'客场'}`;
      renderMatch();
      showScreen('match');
    }

    function recordManualSeasonMatch() {
      if (seasonState.pendingManualIndex==null || seasonState.manualRecorded || !matchState.finished) return;
      const won=matchState.homeScore>matchState.awayScore;
      const idx=seasonState.pendingManualIndex;
      seasonState.results[idx]=won?'win':'loss';
      seasonState.played++;
      if (won) seasonState.wins++; else seasonState.losses++;
      const user=matchState.homeRoster.find(p=>p.isUser);
      const vals=user ? (matchState.ratings.home[user.id]||[]) : [];
      const baseAvg=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:(won?7.2:6.4);
      const avg=clamp(baseAvg+careerState.nextRatingBonus,4.0,10.0);
      seasonState.userRatings.push(avg);
      const decisions=matchState.results.reduce((sum,r)=>sum+(r.decisions||0),0);
      seasonState.decisionTotal+=decisions;
      seasonState.decisionSuccess+=Math.round(decisions*clamp((avg-4.5)/5,0.25,.9));
      seasonState.manualRecorded=true;
      seasonState.pendingManualIndex=null;
      updateCareerAfterMatch(won,avg);
      try{ window.__OWL_V20_ALPHA1?.afterManualRegularMatch?.({won,rating:avg,index:idx,opponent:seasonState.opponents?.[idx]||null}); }catch(_){}
      markSeasonEventDue();
      renderSeason();
    }

    function getRegularSeasonWinChance(ourRoster,theirRoster,careerBonus=0,venue='home') {
      const diff=teamDisplayPower(ourRoster)-teamDisplayPower(theirRoster)+careerBonus*.85;
      const projectedRank=careerState.rank||10;
      const teamContext=clamp((11-projectedRank)*.003,-.018,.018);
      const rookieBuffer=careerState.careerYears===1?.012:0;
      // 玩家队伍默认略有竞争力；阵容、状态与队伍定位仍会明显改变结果。
      const venueSwing=venue==='home'?.02:-.02;
      const baseChance=clamp(.56+diff*.022+teamContext+rookieBuffer+venueSwing,.28,.84);
      const hook=window.__OWL_V20_ALPHA1?.adjustRegularChance;
      return typeof hook==='function' ? hook(baseChance,{ourRoster,theirRoster,careerBonus,venue,index:Number(seasonState.played||0),opponent:seasonState.opponents?.[seasonState.played]||null}) : baseChance;
    }

    function simulateSingleRegularMatch() {
      if(seasonState.played>=seasonState.total) return;
      const opponent=seasonState.opponents[seasonState.played];
      const ourRoster=careerState.starters.map(p=>({...p,attrs:{...p.attrs}}));
      const theirRoster=createRoster(opponent,false);
      const careerBonus=currentCareerMatchBonus();
      const venue=regularVenueAt(seasonState.played);
      const chance=getRegularSeasonWinChance(ourRoster,theirRoster,careerBonus,venue);
      const won=Math.random()<chance;
      const idx=seasonState.played;
      seasonState.results[idx]=won?'win':'loss';
      seasonState.played++;
      if(won) seasonState.wins++; else seasonState.losses++;
      const userOvr=Number(getMyOvr()==='--'?78:getMyOvr());
      const rating=clamp(6.3+(userOvr-78)*.055+(won?.38:-.18)+careerBonus*.08+careerState.nextRatingBonus+randomCentered(.75),4.4,9.7);
      seasonState.userRatings.push(rating);
      const decisions=rand(1,3);
      seasonState.decisionTotal+=decisions;
      seasonState.decisionSuccess+=Array.from({length:decisions},()=>Math.random()<clamp(.48+(userOvr-75)*.012,.35,.82)).filter(Boolean).length;
      updateCareerAfterMatch(won,rating);
      const eventNow=markSeasonEventDue();
      document.getElementById('seasonSimNote').textContent=`第 ${seasonState.played} 场${venue==='home'?'主场':'客场'}快速结算：${won?'胜利':'失利'}，个人评分 ${rating.toFixed(1)}。`;
      renderSeason(); showScreen('season');
      if(seasonState.played>=seasonState.total) { setTimeout(openRegularSeasonAwards,320); return; }
      if(eventNow) setTimeout(openScheduledSeasonEvent,180);
    }

    function toggleFastSeasonSimulation() {
      if (seasonState.simulating) {
        seasonState.simulating=false;
        if(seasonState.timer) clearTimeout(seasonState.timer);
        document.getElementById('seasonSimNote').textContent='模拟已暂停。';
        renderSeason();
        return;
      }
      if (seasonState.eventDue) {
        seasonState.resumeFastAfterEvent=true;
        openScheduledSeasonEvent();
        return;
      }
      if (shouldTriggerInjuryInquiry('regular')) {
        injuryState.resumeFast=true;
        openInjuryInquiry('regular');
        return;
      }
      if (seasonState.played>=seasonState.total) return;
      seasonState.simulating=true;
      document.getElementById('seasonSimNote').textContent='正在批量模拟 OWL 式 28 场常规赛。赛季分为 4 个 Stage，每个 Stage 7 场；前三个 Stage 结束后会暂停处理阶段赛。';
      renderSeason();
      fastSeasonStep();
    }

    function fastSeasonStep() {
      if(seasonState.simulating && careerState.illnessRestGames>0) { simulateIllnessRestRegularMatch(true); return; }
      if(seasonState.simulating && shouldTriggerInjuryInquiry('regular')) {
        seasonState.simulating=false;
        injuryState.resumeFast=true;
        openInjuryInquiry('regular');
        return;
      }
      if (!seasonState.simulating || seasonState.played>=seasonState.total) {
        seasonState.simulating=false;
        renderSeason();
        return;
      }
      const opponent=seasonState.opponents[seasonState.played];
      const ourRoster=careerState.starters.map(p=>({...p,attrs:{...p.attrs}}));
      const theirRoster=createRoster(opponent,false);
      const careerBonus=currentCareerMatchBonus();
      const venue=regularVenueAt(seasonState.played);
      const chance=getRegularSeasonWinChance(ourRoster,theirRoster,careerBonus,venue);
      const won=Math.random()<chance;
      seasonState.results[seasonState.played]=won?'win':'loss';
      seasonState.played++;
      if(won) seasonState.wins++; else seasonState.losses++;
      const userOvr=Number(getMyOvr()==='--'?78:getMyOvr());
      const rating=clamp(6.3+(userOvr-78)*.055+(won?.38:-.18)+careerBonus*.08+careerState.nextRatingBonus+randomCentered(.75),4.4,9.7);
      seasonState.userRatings.push(rating);
      const decisions=rand(1,3);
      seasonState.decisionTotal+=decisions;
      seasonState.decisionSuccess+=Array.from({length:decisions},()=>Math.random()<clamp(.48+(userOvr-75)*.012,.35,.82)).filter(Boolean).length;
      updateCareerAfterMatch(won,rating);
      const eventNow=markSeasonEventDue();
      document.getElementById('seasonSimNote').textContent=eventNow?`第 ${seasonState.played} 场${venue==='home'?'主场':'客场'}结束：${won?'胜利':'失利'}，随后发生了新的赛季事件。`:`第 ${seasonState.played} 场${venue==='home'?'主场':'客场'}结束：${won?'胜利':'失利'}，个人评分 ${rating.toFixed(1)}。`;
      renderSeason();
      if(seasonState.played>=seasonState.total) {
        seasonState.simulating=false;
        setTimeout(openRegularSeasonAwards,420);
        return;
      }
      if(eventNow) {
        window.__OWL_RUNTIME?.simulation?.pauseFast?.();
        setTimeout(openScheduledSeasonEvent,180);
        return;
      }
      seasonState.timer=setTimeout(fastSeasonStep,420);
    }


