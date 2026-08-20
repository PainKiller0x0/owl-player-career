

(function(){
  'use strict';
  const PATCH='2.0 Alpha 1 · Batch 1';
  const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  /* ---------------------------------------------------------------
     1 / 6 / 7 · schedule readability + action placement
     --------------------------------------------------------------- */
  function repairSeasonTrack(){
    const track=document.querySelector('#seasonScreen .season-track-card');
    if(!track)return;
    const actions=track.querySelector('.season-actions');
    const progress=document.getElementById('seasonProgressCopy');
    const primary=document.getElementById('v768SeasonPrimaryAction');
    const primaryHasContent=!!primary?.querySelector('.stage-break-card,.season-complete-banner,.v71-major-result,.v769-historical-result');
    if(actions){
      // Normal state: progress -> controls. Milestone state: progress -> milestone -> controls.
      const anchor=(primary&&primaryHasContent)?primary:progress;
      if(anchor&&actions.previousElementSibling!==anchor)anchor.insertAdjacentElement('afterend',actions);
    }
    const note=document.getElementById('seasonSimNote');
    if(note&&actions&&note.previousElementSibling!==actions)actions.insertAdjacentElement('afterend',note);
  }
  function repairCareerSeasonAction(){
    const btn=document.getElementById('startSeasonBtn'),card=document.getElementById('careerContractCard');
    if(!btn||!card||!seasonState?.active||Number(careerState?.seasonYear||0)<2024)return;
    // Returning to the active season is a primary navigation action, not footer debris.
    btn.textContent='查看常规赛选项 →';btn.classList.add('rc26-return-season','rc27-start-season');
    const anchor=card.querySelector('.rc27-contract-facts')||card.querySelector('.contract-role')||card.querySelector('.contract-team-line');
    if(anchor&&anchor.nextElementSibling!==btn)anchor.insertAdjacentElement('afterend',btn);
  }
  window.__OWL_RUNTIME?.render?.register('renderSeason','b1-season-track',repairSeasonTrack);
  window.__OWL_RUNTIME?.render?.register('renderCareerTeam','b1-career-season-action',repairCareerSeasonAction);
  repairSeasonTrack();repairCareerSeasonAction();

  /* ---------------------------------------------------------------
     2 · whole-postseason sim is now deliberately sequential
     --------------------------------------------------------------- */
  function playoffFeedHost(){
    const card=document.querySelector('#playoffScreen .playoff-next-card');
    if(!card)return null;
    let host=document.getElementById('owl2B1PlayoffFeed');
    if(!host){
      host=document.createElement('div');host.id='owl2B1PlayoffFeed';host.className='owl2-b1-playoff-feed ui-hidden';
      const note=document.getElementById('playoffModeNote');
      if(note)note.insertAdjacentElement('beforebegin',host);else card.appendChild(host);
    }
    return host;
  }
  function renderPlayoffFeed(){
    const host=playoffFeedHost();if(!host)return;
    const rows=Array.isArray(playoffState.owl2B1WholeFeed)?playoffState.owl2B1WholeFeed:[];
    const running=!!playoffState.owl2B1WholeRunning;
    host.classList.toggle('ui-hidden',!rows.length&&!running);
    if(!rows.length&&!running){host.innerHTML='';return;}
    host.innerHTML=`<div class="owl2-b1-playoff-feed-head"><strong>逐轮模拟</strong><span>${running?'下一轮将在片刻后继续':'模拟完成'}</span></div><div class="owl2-b1-playoff-feed-list">${rows.map(r=>`<div class="owl2-b1-playoff-row ${r.won?'win':'loss'}"><span>${esc(r.stage)}</span><strong>vs ${esc(r.opponent)}</strong><b>${esc(r.score)}</b><em>${r.won?'胜':'负'}</em></div>`).join('')}</div>`;
  }
  function installWholePlayoffButton(){
    const old=document.getElementById('simulateWholePlayoffsBtn');if(!old)return;
    let btn=old;
    if(old.dataset.owl2B1!=='1'){
      btn=old.cloneNode(true);btn.dataset.owl2B1='1';old.replaceWith(btn);
      btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();simulateWholePlayoffsB1();});
    }
    const current=typeof currentPlayoffMatch==='function'?currentPlayoffMatch():null;
    btn.disabled=!!playoffState.owl2B1WholeRunning||!current;
    btn.classList.toggle('ui-hidden',!current&&!playoffState.owl2B1WholeRunning);
    btn.textContent=playoffState.owl2B1WholeRunning?'⏳ 正在逐轮模拟…':current?'🚀 模拟剩余季后赛':'季后赛已结束';
  }
  async function simulateWholePlayoffsB1(){
    if(playoffState.owl2B1WholeRunning||!playoffState.active||!currentPlayoffMatch())return;
    playoffState.owl2B1WholeRunning=true;playoffState.owl2B1WholeFeed=[];
    installWholePlayoffButton();renderPlayoffFeed();
    let guard=0;
    while(currentPlayoffMatch()&&guard++<14){
      const match=currentPlayoffMatch(),opponent=currentPlayoffOpponent();
      const before=(playoffState.results||[]).length;
      simulateSinglePlayoffSeries();
      const row=(playoffState.results||[]).slice(before).find(r=>r.matchId===match.id)||(playoffState.results||[]).find(r=>r.matchId===match.id);
      if(row){playoffState.owl2B1WholeFeed.push({stage:match.stage,opponent:opponent?.name||'待定',score:row.score||'—',won:!!row.won});}
      renderPlayoffFeed();installWholePlayoffButton();
      if(!currentPlayoffMatch()||['champion','runnerup','eliminated'].includes(playoffState.round))break;
      await delay(850);
    }
    playoffState.owl2B1WholeRunning=false;
    renderPlayoffs();showScreen('playoff');renderPlayoffFeed();installWholePlayoffButton();
    setTimeout(maybeShowFinalSettlement,90);
  }
  // The visible button uses the paced simulator; developer skip keeps the old synchronous helper.

  /* ---------------------------------------------------------------
     3 · final settlement modal
     --------------------------------------------------------------- */
  function ensureFinalOverlay(){
    let ov=document.getElementById('owl2B1FinalOverlay');
    if(ov)return ov;
    ov=document.createElement('div');ov.id='owl2B1FinalOverlay';ov.className='owl2-b1-final-overlay ui-hidden';
    ov.innerHTML='<div class="owl2-b1-final-modal" id="owl2B1FinalModal"></div>';
    document.body.appendChild(ov);
    return ov;
  }
  function finalScoreLine(grand){
    if(!grand?.result)return {winner:null,loser:null,score:'—'};
    const r=grand.result,w=r.winner,l=r.loser;
    const ws=r.teamA?.name===w?.name?r.scoreA:r.scoreB,ls=r.teamA?.name===l?.name?r.scoreA:r.scoreB;
    return {winner:w,loser:l,score:`${ws}:${ls}`};
  }
  function closeFinalSettlement(){ensureFinalOverlay().classList.add('ui-hidden');}
  function showFinalSettlement(){
    const grand=typeof getBracketMatch==='function'?getBracketMatch('G1'):null;if(!grand?.result)return;
    const info=finalScoreLine(grand),mine=playoffState.round==='champion',runner=playoffState.round==='runnerup',label=typeof getPlayoffResultLabel==='function'?getPlayoffResultLabel():'季后赛结束';
    const ov=ensureFinalOverlay(),modal=ov.querySelector('#owl2B1FinalModal'),fmvp=typeof resolveFinalsMVP==='function'?resolveFinalsMVP():playoffState.fmvp;
    const icon=mine?'🏆':runner?'🥈':'🏁',title=mine?'联赛总冠军':runner?'联赛亚军':label;
    modal.innerHTML=`<div class="owl2-b1-final-hero"><div class="owl2-b1-final-kicker">${careerState.seasonYear} PLAYOFFS · FINAL</div><div class="owl2-b1-final-icon">${icon}</div><h2>${esc(title)}</h2><p>${mine?`${esc(careerState.team?.name)} 赢下最终系列赛，奖杯到手。`:runner?`${esc(careerState.team?.name)} 打进总决赛，本赛季以亚军收官。`:`你的季后赛已结束，联盟也已完成最终冠军结算。`}</p></div><div class="owl2-b1-final-stats"><div class="owl2-b1-final-stat"><span>总冠军</span><strong>${esc(info.winner?.name||'—')}</strong></div><div class="owl2-b1-final-stat"><span>总决赛</span><strong>${esc(info.score)} · ${esc(info.loser?.name||'—')}</strong></div><div class="owl2-b1-final-stat"><span>FMVP</span><strong>${esc(fmvp?.name||'—')}</strong></div></div><div class="owl2-b1-final-actions"><button class="secondary-btn" id="owl2B1StayPlayoffs">留在对阵页</button><button class="primary-btn" id="owl2B1OpenSummary">📊 查看赛季结算</button></div>`;
    ov.classList.remove('ui-hidden');
    modal.querySelector('#owl2B1StayPlayoffs')?.addEventListener('click',closeFinalSettlement);
    modal.querySelector('#owl2B1OpenSummary')?.addEventListener('click',()=>{closeFinalSettlement();if(typeof showSeasonSummary==='function')showSeasonSummary();});
  }
  function maybeShowFinalSettlement(){
    if(!playoffState?.active||!['champion','runnerup','eliminated'].includes(playoffState.round))return;
    const grand=typeof getBracketMatch==='function'?getBracketMatch('G1'):null;if(!grand?.result)return;
    if(document.querySelector('.screen.active')?.id!=='playoffScreen')return;
    const key=`${careerState.seasonYear}|${grand.result.winner?.name||''}|${grand.result.score||''}`;
    if(playoffState.owl2B1FinalShown===key)return;
    playoffState.owl2B1FinalShown=key;showFinalSettlement();
  }
  if(typeof setupPlayoffs==='function'){
    const base=setupPlayoffs;setupPlayoffs=function(){const out=base.apply(this,arguments);playoffState.owl2B1WholeFeed=[];playoffState.owl2B1WholeRunning=false;playoffState.owl2B1FinalShown=null;return out;};
  }
  ensureFinalOverlay();

  /* ---------------------------------------------------------------
     4 / 5 · World Cup: hide tuning numbers + champion burst
     --------------------------------------------------------------- */
  const wcChoiceCopy={
    trials:'强调公开试炼中的临场爆发 · 训练负荷更高',flash:'强调机械能力与关键局爆发 · 训练负荷更高',
    system:'强调沟通、协同与体系执行 · 更利于国家队磨合',pool:'强调英雄池宽度与版本适应 · 英雄池越深越占优势'
  };
  function patchWorldCupUi(){
    const body=document.getElementById('vwcBody');if(!body)return;
    body.querySelectorAll('.vwc-choice[data-vwc-select]').forEach(btn=>{const em=btn.querySelector('em'),copy=wcChoiceCopy[btn.dataset.vwcSelect];if(em&&copy&&em.textContent!==copy)em.textContent=copy;});
    const api=window.__OWL_WORLD_CUP,rec=api?.ensure?.();
    if(!rec||!rec.completed||rec.result!=='世界杯冠军'||!body.querySelector('.vwc-result'))return;
    careerState.owl2B1WorldCupBurstsV2=Array.isArray(careerState.owl2B1WorldCupBurstsV2)?careerState.owl2B1WorldCupBurstsV2:[];
    if(careerState.owl2B1WorldCupBurstsV2.includes(Number(rec.year)))return;
    careerState.owl2B1WorldCupBurstsV2.push(Number(rec.year));
    if(typeof playChampionBurst==='function')setTimeout(()=>playChampionBurst(),60);
  }
  const wcBody=document.getElementById('vwcBody');if(wcBody)new MutationObserver(()=>patchWorldCupUi()).observe(wcBody,{childList:true,subtree:true});
  if(window.__OWL_WORLD_CUP?.open){const api=window.__OWL_WORLD_CUP,base=api.open;api.open=function(){const out=base.apply(this,arguments);setTimeout(patchWorldCupUi,0);return out;};}
  patchWorldCupUi();

  /* ---------------------------------------------------------------
     8 · hero selection: meta/map/proficiency/usage all matter in ALL eras
     --------------------------------------------------------------- */
  const oldMetaRaw=typeof v74MetaRaw==='function'?v74MetaRaw:null;
  function historicalMeta(hero,year,stage){
    const y=Number(year||careerState.seasonYear||2019),s=Number(stage||1),id=hero?.id||hero?.name||'hero';
    const patchWave=(v71Hash01(`${y}|${s}|${id}|legacy-patch`)-.5)*7.2;
    const seasonWave=(v71Hash01(`${y}|${id}|legacy-season`)-.5)*3.2;
    const stageSwing=(v71Hash01(`${y}|${s}|${id}|legacy-stage`)-.5)*2.4;
    return clamp(patchWave+seasonWave+stageSwing,-4.8,5.0);
  }
  if(oldMetaRaw){
    v74MetaRaw=function(hero,year=v71Year(),stage=v74StageNo()){
      return Number(year)<2024?historicalMeta(hero,year,stage):oldMetaRaw(hero,year,stage);
    };
  }
  const oldHeroMapBonus=typeof v71HeroMapBonus==='function'?v71HeroMapBonus:null;
  if(oldHeroMapBonus){
    v71HeroMapBonus=function(hero,map){
      const base=oldHeroMapBonus(hero,map);
      return v71Year()<2024?base+v74MetaRaw(hero,v71Year(),v74StageNo()):base;
    };
  }
  function heroUsagePenalty(player,hero,meta){
    if(typeof v74HeroUsageStore!=='function'||meta>=-.65)return 0;
    const usage=v74HeroUsageStore(player)||{},rows=Object.values(usage).filter(u=>Number(u?.seasonYear)===Number(v71Year()));
    const total=rows.reduce((s,u)=>s+Number(u.seasonMaps||0),0),mine=Number(usage[hero.name]?.seasonYear)===Number(v71Year())?Number(usage[hero.name]?.seasonMaps||0):0;
    if(total<6||!mine)return 0;
    const share=mine/Math.max(1,total);
    return clamp((share-.46)*8.5,0,4.2)*clamp((-meta)/2.2,.35,1.7);
  }
  function heroRanking(player,map,banned=[]){
    const ban=new Set((banned||[]).filter(Boolean));
    const pool=v71HeroPool(player).filter(h=>!ban.has(h.name));
    if(!pool.length)return [];
    const year=v71Year(),stage=v74StageNo(),stamp=`${year}|${stage}|${seasonState.played}|${map?.name||'map'}|${player?.name||'player'}`;
    const proficiencyTop=Math.max(...pool.map(h=>Number(h.value||0)));
    return pool.map(h=>{
      const meta=v74MetaRaw(h,year,stage),mapBonus=v71HeroMapBonus(h,map),signatureGap=Math.max(0,Number(h.value||0)-(proficiencyTop-6));
      const offMetaSignature=(Number(h.value||0)===proficiencyTop&&meta<-1.1)?Math.min(3.4,signatureGap*.18+(-meta)*.34):0;
      const overuse=heroUsagePenalty(player,h,meta),variation=(v71Hash01(`${stamp}|${h.id}|pick`)-.5)*1.8;
      const pickScore=Number(h.value||0)+mapBonus*1.12+meta*1.18-offMetaSignature-overuse+variation;
      return {...h,meta,mapBonus,pickScore,mapScore:pickScore,overusePenalty:overuse};
    }).sort((a,b)=>b.pickScore-a.pickScore);
  }
  if(typeof v71BestHeroFor==='function'){
    v71BestHeroFor=function(player,map,banned=[]){
      const ranked=heroRanking(player,map,banned);if(!ranked.length)return null;
      // Near-equal options rotate deterministically; a 10-point worse hero still won't be chosen for comedy value.
      const viable=ranked.filter((h,i)=>i<3&&h.pickScore>=ranked[0].pickScore-2.7&&Number(h.value||0)>=68);
      if(viable.length<=1)return ranked[0];
      return [...viable].sort((a,b)=>(b.pickScore+v71Hash01(`${v71Year()}|${seasonState.played}|${map?.name}|${player?.name}|${b.name}|rotation`)*1.5)-(a.pickScore+v71Hash01(`${v71Year()}|${seasonState.played}|${map?.name}|${player?.name}|${a.name}|rotation`)*1.5))[0];
    };
  }
  // 2025+ Hero Ban / Plan B must use the same live ranking too; otherwise Ban phase resurrects the old one-trick selector.
  if(typeof v73HeroPlans==='function'){
    v73HeroPlans=function(player,map,side){
      const banName=v73OpposingBan(side),group=v71RoleGroup(player.role);
      const pool=heroRanking(player,map,[]),ideal=pool[0]||null,banned=banName?pool.find(h=>h.name===banName):null;
      const legal=pool.filter(h=>h.name!==banName),planB=legal[0]||null;
      const roleTouched=!!banned&&banned.group===group,directHit=!!ideal&&ideal.name===banName;
      const closeFlex=!!banned&&!!ideal&&banned.pickScore>=ideal.pickScore-3;
      const rawDrop=ideal&&planB?Math.max(0,ideal.pickScore-planB.pickScore):0;
      const nearAlts=ideal?legal.filter(h=>h.pickScore>=ideal.pickScore-4).length:0,adaptability=v73Adaptability(player);
      let penalty=0,status='未受影响',detail='对方Ban没有碰到本图核心英雄。';
      if(directHit){
        const cushion=Math.min(2.2,adaptability*1.35+Math.min(3,nearAlts)*.28);
        penalty=-clamp(rawDrop*.82-cushion+.45,.25,9.5);
        if(rawDrop<=1.8){status='无缝切换';detail='招牌被封，但Plan B几乎同档。';}
        else if(rawDrop<=4.5){status='Plan B充足';detail='需要换英雄，强度只有轻微损失。';}
        else if(rawDrop<=7.5){status='明显降档';detail='被迫离开本图最佳英雄，发挥明显受限。';}
        else{status='被Ban穿';detail='替代英雄断档，阵容锁死后只能硬扛。';}
      }else if(roleTouched&&closeFlex){
        penalty=-clamp(.35+(banned.pickScore-(ideal?.pickScore||banned.pickScore)+3)*.12,.25,1.1);
        status='战术受限';detail='首选仍在，但一个高价值备选被拿走。';
      }
      return {player,side,banName,ideal,banned,planB,roleTouched,directHit,rawDrop,nearAlts,adaptability,penalty,status,detail};
    };
  }
  if(typeof v71HeroBanValue==='function'){
    v71HeroBanValue=function(hero,targetRoster,map){
      let best=0;
      (targetRoster||[]).filter(p=>v71RoleGroup(p.role)===hero.group).forEach(p=>{
        const pool=heroRanking(p,map,[]),ideal=pool[0],hit=pool.find(h=>h.name===hero.name),alt=pool.find(h=>h.name!==hero.name);if(!hit||!ideal)return;
        const direct=ideal.name===hero.name,drop=direct?Math.max(0,ideal.pickScore-(alt?.pickScore||65)):Math.max(0,hit.pickScore-ideal.pickScore+3);
        const fragility=direct?drop*4:(hit.pickScore>=ideal.pickScore-3?4:0);
        const value=(direct?ideal.pickScore*1.18:hit.pickScore*.42)+fragility+Number(hit.meta||0)*1.4+(p.isUser?4:0);
        best=Math.max(best,value);
      });
      return best;
    };
  }

  // Pre-2024 quick matches used to ignore hero pool completely. Add a small, bounded series-fit influence.
  if(typeof getRegularSeasonWinChance==='function'){
    const base=getRegularSeasonWinChance;
    getRegularSeasonWinChance=function(ourRoster,theirRoster,careerBonus=0,venue='home'){
      const raw=base.apply(this,arguments),maps=Array.from({length:3},(_,i)=>MATCH_MAPS[(Math.floor(v71Hash01(`${v71Year()}|${seasonState.played}|quick-map|${i}`)*MATCH_MAPS.length)+i)%MATCH_MAPS.length]);
      const fit=roster=>{const vals=[];(roster||[]).forEach(p=>maps.forEach(m=>{const h=v71BestHeroFor(p,m,[]);if(h)vals.push(Number(h.mapScore||h.value||78));}));return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:78;};
      const swing=clamp((fit(ourRoster)-fit(theirRoster))*.0055,-.045,.045);
      return clamp(raw+swing,.22,.86);
    };
  }
  // Detailed pre-2024 maps also get a bounded hero-fit lift instead of treating every hero pool as identical.
  if(typeof roleEffective==='function'){
    const base=roleEffective;
    roleEffective=function(player,map,styleKey,isUser){
      const out=base.apply(this,arguments);if(v71Year()>=2024)return out;
      const hero=v71BestHeroFor(player,map,[]);return out+(hero?clamp((Number(hero.mapScore||78)-80)*.07,-2.5,2.4):0);
    };
  }

  /* ---------------------------------------------------------------
     9 · Dennis Hawelka Award: eligibility + comparable AI scoring
     --------------------------------------------------------------- */
  function hawelkaUserEligible(){
    const apps=Number(seasonState.userRatings?.length||0),need=Math.max(5,Math.ceil(Number(seasonState.total||20)*.28));
    return Number(careerState.teammateBond||50)>=68&&Number(careerState.coachTrust||50)>=66&&apps>=need;
  }
  function hawelkaScore(p){
    const year=Number(careerState.seasonYear||2019),rating=Number(p.rating||0),wins=Number(p.wins||0),pop=Number(p.popularity||0);
    if(p.isUser){
      const archive=careerState.careerArchive||[],last=archive[archive.length-1],lastWon=(last?.honors||[]).some(h=>/Dennis Hawelka|社区之星/.test(String(h)));
      const recent=archive.slice(-3).filter(r=>(r.honors||[]).some(h=>/Dennis Hawelka|社区之星/.test(String(h)))).length;
      const bond=Number(careerState.teammateBond||50),trust=Number(careerState.coachTrust||50);
      return bond*.29+trust*.27+pop*.10+rating*1.8+wins*.045-(lastWon?20:0)-Math.max(0,recent-1)*9;
    }
    const professionalism=58+v71Hash01(`${year}|${p.name}|b1-hawelka-pro`)*40;
    const teamSpirit=56+v71Hash01(`${year}|${p.name}|b1-hawelka-team`)*42;
    const peerRespect=52+v71Hash01(`${year}|${p.name}|b1-hawelka-peer`)*46;
    return professionalism*.29+teamSpirit*.27+peerRespect*.14+pop*.08+rating*1.75+wins*.045;
  }
  function buildHawelka(){
    const pool=buildRegularAwardLeaguePool(),eligible=hawelkaUserEligible();
    const filtered=pool.filter(p=>!p.isUser||eligible);
    const result=rankAwardCandidates(filtered.length?filtered:pool.filter(p=>!p.isUser),hawelkaScore);
    result.userEligible=eligible;if(!eligible)result.userRank=null;return result;
  }
  if(typeof ensureRegularSeasonAwards==='function'){
    const base=ensureRegularSeasonAwards;
    ensureRegularSeasonAwards=function(){
      const a=base.apply(this,arguments);if(!a)return a;
      const y=Number(careerState.seasonYear||2019);
      if(a.owl2B1HawelkaYear!==y){const h=buildHawelka();a.hawelka=h;a.community=h;a.owl2B1HawelkaYear=y;}
      return a;
    };
  }
  function decorateRegularSeasonAwardsB1(){
      const a=ensureRegularSeasonAwards();
      const cards=[...document.querySelectorAll('#regularAwardsContent .award-card')];
      const card=cards.find(c=>/社区之星|Dennis Hawelka/.test(c.querySelector('.award-card-head h3')?.textContent||''));
      if(card){
        const h=card.querySelector('.award-card-head h3'),s=card.querySelector('.award-card-head span');if(h)h.textContent='❤️ Dennis Hawelka奖';if(s)s.textContent='团队精神、职业风范与职业圈口碑';
        const topCopy=document.querySelector('#awardsScreen .brand p');if(topCopy)topCopy.textContent='MVP · 职责之星 · 最佳新秀 · Dennis Hawelka奖';
        const rank=card.querySelector('.award-rank-box strong');if(rank&&!a?.hawelka?.userEligible)rank.textContent='未满足评选条件';
      }
  }
  window.__OWL_RUNTIME?.render?.register('renderRegularSeasonAwards','b1-awards',decorateRegularSeasonAwardsB1);
  if(typeof deriveSeasonHonors==='function'){
    const base=deriveSeasonHonors;
    deriveSeasonHonors=function(){
      let h=base.apply(this,arguments)||[];const a=ensureRegularSeasonAwards();
      h=h.map(x=>String(x)==='社区之星'?'Dennis Hawelka奖':x).filter(x=>String(x)!=='Dennis Hawelka奖'||(a?.hawelka?.userEligible&&a?.hawelka?.userRank===1));
      if(a?.hawelka?.userEligible&&a?.hawelka?.userRank===1&&!h.includes('Dennis Hawelka奖'))h.push('Dennis Hawelka奖');
      return [...new Set(h)];
    };
  }

  /* Final render hook: install button/feed/modal after every later-era bracket renderer. */
  function decoratePlayoffsB1(){installWholePlayoffButton();renderPlayoffFeed();setTimeout(maybeShowFinalSettlement,40);}
  window.__OWL_RUNTIME?.render?.register('renderPlayoffs','b1-playoffs',decoratePlayoffsB1);
  installWholePlayoffButton();renderPlayoffFeed();
  window.__OWL_ALPHA1_BATCH1={patch:PATCH,repairSeasonTrack,repairCareerSeasonAction,heroRanking,hawelkaUserEligible,simulateWholePlayoffs:simulateWholePlayoffsB1,showFinalSettlement,patchWorldCupUi};
})();
