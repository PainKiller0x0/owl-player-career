/* Public Beta 1.5 RC1 · Talent Pipeline / Golden Generation */
(function(){
  const VERSION='Public Beta 1.5 RC1';
  window.__OWL_TALENT_PIPELINE={
    version:VERSION,
    goldenYears:(limit=2038)=>v60GoldenClassYears(Number(limit)||2038),
    boom:(year)=>v60TalentBoomInfo(Number(year)),
    world:(year)=>v60WorldSummary(Number(year)||careerState.seasonYear||2024),
    gaps:(year)=>({academy:v60TransitionAcademyGap(Number(year)),rebirth:v60TransitionRebirthGap(Number(year))}),
    distribution:(year)=>{const s=v60EnsureWorldToYear(Math.max(2024,Number(year)||2024)),ps=Object.values(s.teams||{}).flat(),ov=ps.map(p=>Number(p.ovr)||0).sort((a,b)=>b-a),gen=ps.filter(p=>p.generated),mean=a=>a.reduce((x,y)=>x+y,0)/Math.max(1,a.length);return{year:s.year,players:ps.length,avgOvr:Number(mean(ov).toFixed(2)),top20:Number(mean(ov.slice(0,20)).toFixed(2)),n90:ov.filter(x=>x>=90).length,n93:ov.filter(x=>x>=93).length,n95:ov.filter(x=>x>=95).length,n97:ov.filter(x=>x>=97).length,generated:gen.length,generatedAvg:gen.length?Number((gen.reduce((a,p)=>a+(Number(p.ovr)||0),0)/gen.length).toFixed(2)):0};},
    percentile:(ovr,year)=>{const s=v60EnsureWorldToYear(Math.max(2024,Number(year)||2024)),ps=Object.values(s.teams||{}).flat(),x=Number(ovr)||0;return ps.length?Number((ps.filter(p=>Number(p.ovr)<=x).length/ps.length).toFixed(4)):null;},
    growth:(p,rating,nextAge,year)=>v60NextOvr({...p},Number(rating),Number(nextAge),Number(year))
  };
})();
