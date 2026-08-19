/* ======================================================================
   OWL选手之路 · Public Beta 1.9 RC22 · Progressive Information UX
   - actual roster inspector on contract/renewal screen
   - role-training progressive unlock intro
   - player-facing terminology cleanup is handled in source modules
   ====================================================================== */
(function(){
  'use strict';
  const VER='Public Beta 1.9 RC22';
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function rosterBody(team,year){
    const snap=window.__OWL_ROSTER_INSPECTOR?.snapshot?.(team,year)||{team,year,players:[]},t=snap.team||team||{};
    const logo=t.logo?`<img src="${esc(t.logo)}" alt="">`:esc(t.short||'OWL');
    const rows=(snap.players||[]).map(p=>{
      const contract=p.contract?.years||1,status=[];
      if(p.retirementReady)status.push('<span class="v18-roster-tag retire">准备退役</span>');
      return `<div class="v18-roster-row"><strong>${esc(p.name)}</strong><span class="role">${esc(p.role)}</span><span class="ovr">${p.ovr||'—'}</span><span class="age">${p.age!=null?`${p.age}岁`:'—'}</span><span class="contract-col" title="合同期 ${p.contract?.startYear||'—'}–${p.contract?.expiresYear||'—'}">${contract===1?'赛季后到期':`剩余 ${contract} 年`}</span><div class="v18-roster-status">${status.join('')||'<span class="v18-roster-status-empty">—</span>'}</div></div>`;
    }).join('');
    return `<div class="v18-roster-head"><div class="v18-roster-logo" style="background:${esc(t.color||'#555')}">${logo}</div><div><strong>${esc(t.name||'队伍')} · ${snap.year} 阵容与合同</strong><span>签约前确认实际阵容、同位置竞争、合同稳定性与退役风险</span></div></div><div class="v18-roster-columns"><span>选手</span><span>职责</span><span>OVR</span><span>年龄</span><span>合同</span><span>状态</span></div><div class="v18-roster-list">${rows||'<div class="summary-note-empty">当前没有可读取的阵容数据。</div>'}</div><p class="v18-roster-note">合同为本存档中的动态合同记录，显示当前剩余年限；“准备退役”仅在选手已进入明确退役窗口时提示。</p>`;
  }
  function openRoster(team,year){
    if(!team)return;const body=rosterBody(team,year);
    if(window.__OWL_V16_MODAL?.open)window.__OWL_V16_MODAL.open({icon:'📄',kicker:'TEAM ROSTER · 阵容 / 合同',title:'签约前查看阵容与合同',body,confirmText:'关闭',tone:'roster'});
  }
  function injectRosterButtons(wrap){
    if(!wrap||offseasonState.phase!=='market')return;
    const nextYear=Number(careerState.seasonYear||2019)+1;
    if(!offseasonState.contractExpired&&careerState.contract?.remaining>0){
      const card=wrap.querySelector('.contract-status-card');if(card&&!card.querySelector('.offer-roster-btn')){
        const b=document.createElement('button');b.type='button';b.className='secondary-btn offer-roster-btn';b.textContent='👥 查看阵容';b.addEventListener('click',()=>openRoster(careerState.team,nextYear));
        const primary=card.querySelector('#continueExistingContractBtn');primary?.before(b);
      }
      return;
    }
    (offseasonState.offers||[]).forEach(o=>{
      const card=wrap.querySelector(`[data-offer-id="${CSS.escape(o.id)}"]`);if(!card||card.closest('.offer-card-shell'))return;
      const shell=document.createElement('div');shell.className='offer-card-shell';card.parentNode.insertBefore(shell,card);shell.appendChild(card);
      const b=document.createElement('button');b.type='button';b.className='secondary-btn offer-roster-btn';b.textContent='👥 查看阵容';b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openRoster(o.team,nextYear)});shell.appendChild(b);
    });
  }
  // Progressive role-training gate is enforced again at the final player-mode adapter layer.
  // Older compatibility modules are allowed to compute eligibility, but they may not bypass the first-career lock.
  const baseSetupOffseason=setupOffseason;
  setupOffseason=function(){const out=baseSetupOffseason.apply(this,arguments);if(!isRoleTrainingUnlocked())offseasonState.roleOpportunity=false;return out;};
  const baseRolePlanning=renderRolePlanning;
  renderRolePlanning=function(wrap){
    const out=baseRolePlanning.apply(this,arguments);
    if(!hasSeenRoleTrainingIntro()){
      markRoleTrainingIntroSeen();
      setTimeout(()=>window.__OWL_V16_MODAL?.result?.({icon:'🔄',kicker:'NEW CAREER SYSTEM · 位置训练',title:'已解锁位置训练',body:'<p>从第二段职业生涯开始，休赛期可能收到教练的转位置方案。</p><p>你可以正式转位、保留原位兼练，或者拒绝转位。选择会影响之后的阵容竞争与合同市场。</p>',confirmText:'了解，查看方案'}),30);
    }
    return out;
  };

  const baseMarket=renderContractMarket;
  renderContractMarket=function(wrap){const out=baseMarket.apply(this,arguments);injectRosterButtons(wrap);return out;};
  window.__OWL_V18_FEEDBACK={version:VER,openRoster,roster:(team,year)=>window.__OWL_ROSTER_INSPECTOR?.snapshot?.(team,year),injectRosterButtons};
})();
