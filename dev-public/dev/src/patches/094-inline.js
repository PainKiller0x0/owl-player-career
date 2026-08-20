/* OWL Alpha1 · register the final shared render metadata seam. */
(() => {
  'use strict';
  const runtime=window.__OWL_RUNTIME;
  if(!runtime?.render)return;
  const afterMeta=runtime.render.syncReleaseMeta;
  ['renderSeason','renderCareerTeam','renderContractMarket','renderSeasonSummary','renderOffseason','renderCareerOverview','renderCareerHub','renderRegularSeasonAwards','renderPlayoffs','renderRetirementScreen','renderSigningComplete'].forEach(name=>runtime.render.register(name,'release-meta',afterMeta));
  afterMeta();
})();
