/* ======================================================================
   Public Beta 1.6 RC1 · Rotation & Career UX
   - unified in-game confirm/result modal
   - DNP / appearance UX hardening
   - offseason hero-lab discoverability + skip warning
   - market self-comparison card / trade projection polish
   - red-green colorblind assistance
   - full-season render batching
   ====================================================================== */
(function(){
  const V16='Public Beta 1.6 RC1';

  // -------------------------------------------------------------------
  // Unified in-game modal. Product-facing flows should not leak browser
  // alert()/confirm() chrome into the simulation.
  // -------------------------------------------------------------------
  function ensureModal(){
    let overlay=document.getElementById('v16GameModal');
    if(overlay)return overlay;
    overlay=document.createElement('div');overlay.id='v16GameModal';overlay.className='v800-overlay ui-hidden v16-game-overlay';overlay.setAttribute('aria-modal','true');overlay.setAttribute('role','dialog');
    overlay.innerHTML='<section class="v800-modal v16-game-modal" id="v16GameModalCard"></section>';
    document.body.appendChild(overlay);return overlay;
  }
  function closeModal(onClose=null){const o=ensureModal();o.classList.add('ui-hidden');if(typeof onClose==='function')onClose();}
  function openModal(opts={}){
    const overlay=ensureModal(),card=document.getElementById('v16GameModalCard');
    const icon=opts.icon||'📌',kicker=opts.kicker||'CAREER EVENT',title=opts.title||'确认操作',body=opts.body||'',confirmText=opts.confirmText||'确定',cancelText=opts.cancelText||null,tone=opts.tone||'normal';
    const cancelClass=opts.cancelPrimary?'primary-btn':'secondary-btn',confirmClass=opts.cancelPrimary?'secondary-btn':'primary-btn';
    card.className=`v800-modal v16-game-modal ${tone}`;
    card.innerHTML=`<div class="v16-modal-head"><div class="v16-modal-icon">${icon}</div><div><span>${kicker}</span><h2>${title}</h2></div><button class="v800-close" id="v16ModalClose" aria-label="关闭">×</button></div><div class="v16-modal-body">${body}</div><div class="v16-modal-actions">${cancelText?`<button class="${cancelClass}" id="v16ModalCancel">${cancelText}</button>`:''}<button class="${confirmClass}" id="v16ModalConfirm">${confirmText}</button></div>`;
    const cancel=()=>closeModal(opts.onCancel);
    document.getElementById('v16ModalClose').onclick=cancel;
    document.getElementById('v16ModalCancel')?.addEventListener('click',cancel);
    document.getElementById('v16ModalConfirm').onclick=()=>{closeModal();if(typeof opts.onConfirm==='function')opts.onConfirm();};
    overlay.classList.remove('ui-hidden');return overlay;
  }
  window.__OWL_V16_MODAL={
    open:openModal,
    confirm:(opts={})=>openModal({...opts,cancelText:opts.cancelText||'取消'}),
    result:(opts={})=>openModal({...opts,confirmText:opts.confirmText||'知道了',cancelText:null}),
    close:closeModal
  };

  // -------------------------------------------------------------------
  // Offseason training: make the hero lab impossible to miss, and warn if
  // the player confirms attribute points without resolving hero training.
  // -------------------------------------------------------------------
  function heroTrainingState(){
    if(Number(careerState.seasonYear||0)<2024)return null;
    const y=Number(careerState.seasonYear||2024);
    offseasonState.v800HeroTraining=offseasonState.v800HeroTraining||{year:y,selected:[],done:false,results:[]};
    if(Number(offseasonState.v800HeroTraining.year)!==y)offseasonState.v800HeroTraining={year:y,selected:[],done:false,results:[]};
    return offseasonState.v800HeroTraining;
  }
  function focusHeroLab(){
    setTimeout(()=>{const hero=document.querySelector('#offseasonContent .v800-hero-training');if(!hero)return;hero.scrollIntoView({behavior:'smooth',block:'center'});try{hero.animate([{boxShadow:'0 0 0 0 rgba(255,107,61,0)'},{boxShadow:'0 0 0 3px rgba(255,107,61,.55)'},{boxShadow:'0 0 0 0 rgba(255,107,61,0)'}],{duration:900,easing:'ease-out'});}catch(e){}},60);
  }
  function polishTrainingLayout(){
    if(offseasonState.phase!=='training')return;const wrap=document.getElementById('offseasonContent');if(!wrap)return;
    const hero=wrap.querySelector('.v800-hero-training'),attrs=wrap.querySelector('.training-attr-list'),summary=wrap.querySelector('.training-summary-grid');if(hero&&summary&&hero.nextElementSibling!==summary)summary.parentNode.insertBefore(hero,summary);
    if(hero&&!hero.querySelector('.v16-hero-lab-callout')){
      const note=document.createElement('div');note.className='v16-hero-lab-callout';note.innerHTML='<strong>① 英雄专项</strong><span>选择主练 / 副练并确认。</span>';hero.prepend(note);
    }
    if(attrs&&!wrap.querySelector('.v16-attr-training-label')){const label=document.createElement('div');label.className='v16-attr-training-label';label.innerHTML='<strong>② 属性加点</strong><span>分配基础训练点。</span>';attrs.before(label);}
  }
  document.addEventListener('click',function(e){
    const btn=e.target?.closest?.('#confirmTrainingBtn');if(!btn)return;const h=heroTrainingState();if(!h||h.done)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    const selected=(h.selected||[]).length;
    window.__OWL_V16_MODAL.confirm({icon:'🎮',kicker:'OFFSEASON HERO LAB · 英雄专项',title:selected?'英雄专项还没有确认':'本休赛期还没有训练英雄',body:`<p>${selected?`已选 ${selected} 个英雄，尚未确认。`:'本休赛期尚未选择训练英雄。'}</p><p>继续将<strong>跳过本休赛期英雄专项</strong>。</p>`,confirmText:'仍然跳过并继续',cancelText:'返回训练英雄',cancelPrimary:true,tone:'warning',onCancel:focusHeroLab,onConfirm:()=>{h.done=true;h.results=[];window.__OWL_PUBLIC_BETA?.autosave?.();confirmTrainingCamp();}});
  },true);

  // -------------------------------------------------------------------
  // Market self reference: make same-role competitor numbers meaningful.
  // -------------------------------------------------------------------
  function injectMarketSelfCard(){
    if(offseasonState.phase!=='market')return;const wrap=document.getElementById('offseasonContent');if(!wrap||wrap.querySelector('.v16-market-self'))return;
    const offers=wrap.querySelector('.offers-grid');if(!offers)return;
    const ovr=Number(getMyOvr()==='--'?0:getMyOvr()),apps=seasonState.userRatings?.length||0,avg=apps?(seasonState.userRatings.reduce((a,b)=>a+b,0)/apps).toFixed(1):'未出场';
    wrap.classList.add('v16-market-host');const card=document.createElement('aside');card.className='v16-market-self';card.innerHTML=`<span>你的当前竞争基准</span><strong>OVR ${ovr||'—'}</strong><small>${state.role||'—'} · ${careerState.age||'—'}岁 · 本季评分 ${avg}</small>`;wrap.insertBefore(card,offers);
  }

  // -------------------------------------------------------------------
  // Full-season batching: inner matches update state only; DOM/Career Feed
  // is rendered once per outer batch instead of dozens of times.
  // -------------------------------------------------------------------
  const renderSeasonBase=renderSeason;
  renderSeason=function(...args){if(window.__OWL_V16_SEASON_BATCHING)return;const out=renderSeasonBase.apply(this,args);return out;};

  // Offseason wrappers are deliberately last in the patch chain.
  if(typeof renderOffseason==='function'){
    const base=renderOffseason;renderOffseason=function(...args){const out=base.apply(this,args);polishTrainingLayout();injectMarketSelfCard();return out;};
  }

  // -------------------------------------------------------------------
  // Red-green colorblind assistance. Do not rely on hue alone: season dots
  // also receive distinct shapes and ✓ / × marks.
  // -------------------------------------------------------------------
  const CB_KEY='owl_player_path_colorblind_rg_v1';
  function colorblindOn(){try{return localStorage.getItem(CB_KEY)==='1'}catch(e){return false}}
  function applyColorblind(on=colorblindOn()){
    document.documentElement.dataset.colorblind=on?'rg':'';
    const b=document.getElementById('colorblindModeToggle');if(b){b.textContent=on?'已开启':'已关闭';b.classList.toggle('active',on)}
  }
  function injectColorblindSetting(){
    if(document.getElementById('colorblindModeToggle')){applyColorblind();return}
    const body=document.querySelector('.settings-body'),appearance=document.getElementById('appearanceModeToggle')?.closest('.setting-row');if(!body)return;
    const row=document.createElement('div');row.className='setting-row';row.innerHTML='<div class="setting-copy"><strong>红绿色盲辅助</strong><span>胜负改用蓝 / 橙，并同时显示 ✓ / × 与不同形状，不再只靠红绿颜色区分。</span></div><button class="setting-switch" id="colorblindModeToggle">已关闭</button>';
    if(appearance)appearance.after(row);else body.prepend(row);
    document.getElementById('colorblindModeToggle').onclick=()=>{const on=!colorblindOn();try{localStorage.setItem(CB_KEY,on?'1':'0')}catch(e){}applyColorblind(on)};applyColorblind();
  }

  // Run after DOM and all prior patches are available.
  injectColorblindSetting();applyColorblind();
  window.__OWL_V16={version:V16,openModal,applyColorblind,polishTrainingLayout,injectMarketSelfCard};
})();
