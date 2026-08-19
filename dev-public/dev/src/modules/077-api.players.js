(function(){
  'use strict';
  OWLCore.register('players',{
    roleOverall:(attrs,role)=>typeof v35RoleCompositeOvr==='function'?v35RoleCompositeOvr(attrs,role):0,
    currentOverall:()=>Number(getMyOvr()==='--'?0:getMyOvr()),
    roleFit:role=>typeof calculateRoleFit==='function'?calculateRoleFit(role):0,
    trainingCost:value=>typeof trainingPointCost==='function'?trainingPointCost(value):null,
    heroPool:year=>OWLCore.clone(window.__OWL_V800_HERO_IO?.pool?.(year)||[]),
    potentialFactor:age=>window.__OWL_POTENTIAL?.factor?.(age)??1
  },{domain:'players',managerReady:true,stability:'stable'});
})();
