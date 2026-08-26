/* ============================================================================
   OWL Core Module · league/future_rules_config.js
   Pure future-league rules/configuration. No DOM, no career-state mutation.
   Designed for reuse by both Player Career and a future OWL Manager mode.
   ========================================================================== */
(function(global){
  'use strict';
  const EXPANSION_YEAR=2035;
  const EXPANSION_TEAMS=Object.freeze([
    Object.freeze({name:'东京弧光',englishName:'Tokyo Arclight',short:'TYO',city:'东京',division:'Atlantic',conference:'East',strength:77,color:'linear-gradient(135deg,#ef476f,#191a24)',expansion:true,country:'JP',build:'即战力优先'}),
    Object.freeze({name:'大阪风暴',englishName:'Osaka Tempest',short:'OSA',city:'大阪',division:'Atlantic',conference:'East',strength:75,color:'linear-gradient(135deg,#21a0a0,#15232d)',expansion:true,country:'JP',build:'年轻核心'}),
    Object.freeze({name:'柏林先锋',englishName:'Berlin Vanguard',short:'BER',city:'柏林',division:'Pacific',conference:'West',strength:77,color:'linear-gradient(135deg,#f2b134,#20242b)',expansion:true,country:'DE',build:'体系优先'}),
    Object.freeze({name:'利雅得日蚀',englishName:'Riyadh Eclipse',short:'RYD',city:'利雅得',division:'Pacific',conference:'West',strength:76,color:'linear-gradient(135deg,#0f8b57,#18221d)',expansion:true,country:'SA',build:'均衡建队'})
  ]);
  const RULE_YEARS=Object.freeze([2027,2030,2033,2035,2038,2040]);
  const ROLE_STAR_QUOTAS=Object.freeze({
    default:Object.freeze({tank:4,damage:4,support:4}),
    2020:Object.freeze({tank:4,damage:5,support:4})
  });

  function seasonFormat(year){
    const y=Number(year)||2024;
    if(y>=2040)return {teams:24,total:46,lens:[15,15,16],global:true,homeAway:true,summary:'24 支队伍 · 全球统一排名 · 完整主客场双循环'};
    if(y===2038)return {teams:24,total:46,lens:[15,15,16],global:false,homeAway:true,summary:'24 支队伍 · 主客场元年 · 每个对手 1主1客'};
    if(y>=2035)return {teams:24,total:68,lens:[23,22,23],global:false,homeAway:y>=2038,summary:'24 支队伍 · 同部4回合 / 跨部2回合'};
    return {teams:20,total:56,lens:[19,18,19],global:false,homeAway:false,summary:'20 支队伍 · 同部4回合 / 跨部2回合'};
  }
  function postseason(year){
    const y=Number(year)||2024;
    if(y>=2035)return {directSeeds:[1,2,3,4,5,6],qualifierSeeds:[7,8,9,10,11,12,13,14],qualifier:'Wild Card',finalField:8,format:'doubleElimination',seriesTarget:3};
    if(y>=2027)return {directSeeds:[1,2,3,4,5,6],qualifierSeeds:[7,8,9,10],qualifier:'Play-in',finalField:8,format:'doubleElimination',seriesTarget:3};
    return {directSeeds:[1,2,3,4,5,6,7,8],qualifierSeeds:[],qualifier:null,finalField:8,format:'doubleElimination',seriesTarget:3};
  }
  function stageBounds(stage,year){
    const lens=seasonFormat(year).lens,s=Math.max(1,Math.min(3,Number(stage)||1));
    const start=s===1?0:s===2?lens[0]:lens[0]+lens[1];
    return [start,start+lens[s-1]];
  }
  function specialEvents(year){
    const y=Number(year)||2024;
    return {
      ewc:y>=2030?{enabled:true,replacesStagePlayoff:3,venue:'Saudi Arabia',neutral:true,prizeTier:'premium'}:null,
      shortContracts:y>=2033,
      expansion:y===2035,
      homeAway:y>=2038,
      globalTable:y>=2040,
      allStar:true
    };
  }
  function roleStarQuotas(year){return ROLE_STAR_QUOTAS[Number(year)]||ROLE_STAR_QUOTAS.default;}
  const api=Object.freeze({version:1,expansionYear:EXPANSION_YEAR,expansionTeams:EXPANSION_TEAMS,ruleYears:RULE_YEARS,seasonFormat,postseason,stageBounds,specialEvents,roleStarQuotas});
  global.__OWL_FUTURE_RULES_CONFIG=api;
})(window);
