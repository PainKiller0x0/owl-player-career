/* ===== Public Beta 1.9 RC26 · Release Polish & Contract/Season Integrity ===== */
(function(){
  'use strict';
  const VER='Public Beta 1.9 RC26';
  const FULL='Public Beta 1.9 RC26 · Release Polish';
  const ROLE_RANK={'深度轮换':0,'轮换选手':1,'主要轮换':1,'首发竞争':2,'稳定首发':3,'核心首发':4};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const nextYear=()=>Number(careerState?.seasonYear||2019)+1;
  const roleRank=x=>ROLE_RANK[String(x||'')]??1;
  const teamByName=name=>(typeof TEAMS!=='undefined'?TEAMS:[]).find(t=>t.name===name||t.short===name)||null;
  function logoImg(name,cls='rc26-team-logo'){
    const t=teamByName(name);return t?.logo?`<img class="${cls}" src="${esc(t.logo)}" alt="${esc(t.name)}" onerror="this.style.display='none'">`:'';
  }


  // ------------------------------------------------------------------
  // Hero specialization: keep the numeric score, add a compact colored mastery badge.
  // RC18 owns the final hero-card renderer, so RC26 decorates that final DOM instead of
  // relying on the older RC23 renderer that is no longer visible to players.
  // ------------------------------------------------------------------
  function heroBand(value){
    const v=Number(value||0);
    if(v>=95)return{label:'绝活',key:'master'};
    if(v>=90)return{label:'精通',key:'elite'};
    if(v>=82)return{label:'熟练',key:'skilled'};
    if(v>=72)return{label:'常用',key:'regular'};
    return{label:'待提升',key:'develop'};
  }
  function decorateHeroTraining(wrap){
    if(!wrap)return;
    wrap.querySelectorAll('.v800-hero-pick').forEach(card=>{
      const strong=card.querySelector('.v800-hero-pick-top strong');if(!strong||strong.querySelector('.v826-hero-band'))return;
      const m=strong.textContent.match(/·\s*([0-9]+(?:\.[0-9]+)?)/);if(!m)return;
      const band=heroBand(Number(m[1])),tag=document.createElement('em');tag.className=`v826-hero-band ${band.key}`;tag.textContent=band.label;strong.appendChild(tag);
      const small=card.querySelector('small');if(small){const parts=small.textContent.split('·').map(x=>x.trim()).filter(Boolean);if(parts.length&&['绝活','精通','熟练','常用','可用','待提升'].includes(parts[0])){parts.shift();small.textContent=parts.join(' · ');}}
    });
  }
  const baseTraining26=renderTrainingCamp;
  renderTrainingCamp=function(wrap){const out=baseTraining26.apply(this,arguments);decorateHeroTraining(wrap);return out;};

  // ------------------------------------------------------------------
  // Contracts: coherent salary / role / invitation language.
  // ------------------------------------------------------------------
  function normalizeOffer(o){
    if(!o)return o;
    const currentSalary=Number(careerState?.contract?.salary||0),currentRole=careerState?.contract?.rolePromise||'';
    const delta=roleRank(o.rolePromise)-roleRank(currentRole);
    if(currentSalary>0){
      let factor;
      if(o.renewal) factor=1.02;
      else if(delta>=2) factor=1.14;
      else if(delta===1) factor=1.10;
      else if(delta===0) factor=1.06;
      else if(delta===-1) factor=.98;
      else factor=.94;
      const floor=Math.round(currentSalary*factor);
      o.salary=Math.max(Number(o.salary||0),floor);
    }
    if(o.renewal){
      o.note='熟悉的队友与体系，续约后角色延续性最高。';
    }else if(o.rolePromise==='核心首发'){
      o.note=Number(o.teamPower||0)>=85?'争冠窗口明确，战队愿意把你作为核心首发和阵容支点。':'核心位置明确，战队愿意围绕你的强项配置阵容。';
    }else if(o.rolePromise==='稳定首发'){
      o.note=Number(o.teamPower||0)>=85?'争冠窗口明确，而且首发位置已经为你预留。':'首发位置明确，竞争压力可控，出场时间有保障。';
    }else if(o.rolePromise==='首发竞争'){
      o.note=Number(o.teamPower||0)>=85?'争冠窗口明确，但同位置已有成熟选手，需要用表现抢下首发。':'有明确的首发竞争机会，但需要靠表现赢得位置。';
    }else{
      o.note='阵容深度较完整，你将从轮换开始争取更多出场时间。';
    }
    return o;
  }
  const baseGenerate=generateContractOffers;
  generateContractOffers=function(){const out=baseGenerate.apply(this,arguments);(offseasonState.offers||[]).forEach(normalizeOffer);return out;};

  // ------------------------------------------------------------------
  // Contract detail becomes a real modal: sign / close.
  // ------------------------------------------------------------------
  function ensureOfferModal(){
    let overlay=document.getElementById('rc26OfferDetailOverlay');
    if(overlay)return overlay;
    overlay=document.createElement('div');overlay.id='rc26OfferDetailOverlay';overlay.className='rc26-modal-overlay ui-hidden';
    overlay.innerHTML='<section class="rc26-offer-modal" role="dialog" aria-modal="true"><div id="rc26OfferModalBody"></div></section>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click',e=>{if(e.target===overlay)closeOfferModal();});
    return overlay;
  }
  function closeOfferModal(){document.getElementById('rc26OfferDetailOverlay')?.classList.add('ui-hidden');}
  function openOfferModal(btn){
    const shell=btn.closest('.offer-card-shell'),card=shell?.querySelector('.offer-card[data-offer-id]');if(!shell||!card)return;
    const id=card.dataset.offerId,o=(offseasonState.offers||[]).find(x=>x.id===id);if(!o)return;
    normalizeOffer(o);
    const overlay=ensureOfferModal(),body=overlay.querySelector('#rc26OfferModalBody'),detail=shell.querySelector('.v19-offer-details-body')?.cloneNode(true);
    body.innerHTML=`<div class="rc26-modal-head"><div><span>CONTRACT OFFER · 报价详情</span><h2>${logoImg(o.team?.name,'rc26-modal-team-logo')}${esc(o.team?.name||'战队报价')}</h2></div><button type="button" class="rc26-close-x" id="rc26OfferX">×</button></div>
      <div class="rc26-offer-summary"><div><small>合同年限</small><strong>${o.years} 年</strong></div><div><small>年薪</small><strong>${o.salary} 万</strong></div><div><small>队内定位</small><strong>${esc(o.rolePromise)}</strong></div><div><small>综合适配</small><strong>${Number(o.fit||0)}</strong></div></div>
      <div class="rc26-offer-reason"><span>邀请理由</span><strong>${esc(o.note||'综合邀请')}</strong></div>
      <div class="rc26-offer-detail-slot"></div>
      <div class="rc26-modal-actions"><button class="secondary-btn" id="rc26OfferClose">关闭</button><button class="primary-btn" id="rc26OfferSign">签约 ${esc(o.team?.name||'这支队伍')} →</button></div>`;
    if(detail)body.querySelector('.rc26-offer-detail-slot').appendChild(detail);
    body.querySelector('#rc26OfferX').onclick=closeOfferModal;body.querySelector('#rc26OfferClose').onclick=closeOfferModal;
    body.querySelector('#rc26OfferSign').onclick=()=>{offseasonState.selectedOfferId=id;closeOfferModal();signSelectedOffer();};
    overlay.classList.remove('ui-hidden');
  }
  document.addEventListener('click',e=>{
    const b=e.target?.closest?.('.v21-offer-detail-btn');if(!b)return;
    e.preventDefault();e.stopImmediatePropagation();openOfferModal(b);
  },true);

  function normalizeMarket(wrap){
    if(!wrap)return;(offseasonState.offers||[]).forEach(normalizeOffer);
    wrap.querySelectorAll('.offer-card[data-offer-id]').forEach(card=>{
      const o=(offseasonState.offers||[]).find(x=>x.id===card.dataset.offerId);if(!o)return;
      const terms=card.querySelectorAll('.offer-term b');if(terms[1])terms[1].textContent=`${o.salary} 万`;if(terms[2])terms[2].textContent=o.rolePromise;
      const teamCopy=card.querySelector('.offer-team span');if(teamCopy)teamCopy.textContent=o.note;
      card.closest('.offer-card-shell')?.querySelector('.v19-offer-details')?.classList.add('rc26-inline-detail-hidden');
      const d=card.closest('.offer-card-shell')?.querySelector('.v19-offer-details-body');
      const line=[...(d?.querySelectorAll('.v19-detail-line')||[])].find(x=>x.querySelector('span')?.textContent.trim()==='邀请理由');if(line?.querySelector('strong'))line.querySelector('strong').textContent=o.note;
    });
  }
  const baseMarket=renderContractMarket;
  renderContractMarket=function(wrap){(offseasonState.offers||[]).forEach(normalizeOffer);const out=baseMarket.apply(this,arguments);normalizeMarket(wrap);return out;};

  // ------------------------------------------------------------------
  // Season / roster tactical identity and navigation semantics.
  // ------------------------------------------------------------------
  function tacticDef(side){
    const lib=window.__OWL_V24_TACTICAL_IDENTITY?.library?.[side?.major]||[];return lib.find(x=>x.id===side?.styleId)||null;
  }
  function tacticDetailHtml(){
    const p=window.__OWL_V24_TACTICAL_IDENTITY?.ensureCurrentProfile?.()||careerState.tacticProfile;if(!p)return'';
    const side=(s,label,sub)=>{const def=tacticDef(s),name=s?.style||def?.name||`${s?.major||'—'}体系`,traits=(s?.traits||def?.traits||[]).slice(0,3);return `<div class="rc26-tactic-side ${label==='主体系'?'primary':''}"><span>${label}</span><strong>${esc(s?.major||'—')}</strong><small>${sub}：${esc(name)}</small><p>${traits.length?traits.map(x=>`<b>${esc(x)}</b>`).join('<i>·</i>'):'标准执行'}</p></div>`;};
    return `<section class="rc26-roster-tactics"><div class="rc26-section-title">战术体系 · 阵容视图</div><div class="rc26-tactic-grid">${side(p.primary,'主体系','招牌战术')}${side(p.secondary,'副体系','第二战术')}</div></section>`;
  }
  function decorateCareerTeam(){
    if(!careerState.team)return;
    const card=document.getElementById('careerContractCard'),summary=card?.querySelector('.team-summary-grid');if(summary){card.querySelector('.rc26-roster-tactics')?.remove();summary.insertAdjacentHTML('afterend',tacticDetailHtml());}
    const btn=document.getElementById('startSeasonBtn');if(btn&&seasonState.active){btn.textContent='← 回到常规赛';btn.classList.add('rc26-return-season');}else btn?.classList.remove('rc26-return-season');
  }
  document.addEventListener('click',e=>{const b=e.target?.closest?.('#startSeasonBtn.rc26-return-season');if(!b)return;e.preventDefault();e.stopImmediatePropagation();renderSeason();showScreen('season');},true);
  const baseTeam=renderCareerTeam;
  renderCareerTeam=function(){const out=baseTeam.apply(this,arguments);decorateCareerTeam();return out;};

  function decorateSeason(){
    if(!careerState.team)return;
    const copy=document.querySelector('#seasonScreen .season-team-copy');if(copy){copy.querySelectorAll('.rc26-season-meta').forEach(n=>n.remove());const p=window.__OWL_V24_TACTICAL_IDENTITY?.ensureCurrentProfile?.()||careerState.tacticProfile;const meta=document.createElement('div');meta.className='rc26-season-meta';meta.innerHTML=`<span>本季定位 · <b>${esc(careerState.contract?.rolePromise||'待定')}</b></span><span>主体系 · <b>${esc(p?.primary?.major||careerState.tactic||'—')}</b>${p?.primary?.style?` · ${esc(p.primary.style)}`:''}</span>`;copy.appendChild(meta);}
    // stale 2027+ standings cache was capable of remembering an early-season rank until the final whistle.
    const y=Number(careerState.seasonYear||0),cache=seasonState.finalStandingsCache;if(y>=2027&&cache?.v34){const me=[...cache].find?.(r=>r.isUser);const expectedLoss=Math.max(0,Number(seasonState.total||0)-Number(seasonState.wins||0));const expectedLp=Number(seasonState.wins||0)+Number(seasonState.majorBonusLP||0);if(!me||Number(me.wins)!==Number(seasonState.wins)||Number(me.losses)!==expectedLoss||Number(me.lp)!==expectedLp)seasonState.finalStandingsCache=null;}
    decorateStageResults();
  }
  const baseStandings=syntheticFinalStandings;
  syntheticFinalStandings=function(){
    const y=Number(careerState.seasonYear||0),cache=seasonState.finalStandingsCache;if(y>=2027&&cache?.v34){const me=[...cache].find?.(r=>r.isUser);if(!me||Number(me.wins)!==Number(seasonState.wins||0)||Number(me.losses)!==Math.max(0,Number(seasonState.total||0)-Number(seasonState.wins||0))||Number(me.lp)!==Number(seasonState.wins||0)+Number(seasonState.majorBonusLP||0))seasonState.finalStandingsCache=null;}
    return baseStandings.apply(this,arguments);
  };
  const baseSeason=renderSeason;
  renderSeason=function(){
    const y=Number(careerState.seasonYear||0),cache=seasonState.finalStandingsCache;if(y>=2027&&cache?.v34){const me=[...cache].find?.(r=>r.isUser);if(!me||Number(me.wins)!==Number(seasonState.wins||0))seasonState.finalStandingsCache=null;}
    const out=baseSeason.apply(this,arguments);decorateSeason();return out;
  };

  // ------------------------------------------------------------------
  // Stage result presentation: champion / runner-up = trophy + team logo.
  // ------------------------------------------------------------------
  function decorateStageResults(){
    document.querySelectorAll('#seasonScreen .stage-break-stats').forEach(stats=>{
      [...stats.children].forEach(cell=>{
        const label=cell.querySelector('span')?.textContent.trim(),strong=cell.querySelector('strong');if(!strong||strong.dataset.rc26TeamDecorated)return;
        if(label!=='冠军'&&label!=='亚军')return;const name=strong.textContent.trim();if(!name||name==='待定')return;
        strong.dataset.rc26TeamDecorated='1';strong.innerHTML=`<span class="rc26-trophy ${label==='冠军'?'gold':'silver'}">🏆</span>${logoImg(name,'rc26-result-team-logo')}<span>${esc(name)}</span>`;
      });
    });
  }

  // ------------------------------------------------------------------
  // Regular awards: team logos + player MVP highlight.
  // ------------------------------------------------------------------
  function decorateAwards(){
    const root=document.getElementById('regularAwardsContent');if(!root)return;
    root.querySelectorAll('.award-winner-copy span,.award-role-winner span').forEach(span=>{
      if(span.dataset.rc26Logo)return;const raw=span.textContent.trim(),teamName=raw.split(' · ')[0],team=teamByName(teamName);if(!team)return;span.dataset.rc26Logo='1';span.innerHTML=`${logoImg(team.name,'rc26-award-team-logo')}<span>${esc(raw)}</span>`;
    });
    const mvp=[...root.querySelectorAll('.award-card')].find(card=>card.querySelector('.award-card-head h3')?.textContent.includes('最有价值选手'));
    if(mvp){const winner=mvp.querySelector('.award-winner-copy strong')?.textContent.trim();if(winner===getPlayerName()){mvp.classList.add('rc26-user-mvp');const rank=mvp.querySelector('.award-rank-box strong');if(rank)rank.innerHTML='🏆 你就是本季 MVP';}}
  }
  const baseAwards=renderRegularSeasonAwards;
  renderRegularSeasonAwards=function(){const out=baseAwards.apply(this,arguments);decorateAwards();return out;};

  // ------------------------------------------------------------------
  // Season summary: team logo and compact K/D/A line.
  // ------------------------------------------------------------------
  function decorateSummary(){
    const hero=document.getElementById('summaryTeamName');if(hero&&careerState.team&&!hero.querySelector('img'))hero.innerHTML=`${logoImg(careerState.team.name,'rc26-summary-team-logo')}<span>${esc(careerState.team.name)}</span>`;
    const row=document.getElementById('summaryTeamText');if(row&&careerState.team&&!row.querySelector('img'))row.innerHTML=`${logoImg(careerState.team.name,'rc26-inline-team-logo')}<span>${esc(careerState.team.name)}</span>`;
    document.querySelectorAll('#summaryScreen .summary-stat-box').forEach(box=>{if(/K\s*\/\s*D\s*\/\s*A/i.test(box.querySelector('span')?.textContent||''))box.classList.add('rc26-kda-box');});
  }
  const baseSummary=renderSeasonSummary;
  renderSeasonSummary=function(){const out=baseSummary.apply(this,arguments);decorateSummary();return out;};

  function syncVersion(){
    window.__OWL_RUNTIME.render.syncReleaseMeta();
  }
  window.__OWL_V26_RELEASE_POLISH=Object.freeze({version:VER,release:FULL,normalizeOffer,decorateAwards,decorateSeason,decorateCareerTeam,decorateSummary,decorateHeroTraining,syncVersion});
})();

