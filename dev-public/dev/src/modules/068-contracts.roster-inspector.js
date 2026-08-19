/* ======================================================================
   MODULE: contracts/roster_inspector.js
   Read-only roster inspection adapter for player/manager frontends.
   Uses the authoritative roster query layer; does not generate a fake team.
   ====================================================================== */
(function(){
  'use strict';
  function hash32(text){let h=2166136261>>>0;for(const c of String(text||'')){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
  function teamOf(teamOrShort){
    if(teamOrShort&&typeof teamOrShort==='object')return teamOrShort;
    return (typeof TEAMS!=='undefined'?TEAMS:[]).find(t=>t.short===teamOrShort||t.name===teamOrShort)||null;
  }
  function ageFor(name,year,meta={}){
    if(Number.isFinite(Number(meta.age)))return Number(meta.age);
    try{const age=v62RealAgeAtSeason(name,Number(year));if(Number.isFinite(Number(age)))return Number(age);}catch(_){}
    return null;
  }
  function contractBook(){
    careerState.aiContractBook=careerState.aiContractBook&&typeof careerState.aiContractBook==='object'?careerState.aiContractBook:{};
    return careerState.aiContractBook;
  }
  function contractRef(player,team,year){
    const book=contractBook(),key=String(player.id||player.name),age=Number(player.age||0),retire=!!player.retirementReady;
    let row=book[key];
    if(!row||row.teamShort!==team.short||Number(year)<Number(row.startYear)||Number(year)>Number(row.expiresYear)){
      const max=retire?1:age>=29?2:4,min=1,term=min+(hash32(`${key}|${team.short}|${year}|contract`)%(max-min+1));
      row={teamShort:team.short,startYear:Number(year),expiresYear:Number(year)+term-1,term};book[key]=row;
    }
    return{years:Math.max(1,Number(row.expiresYear)-Number(year)+1),term:Number(row.term)||1,startYear:Number(row.startYear),expiresYear:Number(row.expiresYear)};
  }
  function snapshot(teamOrShort,year){
    const team=teamOf(teamOrShort),y=Number(year||careerState.seasonYear||2019);if(!team)return{team:null,year:y,players:[]};
    let entries=[];try{entries=typeof v50RosterEntriesFor==='function'?v50RosterEntriesFor(team,y):historicalRosterEntries(team);}catch(_){try{entries=historicalRosterEntries(team)}catch(__){entries=[]}}
    const players=(entries||[]).map((e,i)=>{
      const meta=e?.[4]||{},age=ageFor(e?.[0],y,meta),retirementReady=!!meta.retirementReady;
      const base={id:meta.id||`${team.short}-${y}-${e?.[0]||i}`,name:e?.[0]||`Player ${i+1}`,role:e?.[1]||'—',ovr:Number(e?.[2]||0),country:e?.[3]||'',age,retirementAge:Number(meta.retirementAge||0)||null,retirementReady,proYears:Number(meta.proYears||0)||null};
      return{...base,contract:contractRef(base,team,y)};
    });
    const roleOrder=new Map([['坦克',0],['长枪输出',1],['弹道输出',2],['输出支援',3],['战术支援',4]]);
    players.sort((a,b)=>(roleOrder.get(a.role)??9)-(roleOrder.get(b.role)??9)||b.ovr-a.ovr||a.name.localeCompare(b.name));
    return{team:{short:team.short,name:team.name,color:team.color,logo:team.logo||''},year:y,players};
  }
  window.__OWL_ROSTER_INSPECTOR={version:'1',snapshot};
})();
