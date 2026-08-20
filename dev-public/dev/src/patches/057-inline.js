/* ======================================================================
   Public Beta 1.9 RC7 · Experience Depth & Copy Polish
   - reuse last offseason hero plan without auto-confirming
   - rebalance several fake-choice career events into real tradeoffs
   - persist one concise season memory anchor in career archive
   - keep dense operation screens focused on decision-relevant copy
   ====================================================================== */
(function(){
  const V21='Public Beta 1.9 RC7';
  const esc21=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // -------------------------------------------------------------------
  // A. Hero training: reuse last year's picks, but never auto-confirm.
  // -------------------------------------------------------------------
  function heroTraining21(){return offseasonState?.v800HeroTraining||null;}
  function rememberHeroPlan21(){
    const h=heroTraining21(); if(!h||!(h.selected||[]).length)return;
    careerState.v21LastHeroPlan={year:Number(careerState.seasonYear||0),selected:[...(h.selected||[])].slice(0,2)};
  }
  document.addEventListener('click',e=>{
    if(e.target?.closest?.('#v18ApplyHeroTrain,#v800ApplyHeroTrain'))rememberHeroPlan21();
  },true);
  function injectHeroReuse21(){
    if(offseasonState?.phase!=='training')return;
    const wrap=document.getElementById('offseasonContent'),block=wrap?.querySelector('.v800-hero-training');
    if(!block||block.querySelector('.v21-reuse-hero-plan'))return;
    const h=heroTraining21(),plan=careerState.v21LastHeroPlan;
    if(!h||h.done||!plan||Number(plan.year)>=Number(careerState.seasonYear||0))return;
    const year=Number(careerState.seasonYear||2019),pool=window.__OWL_V800_HERO_IO?.pool?.(year)||[],names=new Set(pool.map(x=>x.name));
    const valid=(plan.selected||[]).filter(x=>names.has(x)).slice(0,2);if(!valid.length)return;
    const foot=block.querySelector('.v800-hero-training-foot')||block;
    const btn=document.createElement('button');btn.type='button';btn.className='secondary-btn v21-reuse-hero-plan';
    btn.textContent=`沿用上赛季：${valid.join(' / ')}`;
    btn.onclick=()=>{h.selected=[...valid];renderOffseason();};
    foot.insertBefore(btn,foot.firstChild);
  }
  const _v21Off=renderOffseason;
  renderOffseason=function(){const out=_v21Off.apply(this,arguments);injectHeroReuse21();return out;};

  // -------------------------------------------------------------------
  // B. Career-event choice pass. Keep choices asymmetric, but remove the
  // cases where one branch dominates nearly every reasonable play style.
  // -------------------------------------------------------------------
  function tuneChoice21(eventId,label,effects,desc){
    const e=SEASON_EVENTS.find(x=>x.id===eventId),c=e?.choices?.find(x=>x.label===label);if(!c)return false;
    c.effects={...effects};if(desc)c.desc=desc;return true;
  }
  tuneChoice21('starter-competition','正面接受竞争',{primaryAttr:1,condition:-10,coachTrust:4,nextMatchBonus:1.8},'强化招牌能力与下一场发挥，训练负担更高。');
  tuneChoice21('starter-competition','主动找教练沟通',{awarenessAttr:1,coachTrust:5,condition:2},'提高比赛理解与教练信任。');
  tuneChoice21('starter-competition','公开表达不满',{popularity:14,coachTrust:-8,teammateBond:-3,nextMatchBonus:.8},'扩大公众声量，也会明显伤害教练关系。');

  tuneChoice21('vod-review','直接指出团队问题',{coachTrust:7,teammateBond:-7,awarenessAttr:1},'强化战术理解与教练信任，队内关系承压。');
  tuneChoice21('vod-review','先承担自己的错误',{teammateBond:10,coachTrust:3,condition:5},'修复队内关系，并保留更多状态。');
  tuneChoice21('vod-review','让每个人轮流发言',{teammateBond:7,coachTrust:6,condition:-2,nextMatchBonus:.7},'兼顾沟通与下一场准备。');

  tuneChoice21('roster-rotation','接受轮换安排',{teammateBond:7,condition:11,coachTrust:4,nextMatchBonus:-.5,popularity:-2},'恢复状态并支持轮换，但短期比赛节奏下降。');
  tuneChoice21('roster-rotation','争取完整首发',{popularity:7,condition:-9,coachTrust:-3,nextMatchBonus:1.7,nextRatingBonus:.12},'争取连续出场与个人表现，身体和教练关系承压。');
  tuneChoice21('roster-rotation','主动帮助替补磨合',{teammateBond:11,coachTrust:8,condition:-5},'强化领导价值与队伍关系。');

  tuneChoice21('rookie-stage-fright','主动做更长热身',{condition:-6,nextMatchBonus:1.8,coachTrust:2},'用体力换取下一场手感。');
  tuneChoice21('rookie-stage-fright','跟老将聊几句',{teammateBond:7,condition:3,nextRatingBonus:.04},'缓解紧张并建立队内关系。');
  tuneChoice21('rookie-stage-fright','戴上耳机隔绝现场',{condition:6,popularity:-2,nextMatchBonus:.8},'稳定状态与专注，减少现场互动。');

  tuneChoice21('contract-year-pressure','把注意力留在比赛',{condition:7,coachTrust:3,nextRatingBonus:.05},'降低合同年带来的状态消耗。');
  tuneChoice21('contract-year-pressure','要求经纪团队主动造势',{popularity:15,condition:-7,nextMatchBonus:1.1},'提高市场关注，同时增加比赛压力。');
  tuneChoice21('contract-year-pressure','私下询问俱乐部计划',{coachTrust:8,teammateBond:-2,nextRatingBonus:.06},'提前了解队伍计划，但可能影响队内关系。');

  tuneChoice21('coach-public-criticism','当场认错并提出改法',{coachTrust:7,condition:-8,awarenessAttr:1},'强化比赛理解并快速修复教练关系。');
  tuneChoice21('coach-public-criticism','会后单独解释情况',{coachTrust:4,teammateBond:4,condition:4},'温和修复关系，并保留更多状态。');
  tuneChoice21('coach-public-criticism','认为批评不公平',{coachTrust:-10,condition:6,popularity:8,nextMatchBonus:.5},'公开坚持立场，获得关注但明显伤害教练关系。');

  // -------------------------------------------------------------------
  // C. One compact season anchor per archived year. Reuse existing story
  // data instead of adding more popups/events.
  // -------------------------------------------------------------------
  function bestHonor21(honors=[]){
    const order=['总冠军','总决赛MVP','世界杯冠军','MVP','职责之星','年度最佳新秀','世界杯亚军','最佳阵容','全明星','国家队成员'];
    return order.find(x=>honors.includes(x))||honors[0]||null;
  }
  function anchorFor21(r){
    if(!r)return null;
    const honor=bestHonor21(r.honors||[]);
    if(honor){
      const icon=HONOR_ICONS?.[honor]||(/冠军|MVP/.test(honor)?'🏆':'🏅');
      return{icon,title:honor,text:`${r.year}赛季 · ${r.team} · ${r.result}`};
    }
    if(r.worldCup?.selected&&r.worldCup?.result&&r.worldCup.result!=='进行中')return{icon:'🌍',title:r.worldCup.result,text:`${r.worldCup.matches||0}场国家队比赛`};
    const moments=[...(r.storyMoments||[])].sort((a,b)=>Number(b.importance||0)-Number(a.importance||0));
    if(moments[0])return{icon:moments[0].icon||'📌',title:moments[0].title||'赛季高光',text:moments[0].text||''};
    const rating=Number(r.rating||0);
    if(rating>=8.4)return{icon:'🔥',title:'个人高光赛季',text:`平均评分 ${rating.toFixed(1)}`};
    if(String(r.result||'').includes('亚军'))return{icon:'🥈',title:r.result,text:`${r.team}走到了最后阶段`};
    if(String(r.result||'').includes('季后赛'))return{icon:'🏆',title:r.result,text:`${r.team}的季后赛之旅`};
    return{icon:'📍',title:`${r.team} · ${r.result||'完整赛季'}`,text:rating?`平均评分 ${rating.toFixed(1)}`:''};
  }
  function ensureAnchor21(r){if(r&&!r.seasonAnchor)r.seasonAnchor=anchorFor21(r);return r?.seasonAnchor||null;}
  const _v21Record=recordCompletedCareerSeason;
  recordCompletedCareerSeason=function(){const before=careerState.careerArchive?.length||0,out=_v21Record.apply(this,arguments);if((careerState.careerArchive?.length||0)>before)ensureAnchor21(careerState.careerArchive.at(-1));return out;};
  (careerState.careerArchive||[]).forEach(ensureAnchor21);

  function injectCareerAnchors21(){
    const rows=[...document.querySelectorAll('#careerTabContent .career-season-row')],archive=[...(careerState.careerArchive||[])].reverse();
    rows.forEach((row,i)=>{if(row.querySelector('.v21-season-anchor'))return;const a=ensureAnchor21(archive[i]);if(!a)return;const host=row.children?.[1];if(!host)return;const n=document.createElement('div');n.className='v21-season-anchor';n.innerHTML=`<span>${esc21(a.icon)} ${esc21(a.title)}</span>`;host.appendChild(n);});
  }
  const _v21Overview=renderCareerOverview;
  renderCareerOverview=function(){const out=_v21Overview.apply(this,arguments);injectCareerAnchors21();return out;};

  window.__OWL_V21_UX={version:V21,rememberHeroPlan:rememberHeroPlan21,injectHeroReuse:injectHeroReuse21,anchor:anchorFor21};
})();
