
/* ===== V7.7.0 QA HARDENING · Single season state truth ===== */
(function(){
  const QA_VERSION='7.7.0';
  function year(){return Number(careerState.seasonYear||2019)}
  function isOwl2(){return year()>=2024}
  function primary(){return document.getElementById('v768SeasonPrimaryAction')}
  function clearPrematureSeasonComplete(){
    if(!isOwl2() || Number(seasonState.played||0)>=Number(seasonState.total||56))return;
    // Legacy renderers still contain 28-game completion rules. Before 56/56 those cards are invalid,
    // even during the short All-Star hand-off at 37/56.
    document.querySelectorAll('#seasonScreen .season-complete-banner').forEach(n=>n.remove());
    const p=primary();
    if(p && !p.querySelector('.stage-break-card,.season-complete-banner'))p.classList.remove('show');
  }
  function clearStrayMilestones(){
    const p=primary(); if(!p)return;
    const all=[...document.querySelectorAll('#seasonScreen .stage-break-card,#seasonScreen .season-complete-banner')];
    all.forEach(n=>{ if(!p.contains(n)) n.remove(); });
  }
  function normalizeOwl2StageMilestone(){
    if(!isOwl2() || !seasonState.stageBreakPending)return;
    const s=Number(seasonState.stageBreakPending)||1,p=primary();
    const card=p?.querySelector('.stage-break-card');if(!card)return;
    const owner=seasonState.majorSlotOwner||null;
    const slots=owner==='East'?{East:5,West:3}:owner==='West'?{East:3,West:5}:{East:4,West:4};
    const copy=card.querySelector('p');
    if(copy)copy.textContent=`本Stage独立排名决定Major资格。当前Champion Slot：东部${slots.East}席 / 西部${slots.West}席；Major冠军会替自己的赛区拿到下一届额外席位。`;
    const btn=card.querySelector('#resolveStageBreakBtn');
    if(btn)btn.textContent=(stageQualified(s)?`模拟 Major ${s} →`:`结算 Major ${s} →`);
  }
  const _render=renderSeason;
  renderSeason=function(){
    _render();
    clearPrematureSeasonComplete();
    clearStrayMilestones();
    normalizeOwl2StageMilestone();
  };
  // Harden Major 1/3 continuation too: the result node is rebuilt several times by compatibility renderers.
  document.addEventListener('click',function(e){
    const btn=e.target.closest?.('#v767ContinueMajorBtn');
    if(!btn)return;
    e.preventDefault();e.stopImmediatePropagation();
    seasonState.v71LastMajorSummary=null;
    renderSeason();
  },true);
  window.__OWL_V770_QA=()=>{
    const ids=[...document.querySelectorAll('[id]')].reduce((m,n)=>(m[n.id]=(m[n.id]||0)+1,m),{});
    const duplicates=Object.entries(ids).filter(([,n])=>n>1).map(([id,n])=>({id,n}));
    const p=primary();
    const milestones=[...document.querySelectorAll('#seasonScreen .stage-break-card,#seasonScreen .season-complete-banner')];
    return {version:QA_VERSION,year:year(),played:Number(seasonState.played||0),total:Number(seasonState.total||0),
      duplicateIds:duplicates, milestoneCount:milestones.length,outsidePrimary:milestones.filter(n=>!p?.contains(n)).length,
      prematureFinal:isOwl2()&&Number(seasonState.played||0)<Number(seasonState.total||56)&&!!document.querySelector('#seasonScreen .season-complete-banner'),
      legacy2019Copy:isOwl2()&&/2019规则|大西洋 \/ 太平洋|Atlantic \/ Pacific/.test(p?.innerText||''),
      primaryText:p?.innerText?.trim().slice(0,220)||''};
  };
  try{clearPrematureSeasonComplete();clearStrayMilestones();normalizeOwl2StageMilestone();}catch(_e){}
})();
