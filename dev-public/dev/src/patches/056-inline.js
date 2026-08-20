/* ======================================================================
   Public Beta 1.9 RC6 · Career Flow & Market Choice
   P1 UX: remove repeated season-summary gates and make contract offers
   represent genuinely different career choices instead of near-clones.
   ====================================================================== */
(function(){
  const V20='Public Beta 1.9 RC6';

  // -------------------------------------------------------------------
  // A. Season end should not summarize the same season three times.
  // Old path: summary -> career hub offseason tab -> exit meeting -> training.
  // New path: summary -> training / retirement. Career archive stays optional.
  // -------------------------------------------------------------------
  const _v20GetOrder=getOffseasonOrder;
  getOffseasonOrder=function(){return _v20GetOrder().filter(x=>x!=='review');};

  const _v20SetupOffseason=setupOffseason;
  setupOffseason=function(){
    const out=_v20SetupOffseason.apply(this,arguments);
    if(offseasonState.showRetirement){
      offseasonState.phase='retirement';
    }else{
      prepareTrainingCamp(careerState.age+1);
      offseasonState.phase='training';
    }
    return out;
  };

  function v20CoachLine(){
    const avg=seasonState.userRatings?.length?seasonState.userRatings.reduce((a,b)=>a+b,0)/seasonState.userRatings.length:0;
    if(!seasonState.userRatings?.length)return '本季几乎没有出场样本';
    if(avg>=7.6)return '已具备核心价值';
    if(avg>=6.8)return '认可稳定性，期待扩大影响';
    return '需要重新证明首发价值';
  }
  function v20MarketScore(){
    const avg=seasonState.userRatings?.length?seasonState.userRatings.reduce((a,b)=>a+b,0)/seasonState.userRatings.length:0;
    return Math.round(Number(getMyOvr()==='--'?78:getMyOvr())*.55+avg*4.2+Number(careerState.popularity||0)*.08+(playoffState.round==='champion'?8:playoffState.round==='runnerup'?5:0));
  }
  function v20ContractText(){
    if(!careerState.contract)return '自由选手';
    const rem=Math.max(0,Number(careerState.contract.remaining??careerState.contract.years??0));
    return rem>0?`剩余 ${rem} 年 · ${careerState.contract.rolePromise||'队内定位待定'}`:'合同到期 · 将进入市场';
  }
  function v20InjectSummaryBrief(){
    const host=document.querySelector('#summaryScreen .summary-bottom-actions');if(!host)return;
    host.querySelector('.v20-summary-brief')?.remove();
    const brief=document.createElement('div');brief.className='v20-summary-brief';
    brief.innerHTML=`<div><span>教练组结论</span><strong>${v20CoachLine()}</strong></div><div><span>合同状态</span><strong>${v20ContractText()}</strong></div><div><span>当前市场评价</span><strong>${v20MarketScore()}</strong></div>`;
    host.prepend(brief);
    host.classList.add('v20-summary-actions');
    let archive=document.getElementById('v20CareerArchiveBtn');
    if(!archive){
      archive=document.createElement('button');archive.className='secondary-btn';archive.id='v20CareerArchiveBtn';archive.textContent='📊 查看生涯档案';
      archive.addEventListener('click',()=>openCareerHub('overview'));
      host.appendChild(archive);
    }
    const primary=document.getElementById('summaryOffseasonBtn');
    const regularDone=Number(seasonState.played)>=Number(seasonState.total),qualified=regularDone&&estimateSeasonRank()<=8,playoffDone=['champion','runnerup','eliminated'].includes(playoffState.round),needsPlayoff=qualified&&!playoffDone;
    if(primary&&regularDone&&!needsPlayoff)primary.textContent='进入休赛期 →';
  }
  const _v20RenderSummary=renderSeasonSummary;
  renderSeasonSummary=function(){const out=_v20RenderSummary.apply(this,arguments);v20InjectSummaryBrief();return out;};

  // The summary primary CTA now calls enterOffseasonStub() directly in the core runtime.


  // Old saves parked on the removed review step migrate forward once opened.
  const _v20RenderOffseason=renderOffseason;
  renderOffseason=function(){
    if(offseasonState.active&&offseasonState.phase==='review'){
      if(offseasonState.showRetirement)offseasonState.phase='retirement';
      else{if(!offseasonState.ageTransitionApplied)prepareTrainingCamp(careerState.age+1);offseasonState.phase='training';}
    }
    return _v20RenderOffseason.apply(this,arguments);
  };

  // -------------------------------------------------------------------
  // B. Contract market: expose distinct career paths.
  // Keep the same valuation model, but build the offer set from all plausible
  // teams and deliberately include different angles when 3+ offers exist:
  // contender / bigger role / system fit / renewal.
  // -------------------------------------------------------------------
  function v20Hash(text){let h=2166136261>>>0;for(const c of String(text||'')){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
  function v20Tactic(team,year){
    if(team?.name===careerState.team?.name&&careerState.tactic)return careerState.tactic;
    return TACTICS[v20Hash(`${team?.short||team?.name}|${year}|system`)%TACTICS.length];
  }
  function v20Depth(team,role,nextYear){
    if(team?.name===careerState.team?.name&&(careerState.starters?.length||careerState.bench?.length)){
      return [...(careerState.starters||[]),...(careerState.bench||[])].filter(p=>!p.isUser&&p.role===role).map(p=>({name:p.name,ovr:Number.isFinite(Number(p.overall))?Number(p.overall):v35RoleCompositeOvr(p.attrs||{},role)}));
    }
    const entries=typeof v50RosterEntriesFor==='function'?v50RosterEntriesFor(team,nextYear):historicalRosterEntries(team);
    return (entries||[]).filter(e=>e[1]===role).map(e=>({name:e[0],ovr:Number(e[2])||70}));
  }
  function v20RosterNeed(team,role,userOvr,nextYear){
    const depth=v20Depth(team,role,nextYear);
    if(!depth.length)return{score:98,best:0,count:0,label:'位置存在明显空缺'};
    const best=Math.max(...depth.map(x=>Number(x.ovr)||70)),count=depth.length,skillGap=userOvr-best;
    const score=clamp(Math.round(82-(best-80)*1.35-Math.max(0,count-1)*6+skillGap*1.20),45,98);
    return{score,best,count,label:score>=88?'位置缺口明显':score>=74?'存在明确竞争机会':score>=60?'已有成熟同位置人选':'同位置资源拥挤'};
  }
  function v20Fit(team,tactic,role,userOvr,nextYear){
    const attrs={};ATTRS.forEach(a=>attrs[a.key]=state.locked[a.key]?.value||70);
    const personal=v37PersonalTacticFit(role,tactic,attrs),natural=v37NaturalRoleFit(role,tactic),roster=v20RosterNeed(team,role,userOvr,nextYear);
    const total=clamp(Math.round(personal*.50+natural*.30+roster.score*.20),45,99);
    return{total,personal,natural,rosterNeed:roster.score,roster};
  }
  function v20TeamPower(team,nextYear){
    const meta=typeof v50TeamMetaForYear==='function'?v50TeamMetaForYear(team,nextYear):null;
    return Math.round(Number(meta?.strength??team?.strength??80));
  }
  function v20Promise(score){return score>=88?'核心首发':score>=80?'稳定首发':score>=71?'首发竞争':'轮换选手';}
  function v20HeroProfile(){try{return window.__OWL_V75_DIAGNOSTICS?.().heroMarket||null}catch(_){return null}}
  function v20Candidate(team,nextYear,market,avg,ovr,renewal=false){
    const tactic=v20Tactic(team,nextYear),teamPower=v20TeamPower(team,nextYear),fitBreakdown=v20Fit(team,tactic,state.role,ovr,nextYear),fit=fitBreakdown.total;
    const interest=fit*.42+fitBreakdown.rosterNeed*.34+(market-teamPower)*.15+(renewal?3:0);
    const starterBase=ovr*.45+fitBreakdown.personal*.20+fitBreakdown.rosterNeed*.25+(avg-7)*8-Math.max(0,teamPower-82)*.40;
    return{team,tactic,teamPower,fitBreakdown,fit,interest,starterBase,renewal};
  }
  function v20PushUnique(out,row,angle){if(!row||out.some(x=>x.row.team.short===row.team.short))return false;out.push({row,angle});return true;}
  function v20TeamByName(name){return (typeof TEAMS!=='undefined'?TEAMS:[]).find(t=>t.name===name||t.short===name)||null;}
  function v20RosterNames(team,year){
    try{
      if(team?.name===careerState.team?.name&&Number(year)===Number(careerState.seasonYear||2019))return new Set([...careerState.starters||[],...(careerState.bench||[])].filter(p=>!p?.isUser&&p?.name).map(p=>p.name));
      const entries=typeof v50RosterEntriesFor==='function'?v50RosterEntriesFor(team,year):[];
      return new Set((entries||[]).map(e=>Array.isArray(e)?e[0]:e?.name).filter(Boolean));
    }catch(_){return new Set();}
  }
  function v20CareerTeammates(){
    const names=v20RosterNames(careerState.team,careerState.seasonYear);
    (careerState.careerArchive||[]).forEach(record=>{
      const team=v20TeamByName(record?.team);if(!team)return;
      v20RosterNames(team,Number(record.year)||careerState.seasonYear).forEach(name=>names.add(name));
    });
    return names;
  }
  function v20CoachWasSeen(team,year){
    try{
      const api=globalThis.__OWL_V20_ALPHA1,coach=api?.coachFor?.(team,year),handle=coach?.handle;if(!handle)return false;
      const seasons=[{team:careerState.team,year:careerState.seasonYear},...(careerState.careerArchive||[])];
      return seasons.some(record=>{const oldTeam=record.team?.name?record.team:v20TeamByName(record.team),old=api.coachFor?.(oldTeam,Number(record.year)||careerState.seasonYear);return old?.handle===handle;});
    }catch(_){return false;}
  }
  function v20OfferTags(row,nextYear,rolePromise){
    const relation=[];
    if(row?.renewal)relation.push('熟悉环境');
    else{
      const former=(careerState.careerArchive||[]).some(record=>record?.team===row?.team?.name);
      const targetNames=v20RosterNames(row.team,nextYear),shared=[...v20CareerTeammates()].filter(name=>targetNames.has(name)).length;
      if(former)relation.push('重返故地');
      else if(shared>=2)relation.push('老队友重聚');
      else if(shared===1)relation.push('熟悉队友');
      else if(v20CoachWasSeen(row.team,nextYear))relation.push('熟悉教练');
    }
    const promise=String(rolePromise||'');
    const opportunity=Number(row?.teamPower||0)>=85?'冠军窗口':Number(row?.fit||0)>=88?'体系适配':/核心首发/.test(promise)&&Number(row?.fitBreakdown?.rosterNeed||0)>=84?'建队核心':/核心首发|稳定首发/.test(promise)?'更大角色':'';
    return [...relation,opportunity].filter(Boolean).slice(0,2);
  }

  generateContractOffers=function(){
    const avg=seasonState.userRatings?.length?seasonState.userRatings.reduce((a,b)=>a+b,0)/seasonState.userRatings.length:6.8,ovr=Number(getMyOvr()==='--'?78:getMyOvr()),rank=estimateSeasonRank(),post=playoffState.round==='champion'?2:playoffState.results?.length?1:0;
    let count=avg>=8.2||post===2?5:avg>=7.65||rank<=6?4:avg>=7.0||rank<=12?3:avg>=6.35?2:1;count=clamp(count+rand(-1,1),1,5);
    const market=ovr*.62+avg*4.2+(21-rank)*.35+post*7+Number(careerState.popularity||0)*.05,nextYear=Number(careerState.seasonYear||2019)+1;
    if(nextYear>=2024){try{if(careerState.simulationMode==='fantasy'&&typeof v76EnsureWorldToYear==='function')v76EnsureWorldToYear(nextYear);else if(typeof v60EnsureWorldToYear==='function')v60EnsureWorldToYear(nextYear);}catch(_){}}
    const active=typeof v50ActiveTeams==='function'?v50ActiveTeams():TEAMS.filter(t=>t.active!==false),renewalTeam=careerState.team;
    const candidates=active.filter(t=>typeof v50TeamActiveNextYear!=='function'||v50TeamActiveNextYear(t,nextYear)).map(t=>v20Candidate(t,nextYear,market,avg,ovr,t.name===renewalTeam?.name));
    const renewal=candidates.find(x=>x.renewal)||null,external=candidates.filter(x=>!x.renewal),plausible=external.filter(x=>x.interest>=Math.max(...external.map(y=>y.interest),-Infinity)-14);
    const pool=plausible.length>=Math.min(4,external.length)?plausible:external;
    const chosen=[];
    if(renewal)v20PushUnique(chosen,renewal,'熟悉环境');
    if(count>=3){
      v20PushUnique(chosen,[...pool].sort((a,b)=>b.teamPower-a.teamPower||b.interest-a.interest)[0],'争冠机会');
      v20PushUnique(chosen,[...pool].sort((a,b)=>(b.starterBase+b.fitBreakdown.rosterNeed*.12)-(a.starterBase+a.fitBreakdown.rosterNeed*.12))[0],'更大角色');
      v20PushUnique(chosen,[...pool].sort((a,b)=>b.fit-a.fit||b.interest-a.interest)[0],'体系适配');
    }
    [...pool].sort((a,b)=>b.interest-a.interest).forEach(x=>{if(chosen.length<count)v20PushUnique(chosen,x,'综合邀请');});
    [...external].sort((a,b)=>b.interest-a.interest).forEach(x=>{if(chosen.length<count)v20PushUnique(chosen,x,'综合邀请');});
    const hero=v20HeroProfile(),heroLift=Number(hero?.premium||0);
    offseasonState.offers=chosen.slice(0,count).map(({row,angle},index)=>{
      let starterScore=row.starterBase+rand(-3,3)+heroLift*.62;
      const rolePromise=v20Promise(starterScore),salary=Math.max(8,Math.round((market-55)*.8+(row.teamPower-78)*.82+row.fit*.05+row.fitBreakdown.rosterNeed*.035+rand(-3,5)));
      return{id:`offer-${index}-${Date.now()}-${Math.random()}`,team:row.team,renewal:row.renewal,tactic:row.tactic,fit:row.fit,fitBreakdown:row.fitBreakdown,years:rand(1,3),salary,rolePromise,teamPower:row.teamPower,starterScore,note:v37OfferNote(row.renewal,row.fitBreakdown,row.teamPower),marketAngle:angle,marketTags:v20OfferTags(row,nextYear,rolePromise),v75HeroAdjusted:true,heroMarket:hero?{label:hero.label,premium:hero.premium,breadth:hero.breadth,elite:hero.elite,fragility:hero.fragility}:null};
    });
  };

  const _v20RenderMarket=renderContractMarket;
  renderContractMarket=function(wrap){
    const out=_v20RenderMarket.apply(this,arguments);
    if(offseasonState.contractExpired){
      (offseasonState.offers||[]).forEach(o=>{
        const card=wrap?.querySelector(`[data-offer-id="${o.id}"]`);if(!card||card.querySelector('.v20-market-angle'))return;
        o.marketTags=v20OfferTags(o,Number(careerState.seasonYear||2019)+1,o.rolePromise);
        const tags=o.marketTags?.length?o.marketTags:[o.marketAngle||'综合邀请'],badge=document.createElement('div');badge.className='v20-market-angle';
        const label=document.createElement('span');label.className='v20-market-angle-label';label.textContent='路线';badge.appendChild(label);
        tags.slice(0,2).forEach(tag=>{const node=document.createElement('b');node.className='v20-market-tag';node.textContent=tag;badge.appendChild(node);});
        card.insertBefore(badge,card.firstChild?.nextSibling||card.firstChild);
        const t=document.createElement('div');t.className='v20-market-tradeoff';
        const need=o.fitBreakdown?.rosterNeed??0,competition=o.fitBreakdown?.roster?.best||0;
        t.textContent=`选择重点：队伍实力 ${o.teamPower} · 阵容需求 ${need} · 同位置最高 OVR ${competition||'空缺'} · ${o.rolePromise}`;card.appendChild(t);
      });
    }
    return out;
  };

  window.__OWL_V20_UX={version:V20,teamPower:v20TeamPower,fit:v20Fit,coachLine:v20CoachLine,marketScore:v20MarketScore};
})();
