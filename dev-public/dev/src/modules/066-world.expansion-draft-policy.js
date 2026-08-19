/* ============================================================================
   OWL Core Module · world/expansion_draft_policy.js
   Pure 2035 expansion-draft policy. No DOM or singleton world mutation.
   ========================================================================== */
(function(global){
  'use strict';
  function num(v,f=0){const n=Number(v);return Number.isFinite(n)?n:f;}
  function protectionScore(player){
    const p=player||{},ovr=num(p.ovr??p.overall,78),potential=num(p.potential,ovr),age=num(p.age,24),peak=num(p.peakRecorded,ovr);
    return ovr+(potential-ovr)*.34+(peak>=92?1.6:0)-Math.max(0,age-28)*.32+(age<=21?1.1:0);
  }
  function protectedIds(list,count=4){
    return [...(list||[])].sort((a,b)=>protectionScore(b)-protectionScore(a)||String(a?.name||'').localeCompare(String(b?.name||''))).slice(0,Math.max(0,Number(count)||0)).map(p=>p?.id||p?.name);
  }
  function draftScore(player,toShort,roleCounts={},noise=0){
    const p=player||{},ovr=num(p.ovr,78),potential=num(p.potential,ovr),age=num(p.age,24),role=String(p.role||''),missing=num(roleCounts[role],0)===0;
    const roleBonus=missing?18:-Math.max(0,num(roleCounts[role],0)-1)*5;
    let score=ovr+(potential-ovr)*.18+roleBonus+num(noise,0);
    if(toShort==='TYO')score=ovr*1.05+(potential-ovr)*.10+roleBonus+num(noise,0);
    else if(toShort==='OSA')score=ovr*.72+potential*.38-age*.32+roleBonus+num(noise,0);
    else if(toShort==='BER'){
      const style=Object.values(p.styleDelta||{}).reduce((s,v)=>s+Math.abs(num(v,0)),0);
      score=ovr*.91+(potential-ovr)*.16+Math.min(3,style*.04)+roleBonus+num(noise,0);
    }else if(toShort==='RYD')score=ovr*.92+potential*.12+roleBonus*1.08+num(noise,0);
    return score;
  }
  global.__OWL_EXPANSION_DRAFT_POLICY=Object.freeze({version:1,protectionScore,protectedIds,draftScore});
})(window);
