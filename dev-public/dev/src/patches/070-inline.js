/* ======================================================================
   OWL选手之路 · Public Beta 1.9 RC22 · Progressive Information UX
   - default-simple contract market; advanced logic stays expandable
   - World Cup current-task-first layout; completed history collapses
   - one-time plain-language explanations for recurring esports terms
   ====================================================================== */
(function(){
  'use strict';
  const VER='Public Beta 1.9 RC22';
  const FULL='Public Beta 1.9 RC22 · Progressive Information UX';
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function seen(){careerState.v19LearningSeen=careerState.v19LearningSeen||{};return careerState.v19LearningSeen;}
  function removeLegacyTips(root=document){
    root.querySelectorAll?.('.v800-context-tip[data-v800-tip="market"],.v800-context-tip[data-v800-tip="major"],.v800-context-tip[data-v800-tip="hero-ban"]').forEach(n=>n.remove());
  }
  function teachOnce(key,host,copy){
    if(!host||seen()[key]||host.querySelector?.(`[data-v19-teach="${key}"]`))return false;
    const node=document.createElement('div');node.className='v19-learning-tip';node.dataset.v19Teach=key;node.innerHTML=`<span>第一次遇到</span><p>${copy}</p>`;
    host.prepend(node);seen()[key]=true;return true;
  }
  function getOffer(id){return (offseasonState.offers||[]).find(o=>o.id===id)||null;}
  function offerDetailsHtml(o){
    const b=o.fitBreakdown||{},r=b.roster||{},h=o.heroMarket||{};
    const fitParts=(b.personal!=null)?`<div class="v19-detail-grid"><div><span>个人 × 体系</span><strong>${b.personal}</strong></div><div><span>职责天然</span><strong>${b.natural}</strong></div><div><span>阵容需求</span><strong>${b.rosterNeed}</strong></div></div>`:'';
    const competition=b.roster?`${r.label||'同位置竞争'}${r.count?` · 同位置 ${r.count} 人 · 最强 OVR ${r.best}`:' · 当前没有成熟同位置人选'}`:'';
    const hero=h.label?`<div class="v19-detail-line"><span>英雄池市场评价</span><strong>${esc(h.label)}</strong><small>${Number(careerState.seasonYear||0)+1>=2025?`抗Ban深度 ${h.breadth}`:`英雄池宽度 ${h.breadth}`} · 精通以上 ${h.elite} · 市场修正 ${h.premium>=0?'+':''}${h.premium}</small></div>`:'';
    return `<div class="v19-detail-line"><span>主打体系</span><strong>${esc(o.tactic||'—')}</strong></div>
      <div class="v19-detail-line"><span>邀请理由</span><strong>${esc(o.note||'综合邀请')}</strong></div>
      ${competition?`<div class="v19-detail-line"><span>位置竞争</span><strong>${esc(competition)}</strong></div>`:''}
      ${fitParts}${hero}`;
  }
  function compactMarket(wrap){
    if(!wrap)return;
    removeLegacyTips(wrap);
    const lead=wrap.querySelector('.offseason-kicker + h3 + p');
    if(lead&&offseasonState.contractExpired)lead.textContent='先看路线、队内定位、队伍实力与适配；需要时再展开细节。';
    const heroProfile=wrap.querySelector('.v772-personal-hero-market');
    if(heroProfile&&!heroProfile.classList.contains('v19-hero-profile-compact')){
      heroProfile.classList.add('v19-hero-profile-compact');
      const intro=heroProfile.children[0],stats=heroProfile.querySelector('.v772-hero-stats');
      const introNote=intro?.querySelector('small');if(introNote)introNote.classList.add('v19-advanced-original');
      if(stats){
        const d=document.createElement('details');d.className='v19-hero-profile-details';d.innerHTML='<summary>英雄池详情</summary><div class="v19-hero-profile-detail-body"></div>';
        const body=d.querySelector('.v19-hero-profile-detail-body');body.appendChild(stats);if(introNote){const n=introNote.cloneNode(true);n.classList.remove('v19-advanced-original');body.prepend(n);}
        heroProfile.appendChild(d);
      }
    }
    if(!offseasonState.contractExpired)return;
    teachOnce('market-fit',wrap,'适配度表示你和这支队伍有多契合，不是你的能力值。');
    wrap.querySelectorAll('.offer-card[data-offer-id]').forEach(card=>{
      const o=getOffer(card.dataset.offerId);if(!o)return;
      card.classList.add('v19-offer-compact');
      card.querySelector('.offer-team > div:last-child > span')?.classList.add('v19-advanced-original');
      const terms=[...card.querySelectorAll('.offer-term')];if(terms[3])terms[3].classList.add('v19-advanced-original');
      card.querySelectorAll('.offer-fit-breakdown,.offer-fit-explain,.v20-market-tradeoff,.v75-offer-hero').forEach(n=>n.classList.add('v19-advanced-original'));
      let shell=card.closest('.offer-card-shell');
      if(!shell){shell=document.createElement('div');shell.className='offer-card-shell';card.parentNode.insertBefore(shell,card);shell.appendChild(card);}
      if(!shell.querySelector('.v19-offer-details')){
        const d=document.createElement('details');d.className='v19-offer-details';d.innerHTML=`<summary>详细信息</summary><div class="v19-offer-details-body">${offerDetailsHtml(o)}</div>`;
        const roster=shell.querySelector('.offer-roster-btn');if(roster)shell.insertBefore(d,roster);else shell.appendChild(d);
        d.addEventListener('click',e=>e.stopPropagation());
      }
    });
  }
  function matchLabel(m){return esc(m.roundLabel||({selection:'国家队选拔',preliminary:'预选赛',wildcard:'Wild Card',conference:'Conference Cup',qualifier:'在线资格赛',group:'世界杯小组赛',knockout:'世界杯淘汰赛'}[m.stage]||m.stage||'比赛'));}
  function keyPathHtml(matches){
    const ko=matches.filter(m=>m.stage==='knockout');const key=ko.length?ko:matches.slice(-Math.min(2,matches.length));
    if(!key.length)return'';
    return `<div class="v19-wc-key"><div class="v19-section-label">本届关键路径</div>${key.map(m=>`<div class="v19-wc-key-row ${m.won?'win':'loss'}"><div><strong>${matchLabel(m)}</strong><small>vs ${esc(window.__OWL_WORLD_CUP?.countryName?.(m.opponent)||m.opponent||'—')}</small></div><b>${esc(m.score)}</b><span>${m.won?'胜':'负'}</span></div>`).join('')}</div>`;
  }
  function compactWorldCup(){
    const body=document.getElementById('vwcBody');if(!body||!window.__OWL_WORLD_CUP)return;
    const rec=window.__OWL_WORLD_CUP.ensure?.();if(!rec)return;
    // A 7-player roster matters, but it is secondary to the current match/decision.
    body.querySelectorAll('.vwc-card').forEach(card=>{
      const h=card.querySelector(':scope > h3');if(!h||h.textContent.trim()!=='7人国家队名单'||card.classList.contains('v19-wc-roster-collapsed'))return;
      const roster=card.querySelector('.vwc-roster');if(!roster)return;
      card.classList.add('v19-wc-roster-collapsed');
      const details=document.createElement('details');details.className='v19-wc-roster-details';details.innerHTML=`<summary>7人国家队名单 · 查看</summary>`;details.appendChild(roster);h.replaceWith(details);
    });
    if(!rec.completed||!rec.selected)return;
    const card=[...body.querySelectorAll('.vwc-card')].find(x=>x.querySelector(':scope > h3')?.textContent.includes('国家队比赛记录'));
    if(!card||card.classList.contains('v19-wc-history-compact'))return;
    const list=card.querySelector('.vwc-match-list');if(!list)return;
    card.classList.add('v19-wc-history-compact');
    card.querySelector(':scope > h3').textContent='世界杯履历';
    list.insertAdjacentHTML('beforebegin',keyPathHtml(rec.matches||[]));
    const details=document.createElement('details');details.className='v19-wc-history-details';details.innerHTML=`<summary>完整国家队比赛记录 · ${(rec.matches||[]).length} 场</summary>`;
    list.parentNode.insertBefore(details,list);details.appendChild(list);
    // Events are still preserved, but long event logs should not dominate the final record.
    const heads=[...card.querySelectorAll('h3')];const eventHead=heads.find(h=>h.textContent.includes('国家队 / 舆情事件'));
    const log=card.querySelector('.vwc-log');if(eventHead&&log){const ed=document.createElement('details');ed.className='v19-wc-event-details';ed.innerHTML='<summary>国家队 / 舆情事件</summary>';eventHead.replaceWith(ed);ed.appendChild(log);}
  }
  function simplifyRuleIntro(){
    const holder=document.getElementById('seasonEventContent');if(!holder)return false;
    const title=holder.querySelector('.season-event-title')?.textContent||'',autoBtn=holder.querySelector('#v13CloseRulebook');
    const isAuto=!!autoBtn&&/知道了，开始赛季/.test(autoBtn.textContent||'');
    if(!isAuto||!/2025/.test(title)||holder.classList.contains('v19-simple-rule-intro'))return false;
    const copy=holder.querySelector('.season-event-copy');if(!copy)return false;
    holder.classList.add('v19-simple-rule-intro');
    copy.innerHTML='<div class="v19-rule-simple"><p><strong>比赛流程：</strong>选地图 → 调整阵容 → Hero Ban → 开图。</p><p><strong>Hero Ban：</strong>双方赛前禁用部分英雄，英雄池越深越不容易被针对。</p><p><strong>赛季结构：</strong>3个 Stage；每个 Stage 后有 Major，全年积分决定年度季后赛。</p></div>';
    document.querySelectorAll('[data-v19-teach="hero-ban"]').forEach(n=>n.remove());
    seen()['hero-ban']=true;return true;
  }
  function scanTermTips(){
    removeLegacyTips(document);
    const y=Number(careerState.seasonYear||0),simpleIntro=simplifyRuleIntro();
    const eventOverlay=document.getElementById('seasonEventOverlay'),introVisible=eventOverlay&&!eventOverlay.classList.contains('hidden')&&document.getElementById('seasonEventContent')?.classList.contains('v19-simple-rule-intro');
    if(y>=2025&&y<2033&&!introVisible&&!simpleIntro){const host=document.getElementById('v74HeroDevelopmentPanel')||document.querySelector('#seasonScreen .season-track-card');teachOnce('hero-ban',host,'Hero Ban：比赛前会禁用部分英雄；英雄池越深，越不容易被针对。');}
    const major=seasonState.v71LastMajorSummary;
    if(major&&major.v34Type==='ewc'){
      const host=document.querySelector('#v741SeasonInlineMilestone .v71-major-result,#seasonScreen .v71-major-result,#seasonScreen .stage-break-card');teachOnce('ewc',host,'EWC：电竞世界杯的 Overwatch 项目，在沙特中立场举行；奖金很高，但不是年度总冠军。');
    }else if(major){
      const host=document.querySelector('#v741SeasonInlineMilestone .v71-major-result,#seasonScreen .v71-major-result,#seasonScreen .stage-break-card');teachOnce('major',host,'Major：赛段杯赛，不是年度总决赛；成绩会影响全年 League Points。');
    }
    const overlay=document.getElementById('seasonEventContent');
    if(overlay&&/\bFT3\b/.test(overlay.textContent||''))teachOnce('ft3',overlay,'FT3：先赢 3 张地图的一方赢下这个系列赛。');
  }
  window.__OWL_RUNTIME?.render?.register('renderContractMarket','v19-market-compact',compactMarket);
  window.__OWL_RUNTIME?.render?.register('renderSeason','v19-term-scan',scanTermTips);
  const wcBody=document.getElementById('vwcBody');if(wcBody)new MutationObserver(()=>compactWorldCup()).observe(wcBody,{childList:true,subtree:true});
  const eventBody=document.getElementById('seasonEventContent');if(eventBody)new MutationObserver(()=>scanTermTips()).observe(eventBody,{childList:true,subtree:true});
  compactWorldCup();scanTermTips();
  window.__OWL_V19_PROGRESSIVE={version:VER,compactMarket,compactWorldCup,scanTermTips,seen:()=>({...seen()})};
})();
