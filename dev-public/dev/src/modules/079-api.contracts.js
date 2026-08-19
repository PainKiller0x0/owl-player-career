(function(){
  'use strict';
  OWLCore.register('contracts',{
    current:()=>OWLCore.clone(careerState?.contract||null),
    offers:()=>OWLCore.clone(offseasonState?.offers||[]),
    generateOffers:()=>{generateContractOffers();return OWLCore.clone(offseasonState?.offers||[]);},
    applyOffer:offer=>applyTeamFromOffer(offer),
    continueCurrent:()=>continueExistingContract(),
    marketScore:offer=>typeof window.__OWL_V20_UX?.marketScore==='function'?window.__OWL_V20_UX.marketScore(offer):null,
    roster:(teamOrShort,year)=>OWLCore.clone(window.__OWL_ROSTER_INSPECTOR?.snapshot?.(teamOrShort,year)||null)
  },{domain:'contracts',managerReady:true,stability:'stable'});
})();
