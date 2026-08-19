(function(){
  'use strict';
  OWLCore.register('career',{
    archive:()=>OWLCore.clone(careerState?.careerArchive||[]),
    memories:()=>OWLCore.clone(careerState?.careerMemories||[]),
    totals:()=>typeof getCareerTotals==='function'?OWLCore.clone(getCareerTotals()):null,
    honors:()=>typeof getHonorCounts==='function'?OWLCore.clone(getHonorCounts()):{},
    team:()=>OWLCore.clone(careerState?.team||null),
    identity:()=>({name:typeof getPlayerName==='function'?getPlayerName():'Rookie',role:state?.role,age:careerState?.age,ovr:Number(getMyOvr()==='--'?0:getMyOvr())})
  },{domain:'career',managerReady:false,stability:'stable'});
})();
