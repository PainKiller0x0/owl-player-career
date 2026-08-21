/* ======================================================================
   Public Beta 1.5 RC1 · Career Depth & World Cup UX
   - full Chinese team display normalization
   - readable one-line desktop Career Feed
   - DNP-safe rival memory cleanup
   - missed-event / bench special hero training
   - stage-final vs year-end-final wording
   ====================================================================== */
(function(){
  const V14='Public Beta 1.6 RC1';
  const TEAM_ZH={
    'Atlanta Reign':'亚特兰大君临','Boston Uprising':'波士顿崛起','Chengdu Hunters':'成都猎人','Dallas Fuel':'达拉斯燃料','Florida Mayhem':'佛罗里达狂欢','Guangzhou Charge':'广州冲锋','Hangzhou Spark':'杭州闪电','Houston Outlaws':'休斯顿神枪手','London Spitfire':'伦敦喷火战斗机','Los Angeles Gladiators':'洛杉矶角斗士','Los Angeles Valiant':'洛杉矶英勇','New York Excelsior':'纽约九霄天擎','Paris Eternal':'巴黎永生','Philadelphia Fusion':'费城融合','San Francisco Shock':'旧金山震动','Seoul Dynasty':'首尔王朝','Shanghai Dragons':'上海龙之队','Toronto Defiant':'多伦多捍卫者','Vancouver Titans':'温哥华泰坦','Washington Justice':'华盛顿正义','Vegas Eternal':'维加斯永生','Seoul Infernal':'首尔烈火',
    ['首尔 '+'Infernal']:'首尔烈火',['首尔 '+'Seoul Infernal']:'首尔烈火','维加斯 Eternal':'维加斯永生','拉斯维加斯 Eternal':'维加斯永生','费城 Fusion':'费城融合','巴黎 Eternal':'巴黎永生','旧金山 Shock':'旧金山震动','伦敦 Spitfire':'伦敦喷火战斗机','杭州 Spark':'杭州闪电','佛罗里达 Mayhem':'佛罗里达狂欢','华盛顿 Justice':'华盛顿正义','温哥华 Titans':'温哥华泰坦','多伦多 Defiant':'多伦多捍卫者','休斯顿 Outlaws':'休斯顿神枪手','上海 Dragons':'上海龙之队'
  };
  function teamZh(v){let s=String(v??'');for(const [a,b] of Object.entries(TEAM_ZH))s=s.split(a).join(b);return s;}
  function normalizeStoredTeamNames(){
    if(Array.isArray(seasonState.v71MajorHistory))seasonState.v71MajorHistory.forEach(h=>{if(h?.champion)h.champion=teamZh(h.champion);if(h?.runnerUp)h.runnerUp=teamZh(h.runnerUp)});
    if(seasonState.v71LastMajorSummary?.champion)seasonState.v71LastMajorSummary.champion=teamZh(seasonState.v71LastMajorSummary.champion);if(seasonState.v71LastMajorSummary?.runnerUp)seasonState.v71LastMajorSummary.runnerUp=teamZh(seasonState.v71LastMajorSummary.runnerUp);
    if(Array.isArray(careerState.careerArchive))careerState.careerArchive.forEach(r=>{if(r?.team)r.team=teamZh(r.team)});
  }
  function translateVisibleTeams(root=document){
    const hosts=['seasonScreen','careerTeamScreen','seasonSummaryScreen','playoffScreen','offseasonScreen','matchScreen','vwcOverlay'].map(id=>document.getElementById(id)).filter(Boolean);
    for(const host of hosts){
      const walker=document.createTreeWalker(host,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
      nodes.forEach(n=>{const t=teamZh(n.nodeValue);if(t!==n.nodeValue)n.nodeValue=t});
    }
  }

  // ---------------- DNP relationship sanitation ----------------
  function relationLabel(r){if(r.formerTeam)return'老东家';if(r.meetings>=6){const wr=r.wins/Math.max(1,r.meetings);if(wr>=.70)return'长期压制';if(wr<=.30)return'你的苦主';if(wr>=.38&&wr<=.62)return'宿敌';}return'普通对手';}
  function cleanupDnpRivalPollution(){
    if(careerState.v14DnpRivalCleaned)return;
    const rawHistory=careerState.v75StoryHistory||[],teams=careerState.v79Relationships?.teams||{};
    const hasLegacyData=rawHistory.length>0||Object.keys(teams).length>0||(careerState.careerMemories||[]).some(m=>/^(landlord|nemesis|rivalry):/.test(String(m?.key||'')));
    if(!hasLegacyData)return;
    careerState.v14DnpRivalCleaned=true;
    const history=rawHistory.filter(x=>Number(x.mapsPlayed||0)>0&&x.opponent);
    Object.entries(teams).forEach(([name,r])=>{
      const rows=history.filter(x=>x.opponent===name),oldBase=Number(r.formerMeetingBase||0);r.meetings=rows.length;r.wins=rows.filter(x=>x.won).length;r.losses=rows.length-r.wins;r.results=rows.slice(-12).map(x=>!!x.won);r.streak=0;for(const x of [...rows].reverse()){const sign=x.won?1:-1;if(!r.streak)r.streak=sign;else if(Math.sign(r.streak)===sign)r.streak+=sign;else break}r.lastYear=rows.at(-1)?.year||null;r.label=relationLabel(r);if(r.formerTeam)r.formerMeetingBase=Math.min(oldBase,r.meetings);
    });
    const validKey=k=>{const [kind,name]=String(k||'').split(/:(.+)/);const rows=history.filter(x=>x.opponent===name);if(kind==='landlord')return rows.slice(-5).length>=5&&rows.slice(-5).every(x=>x.won);if(kind==='nemesis')return rows.slice(-4).length>=4&&rows.slice(-4).every(x=>!x.won);if(kind==='rivalry'){const w=rows.filter(x=>x.won).length,wr=w/Math.max(1,rows.length);return rows.length>=6&&wr>=.38&&wr<=.62}return true};
    const bad=new Set((careerState.careerMemories||[]).filter(m=>/^(landlord|nemesis|rivalry):/.test(String(m.key||''))&&!validKey(m.key)).map(m=>m.key));
    if(bad.size){careerState.careerMemories=(careerState.careerMemories||[]).filter(m=>!bad.has(m.key));careerState.v79NarrativeHistory=(careerState.v79NarrativeHistory||[]).filter(n=>!bad.has(n.memKey));seasonState.v79Callbacks=(seasonState.v79Callbacks||[]).filter(n=>!bad.has(n.memKey));careerState.v79CallbackKeys=(careerState.v79CallbackKeys||[]).filter(k=>![...bad].some(b=>String(k).includes(b)));}
  }

  // ---------------- Mid-season hero special training ----------------
  function trainHistory(){careerState.v14SpecialHeroTraining=careerState.v14SpecialHeroTraining||[];return careerState.v14SpecialHeroTraining}
  function trainedKey(reason){return`${careerState.seasonYear}:${reason}`}
  function used(reason){return trainHistory().some(x=>x.key===trainedKey(reason))}
  let opening=false;
  function weakestHeroes(){const pool=window.__OWL_V800_HERO_IO?.pool?.(careerState.seasonYear)||[];return [...pool].sort((a,b)=>Number(a.value)-Number(b.value)).slice(0,8)}
  function v14SpecialPreview(hero,index,base=3){
    const before=Number(hero?.value||0),locked=state.locked||{};
    const attrAvg=['mechanics','decision','pool'].map(k=>Number(locked[k]?.value||75)).reduce((a,b)=>a+b,0)/3;
    const condition=Number(careerState.condition||70),aptitude=clamp(.90+(attrAvg-72)*.006,.88,1.12),stateFactor=clamp(.94+(condition-65)*.0025,.90,1.10);
    const lowMastery=before<70?1.25:before<80?1.12:before<90?1:.82,roleFactor=index===0?1:.72;
    const gain=Number(base||3)*roleFactor*aptitude*stateFactor*lowMastery;
    return Number(Math.max(0,Math.min(99,before+gain)-before).toFixed(2));
  }
  function openSpecialTraining(reason,title,copy,base=3){
    if(opening||used(reason))return false;const overlay=document.getElementById('seasonEventOverlay'),holder=document.getElementById('seasonEventContent');if(!overlay||!holder)return false;
    if(!overlay.classList.contains('hidden'))return false;const heroes=weakestHeroes();if(!heroes.length)return false;opening=true;
    const selected=[];
    const draw=()=>{
      holder.innerHTML=`<div class="season-event-top"><span class="season-event-kicker">EXTRA TRAINING · 发愤图强</span><span class="season-event-round">${careerState.seasonYear} · 赛季中特训</span></div><h2 class="season-event-title">🔥 ${title}</h2><div class="season-event-copy"><p>${copy}</p><p>主练 / 副练；低熟练度追赶更快。涨幅受状态、机械、决策与英雄池影响。</p></div><div class="v14-special-hero-grid">${heroes.map(h=>{const idx=selected.indexOf(h.name),tag=idx===0?'主练':idx===1?'副练':'',preview=idx>=0?v14SpecialPreview(h,idx,base):v14SpecialPreview(h,selected.length?1:0,base);return`<button class="v14-special-hero ${idx>=0?'selected':''}" data-v14-hero="${h.name}"><span class="v14-special-top"><strong>${h.name}</strong>${tag?`<em class="v800-hero-role-tag ${idx===0?'primary':'secondary'}">${tag}</em>`:''}</span><span>当前 ${Number(h.value).toFixed(1)} · ${idx>=0?'预计':'若选'} +${preview.toFixed(2)}</span></button>`}).join('')}</div><div class="v14-special-summary"><span>${selected.length?`已选 ${selected.length}/2 · ${selected.map((x,i)=>`${i===0?'主练':'副练'} ${x}`).join(' / ')}`:'先选主练英雄，可再选1个副练英雄'}</span></div><div class="season-event-choices v14-special-actions"><button class="secondary-btn" id="v14SkipSpecial">今天不加练</button><button class="primary-btn" id="v14ApplySpecial" ${selected.length?'':'disabled'}>确认本次特训</button></div>`;
      holder.querySelectorAll('[data-v14-hero]').forEach(b=>b.addEventListener('click',()=>{const n=b.dataset.v14Hero,i=selected.indexOf(n);if(i>=0)selected.splice(i,1);else if(selected.length<2)selected.push(n);else{selected.shift();selected.push(n)}draw();}));
      document.getElementById('v14SkipSpecial')?.addEventListener('click',()=>finish([]));
      document.getElementById('v14ApplySpecial')?.addEventListener('click',()=>{
        const results=selected.map((name,i)=>window.__OWL_V800_HERO_IO?.boost?.(name,base*(i===0?1:.72),`赛季中特训 · ${title} · ${i===0?'主练':'副练'}`)).filter(Boolean);
        if(results.length){careerState.condition=Math.max(0,Number(careerState.condition||70)-4);careerState.coachTrust=Math.min(100,Number(careerState.coachTrust||50)+2);}finish(results);
      });
    };
    const finish=(results=[])=>{
      trainHistory().push({key:trainedKey(reason),year:careerState.seasonYear,reason,result:results[0]||null,results});opening=false;overlay.classList.add('hidden');renderSeason();
      if(results.length){const body=`<div class="v16-result-list">${results.map((r,i)=>`<div><span>${i===0?'主练':'副练'} · ${r.name}</span><strong>${r.before.toFixed(1)} → ${r.after.toFixed(1)}</strong><em>+${r.delta.toFixed(2)}</em></div>`).join('')}</div><p>状态 -4 · 教练信任 +2。</p>`;window.__OWL_V16_MODAL?.result?.({icon:'🔥',kicker:'EXTRA TRAINING · 特训结果',title:'英雄专项完成',body});}
    };
    draw();overlay.classList.remove('hidden');return true;
  }

  function maybeSpecialTraining(){
    const wcOverlay=document.getElementById('vwcOverlay');
    if(wcOverlay&&!wcOverlay.classList.contains('ui-hidden')&&!wcOverlay.classList.contains('hidden'))return;
    if(opening||seasonState.simulating||seasonState.currentEvent||seasonState.eventDue||seasonState.stageBreakPending)return;
    const wc=careerState.worldCup?.seasons?.[careerState.seasonYear];
    if(wc?.result==='国家队落选'&&!used('miss-worldcup')){setTimeout(()=>openSpecialTraining('miss-worldcup','落选之后，训练室的灯还亮着','国家队名单没有你的名字。你没有去社媒写小作文，而是把空出来的国际赛训练窗口拿来补自己的英雄短板。',3.6),80);return}
    const as=seasonState.v71AllStar;if(as&&as.year===careerState.seasonYear&&(!as.selected||as.participation==='decline')&&!seasonState.v71AllStarPending&&!used('miss-allstar')){setTimeout(()=>openSpecialTraining('miss-allstar',as.participation==='decline'?'主动退出全明星，那就把时间用在训练上':'全明星周末没你的票，那就自己加练',as.participation==='decline'?'你主动退出了全明星，训练室为你留了一晚。可以针对英雄短板加练，也可以选择休息。':'别人去参加全明星，你留下来继续训练。节目效果没有，英雄熟练度可以有。',3.3),80);return}
    const rows=(careerState.v75StoryHistory||[]).filter(x=>Number(x.year)===Number(careerState.seasonYear)).slice(-4);
    if(rows.length>=4&&rows.every(x=>Number(x.mapsPlayed||0)===0)&&!used('dnp-streak'))setTimeout(()=>openSpecialTraining('dnp-streak','板凳坐久了，就自己把门踹开','连续多场DNP后，教练允许你做一轮额外英雄专项。光坐板凳领工资确实很舒服，可惜对职业生涯没什么帮助。',3.0),80);
  }

  // ---------------- UI wording / final polish ----------------
  function finalWording(){
    document.querySelectorAll('.v71-major-result,.stage-break-card').forEach(card=>{if(/MAJOR/i.test(card.textContent||'')){const w=document.createTreeWalker(card,NodeFilter.SHOW_TEXT),ns=[];while(w.nextNode())ns.push(w.currentNode);ns.forEach(n=>{if(/总决赛/.test(n.nodeValue)&&!/阶段总决赛/.test(n.nodeValue))n.nodeValue=n.nodeValue.replace(/总决赛/g,'阶段总决赛')})}});
    const po=document.getElementById('playoffScreen');if(po){const w=document.createTreeWalker(po,NodeFilter.SHOW_TEXT),ns=[];while(w.nextNode())ns.push(w.currentNode);ns.forEach(n=>{if(/总决赛/.test(n.nodeValue)&&!/年终总决赛|总决赛 MVP|总决赛MVP/.test(n.nodeValue))n.nodeValue=n.nodeValue.replace(/总决赛/g,'年终总决赛')})}
  }
  function polish(){normalizeStoredTeamNames();cleanupDnpRivalPollution();translateVisibleTeams();finalWording();maybeSpecialTraining()}

  const oldRender=renderSeason;renderSeason=function(...args){const out=oldRender.apply(this,args);polish();return out};
  if(typeof renderPlayoffs==='function'){const old=renderPlayoffs;renderPlayoffs=function(...args){const out=old.apply(this,args);translateVisibleTeams();finalWording();return out}}
  if(typeof renderCareerTeam==='function'){const old=renderCareerTeam;renderCareerTeam=function(...args){const out=old.apply(this,args);translateVisibleTeams();return out}}
  if(typeof renderSeasonSummary==='function'){const old=renderSeasonSummary;renderSeasonSummary=function(...args){const out=old.apply(this,args);translateVisibleTeams();return out}}

  // All-Star close is created dynamically. Capture the fact before the old listener removes the overlay,
  // then the next season render opens the special-training follow-up.
  document.addEventListener('click',e=>{if(e.target?.closest?.('#v71CloseAllStar,#v34CloseAllStar'))setTimeout(()=>{opening=false;maybeSpecialTraining()},120)},true);

  normalizeStoredTeamNames();cleanupDnpRivalPollution();
  window.__OWL_V14={version:V14,teamZh,cleanupDnpRivalPollution,openSpecialTraining,maybeSpecialTraining,weakestHeroes,translateVisibleTeams,finalWording,polish};
})();
