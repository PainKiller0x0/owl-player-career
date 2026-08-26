/* ===== BUNDLE MODULE: systems/offseason.js ===== */
/* ==========================================================================
   MODULE: systems/offseason.js
   Offseason, training, retirement, role changes and transfer market
   Migrated from V6.2 lines 6951-7747; execution order is defined by manifest.json.
   ========================================================================== */
    const offseasonState = {
      active:false,
      phase:'review',
      roleTarget:null,
      roleDecision:null,
      offers:[],
      selectedOfferId:null,
      signedOffer:null,
      retirementDecision:null,
      ageTransitionApplied:false,
      trainingConfirmed:false,
      trainingPoints:0,
      trainingRemaining:0,
      trainingAllocations:{},
      trainingHistory:{},
      trainingBaseline:{},
      trainingBreakdown:null,
      ageChanges:{},
      showRetirement:false,
      roleOpportunity:false,
      contractExpired:false,
      contractContinued:false
    };

    const ROLE_TRANSITION_CANDIDATES = {
      '坦克':['战术支援','弹道输出'],
      '长枪输出':['弹道输出','输出支援'],
      '弹道输出':['长枪输出','坦克'],
      '输出支援':['战术支援','长枪输出'],
      '战术支援':['输出支援','坦克']
    };

    const ROLE_PRIMARY_KEY = {
      '坦克':'decision','长枪输出':'hitscan','弹道输出':'projectile','输出支援':'cooldown','战术支援':'shotcalling'
    };

    function getSeasonInjuryCount(year=careerState.seasonYear) {
      return (careerState.injuryHistory||[]).filter(item=>item.year===year).length;
    }

    function shouldShowRetirementDecision() {
      if(careerState.age>=30) return true;
      if(careerState.age>=23) return true;
      return getSeasonInjuryCount()>=5 || (careerState.injuryHistory||[]).length>=20;
    }

    function advanceContractAfterSeason() {
      if(!careerState.contract || careerState.contractTickYear===careerState.seasonYear) return;
      careerState.contract.remaining=Math.max(0,(careerState.contract.remaining??careerState.contract.years??1)-1);
      careerState.contractTickYear=careerState.seasonYear;
    }

    function shouldOfferRolePlanning(target) {
      if(careerState.age<19) return false;
      // RC23：第一次拒绝不再直接让转位提案消失三年。
      // 只有“连续两次明确拒绝”后，教练组才会识趣地连续三个赛季闭嘴。
      const cooldownUntil=Number(careerState.roleDeclineCooldownUntil||0);
      if(cooldownUntil && Number(careerState.seasonYear)<=cooldownUntil) return false;
      const currentFit=calculateRoleFit(state.role);
      const targetFit=calculateRoleFit(target);
      const avg=getSeasonAverageRating();
      let chance=.10;
      if(careerState.positionTrial===target) chance=.78;
      if(targetFit-currentFit>=5) chance+=.22;
      if(avg<6.35) chance+=.15;
      if(careerState.age>=26) chance+=.12;
      if(careerState.contract?.remaining===0) chance+=.06;
      return Math.random()<clamp(chance,.06,.82);
    }

    function getOffseasonOrder() {
      const order=['review'];
      if(offseasonState.showRetirement) order.push('retirement');
      order.push('training');
      if(offseasonState.roleOpportunity) order.push('role');
      order.push('market');
      return order;
    }

    function enterOffseason() {
      if(seasonState.played<seasonState.total) {
        if(window.__OWL_V16_MODAL?.result)window.__OWL_V16_MODAL.result({icon:'📅',kicker:'SEASON · 赛季进度',title:'常规赛尚未结束',body:'<p>完成当前常规赛后才能进入休赛期。</p>',confirmText:'返回赛季'});else console.warn('常规赛尚未结束。');
        return;
      }
      const qualified=estimateSeasonRank()<=8;
      const playoffDone=['champion','runnerup','eliminated'].includes(playoffState.round);
      if(qualified && !playoffDone) {
        if(!playoffState.active) setupPlayoffs();
        renderPlayoffs();
        showScreen('playoff');
        return;
      }
      if(!offseasonState.active) setupOffseason();
      renderOffseason();
      showScreen('offseason');
    }

    function setupOffseason() {
      offseasonState.active=true;
      offseasonState.phase='review';
      offseasonState.roleDecision=null;
      offseasonState.retirementDecision=null;
      offseasonState.ageTransitionApplied=false;
      offseasonState.trainingConfirmed=false;
      offseasonState.trainingPoints=0;
      offseasonState.trainingRemaining=0;
      offseasonState.trainingAllocations={};
      offseasonState.trainingHistory={};
      offseasonState.trainingBaseline={};
      offseasonState.trainingBreakdown=null;
      offseasonState.ageChanges={};
      recordCompletedCareerSeason();
      advanceContractAfterSeason();
      offseasonState.offers=[];
      offseasonState.selectedOfferId=null;
      offseasonState.signedOffer=null;
      offseasonState.contractContinued=false;
      offseasonState.contractExpired=!careerState.contract || careerState.contract.remaining<=0;
      offseasonState.showRetirement=shouldShowRetirementDecision();
      const candidates=ROLE_TRANSITION_CANDIDATES[state.role]||ROLES.map(r=>r.name).filter(r=>r!==state.role);
      offseasonState.roleTarget=[...candidates].sort((a,b)=>calculateRoleFit(b)-calculateRoleFit(a))[0];
      offseasonState.roleOpportunity=isRoleTrainingUnlocked()&&shouldOfferRolePlanning(offseasonState.roleTarget);
    }

    function calculateRoleFit(role) {
      const weights=ROLE_WEIGHTS[role]||{};
      let total=0, used=0;
      Object.entries(weights).forEach(([key,w])=>{
        total+=(state.locked[key]?.value||70)*w;
        used+=w;
      });
      const pool=state.locked.pool?.value||70;
      return Math.round(total/Math.max(.01,used)+(pool-75)*.05);
    }

    function getLastSeasonResultLabel() {
      if(playoffState.round==='champion') return '总冠军';
      if(playoffState.round==='runnerup') return '联赛亚军';
      if(playoffState.round==='eliminated') return getPlayoffResultLabel();
      return `常规赛第 ${estimateSeasonRank()} 名`;
    }

    function setOffseasonPhase(phase) {
      offseasonState.phase=phase;
      if(phase==='market' && offseasonState.contractExpired && !offseasonState.offers.length) generateContractOffers();
      renderOffseason();
    }

    function renderOffseasonSteps() {
      const order=getOffseasonOrder();
      const current=order.indexOf(offseasonState.phase);
      document.querySelectorAll('[data-off-step]').forEach(el=>{
        const idx=order.indexOf(el.dataset.offStep);
        el.classList.toggle('skipped',idx<0);
        el.classList.toggle('active',idx===current);
        el.classList.toggle('done',idx>=0 && (idx<current || offseasonState.phase==='signed'));
        if(idx>=0 && el.childNodes[0]) el.childNodes[0].nodeValue=String(idx+1).padStart(2,'0');
        if(el.dataset.offStep==='market') el.querySelector('strong').textContent=offseasonState.contractExpired?'续约 / 转会':'履行合同';
      });
    }

    function renderOffseason() {
      document.getElementById('offseasonYearText').textContent=`OFFSEASON · ${careerState.seasonYear}`;
      document.getElementById('offseasonResultText').textContent=getLastSeasonResultLabel();
      renderOffseasonSteps();
      const wrap=document.getElementById('offseasonContent');
      if(offseasonState.phase==='review') renderOffseasonReview(wrap);
      else if(offseasonState.phase==='retirement') renderRetirementDecision(wrap);
      else if(offseasonState.phase==='training') renderTrainingCamp(wrap);
      else if(offseasonState.phase==='role') renderRolePlanning(wrap);
      else if(offseasonState.phase==='market') renderContractMarket(wrap);
      else renderSigningComplete(wrap);
    }

    function renderOffseasonReview(wrap) {
      const avg=seasonState.userRatings.length?seasonState.userRatings.reduce((a,b)=>a+b,0)/seasonState.userRatings.length:0;
      const decision=seasonState.decisionTotal?seasonState.decisionSuccess/seasonState.decisionTotal*100:0;
      const market=Math.round(Number(getMyOvr()==='--'?78:getMyOvr())*.55+avg*4.2+careerState.popularity*.08+(playoffState.round==='champion'?8:playoffState.round==='runnerup'?5:0));
      const coachLine=avg>=7.6?'教练认为你已经具备核心价值。':avg>=6.8?'教练认可你的稳定性，但仍希望你扩大比赛影响力。':'教练对你的评价很直接：先证明自己能稳定留在首发。';
      wrap.innerHTML=`
        <div class="offseason-kicker">EXIT MEETING · 赛季总结会</div>
        <h3>俱乐部给出了这一年的评价</h3>
        <p>这不是颁奖典礼。管理层会把成绩、个人表现和更衣室影响放在一起，决定是否继续把位置交给你。</p>
        <div class="review-grid">
          <div class="review-item"><span>赛季战绩</span><strong>${seasonState.wins}-${seasonState.losses}</strong></div>
          <div class="review-item"><span>平均评分</span><strong>${avg?avg.toFixed(1):'未出场'}</strong></div>
          <div class="review-item"><span>决策成功</span><strong>${decision?decision.toFixed(0)+'%':'—'}</strong></div>
          <div class="review-item"><span>市场评价</span><strong>${market}</strong></div>
          <div class="review-item"><span>当前年龄</span><strong>${careerState.age} 岁</strong></div>
          <div class="review-item"><span>生涯赛季</span><strong>${careerState.careerYears}</strong></div>
        </div>
        <div class="meeting-note"><strong>教练组意见：</strong>${coachLine}<br><strong>合同情况：</strong>${careerState.contract?(careerState.contract.remaining>0?`现有合同仍剩 ${careerState.contract.remaining} 年，本休赛期继续履行，暂不进入自由市场。`:`合同已经到期，你将进入续约与转会市场。`):'当前没有有效合同，你将进入自由市场。'}</div>
        <div class="offer-actions"><button class="primary-btn" id="continueRolePlanBtn">继续职业规划 →</button></div>`;
      document.getElementById('continueRolePlanBtn').addEventListener('click',()=>{
        if(offseasonState.showRetirement) setOffseasonPhase('retirement');
        else { prepareTrainingCamp(careerState.age+1); setOffseasonPhase('training'); }
      });
    }

    const AGE_BASE_TRAINING_POINTS = {
      17:8,18:8,19:7,20:7,21:6,22:5,
      23:2,24:2,25:2,26:1,27:1,28:1,29:0,30:0
    };

    const AGE_NATURAL_CHANGES = {
      23:{hitscan:-1,projectile:-1,mechanics:-2,survival:-1,awareness:1,decision:1},
      24:{hitscan:-1,projectile:-1,mechanics:-2,survival:-1,clutch:-1,cooldown:-1,awareness:1,decision:1,positioning:1},
      25:{hitscan:-2,projectile:-1,mechanics:-2,survival:-1,clutch:-1,cooldown:-1,awareness:1,decision:1,positioning:1,shotcalling:1},
      26:{hitscan:-2,projectile:-2,mechanics:-2,survival:-2,clutch:-1,cooldown:-1,awareness:1,decision:1,positioning:1,shotcalling:1,synergy:1},
      27:{hitscan:-2,projectile:-2,mechanics:-3,survival:-2,clutch:-2,cooldown:-1,awareness:1,decision:2,positioning:1,shotcalling:1,synergy:1,pool:1},
      28:{hitscan:-3,projectile:-2,mechanics:-3,survival:-2,clutch:-2,cooldown:-2,awareness:1,decision:2,positioning:1,shotcalling:1,synergy:1,pool:1},
      29:{hitscan:-3,projectile:-3,mechanics:-4,survival:-2,clutch:-2,cooldown:-2,awareness:1,decision:2,positioning:1,shotcalling:2,synergy:1,pool:1},
      30:{hitscan:-4,projectile:-3,mechanics:-4,survival:-3,clutch:-2,cooldown:-2,awareness:1,decision:2,positioning:1,shotcalling:2,synergy:1,pool:1}
    };

    function growthStageForAge(age) {
      if(age<=18) return '天赋兑现期';
      if(age<=21) return '高速成长';
      if(age===22) return '能力巅峰';
      if(age<=25) return '经验增长 / 反应微降';
      if(age<=28) return '经验成熟 / 机械下滑';
      return '生涯暮年';
    }

    function growthCurveHeight(age) {
      if(age<=22) return 42 + (age-16)*9;
      return Math.max(20,96-(age-22)*8);
    }

    const CAREER_ROLE_STATS = {
      '坦克':{elim:14.0,death:6.4,assist:18.0,first:2.5},
      '长枪输出':{elim:21.5,death:5.8,assist:8.2,first:5.1},
      '弹道输出':{elim:19.4,death:6.1,assist:10.4,first:4.2},
      '输出支援':{elim:13.2,death:5.4,assist:16.8,first:2.9},
      '战术支援':{elim:9.8,death:5.0,assist:21.5,first:2.0}
    };

    function buildSeasonCareerStats(record,playoffSeries=0) {
      const profile=CAREER_ROLE_STATS[record.role]||CAREER_ROLE_STATS['长枪输出'];
      const playoffAppearances=playoffState.results.filter(x=>!x.rested&&!x.dnp&&(x.mapsPlayed==null||Number(x.mapsPlayed)>0)).length;
      const appearances=seasonState.userRatings.length+playoffAppearances;
      const series=seasonState.played+playoffSeries;
      if(!appearances){
        return {series,appearances:0,maps:0,missed:seasonState.gamesMissed||0,eliminations:0,deaths:0,assists:0,firstPicks:0,decisionRate:null};
      }
      const maps=Math.max(3,Math.round(appearances*(3.7+(record.rating-6.5)*.12)));
      const scale=clamp(1+(record.rating-6.7)*.075+(record.ovr-80)*.006,.72,1.34);
      const deathScale=clamp(1-(record.rating-6.7)*.045-(record.ovr-80)*.0025,.72,1.22);
      const decisionRate=seasonState.decisionTotal?seasonState.decisionSuccess/seasonState.decisionTotal*100:null;
      return {
        series,appearances,maps,missed:seasonState.gamesMissed||0,
        eliminations:Math.round(profile.elim*scale*maps),
        deaths:Math.round(profile.death*deathScale*maps),
        assists:Math.round(profile.assist*scale*maps),
        firstPicks:Math.round(profile.first*scale*maps),
        decisionRate:decisionRate==null?null:clamp(decisionRate,25,95)
      };
    }

    function deriveSeasonHonors(record,index) {
      const honors=[];
      const awards=ensureRegularSeasonAwards();
      if(record.rating>=7.05) honors.push('全明星');
      if(awards.mvp.userRank===1) honors.push('MVP');
      if(awards.roleStars[state.role]?.userRank===1) honors.push('职责之星');
      if(awards.community.userRank===1) honors.push('社区之星');
      if(record.rating>=7.95) honors.push('最佳阵容');
      if(awards.rookie.userEligible && awards.rookie.userRank===1) honors.push('年度最佳新秀');
      else if(index===0 && record.rating>=6.7) honors.push('最佳新秀阵容');
      if(record.result==='总冠军') honors.push('总冠军');
      if(record.result==='总冠军' && playoffState.fmvp?.isUser) honors.push('总决赛MVP');
      return [...new Set(honors)];
    }

    function recordCompletedCareerSeason() {
      normalizeCareerArchiveTeams();
      if(careerState.careerArchive.some(x=>x.year===careerState.seasonYear)) return;
      const avg=seasonState.userRatings.length?seasonState.userRatings.reduce((a,b)=>a+b,0)/seasonState.userRatings.length:0;
      const playoffRatings=playoffState.results.filter(x=>x.rating>0).map(x=>x.rating);
      const record={
        year:careerState.seasonYear,
        age:careerState.age,
        team:careerTeamDisplay(careerState.team),
        role:state.role,
        wins:seasonState.wins,
        losses:seasonState.losses,
        regularRank:estimateSeasonRank(),
        rating:avg,
        playoffRating:playoffRatings.length?playoffRatings.reduce((a,b)=>a+b,0)/playoffRatings.length:0,
        playoffSeries:playoffState.results.length,
        ovr:Number(getMyOvr()==='--'?0:getMyOvr()),
        result:getLastSeasonResultLabel(),
        fmvp:playoffState.fmvp?JSON.parse(JSON.stringify(playoffState.fmvp)):null
      };
      record.stats=buildSeasonCareerStats(record,record.playoffSeries);
      record.awards=JSON.parse(JSON.stringify(ensureRegularSeasonAwards()));
      record.honors=deriveSeasonHonors(record,careerState.careerArchive.length);
      careerState.careerArchive.push(record);
      careerState.peakOvr=Math.max(careerState.peakOvr,record.ovr);
    }

    function setCareerAttributeValue(key,value) {
      if(!state.locked[key]) state.locked[key]={value:75,player:'休赛期训练',team:careerState.team?.name||'职业生涯',role:state.role};
      state.locked[key].value=clamp(value,45,99);
      const user=careerState.starters.find(p=>p.isUser);
      if(user) {
        user.attrs[key]=state.locked[key].value;
        user.overall=Math.round(Object.values(user.attrs).reduce((a,b)=>a+b,0)/ATTRS.length);
      }
    }

    function getSeasonAverageRating() {
      return seasonState.userRatings.length?seasonState.userRatings.reduce((a,b)=>a+b,0)/seasonState.userRatings.length:6.5;
    }

    function getTrainingPointBreakdown(nextAge) {
      const base=AGE_BASE_TRAINING_POINTS[nextAge]??0;
      const avg=getSeasonAverageRating();
      const winRate=seasonState.total?seasonState.wins/seasonState.total:.5;
      const ratingBonus=clamp((avg-6.5)*.12,-.12,.24);
      const seasonBonus=winRate>=.70?.12:winRate>=.60?.09:winRate>=.52?.05:winRate>=.44?.01:winRate>=.35?-.04:-.08;
      const playoffRatings=(playoffState.results||[]).map(result=>Number(result.rating)).filter(Number.isFinite);
      const playoffAverage=playoffRatings.length?playoffRatings.reduce((sum,rating)=>sum+rating,0)/playoffRatings.length:0;
      const playoffPerformanceBonus=playoffAverage>=8.2?.08:playoffAverage>=7.6?.05:playoffAverage>=7.0?.02:0;
      const achievementBase=playoffState.round==='champion'?.18:playoffState.round==='runnerup'?.12:getPlayoffResultLabel()==='季后赛季军'?.08:estimateSeasonRank()<=8?.04:0;
      const achievementBonus=achievementBase+playoffPerformanceBonus;
      const multiplier=clamp(1.34+ratingBonus+seasonBonus+achievementBonus,1.2,1.8);
      const total=clamp(Math.max(3,Math.round(base*multiplier)),3,18);
      return {base,total,multiplier:Number(multiplier.toFixed(2)),avg,winRate,ratingBonus,seasonBonus,achievementBonus,playoffPerformanceBonus};
    }

    function applyAgeNaturalChanges(nextAge) {
      const changes=AGE_NATURAL_CHANGES[nextAge]||{};
      Object.entries(changes).forEach(([key,delta])=>setCareerAttributeValue(key,(state.locked[key]?.value||75)+delta));
      return {...changes};
    }

    function prepareTrainingCamp(nextAge) {
      if(offseasonState.ageTransitionApplied) return;
      offseasonState.ageChanges=applyAgeNaturalChanges(nextAge);
      careerState.age=nextAge;
      offseasonState.trainingBreakdown=getTrainingPointBreakdown(nextAge);
      offseasonState.trainingPoints=offseasonState.trainingBreakdown.total;
      offseasonState.trainingRemaining=offseasonState.trainingPoints;
      offseasonState.trainingAllocations=Object.fromEntries(ATTRS.map(a=>[a.key,0]));
      offseasonState.trainingHistory=Object.fromEntries(ATTRS.map(a=>[a.key,[]]));
      offseasonState.trainingBaseline=Object.fromEntries(ATTRS.map(a=>[a.key,state.locked[a.key]?.value||75]));
      offseasonState.ageTransitionApplied=true;
      careerState.peakOvr=Math.max(careerState.peakOvr,Number(getMyOvr()==='--'?0:getMyOvr()));
      renderLockedAttrs();
      renderBuildSummary();
    }

    function trainingPointCost(value) {
      if(value>=95) return 4;
      if(value>=90) return 3;
      if(value>=85) return 2;
      return 1;
    }

    function canSpendTrainingPoint() {
      return ATTRS.some(attr=>{
        const value=state.locked[attr.key]?.value||75;
        const count=offseasonState.trainingAllocations[attr.key]||0;
        return value<99 && count<4 && trainingPointCost(value)<=offseasonState.trainingRemaining;
      });
    }

    function allocateTrainingPoint(key) {
      const value=state.locked[key]?.value||75;
      const count=offseasonState.trainingAllocations[key]||0;
      const cost=trainingPointCost(value);
      if(value>=99 || count>=4 || offseasonState.trainingRemaining<cost) return;
      offseasonState.trainingRemaining-=cost;
      offseasonState.trainingAllocations[key]=count+1;
      offseasonState.trainingHistory[key].push(cost);
      setCareerAttributeValue(key,value+1);
      renderOffseason();
    }

    function refundTrainingPoint(key) {
      const history=offseasonState.trainingHistory[key]||[];
      if(!history.length) return;
      const refund=history.pop();
      offseasonState.trainingRemaining+=refund;
      offseasonState.trainingAllocations[key]=Math.max(0,(offseasonState.trainingAllocations[key]||0)-1);
      setCareerAttributeValue(key,(state.locked[key]?.value||75)-1);
      renderOffseason();
    }

    function resetTrainingPoints() {
      Object.entries(offseasonState.trainingBaseline).forEach(([key,value])=>setCareerAttributeValue(key,value));
      offseasonState.trainingRemaining=offseasonState.trainingPoints;
      offseasonState.trainingAllocations=Object.fromEntries(ATTRS.map(a=>[a.key,0]));
      offseasonState.trainingHistory=Object.fromEntries(ATTRS.map(a=>[a.key,[]]));
      renderOffseason();
    }

    function renderAgeChangeTags() {
      const entries=Object.entries(offseasonState.ageChanges||{});
      if(!entries.length) return '<span class="age-change-tag">本年龄段没有强制能力变化，成长主要来自训练点。</span>';
      return entries.map(([key,delta])=>`<span class="age-change-tag ${delta>0?'up':'down'}">${attrName(key)} ${delta>0?'+':''}${delta}</span>`).join('');
    }

    function renderTrainingCamp(wrap) {
      const b=offseasonState.trainingBreakdown||getTrainingPointBreakdown(careerState.age);
      const confirmDisabled=offseasonState.trainingRemaining>0 && canSpendTrainingPoint();
      wrap.innerHTML=`<div class="offseason-kicker">TRAINING CAMP · 休赛期训练营</div>
        <h3>${careerState.age}岁训练计划</h3>
        <p>年轻选手基础训练点更多；赛季评分、常规赛表现和最终成绩共同决定 1.2～1.8 倍成长倍率。</p>
        <div class="training-summary-grid">
          <div class="training-summary-item"><span>年龄基础</span><strong>${b.base}</strong></div>
          <div class="training-summary-item ${b.ratingBonus>=0?'good':'bad'}"><span>个人评分</span><strong>${b.avg.toFixed(1)} / ${b.ratingBonus>=0?'+':''}${b.ratingBonus.toFixed(2)}</strong></div>
          <div class="training-summary-item ${b.seasonBonus>=0?'good':'bad'}"><span>常规赛表现</span><strong>${Math.round(b.winRate*100)}% / ${b.seasonBonus>=0?'+':''}${b.seasonBonus.toFixed(2)}</strong></div>
          <div class="training-summary-item ${b.achievementBonus>0?'good':''}"><span>赛季成绩</span><strong>${b.achievementBonus>0?'+':''}${b.achievementBonus.toFixed(2)}${b.playoffPerformanceBonus?` · 季后赛表现 +${b.playoffPerformanceBonus.toFixed(2)}`:''}</strong></div>
        </div>
        <div class="training-points-card"><strong>${offseasonState.trainingRemaining} / ${offseasonState.trainingPoints}</strong><span>剩余训练点数</span><div class="training-breakdown">基础 ${b.base} 点 × ${b.multiplier.toFixed(2)} 成长倍率 = ${b.total} 点</div></div>
        <div class="meeting-note"><strong>年龄自然变化：</strong>反应与操作可能下滑；意识、决策和指挥仍可能增长。</div>
        <div class="age-change-list">${renderAgeChangeTags()}</div>
        <div class="training-attr-list">${ATTRS.map(attr=>{
          const value=state.locked[attr.key]?.value||75;
          const rank=getRank(value).label;
          const count=offseasonState.trainingAllocations[attr.key]||0;
          const cost=trainingPointCost(value);
          const plusDisabled=value>=99 || count>=4 || offseasonState.trainingRemaining<cost;
          const minusDisabled=!(offseasonState.trainingHistory[attr.key]||[]).length;
          const natural=Number(offseasonState.ageChanges?.[attr.key]||0);
          const naturalText=natural===0?'自然 ±0':`自然 ${natural>0?'+':''}${natural}`;
          return `<div class="training-attr-row">
            <div class="training-attr-name"><strong>${attr.name}</strong><span><em class="training-natural-delta ${natural>0?'up':natural<0?'down':'flat'}">${naturalText}</em> · 手动 +${count}</span></div>
            <div class="training-bar"><i style="width:${value}%"></i></div>
            <div class="training-value"><strong>${value}</strong><span>${rank}</span></div>
            <div class="training-controls"><button class="training-control minus" data-train-minus="${attr.key}" ${minusDisabled?'disabled':''}>−</button><button class="training-control plus" data-train-plus="${attr.key}" ${plusDisabled?'disabled':''}>+</button></div>
            <div class="training-cost">下一级消耗 ×${cost} · 单项最多提升4次</div>
          </div>`;
        }).join('')}</div>
        <div class="training-actions"><button class="secondary-btn" id="resetTrainingBtn">↩ 重置</button><button class="primary-btn" id="confirmTrainingBtn" ${confirmDisabled?'disabled':''}>✅ 确认加点${offseasonState.trainingRemaining?`（剩余${offseasonState.trainingRemaining}）`:''}</button></div>`;
      wrap.querySelectorAll('[data-train-plus]').forEach(btn=>btn.addEventListener('click',()=>allocateTrainingPoint(btn.dataset.trainPlus)));
      wrap.querySelectorAll('[data-train-minus]').forEach(btn=>btn.addEventListener('click',()=>refundTrainingPoint(btn.dataset.trainMinus)));
      document.getElementById('resetTrainingBtn').addEventListener('click',resetTrainingPoints);
      document.getElementById('confirmTrainingBtn').addEventListener('click',confirmTrainingCamp);
    }

    function confirmTrainingCamp() {
      if(offseasonState.trainingRemaining>0 && canSpendTrainingPoint()) return;
      offseasonState.trainingConfirmed=true;
      careerState.peakOvr=Math.max(careerState.peakOvr,Number(getMyOvr()==='--'?0:getMyOvr()));
      setOffseasonPhase(offseasonState.roleOpportunity?'role':'market');
    }

    function renderGrowthCurve() {
      return Array.from({length:15},(_,i)=>16+i).map(age=>{
        const h=growthCurveHeight(age);
        return `<div class="curve-year ${age===careerState.age?'current':''} ${age===22?'peak':''}"><i style="height:${h}px"></i><small>${age}</small></div>`;
      }).join('');
    }

    function renderRetirementDecision(wrap) {
      const age=careerState.age;
      const currentOvr=getMyOvr();
      const seasonInjuries=getSeasonInjuryCount();
      const totalInjuries=(careerState.injuryHistory||[]).length;
      if(age>=30) {
        wrap.innerHTML=`<div class="offseason-kicker">MANDATORY RETIREMENT · 强制退役</div>
          <h3>30岁，联盟生涯到站</h3>
          <p>完成30岁赛季后强制退役。</p>
          <div class="career-decision-meta"><div class="career-decision-item"><span>退役年龄</span><strong>30</strong><em>强制退役</em></div><div class="career-decision-item"><span>最终总评</span><strong>${currentOvr}</strong><em>${state.role}</em></div><div class="career-decision-item"><span>完整赛季</span><strong>${careerState.careerYears}</strong><em>职业生涯</em></div></div>
          <div class="offer-actions"><button class="primary-btn" id="forcedRetireBtn">确认退役 →</button></div>`;
        document.getElementById('forcedRetireBtn').addEventListener('click',()=>retireCareer('30岁强制退役'));
        return;
      }
      const nextAge=age+1;
      const base=getTrainingPointBreakdown(nextAge).total;
      const injuryTriggered=age<23;
      wrap.innerHTML=`<div class="offseason-kicker">CAREER DECISION · 退役决定</div>
        <h3>${injuryTriggered?'伤病让你重新考虑职业生涯':`${age}岁赛季结束，你还要继续吗？`}</h3>
        <p>${injuryTriggered?`你本赛季记录了 ${seasonInjuries} 次伤病决定，生涯累计 ${totalInjuries} 次。系统因此提前开放退役选择。`:`从23岁开始，赛季结束后才会主动询问退役。继续生涯将进入${nextAge}岁训练营。`}</p>
        <div class="career-decision-meta"><div class="career-decision-item"><span>当前年龄</span><strong>${age}</strong><em>OVR ${currentOvr}</em></div><div class="career-decision-item"><span>下一赛季</span><strong>${nextAge}</strong><em>基础训练点约 ${base}</em></div><div class="career-decision-item"><span>生涯伤病</span><strong>${totalInjuries}</strong><em>本季 ${seasonInjuries}</em></div></div>
        <div class="retire-choice-grid">
          <button class="retire-choice" data-retire-choice="continue"><strong>继续职业生涯</strong><span>进入${nextAge}岁训练营，自主分配训练点。${nextAge===30?'这将是最后一个赛季。':''}</span></button>
          <button class="retire-choice" data-retire-choice="retire"><strong>宣布退役</strong><span>结束当前生涯，保留战绩、荣誉、位置变化和最终属性。</span></button>
        </div>`;
      wrap.querySelectorAll('[data-retire-choice]').forEach(btn=>btn.addEventListener('click',()=>resolveRetirementDecision(btn.dataset.retireChoice)));
    }

    function resolveRetirementDecision(choice) {
      offseasonState.retirementDecision=choice;
      if(choice==='retire') {
        retireCareer(`${careerState.age}岁主动退役`);
        return;
      }
      prepareTrainingCamp(careerState.age+1);
      setOffseasonPhase('training');
    }

    function careerResultScore(record) {
      const playoffScore={'总冠军':10000,'联赛亚军':9000,'季后赛季军':8000,'季后赛四强':7000,'季后赛六强':6000,'季后赛八强':5000};
      if(playoffScore[record.result]) return playoffScore[record.result];
      const rank=record.regularRank||Number((record.result||'').match(/第\s*(\d+)\s*名/)?.[1])||20;
      return 100-rank;
    }

    function bestCareerResult() {
      const archive=careerState.careerArchive;
      if(!archive.length) return '无完整赛季';
      return archive.reduce((best,current)=>careerResultScore(current)>careerResultScore(best)?current:best,archive[0]).result;
    }

    function retireCareer(reason) {
      const matchDetailJustUnlocked=unlockMatchDetailsSetting();
      unlockRoleTrainingSetting();
      careerState.retired=true;
      careerState.retirementReason=reason;
      offseasonState.active=false;
      renderRetirementScreen();
      showScreen('retirement');
      if(matchDetailJustUnlocked) setTimeout(()=>{ els.settingsHint.textContent='已解锁比赛详情设置。重新开始职业生涯后，可在右下角设置中开启。'; const copy=document.getElementById('retirementCopy'); if(copy) copy.textContent+=' 已解锁「比赛详情」设置，新角色可自行开启完整比赛。'; },80);
      setTimeout(openRetirementPressConference,180);
    }

    function getRetirementSummaryData() {
      const archive=normalizeCareerArchiveTeams(); const totals=getCareerTotals(); const honors=getHonorCounts();
      const favorite=Object.entries(archive.reduce((m,r)=>(m[r.team]=(m[r.team]||0)+1,m),{})).sort((a,b)=>b[1]-a[1])[0]?.[0]||careerTeamDisplay(careerState.team)||'联盟';
      const championships=honors['总冠军']||0; const mvps=honors['MVP']||0; const fmvp=honors['总决赛MVP']||0; const allstars=honors['全明星']||0;
      const historyScore=Math.round((careerState.peakOvr||0)*1.1+championships*40+mvps*28+fmvp*24+allstars*6+archive.length*4);
      return {archive,totals,honors,favorite,championships,mvps,fmvp,allstars,historyScore};
    }

    function openRetirementPressConference() {
      const d=getRetirementSummaryData();
      const memory=d.archive.length>2?d.archive[Math.max(0,d.archive.length-2)]:d.archive[0];
      els.retirementPressContent.innerHTML=`<h2>退役发布会</h2><div class="retirement-press-body"><p>你讲起自己职业生涯里最难忘的一段经历。${memory?`那是 ${memory.year} 赛季，你代表 <strong>${careerTeamDisplay(memory.team)}</strong> 以 ${memory.role} 身份完成了一个 ${memory.result} 的赛季。`:''}</p><p>你说，职业生涯并不只是冠军和评分。很多年后，你依然会和旧队友聊起训练室里的争执、决胜图前的沉默，以及那些明知道手在抖却仍然必须按下去的关键技能。</p><p><strong>生涯总结：</strong>${d.archive.length}个赛季，${d.totals.appearances}次出场，${d.totals.eliminations}次击杀，${d.championships}座冠军，${d.fmvp}次总决赛MVP，${d.mvps}次MVP，${d.allstars}次全明星。</p><p><strong>历史分：</strong>${d.historyScore} · ${d.historyScore>=300?'历史殿堂级别':d.historyScore>=220?'联盟传奇级别':d.historyScore>=150?'明星生涯级别':'职业生涯完整收官'}。</p><button class="primary-btn" id="closeRetirementPressBtn">继续查看最终履历</button></div>`;
      els.retirementPressOverlay.classList.remove('ui-hidden');
      document.getElementById('closeRetirementPressBtn').addEventListener('click',()=>els.retirementPressOverlay.classList.add('ui-hidden'));
    }

    function openRetiredCareerResume() {
      renderRetiredCareerResume();
      showScreen('retiredCareer');
    }

    function renderRetiredCareerResume() {
      const d=getRetirementSummaryData();
      const archive=d.archive||[];
      const totals=d.totals||{};
      const ratings=archive.filter(x=>Number(x.rating)>0);
      const avgRating=ratings.length?ratings.reduce((sum,x)=>sum+Number(x.rating||0),0)/ratings.length:0;
      const wins=archive.reduce((sum,x)=>sum+(x.wins||0),0);
      const losses=archive.reduce((sum,x)=>sum+(x.losses||0),0);
      const teams=[...new Set(archive.map(x=>careerTeamDisplay(x.team)).filter(Boolean))];
      const name=(state.playerName||'Rookie').trim()||'Rookie';
      els.retiredResumeTitle.textContent=`${name} 的完整职业生涯`;
      els.retiredResumeCopy.textContent=`${careerState.age}岁退役 · ${archive.length}个完整赛季 · 效力过 ${teams.length||1} 支队伍 · 最终职责 ${state.role}。`;
      els.retiredResumeHistoryScore.textContent=d.historyScore;
      const kda=`${totals.eliminations||0} / ${totals.deaths||0} / ${totals.assists||0}`;
      els.retiredResumeTotals.innerHTML=[
        ['生涯赛季',archive.length],
        ['总战绩',`${wins}-${losses}`],
        ['生涯K/D/A',kda],
        ['平均评分',avgRating?avgRating.toFixed(1):'未出场'],
        ['最高OVR',careerState.peakOvr||getMyOvr()],
        ['最佳成绩',bestCareerResult()]
      ].map(([label,value])=>`<div class="retired-resume-stat"><strong>${value}</strong><span>${label}</span></div>`).join('');
      els.retiredResumeHonors.innerHTML=Object.keys(d.honors).length
        ?sortHonorEntries(d.honors).map(([h,n])=>`<span class="honor-badge ${h.includes('冠军')||h.includes('MVP')?'gold':''}">${HONOR_ICONS[normalizeHonorName(h)]||HONOR_ICONS[h]||'🏅'} ${n}×${normalizeHonorName(h)}</span>`).join('')
        :'<span style="color:var(--muted)">没有大型荣誉记录。</span>';
      els.retiredResumeSeasons.innerHTML=archive.length?archive.map(x=>{
        const s=x.stats||{};
        const seasonKda=`${s.eliminations||0}/${s.deaths||0}/${s.assists||0}`;
        const honors=sortHonorNames(x.honors||[]);
        return `<article class="retired-resume-season">
          <div class="retired-resume-season-head">
            <div class="retired-resume-year">${x.year}</div>
            <div class="retired-resume-team"><strong>${careerTeamDisplay(x.team)}</strong><span>${x.age}岁 · ${x.role} · OVR ${x.ovr||'—'} · 常规赛第${x.regularRank||'—'}名</span></div>
            <div class="retired-resume-result">${x.result||'赛季结束'}</div>
          </div>
          <div class="retired-resume-season-stats">
            ${[
              ['战绩',`${x.wins||0}-${x.losses||0}`],
              ['赛季评分',x.rating?Number(x.rating).toFixed(1):'—'],
              ['季后赛评分',x.playoffRating?Number(x.playoffRating).toFixed(1):'—'],
              ['出场',s.appearances||0],
              ['K/D/A',seasonKda],
              ['最后一击',s.firstPicks||0]
            ].map(([label,value])=>`<div class="retired-resume-mini"><strong>${value}</strong><span>${label}</span></div>`).join('')}
          </div>
          ${honors.length?`<div class="retired-resume-honors">${honors.map(h=>`<span class="honor-badge ${h.includes('冠军')||h.includes('MVP')?'gold':''}">${HONOR_ICONS[normalizeHonorName(h)]||HONOR_ICONS[h]||'🏅'} ${normalizeHonorName(h)}</span>`).join('')}</div>`:''}
        </article>`;
      }).join(''):'<div class="summary-note-empty">没有完整赛季记录。</div>';
    }

    function renderRetirementScreen() {
      const archive=careerState.careerArchive;
      const wins=archive.reduce((s,x)=>s+x.wins,0);
      const losses=archive.reduce((s,x)=>s+x.losses,0);
      const ratings=archive.filter(x=>x.rating>0);
      const avg=ratings.length?ratings.reduce((s,x)=>s+x.rating,0)/ratings.length:0;
      const d=getRetirementSummaryData();
      document.getElementById('retirementTitle').textContent=`${careerState.age}岁，职业生涯落幕`;
      document.getElementById('retirementCopy').textContent=`${careerState.retirementReason}。你从${careerState.startAge||state.playerStartAge||16}岁进入联盟，共征战 ${archive.length} 个完整赛季，最终以 ${state.role} 身份摘下耳机。`;
      document.getElementById('retirementStats').innerHTML=[
        ['生涯赛季',archive.length],['总战绩',`${wins}-${losses}`],['平均评分',avg?avg.toFixed(1):'未出场'],['最高总评',careerState.peakOvr||getMyOvr()],['最佳成绩',bestCareerResult()],['历史分',d.historyScore]
      ].map(([label,value])=>`<div class="retirement-stat"><span>${label}</span><strong>${value}</strong></div>`).join('');
      document.getElementById('retirementHonorSummary').innerHTML=Object.keys(d.honors).length?sortHonorEntries(d.honors).map(([h,n])=>`<span class="honor-badge ${h.includes('冠军')||h.includes('MVP')?'gold':''}">${HONOR_ICONS[normalizeHonorName(h)]||HONOR_ICONS[h]||'🏅'} ${n}×${normalizeHonorName(h)}</span>`).join(''):'<span style="color:var(--muted)">没有大型荣誉记录。</span>';
      document.getElementById('retirementFinalAttrs').innerHTML=ATTRS.map(attr=>{const v=state.locked[attr.key]?.value||0;return `<div class="retirement-attr"><small>${attr.name}</small><strong>${v?`<span>${v}</span><em>${getRank(v).label}</em>`:'—'}</strong></div>`}).join('');
      document.getElementById('retirementTimeline').innerHTML=archive.length?archive.map(x=>`<div class="career-timeline-row"><span>${x.age}岁</span><div><b>${x.year} · ${careerTeamDisplay(x.team)}</b><div style="color:var(--muted);font-size:12px;margin-top:3px">${x.role} · OVR ${x.ovr} · 评分 ${x.rating?x.rating.toFixed(1):'—'}${(x.honors||[]).length?` · ${sortHonorNames(x.honors||[]).map(normalizeHonorName).join(' / ')}`:''}</div></div><strong>${x.result}</strong></div>`).join(''):'<div class="summary-note-empty">没有完整赛季记录。</div>';
    }

    function renderRolePlanning(wrap) {
      const current=state.role;
      const target=offseasonState.roleTarget;
      const currentFit=calculateRoleFit(current);
      const targetFit=calculateRoleFit(target);
      const difference=targetFit-currentFit;
      const reason=targetFit>=currentFit?'你的能力结构在新位置上并不吃亏，教练认为这是扩大出场价值的机会。':'这是一次高风险转型。短期表现大概率下降，但能打开原位置之外的合同市场。';
      wrap.innerHTML=`
        <div class="offseason-kicker">ROLE PLAN · 位置规划</div>
        <h3>教练提出了转位置方案</h3>
        <p>${reason} 转位后位置适应从较低水平开始，并在新赛季比赛中逐步恢复。</p>
        <div class="role-shift-board">
          <div class="role-shift-card"><span>当前位置</span><strong>${current}</strong><em>适配评分 ${currentFit}</em></div>
          <div class="role-shift-arrow">➜</div>
          <div class="role-shift-card proposed"><span>建议转型</span><strong>${target}</strong><em>适配评分 ${targetFit} ${difference>=0?'▲':'▼'}${Math.abs(difference)}</em></div>
        </div>
        <div class="role-choice-grid">
          <button class="role-choice" data-role-choice="accept"><strong>接受正式转位</strong><span>下赛季以 ${target} 身份进入市场。位置适应降至 70%，但新位置相关能力会获得训练补正。</span></button>
          <button class="role-choice" data-role-choice="trial"><strong>保留原位，兼练新位置</strong><span>主位置仍为 ${current}，同时获得 ${target} 客串标签。合同选择更宽，但不会立刻改变比赛权重。</span></button>
          <button class="role-choice" data-role-choice="decline"><strong>拒绝转位，强化原位置</strong><span>继续以 ${current} 为核心路线，招牌属性获得小幅提升，但部分队伍可能认为你缺乏弹性。</span></button>
        </div>`;
      wrap.querySelectorAll('[data-role-choice]').forEach(btn=>btn.addEventListener('click',()=>applyRoleDecision(btn.dataset.roleChoice)));
    }

    function bumpLockedAttr(key,amount,label) {
      const item=state.locked[key];
      if(!item) return;
      item.value=clamp(item.value+amount,45,99);
      if(label) item.player=label;
    }

    function applyRoleDecision(choice) {
      const from=state.role;
      const to=offseasonState.roleTarget;
      offseasonState.roleDecision=choice;
      careerState.lastRolePlanYear=careerState.seasonYear;
      if(choice==='decline') {
        careerState.roleDeclineStreak=Number(careerState.roleDeclineStreak||0)+1;
        if(careerState.roleDeclineStreak>=2){
          careerState.roleDeclineCooldownUntil=Number(careerState.seasonYear||0)+3;
          careerState.roleDeclineStreak=0;
        }
      } else {
        careerState.roleDeclineStreak=0;
        careerState.roleDeclineCooldownUntil=0;
      }
      if(choice==='accept') {
        careerState.roleHistory.push({year:careerState.seasonYear,from,to,type:'正式转位'});
        state.role=to;
        careerState.positionTrial=null;
        careerState.roleAdaptation=70;
        bumpLockedAttr(ROLE_PRIMARY_KEY[to],2,'休赛期转型训练');
        bumpLockedAttr('pool',1,'休赛期转型训练');
        bumpLockedAttr('awareness',1,'休赛期转型训练');
      } else if(choice==='trial') {
        careerState.positionTrial=to;
        careerState.roleAdaptation=100;
        bumpLockedAttr('pool',1,'双位置训练');
        careerState.coachTrust=clamp(careerState.coachTrust+5,0,100);
      } else {
        careerState.positionTrial=null;
        careerState.roleAdaptation=100;
        bumpLockedAttr(ROLE_PRIMARY_KEY[from],1,'休赛期专项训练');
        careerState.coachTrust=clamp(careerState.coachTrust-2,0,100);
      }
      renderLockedAttrs();
      renderBuildSummary();
      setOffseasonPhase('market');
    }

    function roleTacticFit(role,tactic) {
      const table={
        '坦克':{'突进':88,'消耗':70,'阵地':92},
        '长枪输出':{'突进':72,'消耗':95,'阵地':82},
        '弹道输出':{'突进':94,'消耗':73,'阵地':80},
        '输出支援':{'突进':78,'消耗':88,'阵地':86},
        '战术支援':{'突进':89,'消耗':81,'阵地':91}
      };
      return table[role]?.[tactic]||80;
    }

    function generateContractOffers() {
      const avg=seasonState.userRatings.length?seasonState.userRatings.reduce((a,b)=>a+b,0)/seasonState.userRatings.length:6.8;
      const ovr=Number(getMyOvr()==='--'?78:getMyOvr());
      const achievement=playoffState.round==='champion'?12:playoffState.round==='runnerup'?8:playoffState.round==='eliminated'?4:0;
      const market=ovr*.62+avg*3.3+achievement+careerState.popularity*.06;
      const external=shuffle(TEAMS.filter(t=>t.name!==careerState.team.name)).slice(0,3);
      const teams=[careerState.team,...external];
      offseasonState.offers=teams.map((team,index)=>{
        const renewal=index===0;
        const teamPower=Math.round(careerLikeTeamPower(team));
        const tactic=renewal?careerState.tactic:pick(TACTICS);
        const fit=clamp(Math.round(roleTacticFit(state.role,tactic)+(calculateRoleFit(state.role)-80)*.65+rand(-5,5)),55,98);
        const years=renewal?rand(1,3):rand(1,3);
        const salary=Math.max(8,Math.round((market-55)*.8+(teamPower-78)*.6+rand(-3,5)));
        const starterScore=market+fit*.2-teamPower*.18+rand(-5,5);
        const rolePromise=starterScore>=74?'核心首发':starterScore>=65?'稳定首发':starterScore>=57?'首发竞争':'轮换选手';
        return {
          id:`offer-${index}-${Date.now()}-${Math.random()}`,
          team,renewal,tactic,fit,years,salary,rolePromise,teamPower,
          note:renewal?'熟悉的体系与队友，风险最低，但成长空间未必最大。':fit>=88?'体系高度适配，教练组愿意围绕你的特点安排位置。':teamPower>=85?'强队机会，竞争激烈。':'有更大的出场空间，也意味着你得亲自承担更多输赢。'
        };
      }).sort((a,b)=>Number(b.renewal)-Number(a.renewal));
    }

    function renderContractMarket(wrap) {
      if(!offseasonState.contractExpired && careerState.contract?.remaining>0) {
        wrap.innerHTML=`<div class="offseason-kicker">ACTIVE CONTRACT · 履行合同</div>
          <h3>你仍在 ${careerState.team.name} 的合同期内</h3>
          <p>合同未到期，本休赛期不会进入自由市场。</p>
          <div class="contract-status-card"><div class="offer-logo" style="margin:0 auto;background:${careerState.team.color}">${careerState.team.short}</div><div class="contract-years">${careerState.contract.remaining}</div><strong>剩余合同年限</strong><p>${careerState.contract.years} 年合同 · 年薪 ${careerState.contract.salary} 万 · 队内定位「${careerState.contract.rolePromise}」</p><button class="primary-btn" id="continueExistingContractBtn">履行合同，进入新赛季 →</button></div>`;
        document.getElementById('continueExistingContractBtn').addEventListener('click',continueExistingContract);
        return;
      }
      wrap.innerHTML=`
        <div class="offseason-kicker">PLAYER MARKET · 选手市场</div>
        <h3>你收到了 ${offseasonState.offers.length} 份正式报价</h3>
        <p>比较合同、队内定位、体系适配和队伍实力。</p>
        <div class="offers-grid">
          ${offseasonState.offers.map(o=>`
            <button class="offer-card ${o.renewal?'renewal':''} ${o.team?.expansion?'expansion-offer':''} ${offseasonState.selectedOfferId===o.id?'selected':''}" data-offer-id="${o.id}">
              <span class="offer-badge">${o.team?.expansion?'扩军新军':o.renewal?'续约报价':'转会邀请'}</span>
              <div class="offer-team"><div class="offer-logo" style="background:${o.team.color}">${o.team.short}</div><div><strong>${o.team.name}</strong><span>${o.note}</span></div></div>
              <div class="offer-terms">
                <div class="offer-term"><small>合同年限</small><b>${o.years} 年</b></div>
                <div class="offer-term"><small>年薪</small><b>${o.salary} 万</b></div>
                <div class="offer-term"><small>队内定位</small><b>${o.rolePromise}</b></div>
                <div class="offer-term"><small>主打体系</small><b>${o.tactic}</b></div>
              </div>
              <div class="offer-fit"><span>阵容实力 ${o.teamPower}</span><span>体系适配 <strong>${o.fit}</strong></span></div>
            </button>`).join('')}
        </div>
        <div class="offer-actions"><button class="secondary-btn dev-only" id="rerollOffersBtn">重新生成报价</button><button class="primary-btn" id="signOfferBtn" ${offseasonState.selectedOfferId?'':'disabled'}>确认签约</button></div>`;
      wrap.querySelectorAll('[data-offer-id]').forEach(btn=>btn.addEventListener('click',()=>{
        offseasonState.selectedOfferId=btn.dataset.offerId;
        renderContractMarket(wrap);
      }));
      document.getElementById('rerollOffersBtn').addEventListener('click',()=>{offseasonState.selectedOfferId=null;generateContractOffers();renderOffseason();});
      document.getElementById('signOfferBtn').addEventListener('click',signSelectedOffer);
    }

    function createBenchForTeam(team) {
      const usedNames=new Set(careerState.starters.map(p=>p.name));
      return Array.from({length:4},(_,index)=>{
        const role=pick(ROLES).name;
        const attrs=generateMatchAttributes(role,rand(70,83));
        let name=pick(NAMES),guard=0;
        while(usedNames.has(name)&&guard++<30) name=pick(NAMES);
        usedNames.add(name);
        return {id:`bench-${Date.now()}-${index}-${Math.random()}`,name,role,attrs,overall:Math.round(Object.values(attrs).reduce((a,b)=>a+b,0)/ATTRS.length),color:team.color,isUser:false};
      });
    }

    function continueExistingContract() {
      const team=careerState.team;
      offseasonState.contractContinued=true;
      offseasonState.signedOffer=null;
      careerState.starters=createRoster(team,true);
      careerState.bench=createBenchForTeam(team);
      careerState.seasonYear+=1;
      careerState.careerYears+=1;
      seasonState.active=false;
      seasonState.baseLocked=null;
      resetPlayoffState();
      offseasonState.phase='signed';
      renderCareerTeam();
      renderOffseason();
    }

    function applyTeamFromOffer(offer) {
      careerState.team=offer.team;
      careerState.contract={years:offer.years,remaining:offer.years,salary:offer.salary,rolePromise:offer.rolePromise,teamName:offer.team.name};
      careerState.contractTickYear=null;
      careerState.tactic=offer.tactic;
      careerState.rank=clamp(Math.round(11-offer.teamPower*.08+rand(-1,1)),2,10);
      careerState.goal=offer.teamPower>=85?'争夺联赛冠军':offer.teamPower>=80?'冲击季后赛':'完成阵容磨合';
      matchState.homeTeam=offer.team;
      careerState.starters=createRoster(offer.team,true);
      careerState.bench=createBenchForTeam(offer.team);
      careerState.seasonYear+=1;
      careerState.careerYears+=1;
      seasonState.active=false;
      seasonState.baseLocked=null;
      resetPlayoffState();
      renderCareerTeam();
    }

    function signSelectedOffer() {
      const offer=offseasonState.offers.find(o=>o.id===offseasonState.selectedOfferId);
      if(!offer) return;
      offseasonState.signedOffer=offer;
      applyTeamFromOffer(offer);
      offseasonState.phase='signed';
      renderOffseason();
    }

    function renderSigningComplete(wrap) {
      const offer=offseasonState.signedOffer;
      const continued=offseasonState.contractContinued && !offer;
      wrap.innerHTML=`<div class="signing-result">
        <div class="big">${continued?'📄':'✍️'}</div>
        <div class="offseason-kicker">${continued?'CONTRACT CONTINUES':'CONTRACT SIGNED'}</div>
        <h3>${continued?`继续效力 ${careerState.team.name}`:`你与 ${offer.team.name} 完成签约`}</h3>
        <p>${continued?`现有合同剩余 ${careerState.contract.remaining} 年，年薪 ${careerState.contract.salary} 万。下赛季继续以「${careerState.contract.rolePromise}」身份出战。`:`${offer.years} 年合同，年薪 ${offer.salary} 万，队内定位为「${offer.rolePromise}」。下赛季你将以 ${state.role} 身份出战${careerState.positionTrial?`，同时客串练习 ${careerState.positionTrial}`:''}。`}</p>
        <button class="primary-btn" id="viewNewRosterBtn">查看新赛季阵容 →</button>
      </div>`;
      document.getElementById('viewNewRosterBtn').addEventListener('click',()=>{
        offseasonState.active=false;
        renderCareerTeam();
        showScreen('team');
      });
    }

    /* ---------------- 比赛模拟 V0.2 · 赛季事件 V0.1 ---------------- */
