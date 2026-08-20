/* ======================================================================
   OWL选手之路 · Public Beta 1.9 RC22 · Progressive Information UX
   2035 expansion draft: make the AI league world obey the same real
   protection / one-player-per-old-team / five-picks-per-expansion-team rules.
   ====================================================================== */
(function(){
  const VER='Public Beta 1.9 RC22';
  const DRAFT_POLICY=window.__OWL_EXPANSION_DRAFT_POLICY;
  if(!DRAFT_POLICY)throw new Error('Missing expansion draft policy module');
  const DRAFT_YEAR=window.__OWL_FUTURE_RULES_CONFIG?.expansionYear||2035;
  const NEW_SHORTS=(window.__OWL_FUTURE_RULES_CONFIG?.expansionTeams||[]).map(x=>x.short);
  const roleName35=()=>String(state?.role||'长枪输出');
  let applying35=false;

  function teamByShort35(short){return TEAMS.find(t=>t.short===short)||null;}
  function playerTeamShort35(st=careerState.v34ExpansionDraft||{}){
    if(st.playerTeamShort)return st.playerTeamShort;
    if(st.fromShort)return st.fromShort;
    if(st.from){const t=TEAMS.find(x=>x.name===st.from);if(t)return t.short;}
    if(st.status!=='selected'&&careerState.team&&!careerState.team.expansion)return careerState.team.short;
    return null;
  }
  function protectValue35(p){return DRAFT_POLICY.protectionScore(p);}
  function protectedIds35(list,count=4){return DRAFT_POLICY.protectedIds(list,count);}
  function pickNoise35(p,toShort){
    try{return v60Signed(`expansion-2035-${toShort}-${p?.id||p?.name}`,.65);}catch(_){return 0;}
  }
  function draftScore35(p,toShort,roleCounts){return DRAFT_POLICY.draftScore(p,toShort,roleCounts,pickNoise35(p,toShort));}
  function recalcSnapshot35(snap){
    if(!snap)return;
    snap.teamStrength=snap.teamStrength||{};
    Object.entries(snap.teams||{}).forEach(([short,list])=>{try{snap.teamStrength[short]=v60CalcTeamStrength(list||[]);}catch(_){}});
    if(Number(careerState.seasonYear||0)===DRAFT_YEAR){
      TEAMS.forEach(t=>{if(!t.expansion&&snap.teamStrength?.[t.short]!=null)t.strength=snap.teamStrength[t.short];});
    }
  }
  function fillRosters35(snap){
    if(!snap)return;
    snap.news=snap.news||{retirements:[],rookies:[],gainers:[],decliners:[]};
    try{v60EnsureRosterMinimums(snap.teams,DRAFT_YEAR,snap.news);}catch(_){
      NEW_SHORTS.forEach(short=>{snap.teams[short]=snap.teams[short]||[];});
    }
  }
  function applyRecordedPicks35(snap,world){
    if(!snap||!world)return world;
    NEW_SHORTS.forEach(short=>{snap.teams[short]=snap.teams[short]||[];});
    const moved=new Set();
    (world.picks||[]).filter(x=>!x.isUser).forEach(rec=>{
      let found=null,from=null;
      for(const [short,list] of Object.entries(snap.teams||{})){
        const idx=(list||[]).findIndex(p=>(rec.playerId&&p.id===rec.playerId)||p.name===rec.name);
        if(idx>=0){found=list[idx];from=short;list.splice(idx,1);break;}
      }
      if(!found||moved.has(found.id||found.name))return;
      found.teamShort=rec.toShort;found.expansionDrafted=true;found.expansionFromShort=rec.fromShort;found.expansionYear=DRAFT_YEAR;
      snap.teams[rec.toShort]=snap.teams[rec.toShort]||[];snap.teams[rec.toShort].push(found);moved.add(found.id||found.name);
    });
    fillRosters35(snap);recalcSnapshot35(snap);snap.v35ExpansionWorldApplied=true;
    snap.news=snap.news||{};snap.news.expansionDraft=(world.picks||[]).map(x=>({...x}));
    try{V60_AI_WORLD.newsByYear[DRAFT_YEAR]=snap.news;}catch(_){}
    return world;
  }
  function computeWorldDraft35(snap,st){
    const oldTeams=TEAMS.filter(t=>t.active!==false&&!t.expansion&&(snap.teams?.[t.short]||[]).length).slice();
    const pTeam=playerTeamShort35(st),playerSelected=st.status==='selected',selectedTo=playerSelected?(TEAMS.find(t=>t.name===st.to)?.short||st.toShort||null):null;
    const protections={},candidates={};
    oldTeams.forEach(team=>{
      const list=snap.teams[team.short]||[],protectCount=(st.status==='protected'&&team.short===pTeam)?3:4,ids=protectedIds35(list,protectCount),set=new Set(ids);
      protections[team.short]=ids.slice();candidates[team.short]=list.filter(p=>!set.has(p.id||p.name));
    });
    const world={year:DRAFT_YEAR,version:1,resolved:true,playerStatus:st.status||'unknown',playerTeamShort:pTeam,protections,picks:[],teams:{},createdAtSeason:Number(careerState.seasonYear||DRAFT_YEAR)};
    NEW_SHORTS.forEach(s=>world.teams[s]={short:s,picks:[],build:teamByShort35(s)?.build||''});
    const roleCounts={};NEW_SHORTS.forEach(s=>roleCounts[s]={});
    if(playerSelected&&selectedTo&&world.teams[selectedTo]){
      const u={isUser:true,name:getPlayerName(),playerId:'career-player',role:roleName35(),fromShort:pTeam,toShort:selectedTo,round:0,ovr:Number(getMyOvr()==='--'?78:getMyOvr())};
      world.picks.push(u);world.teams[selectedTo].picks.push(u);roleCounts[selectedTo][u.role]=1;
    }
    const usedSources=new Set(playerSelected&&pTeam?[pTeam]:[]);
    const targetCount=s=>world.teams[s].picks.length;
    let round=1,guard=0;
    while(NEW_SHORTS.some(s=>targetCount(s)<5)&&guard++<40){
      const order=round%2?NEW_SHORTS:[...NEW_SHORTS].reverse();
      for(const toShort of order){
        if(targetCount(toShort)>=5)continue;
        let best=null;
        oldTeams.forEach(src=>{
          if(usedSources.has(src.short))return;
          (candidates[src.short]||[]).forEach(p=>{
            const score=draftScore35(p,toShort,roleCounts[toShort]);
            if(!best||score>best.score)best={src,p,score};
          });
        });
        if(!best)continue;
        const srcList=snap.teams[best.src.short]||[],idx=srcList.findIndex(p=>p===best.p||p.id===best.p.id);
        if(idx>=0)srcList.splice(idx,1);
        const p=best.p;p.teamShort=toShort;p.expansionDrafted=true;p.expansionFromShort=best.src.short;p.expansionYear=DRAFT_YEAR;
        snap.teams[toShort]=snap.teams[toShort]||[];snap.teams[toShort].push(p);usedSources.add(best.src.short);
        roleCounts[toShort][p.role]=(roleCounts[toShort][p.role]||0)+1;
        const rec={isUser:false,name:p.name,playerId:p.id,role:p.role,fromShort:best.src.short,toShort,round,ovr:Number(p.ovr||0),potential:Number(p.potential||p.ovr||0),age:Number(p.age||0)};
        world.picks.push(rec);world.teams[toShort].picks.push(rec);
      }
      round++;
    }
    world.sourceLosses={};world.picks.forEach(x=>{if(x.fromShort)world.sourceLosses[x.fromShort]=(world.sourceLosses[x.fromShort]||0)+1;});
    world.valid=world.picks.length===20&&NEW_SHORTS.every(s=>world.teams[s].picks.length===5)&&Object.values(world.sourceLosses).every(n=>n<=1);
    return world;
  }

  const _ensureWorld35=v60EnsureWorldToYear;
  function ensureAiExpansionDraft35(force=false){
    const st=careerState.v34ExpansionDraft||{};
    if(!force&&!st.resolved)return null;
    if(applying35)return careerState.v35AiExpansionDraft||null;
    applying35=true;
    try{
      window.__OWL_V34_FUTURE?.ensureExpansionTeams?.(DRAFT_YEAR);
      const snap=_ensureWorld35(DRAFT_YEAR);
      let world=careerState.v35AiExpansionDraft;
      if(world?.resolved&&Array.isArray(world.picks)&&world.picks.length){
        if(!snap.v35ExpansionWorldApplied)applyRecordedPicks35(snap,world);
        return world;
      }
      // Fresh RC16 draft: expansion clubs start from the protected-player pool, not generated placeholder rosters.
      NEW_SHORTS.forEach(short=>{snap.teams[short]=[];});
      world=computeWorldDraft35(snap,st);careerState.v35AiExpansionDraft=world;
      fillRosters35(snap);recalcSnapshot35(snap);snap.v35ExpansionWorldApplied=true;
      snap.news=snap.news||{};snap.news.expansionDraft=world.picks.map(x=>({...x}));
      try{V60_AI_WORLD.newsByYear[DRAFT_YEAR]=snap.news;}catch(_){}
      return world;
    }finally{applying35=false;}
  }
  v60EnsureWorldToYear=function(year){
    const y=Number(year)||DRAFT_YEAR,st=careerState.v34ExpansionDraft||{};
    if(y>=DRAFT_YEAR&&st.resolved&&!applying35){
      ensureAiExpansionDraft35();
    }
    return _ensureWorld35(y);
  };

  function onPlayerResolved35(st,ctx={}){
    if(st&&ctx.beforeTeamShort){st.playerTeamShort=st.playerTeamShort||ctx.beforeTeamShort;if(st.status==='selected')st.fromShort=st.fromShort||ctx.beforeTeamShort;}
    return ensureAiExpansionDraft35(true);
  }

  // RC15 saves may already be in/after 2035 with the player-side draft resolved. Rebuild the deterministic AI world on first roster/world query.
  const _rosterEntries35=v50RosterEntriesFor;
  v50RosterEntriesFor=function(team,year=careerState.seasonYear||2019){
    if(Number(year)>=DRAFT_YEAR&&(careerState.v34ExpansionDraft||{}).resolved)ensureAiExpansionDraft35();
    return _rosterEntries35.apply(this,arguments);
  };

  function worldSummary35(){
    const w=ensureAiExpansionDraft35();if(!w)return null;
    const byTeam={};NEW_SHORTS.forEach(s=>byTeam[s]=(w.teams?.[s]?.picks||[]).map(x=>({name:x.name,role:x.role,fromShort:x.fromShort,isUser:!!x.isUser,ovr:x.ovr})));
    return{year:w.year,valid:!!w.valid,totalPicks:w.picks.length,aiPicks:w.picks.filter(x=>!x.isUser).length,userPicks:w.picks.filter(x=>x.isUser).length,sourceTeams:Object.keys(w.sourceLosses||{}).length,maxLoss:Math.max(0,...Object.values(w.sourceLosses||{})),byTeam};
  }
  function roster35(short,year=DRAFT_YEAR){const s=v60EnsureWorldToYear(Number(year));return (s?.teams?.[short]||[]).map(p=>({id:p.id,name:p.name,role:p.role,ovr:p.ovr,potential:p.potential,age:p.age,teamShort:p.teamShort,expansionDrafted:!!p.expansionDrafted,from:p.expansionFromShort}));}
  window.__OWL_V35_EXPANSION_WORLD={version:VER,ensure:ensureAiExpansionDraft35,onPlayerResolved:onPlayerResolved35,summary:worldSummary35,roster:roster35,state:()=>careerState.v35AiExpansionDraft||null};

})();
