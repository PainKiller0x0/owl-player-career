/* ======================================================================
   Public Beta 1.7 RC1 · OWL Realism & Presentation
   - esports terminology cleanup
   - five-role OWL-calibrated stat model using per-10-minute baselines
   - 2019 / 2020 historical All-Star events
   - full-season async state-machine hardening
   - shareable PNG career card
   - season hero-mastery discoverability
   ====================================================================== */
(function(){
  const V17='Public Beta 1.7 RC1';
  const ROLE_REAL={
    '坦克':      {elim:16.4,death:5.45,assist:8.4, damage:7600, heal:0,    fb:4.9, sig:'damage'},
    '长枪输出':  {elim:15.6,death:5.35,assist:4.4, damage:8750, heal:0,    fb:7.4, sig:'fb'},
    '弹道输出':  {elim:17.2,death:5.65,assist:5.4, damage:8250, heal:0,    fb:6.5, sig:'fb'},
    '输出支援':  {elim:11.7,death:4.75,assist:11.8,damage:4300, heal:9900, fb:2.6, sig:'heal'},
    '战术支援':  {elim:9.6, death:4.45,assist:14.2,damage:2850, heal:7200, fb:1.6, sig:'heal'}
  };
  const MAP_MINUTES=10.5;
  const ERA_REAL={
    // 2019-20：6v6，团战更长、支援助攻/治疗占比更高，击杀与Final Blow略压低。
    '2019-20':{k:.96,d:.94,a:1.10,heal:1.08,damage:.97,fb:.93,mapMin:1.07},
    // 2021：仍为6v6，但阵容更开放，逐步向后期OWL节奏过渡。
    '2021':{k:.99,d:.98,a:1.04,heal:1.03,damage:1.00,fb:.98,mapMin:1.03},
    // 2022-23：OW2 5v5后个人击杀/伤害占比上升，团辅助攻与治疗略回落。
    '2022-23':{k:1.03,d:1.04,a:.94,heal:.96,damage:1.05,fb:1.05,mapMin:.98},
    // 2024+：架空延续线，维持成熟5v5节奏，只做非常小的强度漂移。
    '2024+':{k:1.04,d:1.03,a:.96,heal:.98,damage:1.06,fb:1.06,mapMin:.97}
  };
  const num=v=>Number(v)||0;
  const c=(v,a,b)=>Math.max(a,Math.min(b,v));
  function myOvr(){const v=Number(getMyOvr()==='--'?78:getMyOvr());return Number.isFinite(v)?v:78}
  function eraKey(year=Number(careerState.seasonYear||state.year||2023)){return year<=2020?'2019-20':year===2021?'2021':year<=2023?'2022-23':'2024+'}
  function eraMod(year){return ERA_REAL[eraKey(year)]||ERA_REAL['2022-23']}
  function roleBase(role=state.role,year=Number(careerState.seasonYear||state.year||2023)){const b=ROLE_REAL[role]||ROLE_REAL['长枪输出'],m=eraMod(year);return {...b,elim:b.elim*m.k,death:b.death*m.d,assist:b.assist*m.a,damage:b.damage*m.damage,heal:b.heal*m.heal,fb:b.fb*m.fb}}
  function mapMinutes(year=Number(careerState.seasonYear||state.year||2023)){return MAP_MINUTES*eraMod(year).mapMin}
  function performanceScale(rating,ovr,playoff=false){return c(1+(num(rating)-7)*.065+(num(ovr)-80)*.0045+(playoff?.025:0),.84,1.20)}
  function deathScale(rating,ovr){return c(1-(num(rating)-7)*.045-(num(ovr)-80)*.0025,.78,1.16)}
  function actualRegularMaps(){
    const logs=seasonState.v75StoryLog||[];
    const actual=logs.reduce((s,x)=>s+Math.max(0,num(x.mapsPlayed)),0);
    if(actual>0)return actual;
    const apps=seasonState.userRatings?.length||0;
    return apps?Math.max(1,Math.round(apps*3.05)):0;
  }
  function actualPlayoffMaps(){
    const rows=(playoffState.results||[]).filter(x=>!x.rested&&!x.dnp&&(x.mapsPlayed==null||num(x.mapsPlayed)>0));
    if(!rows.length)return 0;
    return rows.reduce((s,x)=>s+(x.mapsPlayed==null?3.15:Math.max(0,num(x.mapsPlayed))),0);
  }
  function fmtK(v){return v>=1000?`${Math.round(v/100)/10}k`:String(Math.round(v))}
  function roleSignature(role,base,scale,maps){
    if(base.sig==='heal')return {label:'治疗量（每10分钟）',value:fmtK(base.heal*scale)};
    if(base.sig==='fb')return {label:'最后一击（每10分钟）',value:(base.fb*scale).toFixed(1)};
    return {label:'英雄伤害（每10分钟）',value:fmtK(base.damage*scale)};
  }

  // ----- Five-role OWL stat calibration: per-10 rate + actual map volume -----
  synthesizeStageStats=function(kind='regular'){
    const role=state.role||'长枪输出',base=roleBase(role),ovr=myOvr();
    const rows=(playoffState.results||[]).filter(x=>!x.rested&&!x.dnp&&(x.mapsPlayed==null||num(x.mapsPlayed)>0));
    const games=kind==='regular'?(seasonState.userRatings?.length||0):rows.length;if(!games)return null;
    const avgRating=kind==='regular'?(seasonState.userRatings.reduce((a,b)=>a+b,0)/games):(rows.reduce((a,b)=>a+num(b.rating),0)/games);
    const maps=kind==='regular'?actualRegularMaps():actualPlayoffMaps();
    const scale=performanceScale(avgRating,ovr,kind==='playoff'),ds=deathScale(avgRating,ovr);
    const k=(base.elim*scale).toFixed(1),a=(base.assist*scale).toFixed(1),d=(base.death*ds).toFixed(1);
    const signature=roleSignature(role,base,scale,maps),mvpGames=Math.max(0,Math.round(games*c((avgRating-6.5)*.20,.04,.58)));
    return {games,avgRating,boxes:[{label:'平均评分',value:avgRating.toFixed(1)},{label:'K / D / A（每10分钟）',value:`${k} / ${d} / ${a}`},signature,{label:'系列赛 MVP',value:String(mvpGames)}],line:`OWL数据口径：个人核心数据统一按每10分钟展示；本阶段实际出场约 ${Math.round(maps)} 张地图 · ${role}`};
  };

  buildSeasonCareerStats=function(record,playoffSeries=0){
    const base=roleBase(record.role),regularApps=seasonState.userRatings?.length||0;
    const playoffRows=(playoffState.results||[]).filter(x=>!x.rested&&!x.dnp&&(x.mapsPlayed==null||num(x.mapsPlayed)>0));
    const appearances=regularApps+playoffRows.length,series=num(seasonState.played)+num(playoffSeries);
    if(!appearances)return {series,appearances:0,maps:0,missed:seasonState.gamesMissed||0,eliminations:0,deaths:0,assists:0,firstPicks:0,finalBlows:0,heroDamage:0,healing:0,decisionRate:null};
    const maps=actualRegularMaps()+actualPlayoffMaps(),minutes=Math.max(1,maps)*mapMinutes(record.year);
    const scale=performanceScale(record.rating,record.ovr,false),ds=deathScale(record.rating,record.ovr);
    const decisionRate=seasonState.decisionTotal?seasonState.decisionSuccess/seasonState.decisionTotal*100:null;
    return {series,appearances,maps:Math.round(maps),missed:seasonState.gamesMissed||0,
      eliminations:Math.round(base.elim*scale*minutes/10),deaths:Math.round(base.death*ds*minutes/10),assists:Math.round(base.assist*scale*minutes/10),
      firstPicks:Math.round(base.fb*scale*minutes/10*.72),finalBlows:Math.round(base.fb*scale*minutes/10),heroDamage:Math.round(base.damage*scale*minutes/10),healing:Math.round(base.heal*scale*minutes/10),blockedDamage:0,
      decisionRate:decisionRate==null?null:c(decisionRate,25,95)};
  };

  // ----- Historical All-Star: 2019 and 2020 existed; 2021-23 do not invent one. -----
  const ASIA_2020=new Set(['CDH','GZC','HZS','LDN','NYXL','NYE','SEO','SHD']);
  function allStarRoot(){seasonState.v17HistoricalAllStar=seasonState.v17HistoricalAllStar||null;return seasonState.v17HistoricalAllStar}
  function allStarDue(year=Number(careerState.seasonYear||0)){
    const a=allStarRoot();if(a?.year===year&&(a.done||a.pending))return false;
    if(year===2019)return num(seasonState.played)>=14&&!seasonState.stageBreakPending&&(seasonState.stageProcessed||[]).includes(2);
    if(year===2020)return num(seasonState.played)>=num(seasonState.total);
    return false;
  }
  function v17StableHash(text=''){let h=2166136261;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
  function normalizeHistoricalAllStar(a,year){
    if(!a)return a;
    if(year===2020){
      const region=ASIA_2020.has(careerState.team?.short)?'亚洲赛区':'北美赛区';
      const pair=region==='亚洲赛区'?['Triple A','Team Universe']:['Team D.Va','Team Reinhardt'];
      a.region=region;
      if(!a.side||['亚洲赛区','北美赛区'].includes(a.side)||!a.opponent||['亚洲赛区','北美赛区'].includes(a.opponent)){
        const idx=v17StableHash(`${state.playerName||'Rookie'}|${careerState.team?.short||'OWL'}|${year}`)%2;
        a.side=pair[idx];a.opponent=pair[1-idx];
      }
    }else if(year===2019){a.region='联盟全明星';}
    if(a.selected&&a.allStarRating==null){
      const seed=v17StableHash(`${state.playerName||'Rookie'}|${careerState.team?.short||'OWL'}|${year}|rating`);
      const jitter=((seed%21)-10)/20;
      a.allStarRating=Number(c(num(a.avg||7)+jitter+(a.starter?.10:0)+(a.won?.08:-.04),5.5,9.5).toFixed(1));
    }
    return a;
  }
  function historicalAllStarDetailHTML(a,year){
    normalizeHistoricalAllStar(a,year);
    const identity=!a.selected?'未入选正赛名单':a.starter?'全明星首发':'全明星替补';
    const played=a.selected&&a.participation!=='decline';
    const playerLine=played?`${identity} · 表现评分 ${Number(a.allStarRating||a.avg||7).toFixed(1)}${a.mvp?' · 正赛MVP':''}`:(a.participation==='decline'?'入选后主动退出':'未进入正赛名单');
    if(year===2019){
      return `<div class="v25-allstar-detail" id="v25HistoricalAllStarDetail" hidden>
        <div class="v25-allstar-detail-head"><div><span>ALL-STAR DETAILS</span><strong>2019 全明星周末详情</strong></div><em>Stage 2 后 · 暴雪竞技场</em></div>
        <div class="v25-allstar-detail-grid"><div><span>正赛对阵</span><strong>${a.side} vs ${a.opponent}</strong></div><div><span>你的记录</span><strong>${playerLine}</strong></div><div><span>正赛结果</span><strong>${a.won?a.side:a.opponent}获胜</strong></div></div>
        <div class="v25-allstar-section"><h4>本届全明星周末</h4><p><b>全明星正赛</b> · 大西洋与太平洋赛区明星选手正面对决。</p><p><b>黑百合 1v1</b> · 各赛区顶尖长枪选手参加的单败挑战，只计算爆头。</p><p><b>全明星街机</b> · 包含源氏/半藏、纯辅助、纯输出、卡西迪限定、禁坦克等娱乐模式。</p><p><b>Talent Takedown</b> · 解说与分析台成员参加的娱乐赛，不计入选手履历。</p></div>
      </div>`;
    }
    const asia=a.region==='亚洲赛区';
    const skills=asia
      ?'黑百合1v1 · 温斯顿技巧赛 · 源氏技巧赛 · 安娜技巧赛 · Who is Meta? · Talent Takedown'
      :'黑百合1v1 · Talent Takedown';
    return `<div class="v25-allstar-detail" id="v25HistoricalAllStarDetail" hidden>
      <div class="v25-allstar-detail-head"><div><span>ALL-STAR DETAILS</span><strong>2020 ${a.region}全明星详情</strong></div><em>线上举办 · 分赛区独立进行</em></div>
      <div class="v25-allstar-detail-grid"><div><span>正赛对阵</span><strong>${a.side} vs ${a.opponent}</strong></div><div><span>你的记录</span><strong>${playerLine}</strong></div><div><span>正赛结果</span><strong>${a.won?a.side:a.opponent}获胜</strong></div></div>
      <div class="v25-allstar-section"><h4>正赛特殊赛制</h4><p><b>第1图</b> · 标准 6v6。</p><p><b>第2图</b> · 双方为对手指定出场阵容。</p><p><b>第3图</b> · “迷你守望”娱乐规则，英雄会随伤害与治疗输出逐渐变大。</p><p><b>必要时决胜</b> · 使用同职责全员阵容进行控制图加赛。</p></div>
      <div class="v25-allstar-section"><h4>${a.region}周末项目</h4><p>${skills}</p>${!asia?'<small>2020 的温斯顿 / 源氏 / 安娜技巧赛与 Who is Meta? 为亚洲全明星周末限定项目。</small>':''}</div>
    </div>`;
  }
  function bindHistoricalAllStarDetail(year){
    const btn=document.getElementById('v25HistoricalAllStarDetailBtn'),detail=document.getElementById('v25HistoricalAllStarDetail');if(!btn||!detail)return;
    btn.onclick=()=>{detail.hidden=!detail.hidden;btn.textContent=detail.hidden?'查看详情':'收起详情';btn.setAttribute('aria-expanded',String(!detail.hidden));if(!detail.hidden)setTimeout(()=>detail.scrollIntoView({block:'nearest',behavior:'smooth'}),30)};
  }
  function buildHistoricalAllStar(year){
    const avg=seasonState.userRatings?.length?seasonState.userRatings.reduce((a,b)=>a+b,0)/seasonState.userRatings.length:0;
    const score=avg*10+num(careerState.popularity)*.12+myOvr()*.06;
    const selected=score>=80.5,starter=selected&&score>=85.5,mvp=starter&&avg>=7.85&&Math.random()<.34;
    let side,opponent,region;
    if(year===2019){side=careerState.team?.division==='Pacific'?'太平洋赛区':'大西洋赛区';opponent=side==='太平洋赛区'?'大西洋赛区':'太平洋赛区';region='联盟全明星';}
    else{region=ASIA_2020.has(careerState.team?.short)?'亚洲赛区':'北美赛区';const pair=region==='亚洲赛区'?['Triple A','Team Universe']:['Team D.Va','Team Reinhardt'];const idx=v17StableHash(`${state.playerName||'Rookie'}|${careerState.team?.short||'OWL'}|${year}`)%2;side=pair[idx];opponent=pair[1-idx];}
    const won=Math.random()<(selected?.55:.50);
    return normalizeHistoricalAllStar({year,pending:true,done:false,selected,starter,mvp,side,opponent,region,won,avg:Number(avg.toFixed(2)),participation:selected?null:'not-selected'},year);
  }
  let afterHistoricalAllStar=null,allStarOpening=false;
  function openHistoricalAllStar(after=null){
    const year=Number(careerState.seasonYear||0);if(![2019,2020].includes(year)||allStarOpening)return false;
    let a=allStarRoot();if(!a||a.year!==year)a=seasonState.v17HistoricalAllStar=buildHistoricalAllStar(year);else normalizeHistoricalAllStar(a,year);
    if(a.done)return false;allStarOpening=true;afterHistoricalAllStar=after||afterHistoricalAllStar;
    const overlay=document.getElementById('seasonEventOverlay'),holder=document.getElementById('seasonEventContent');if(!overlay||!holder){allStarOpening=false;return false;}
    const identity=!a.selected?'未入选正赛名单':a.starter?'⭐ 全明星首发':'⭐ 全明星替补';
    const finish=()=>{overlay.classList.add('hidden');a.pending=false;a.done=true;allStarOpening=false;seasonState.eventHistory=seasonState.eventHistory||[];seasonState.eventHistory.push({id:`historical-allstar-${year}`,icon:'⭐',title:`${year} OWL 全明星`,choice:a.participation==='decline'?`${identity} · 退选`:identity,summary:a.participation==='decline'?'入选后主动退出全明星':`${a.side} vs ${a.opponent} · ${a.won?'本方获胜':'本方失利'}`,afterMatch:seasonState.played});const cb=afterHistoricalAllStar;afterHistoricalAllStar=null;renderSeason();if(typeof cb==='function')setTimeout(cb,70);};
    if(a.selected&&!a.participation){
      holder.innerHTML=`<div class="season-event-top"><span class="season-event-kicker">HISTORICAL ALL-STAR · 参赛决定</span><span class="season-event-round">${year}</span></div><div class="season-event-icon">⭐</div><h2 class="season-event-title">${year} OWL 全明星邀请</h2><div class="season-event-copy"><p>你已入选本届全明星，原定参加：<strong>全明星正赛（${a.starter?'首发':'替补'}）</strong>。</p><p>你可以选择退出。退出会降低公众关注、提升本赛季状态，但<strong>不会影响队友信任</strong>。</p></div><div class="season-event-choices"><button class="season-event-choice" id="v17AttendHistoricalAllStar"><div><strong>参加今年全明星 →</strong></div></button><button class="season-event-choice danger" id="v17WithdrawHistoricalAllStar"><div><strong>退出今年全明星</strong></div></button></div>`;
      document.getElementById('v17AttendHistoricalAllStar').onclick=()=>{window.__OWL_ALLSTAR_DECISION?.attend?.(a);allStarOpening=false;openHistoricalAllStar(afterHistoricalAllStar);};
      document.getElementById('v17WithdrawHistoricalAllStar').onclick=()=>{window.__OWL_ALLSTAR_DECISION?.withdraw?.(a);allStarOpening=false;openHistoricalAllStar(afterHistoricalAllStar);};overlay.classList.remove('hidden');return true;
    }
    if(a.participation==='decline'){
      const p=a.withdrawPenalty||{};holder.innerHTML=`<div class="season-event-top"><span class="season-event-kicker">HISTORICAL ALL-STAR · WITHDRAWN</span><span class="season-event-round">${year}</span></div><div class="season-event-icon">⭐</div><h2 class="season-event-title">你退出了 ${year} OWL 全明星</h2><div class="season-event-copy"><p>你的“全明星入选”仍会记录，但没有实际参加正赛，因此不会获得首发或正赛MVP荣誉。</p><div class="v71-pregame-grid"><div><span>公众关注</span><strong>-${p.popLoss||0}</strong></div><div><span>本赛季状态</span><strong>+${p.conditionGain||0}</strong></div><div><span>队友信任</span><strong>不变</strong></div></div></div><div class="season-event-choices"><button class="season-event-choice" id="v17CloseHistoricalAllStar"><div><strong>${year===2019?'进入 Stage 3 →':'继续赛季结算 →'}</strong></div></button></div>`;document.getElementById('v17CloseHistoricalAllStar').onclick=finish;overlay.classList.remove('hidden');return true;
    }
    if(a.selected&&a.participation!=='attend')window.__OWL_ALLSTAR_DECISION?.attend?.(a);
    const regionCopy=year===2019?'Stage 2结束后，联盟在Stage 3前安排全明星周末。':`2020疫情赛季后段，联盟分别举行亚洲与北美全明星活动；你参加的是${a.region}场。`;
    holder.innerHTML=`<div class="season-event-top"><span class="season-event-kicker">HISTORICAL ALL-STAR · 史实节点</span><span class="season-event-round">${year}</span></div><div class="season-event-icon">⭐</div><h2 class="season-event-title">${year} OWL 全明星${year===2019?'周末':'赛'}</h2><div class="season-event-copy"><p>${regionCopy}</p><div class="v71-pregame-grid"><div><span>你的身份</span><strong>${identity}</strong></div><div><span>参加项目</span><strong>${a.selected?'全明星正赛':'—'}</strong></div><div><span>正赛结果</span><strong>${a.won?a.side:a.opponent}获胜${a.mvp?' · 你获正赛MVP':''}</strong></div></div><p>${a.selected?'你实际参加了本届全明星正赛。':'你没有进入最终名单。'}</p>${historicalAllStarDetailHTML(a,year)}</div><div class="season-event-choices v25-allstar-actions"><button class="secondary-btn" id="v25HistoricalAllStarDetailBtn" aria-expanded="false">查看详情</button><button class="season-event-choice" id="v17CloseHistoricalAllStar"><div><strong>${year===2019?'进入 Stage 3 →':'继续赛季结算 →'}</strong></div></button></div>`;
    overlay.classList.remove('hidden');bindHistoricalAllStarDetail(year);document.getElementById('v17CloseHistoricalAllStar').onclick=finish;return true;
  }
  const honorsBase=deriveSeasonHonors;
  deriveSeasonHonors=function(record,index){
    let h=honorsBase(record,index)||[],year=Number(record?.year||careerState.seasonYear||0);
    if(year>=2019&&year<=2023)h=h.filter(x=>!['全明星','全明星首发','全明星正赛最有价值选手'].includes(x));
    const a=seasonState.v17HistoricalAllStar;if((year===2019||year===2020)&&a?.year===year&&a.selected){h.push('全明星');const attended=a.participation!=='decline';if(attended&&a.starter)h.push('全明星首发');if(attended&&a.mvp)h.push('全明星正赛最有价值选手');}
    return [...new Set(h)];
  };

  // 2020 All-Star happened after the regular season and before the final championship window.
  const openAwardsBase=openRegularSeasonAwards;
  openRegularSeasonAwards=function(...args){const y=Number(careerState.seasonYear||0);if(y===2020&&allStarDue(y)){openHistoricalAllStar(()=>openAwardsBase.apply(this,args));return;}return openAwardsBase.apply(this,args)};

  // ----- Full-season simulation: persistent own state, not the transient legacy simulating flag. -----
  let wholeToken=0;
  function stopWhole(msg=''){
    window.__OWL_RUNTIME?.simulation?.stopWhole?.(msg);
  }
  function blockingWorldCup(){const api=window.__OWL_WORLD_CUP;if(!api?.maybeMarkDue)return null;const r=api.maybeMarkDue();return r&&!r.completed&&r.pendingStage?r:null}
  function v17FullSeason(){
    if(seasonState.v17WholeActive||num(seasonState.played)>=num(seasonState.total))return;
    const wc=blockingWorldCup();if(wc){window.__OWL_WORLD_CUP?.open?.();return;}
    seasonState.v17WholeActive=true;seasonState.simulating=true;seasonState.resumeWholeAfterEvent=false;const token=++wholeToken;
    const step=()=>{
      if(token!==wholeToken||!seasonState.v17WholeActive)return;
      let n=0;seasonState.simulating=true;
      while(n++<5&&num(seasonState.played)<num(seasonState.total)){
        const before=num(seasonState.played);window.__OWL_V16_SEASON_BATCHING=true;
        try{v32SilentRegularGame();}finally{window.__OWL_V16_SEASON_BATCHING=false;}
        if(num(seasonState.played)<=before){stopWhole('模拟被当前流程节点暂停，请先处理页面上的节点。');return;}
        markStageBreakIfNeeded();
        if(careerState.v800Trade?.pending){stopWhole('🔄 模拟在交易节点暂停。先决定自己的下一站。');return;}
        const world=blockingWorldCup();if(world){window.__OWL_RUNTIME?.simulation?.pauseWhole?.();seasonState.v13ResumeWholeAfterWorldCup=true;renderSeason();setTimeout(()=>window.__OWL_WORLD_CUP.open(),70);return;}
        if(seasonState.currentEvent||seasonState.eventDue){window.__OWL_RUNTIME?.simulation?.pauseWhole?.();seasonState.resumeWholeAfterEvent=true;renderSeason();setTimeout(openScheduledSeasonEvent,80);return;}
        if(seasonState.stageBreakPending){stopWhole('🏆 已推进到阶段赛事节点。先处理阶段赛 / Major，再继续完整赛季模拟。');return;}
      }
      renderSeason();const note=document.getElementById('seasonSimNote');if(note)note.textContent=`⏳ 正在模拟全部常规赛：${seasonState.played}/${seasonState.total} · ${seasonState.wins}胜${seasonState.losses}负`;
      if(num(seasonState.played)>=num(seasonState.total)){stopWhole(`✓ 已模拟完整常规赛：${seasonState.wins}胜${seasonState.losses}负。`);return;}
      setTimeout(step,18);
    };
    renderSeason();setTimeout(step,0);
  }
  window.__OWL_V17_FULL_SEASON=v17FullSeason;v35SimulateWholeSeason=v17FullSeason;

  // ----- Shareable career card image -----
  function honorCounts(){try{return getHonorCounts()}catch(e){return{}}}
  function shareData(){
    const a=careerState.careerArchive||[],h=honorCounts(),last=a.at(-1);return {name:state.playerName||'Rookie',role:state.role||'—',team:careerState.team?.name||last?.team||'—',age:careerState.age||'—',seasons:a.length,peak:careerState.peakOvr||myOvr(),champ:num(h['总冠军']),mvp:num(h['MVP']||h['常规赛最有价值选手']),allstar:num(h['全明星']),wc:num(h['世界杯冠军']),heroes:(last?.heroPool||[]).slice(0,3),mem:[...(careerState.careerMemories||[])].sort((x,y)=>num(y.heat)-num(x.heat)).slice(0,2)};
  }
  function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}
  function makeShareCard(){
    const d=shareData(),cv=document.createElement('canvas');cv.width=1200;cv.height=675;const x=cv.getContext('2d');
    const g=x.createLinearGradient(0,0,1200,675);g.addColorStop(0,'#131924');g.addColorStop(.58,'#1d2431');g.addColorStop(1,'#32231f');x.fillStyle=g;x.fillRect(0,0,1200,675);
    x.fillStyle='#ff6b3d';x.fillRect(0,0,14,675);x.font='800 24px system-ui, Microsoft YaHei, sans-serif';x.fillText('OWL 选手之路 · CAREER CARD',64,72);
    x.fillStyle='#f5efe7';x.font='900 64px system-ui, Microsoft YaHei, sans-serif';x.fillText(d.name,64,158);x.font='700 27px system-ui, Microsoft YaHei, sans-serif';x.fillStyle='#c9c4bd';x.fillText(`${d.role} · ${d.team} · ${d.age}岁`,66,202);
    const stats=[['总冠军',d.champ],['MVP',d.mvp],['全明星',d.allstar],['世界杯',d.wc],['最高 OVR',d.peak],['完整赛季',d.seasons]];
    stats.forEach((it,i)=>{const col=i%3,row=Math.floor(i/3),bx=64+col*250,by=255+row*126;x.fillStyle='rgba(255,255,255,.055)';roundRect(x,bx,by,220,96,18);x.fillStyle='#ff8a5c';x.font='900 34px system-ui, Microsoft YaHei, sans-serif';x.fillText(String(it[1]),bx+20,by+42);x.fillStyle='#aca8a3';x.font='600 16px system-ui, Microsoft YaHei, sans-serif';x.fillText(it[0],bx+20,by+70)});
    x.fillStyle='rgba(255,107,61,.10)';roundRect(x,830,104,305,414,24);x.fillStyle='#f5efe7';x.font='800 20px system-ui, Microsoft YaHei, sans-serif';x.fillText('生涯关键词',862,148);
    const tags=[...d.heroes.map(h=>`🎮 ${h.name} ${Math.round(num(h.value))}`),...d.mem.map(m=>`${m.icon||'📌'} ${m.title}`)].slice(0,5);x.font='600 18px system-ui, Microsoft YaHei, sans-serif';tags.forEach((t,i)=>{x.fillStyle=i<3?'#f3dfc7':'#c9c4bd';const lines=t.length>22?[t.slice(0,22),t.slice(22,42)]:[t];lines.forEach((line,j)=>x.fillText(line,862,195+i*58+j*22))});
    x.fillStyle='#8f8a85';x.font='500 15px system-ui, Microsoft YaHei, sans-serif';x.fillText('从新秀到传奇 · 你的职业生涯由比赛写出来',64,625);x.textAlign='right';x.fillText(V17,1135,625);x.textAlign='left';return cv.toDataURL('image/png');
  }
  function openShareCard(){
    const url=makeShareCard(),safe=(state.playerName||'Rookie').replace(/[\\/:*?"<>|]/g,'_');
    window.__OWL_V16_MODAL?.open?.({icon:'📸',kicker:'CAREER CARD · 生涯名片',title:'分享你的职业生涯',body:`<div class="v17-share-preview"><img src="${url}" alt="生涯名片预览"></div><div class="v17-share-actions"><a class="primary-btn" download="OWL选手之路_${safe}_生涯名片.png" href="${url}">保存 PNG</a><button class="secondary-btn" id="v17CopyShareImage">复制图片</button></div><p class="v17-share-note">本地浏览器若不允许直接复制图片，保存 PNG 一定可用。</p>`,confirmText:'关闭'});
    setTimeout(()=>{const b=document.getElementById('v17CopyShareImage');if(!b)return;b.onclick=async()=>{try{const blob=await (await fetch(url)).blob();await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);toast('✓ 生涯名片图片已复制')}catch(e){toast('浏览器不允许复制图片，请使用“保存 PNG”')}}},0);
  }
  function bindShareButton(){const b=document.getElementById('v800CopyPassport');if(!b||b.dataset.v17Share)return;b.dataset.v17Share='1';b.textContent='分享生涯名片';b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();openShareCard()},true)}

  // ----- UI relayout -----
  function relayoutHeroMastery(){const p=document.getElementById('v74HeroDevelopmentPanel'),track=document.querySelector('#seasonScreen .season-track-card');if(p&&track&&track.nextElementSibling!==p)track.insertAdjacentElement('afterend',p)}
  function relayoutPlayoffCard(){const card=document.querySelector('#playoffScreen .playoff-team-card');if(card)card.classList.add('v17-playoff-team-card')}
  function polishMarket(){const wrap=document.getElementById('offseasonContent');if(offseasonState.phase==='market'&&wrap)wrap.classList.add('v17-market-layout')}
  function postRender(){
    relayoutHeroMastery();relayoutPlayoffCard();polishMarket();bindShareButton();
    if(Number(careerState.seasonYear)===2019&&allStarDue(2019)&&!allStarOpening)setTimeout(()=>openHistoricalAllStar(),60);
  }
  const renderSeasonBase=renderSeason;renderSeason=function(...args){const out=renderSeasonBase.apply(this,args);postRender();return out};
  const renderOffseasonBase=renderOffseason;renderOffseason=function(...args){const out=renderOffseasonBase.apply(this,args);polishMarket();return out};
  const careerBase=renderCareerOverview;renderCareerOverview=function(...args){const out=careerBase.apply(this,args);bindShareButton();return out};
  const honorBase=renderHonorWall;renderHonorWall=function(...args){const out=honorBase.apply(this,args);bindShareButton();return out};

  // Old full-season click listener calls the lexical V13 function. Patch 19 now delegates here.
  window.__OWL_V17={version:V17,roleBaselines:ROLE_REAL,eraBaselines:ERA_REAL,roleProfile:roleBase,mapMinutes,eraKey,regularMaps:actualRegularMaps,playoffMaps:actualPlayoffMaps,fullSeason:v17FullSeason,shareCard:makeShareCard,openHistoricalAllStar};
  postRender();
})();
