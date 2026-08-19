(function(){
  'use strict';
  const snap=x=>OWLCore.clone(x);
  OWLCore.register('state',{
    player:()=>snap(state),career:()=>snap(careerState),season:()=>snap(seasonState),playoffs:()=>snap(playoffState),offseason:()=>snap(offseasonState),settings:()=>snap(gameSettings),
    snapshot:()=>({player:snap(state),career:snap(careerState),season:snap(seasonState),playoffs:snap(playoffState),offseason:snap(offseasonState)})
  },{domain:'state',managerReady:false,stability:'stable',note:'Player Career singleton adapter; Manager mode should provide its own store.'});
})();
