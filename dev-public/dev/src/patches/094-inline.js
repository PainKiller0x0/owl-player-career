/* OWL Alpha1 · register the final shared render metadata seam. */
(() => {
  'use strict';
  const runtime=window.__OWL_RUNTIME;
  if(!runtime?.render)return;
  window.__OWL_CONFIRM=(opts={})=>{
    if(typeof window.__OWL_V16_MODAL?.confirm!=='function')return false;
    window.__OWL_V16_MODAL.confirm({...opts,cancelText:opts.cancelText||'取消'});return true;
  };
  const afterMeta=runtime.render.syncReleaseMeta;
  ['renderSeason','renderCareerTeam','renderContractMarket','renderSeasonSummary','renderOffseason','renderCareerOverview','renderCareerHub','renderRegularSeasonAwards','renderPlayoffs','renderRetirementScreen','renderSigningComplete'].forEach(name=>runtime.render.register(name,'release-meta',afterMeta));
  afterMeta();
})();
