/* ======================================================================
   Public Beta 1.5 RC1 · Career Flow & UX Update
   - current-season rulebook / one-time 2025 intro
   - season action placement / milestone placement
   - responsive chunked full-season simulation
   - DNP display hardening
   ====================================================================== */
(function(){
  const V13='Public Beta 1.5 RC1';

  function v13Year(){return Number(careerState.seasonYear||2019)}
  function v13Esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}

  // -------------------------------------------------------------------
  // 1) Rulebook: auto-open ONLY once in 2025. Every season remains
  //    inspectable from a permanent button next to the regular-season nav.
  // -------------------------------------------------------------------
  const V13_HIST_RULES={
    2019:{summary:'20支队伍 · 28场 · 4个Stage × 7场',bullets:['Stage 1 / 2 / 3后进行阶段季后赛；Stage 4后直接进入年度结算。','年度季后赛资格按2019常规赛排名体系玩法化还原。']},
    2020:{summary:'20支队伍 · 21场 · 赛季中三项锦标赛',bullets:['May Melee / Summer Showdown / Countdown Cup按对应阶段推进。','疫情赛季的地域赛程做玩法化压缩，但保留真实赛事骨架。']},
    2021:{summary:'20支队伍 · 16场 · 4个锦标赛循环 × 4场',bullets:['May Melee / June Joust / Summer Showdown / Countdown Cup。','锦标赛表现与League Points共同影响年度季后赛。']},
    2022:{summary:'20支队伍 · 24场 · 4个锦标赛阶段 × 6场',bullets:['Kickoff Clash / Midseason Madness / Summer Showdown / Countdown Cup。','地区Play-Ins与12队年度双败季后赛按史实骨架玩法化还原。']},
    2023:{summary:'Spring / Summer · 每Stage 8场 · 共16场',bullets:['Spring阶段连接Midseason Madness；东西部采用不同晋级路线。','年度季后赛采用两组四队双败 → Final Four的结构。']}
  };
  function v13RuleModel(){
    const y=v13Year();
    if(y<=2023){const r=V13_HIST_RULES[y]||{summary:'对应年份OWL真实赛制',bullets:[]};return{historical:true,label:'史实规则 · 玩法化还原',title:`${y} OWL · 赛季规则`,summary:r.summary,bullets:r.bullets}}
    const bullets=['20队分东/西部；56场常规赛：同区4次、跨区2次。','Stage 1 / 2 / 3：19 / 18 / 19场，每阶段结束举办8队Major。','Major通过League Points影响年度季后赛；年度季后赛取全年积分前8。'];
    if(y>=2025)bullets.push('2025起启用地图选择、阵容换人与 Hero Ban。');
    else bullets.push('2024暂不启用Hero Bans与Map Voting，比赛内规则保持传统版本。');
    return{historical:false,label:'架空延续赛制',title:`${y} OWL 2.0 · 赛季规则`,summary:'2024起进入 OWL 2.0 架空延续赛制。',bullets};
  }
  function v13OpenRulebook(auto=false){
    const overlay=document.getElementById('seasonEventOverlay'),holder=document.getElementById('seasonEventContent');if(!overlay||!holder)return;
    const r=v13RuleModel();
    holder.innerHTML=`<div class="season-event-top"><span class="season-event-kicker">OWL ${v13Year()} · SEASON RULEBOOK</span><span class="season-event-round ${r.historical?'v13-real':'v13-fiction'}">${r.label}</span></div><h2 class="season-event-title">${v13Esc(r.title)}</h2><div class="season-event-copy"><p class="v13-rule-summary">${v13Esc(r.summary)}</p><ul>${r.bullets.map(x=>`<li>${v13Esc(x)}</li>`).join('')}</ul></div><div class="season-event-choices"><button class="season-event-choice" id="v13CloseRulebook"><div><strong>${auto?'知道了，开始赛季 →':'返回常规赛 →'}</strong></div></button></div>`;
    document.getElementById('v13CloseRulebook')?.addEventListener('click',()=>overlay.classList.add('hidden'));overlay.classList.remove('hidden');
  }
  // 替换旧的“每年弹一次”：只有2025第一次进入时自动说明竞技规则升级。
  if(typeof v71MaybeShowSeasonIntro==='function'){
    v71MaybeShowSeasonIntro=function(){
      if(v13Year()!==2025||careerState.v13RuleIntroSeen2025)return;
      careerState.v13RuleIntroSeen2025=true;seasonState.v71IntroYear=2025;v13OpenRulebook(true);
    };
  }
  function v13EnsureRuleButton(){
    const host=document.querySelector('#seasonScreen .top-actions');if(!host||document.getElementById('v13RulebookBtn'))return;
    const b=document.createElement('button');b.className='ghost-btn';b.id='v13RulebookBtn';b.type='button';b.textContent='📖 规则说明';
    const back=document.getElementById('backTeamFromSeasonBtn');if(back)back.insertAdjacentElement('afterend',b);else host.prepend(b);
    b.addEventListener('click',()=>v13OpenRulebook(false));
  }

  // -------------------------------------------------------------------
  // 2) Put the actual controls where the eye naturally lands:
  //    stages -> total progress -> milestone (if any) -> actions -> notes.
  //    Career Feed belongs BELOW the controls, not between stages/actions.
  // -------------------------------------------------------------------
  function v13RelayoutSeason(){
    const track=document.querySelector('#seasonScreen .season-track-card');if(!track)return;
    const progress=document.getElementById('seasonProgressCopy'),primary=document.getElementById('v768SeasonPrimaryAction'),actions=track.querySelector('.season-actions'),note=document.getElementById('seasonSimNote'),legend=track.querySelector('.season-legend'),feed=track.querySelector('.v75-story-recap');
    if(primary&&progress&&primary.previousElementSibling!==progress)progress.insertAdjacentElement('afterend',primary);
    if(actions){
      const anchor=primary||progress;if(anchor&&actions.previousElementSibling!==anchor)anchor.insertAdjacentElement('afterend',actions);
    }
    if(note&&actions&&note.previousElementSibling!==actions)actions.insertAdjacentElement('afterend',note);
    if(legend&&note&&legend.previousElementSibling!==note)note.insertAdjacentElement('afterend',legend);
    if(feed){const a=legend||note||actions;if(a&&feed.previousElementSibling!==a)a.insertAdjacentElement('afterend',feed)}
  }

  // -------------------------------------------------------------------
  // 3) DNP is DNP. Team games are not user appearances, and no appearance
  //    means no personal decision percentage magically materializes.
  // -------------------------------------------------------------------
  function v13FixDnpUi(){
    const strip=document.getElementById('seasonPlayerStrip');if(strip&&careerState.team){
      const ratings=seasonState.userRatings||[],avg=ratings.length?ratings.reduce((a,b)=>a+b,0)/ratings.length:null,ovr=getMyOvr()==='--'?78:getMyOvr();
      // 兼容已被旧版本污染的DNP存档：0次出场不可能有个人关键决策。
      if(!ratings.length&&(seasonState.decisionTotal||seasonState.decisionSuccess)){seasonState.decisionTotal=0;seasonState.decisionSuccess=0;}
      strip.innerHTML=`<strong>${state.role}</strong> · ${careerState.age}岁 · OVR ${ovr} · 平均评分 ${avg==null?'未出场':avg.toFixed(1)} · 已出战 ${ratings.length} 场 · 位置适应 ${Math.round(careerState.roleAdaptation)}%${careerState.positionTrial?` · 转位试训：${careerState.positionTrial}`:''}`;
      const rate=document.getElementById('seasonDecisionRate');if(rate&&!ratings.length)rate.textContent='—';
    }
  }

  // -------------------------------------------------------------------
  // 4) Full-season simulation: chunk work into small batches and yield to
  //    the browser, so the UI keeps repainting and responding. Major/world
  //    cup/events/trades still interrupt at their real checkpoints.
  // -------------------------------------------------------------------
  let v13WholeToken=0;
  function v13StopWhole(reason=''){
    seasonState.v13WholeSimActive=false;seasonState.simulating=false;
    if(reason){const n=document.getElementById('seasonSimNote');if(n)n.textContent=reason}
    renderSeason();
  }
  function v13WorldCupDue(){
    const api=window.__OWL_WORLD_CUP;if(!api?.maybeMarkDue)return null;
    const rec=api.maybeMarkDue();return rec&&!rec.completed&&rec.pendingStage?rec:null;
  }
  function v13ProcessStageBreak(){
    if(!seasonState.stageBreakPending)return false;
    const s=seasonState.stageBreakPending;
    if(stageQualified(s))simulateStagePlayoff(s);else skipStageBreak(s);
    seasonState.stageBreakPending=null;
    if(v13Year()>=2024&&s===2&&seasonState.v71AllStarPending){
      seasonState.simulating=false;seasonState.v13WholeSimActive=false;seasonState.v71ResumeWholeAfterAllStar=true;renderSeason();setTimeout(()=>typeof v71OpenAllStarWeekend==='function'&&v71OpenAllStarWeekend(),80);return true;
    }
    return false;
  }
  function v13WholeSeason(){
    if(typeof window.__OWL_V17_FULL_SEASON==='function')return window.__OWL_V17_FULL_SEASON();
    if(seasonState.simulating||seasonState.v13WholeSimActive||seasonState.played>=seasonState.total)return;
    const wc=v13WorldCupDue();if(wc){window.__OWL_WORLD_CUP.open();return}
    seasonState.simulating=true;seasonState.v13WholeSimActive=true;seasonState.resumeWholeAfterEvent=false;
    const token=++v13WholeToken;
    if(v13ProcessStageBreak())return;
    const step=()=>{
      if(token!==v13WholeToken||!seasonState.v13WholeSimActive)return;
      let batch=0;
      while(batch++<4&&seasonState.played<seasonState.total){
        const before=seasonState.played;
        window.__OWL_V16_SEASON_BATCHING=true;
        try{v32SilentRegularGame();}finally{window.__OWL_V16_SEASON_BATCHING=false;}
        if(seasonState.played===before){v13StopWhole('模拟被当前流程节点暂停，请先处理页面上的事件。');return}
        markStageBreakIfNeeded();

        if(careerState.v800Trade?.pending){seasonState.v13WholeSimActive=false;seasonState.simulating=false;renderSeason();return}
        const due=v13WorldCupDue();if(due){seasonState.v13WholeSimActive=false;seasonState.simulating=false;seasonState.v13ResumeWholeAfterWorldCup=true;renderSeason();setTimeout(()=>window.__OWL_WORLD_CUP.open(),60);return}
        if(seasonState.eventDue){seasonState.v13WholeSimActive=false;seasonState.simulating=false;seasonState.resumeWholeAfterEvent=true;renderSeason();setTimeout(openScheduledSeasonEvent,80);return}
        if(seasonState.stageBreakPending&&v13ProcessStageBreak())return;
      }
      const note=document.getElementById('seasonSimNote');if(note)note.textContent=`⏳ 正在模拟全部常规赛：${seasonState.played}/${seasonState.total} · ${seasonState.wins}胜${seasonState.losses}负`;
      renderSeason();
      if(seasonState.played>=seasonState.total){seasonState.v13WholeSimActive=false;seasonState.simulating=false;seasonState.resumeWholeAfterEvent=false;if(note)note.textContent=`✓ 已模拟完整常规赛：${seasonState.wins}胜${seasonState.losses}负。`;renderSeason();return}
      (window.requestAnimationFrame?requestAnimationFrame(()=>setTimeout(step,0)):setTimeout(step,0));
    };
    renderSeason();(window.requestAnimationFrame?requestAnimationFrame(()=>setTimeout(step,0)):setTimeout(step,0));
  }
  v35SimulateWholeSeason=v13WholeSeason;

  // World Cup node can resume a requested full-season run after the user
  // actually finishes the pending national-team node and closes the panel.
  const wcApi=window.__OWL_WORLD_CUP;
  if(wcApi?.close){
    const oldClose=wcApi.close;wcApi.close=function(){const out=oldClose();const rec=wcApi.ensure?.();if(seasonState.v13ResumeWholeAfterWorldCup&&(!rec||rec.completed||!rec.pendingStage)){seasonState.v13ResumeWholeAfterWorldCup=false;setTimeout(v13WholeSeason,140)}return out};
  }

  // -------------------------------------------------------------------
  // Final render wrapper: these are pure UI corrections and must happen
  // after every legacy/historical/world-cup/potential renderer has run.
  // -------------------------------------------------------------------
  const oldRender=renderSeason;
  renderSeason=function(...args){const out=oldRender.apply(this,args);v13EnsureRuleButton();v13RelayoutSeason();v13FixDnpUi();return out};

  // The HTML button listeners call the global function at click time; this
  // capture guard also prevents an old listener from invoking it twice.
  document.getElementById('fullSimSeasonBtn')?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();v13WholeSeason()},true);

  v13EnsureRuleButton();
  window.__OWL_V13={version:V13,openRulebook:v13OpenRulebook,relayout:v13RelayoutSeason,fullSeason:v13WholeSeason,rule:v13RuleModel};
})();