/* ===== Public Beta 1.9 RC27 · Career UI Consolidation ===== */
(function(){
  'use strict';
  const VER='Public Beta 1.9 RC27';
  const FULL='Public Beta 1.9 RC27 · Career UI Consolidation';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const tacticApi=()=>window.__OWL_V24_TACTICAL_IDENTITY||null;
  const profile=()=>tacticApi()?.ensureCurrentProfile?.()||careerState?.tacticProfile||null;
  const team=()=>careerState?.team||null;
  const role=()=>careerState?.contract?.rolePromise||'待定';
  const branchText=()=>{
    const y=Number(careerState?.startYear||2019),mode=careerState?.simulationMode==='history'?'历史模拟':'梦幻模拟';
    return careerState?.simulationMode==='history'?`${mode} · 2019史实线`:`${mode} · ${y}分叉`;
  };
  const traitsOf=p=>[...(p?.primary?.traits||[]),...(p?.secondary?.traits||[])].filter((x,i,a)=>x&&a.indexOf(x)===i).slice(0,4);
  function sideName(s){return s?`${s.major||'—'} · ${s.style||'标准战术'}`:'—';}

  function ensureTacticModal(){
    let overlay=document.getElementById('rc27TacticOverlay');
    if(overlay)return overlay;
    overlay=document.createElement('div');overlay.id='rc27TacticOverlay';overlay.className='rc27-modal-overlay ui-hidden';
    overlay.innerHTML='<section class="rc27-tactic-modal" role="dialog" aria-modal="true" aria-labelledby="rc27TacticTitle"><div id="rc27TacticModalBody"></div></section>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click',e=>{if(e.target===overlay)closeTacticModal();});
    return overlay;
  }
  function closeTacticModal(){document.getElementById('rc27TacticOverlay')?.classList.add('ui-hidden');}
  function tacticSideHtml(s,label,styleLabel){
    if(!s)return'';
    let hero=null;try{hero=tacticApi()?.heroAffinity?.(s,Number(careerState?.seasonYear||2019))||null;}catch(_){}
    const traits=(s.traits||[]).length?(s.traits||[]).map(x=>`<b>${esc(x)}</b>`).join(''):'<b>标准执行</b>';
    return `<article class="rc27-tactic-modal-side ${label==='主体系'?'primary':''}">
      <div class="rc27-tactic-side-head"><span>${label}</span><strong>${esc(s.major||'—')}</strong></div>
      <div class="rc27-tactic-style"><small>${styleLabel}</small><strong>${esc(s.style||'标准战术')}</strong></div>
      <div class="rc27-tactic-traits"><small>战术特点</small><div>${traits}</div></div>
      ${hero?.detail?`<div class="rc27-tactic-fit"><small>你的英雄池</small><strong>${esc(hero.detail)}</strong></div>`:''}
    </article>`;
  }
  function openTacticModal(){
    const p=profile();if(!p)return;
    const overlay=ensureTacticModal(),body=overlay.querySelector('#rc27TacticModalBody');
    body.innerHTML=`<div class="rc27-modal-head"><div><span>TACTICAL IDENTITY · 战术身份</span><h2 id="rc27TacticTitle">${esc(team()?.name||'当前战队')} · 完整战术体系</h2><p>主体系决定战队最常使用的赢法，副体系负责地图与版本切换。</p></div><button type="button" class="rc27-close-x" id="rc27TacticX">×</button></div>
      <div class="rc27-tactic-modal-grid">${tacticSideHtml(p.primary,'主体系','招牌战术')}${tacticSideHtml(p.secondary,'副体系','第二战术')}</div>
      <div class="rc27-tactic-modal-foot"><span>本季定位</span><strong>${esc(role())} · ${esc(state?.role||'选手')}</strong><button class="secondary-btn" id="rc27TacticClose">关闭</button></div>`;
    body.querySelector('#rc27TacticX').onclick=closeTacticModal;body.querySelector('#rc27TacticClose').onclick=closeTacticModal;
    overlay.classList.remove('ui-hidden');
  }
  document.addEventListener('click',e=>{const b=e.target?.closest?.('[data-rc27-tactic-detail]');if(!b)return;e.preventDefault();e.stopPropagation();openTacticModal();});

  function ensureTeamContext(card){
    let ctx=card.querySelector('.rc27-team-context');
    if(!ctx){ctx=document.createElement('div');ctx.className='rc27-team-context';card.querySelector('.contract-team-line')?.insertAdjacentElement('beforebegin',ctx);}
    ctx.innerHTML=`<span>${careerState?.seasonYear||2019} 赛季</span><span>${esc(branchText())}</span><span>${careerState?.seasonYear<=2023?'OWL':'OWL 2.0'}</span>`;
    return ctx;
  }
  function ensureContractFacts(card){
    let facts=card.querySelector('.rc27-contract-facts');
    if(!facts){facts=document.createElement('div');facts.className='rc27-contract-facts';card.querySelector('.contract-role')?.insertAdjacentElement('afterend',facts);}
    const c=careerState?.contract||{};
    facts.innerHTML=`<div><span>合同</span><strong>剩余 ${Number(c.remaining??c.years??0)} 年</strong></div><div><span>年薪</span><strong>${Number(c.salary||0)} 万</strong></div><div><span>季前排名</span><strong>第 ${Number(careerState?.rank||0)||'—'}</strong></div>`;
    return facts;
  }
  function tacticSummaryHtml(){
    const p=profile();if(!p)return'';const traits=traitsOf(p);
    return `<section class="rc27-tactic-summary"><div class="rc27-tactic-summary-main"><span>战术身份</span><strong>主打 ${esc(sideName(p.primary))}</strong><small>副打 ${esc(sideName(p.secondary))}</small></div><div class="rc27-tactic-summary-traits">${traits.map(x=>`<b>${esc(x)}</b>`).join('')}</div><button type="button" class="secondary-btn" data-rc27-tactic-detail>查看完整战术体系</button></section>`;
  }
  function decorateTeamConfirmation(){
    const card=document.getElementById('careerContractCard');if(!card||!team())return;
    card.classList.add('rc27-contract-card');
    card.querySelector(':scope > .v76-mode-pill')?.remove();
    ensureTeamContext(card);ensureContractFacts(card);
    const oldMeta=document.getElementById('careerContractMeta');if(oldMeta)oldMeta.classList.add('rc27-legacy-meta');
    const roleBox=card.querySelector('.contract-role');if(roleBox){roleBox.classList.add('rc27-contract-role');roleBox.innerHTML=`你将以 <strong id="careerRoleText">${esc(role())} · ${esc(state?.role||'选手')} · ${Number(careerState?.age||0)}岁</strong> 的身份进入新赛季`;}
    const summary=card.querySelector('.team-summary-grid');if(summary){summary.classList.add('rc27-summary-grid');const tactic=document.getElementById('careerTactic');const p=profile();if(tactic)tactic.textContent=p?.primary?.major||careerState.tactic||'—';card.querySelector('.rc26-roster-tactics')?.remove();card.querySelector('.rc27-tactic-summary')?.remove();summary.insertAdjacentHTML('afterend',tacticSummaryHtml());}
    const btn=document.getElementById('startSeasonBtn');if(btn){btn.classList.add('rc27-start-season');const tactics=card.querySelector('.rc27-tactic-summary');if(tactics&&tactics.nextElementSibling!==btn)tactics.insertAdjacentElement('afterend',btn);}
    decorateSquadCard();
  }

  function decorateSquadCard(){
    const card=document.getElementById('careerSquadCard');if(!card||!team())return;card.classList.add('rc27-squad-card');
    const title=card.querySelector('.squad-title');if(title){title.querySelector('h3').textContent='阵容与赛季角色';const count=(careerState.starters?.length||0)+(careerState.bench?.length||0);const s=title.querySelector('span');if(s)s.textContent=`${count} 人名单 · 你的本季定位已确认`;}
    let context=card.querySelector('.rc27-roster-context');if(!context){context=document.createElement('div');context.className='rc27-roster-context';title?.insertAdjacentElement('afterend',context);}
    const p=profile();context.innerHTML=`<div><span>你的定位</span><strong>${esc(role())}</strong><small>${esc(state?.role||'选手')}</small></div><div><span>主体系</span><strong>${esc(p?.primary?.major||careerState.tactic||'—')}</strong><small>${esc(p?.primary?.style||'标准战术')}</small></div><button type="button" class="secondary-btn" data-rc27-tactic-detail>查看战术详情</button>`;
    if(!card.querySelector('.rc27-roster-grid')){
      const labels=[...card.querySelectorAll(':scope > .squad-section-label')],starter=document.getElementById('careerStarterList'),bench=document.getElementById('careerBenchList');
      if(labels.length>=2&&starter&&bench){const grid=document.createElement('div');grid.className='rc27-roster-grid';const a=document.createElement('section'),b=document.createElement('section');a.className='rc27-roster-col';b.className='rc27-roster-col';grid.append(a,b);a.append(labels[0],starter);b.append(labels[1],bench);context.insertAdjacentElement('afterend',grid);}
    }
  }

  function decorateSeasonHome(){
    if(!team())return;const score=document.querySelector('#seasonScreen .season-score-card');if(!score)return;score.classList.add('rc27-season-score-card');
    document.querySelector('#seasonScreen .season-team-copy .rc26-season-meta')?.remove();
    let id=score.querySelector('.rc27-season-identity');if(!id){id=document.createElement('div');id.className='rc27-season-identity';score.querySelector('.season-score-top')?.insertAdjacentElement('afterend',id);}
    const p=profile();id.innerHTML=`<div><span>本季定位</span><strong>${esc(role())}</strong><small>${esc(state?.role||'选手')}</small></div><div><span>主体系</span><strong>${esc(p?.primary?.major||careerState.tactic||'—')}</strong><small>${esc(p?.primary?.style||'标准战术')}</small></div><div><span>队伍目标</span><strong>${esc(careerState?.goal||'冲击季后赛')}</strong><small>赛季目标</small></div><button type="button" class="rc27-identity-detail" data-rc27-tactic-detail>战术详情 →</button>`;
    const strip=document.getElementById('seasonPlayerStrip');if(strip)strip.classList.add('rc27-season-player-strip');
  }

  function syncVersion(){
    window.__OWL_RUNTIME.render.syncReleaseMeta();
  }

  const baseTeam=renderCareerTeam;renderCareerTeam=function(){const out=baseTeam.apply(this,arguments);decorateTeamConfirmation();return out;};
  const baseSeason=renderSeason;renderSeason=function(){const out=baseSeason.apply(this,arguments);decorateSeasonHome();return out;};
  window.__OWL_V27_UI_CONSOLIDATION=Object.freeze({version:VER,release:FULL,decorateTeamConfirmation,decorateSquadCard,decorateSeasonHome,openTacticModal,closeTacticModal,syncVersion});
})();

