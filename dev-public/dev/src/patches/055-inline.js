/* ======================================================================
   Public Beta 1.9 RC5 · Career Pacing & Event Variety
   P1 UX: fewer ordinary event interruptions, theme variety, fresher Career Feed
   ====================================================================== */
(function(){
  const V19='Public Beta 1.9 RC5';

  // -------------------------------------------------------------------
  // A. Ordinary season events are seasoning, not the main course.
  // 28-ish match seasons: 2~4 ordinary events.
  // 34+ match seasons:     3~5 ordinary events.
  // Veteran / very long careers trend one event lower.
  // Keep at least 4~5 matches between scheduled ordinary events.
  // Forced story beats / injuries / trades / World Cup nodes are separate.
  // -------------------------------------------------------------------
  generateSeasonEventSchedule=function(){
    const total=Math.max(12,Number(seasonState.total||28));
    const age=Number(careerState.age||22),years=Number(careerState.careerYears||1);
    let base=total>=34?4:total>=24?3:2;
    if(age>=27||years>=8)base-=1;
    const minCount=total>=34?3:2,maxCount=total>=34?5:4;
    const count=clamp(base+rand(-1,1),minCount,maxCount);
    const first=2,last=Math.max(first,total-2),minGap=total>=34?5:4;
    const candidates=shuffle(Array.from({length:Math.max(1,last-first+1)},(_,i)=>i+first));
    const selected=[];
    for(const round of candidates){
      if(selected.every(x=>Math.abs(x-round)>=minGap))selected.push(round);
      if(selected.length>=count)break;
    }
    // Very short / unlucky schedules can fail the preferred gap. Relax once,
    // but never go back to the old every-other-match interruption pattern.
    if(selected.length<count){
      for(const round of candidates){
        if(selected.includes(round))continue;
        if(selected.every(x=>Math.abs(x-round)>=3))selected.push(round);
        if(selected.length>=count)break;
      }
    }
    return selected.sort((a,b)=>a-b);
  };

  // -------------------------------------------------------------------
  // B. Variety is more than a different event id.
  // Exact event: normally 4-season cooldown.
  // Same broad theme: once per season where the pool allows it; a theme seen
  // last season is heavily down-weighted instead of being hard-banned.
  // -------------------------------------------------------------------
  const V19_THEME_MAP={
    TRAINING:'training',SCRIM:'training',ANALYSIS:'tactics',TACTICS:'tactics',PATCH:'tactics',LEAGUE:'tactics',FORMAT:'tactics',IDENTITY:'tactics',
    TEAM:'team',ROSTER:'roster',COACHING:'coach',LEADERSHIP:'career',CONTRACT:'career','FRONT OFFICE':'career',LEGACY:'career',
    MEDIA:'media',COMMUNITY:'media',RIVALRY:'media',ROOKIE:'rookie',VETERAN:'veteran',
    HEALTH:'health',MENTAL:'health',TRAVEL:'logistics',MATCHDAY:'logistics',EQUIPMENT:'logistics',FORM:'form',CONTROVERSY:'media'
  };
  function v19EventTheme(event){
    if(!event)return'other';
    const tags=event.eventTags||[];
    if(tags.includes('health')||tags.includes('mental'))return'health';
    if(tags.includes('contract'))return'career';
    if(tags.includes('rivalry')||tags.includes('media'))return'media';
    if(tags.includes('rookie'))return'rookie';
    if(tags.includes('veteran'))return'veteran';
    if(tags.includes('coach'))return'coach';
    if(tags.includes('roster'))return'roster';
    if(tags.includes('team'))return'team';
    if(tags.includes('tactics'))return'tactics';
    const prefix=String(event.kicker||'').split('·')[0].trim().toUpperCase();
    return V19_THEME_MAP[prefix]||'other';
  }
  careerState.eventThemeHistory=careerState.eventThemeHistory||{};
  const _v19ResetBuildOnly=resetBuildOnly;
  resetBuildOnly=function(...args){
    const out=_v19ResetBuildOnly.apply(this,args);
    // Event memory belongs to one career. A new character must not inherit the
    // previous player's cooldown/theme history.
    careerState.eventCareerHistory={};
    careerState.eventThemeHistory={};
    return out;
  };
  function v19UsedThemesThisSeason(){
    return new Set((seasonState.eventHistory||[]).map(x=>v19EventTheme(SEASON_EVENTS.find(e=>e.id===x.id))).filter(Boolean));
  }
  function v19WeightedPick(events){
    if(!events.length)return null;
    const year=Number(careerState.seasonYear||2019),themeHist=careerState.eventThemeHistory||{};
    const weighted=events.map(event=>{
      let weight=seasonEventWeight(event),seen=Number(themeHist[v19EventTheme(event)]||0);
      if(seen&&year-seen===1)weight*=.22;
      else if(seen&&year-seen===2)weight*=.62;
      return{event,weight:Math.max(.005,weight)};
    });
    const total=weighted.reduce((s,x)=>s+x.weight,0);let roll=Math.random()*total;
    for(const item of weighted){roll-=item.weight;if(roll<=0)return item.event;}
    return weighted.at(-1)?.event||events[0];
  }
  chooseSeasonEvent=function(){
    if(seasonState.specialForcedEventId){const special=SEASON_EVENTS.find(e=>e.id===seasonState.specialForcedEventId);if(special)return special;}
    const year=Number(careerState.seasonYear||2019),hist=careerState.eventCareerHistory||{},usedIds=new Set((seasonState.eventHistory||[]).map(x=>x.id));
    let base=SEASON_EVENTS.filter(e=>!usedIds.has(e.id)&&eventAgeEligible(e));
    if(!base.length)base=SEASON_EVENTS.filter(eventAgeEligible);
    if(!base.length)base=[...SEASON_EVENTS];

    // Prefer a 4-season exact-id cooldown. If an age/condition-gated pool becomes
    // too narrow, relax gradually rather than falling into retry roulette.
    let eligible=base;
    for(const gap of [4,3,2]){
      const rows=base.filter(e=>!Number(hist[e.id]||0)||year-Number(hist[e.id])>=gap);
      if(rows.length>=3||gap===2){eligible=rows.length?rows:eligible;break;}
    }

    // Same broad theme should normally appear at most once in a season.
    const usedThemes=v19UsedThemesThisSeason(),varied=eligible.filter(e=>!usedThemes.has(v19EventTheme(e)));
    if(varied.length)eligible=varied;
    return v19WeightedPick(eligible)||weightedEventPick(base);
  };
  function v19RememberTheme(event){
    if(!event||String(event.id||'').startsWith('injury-')||String(event.id||'').startsWith('trade-'))return;
    careerState.eventThemeHistory=careerState.eventThemeHistory||{};
    careerState.eventThemeHistory[v19EventTheme(event)]=Number(careerState.seasonYear||2019);
  }
  const _v19Resolve=resolveSeasonEvent;
  resolveSeasonEvent=function(index){const event=seasonState.currentEvent?.event;const out=_v19Resolve(index);v19RememberTheme(event);return out;};
  if(typeof v32AutoResolveSeasonEvent==='function'){
    const _v19Auto=v32AutoResolveSeasonEvent;
    v32AutoResolveSeasonEvent=function(){const before=seasonState.eventHistory?.length||0;const out=_v19Auto();if((seasonState.eventHistory?.length||0)>before){const row=seasonState.eventHistory.at(-1);v19RememberTheme(SEASON_EVENTS.find(e=>e.id===row?.id));}return out;};
  }

  // Make the smaller event budget visible in the season status instead of making
  // the player wonder whether the system stopped working.
  const _v19Dynamics=renderCareerDynamics;
  renderCareerDynamics=function(...args){
    const out=_v19Dynamics.apply(this,args),count=document.getElementById('seasonEventCount');
    if(count&&seasonState.active)count.textContent=`${seasonState.eventHistory.length} / ${seasonState.eventSchedule.length} 件`;
    return out;
  };

  // -------------------------------------------------------------------
  // C. CAREER FEED selection helper for QA / diagnostics.
  // The actual feed renderer lives inside the hero-mastery closure, so its
  // source module is updated directly instead of stacking an unreachable patch.
  // -------------------------------------------------------------------
  function v19StoryImportance(r){
    let s=(Number(r.avg)||6.5)-6.5;if(Number(r.avg)>=9)s+=4;if(Number(r.directBans)>=2)s+=3;if(Number(r.severeBans))s+=Number(r.severeBans)*3;if(r.returned)s+=3;if(Number(r.mapsPlayed)===0)s+=2;if(r.score==='3-0'||r.score==='0-3')s+=.8;return s;
  }
  function v19StorySelection(source,limit){
    const latest=[...source].sort((a,b)=>Number(b.matchNo||0)-Number(a.matchNo||0)).slice(0,Math.min(2,limit));
    const keys=new Set(latest.map(x=>x.id||`${x.year||0}-${x.matchNo||0}`));
    const highlights=[...source].filter(x=>!keys.has(x.id||`${x.year||0}-${x.matchNo||0}`)).sort((a,b)=>v19StoryImportance(b)-v19StoryImportance(a)||Number(b.matchNo||0)-Number(a.matchNo||0)).slice(0,Math.max(0,limit-latest.length));
    return [...latest,...highlights].sort((a,b)=>Number(b.matchNo||0)-Number(a.matchNo||0));
  }

  window.__OWL_V19_PACING={version:V19,eventTheme:v19EventTheme,eventSchedule:()=>generateSeasonEventSchedule(),storySelection:v19StorySelection};
})();
