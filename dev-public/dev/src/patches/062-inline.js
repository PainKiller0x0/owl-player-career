/* ======================================================================
   Public Beta 1.9 RC12 · Stage / Major Experience Polish
   - 2024+ Stage boundaries no longer stop on a single-button qualification gate
   - Major result remains visible because it contains placement / LP / slot changes
   - high-frequency match / sim copy stays rule-focused and compact
   ====================================================================== */
(function(){
  const VER='Public Beta 1.9 RC12';
  let autoStageTimer32=null;

  function scheduleStageResolve32(){
    if(Number(careerState.seasonYear)<2024||!seasonState.stageBreakPending)return;
    const stage=Number(seasonState.stageBreakPending);
    if(!stage||seasonState.v32AutoStageResolving===stage)return;
    seasonState.v32AutoStageResolving=stage;
    clearTimeout(autoStageTimer32);
    autoStageTimer32=setTimeout(()=>{
      if(Number(seasonState.stageBreakPending)!==stage){seasonState.v32AutoStageResolving=null;return;}
      try{
        const qualified=typeof stageQualified==='function'&&stageQualified(stage);
        if(qualified&&typeof simulateStagePlayoff==='function')simulateStagePlayoff(stage);
        else if(typeof skipStageBreak==='function')skipStageBreak(stage);
      }finally{seasonState.v32AutoStageResolving=null;}
    },0);
  }

  function polishSeason32(){
    if(Number(careerState.seasonYear)>=2024){
      const area=document.getElementById('seasonCompleteArea');
      if(seasonState.stageBreakPending&&area){
        const s=Number(seasonState.stageBreakPending),rec=typeof stageRecord==='function'?stageRecord(s):null,rank=typeof stageEstimatedRank==='function'?stageEstimatedRank(s):null;
        area.innerHTML=`<div class="stage-break-card v32-stage-auto"><div class="offseason-kicker">STAGE ${s} COMPLETE</div><h3>Stage ${s} 已结束</h3><div class="stage-break-stats"><div><span>阶段战绩</span><strong>${rec?`${rec.wins}-${rec.losses}`:'—'}</strong></div><div><span>阶段排名</span><strong>${rank?`第 ${rank}`:'—'}</strong></div><div><span>下一节点</span><strong>Major ${s}</strong></div></div></div>`;
        scheduleStageResolve32();
      }
      const sim=document.getElementById('seasonSimNote');
      if(sim&&/三届Major均按阶段节点同步结算/.test(sim.textContent||''))sim.textContent=`✓ 常规赛已完成：${seasonState.wins}胜${seasonState.losses}负。`;
    }
  }
  window.__OWL_RUNTIME?.render?.register('renderSeason','v32-season-polish',polishSeason32);

  // Recurring playoff header: keep the series format and actual decision order only.
  const _openPlayoff32=openNextPlayoffMatch;
  openNextPlayoffMatch=function(mode='quick'){
    const out=_openPlayoff32.apply(this,arguments);
    if(mode==='detail'&&Number(careerState.seasonYear)>=2025&&matchState.context==='playoff'){
      const d=document.getElementById('matchDesc');
      if(d)d.textContent=`${matchState.targetWins===4?'总决赛 FT4':'本轮 FT3'} · 选图 → 换人 → Hero Ban`;
    }
    return out;
  };

  window.__OWL_V26_UX={version:VER,autoStageResolve:scheduleStageResolve32};
})();
