/* ======================================================================
   Public Beta 1.9 RC5 · Career Pacing & Event Variety
   - output roles show damage + final blows as representative stats
   - postseason stats use actual series map counts
   - offseason hero specialization available in 2019-2023 with year-legal pool
   - whole-regular-season sim auto-resolves Stage/Major but stops before annual postseason
   - World Cup gets optional detailed match engine; quick sim remains default
   - P1: hero training 7/5/3/2, era-based OWL stat profiles, career-seeded World Cup RNG
   ====================================================================== */
(function(){
  const V18='Public Beta 1.9 RC5';
  const clamp18=(v,a,b)=>Math.max(a,Math.min(b,v));
  const n18=v=>Number(v)||0;
  const ROLE18=(window.__OWL_V17?.roleBaselines)||{
    '坦克':{elim:16.4,death:5.45,assist:8.4,damage:7600,heal:0,fb:4.9},
    '长枪输出':{elim:15.6,death:5.35,assist:4.4,damage:8750,heal:0,fb:7.4},
    '弹道输出':{elim:17.2,death:5.65,assist:5.4,damage:8250,heal:0,fb:6.5},
    '输出支援':{elim:11.7,death:4.75,assist:11.8,damage:4300,heal:9900,fb:2.6},
    '战术支援':{elim:9.6,death:4.45,assist:14.2,damage:2850,heal:7200,fb:1.6}
  };
  const MAP_MIN=10.5;
  function roleProfile18(role){return window.__OWL_V17?.roleProfile?.(role,Number(careerState.seasonYear||state.year||2023))||ROLE18[role]||ROLE18['长枪输出']}
  function mapMin18(){return Number(window.__OWL_V17?.mapMinutes?.(Number(careerState.seasonYear||state.year||2023))||MAP_MIN)}
  function myOvr18(){const x=Number(getMyOvr()==='--'?78:getMyOvr());return Number.isFinite(x)?x:78}
  function perf18(rating,ovr,playoff=false){return clamp18(1+(n18(rating)-7)*.065+(n18(ovr)-80)*.0045+(playoff?.025:0),.84,1.20)}
  function death18(rating,ovr){return clamp18(1-(n18(rating)-7)*.045-(n18(ovr)-80)*.0025,.78,1.16)}
  function fmt18(v){return v>=1000?`${Math.round(v/100)/10}k`:String(Math.round(v))}
  function scoreMaps(row){
    if(Number.isFinite(Number(row?.mapsPlayed)))return Math.max(0,Number(row.mapsPlayed));
    const m=String(row?.score||'').match(/(\d+)\s*[:：-]\s*(\d+)/);return m?Number(m[1])+Number(m[2]):0;
  }
  function regularMaps18(){const logs=seasonState.v75StoryLog||[],m=logs.reduce((a,x)=>a+Math.max(0,n18(x.mapsPlayed)),0);if(m>0)return m;const a=seasonState.userRatings?.length||0;return a?Math.max(1,Math.round(a*3.05)):0}
  function playoffRows18(){return (playoffState.results||[]).filter(x=>!x.rested&&!x.dnp&&(x.mapsPlayed==null||n18(x.mapsPlayed)>0));}
  function playoffMaps18(){const rows=playoffRows18();return rows.reduce((a,x)=>a+(scoreMaps(x)||3),0)}
  function statBoxes18(role,base,scale,maps,avg,games){
    // OWL Stats Lab-style presentation: rate stats are shown per 10 minutes.
    // Map volume remains context/sample size only and must never inflate the displayed rate.
    const damage10=Math.round(base.damage*scale),heal10=Math.round(base.heal*scale),fb10=(base.fb*scale).toFixed(1);
    const ds=death18(avg,myOvr18()),k=(base.elim*scale).toFixed(1),d=(base.death*ds).toFixed(1),a=(base.assist*scale).toFixed(1),mvp=Math.max(0,Math.round(games*clamp18((avg-6.5)*.20,.04,.58)));
    const boxes=[{label:'平均评分',value:avg.toFixed(1)},{label:'K / D / A（每10分钟）',value:`${k} / ${d} / ${a}`}];
    if(role==='长枪输出'||role==='弹道输出')boxes.push({label:'英雄伤害（每10分钟）',value:fmt18(damage10)},{label:'最后一击（每10分钟）',value:fb10});
    else if(role==='坦克')boxes.push({label:'英雄伤害（每10分钟）',value:fmt18(damage10)});
    else boxes.push({label:'治疗量（每10分钟）',value:fmt18(heal10)});
    boxes.push({label:'系列赛 MVP',value:String(mvp)});return boxes;
  }
  // Both regular and postseason use the same OWL-calibrated per-10 model + actual maps.
  synthesizeStageStats=function(kind='regular'){
    const role=state.role||'长枪输出',base=roleProfile18(role),ovr=myOvr18(),rows=playoffRows18();
    const games=kind==='regular'?(seasonState.userRatings?.length||0):rows.length;if(!games)return null;
    const avg=kind==='regular'?seasonState.userRatings.reduce((a,b)=>a+n18(b),0)/games:rows.reduce((a,b)=>a+n18(b.rating),0)/games;
    const maps=kind==='regular'?regularMaps18():playoffMaps18(),scale=perf18(avg,ovr,kind==='playoff');
    return{games,avgRating:avg,boxes:statBoxes18(role,base,scale,maps,avg,games),line:`OWL数据口径：个人核心数据统一按每10分钟展示；本阶段实际出场 ${Math.round(maps)} 张地图 · ${role}`};
  };
  // Old quick-playoff rows did not persist mapsPlayed. Recover from score and persist it once seen.
  if(typeof simulateSinglePlayoffSeries==='function'){
    const basePlayoff=simulateSinglePlayoffSeries;simulateSinglePlayoffSeries=function(...args){const before=(playoffState.results||[]).length,out=basePlayoff.apply(this,args),row=(playoffState.results||[]).at(-1);if((playoffState.results||[]).length>before&&row&&row.mapsPlayed==null){const m=scoreMaps(row);if(m)row.mapsPlayed=m;}return out;};
  }

  // ----- Offseason hero lab for every career year, with current-year pro hero pool. -----
  function heroState18(){
    const y=Number(careerState.seasonYear||2019);offseasonState.v800HeroTraining=offseasonState.v800HeroTraining||{year:y,selected:[],done:false,results:[]};
    if(Number(offseasonState.v800HeroTraining.year)!==y)offseasonState.v800HeroTraining={year:y,selected:[],done:false,results:[]};return offseasonState.v800HeroTraining;
  }
  function estimateGain18(hero,index){
    const before=Number(hero.value||0),locked=state.locked||{},attrAvg=['mechanics','decision','pool'].map(k=>Number(locked[k]?.value||75)).reduce((a,b)=>a+b,0)/3;
    const aptitude=clamp18(.90+(attrAvg-72)*.006,.88,1.12),sf=clamp18(.94+(Number(careerState.condition||70)-65)*.0025,.90,1.10),pf=clamp18(Number(window.__OWL_POTENTIAL?.factor?.(careerState.age)||1),.82,1.22),tier=before>=90?2:before>=80?3:before>=70?5:7;
    return Math.max(0,Math.min(99-before,tier*(index===0?1:.72)*aptitude*sf*pf));
  }
  function renderHeroLab18(wrap){
    if(!window.__OWL_V800_HERO_IO)return;const h=heroState18(),year=Number(careerState.seasonYear||2019),pool=window.__OWL_V800_HERO_IO.pool(year).slice(0,18);wrap.querySelector('.v800-hero-training')?.remove();
    const results=new Map((h.results||[]).map(x=>[x.name,x])),block=document.createElement('div');block.className='v800-hero-training v18-year-hero-training';
    const cards=pool.map(x=>{const idx=h.selected.indexOf(x.name),r=results.get(x.name),tag=idx===0?'主练':idx===1?'副练':'',est=idx>=0&&!h.done?estimateGain18(x,idx):0;return`<button class="v800-hero-pick ${idx>=0?'selected':''} ${r?'trained':''}" data-v18-hero="${x.name}" ${h.done?'disabled':''}><span class="v800-hero-pick-top"><strong>${x.name} · ${Number(x.value).toFixed(1)}</strong>${tag?`<em class="v800-hero-role-tag ${idx===0?'primary':'secondary'}">${tag}</em>`:''}</span><small>${x.label} · ${year}职业可用${est?` · 预计 +${est.toFixed(2)}`:''}</small>${r?`<span class="v800-hero-gain">${Number(r.before).toFixed(1)} → <b>${Number(r.after).toFixed(1)}</b> <i>+${Number(r.delta).toFixed(2)}</i></span>`:''}</button>`}).join('');
    const result=h.done&&h.results.length?`<div class="v800-hero-result-summary"><b>本次专项结果</b>${h.results.map(x=>`<span><em>${x.primary?'主练':'副练'}</em>${x.name}：${Number(x.before).toFixed(1)} → ${Number(x.after).toFixed(1)} <strong>+${Number(x.delta).toFixed(2)}</strong></span>`).join('')}</div>`:'';
    block.innerHTML=`<div class="offseason-kicker">OFFSEASON HERO LAB · 英雄专项</div><h4>${year} 英雄专项 · 最多训练2个英雄</h4><p>主练成长更高，副练较低；卡片显示预计涨幅。</p><div class="v800-hero-picks">${cards}</div>${result}<div class="v800-hero-training-foot"><span>${h.done?(h.results.length?'英雄专项已完成。':'本休赛期主动跳过英雄专项'):`已选 ${h.selected.length}/2${h.selected.length?' · 主练 / 副练不可重复':''}`}</span><div>${h.done?'':`<button class="secondary-btn v800-auto-hero-btn" id="v18AutoHeroTrain">⚡ 自动选择</button> <button class="secondary-btn" id="v18SkipHeroTrain">跳过专项</button> <button class="primary-btn" id="v18ApplyHeroTrain" ${h.selected.length?'':'disabled'}>确认英雄专项</button>`}</div></div>`;
    const summary=wrap.querySelector('.training-summary-grid');if(summary)summary.parentNode.insertBefore(block,summary);else wrap.prepend(block);
    block.querySelectorAll('[data-v18-hero]').forEach(b=>b.onclick=()=>{if(h.done)return;const name=b.dataset.v18Hero,i=h.selected.indexOf(name);if(i>=0)h.selected.splice(i,1);else if(h.selected.length<2)h.selected.push(name);else{h.selected.shift();h.selected.push(name)}renderOffseason();});
    document.getElementById('v18AutoHeroTrain')?.addEventListener('click',()=>{
      // RC23: 自动专项只补“尚未到90”的英雄，避免把已经90+的招牌英雄继续吃掉训练位。
      // 目标很朴素：90以下，分数越高越优先；如果不足2个，则只选现有符合条件的英雄。
      h.selected=[...pool].filter(x=>Number(x.value)<90).sort((a,b)=>{
        if(Number(b.value)!==Number(a.value))return Number(b.value)-Number(a.value);
        return String(a.name).localeCompare(String(b.name),'zh-CN');
      }).slice(0,2).map(x=>x.name);
      renderOffseason();
    });
    document.getElementById('v18SkipHeroTrain')?.addEventListener('click',()=>{h.done=true;h.results=[];renderOffseason();window.__OWL_PUBLIC_BETA?.autosave?.('hero-training-skip')});
    document.getElementById('v18ApplyHeroTrain')?.addEventListener('click',()=>{h.results=window.__OWL_V800_HERO_IO.train(h.selected,year);h.done=true;renderOffseason();window.__OWL_PUBLIC_BETA?.autosave?.('hero-training')});
  }
  if(typeof renderTrainingCamp==='function'){
    const baseTraining=renderTrainingCamp;renderTrainingCamp=function(wrap){const out=baseTraining.call(this,wrap);renderHeroLab18(wrap);return out;};
  }
  function focusHistoricalHeroLab18(){
    setTimeout(()=>{const hero=document.querySelector('#offseasonContent .v800-hero-training');if(!hero)return;hero.scrollIntoView({behavior:'smooth',block:'center'});try{hero.animate([{boxShadow:'0 0 0 0 rgba(255,107,61,0)'},{boxShadow:'0 0 0 3px rgba(255,107,61,.55)'},{boxShadow:'0 0 0 0 rgba(255,107,61,0)'}],{duration:900,easing:'ease-out'});}catch(e){}},60);
  }
  // Patch 1.6 skip guard only covered 2024+. Extend it to historical seasons.
  document.addEventListener('click',function(e){const btn=e.target?.closest?.('#confirmTrainingBtn');if(!btn||Number(careerState.seasonYear)>=2024)return;const h=heroState18();if(h.done)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();const selected=h.selected.length;window.__OWL_V16_MODAL?.confirm?.({icon:'🎮',kicker:'OFFSEASON HERO LAB · 英雄专项',title:selected?'英雄专项还没有确认':'本休赛期还没有训练英雄',body:`<p>${selected?`已选 ${selected} 个英雄，尚未确认。`:`${careerState.seasonYear} 英雄专项尚未处理。`}</p><p>继续将<strong>跳过本休赛期英雄专项</strong>。</p>`,confirmText:'仍然跳过并继续',cancelText:'返回训练英雄',cancelPrimary:true,tone:'warning',onCancel:focusHistoricalHeroLab18,onConfirm:()=>{h.done=true;h.results=[];confirmTrainingCamp();}});},true);

  // ----- Detailed World Cup match: patch the normal match finish CTA. -----
  if(typeof renderMapControl==='function'){
    const baseMapControl=renderMapControl;renderMapControl=function(...args){const out=baseMapControl.apply(this,args);if(matchState.context==='worldcup'&&matchState.finished){const old=document.getElementById('playAgainBtn');if(old){const b=old.cloneNode(true);b.id='returnWorldCupBtn';b.textContent='🌍 结算世界杯比赛';old.replaceWith(b);b.onclick=()=>window.__OWL_WORLD_CUP?.finishDetailed?.();}const h=document.querySelector('#mapControlArea .series-finish h3');if(h)h.textContent=matchState.homeScore>matchState.awayScore?'世界杯系列赛获胜':'世界杯系列赛失利';}return out;};
  }

  // ----- Whole-regular-season state machine: regular matches + Stage/Major, stop before annual playoffs. -----
  let whole18=0;
  function resolveStage18(){const st=Number(seasonState.stageBreakPending)||0;if(!st)return;window.__OWL_V16_SEASON_BATCHING=true;try{if(typeof v71IsOwl2==='function'&&v71IsOwl2())v71RunMajor(st);else (stageQualified(st)?simulateStagePlayoff(st):skipStageBreak(st));}finally{window.__OWL_V16_SEASON_BATCHING=false}seasonState.stageBreakPending=null;seasonState.v71LastMajorSummary=null;seasonState.v769TournamentResultPending=null;if(st===2&&seasonState.v71AllStarPending){try{if(typeof v71BuildAllStarResult==='function')v71BuildAllStarResult()}catch(e){}seasonState.v71AllStarPending=false;}}
  function worldCupBlock18(){const api=window.__OWL_WORLD_CUP,r=api?.maybeMarkDue?.();return r&&!r.completed&&r.pendingStage?r:null}
  function stop18(msg=''){window.__OWL_RUNTIME?.simulation?.stopWhole?.(msg);}
  function finishAnnualPostseason18(){
    renderSeason();
    // 2020-23 regional play-in resolves immediately from its button.
    const regional=document.getElementById('v762PlayInBtn');if(regional){regional.click();document.getElementById('v16ModalConfirm')?.click();if(playoffState.active&&currentPlayoffMatch())simulateWholePlayoffs();showSeasonSummary();return;}
    // 2019 historical play-in uses a two-step event overlay.
    const legacy=document.getElementById('enterPlayInBtn');if(legacy){legacy.click();document.getElementById('simulatePlayInBtn')?.click();document.getElementById('finishPlayInBtn')?.click();if(playoffState.active&&currentPlayoffMatch())simulateWholePlayoffs();showSeasonSummary();return;}
    const direct=document.getElementById('enterPlayoffsBtn');if(direct){direct.click();if(playoffState.active&&currentPlayoffMatch())simulateWholePlayoffs();showSeasonSummary();return;}
    if(playoffState.active&&currentPlayoffMatch())simulateWholePlayoffs();showSeasonSummary();
  }
  function fullSeason18(){
    if(seasonState.v18WholeActive)return;const wc=worldCupBlock18();if(wc){window.__OWL_WORLD_CUP?.open?.();return;}
    seasonState.v18WholeActive=true;seasonState.v17WholeActive=false;seasonState.simulating=true;seasonState.resumeWholeAfterEvent=false;const token=++whole18;
    const step=()=>{if(token!==whole18||!seasonState.v18WholeActive)return;let batch=0;
      while(batch++<12&&n18(seasonState.played)<n18(seasonState.total)){
        const before=n18(seasonState.played);window.__OWL_V16_SEASON_BATCHING=true;try{v32SilentRegularGame()}finally{window.__OWL_V16_SEASON_BATCHING=false}if(n18(seasonState.played)<=before){stop18('模拟被当前流程节点暂停，请先处理页面上的节点。');return;}
        markStageBreakIfNeeded();if(seasonState.stageBreakPending)resolveStage18();
        if(careerState.v800Trade?.pending){stop18('🔄 模拟在交易节点暂停。先决定自己的下一站。');return;}
        const world=worldCupBlock18();if(world){window.__OWL_RUNTIME?.simulation?.pauseWhole?.();seasonState.v13ResumeWholeAfterWorldCup=true;renderSeason();setTimeout(()=>window.__OWL_WORLD_CUP?.open?.(),50);return;}
        if(seasonState.currentEvent||seasonState.eventDue){window.__OWL_RUNTIME?.simulation?.pauseWhole?.();seasonState.resumeWholeAfterEvent=true;renderSeason();setTimeout(openScheduledSeasonEvent,60);return;}
      }
      renderSeason();const note=document.getElementById('seasonSimNote');if(note)note.textContent=`⏳ 正在模拟全部常规赛：${seasonState.played}/${seasonState.total} · ${seasonState.wins}胜${seasonState.losses}负`;
      if(n18(seasonState.played)>=n18(seasonState.total)){stop18('✓ 常规赛与阶段赛事已全部模拟完成。年终季后赛留给你亲自打。');return;}
      setTimeout(step,8);
    };renderSeason();setTimeout(step,0);
  }
  window.__OWL_V18_FULL_SEASON=fullSeason18;v35SimulateWholeSeason=fullSeason18;

  // Version + diagnostic API.
  function syncV18Version(){document.title='OWL 选手之路 · Public Beta 1.9 RC5';document.querySelectorAll('.cover-version b').forEach(x=>x.textContent='PUBLIC BETA · 1.9 RC5');}
  syncV18Version();
  const renderSeason18Base=renderSeason;renderSeason=function(...args){const out=renderSeason18Base.apply(this,args);syncV18Version();const full=document.getElementById('fullSimSeasonBtn');if(full)full.textContent='🚀 模拟全部常规赛';return out;};
  if(window.__OWL_PUBLIC_BETA)window.__OWL_PUBLIC_BETA.version=V18;if(window.__OWL_WORLD_CUP)window.__OWL_WORLD_CUP.version=V18;
  window.__OWL_V18={version:V18,regularMaps:regularMaps18,playoffMaps:playoffMaps18,heroState:heroState18,fullSeason:fullSeason18};
})();