/* ===== Public Beta 1.9 RC28 · UI Truth & Historical Integrity ===== */
(function(){
  'use strict';
  const VER='Public Beta 1.9 RC28';
  const FULL='Public Beta 1.9 RC28 · UI Truth & Historical Integrity';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const year=()=>Number(careerState?.seasonYear||2019);
  const playerName=()=>typeof getPlayerName==='function'?getPlayerName():(state?.playerName||'Rookie');

  // ------------------------------------------------------------------
  // Shared team/logo helpers: career history needs the logo that belonged
  // to the displayed team/year, not merely today's franchise name.
  // ------------------------------------------------------------------
  function teamVisual(name,recordYear=year()){
    const teams=typeof TEAMS!=='undefined'?TEAMS:[];
    const direct=teams.find(t=>t?.name===name||t?.short===name);
    if(direct)return {name:direct.name,logo:direct.logo,short:direct.displayShort||direct.short};
    for(const t of teams){
      try{
        const meta=typeof v50TeamMetaForYear==='function'?v50TeamMetaForYear(t,Number(recordYear)):null;
        if(meta&&(meta.name===name||meta.displayShort===name||t.short===name))return {name:meta.name||name,logo:meta.logo||t.logo,short:meta.displayShort||t.short};
      }catch(_e){}
    }
    return null;
  }
  function teamLogo(name,cls='rc28-team-logo',recordYear=year()){
    const t=teamVisual(name,recordYear);if(!t?.logo)return'';
    return `<img class="${cls}" src="${esc(t.logo)}" alt="${esc(name)}" onerror="this.style.display='none'">`;
  }

  // ------------------------------------------------------------------
  // 1. Season summary alignment. RC26 changed the team value to flex, which
  // accidentally overrode the normal right-aligned value column.
  // ------------------------------------------------------------------
  function decorateSummaryAlignment(){
    const value=document.getElementById('summaryTeamText');
    if(value)value.classList.add('rc28-summary-team-value');
  }

  // ------------------------------------------------------------------
  // 2. Hero market profile: the old <details> was squeezed into a two-column
  // market summary and looked like stray text. Keep the market snapshot small,
  // move the actual details into a proper independent modal.
  // ------------------------------------------------------------------
  function heroMarket(){try{return window.__OWL_V75_DIAGNOSTICS?.().heroMarket||null}catch(_e){return null}}
  function heroBand(value){const v=Number(value||0);return v>=95?['绝活','master']:v>=90?['精通','elite']:v>=82?['熟练','skilled']:v>=72?['常用','regular']:['待提升','develop'];}
  function ensureHeroModal(){
    let overlay=document.getElementById('rc28HeroOverlay');if(overlay)return overlay;
    overlay=document.createElement('div');overlay.id='rc28HeroOverlay';overlay.className='rc28-modal-overlay ui-hidden';
    overlay.innerHTML='<section class="rc28-hero-modal" role="dialog" aria-modal="true" aria-labelledby="rc28HeroTitle"><div id="rc28HeroModalBody"></div></section>';
    document.body.appendChild(overlay);overlay.addEventListener('click',e=>{if(e.target===overlay)closeHeroModal();});return overlay;
  }
  function closeHeroModal(){document.getElementById('rc28HeroOverlay')?.classList.add('ui-hidden')}
  function openHeroModal(){
    const h=heroMarket();if(!h)return;
    const overlay=ensureHeroModal(),body=overlay.querySelector('#rc28HeroModalBody');
    const rows=(h.topHeroes||[]).map((x,i)=>{const band=heroBand(x.value);return `<div class="rc28-hero-row"><span class="rc28-hero-order">${String(i+1).padStart(2,'0')}</span><strong>${esc(x.name)}</strong><b>${Number(x.value||0).toFixed(1)}</b><em class="rc28-hero-band ${band[1]}">${band[0]}</em></div>`;}).join('')||'<div class="rc28-hero-empty">当前还没有形成稳定英雄池。</div>';
    body.innerHTML=`<div class="rc28-modal-head"><div><span>HERO POOL · 英雄池详情</span><h2 id="rc28HeroTitle">${esc(h.label||'英雄池画像')}</h2><p>这里只展开英雄池本身；合同页继续保持结论优先。</p></div><button type="button" class="rc28-close-x" id="rc28HeroX">×</button></div>
      <div class="rc28-hero-metrics"><div><span>最高熟练度</span><strong>${Number(h.top||0).toFixed(1)}</strong></div><div><span>${year()>=2025?'抗Ban深度':'英雄池宽度'}</span><strong>${Number(h.breadth||0)}</strong></div><div><span>精通以上</span><strong>${Number(h.elite||0)}</strong></div><div><span>市场修正</span><strong>${Number(h.premium||0)>=0?'+':''}${Number(h.premium||0).toFixed(1)}</strong></div></div>
      <div class="rc28-hero-list">${rows}</div><div class="rc28-modal-foot"><small>数值仍参与体系适配与市场评价；标签只帮助快速阅读。</small><button type="button" class="secondary-btn" id="rc28HeroClose">关闭</button></div>`;
    body.querySelector('#rc28HeroX').onclick=closeHeroModal;body.querySelector('#rc28HeroClose').onclick=closeHeroModal;overlay.classList.remove('ui-hidden');
  }
  function decorateHeroProfile(){
    const wrap=document.getElementById('offseasonContent');if(!wrap||offseasonState?.phase!=='market')return;
    const box=wrap.querySelector('.v772-personal-hero-market');if(!box)return;
    box.classList.add('rc28-hero-market-card');
    box.querySelector('.v19-hero-profile-details')?.remove();
    let btn=box.querySelector('.rc28-hero-details-btn');
    if(!btn){btn=document.createElement('button');btn.type='button';btn.className='secondary-btn rc28-hero-details-btn';btn.innerHTML='<span>查看英雄池详情</span><b>→</b>';box.appendChild(btn);btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openHeroModal();});}
  }

  // ------------------------------------------------------------------
  // 3. Contract offer selection: selection should read as selection, not as
  // an entirely different/broken card. Styling is handled by RC28 CSS.
  // ------------------------------------------------------------------
  function decorateOfferSelection(){
    document.querySelectorAll('#offseasonContent .v21-offer-card-shell').forEach(shell=>shell.classList.toggle('rc28-selected-offer',!!shell.querySelector(':scope > .offer-card.selected')));
  }

  // ------------------------------------------------------------------
  // 4. Stage/Major result podium: a compact SVG medal/trophy lock-up replaces
  // the tiny emoji/filter combination from RC26.
  // ------------------------------------------------------------------
  function trophySvg(){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10v3h3v2c0 3.35-2.06 5.42-5.05 5.9A5.02 5.02 0 0 1 13 15.58V18h4v3H7v-3h4v-2.42a5.02 5.02 0 0 1-1.95-1.68C6.06 13.42 4 11.35 4 8V6h3V3Zm0 5H6c0 1.78.73 2.94 2 3.5A8.8 8.8 0 0 1 7 8Zm10 0c0 1.38-.35 2.55-1 3.5 1.27-.56 2-1.72 2-3.5h-1Z" fill="currentColor"/></svg>';}
  function decorateStageResults(){
    document.querySelectorAll('#seasonScreen .stage-break-stats').forEach(stats=>{
      [...stats.children].forEach(cell=>{
        const label=cell.querySelector('span')?.textContent.trim(),strong=cell.querySelector('strong');if(!strong||!['冠军','亚军'].includes(label))return;
        const lastName=strong.querySelector(':scope > span:last-child')?.textContent?.trim();
        let name=lastName||strong.textContent.replace(/^🏆|^🏅|^🥈/,'').trim();
        if(!name||name==='待定')return;
        cell.classList.add('rc28-podium-cell',label==='冠军'?'champion':'runner');
        strong.classList.add('rc28-podium-team');strong.dataset.rc28TeamDecorated='1';
        strong.innerHTML=`<span class="rc28-trophy-mark">${trophySvg()}</span>${teamLogo(name,'rc28-podium-logo')}<span>${esc(name)}</span>`;
      });
    });
  }

  // ------------------------------------------------------------------
  // 5. MVP highlight: mimic the role-star "mine" row rather than tinting the
  // entire award card gold.
  // ------------------------------------------------------------------
  function decorateAwards(){
    const root=document.getElementById('regularAwardsContent');if(!root)return;
    const mvp=[...root.querySelectorAll('.award-card')].find(card=>card.querySelector('.award-card-head h3')?.textContent.includes('最有价值选手'));
    if(!mvp)return;const winner=mvp.querySelector('.award-winner-copy strong')?.textContent.trim();
    mvp.classList.remove('rc26-user-mvp');const row=mvp.querySelector('.award-main-row');row?.classList.remove('rc28-mvp-mine');
    if(winner===playerName()){
      row?.classList.add('rc28-mvp-mine');const rank=mvp.querySelector('.award-rank-box strong');if(rank)rank.innerHTML='🏆 获奖';
    }
  }

  // ------------------------------------------------------------------
  // 6. Alarm historical integrity.
  // Alarm's real career ended in 2021. From 2022 onward he must not remain in
  // a historical or dream-world roster, award pool, or cached award result.
  // ------------------------------------------------------------------
  function stripAlarmList(list,cutoffYear){return Number(cutoffYear)>=2022?(list||[]).filter(e=>String(Array.isArray(e)?e[0]:e?.name)!=='Alarm'):(list||[]);}
  function scrubAlarmSnapshot(snap,snapYear){
    if(!snap||Number(snapYear)<2022)return snap;let removed=[];
    Object.entries(snap.teams||{}).forEach(([short,list])=>{
      const hit=(list||[]).filter(p=>p?.name==='Alarm');if(!hit.length)return;removed.push(...hit.map(p=>({short,p})));
      snap.teams[short]=(list||[]).filter(p=>p?.name!=='Alarm');
      try{if(typeof v60CalcTeamStrength==='function'){snap.teamStrength=snap.teamStrength||{};snap.teamStrength[short]=v60CalcTeamStrength(snap.teams[short]);}}catch(_e){}
    });
    if(removed.length){
      snap.news=snap.news||{};snap.news.retirements=snap.news.retirements||[];
      if(!snap.news.retirements.some(x=>x?.name==='Alarm')){const x=removed[0];snap.news.retirements.push({name:'Alarm',teamShort:x.short,role:x.p?.role||'输出支援',age:x.p?.age||20,peak:x.p?.peakRecorded||x.p?.ovr||97,historical:true,reason:'historical-exit-2021'});}
    }
    return snap;
  }
  if(typeof v50RosterEntriesFor==='function'){
    const baseRoster=v50RosterEntriesFor;v50RosterEntriesFor=function(team,queryYear=careerState?.seasonYear||2019){return stripAlarmList(baseRoster.apply(this,arguments),Number(queryYear));};
  }
  if(typeof v76EnsureWorldToYear==='function'){
    const baseWorld=v76EnsureWorldToYear;v76EnsureWorldToYear=function(targetYear){const y=Number(targetYear||careerState?.seasonYear||2019);return scrubAlarmSnapshot(baseWorld.apply(this,arguments),y);};
  }
  if(typeof buildRegularAwardLeaguePool==='function'){
    const basePool=buildRegularAwardLeaguePool;buildRegularAwardLeaguePool=function(){return year()>=2022?(basePool.apply(this,arguments)||[]).filter(p=>p?.name!=='Alarm'):basePool.apply(this,arguments);};
  }
  function objectContainsAlarm(value,seen=new Set()){
    if(value==null||typeof value!=='object')return false;if(seen.has(value))return false;seen.add(value);
    if(value.name==='Alarm')return true;return Object.values(value).some(v=>objectContainsAlarm(v,seen));
  }
  if(typeof ensureRegularSeasonAwards==='function'){
    const baseEnsureAwards=ensureRegularSeasonAwards;ensureRegularSeasonAwards=function(){if(year()>=2022&&seasonState?.awards&&objectContainsAlarm(seasonState.awards))seasonState.awards=null;return baseEnsureAwards.apply(this,arguments);};
  }
  function injectAlarmHistoryNode(wrap){
    if(!wrap||year()!==2022||wrap.querySelector('.rc28-alarm-history'))return;
    const node=document.createElement('section');node.className='rc28-alarm-history';
    node.innerHTML='<div><span>HISTORICAL NODE · 2021</span><h4>Alarm · 离开赛场</h4><p>Alarm 的职业生涯止于 2021 赛季。自 2022 赛季起，历史名单、梦幻世界与奖项候选池都不再包含他。</p></div><b>17</b>';
    const target=wrap.querySelector('.v50-roster-transition')||wrap.querySelector('#viewNewRosterBtn')||wrap.lastElementChild;
    target?.insertAdjacentElement(target?.matches?.('#viewNewRosterBtn')?'beforebegin':'afterend',node);
  }

  // ------------------------------------------------------------------
  // 7. Active Stage/Major/EWC result belongs to the primary season action
  // slot, never at the bottom below the whole season page.
  // ------------------------------------------------------------------
  function ensurePrimarySlot(){
    const track=document.querySelector('#seasonScreen .season-track-card'),head=track?.querySelector('.season-track-head');if(!track||!head)return null;
    let slot=document.getElementById('v768SeasonPrimaryAction');if(!slot){slot=document.createElement('div');slot.id='v768SeasonPrimaryAction';slot.className='v768-season-primary-action';}
    if(slot.parentElement!==track||slot.previousElementSibling!==head)head.insertAdjacentElement('afterend',slot);return slot;
  }
  function promoteSeasonMilestone(){
    const slot=ensurePrimarySlot();if(!slot)return false;
    const inline=document.getElementById('v741SeasonInlineMilestone');
    if(inline&&inline.querySelector('.stage-break-card,.season-complete-banner')){if(inline.parentElement!==slot)slot.appendChild(inline);slot.classList.add('show');}
    const bottom=document.getElementById('seasonCompleteArea');
    const candidates=bottom?[...bottom.querySelectorAll(':scope > .stage-break-card,:scope > .season-complete-banner')]:[];
    if(candidates.length){
      const preferred=candidates.find(c=>/EWC|Esports World Cup/i.test(c.textContent||''))||candidates.at(-1);
      const inlineHas=!!inline?.querySelector('.stage-break-card,.season-complete-banner');
      if(preferred&&(!inlineHas||/EWC|Esports World Cup/i.test(preferred.textContent||''))){
        if(inlineHas&&/EWC|Esports World Cup/i.test(preferred.textContent||'')){inline.querySelectorAll('.stage-break-card,.season-complete-banner').forEach(n=>n.remove());inline.classList.remove('show');}
        [...slot.children].forEach(n=>{if(n!==inline)n.remove();});slot.appendChild(preferred);slot.classList.add('show');
      }
      candidates.filter(c=>c!==preferred).forEach(c=>c.remove());
    }
    slot.classList.toggle('rc28-has-milestone',!!slot.querySelector('.stage-break-card,.season-complete-banner'));
    return !!slot.querySelector('.stage-break-card,.season-complete-banner');
  }

  // ------------------------------------------------------------------
  // 8. Career season records: add the team mark to each historical row.
  // ------------------------------------------------------------------
  function decorateCareerLogos(){
    const rows=[...document.querySelectorAll('#careerTabContent .career-season-row')],archive=[...(careerState?.careerArchive||[])].reverse();
    rows.forEach((row,i)=>{
      const rec=archive[i],strong=row.children?.[1]?.querySelector(':scope > strong');if(!rec||!strong||strong.querySelector('.rc28-career-team-logo'))return;
      const visual=teamVisual(rec.team,rec.year);if(!visual?.logo)return;const img=document.createElement('img');img.className='rc28-career-team-logo';img.src=visual.logo;img.alt=rec.team;img.onerror=()=>img.remove();strong.prepend(img);
    });
  }

  function syncVersion(){
    window.__OWL_RUNTIME.render.syncReleaseMeta();
  }

  // Last-layer wrappers: run after every legacy/RC render so late additions do
  // not reintroduce the old UI or put milestone cards back at page bottom.
  if(typeof renderSeasonSummary==='function'){
    const base=renderSeasonSummary;renderSeasonSummary=function(){const out=base.apply(this,arguments);decorateSummaryAlignment();return out;};
  }
  if(typeof renderOffseason==='function'){
    const base=renderOffseason;renderOffseason=function(){const out=base.apply(this,arguments);decorateHeroProfile();decorateOfferSelection();return out;};
  }
  if(typeof renderSeason==='function'){
    const base=renderSeason;renderSeason=function(){const out=base.apply(this,arguments);decorateStageResults();promoteSeasonMilestone();requestAnimationFrame(()=>{decorateStageResults();promoteSeasonMilestone();});return out;};
  }
  if(typeof renderRegularSeasonAwards==='function'){
    const base=renderRegularSeasonAwards;renderRegularSeasonAwards=function(){const out=base.apply(this,arguments);decorateAwards();return out;};
  }
  if(typeof renderCareerOverview==='function'){
    const base=renderCareerOverview;renderCareerOverview=function(){const out=base.apply(this,arguments);decorateCareerLogos();return out;};
  }
  if(typeof renderCareerHub==='function'){
    const base=renderCareerHub;renderCareerHub=function(){const out=base.apply(this,arguments);decorateCareerLogos();return out;};
  }
  if(typeof renderSigningComplete==='function'){
    const base=renderSigningComplete;renderSigningComplete=function(wrap){const out=base.apply(this,arguments);injectAlarmHistoryNode(wrap);return out;};
  }
  decorateSummaryAlignment();decorateHeroProfile();decorateOfferSelection();decorateStageResults();decorateAwards();decorateCareerLogos();promoteSeasonMilestone();
  window.__OWL_V28_UI_TRUTH=Object.freeze({version:VER,release:FULL,decorateSummaryAlignment,decorateHeroProfile,openHeroModal,closeHeroModal,decorateOfferSelection,decorateStageResults,decorateAwards,scrubAlarmSnapshot,injectAlarmHistoryNode,promoteSeasonMilestone,decorateCareerLogos,syncVersion});
})();

