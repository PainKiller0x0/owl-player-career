
/* ===== V7.6.7 HOTFIX · 2024+ Stage flow / All-Star / legacy card cleanup / Major result detail ===== */
(function(){
  const V767_VERSION='V7.6.7';

  /* V7.1 的这些函数都封装在模块内部，不能从外部直接调用。
     这里只依赖全局状态和全局的 simulateStagePlayoff / fastSeasonStep 等入口。 */
  function v767IsOwl2(){return Number(careerState.seasonYear||0)>=2024;}
  function v767StageNo(){const p=Number(seasonState.played||0);return p<19?1:p<37?2:3;}
  function v767StageTarget(stage){return stage===1?19:stage===2?37:56;}
  function v767ClearTimer(){if(seasonState.timer){clearTimeout(seasonState.timer);seasonState.timer=null;}}
  function v767ConfZh(conf){return conf==='East'?'东部':'西部';}

  /* 1) 新赛季必须清掉上一年/上一轮残留的全明星状态。 */
  const _v767SetupSeasonBase=setupSeason;
  setupSeason=function(isRestart=false){
    if(v767IsOwl2()){
      seasonState.v71AllStarPending=false;
      seasonState.v71AllStar=null;
      seasonState.v71AllStarDraftPriority=null;
      seasonState.v71ResumeWholeAfterAllStar=false;
      seasonState.v767StageSimulating=false;
      seasonState.v767StageTarget=null;
    }
    const out=_v767SetupSeasonBase(isRestart);
    if(v767IsOwl2()){
      seasonState.v71AllStarPending=false;
      seasonState.v71ResumeWholeAfterAllStar=false;
      seasonState.v767StageSimulating=false;
      seasonState.v767StageTarget=null;
    }
    return out;
  };

  /* 2) 通过全局 simulateStagePlayoff 包住 Major：
        Major 2 才产生 All-Star pending，Major 1/3 清理脏状态。 */
  const _v767SimStageBase=simulateStagePlayoff;
  simulateStagePlayoff=function(stageNo){
    const n=Number(stageNo)||0;
    if(v767IsOwl2()&&n!==2){
      seasonState.v71AllStarPending=false;
      seasonState.v71ResumeWholeAfterAllStar=false;
    }
    const out=_v767SimStageBase(stageNo);
    if(v767IsOwl2()){
      if(n===2)seasonState.v71AllStarPending=true;
      if(n===3)seasonState.v71AllStarPending=false;
    }
    return out;
  };

  /* 3) “模拟本赛段”只跑当前Stage，绝不越过下一个Stage的里程碑。
        仍然复用原 fastSeasonStep，因此原有伤病/随机事件逻辑不被另写一份。 */
  const _v767FastSeasonStepBase=fastSeasonStep;
  fastSeasonStep=function(){
    if(!v767IsOwl2() || !seasonState.v767StageSimulating){
      return _v767FastSeasonStepBase();
    }
    const target=Number(seasonState.v767StageTarget||56);
    if(seasonState.stageBreakPending || seasonState.v71LastMajorSummary || seasonState.played>=target){
      seasonState.simulating=false;
      seasonState.v767StageSimulating=false;
      v767ClearTimer();
      renderSeason();
      return;
    }

    _v767FastSeasonStepBase();

    if(seasonState.stageBreakPending || seasonState.played>=target){
      seasonState.simulating=false;
      seasonState.v767StageSimulating=false;
      v767ClearTimer();
      renderSeason();
      return;
    }

    /* 旧模拟器因为伤病/事件主动暂停时，保留“当前Stage模拟”标记；
       事件处理完后下一次fastSeasonStep仍会继续跑到本Stage边界。 */
  };

  const _v767ToggleFastBase=toggleFastSeasonSimulation;
  toggleFastSeasonSimulation=function(){
    if(!v767IsOwl2())return _v767ToggleFastBase();

    /* Stage 2 Major之后，如果玩家再点“模拟本赛段”，先补全明星。
       用现成的Major“继续赛季”按钮触发现有V7.4.2状态机，避免调用模块私有函数。 */
    if(seasonState.v71AllStarPending && Number(seasonState.played)===37){
      seasonState.simulating=false;
      seasonState.v767StageSimulating=false;
      v767ClearTimer();
      const btn=document.querySelector('#v742ContinueMajorBtn,#v741ContinueMajorBtn,#v71ContinueMajorBtn');
      if(btn){btn.click();return;}
      return;
    }

    if(seasonState.stageBreakPending || seasonState.v71LastMajorSummary){
      renderSeason();
      return;
    }

    if(seasonState.simulating){
      seasonState.v767StageSimulating=false;
      v767ClearTimer();
      return _v767ToggleFastBase();
    }

    if(Number(seasonState.played)>=56)return;

    const stage=v767StageNo(),target=v767StageTarget(stage);
    if(!stage||Number(seasonState.played)>=target)return;

    seasonState.v767StageSimulating=true;
    seasonState.v767StageTarget=target;
    seasonState.simulating=true;
    const note=document.getElementById('seasonSimNote');
    if(note)note.textContent=`正在模拟 Stage ${stage}：本阶段 ${target-(Number(seasonState.played)||0)} 场。到阶段边界自动暂停，Major / 全明星不会被跳过。`;
    renderSeason();
    fastSeasonStep();
  };

  /* 4) 旧V4.2结果卡彻底退出2024+。 */
  function v767RemoveLegacyStageCards(){
    if(!v767IsOwl2())return;
    document.querySelectorAll('#seasonScreen .v42-stage-result-card').forEach(n=>n.remove());
    document.querySelectorAll('#seasonScreen #v42ContinueStageBtn').forEach(n=>n.remove());
    const inline=document.getElementById('v741SeasonInlineMilestone');
    if(inline && !inline.querySelector('.stage-break-card,.season-complete-banner')){
      inline.classList.remove('show');
    }
  }

  /* 5) Major结果卡：显示你的具体成绩、冠亚军、决赛比分和玩家对局过程。 */
  function v767EnhanceMajorResult(){
    if(!v767IsOwl2())return;
    const h=seasonState.v71LastMajorSummary;
    if(!h)return;

    const inlineHost=document.getElementById('v741SeasonInlineMilestone');
    let inline=inlineHost?.querySelector('.v71-major-result');

    /* Stage 3 正好发生在56/56，旧render会先把“赛季结束卡”塞进inline。
       这里必须把它替换成Major 3结果卡，不能让赛季结算把Major结果吃掉。 */
    if(!inline && inlineHost){
      inlineHost.innerHTML='<div class="stage-break-card v71-major-result"></div>';
      inlineHost.classList.add('show');
      document.getElementById('seasonCompleteArea')?.replaceChildren();
      inline=inlineHost.querySelector('.v71-major-result');
    }

    const all=[...document.querySelectorAll('#seasonScreen .v71-major-result')];
    const cards=inline?[inline]:all.slice(0,1);
    all.forEach(card=>{if(!cards.includes(card))card.remove();});

    cards.forEach(card=>{
      const rounds=(h.rounds||[]).map(r=>
        `<span class="v767-major-round ${r.won?'win':'loss'}"><b>${r.round||'系列赛'}</b> vs ${r.opponent||'对手'} · ${r.score|| (r.won?'胜':'负')}</span>`
      ).join('');
      const slot=h.championConference==='East'?'东5西3':'东3西5';
      const buttonId=Number(h.stage)===2?'v742ContinueMajorBtn':'v767ContinueMajorBtn';
      let displayFinalScore=h.finalScore||'';
      if(displayFinalScore){const parts=displayFinalScore.split(':').map(Number);if(parts.length===2&&parts[1]===4&&parts[0]!==4)displayFinalScore=`${parts[1]}:${parts[0]}`;}
      if(displayFinalScore&&displayFinalScore!==h.finalScore){h.finalScore=displayFinalScore;const saved=(seasonState.stagePlayoffHistory||[]).find(x=>Number(x.stage)===Number(h.stage));if(saved)saved.finalScore=displayFinalScore;}

      card.innerHTML=`
        <div class="offseason-kicker">MAJOR ${h.stage} · FINAL</div>
        <h3>🏆 Major ${h.stage} 结算</h3>
        <p>${v767ConfZh(h.championConference)}赢下Major；下一届Major席位变为 ${slot}。${h.bonusLP?`你的Major奖励：+${h.bonusLP} LP。`:''}</p>
        <div class="v767-major-stats">
          <div><span>你的成绩</span><strong>${h.result||'未参赛'}</strong></div>
          <div><span>冠军</span><strong>${h.champion||'待定'}</strong></div>
          <div><span>亚军</span><strong>${h.runnerUp||'待定'}</strong></div>
        </div>
        ${displayFinalScore?`<div class="v767-major-final">🏆 总决赛：${h.champion} ${displayFinalScore} ${h.runnerUp}</div>`:''}
        ${rounds?`<div class="v767-major-rounds">${rounds}</div>`:'<div class="v767-major-rounds empty">本次未产生玩家对局记录</div>'}
        <button class="primary-btn" id="${buttonId}" type="button">继续赛季 →</button>`;

      if(Number(h.stage)!==2){
        card.querySelector('#v767ContinueMajorBtn')?.addEventListener('click',()=>{
          seasonState.v71LastMajorSummary=null;
          renderSeason();
        });
      }
    });
  }

  /* 6) 最外层render收口：2024+只允许自己的3-Stage UI。 */
  const _v767RenderSeasonBase=renderSeason;
  renderSeason=function(){
    _v767RenderSeasonBase();
    if(!v767IsOwl2())return;
    v767RemoveLegacyStageCards();
    v767EnhanceMajorResult();

    if(Number(seasonState.played)>=56){
      document.querySelectorAll('#seasonScreen #v42ContinueStageBtn').forEach(n=>n.remove());
    }

    const fast=document.getElementById('fastSimSeasonBtn');
    if(fast && !seasonState.stageBreakPending && !seasonState.v71LastMajorSummary){
      if(seasonState.v71AllStarPending && Number(seasonState.played)===37){
        fast.textContent='⭐ 进入全明星周末';
      }else if(Number(seasonState.played)<56){
        const st=v767StageNo();
        fast.textContent=seasonState.simulating?'⏸ 停止模拟':`⏩ 模拟 Stage ${st}`;
      }
    }
  };

  window.__OWL_V767_DIAGNOSTICS=()=>({
    version:V767_VERSION,
    year:Number(careerState.seasonYear||0),
    owl2:v767IsOwl2(),
    total:Number(seasonState.total||0),
    played:Number(seasonState.played||0),
    stage:v767StageNo(),
    stageTarget:seasonState.v767StageTarget||null,
    stageSimulating:!!seasonState.v767StageSimulating,
    stageBreakPending:seasonState.stageBreakPending||null,
    stageProcessed:[...(seasonState.stageProcessed||[])],
    majorSummary:seasonState.v71LastMajorSummary?.stage||null,
    allStarPending:!!seasonState.v71AllStarPending,
    legacyStageCards:document.querySelectorAll('#seasonScreen .v42-stage-result-card').length,
    legacyStage4Buttons:[...document.querySelectorAll('#seasonScreen button')].filter(b=>/Stage 4/.test(b.textContent||'')).length,
    allStarOverlayVisible:!document.getElementById('seasonEventOverlay')?.classList.contains('hidden')
  });

  /* 修复旧测试入口：梦幻模式只允许2019~2023开档；测试2024应走history。 */
  const _v767TestWorldBase=window.__OWL_V76_TEST_WORLD;
  window.__OWL_V76_TEST_WORLD=function(startYear=2019,inspectYear=startYear){
    if(Number(startYear)>=2024){
      careerState.simulationMode='history';
      careerState.startYear=2019;
      careerState.seasonYear=Number(startYear);
      const team=TEAMS.find(t=>t.short==='GZC')||TEAMS[0];
      careerState.team=team;
      careerState.starters=createRoster(team,true);
      careerState.bench=createBenchForTeam(team);
      setupSeason(false);
      renderSeason();
      return window.__OWL_V767_DIAGNOSTICS();
    }
    return _v767TestWorldBase(startYear,inspectYear);
  };

  if(!document.getElementById('v767Style')){
    const st=document.createElement('style');st.id='v767Style';st.textContent=`
      .v767-major-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0}
      .v767-major-stats>div{padding:10px;border:1px solid var(--line);border-radius:12px;background:rgba(255,255,255,.04)}
      .v767-major-stats span{display:block;color:var(--muted);font-size:10px}
      .v767-major-stats strong{display:block;margin-top:3px;font-size:14px}
      .v767-major-final{padding:9px 12px;border:1px solid rgba(231,180,62,.45);border-radius:10px;background:rgba(231,180,62,.07);font-weight:850;margin-bottom:9px}
      .v767-major-rounds{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px}
      .v767-major-round{display:inline-flex;align-items:center;gap:4px;padding:5px 8px;border-radius:9px;border:1px solid var(--line);font-size:10px;background:rgba(255,255,255,.04)}
      .v767-major-round.win{border-color:rgba(47,155,114,.45)}
      .v767-major-round.loss{border-color:rgba(201,79,63,.45)}
      .v767-major-round.empty{color:var(--muted)}
      @media(max-width:720px){
        .v767-major-stats{grid-template-columns:1fr}
        .v767-major-round{font-size:9px}
      }
    `;document.head.appendChild(st);
  }
})();

