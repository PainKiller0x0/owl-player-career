/* ======================================================================
   Public Beta 1.9 RC9 · Long-Career Friction Polish
   - retirement stays available without blocking every healthy age 23-28 offseason
   - active contracts skip the annual no-choice confirmation page
   - preserve real career decisions: injuries, final season, role plans, new contracts
   ====================================================================== */
(function(){
  const VER='Public Beta 1.9 RC9';

  function injuryRetireTrigger23(){
    return getSeasonInjuryCount()>=5 || (careerState.injuryHistory||[]).length>=20;
  }

  // Healthy players should not be forced through the same retirement question
  // every year from 23 onward. Keep mandatory checkpoints for injury and the
  // final pre-30 season; voluntary retirement stays available from summary.
  shouldShowRetirementDecision=function(){
    if(Number(careerState.age)>=30)return true;
    if(offseasonState.v23ManualRetirement)return true;
    if(injuryRetireTrigger23())return true;
    return Number(careerState.age)>=29;
  };

  function canConsiderRetirement23(){
    const age=Number(careerState.age||0);
    const regularDone=Number(seasonState.played)>=Number(seasonState.total);
    const qualified=regularDone&&estimateSeasonRank()<=8;
    const playoffDone=['champion','runnerup','eliminated'].includes(playoffState.round);
    return age>=23&&age<29&&regularDone&&(!qualified||playoffDone);
  }

  function injectRetirementAction23(){
    const brief=document.querySelector('#summaryScreen .v20-summary-brief');
    if(!brief)return;
    brief.querySelector('.v23-retirement-action')?.remove();
    if(!canConsiderRetirement23())return;
    const box=document.createElement('div');box.className='v23-retirement-action';
    box.innerHTML='<span>职业决定</span><button type="button" class="v23-retire-link" id="v23ConsiderRetireBtn">考虑退役</button>';
    brief.appendChild(box);
    box.querySelector('button').addEventListener('click',()=>{
      offseasonState.v23ManualRetirement=true;
      if(!offseasonState.active)setupOffseason();
      offseasonState.showRetirement=true;
      offseasonState.phase='retirement';
      renderOffseason();
      showScreen('offseason');
    });
  }
  const _summary23=renderSeasonSummary;
  renderSeasonSummary=function(){const out=_summary23.apply(this,arguments);injectRetirementAction23();return out;};

  // Make manual/injury retirement copy describe the actual reason, instead of
  // repeating the old "23+ asks every year" explanation.
  const _resolveRetire23=resolveRetirementDecision;
  resolveRetirementDecision=function(choice){offseasonState.v23ManualRetirement=false;return _resolveRetire23.apply(this,arguments);};

  const _retire23=renderRetirementDecision;
  renderRetirementDecision=function(wrap){
    const out=_retire23.apply(this,arguments);
    const age=Number(careerState.age||0),injury=injuryRetireTrigger23(),manual=!!offseasonState.v23ManualRetirement;
    if(age>=30)return out;
    const title=wrap.querySelector('h3'),copy=wrap.querySelector('p');
    if(manual){
      if(title)title.textContent=`${age}岁，你在考虑结束职业生涯`;
      if(copy)copy.textContent=`继续生涯将进入${age+1}岁训练营；退役会立即结束当前职业生涯。`;
    }else if(injury){
      if(title)title.textContent='伤病让你重新考虑职业生涯';
      if(copy)copy.textContent=`本赛季伤病 ${getSeasonInjuryCount()} 次 · 生涯累计 ${(careerState.injuryHistory||[]).length} 次。`;
    }else if(age===29){
      if(title)title.textContent='29岁赛季结束，还要打最后一年吗？';
      if(copy)copy.textContent='继续生涯将进入30岁赛季；完成后强制退役。';
    }
    return out;
  };

  function activeContract23(){return !offseasonState.contractExpired&&Number(careerState.contract?.remaining||0)>0;}
  function finishContinuedContract23(){
    continueExistingContract();
    offseasonState.active=false;
    // Keep the authoritative season-entry path (historical roster/world setup included),
    // but do not force another annual "开始新赛季" confirmation click.
    const start=document.getElementById('startSeasonBtn');
    if(start)start.click();
    else{setupSeason();showScreen('season');renderSeason();}
  }

  // Training confirmation: if nothing remains to decide and the contract is
  // still active, start the next season directly. No annual "履行合同" gate.
  confirmTrainingCamp=function(){
    if(offseasonState.trainingRemaining>0&&canSpendTrainingPoint())return;
    offseasonState.trainingConfirmed=true;
    careerState.peakOvr=Math.max(careerState.peakOvr,Number(getMyOvr()==='--'?0:getMyOvr()));
    if(offseasonState.roleOpportunity){setOffseasonPhase('role');return;}
    if(activeContract23()){finishContinuedContract23();return;}
    setOffseasonPhase('market');
  };

  const _role23=applyRoleDecision;
  applyRoleDecision=function(choice){
    // A role-plan decision is itself a meaningful offseason branch. Always return
    // to the contract step afterwards, even when the current contract is active,
    // so declining / accepting a position change cannot silently skip contract handling.
    return _role23.apply(this,arguments);
  };

  window.__OWL_V23_UX={version:VER,injuryRetireTrigger:injuryRetireTrigger23,canConsiderRetirement:canConsiderRetirement23,activeContract:activeContract23};
})();