/* ===== Public Beta 1.9 RC29 · Changelog ===== */
(function(){
  const VER='Public Beta 1.9 RC29';
  const FULL='Public Beta 1.9 RC29 · Changelog';
  const releases=[
    {
      version:'RC29',name:'更新日志',current:true,
      points:[
        '主入口版本信息改为可点击入口，点击即可查看版本更新日志。',
        '更新日志默认突出当前版本，同时保留最近版本的折叠记录，方便追溯改动。',
        '支持点击遮罩、关闭按钮与 Esc 键退出；桌面与手机端共用同一套响应式弹窗。'
      ]
    },
    {
      version:'RC28',name:'UI Truth & Historical Integrity',
      points:[
        '统一选手信息对齐，英雄池详情改为独立弹窗，报价选中态降噪。',
        'Stage / Major 冠亚军与玩家 MVP 视觉重做，并修正赛事块在页面中的位置。',
        '补齐 Alarm 历史节点与生涯逐季战队 Logo。'
      ]
    },
    {
      version:'RC27',name:'Career UI Consolidation',
      points:[
        '重做签约确认页的信息层级、按钮尺寸与模式标签位置。',
        '战术信息默认摘要化，完整体系改为主动查看。',
        '常规赛首页与阵容详情重新整理赛季身份、主体系与阵容阅读结构。'
      ]
    },
    {
      version:'RC26',name:'Release Polish',
      points:[
        '合同详情弹窗化，修正邀请理由、薪资报价和赛季中争冠交易的定位逻辑。',
        '补强常规赛定位、战术信息、奖项与英雄熟练度展示。',
        '修复 2027+ 排名缓存导致最终战绩与联盟排名不一致的问题。'
      ]
    },
    {
      version:'RC25',name:'All-Star Details',
      points:[
        '全明星结果页新增主动查看详情入口，默认页面继续保持简洁。',
        '恢复 2019 / 2020 历史全明星项目，并修正 2020 分赛区举办结构。',
        '未来年份重新保留新星赛、狙王与全能王等项目。'
      ]
    },
    {
      version:'RC24',name:'Tactical Identity',
      points:[
        '战术体系重构为主/副体系、招牌/第二战术与战术特点三层结构。',
        '引入按年代开放的真实战术库，并让英雄池实际参与体系契合计算。',
        '旧存档中的早期战术标签自动迁移为新的战术身份。'
      ]
    }
  ];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function ensureModal(){
    let overlay=document.getElementById('rc29ChangelogOverlay');
    if(overlay)return overlay;
    overlay=document.createElement('div');
    overlay.id='rc29ChangelogOverlay';
    overlay.className='rc29-changelog-overlay ui-hidden';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-labelledby','rc29ChangelogTitle');
    overlay.innerHTML=`
      <section class="rc29-changelog-modal" tabindex="-1">
        <header class="rc29-changelog-head">
          <div>
            <div class="rc29-changelog-kicker">PATCH NOTES · 更新日志</div>
            <h2 id="rc29ChangelogTitle">OWL 选手之路 · 更新日志</h2>
            <p>先看当前版本；想考古时，再展开过去几次更新。</p>
          </div>
          <button type="button" class="rc29-changelog-close" id="rc29ChangelogClose" aria-label="关闭更新日志">×</button>
        </header>
        <div class="rc29-changelog-body" id="rc29ChangelogBody"></div>
        <footer class="rc29-changelog-foot">版本记录只保留对玩家有意义的改动摘要；完整技术细节仍以发行 QA / Release Notes 为准。</footer>
      </section>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click',e=>{if(e.target===overlay)closeChangelog();});
    overlay.querySelector('#rc29ChangelogClose').addEventListener('click',closeChangelog);
    return overlay;
  }

  function renderChangelog(){
    const overlay=ensureModal(),body=overlay.querySelector('#rc29ChangelogBody');
    const current=releases[0],history=releases.slice(1);
    body.innerHTML=`
      <article class="rc29-release-current">
        <div class="rc29-release-top"><span class="rc29-release-badge">当前版本</span><h3>${esc(current.version)} · ${esc(current.name)}</h3></div>
        <div class="rc29-release-subtitle">${esc(current.release||FULL)}</div>
        <ul class="rc29-release-points">${current.points.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
      </article>
      <div class="rc29-history-label">RECENT RELEASES · 最近版本</div>
      ${history.map((r,i)=>`<details class="rc29-release-history" ${i===0?'open':''}>
        <summary><span class="rc29-release-version">${esc(r.version)}</span><span class="rc29-release-name">${esc(r.name)}</span></summary>
        <ul class="rc29-release-points">${r.points.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
      </details>`).join('')}`;
  }

  function openChangelog(){
    renderChangelog();
    const overlay=document.getElementById('rc29ChangelogOverlay');
    overlay.classList.remove('ui-hidden');
    document.documentElement.classList.add('rc29-changelog-open');
    overlay.querySelector('.rc29-changelog-modal')?.focus({preventScroll:true});
  }
  function closeChangelog(){
    const overlay=document.getElementById('rc29ChangelogOverlay');
    if(!overlay)return;
    overlay.classList.add('ui-hidden');
    document.documentElement.classList.remove('rc29-changelog-open');
    document.querySelector('.cover-version.rc29-version-entry')?.focus({preventScroll:true});
  }

  function decorateVersionEntry(){
    document.querySelectorAll('.cover-version').forEach(entry=>{
      if(entry.dataset.rc29Changelog==='1')return;
      entry.dataset.rc29Changelog='1';
      entry.classList.add('rc29-version-entry');
      entry.setAttribute('role','button');
      entry.setAttribute('tabindex','0');
      entry.setAttribute('aria-label','查看更新日志');
      entry.title='查看更新日志';
      entry.addEventListener('click',openChangelog);
      entry.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openChangelog();}});
    });
  }

  function syncVersion(){
    window.__OWL_RUNTIME.render.syncReleaseMeta();
    decorateVersionEntry();
  }

  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.getElementById('rc29ChangelogOverlay')?.classList.contains('ui-hidden'))closeChangelog();});

  // Late RC patches still synchronize their own old labels after some renders.
  // RC29 is the final release layer, so re-assert the version after those renders.
  ['renderSeasonSummary','renderOffseason','renderSeason','renderRegularSeasonAwards','renderCareerOverview','renderCareerHub','renderSigningComplete','setupSeason','renderCareerTeam','renderPlayoffs','renderRetirementScreen'].forEach(name=>{
    const base=globalThis[name];if(typeof base!=='function')return;
    globalThis[name]=function(){const out=base.apply(this,arguments);decorateVersionEntry();return out;};
  });

  decorateVersionEntry();
  window.__OWL_V29_CHANGELOG=Object.freeze({version:VER,release:FULL,releases,open:openChangelog,close:closeChangelog,render:renderChangelog,syncVersion});
})();

/* ===== OWL选手之路 2.0 Alpha 1 · Living World Foundation ===== */
(function(){
  'use strict';
  const VER='2.0 Alpha 1';
  const FULL='2.0 Alpha 1 · Living World Foundation';
  const SCHEMA=1;
  const MAJORS=['突进','消耗','阵地'];
  const CYCLE_LABELS={contender:'争冠窗口',playoff:'季后赛竞争',transition:'过渡调整',rebuild:'重建周期',youth:'青训周期'};
  const DNA_LIBRARY=[
    {id:'academy',name:'青训培养型',desc:'更愿意给年轻选手机会，接受短期波动换长期成长。',dev:5,star:-1,stability:2},
    {id:'star',name:'明星驱动型',desc:'围绕顶级核心建队，愿意为明星选手调整阵容与资源。',dev:0,star:5,stability:0},
    {id:'system',name:'体系建设型',desc:'优先保证战术完整性，选手需要适应体系而不是只看纸面总评。',dev:2,star:1,stability:4},
    {id:'aggressive',name:'积极补强型',desc:'争冠窗口里愿意主动交易与补强，阵容变化频率更高。',dev:0,star:3,stability:-2},
    {id:'stable',name:'稳定经营型',desc:'更重视熟人阵容、长期合同与持续磨合。',dev:1,star:0,stability:5}
  ];
  const MANAGEMENT=['长期培养','积极补强','稳定续约','短期争冠','灵活交易'];
  const COACH_HANDLES=['Atlas','Nova','Orbit','Pulse','Vector','Horizon','Mosaic','Rift','Frost','Comet','Forge','Tempo','Echo','Axiom','Prism','Pivot'];
  const COACH_STYLE={tactical:'体系派',adjustment:'临场派',development:'培养派',rotation:'轮换派'};
  const THEME_META={
    rookie:{name:'新秀赛季',icon:'🌱',desc:'第一年先证明自己能在职业联赛站稳脚跟。'},
    contender:{name:'争冠之年',icon:'👑',desc:'战队已经进入争冠窗口，常规赛不是终点，真正的压力来自季后赛。'},
    defend:{name:'卫冕之年',icon:'🏆',desc:'冠军已经拿过一次，现在所有人都在等着看你们还能不能再来一次。'},
    dynasty:{name:'王朝保卫战',icon:'🔥',desc:'连续的冠军让这支战队从强队变成时代标签，任何失利都会被放大。'},
    rebuild:{name:'重建之年',icon:'🏗️',desc:'阵容年轻、目标现实，成长和找到未来核心比短期成绩更重要。'},
    newcoach:{name:'新教练时代',icon:'🎧',desc:'新教练正在重塑用人和战术习惯，旧地位需要重新证明。'},
    newteam:{name:'新环境适应',icon:'🧳',desc:'换队后的第一年，熟悉队友与体系比纸面实力更重要。'},
    lastdance:{name:'最后一舞',icon:'🌇',desc:'职业生涯已经来到后段，每一个赛季都可能成为最后一次争冠窗口。'},
    prove:{name:'证明之年',icon:'🎯',desc:'位置并不稳固，这一年要把“能打”变成“必须让你打”。'},
    cohesion:{name:'磨合之年',icon:'🤝',desc:'阵容没有明显短板，但真正的上限取决于能不能把五个人打成一个整体。'}
  };

  function clamp20(n,a,b){return Math.max(a,Math.min(b,n));}
  function esc20(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function hash20(text){let h=2166136261>>>0;for(const c of String(text??'')){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
  function unit20(text){return (hash20(`${seed20()}|${text}`)%100000)/100000;}
  function int20(text,min,max){return min+(hash20(`${seed20()}|${text}`)%Math.max(1,max-min+1));}
  function signed20(text,range=1){return (unit20(text)*2-1)*range;}
  function seed20(){return String(state?.careerSeed||careerState?.careerSeed||state?.playerName||'owl-career');}
  function y20(){return Number(careerState?.seasonYear||2019);}
  function tkey20(team){return String(team?.short||team?.name||'TEAM');}
  function activeTeams20(){try{return typeof v50ActiveTeams==='function'?v50ActiveTeams():TEAMS.filter(t=>t.active!==false);}catch(_){return (globalThis.TEAMS||[]).filter(t=>t.active!==false);}}
  function team20(nameOrShort){return activeTeams20().find(t=>t.short===nameOrShort||t.name===nameOrShort)||globalThis.TEAMS?.find(t=>t.short===nameOrShort||t.name===nameOrShort)||null;}
  function teamPower20(team){try{return Number(typeof careerLikeTeamPower==='function'?careerLikeTeamPower(team):team?.strength||80)||80;}catch(_){return Number(team?.strength||80)||80;}}
  function clone20(v){return JSON.parse(JSON.stringify(v));}

  function root20(){
    if(!careerState.v20World||typeof careerState.v20World!=='object')careerState.v20World={schema:SCHEMA,dna:{},teamSeasons:{},coaches:{},relations:{},seasonThemes:{},matchReasons:[],announced:{},lastTeam:null};
    const r=careerState.v20World;r.schema=SCHEMA;r.dna=r.dna||{};r.teamSeasons=r.teamSeasons||{};r.coaches=r.coaches||{};r.relations=r.relations||{};r.seasonThemes=r.seasonThemes||{};r.matchReasons=r.matchReasons||[];r.announced=r.announced||{};return r;
  }

  function dna20(team){
    const r=root20(),key=tkey20(team);if(r.dna[key])return r.dna[key];
    const base=DNA_LIBRARY[hash20(`${key}|dna`)%DNA_LIBRARY.length],management=MANAGEMENT[hash20(`${key}|mgmt`)%MANAGEMENT.length];
    return r.dna[key]={...base,management,createdAt:y20()};
  }
  function cycle20(team,year){
    const teams=activeTeams20(),powers=teams.map(x=>teamPower20(x)).sort((a,b)=>b-a),p=teamPower20(team),rank=Math.max(1,powers.findIndex(x=>x<=p)+1),pct=rank/Math.max(1,powers.length),dna=dna20(team);
    if(team?.name===careerState?.team?.name){
      const prev=(careerState.careerArchive||[]).find(x=>Number(x.year)===Number(year)-1&&x.team===team.name);
      if(prev){const res=String(prev.result||'');if(res.includes('总冠军'))return'contender';if(/亚军|四强|季后赛/.test(res)&&!res.includes('未进'))return pct<=.55?'contender':'playoff';if(/未进|无缘/.test(res))return dna.id==='academy'?'youth':'rebuild';}
    }
    if(pct<=.24)return'contender';if(pct<=.52)return'playoff';if(pct>=.80)return dna.id==='academy'?'youth':'rebuild';return'transition';
  }
  function coach20(team,year,serial=0,preferred=null){
    const key=tkey20(team),handle=COACH_HANDLES[hash20(`${key}|coach|${year}|${serial}`)%COACH_HANDLES.length];
    const stats={tactical:int20(`${key}|${year}|${serial}|tac`,72,92),adjustment:int20(`${key}|${year}|${serial}|adj`,70,94),development:int20(`${key}|${year}|${serial}|dev`,69,93),rotation:int20(`${key}|${year}|${serial}|rot`,68,91)};
    const best=Object.entries(stats).sort((a,b)=>b[1]-a[1])[0][0],id=`${key}-${year}-${serial}-${handle}`;
    const obj={id,handle,displayName:Number(year)<=2023?'当季教练组':`主教练 · ${handle}`,style:COACH_STYLE[best],preferredTactic:preferred||MAJORS[hash20(`${key}|${year}|coach-major`)%MAJORS.length],...stats,startYear:Number(year),serial};
    root20().coaches[id]=obj;return obj;
  }
  function tacticalProfile20(team,year){
    try{return window.__OWL_V24_TACTICAL_IDENTITY?.profileFor?.(team,year,null)||null;}catch(_){return null;}
  }
  function ensureTeamSeason20(team,year=y20()){
    if(!team)return null;const r=root20(),yr=String(year),key=tkey20(team);r.teamSeasons[yr]=r.teamSeasons[yr]||{};if(r.teamSeasons[yr][key])return r.teamSeasons[yr][key];
    const dna=dna20(team),cycle=cycle20(team,year),tactical=tacticalProfile20(team,year),preferred=tactical?.primary?.major||MAJORS[hash20(`${key}|${year}|major`)%3];
    const prev=Number(year)>2019?ensureTeamSeason20(team,Number(year)-1):null;
    let coach=prev?.coachId?root20().coaches[prev.coachId]:null,changed=false;
    if(!coach){coach=coach20(team,year,0,preferred);changed=true;}
    else{
      const historicalBridge=Number(year)>=2024&&coach?.displayName==='当季教练组';
      const chance=.10+(prev?.cycle==='rebuild' ? .10 : 0)+(prev?.cycle==='transition' ? .04 : 0)+(dna.id==='aggressive' ? .035 : 0),roll=unit20(`${key}|${year}|coach-change`);
      if(historicalBridge||roll<chance){coach=coach20(team,year,Number(coach.serial||0)+1,preferred);changed=true;}
    }
    const management=dna.management,rosterStability=clamp20(Math.round(70+dna.stability*3+signed20(`${key}|${year}|stability`,9)),45,94);
    const profile={year:Number(year),team:key,teamName:team.name,dnaId:dna.id,dnaName:dna.name,management,cycle,cycleLabel:CYCLE_LABELS[cycle],coachId:coach.id,coachChanged:changed&&!!prev,rosterStability,tactical};
    r.teamSeasons[yr][key]=profile;return profile;
  }
  function ensureWorldYear20(year=y20()){activeTeams20().forEach(t=>ensureTeamSeason20(t,year));return root20().teamSeasons[String(year)]||{};}
  function coachFor20(team,year=y20()){const p=ensureTeamSeason20(team,year);return p?root20().coaches[p.coachId]:null;}

  function userOvr20(){try{const v=getMyOvr();return Number(v==='--'?78:v)||78;}catch(_){return 78;}}
  function rolePromise20(){return careerState?.contract?.rolePromise||careerState?.userLineupStatus?.label||careerState?.userLineupStatus?.role||'首发竞争';}
  function roster20(){return [...(careerState.starters||[]),...(careerState.bench||[])].filter(Boolean);}
  function relationBucket20(team=careerState.team){const r=root20(),k=tkey20(team);r.relations[k]=r.relations[k]||{};return r.relations[k];}
  function relationLabel20(x){if(x.roleCompetition)return'位置竞争';if(Number(x.seasonsTogether)>=3&&Number(x.chemistry)>=84)return'黄金搭档';if(Number(x.chemistry)>=78)return'默契很好';if(Number(x.chemistry)>=66)return'磨合顺畅';if(Number(x.chemistry)>=52)return'普通队友';return'仍在磨合';}
  function syncRelations20(year=y20()){
    if(!careerState.team)return{};const bucket=relationBucket20(),members=roster20().filter(p=>!p.isUser&&p.name);const names=new Set();
    for(const p of members){
      names.add(p.name);let x=bucket[p.name];const roleCompetition=p.role===state.role&&Math.abs(Number(p.overall||p.ovr||78)-userOvr20())<=8;
      if(!x)x=bucket[p.name]={name:p.name,role:p.role,bond:clamp20(Math.round(Number(careerState.teammateBond||55)+signed20(`${tkey20(careerState.team)}|${p.name}|bond`,13)),28,90),chemistry:60,seasonsTogether:0,lastSeasonProcessed:null,lastSeenYear:year,roleCompetition:false};
      if(Number(x.lastSeasonProcessed)!==Number(year)){x.seasonsTogether=Number(x.seasonsTogether||0)+1;x.bond=clamp20(Number(x.bond||55)+(x.seasonsTogether>1?1.4:0),20,98);x.lastSeasonProcessed=Number(year);}
      const synergy=Number(p.attrs?.synergy||p.attrs?.awareness||76),tenure=Math.min(8,Math.max(0,Number(x.seasonsTogether||1)-1)*2.2);x.role=p.role;x.lastSeenYear=Number(year);x.roleCompetition=!!roleCompetition;x.chemistry=clamp20(Math.round(Number(x.bond||55)*.62+synergy*.30+tenure),20,99);x.label=relationLabel20(x);
    }
    return bucket;
  }
  function relationSummary20(){
    const b=syncRelations20(),rows=Object.values(b).filter(x=>Number(x.lastSeenYear)===y20()),avg=rows.length?rows.reduce((s,x)=>s+Number(x.chemistry||60),0)/rows.length:Number(careerState.teammateBond||55);const top=[...rows].sort((a,b)=>b.chemistry-a.chemistry)[0]||null,competition=[...rows].filter(x=>x.roleCompetition).sort((a,b)=>b.chemistry-a.chemistry)[0]||null;
    return{avg:Math.round(avg),rows,top,competition,label:avg>=82?'高度默契':avg>=72?'配合成熟':avg>=62?'正常磨合':'仍需磨合'};
  }
  function updateRelations20(won,rating){
    const b=syncRelations20(),starters=new Set((careerState.starters||[]).filter(p=>!p.isUser).map(p=>p.name));
    Object.values(b).forEach(x=>{if(Number(x.lastSeenYear)!==y20())return;const active=starters.has(x.name),delta=(won ? .35 : -.12)+(Number(rating)>=8 ? .35 : Number(rating)<6 ? -.22 : 0)+(active ? .15 : .03);x.bond=clamp20(Number(x.bond||55)+delta,20,99);if(x.roleCompetition&&Number(rating)>=8.2)x.bond=clamp20(x.bond-.12,20,99);x.chemistry=clamp20(Number(x.chemistry||60)+delta*.65,20,99);x.label=relationLabel20(x);});
  }

  function previousTeam20(){const a=careerState.careerArchive||[];return a.length?a[a.length-1]?.team:null;}
  function consecutiveTitles20(){const a=(careerState.careerArchive||[]).slice().reverse();let n=0;for(const r of a){if(String(r.result||'').includes('总冠军'))n++;else break;}return n;}
  function ensureTheme20(year=y20()){
    const r=root20(),key=String(year);if(r.seasonThemes[key])return r.seasonThemes[key];const p=ensureTeamSeason20(careerState.team,year),titles=consecutiveTitles20(),prevTeam=previousTeam20(),promise=rolePromise20();let id='cohesion';
    if(Number(careerState.careerYears||1)<=1)id='rookie';
    else if(Number(careerState.age||20)>=29)id='lastdance';
    else if(prevTeam&&careerState.team?.name&&prevTeam!==careerState.team.name)id='newteam';
    else if(p?.coachChanged)id='newcoach';
    else if(titles>=2)id='dynasty';
    else if(titles===1)id='defend';
    else if(p?.cycle==='contender')id='contender';
    else if(p?.cycle==='rebuild'||p?.cycle==='youth')id='rebuild';
    else if(/竞争|轮换/.test(String(promise)))id='prove';
    const meta=THEME_META[id]||THEME_META.cohesion;return r.seasonThemes[key]={id,year:Number(year),name:meta.name,icon:meta.icon,desc:meta.desc,beats:[],startedTeam:careerState.team?.name||'',startedCoach:p?.coachId||null,final:null};
  }
  function addBeat20(key,text,tone='neutral'){
    const theme=ensureTheme20(),full=`${y20()}|${key}`;if(theme.beats.some(x=>x.key===full))return;theme.beats.push({key:full,match:Number(seasonState.played||0),text,tone});theme.beats=theme.beats.slice(-8);
  }
  function progressTheme20(){
    if(!seasonState?.active)return;const played=Number(seasonState.played||0),total=Number(seasonState.total||0),wr=played?Number(seasonState.wins||0)/played:0;
    if(played>=Math.min(7,total)&&total)addBeat20('first-check',wr>=.68?'开局走势强势，争冠预期正在升温。':wr<=.40?'开局不顺，教练组开始承受调整压力。':'开局表现基本符合赛季预期。',wr>=.68?'good':wr<=.40?'bad':'neutral');
    if(played>=Math.ceil(total/2)&&total)addBeat20('half',wr>=.70?'半程之后，战队已经进入联盟第一集团。':wr<=.45?'赛季过半仍未找到稳定节奏，位置与战术都可能继续变化。':'半程战绩稳定，真正的考验会在后半段和季后赛。',wr>=.70?'good':wr<=.45?'bad':'neutral');
    if(played>=total&&total)addBeat20('regular-end',`常规赛以 ${seasonState.wins}-${seasonState.losses} 收官，胜率 ${(wr*100).toFixed(1)}%。`,wr>=.62?'good':wr<.45?'bad':'neutral');
  }

  function beats20(a,b){return a==='突进'&&b==='消耗'||a==='消耗'&&b==='阵地'||a==='阵地'&&b==='突进';}
  function currentTactic20(team,year){try{if(team?.name===careerState.team?.name)return window.__OWL_V24_TACTICAL_IDENTITY?.ensureCurrentProfile?.()||careerState.tacticProfile;return tacticalProfile20(team,year);}catch(_){return null;}}
  function aiChem20(team,year){const p=ensureTeamSeason20(team,year),dna=dna20(team);return clamp20(Math.round(68+Number(p?.rosterStability||70)*.12+dna.stability*1.2+signed20(`${tkey20(team)}|${year}|chem`,4)),58,88);}
  function worldMatchContext20(opponent,venue='home'){
    const year=y20(),ourTeam=careerState.team,our=ensureTeamSeason20(ourTeam,year),opp=ensureTeamSeason20(opponent,year),ourCoach=coachFor20(ourTeam,year),oppCoach=coachFor20(opponent,year),rel=relationSummary20(),ourTac=currentTactic20(ourTeam,year),oppTac=currentTactic20(opponent,year);
    const a=ourTac?.primary?.major||careerState.tactic||'消耗',b=oppTac?.primary?.major||'消耗';let tactic=beats20(a,b)?1:beats20(b,a)?-1:0;
    let hero=80;try{hero=Number(window.__OWL_V24_TACTICAL_IDENTITY?.heroAffinity?.(ourTac?.primary||{major:a,styleId:'',traits:[]},year)?.score||80);}catch(_){hero=80;}
    const coachEdge=((Number(ourCoach?.adjustment||80)+Number(ourCoach?.tactical||80))-(Number(oppCoach?.adjustment||80)+Number(oppCoach?.tactical||80)))/2;
    const oppChem=aiChem20(opponent,year),chemEdge=rel.avg-oppChem,theme=ensureTheme20(year);let delta=coachEdge*.00065+chemEdge*.00055+tactic*.012+(hero-80)*.0005+(venue==='home' ? .003 : -.003);
    if(theme.id==='newcoach')delta-=.003;if(theme.id==='dynasty'||theme.id==='defend')delta+=.002;delta=clamp20(delta,-.045,.045);
    return{year,matchNo:Number(seasonState.played||0)+1,opponent:opponent?.name||'对手',venue,delta,baseTactic:a,oppTactic:b,tacticEdge:tactic,heroFit:hero,coachEdge,chemistry:rel.avg,oppChem,condition:Number(careerState.condition||75),ourCoach:ourCoach?.displayName||'教练组',oppCoach:oppCoach?.displayName||'对方教练组',theme:theme.name};
  }
  function factorRows20(ctx){
    const rows=[];if(ctx.tacticEdge)rows.push({key:'tactic',label:'体系对位',value:ctx.tacticEdge>0?1:-1,text:ctx.tacticEdge>0?`${ctx.baseTactic} 对 ${ctx.oppTactic} 占到战术先手`:`${ctx.baseTactic} 被 ${ctx.oppTactic} 的对位牵制`});
    const c=ctx.coachEdge/10;if(Math.abs(c)>=.25)rows.push({key:'coach',label:'教练临场',value:c,text:c>0?`${ctx.ourCoach} 的临场准备更占优`:`对方教练组的临场准备更充分`});
    const ch=(ctx.chemistry-ctx.oppChem)/10;if(Math.abs(ch)>=.25)rows.push({key:'chem',label:'队内默契',value:ch,text:ch>0?`队内默契 ${ctx.chemistry}，高于对手估算 ${ctx.oppChem}`:`当前磨合 ${ctx.chemistry}，低于对手估算 ${ctx.oppChem}`});
    const h=(ctx.heroFit-80)/8;if(Math.abs(h)>=.2)rows.push({key:'hero',label:'英雄池',value:h,text:h>0?`你的英雄池对主体系契合度 ${ctx.heroFit}`:`你的英雄池对当前体系契合只有 ${ctx.heroFit}`});
    const st=(ctx.condition-75)/12;if(Math.abs(st)>=.25)rows.push({key:'state',label:'竞技状态',value:st,text:st>0?`你以 ${Math.round(ctx.condition)} 的高状态进入比赛`:`当前状态 ${Math.round(ctx.condition)} 限制了发挥`});
    rows.push({key:'venue',label:'场地',value:ctx.venue==='home' ? .25 : -.25,text:ctx.venue==='home'?'主场带来轻微稳定性优势':'客场环境略微增加执行难度'});return rows;
  }
  function recordReason20(won,rating,ctx){
    if(!ctx)return null;const rows=factorRows20(ctx);const predicted=.5+ctx.delta;if((won&&predicted<.49)||(!won&&predicted>.51))rows.push({key:'variance',label:'临场波动',value:won?1.2:-1.2,text:won?'临场发挥超过赛前模型预期':'临场发挥没有兑现赛前优势'});
    rows.sort((a,b)=>Math.abs(b.value)-Math.abs(a.value));const rec={year:ctx.year,matchNo:ctx.matchNo,opponent:ctx.opponent,won:!!won,rating:Number(rating||0),venue:ctx.venue,delta:Number(ctx.delta.toFixed(4)),factors:rows.slice(0,4),headline:won?'为什么赢':'为什么输'};const r=root20();r.matchReasons.push(rec);r.matchReasons=r.matchReasons.slice(-30);r.lastMatchReason=rec;return rec;
  }

  function detailedPowerBonus20(team,tactic,isPlayerSide){
    if(!team||!activeTeams20().some(t=>t.name===team.name||t.short===team.short))return{total:0,parts:{}};const year=y20(),p=ensureTeamSeason20(team,year),coach=coachFor20(team,year),tp=currentTactic20(team,year),majorPrimary=tp?.primary?.major,majorSecondary=tp?.secondary?.major,chem=isPlayerSide?relationSummary20().avg:aiChem20(team,year),coachB=((Number(coach?.tactical||80)+Number(coach?.adjustment||80))/2-80)*.045,chemB=(chem-72)*.035,identity=tactic===majorPrimary ? .85 : tactic===majorSecondary ? .35 : -.15;let heroB=0;
    if(isPlayerSide){try{const h=window.__OWL_V24_TACTICAL_IDENTITY?.heroAffinity?.(tp?.primary,year);heroB=(Number(h?.score||80)-80)*.028;}catch(_){}}
    return{total:clamp20(coachB+chemB+identity+heroB,-2.4,2.4),parts:{coach:coachB,chemistry:chemB,identity,hero:heroB,coachName:coach?.displayName||'教练组',chemistryValue:chem,primary:majorPrimary,secondary:majorSecondary}};
  }
  function detailedExplain20(result,calls){
    if(!calls?.length)return null;const home=calls.find(x=>x.side==='home'),away=calls.find(x=>x.side==='away');if(!home||!away)return null;const win=result?.winner==='home',diff=(home.worldBonus||0)-(away.worldBonus||0),rows=[];
    if(Math.abs(diff)>=.25)rows.push({label:'职业世界修正',value:diff,text:diff>0?'教练、默契与体系身份整体更有利于我方':'对手在教练、磨合与体系执行上占到优势'});
    const hp=home.parts||{},ap=away.parts||{};if(Math.abs((hp.coach||0)-(ap.coach||0))>=.2)rows.push({label:'教练对位',value:(hp.coach||0)-(ap.coach||0),text:(hp.coach||0)>(ap.coach||0)?`${hp.coachName} 的临场画像更适合本图`:'对方教练的临场准备更加有效'});
    if(Math.abs((hp.chemistry||0)-(ap.chemistry||0))>=.2)rows.push({label:'阵容磨合',value:(hp.chemistry||0)-(ap.chemistry||0),text:(hp.chemistry||0)>(ap.chemistry||0)?`我方默契 ${hp.chemistryValue} 帮助执行更稳定`:`对方的整体磨合更成熟`});
    if((hp.identity||0)>=.8)rows.push({label:'体系执行',value:hp.identity,text:`本图使用了战队主体系「${matchState.currentTactics?.home||hp.primary||'—'}」`});
    rows.sort((a,b)=>Math.abs(b.value)-Math.abs(a.value));return{winner:result?.winner,map:currentMatchMap()?.name||'当前地图',homeTactic:matchState.currentTactics?.home||'—',awayTactic:matchState.currentTactics?.away||'—',rows:rows.slice(0,3),won:win};
  }

  function teamWorldMarkup20(team=careerState.team,year=y20(),includeRelations=true){
    const p=ensureTeamSeason20(team,year),dna=dna20(team),coach=coachFor20(team,year),theme=team?.name===careerState.team?.name?ensureTheme20(year):null,rel=includeRelations&&team?.name===careerState.team?.name?relationSummary20():null;
    const relRows=rel?.rows?.slice().sort((a,b)=>b.chemistry-a.chemistry).slice(0,6)||[];
    return `<div class="v20-world-grid">
      <section class="v20-world-card"><div class="v20-world-kicker">CLUB DNA · 俱乐部画像</div><h3>${esc20(dna.name)}</h3><p>${esc20(dna.desc)}</p><div class="v20-world-tags"><span>${esc20(p.cycleLabel)}</span><span>${esc20(p.management)}</span><span>阵容稳定 ${p.rosterStability}</span></div></section>
      <section class="v20-world-card"><div class="v20-world-kicker">HEAD COACH · 教练</div><h3>${esc20(coach.displayName)}</h3><p>${esc20(coach.style)} · 偏好 ${esc20(coach.preferredTactic)} · ${coach.startYear} 年起</p><div class="v20-coach-stats"><span>战术<strong>${coach.tactical}</strong></span><span>临场<strong>${coach.adjustment}</strong></span><span>培养<strong>${coach.development}</strong></span><span>轮换<strong>${coach.rotation}</strong></span></div></section>
      ${theme?`<section class="v20-world-card v20-theme-card"><div class="v20-world-kicker">SEASON STORY · 赛季主题</div><h3>${theme.icon} ${esc20(theme.name)}</h3><p>${esc20(theme.desc)}</p>${theme.beats.length?`<div class="v20-story-beats">${theme.beats.slice(-3).map(b=>`<div class="${b.tone}"><b>${b.match?`G${b.match}`:'开季'}</b><span>${esc20(b.text)}</span></div>`).join('')}</div>`:''}</section>`:''}
      <section class="v20-world-card"><div class="v20-world-kicker">TEAM ECOSYSTEM · 队内生态</div>${rel?`<div class="v20-chem-summary"><strong>${rel.avg}</strong><div><b>${esc20(rel.label)}</b><span>${rel.top?`最默契：${esc20(rel.top.name)} · ${esc20(rel.top.label)}`:'阵容正在建立关系'}</span></div></div><div class="v20-rel-list">${relRows.map(x=>`<div class="${x.roleCompetition?'competition':''}"><span>${esc20(x.name)}<small>${esc20(x.role||'')}</small></span><b>${x.chemistry}</b><em>${esc20(x.label)}</em></div>`).join('')}</div>`:`<p>签约后，队友关系与搭档默契会随共同出场逐步形成。</p>`}</section>
    </div>`;
  }

  function ensureWorldModal20(){
    let o=document.getElementById('v20WorldOverlay');if(o)return o;o=document.createElement('div');o.id='v20WorldOverlay';o.className='v20-world-overlay ui-hidden';o.innerHTML=`<section class="v20-world-modal"><header><div><div class="v20-world-kicker">OWL 2.0 · LIVING WORLD</div><h2 id="v20WorldTitle">职业世界</h2><p id="v20WorldSub">战队、教练与队内生态</p></div><button type="button" id="v20WorldClose" aria-label="关闭">×</button></header><div class="v20-world-body" id="v20WorldBody"></div></section>`;document.body.appendChild(o);o.addEventListener('click',e=>{if(e.target===o)closeWorld20();});o.querySelector('#v20WorldClose').addEventListener('click',closeWorld20);return o;
  }
  function openWorld20(team=careerState.team,year=y20()){
    const o=ensureWorldModal20();o.querySelector('#v20WorldTitle').textContent=team?.name||'职业世界';o.querySelector('#v20WorldSub').textContent=`${year} · ${ensureTeamSeason20(team,year)?.cycleLabel||'战队画像'} · ${coachFor20(team,year)?.displayName||'教练组'}`;o.querySelector('#v20WorldBody').innerHTML=teamWorldMarkup20(team,year,true);o.classList.remove('ui-hidden');document.documentElement.classList.add('v20-world-open');
  }
  function closeWorld20(){document.getElementById('v20WorldOverlay')?.classList.add('ui-hidden');document.documentElement.classList.remove('v20-world-open');}

  function decorateSeason20(){
    if(!careerState.team)return;ensureWorldYear20();syncRelations20();const theme=ensureTheme20(),p=ensureTeamSeason20(careerState.team),coach=coachFor20(careerState.team),rel=relationSummary20();
    const id=document.querySelector('#seasonScreen .rc27-season-identity')||document.querySelector('#seasonScreen .season-score-top');if(id){id.parentElement?.querySelector(':scope > .v20-world-strip')?.remove();const box=document.createElement('div');box.className='v20-world-strip';box.innerHTML=`<div><span>赛季主题</span><strong>${theme.icon} ${esc20(theme.name)}</strong></div><div><span>主教练</span><strong>${esc20(coach.displayName)}</strong><small>${esc20(coach.style)}</small></div><div><span>建队周期</span><strong>${esc20(p.cycleLabel)}</strong><small>${esc20(dna20(careerState.team).name)}</small></div><div><span>队内默契</span><strong>${rel.avg}</strong><small>${esc20(rel.label)}</small></div><button type="button" class="v20-world-open-btn">查看职业世界 →</button>`;id.insertAdjacentElement('afterend',box);box.querySelector('button').addEventListener('click',()=>openWorld20());}
    const note=document.getElementById('seasonSimNote'),last=root20().lastMatchReason;if(note){note.parentElement?.querySelector(':scope > .v20-match-reason')?.remove();if(last&&Number(last.year)===y20()){const card=document.createElement('div');card.className=`v20-match-reason ${last.won?'win':'loss'}`;card.innerHTML=`<div class="v20-reason-head"><div><span>WHY ${last.won?'WE WIN':'WE LOST'} · 比赛解释</span><strong>${last.headline} · vs ${esc20(last.opponent)}</strong></div><em>个人 ${last.rating.toFixed(1)} 分</em></div><div class="v20-reason-factors">${last.factors.slice(0,3).map(f=>`<div class="${f.value>=0?'good':'bad'}"><b>${esc20(f.label)}</b><span>${esc20(f.text)}</span></div>`).join('')}</div>`;note.insertAdjacentElement('afterend',card);}}
  }
  function decorateCareerTeam20(){
    if(!careerState.team)return;const card=document.getElementById('careerTeamCard')||document.querySelector('#careerTeamScreen .contract-card');if(!card)return;card.querySelector('.v20-team-world-preview')?.remove();const p=ensureTeamSeason20(careerState.team),c=coachFor20(careerState.team),dna=dna20(careerState.team),el=document.createElement('div');el.className='v20-team-world-preview';el.innerHTML=`<div><span>俱乐部 DNA</span><strong>${esc20(dna.name)}</strong></div><div><span>建队周期</span><strong>${esc20(p.cycleLabel)}</strong></div><div><span>教练</span><strong>${esc20(c.displayName)}</strong><small>${esc20(c.style)}</small></div><button type="button">查看职业世界 →</button>`;(card.querySelector('.team-summary-grid')||card).insertAdjacentElement('afterend',el);el.querySelector('button').addEventListener('click',()=>openWorld20());
  }
  function decorateMarket20(wrap){
    if(!wrap)return;(offseasonState?.offers||[]).forEach(o=>{if(!o?.team)return;const shell=wrap.querySelector(`[data-offer-id="${CSS.escape(o.id)}"]`)?.closest('.offer-card-shell')||wrap.querySelector(`[data-offer-id="${CSS.escape(o.id)}"]`)?.closest('.v21-offer-card-shell'),body=shell?.querySelector('.v19-offer-details-body');if(!body)return;body.querySelector('.v20-offer-world')?.remove();const year=y20()+1,p=ensureTeamSeason20(o.team,year),dna=dna20(o.team),coach=coachFor20(o.team,year),box=document.createElement('div');box.className='v20-offer-world';box.innerHTML=`<div><span>俱乐部 DNA</span><b>${esc20(dna.name)}</b></div><div><span>建队周期</span><b>${esc20(p.cycleLabel)}</b></div><div><span>教练画像</span><b>${esc20(coach.style)} · ${esc20(coach.preferredTactic)}</b></div>`;body.insertAdjacentElement('afterbegin',box);});
  }
  function decorateSummary20(){
    const app=document.querySelector('#summaryScreen .summary-app');if(!app||!careerState.team)return;app.querySelector('.v20-summary-story')?.remove();const theme=ensureTheme20(),box=document.createElement('section');box.className='summary-card v20-summary-story';const beats=theme.beats||[];box.innerHTML=`<div class="v20-world-kicker">SEASON STORY · ${theme.year}</div><h3>${theme.icon} ${esc20(theme.name)}</h3><p>${esc20(theme.desc)}</p>${beats.length?`<div class="v20-story-beats">${beats.slice(-4).map(b=>`<div class="${b.tone}"><b>${b.match?`G${b.match}`:'节点'}</b><span>${esc20(b.text)}</span></div>`).join('')}</div>`:''}`;app.querySelector('.summary-bottom-actions')?.insertAdjacentElement('beforebegin',box);
  }
  function decorateDetailedMatch20(){
    const app=document.querySelector('#matchScreen .match-app');if(!app)return;app.querySelector('.v20-detailed-reason')?.remove();const result=(matchState.results||[]).slice(-1)[0],ex=result?.v20Explanation;if(!ex)return;const box=document.createElement('section');box.className='v20-detailed-reason';box.innerHTML=`<div class="v20-reason-head"><div><span>MATCH SIMULATION 2.0 · 比赛解释</span><strong>${esc20(ex.map)} · ${esc20(ex.homeTactic)} vs ${esc20(ex.awayTactic)}</strong></div><em>${result.winner==='home'?'我方赢图':'对手赢图'}</em></div><div class="v20-reason-factors">${(ex.rows||[]).map(f=>`<div class="${f.value>=0?'good':'bad'}"><b>${esc20(f.label)}</b><span>${esc20(f.text)}</span></div>`).join('')}</div>`;app.querySelector('.versus-board')?.insertAdjacentElement('afterend',box);
  }

  function announceWorld20(){
    const r=root20(),year=y20(),p=ensureTeamSeason20(careerState.team,year),key=`${year}|${tkey20(careerState.team)}|world`;if(r.announced[key])return;r.announced[key]=1;
    if(p?.coachChanged&&seasonState?.eventHistory)seasonState.eventHistory.push({id:`v20-coach-${year}`,icon:'🎧',title:'新教练上任',choice:p.coachId,summary:`${coachFor20(careerState.team,year)?.displayName||'新教练'} 接手战队，战术偏好为 ${coachFor20(careerState.team,year)?.preferredTactic||'—'}。`,afterMatch:0});
  }

  // ===== Simulation integration =====
  // 2.0 直接通过基础模拟器暴露的 hook 进入核心计算，避免旧闭包绕开职业世界修正。
  function adjustRegularChance20(baseChance,meta={}){
    const idx=Number(meta.index??seasonState?.played??0),opp=meta.opponent||seasonState?.opponents?.[idx]||null;if(!opp||!careerState.team)return Number(baseChance);
    const ctx=worldMatchContext20(opp,meta.venue||(typeof regularVenueAt==='function'?regularVenueAt(idx):'home'));ctx.rawChance=Number(baseChance);ctx.matchNo=idx+1;ctx.finalChance=clamp20(Number(baseChance)+ctx.delta,.24,.88);root20().pendingMatch=ctx;return ctx.finalChance;
  }
  function chooseTacticHook20(raw,meta={}){
    const roster=meta.roster;let team=null;if(roster===matchState?.homeRoster)team=matchState.homeTeam;else if(roster===matchState?.awayRoster)team=matchState.awayTeam;if(!team||!activeTeams20().some(t=>t.name===team.name||t.short===team.short))return raw;
    const tp=currentTactic20(team,y20()),p=tp?.primary?.major,s=tp?.secondary?.major;if(raw===p||raw===s)return raw;return Math.random()<.72?(p||raw):(s||raw);
  }
  function adjustTeamMapPower20(base,meta={}){
    if(!base||typeof base.power!=='number')return base;const team=meta.isHome?matchState?.homeTeam:matchState?.awayTeam,isPlayer=team?.name===careerState.team?.name,b=detailedPowerBonus20(team,meta.tactic,isPlayer);
    if(meta.isHome)matchState.v20PowerCalls=[];matchState.v20PowerCalls=matchState.v20PowerCalls||[];matchState.v20PowerCalls.push({side:meta.isHome?'home':'away',worldBonus:b.total,parts:b.parts,tactic:meta.tactic,team:team?.name||''});
    return{...base,power:Number(base.power)+b.total};
  }
  function annotateDetailedMap20(result){
    if(!result)return result;const calls=matchState?.v20PowerCalls||[];if(!calls.some(x=>Math.abs(Number(x?.worldBonus||0))>.001))return result;const ex=detailedExplain20(result,calls);if(ex&&ex.rows?.length){result.v20Explanation=ex;root20().lastDetailedMap=clone20(ex);}return result;
  }
  function afterManualRegularMatch20(meta={}){
    const idx=Number(meta.index??Math.max(0,Number(seasonState?.played||1)-1)),opp=meta.opponent||seasonState?.opponents?.[idx]||null;if(!opp)return;const r=root20(),existing=r.lastMatchReason;if(existing&&Number(existing.year)===y20()&&Number(existing.matchNo)===idx+1)return;
    const maps=(matchState?.results||[]).map(x=>x?.v20Explanation).filter(Boolean),ctx=worldMatchContext20(opp,typeof regularVenueAt==='function'?regularVenueAt(idx):'home');ctx.matchNo=idx+1;ctx.detailedMaps=maps.length;
    const rec=recordReason20(!!meta.won,Number(meta.rating||0),ctx);if(rec&&maps.length){const all=maps.flatMap(x=>x.rows||[]);all.sort((a,b)=>Math.abs(Number(b.value||0))-Math.abs(Number(a.value||0)));const extra=all[0];if(extra&&!rec.factors.some(f=>f.label===extra.label))rec.factors.unshift({key:'map-detail',label:extra.label,value:Number(extra.value||0),text:extra.text});rec.factors=rec.factors.slice(0,4);}
  }
  if(typeof updateCareerAfterMatch==='function'){
    const base=updateCareerAfterMatch;updateCareerAfterMatch=function(won,rating){const pending=root20().pendingMatch?clone20(root20().pendingMatch):null;const out=base.apply(this,arguments);updateRelations20(!!won,Number(rating||0));progressTheme20();if(pending){recordReason20(!!won,Number(rating||0),pending);root20().pendingMatch=null;}return out;};
  }

  // ===== Lifecycle hooks =====
  if(typeof setupSeason==='function'){
    const base=setupSeason;setupSeason=function(){const out=base.apply(this,arguments);ensureWorldYear20(y20());syncRelations20();ensureTheme20();announceWorld20();progressTheme20();decorateSeason20();syncVersion20();return out;};
  }
  if(typeof renderSeason==='function'){
    const base=renderSeason;renderSeason=function(){const out=base.apply(this,arguments);progressTheme20();decorateSeason20();syncVersion20();return out;};
  }
  if(typeof renderCareerTeam==='function'){
    const base=renderCareerTeam;renderCareerTeam=function(){const out=base.apply(this,arguments);ensureWorldYear20(y20());decorateCareerTeam20();syncVersion20();return out;};
  }
  if(typeof renderContractMarket==='function'){
    const base=renderContractMarket;renderContractMarket=function(wrap){const out=base.apply(this,arguments);decorateMarket20(wrap);syncVersion20();return out;};
  }
  if(typeof renderSeasonSummary==='function'){
    const base=renderSeasonSummary;renderSeasonSummary=function(){const out=base.apply(this,arguments);progressTheme20();decorateSummary20();syncVersion20();return out;};
  }
  if(typeof recordCompletedCareerSeason==='function'){
    const base=recordCompletedCareerSeason;recordCompletedCareerSeason=function(){progressTheme20();const theme=ensureTheme20();theme.final={wins:Number(seasonState.wins||0),losses:Number(seasonState.losses||0),result:String(playoffState?.champion?careerState.team?.name===playoffState.champion?'总冠军':'季后赛':'赛季结束')};const out=base.apply(this,arguments);return out;};
  }
  if(typeof resetBuildOnly==='function'){
    const base=resetBuildOnly;resetBuildOnly=function(){const out=base.apply(this,arguments);if(careerState)delete careerState.v20World;closeWorld20();return out;};
  }

  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.getElementById('v20WorldOverlay')?.classList.contains('ui-hidden'))closeWorld20();});

  function syncChangelog20(){
    const api=window.__OWL_V29_CHANGELOG,arr=api?.releases;if(!Array.isArray(arr)||arr.some(x=>x.version==='2.0 Alpha 1'))return;arr.forEach(x=>x.current=false);arr.unshift({version:'2.0 Alpha 1',name:'职业世界',release:FULL,current:true,points:['战队获得俱乐部 DNA、管理策略、建队周期和可持续的教练画像。','队友关系细化为逐人默契、黄金搭档与位置竞争，并随共同比赛变化。','比赛模拟开始纳入教练、队内默契、主副体系与英雄池契合，并生成“为什么赢 / 为什么输”。','每个赛季生成争冠、重建、卫冕、新教练时代等赛季主题，并记录赛季故事节点。']});
  }
  function syncVersion20(){
    window.__OWL_RUNTIME.render.syncReleaseMeta();syncChangelog20();
  }
  ['renderOffseason','renderCareerOverview','renderCareerHub','renderRegularSeasonAwards','renderPlayoffs','renderRetirementScreen','renderSigningComplete'].forEach(name=>{const base=globalThis[name];if(typeof base!=='function')return;globalThis[name]=function(){const out=base.apply(this,arguments);syncVersion20();return out;};});

  // 首次打开主入口时只安装 UI 与版本层；职业世界等玩家创建生涯、careerSeed 就绪后再生成。
  ensureWorldModal20();syncVersion20();
  window.__OWL_V20_ALPHA1=Object.freeze({
    version:VER,release:FULL,schema:SCHEMA,root:()=>root20(),dnaFor:team=>clone20(dna20(team)),teamSeason:(team,year)=>clone20(ensureTeamSeason20(team,year)),coachFor:(team,year)=>clone20(coachFor20(team,year)),theme:()=>clone20(ensureTheme20()),relations:()=>clone20(relationSummary20()),worldYear:(year)=>clone20(ensureWorldYear20(year)),matchContext:(opponent,venue)=>clone20(worldMatchContext20(opponent,venue)),openWorld:openWorld20,closeWorld:closeWorld20,decorateSeason:decorateSeason20,progressTheme:progressTheme20,syncVersion:syncVersion20,
    adjustRegularChance:adjustRegularChance20,chooseTactic:chooseTacticHook20,adjustTeamMapPower:adjustTeamMapPower20,annotateDetailedMap:annotateDetailedMap20,afterManualRegularMatch:afterManualRegularMatch20,decorateDetailedMatch:decorateDetailedMatch20
  });
})();
