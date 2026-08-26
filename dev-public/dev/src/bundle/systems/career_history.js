/* ===== BUNDLE MODULE: systems/career_history.js ===== */
/* ==========================================================================
   MODULE: systems/career_history.js
   Career archive, honors and injury inquiries
   Migrated from V6.2 lines 6804-6950; execution order is defined by manifest.json.
   ========================================================================== */
    /* ---------------- 生涯档案 / 荣誉墙 ---------------- */
    const HONOR_ICONS={'全明星':'⭐','MVP':'👑','常规赛最有价值选手':'👑','职责之星':'🎯','年度职责之星':'🌟','年度角色之星':'🌟','社区之星':'🤝','最佳阵容':'🌟','年度最佳新秀':'🌱','Alarm年度最佳新秀奖':'🌱','最佳新秀阵容':'🍀','总冠军':'🏆','总决赛MVP':'👑','总决赛最有价值选手':'👑','世界杯冠军':'🌍','世界杯亚军':'🥈','国家队成员':'🏳️','Dennis Hawelka奖':'❤️','年度进步最快选手':'📈','全明星首发':'⭐','全明星正赛最有价值选手':'🌟','新星赛最有价值选手':'🌱','狙王':'🎯','全能王':'🎲'};
    const HONOR_IMPORTANCE={
      '总冠军':100,'世界杯冠军':96,'总决赛MVP':93,'MVP':90,'年度职责之星':82,'职责之星':82,
      'Alarm年度最佳新秀奖':78,'年度最佳新秀':78,'世界杯亚军':75,'最佳阵容':72,'Dennis Hawelka奖':68,
      '年度进步最快选手':64,'全明星正赛最有价值选手':62,'全明星首发':58,'全明星':55,'国家队成员':50,
      '新星赛最有价值选手':48,'社区之星':42,'最佳新秀阵容':40,'狙王':32,'全能王':30
    };
    function careerTeamDisplay(value){
      if(typeof value==='string')return value;
      if(value&&typeof value==='object')return value.name||value.city||value.englishName||value.enName||value.short||'未知队伍';
      return value==null?'未知队伍':String(value);
    }
    function normalizeCareerArchiveTeams(){
      (careerState.careerArchive||[]).forEach(record=>{if(record&&record.team!=null)record.team=careerTeamDisplay(record.team);});
      return careerState.careerArchive||[];
    }
    function normalizeHonorName(name){
      if(name==='常规赛最有价值选手') return 'MVP';
      if(name==='总决赛最有价值选手') return '总决赛MVP';
      if(name==='年度角色之星') return '年度职责之星';
      return name;
    }
    function honorImportance(name){const n=normalizeHonorName(name);if(HONOR_IMPORTANCE[n]!=null)return HONOR_IMPORTANCE[n];if(/^EWC冠军$/.test(n))return 88;if(/^Major \d+冠军$/.test(n))return 85;if(/^Stage \d+冠军$/.test(n))return 80;if(/冠军/.test(n))return 74;if(/MVP|最有价值选手/.test(n))return 70;return 20;}
    function sortHonorNames(list=[]){return [...list].sort((a,b)=>honorImportance(b)-honorImportance(a)||String(normalizeHonorName(a)).localeCompare(String(normalizeHonorName(b)),'zh-CN'));}
    function sortHonorEntries(counts={}){return Object.entries(counts).sort((a,b)=>honorImportance(b[0])-honorImportance(a[0])||b[1]-a[1]||String(a[0]).localeCompare(String(b[0]),'zh-CN'));}
    function openCareerHub(tab='overview',allowRetired=false) {
      if(!allowRetired) {
        if(seasonState.played<seasonState.total) { if(window.__OWL_V16_MODAL?.result)window.__OWL_V16_MODAL.result({icon:'📊',kicker:'CAREER · 生涯档案',title:'赛季尚未结束',body:'<p>完成当前常规赛后再结算本赛季的生涯记录。</p>',confirmText:'返回赛季'});else console.warn('赛季尚未结束。'); return; }
        const qualified=estimateSeasonRank()<=8;
        const playoffDone=['champion','runnerup','eliminated'].includes(playoffState.round);
        if(qualified && !playoffDone) { if(!playoffState.active) setupPlayoffs(); renderPlayoffs(); showScreen('playoff'); return; }
        recordCompletedCareerSeason();
      }
      careerViewState.tab=tab;
      renderCareerHub();
      showScreen('career');
    }
    function backFromCareerHub() {
      if(careerState.retired) { renderRetirementScreen(); showScreen('retirement'); }
      else { renderSeasonSummary(); showScreen('summary'); }
    }
    function setCareerTab(tab) { careerViewState.tab=tab; renderCareerHub(); }
    function getCareerTotals() {
      const archive=careerState.careerArchive;
      return archive.reduce((t,r)=>{
        const s=r.stats||{};
        t.series+=(s.series||0); t.appearances+=(s.appearances||0); t.maps+=(s.maps||0); t.eliminations+=(s.eliminations||0);
        t.deaths+=(s.deaths||0); t.assists+=(s.assists||0); t.firstPicks+=(s.firstPicks||0); t.wins+=r.wins||0; t.losses+=r.losses||0;
        t.ratingSum+=(r.rating||0)*(s.appearances||1); t.ratingWeight+=(s.appearances||1); return t;
      },{series:0,appearances:0,maps:0,eliminations:0,deaths:0,assists:0,firstPicks:0,wins:0,losses:0,ratingSum:0,ratingWeight:0});
    }
    function getHonorCounts() {
      const counts={};
      careerState.careerArchive.forEach(r=>{
        const seen=new Set();
        (r.honors||[]).forEach(raw=>{
          const h=normalizeHonorName(raw);
          if(!h||seen.has(h)) return;
          seen.add(h); counts[h]=(counts[h]||0)+1;
        });
      });
      return counts;
    }
    function renderCareerHub() {
      const archive=careerState.careerArchive;
      const last=archive[archive.length-1];
      els.backSummaryFromCareerBtn.textContent=careerState.retired?'← 退役总结':'← 赛季结算';
      document.getElementById('careerDataSeasonChip').textContent=`🏆 ${last?.year||careerState.seasonYear} 赛季`;
      document.getElementById('careerDataSubcopy').textContent=`生涯共 ${archive.length} 个完整赛季 · ${careerState.age}岁 · ${state.role} · OVR ${getMyOvr()}`;
      document.querySelectorAll('[data-career-tab]').forEach(btn=>btn.classList.toggle('active',btn.dataset.careerTab===careerViewState.tab));
      if(careerViewState.tab==='honors') renderHonorWall();
      else if(careerViewState.tab==='offseason') renderCareerOffseasonTab();
      else renderCareerOverview();
    }
    function renderCareerOverview() {
      const t=getCareerTotals(); const archive=normalizeCareerArchiveTeams();
      const avgRating=t.ratingWeight?t.ratingSum/t.ratingWeight:0;
      const perMap=(value)=>t.maps?(value/t.maps).toFixed(1):'—';
      els.careerTabContent.innerHTML=`
        <section class="career-block"><h3>📊 生涯累计</h3><div class="career-total-grid">
          ${[['总出场',t.appearances],['总地图',t.maps],['总击杀',t.eliminations],['总阵亡',t.deaths],['总助攻',t.assists],['最后一击',t.firstPicks]].map(([l,v])=>`<div class="career-total-item"><strong>${v}</strong><span>${l}</span></div>`).join('')}
        </div></section>
        <section class="career-block"><h3>📈 生涯平均</h3><div class="career-total-grid">
          ${[['平均评分',avgRating?avgRating.toFixed(1):'未出场'],['每图击杀',perMap(t.eliminations)],['每图阵亡',perMap(t.deaths)],['每图助攻',perMap(t.assists)],['系列赛战绩',`${t.wins}-${t.losses}`],['最高OVR',careerState.peakOvr||getMyOvr()]].map(([l,v])=>`<div class="career-total-item"><strong>${v}</strong><span>${l}</span></div>`).join('')}
        </div></section>
        <section class="career-block"><h3>📋 每赛季</h3><div class="career-season-list">${[...archive].reverse().map(r=>`<div class="career-season-row"><div class="year">${r.year}赛季</div><div><strong>${careerTeamDisplay(r.team)}</strong><div class="meta">${r.age}岁 · ${r.role} · OVR ${r.ovr} · ${r.result}</div></div><div class="rating">${r.rating?`${r.rating.toFixed(1)}分`:'未出场'}</div></div>`).join('')||'<div class="summary-note-empty">还没有完整赛季记录。</div>'}</div></section>`;
    }
    function renderHonorWall() {
      const archive=[...normalizeCareerArchiveTeams()].reverse(); const counts=getHonorCounts();
      const total=Object.values(counts).reduce((a,b)=>a+b,0);
      els.careerTabContent.innerHTML=`<section class="career-block"><h3>🏆 荣誉墙</h3>${archive.map(r=>`<div class="career-honor-season"><div class="career-honor-head"><strong>${r.year}赛季</strong><span>${careerTeamDisplay(r.team)}</span></div><div class="honor-badges">${(r.honors||[]).length?sortHonorNames(r.honors||[]).map(h=>`<span class="honor-badge ${h.includes('冠军')||h.includes('MVP')?'gold':''}">${HONOR_ICONS[normalizeHonorName(h)]||HONOR_ICONS[h]||'🏅'} ${normalizeHonorName(h)}</span>`).join(''):'<span style="color:var(--muted)">本赛季没有个人或团队荣誉。</span>'}</div></div>`).join('')||'<div class="summary-note-empty">暂无生涯荣誉。</div>'}<div class="career-total-copy">生涯共获得 ${total} 项荣誉${Object.keys(counts).length?'：'+sortHonorEntries(counts).map(([k,v])=>`${v}×${k}`).join(' · '):'。'}</div></section>`;
    }
    function renderCareerOffseasonTab() {
      const archive=normalizeCareerArchiveTeams(),last=archive[archive.length-1];
      els.careerTabContent.innerHTML=`<section class="career-offseason-card"><div style="font-size:48px">📖</div><h3>${last?.year||careerState.seasonYear} 赛季已经归档</h3><p>${last?`${careerTeamDisplay(last.team)} · ${last.result} · 平均评分 ${last.rating.toFixed(1)}。`:''}接下来进入训练与合同阶段。</p><button class="primary-btn" id="enterOffseasonFromCareerBtn" style="min-width:250px;padding:15px 20px">进入休赛期 →</button></section>`;
      document.getElementById('enterOffseasonFromCareerBtn').addEventListener('click',enterOffseason);
    }

    /* ---------------- 伤病询问 ---------------- */
    function shouldTriggerInjuryInquiry(context) {
      if(injuryState.active||injuryState.bypass) { injuryState.bypass=false; return false; }
      if(context==='regular') return seasonState.injuryAt!=null && !seasonState.injuryPromptUsed && seasonState.played===seasonState.injuryAt && seasonState.played<seasonState.total;
      if(context==='playoff') {
        const id=playoffState.nextMatchId;
        if(playoffState.injuryPromptUsed || !['U7','L6','G1'].includes(id)) return false;
        if(playoffState.injuryChecks[id]) return false;
        playoffState.injuryChecks[id]=true;
        const chance=clamp(.035+Math.max(0,careerState.age-24)*.008+(careerState.condition<42?.035:0),.025,.12);
        return Math.random()<chance;
      }
      return false;
    }
    function openInjuryInquiry(context='regular',force=false) {
      if(injuryState.active) return;
      if(!force && context==='regular' && seasonState.played>=seasonState.total) return;
      injuryState.active=true; injuryState.context=context;
      const condition=careerState.condition;
      injuryState.severity=condition<55?'中度伤势':'轻伤';
      injuryState.penalty=injuryState.severity==='中度伤势'?-3:-2;
      injuryState.recoveryGames=injuryState.severity==='中度伤势'?5:3;
      renderInjuryInquiry();
      els.injuryOverlay.classList.remove('ui-hidden');
    }
    function renderInjuryInquiry() {
      const playoff=injuryState.context==='playoff';
      const opponent=playoff?currentPlayoffOpponent():seasonState.opponents[seasonState.played];
      els.injuryContent.innerHTML=`<div class="injury-card-top"><div class="injury-icon">🏥</div><div class="injury-kicker">关键场次 · 带伤出战？</div></div><div class="injury-copy"><p>${playoff?'淘汰赛关键轮次':'常规赛关键赛程'}前，队医确认你仍在伤病名单。下一场对手是 <strong>${opponent?.name||'待定对手'}</strong>，教练组把最终决定交给你。</p><p>当前伤情：<strong>${injuryState.severity}</strong>。带伤出战会明显影响临场发挥，并存在伤势延长的风险；休战则意味着队伍必须在没有你的情况下完成这轮比赛。</p><div class="injury-actions"><button class="injury-choice danger" data-injury-choice="play">带伤出战<span>保住出场机会，但承担竞技与恢复风险</span></button><button class="injury-choice" data-injury-choice="rest">休战养伤<span>恢复状态，让队伍独自处理下一场</span></button></div></div>`;
      els.injuryContent.querySelectorAll('[data-injury-choice]').forEach(btn=>btn.addEventListener('click',()=>resolveInjuryChoice(btn.dataset.injuryChoice)));
    }
    function closeInjuryOverlay() { injuryState.active=false; els.injuryOverlay.classList.add('ui-hidden'); }
    function resolveInjuryChoice(choice) {
      const context=injuryState.context;
      if(context==='regular') seasonState.injuryPromptUsed=true; else playoffState.injuryPromptUsed=true;
      if(choice==='play') {
        careerState.injuryGames=injuryState.recoveryGames;
        careerState.injuryPenalty=injuryState.penalty;
        careerState.condition=clamp(careerState.condition-8,0,100);
        careerState.injuryHistory.push({year:careerState.seasonYear,age:careerState.age,choice:'带伤出战',severity:injuryState.severity});
        closeInjuryOverlay(); injuryState.bypass=true;
        if(context==='playoff') openNextPlayoffMatch(injuryState.pendingPlayoffMode||'quick');
        else if(injuryState.resumeFast) {
          injuryState.resumeFast=false; seasonState.simulating=true; renderSeason(); seasonState.timer=setTimeout(fastSeasonStep,350);
        } else openNextSeasonMatch();
      } else {
        careerState.condition=clamp(careerState.condition+12,0,100);
        careerState.injuryHistory.push({year:careerState.seasonYear,age:careerState.age,choice:'休战养伤',severity:injuryState.severity});
        closeInjuryOverlay();
        if(context==='playoff') simulateRestedPlayoffSeries(); else simulateRestedRegularMatch();
      }
    }
    function simulateRestedRegularMatch() {
      if(seasonState.played>=seasonState.total) return;
      const opponent=seasonState.opponents[seasonState.played];
      const venue=regularVenueAt(seasonState.played);
      const ourPower=teamDisplayPower(careerState.starters)-3;
      const theirPower=teamDisplayPower(createRoster(opponent,false));
      const teamContext=clamp((11-(careerState.rank||10))*.003,-.018,.018);
      const won=Math.random()<clamp(.52+(ourPower-theirPower)*.021+teamContext+(venue==='home'?.02:-.02),.22,.80);
      seasonState.results[seasonState.played]=won?'win':'loss'; seasonState.played++; seasonState.gamesMissed++;
      if(won) seasonState.wins++; else seasonState.losses++;
      careerState.coachTrust=clamp(careerState.coachTrust-1,0,100);
      seasonState.eventHistory.push({id:`injury-${careerState.seasonYear}`,icon:'🏥',title:'伤病休战',choice:'休战养伤',summary:`队伍${won?'赢下':'输掉'}了你缺席的比赛`,afterMatch:seasonState.played});
      markSeasonEventDue(); renderSeason(); showScreen('season');
      if(injuryState.resumeFast && seasonState.played<seasonState.total) {
        injuryState.resumeFast=false;
        if(seasonState.eventDue) { seasonState.resumeFastAfterEvent=true; openScheduledSeasonEvent(); }
        else { seasonState.simulating=true; renderSeason(); seasonState.timer=setTimeout(fastSeasonStep,450); }
      }
    }
    function simulateRestedPlayoffSeries() {
      const match=currentPlayoffMatch(); if(!match)return;
      const opponent=currentPlayoffOpponent(),our=careerLikeTeamPower(careerState.team)-5,their=careerLikeTeamPower(opponent);
      const won=Math.random()<clamp(.46+(our-their)*.019,.20,.72),target=match.target;
      const ourScore=won?target:rand(0,target-1),theirScore=won?rand(0,target-1):target;
      setPlayerBracketResult(match,won,ourScore,theirScore,0,{rested:true});
      renderPlayoffs();showScreen('playoff');
    }

    /* ---------------- 休赛期 / 转位 / 转会 V0.1 ---------------- */

