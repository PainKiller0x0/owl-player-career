/* OWL Alpha1 Batch 2 · market tag placement, season copy and layout stability */
(() => {
  'use strict';

  function owl92RelocateMarketTags(root=document){
    root.querySelectorAll?.('.offer-card .v20-market-angle').forEach(tag=>{
      const card=tag.closest('.offer-card'),team=card?.querySelector('.offer-team');
      if(card&&team&&tag.parentElement===card)team.insertAdjacentElement('afterend',tag);
      tag.classList.add('owl92-market-angle-static');
    });
  }

  function owl92UpdateSeasonCopy(){
    const dots=document.getElementById('seasonDots'),groups=[...(dots?.querySelectorAll('.stage-dot-group')||[])];
    if(typeof stageRecord==='function')groups.forEach((group,index)=>{
      const rec=stageRecord(index+1),stat=group.querySelector('.stage-dot-head span,.stage-dot-head small');
      if(rec&&stat)stat.textContent=`${Number(rec.wins||0)}胜 ${Number(rec.losses||0)}负`;
    });
    const progress=document.getElementById('seasonProgressCopy');if(!progress)return;
    const wins=Number(seasonState?.wins||0),losses=Number(seasonState?.losses||0),stageNo=typeof v71StageNo==='function'?Number(v71StageNo()||0):typeof v762StageNo==='function'?Number(v762StageNo()||0):0,rec=stageNo&&typeof stageRecord==='function'?stageRecord(stageNo):null,strong=progress.querySelector('strong');
    if(strong)strong.textContent=rec?`${Number(rec.wins||0)}胜 ${Number(rec.losses||0)}负`:`${wins}胜 ${losses}负`;
    progress.innerHTML=progress.innerHTML.replace(/全赛季\s*\d+\s*\/\s*\d+/,`全赛季 ${wins}胜 ${losses}负`);
  }

  window.__OWL_RUNTIME?.render?.register('renderContractMarket','v92-market-tags',root=>owl92RelocateMarketTags(root||document));
  window.__OWL_RUNTIME?.render?.register('renderSeason','b2-season-copy',owl92UpdateSeasonCopy);

  if(!document.getElementById('owl92StabilityStyle')){
    const style=document.createElement('style');style.id='owl92StabilityStyle';style.textContent=`
      html{scrollbar-gutter:stable}
      .offer-card .v20-market-angle.owl92-market-angle-static{position:static;display:inline-flex;width:fit-content;max-width:100%;margin:10px 0 0;align-self:flex-start}
    `;document.head.appendChild(style);
  }
  owl92UpdateSeasonCopy();
  owl92RelocateMarketTags();
})();