/* ===== V7.6.8 · Unified Season Primary Action Slot ===== */
(function(){
  const V768_VERSION='7.6.8';

  function v768Track(){return document.querySelector('#seasonScreen .season-track-card');}
  function v768EnsurePrimarySlot(){
    const track=v768Track();
    if(!track)return null;
    const head=track.querySelector('.season-track-head');
    if(!head)return null;
    let slot=document.getElementById('v768SeasonPrimaryAction');
    if(!slot){
      slot=document.createElement('div');
      slot.id='v768SeasonPrimaryAction';
      slot.className='v768-season-primary-action';
    }
    // 永远固定在“常规赛赛程”标题下、Stage进度上。
    if(slot.parentNode!==track || slot.previousElementSibling!==head){
      head.insertAdjacentElement('afterend',slot);
    }
    return slot;
  }

  function v768InlineMilestone(){return document.getElementById('v741SeasonInlineMilestone');}
  function v768ClearOldDirectCards(){
    const slot=document.getElementById('v768SeasonPrimaryAction');
    if(!slot)return;
    [...slot.children].forEach(node=>{
      if(node.id==='v741SeasonInlineMilestone')return;
      node.remove();
    });
  }
  function v768BottomAction(){
    const bottom=document.getElementById('seasonCompleteArea');
    if(!bottom)return null;
    return bottom.querySelector(':scope > .stage-break-card, :scope > .season-complete-banner');
  }
  function v768InlineActive(inline){
    if(!inline)return false;
    return inline.classList.contains('show') && !!inline.querySelector('.stage-break-card,.season-complete-banner');
  }
  function v768StateKey(slot){
    const inline=v768InlineMilestone();
    if(v768InlineActive(inline)){
      if(seasonState.v71LastMajorSummary)return `major:${careerState.seasonYear}:${seasonState.v71LastMajorSummary.stage}`;
      if(seasonState.stageBreakPending)return `stage:${careerState.seasonYear}:${seasonState.stageBreakPending}`;
      return `inline:${careerState.seasonYear}:${seasonState.played}`;
    }
    if(slot?.querySelector(':scope > .season-complete-banner'))return `final:${careerState.seasonYear}:${seasonState.played}`;
    if(slot?.querySelector(':scope > .stage-break-card'))return `stage:${careerState.seasonYear}:${seasonState.stageBreakPending||seasonState.played}`;
    return 'none';
  }
  function v768SyncPrimaryAction(){
    const slot=v768EnsurePrimarySlot();
    if(!slot)return;

    // 2024+原有Major/Stage节点继续复用同一DOM，只把它搬到统一主操作位。
    const inline=v768InlineMilestone();
    if(inline && inline.parentNode!==slot)slot.appendChild(inline);

    // 2019~2023 Stage节点、以及所有年份的常规赛最终结算，原本都生成在页面最底部。
    // 事件监听已经绑定在节点上，直接搬DOM即可保留行为。
    const bottomAction=v768BottomAction();
    if(bottomAction && !v768InlineActive(inline)){
      [...slot.children].forEach(node=>{if(node!==inline)node.remove();});
      slot.appendChild(bottomAction);
    }else if(bottomAction && v768InlineActive(inline)){
      // 当前有更高优先级的Major/阶段节点时，底部副本不应抢焦点。
      bottomAction.remove();
    }

    const active=v768InlineActive(inline) || !!slot.querySelector(':scope > .stage-break-card,:scope > .season-complete-banner');
    slot.classList.toggle('show',active);

    const key=v768StateKey(slot),prev=slot.dataset.v768State||'none';
    slot.dataset.v768State=key;
    if(active && key!==prev){
      requestAnimationFrame(()=>{
        try{slot.scrollIntoView({behavior:'smooth',block:'start'});}catch(_e){}
      });
    }
  }

  const _v768RenderSeasonBase=renderSeason;
  renderSeason=function(){
    // 历史赛季/最终结算的卡片会在旧render里重新生成，因此先清掉上一次搬来的副本。
    v768ClearOldDirectCards();
    _v768RenderSeasonBase();
    v768SyncPrimaryAction();
  };

  // 当前页面如果已经停在赛季页，热更新后立刻统一一次位置。
  if(document.getElementById('seasonScreen'))v768SyncPrimaryAction();

  window.__OWL_V768_DIAGNOSTICS=()=>{
    const slot=v768EnsurePrimarySlot(),inline=v768InlineMilestone(),bottom=document.getElementById('seasonCompleteArea');
    return {
      version:V768_VERSION,
      year:Number(careerState.seasonYear||0),played:Number(seasonState.played||0),
      stageBreakPending:seasonState.stageBreakPending||null,majorSummary:seasonState.v71LastMajorSummary?.stage||null,
      slotExists:!!slot,slotActive:!!slot?.classList.contains('show'),
      inlineParent:inline?.parentElement?.id||null,
      slotCard:slot?.querySelector('.stage-break-card,.season-complete-banner')?.className||null,
      bottomActionCards:bottom?.querySelectorAll(':scope > .stage-break-card,:scope > .season-complete-banner').length||0,
      slotBeforeDots:!!(slot && slot.nextElementSibling?.id==='seasonDots')
    };
  };

  if(!document.getElementById('v768Style')){
    const st=document.createElement('style');st.id='v768Style';st.textContent=`
      #seasonScreen .v768-season-primary-action{display:none;margin:16px 0 14px;scroll-margin-top:18px}
      #seasonScreen .v768-season-primary-action.show{display:block}
      #seasonScreen .v768-season-primary-action>.stage-break-card,
      #seasonScreen .v768-season-primary-action>.season-complete-banner,
      #seasonScreen .v768-season-primary-action #v741SeasonInlineMilestone .stage-break-card,
      #seasonScreen .v768-season-primary-action #v741SeasonInlineMilestone .season-complete-banner{margin:0!important;width:100%;box-sizing:border-box;box-shadow:none!important}
      #seasonScreen .v768-season-primary-action #v741SeasonInlineMilestone{margin:0!important}
      #seasonScreen .v768-season-primary-action #v741SeasonInlineMilestone.show{display:block!important}
      #seasonScreen #seasonCompleteArea:empty{display:none}
      @media(max-width:720px){
        #seasonScreen .v768-season-primary-action{margin:12px 0 10px}
        #seasonScreen .v768-season-primary-action .stage-break-card,
        #seasonScreen .v768-season-primary-action .season-complete-banner{padding:14px 12px!important;border-radius:16px!important}
        #seasonScreen .v768-season-primary-action button{width:100%;min-width:0!important}
      }
    `;document.head.appendChild(st);
  }
})();

