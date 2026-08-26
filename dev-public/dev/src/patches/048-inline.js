/* ======================================================================
   Public Beta 1.5 RC1 · POTENTIAL / DESTINY SYSTEM
   Growth archetypes + deterministic creation roll + career breakthrough
   ====================================================================== */
(function(){
  const VERSION='Public Beta 1.5 RC1';
  const POTENTIAL_VERSION=1;
  const PHYSICAL_KEYS=new Set(['hitscan','projectile','mechanics','survival','clutch','cooldown']);

  const PROFILES={
    prodigy:{id:'prodigy',icon:'⚡',label:'天才少年',tone:'爆发型成长',initialDelta:2,
      desc:'起步就比同龄人更快兑现，20岁前是最凶的成长窗口；如果没把天赋换成真正的履历，后半程会比别人更早遇到瓶颈。'},
    late:{id:'late',icon:'🌋',label:'大器晚成',tone:'后程爆发',initialDelta:-2,
      desc:'开局甚至可能显得普通，但23–26岁才是这条曲线最危险的阶段。前几年熬得住，后面可能突然把整个联盟看傻。'},
    steady:{id:'steady',icon:'📈',label:'稳步成长',tone:'标准成长',initialDelta:0,
      desc:'没有夸张的暴涨暴跌，靠训练、比赛质量和多年积累稳定抬高下限。最不戏剧化，也最不容易被命运一脚踹翻。'},
    fallen:{id:'fallen',icon:'🌠',label:'伤仲永',tone:'早熟 / 高风险',initialDelta:2,
      desc:'少年阶段兑现得很快，但22岁后成长效率会明显断崖。如果职业生涯没有拿出超预期表现，这条线会亲手把“曾经的天才”四个字写上去。'},
    evergreen:{id:'evergreen',icon:'🌲',label:'常青树',tone:'长线耐久',initialDelta:-1,
      desc:'爆发不算凶，但衰退更慢。别人靠年轻吃饭，你靠把状态、经验和细节一点点留住，越到生涯后段越能体现价值。'}
  };

  function pHash(text){const s=String(text??'');let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
  function pUnit(seed){return(pHash(seed)%100000)/100000;}
  function clampP(v,min,max){return Math.max(min,Math.min(max,v));}
  function freshSeed(){return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;}

  function weightsForAge(age){
    if(age<=18)return[['prodigy',24],['late',12],['steady',39],['fallen',15],['evergreen',10]];
    if(age<=20)return[['prodigy',18],['late',16],['steady',40],['fallen',14],['evergreen',12]];
    if(age<=22)return[['prodigy',8],['late',24],['steady',43],['fallen',10],['evergreen',15]];
    return[['late',36],['steady',44],['evergreen',20]];
  }
  function rollType(age){
    state.careerSeed=state.careerSeed||freshSeed();
    const rows=weightsForAge(age),r=pUnit(`${state.careerSeed}|potential|${age}|${state.role||''}|${state.playerCountry||''}`)*rows.reduce((s,x)=>s+x[1],0);
    let c=0;for(const [id,w] of rows){c+=w;if(r<c)return id;}return rows[rows.length-1][0];
  }
  function makeProfile(type,age){
    return{version:POTENTIAL_VERSION,type,rollAge:age,rollRole:state.role||null,locked:true,destinyScore:0,destinyLevel:0,
      breakthroughPending:false,breakthroughHistory:[],lastScoredYear:null,lastScoreDelta:0,lastScoreReasons:[],lastTrainingBonusYear:null};
  }
  function ensurePotentialProfile(opts={}){
    const age=Math.max(16,Math.min(26,Number(careerState.startAge||state.playerStartAge||careerState.age||16)));
    let p=careerState.potentialProfile;
    if(!p||typeof p!=='object'){
      // 已经在跑的旧档不随机改命：默认归入最中性的“稳步成长”。
      const type=opts.newCareer?rollType(age):'steady';
      p=careerState.potentialProfile=makeProfile(type,age);
      if(!opts.newCareer)p.legacyMigrated=true;
    }
    if(opts.newCareer && (Number(p.rollAge)!==age || p.rollRole!==state.role)){
      p=careerState.potentialProfile=makeProfile(rollType(age),age);
    }
    if(!PROFILES[p.type])p.type='steady';
    p.version=POTENTIAL_VERSION;p.destinyScore=Number(p.destinyScore||0);p.destinyLevel=clampP(Number(p.destinyLevel||0),0,2);
    p.breakthroughHistory=Array.isArray(p.breakthroughHistory)?p.breakthroughHistory:[];
    state.playerPotentialType=p.type;
    return p;
  }
  function profileDef(){return PROFILES[ensurePotentialProfile().type]||PROFILES.steady;}

  function curveFactor(type,age){
    if(type==='prodigy'){if(age<=19)return 1.40;if(age<=21)return 1.24;if(age<=23)return 1.04;if(age<=26)return .88;return .76;}
    if(type==='late'){if(age<=19)return .72;if(age<=21)return .86;if(age===22)return 1.00;if(age<=25)return 1.43;if(age<=27)return 1.22;return .95;}
    if(type==='fallen'){if(age<=18)return 1.36;if(age<=20)return 1.20;if(age===21)return .94;if(age<=23)return .70;return .56;}
    if(type==='evergreen'){if(age<=20)return .86;if(age<=23)return .95;if(age<=26)return 1.02;return 1.08;}
    return 1;
  }
  function declineFactor(type,age){
    if(type==='prodigy')return age>=26?1.28:age>=24?1.12:1;
    if(type==='late')return age<=26?.78:age<=28?.90:1;
    if(type==='fallen')return age>=26?1.36:age>=23?1.24:1;
    if(type==='evergreen')return .70;
    return 1;
  }
  function potentialPointBonus(type,age){if(type==='prodigy'&&age<=20)return 2;if(type==='late'&&age>=23&&age<=26)return 2;if(type==='late'&&age===27)return 1;if(type==='fallen'&&age<=19)return 2;if(type==='evergreen'&&age>=27&&age<=29)return 1;return 0;}
  function destinyGrowthFactor(p=ensurePotentialProfile()){return p.destinyLevel>=2?1.24:p.destinyLevel>=1?1.12:1;}
  function destinyDeclineFactor(p=ensurePotentialProfile()){return p.destinyLevel>=2?.74:p.destinyLevel>=1?.88:1;}
  function currentGrowthFactor(age){const p=ensurePotentialProfile();return curveFactor(p.type,age)*destinyGrowthFactor(p);}
  function destinyText(p=ensurePotentialProfile()){
    if(p.destinyLevel>=2)return '逆命完成 · 原成长曲线已经被你彻底掰弯';
    if(p.destinyLevel>=1)return '突破Ⅰ · 命运已经出现永久偏移';
    if(p.destinyScore>=45)return '轨迹松动 · 你正在接近一次生涯突破';
    if(p.destinyScore>=22)return '出现裂缝 · 超预期表现开始留下影响';
    return '既定轨迹 · 目前仍按原成长底色发展';
  }
  function refreshBreakthroughPending(p=ensurePotentialProfile()){
    const threshold=p.destinyLevel===0?60:p.destinyLevel===1?115:Infinity;
    if(p.destinyLevel<2&&p.destinyScore>=threshold)p.breakthroughPending=true;
    return p.breakthroughPending;
  }
  function phaseText(age){
    const d=profileDef(),f=currentGrowthFactor(age);
    if(f>=1.25)return `${d.label}正在强势兑现 · 成长效率显著高于基准`;
    if(f>=1.08)return `${d.label}进入有利窗口 · 成长效率略高于基准`;
    if(f<=.72)return `${d.label}处于困难窗口 · 单靠常规训练很难继续抬升`;
    if(f<=.9)return `${d.label}处于低效窗口 · 需要靠表现和选择争取额外空间`;
    return `${d.label}处于正常窗口 · 成长主要取决于赛季质量与训练分配`;
  }

  // --- 新生涯：潜力在确认姓名/年龄后按种子锁定，换年龄不会靠来回切换无限洗词条。 ---
  const _hardResetPotential=hardReset;
  hardReset=function(...args){const out=_hardResetPotential.apply(this,args);state.careerSeed=freshSeed();state.playerPotentialType=null;careerState.potentialProfile=null;return out;};
  const _confirmNamePotential=confirmPlayerName;
  confirmPlayerName=function(skip=false){
    const age=Math.max(16,Math.min(26,Number(els.playerAgeSelect?.value||state.playerStartAge||16)));
    state.playerStartAge=age;state.careerSeed=state.careerSeed||freshSeed();
    const old=careerState.potentialProfile;
    if(!old||Number(old.rollAge)!==age||old.rollRole!==state.role)careerState.potentialProfile=makeProfile(rollType(age),age);
    state.playerPotentialType=careerState.potentialProfile.type;
    return _confirmNamePotential.call(this,skip);
  };

  function renderBuilderPotentialBadge(){
    const hero=document.querySelector('#builderScreen .builder-hero .hero-side-actions');if(!hero)return;hero.querySelector('.potential-builder-badge')?.remove();
    const p=ensurePotentialProfile({newCareer:true}),d=PROFILES[p.type]||PROFILES.steady,n=document.createElement('div');n.className='potential-builder-badge';
    n.innerHTML=`<span>🧬 成长底色</span><strong>${d.icon} ${d.label}</strong><em>${d.tone}</em>`;hero.prepend(n);
  }
  const _enterBuilderPotential=enterBuilder;
  enterBuilder=function(...args){const out=_enterBuilderPotential.apply(this,args);renderBuilderPotentialBadge();return out;};

  // --- 初始能力：潜力会轻微影响“起步质量”，但不把任何类型做成纯上位替代。 ---
  const _generateAttributesPotential=generateAttributes;
  generateAttributes=function(role){
    const attrs=_generateAttributesPotential.call(this,role),p=ensurePotentialProfile(),delta=(PROFILES[p.type]||PROFILES.steady).initialDelta||0;
    if(delta)Object.keys(attrs).forEach(k=>attrs[k]=clampP(Number(attrs[k]||70)+delta,58,97));
    return attrs;
  };

  // --- 训练点：年龄曲线 × 潜力曲线 × 命运偏移。 ---
  const _trainingBreakdownPotential=getTrainingPointBreakdown;
  getTrainingPointBreakdown=function(nextAge){
    const out=_trainingBreakdownPotential.call(this,nextAge),p=ensurePotentialProfile(),profile=PROFILES[p.type]||PROFILES.steady;
    const potentialFactor=currentGrowthFactor(nextAge);
    const curveBonus=potentialPointBonus(p.type,Number(nextAge));
    out.potentialType=p.type;out.potentialLabel=profile.label;out.potentialFactor=Number(potentialFactor.toFixed(2));out.potentialBonus=curveBonus;out.destinyLevel=p.destinyLevel;
    out.total=clampP(Math.max(3,Math.round(Number(out.base||0)*Number(out.multiplier||1)*potentialFactor)+curveBonus),3,18);
    return out;
  };

  // --- 年龄自然变化：潜力主要改变“掉得多快”；经验类正收益仍由原年龄系统负责。 ---
  const _applyAgeNaturalPotential=applyAgeNaturalChanges;
  applyAgeNaturalChanges=function(nextAge){
    const p=ensurePotentialProfile(),type=p.type,base=AGE_NATURAL_CHANGES[nextAge]||{},factor=declineFactor(type,nextAge)*destinyDeclineFactor(p),adjusted={};
    Object.entries(base).forEach(([key,delta])=>{
      let d=Number(delta||0);
      if(d<0){let mag=Math.max(1,Math.round(Math.abs(d)*factor));d=-mag;}
      adjusted[key]=d;
      setCareerAttributeValue(key,(state.locked[key]?.value||75)+d);
    });
    return adjusted;
  };

  function scoreSeason(record){
    const p=ensurePotentialProfile();if(!record||Number(p.lastScoredYear)===Number(record.year))return 0;
    let delta=0;const reasons=[];const rating=Number(record.rating||0);
    if(rating>=8){delta+=22;reasons.push('统治级赛季 +22');}
    else if(rating>=7.5){delta+=14;reasons.push('明星级赛季 +14');}
    else if(rating>=7.1){delta+=8;reasons.push('高质量赛季 +8');}
    else if(rating>=6.7){delta+=4;reasons.push('稳定发挥 +4');}
    else if(rating<6.2){delta-=8;reasons.push('低迷赛季 -8');}
    const result=String(record.result||'');
    if(result==='总冠军'){delta+=15;reasons.push('联赛冠军 +15');}
    else if(result==='联赛亚军'){delta+=8;reasons.push('联赛亚军 +8');}
    else if(/季后赛/.test(result)){delta+=4;reasons.push('季后赛履历 +4');}
    const honors=record.honors||[];
    const hasMvp=honors.some(x=>['MVP','常规赛最有价值选手'].includes(x));
    const hasFmvp=honors.some(x=>['总决赛MVP','总决赛最有价值选手'].includes(x));
    const hasRoty=honors.some(x=>['年度最佳新秀','Alarm年度最佳新秀奖'].includes(x));
    if(hasMvp){delta+=10;reasons.push('MVP +10');}
    if(hasFmvp){delta+=10;reasons.push('FMVP +10');}
    if(hasRoty){delta+=6;reasons.push('最佳新秀 +6');}
    const wc=record.worldCup;
    if(wc?.result==='世界杯冠军'){delta+=15;reasons.push('世界杯冠军 +15');}
    else if(wc?.result==='世界杯亚军'){delta+=8;reasons.push('世界杯亚军 +8');}
    else if(String(wc?.result||'').includes('四强')){delta+=5;reasons.push('世界杯四强 +5');}
    p.destinyScore=clampP(p.destinyScore+delta,0,160);p.lastScoredYear=record.year;p.lastScoreDelta=delta;p.lastScoreReasons=reasons;
    refreshBreakthroughPending(p);return delta;
  }

  const _recordSeasonPotential=recordCompletedCareerSeason;
  recordCompletedCareerSeason=function(...args){
    const before=careerState.careerArchive?.length||0,out=_recordSeasonPotential.apply(this,args),after=careerState.careerArchive?.length||0;
    if(after>before)scoreSeason(careerState.careerArchive[after-1]);
    return out;
  };

  const _confirmTrainingPotential=confirmTrainingCamp;
  confirmTrainingCamp=function(...args){
    const p=ensurePotentialProfile(),year=Number(careerState.seasonYear||0),spent=Number(offseasonState.trainingPoints||0)-Number(offseasonState.trainingRemaining||0);
    if(spent>0&&Number(offseasonState.trainingRemaining||0)===0&&p.lastTrainingBonusYear!==year){p.destinyScore=clampP(p.destinyScore+4,0,160);p.lastTrainingBonusYear=year;refreshBreakthroughPending(p);}
    return _confirmTrainingPotential.apply(this,args);
  };

  function breakthroughChance(){
    const last=careerState.careerArchive?.[careerState.careerArchive.length-1],rating=Number(last?.rating||6.5),condition=Number(careerState.condition||70);
    let c=.58+(rating-7)*.12+(condition-65)*.0025;
    if(last?.honors?.some(x=>['MVP','常规赛最有价值选手'].includes(x)))c+=.07;if(last?.honors?.includes('总冠军'))c+=.05;if(last?.worldCup?.result==='世界杯冠军')c+=.06;
    return clampP(c,.48,.88);
  }
  function renderBreakthrough(wrap){
    const p=ensurePotentialProfile(),d=profileDef(),chance=breakthroughChance(),last=careerState.careerArchive?.[careerState.careerArchive.length-1];
    wrap.innerHTML=`<div class="offseason-kicker">CAREER BREAKTHROUGH · 命运拐点</div>
      <h3>${d.icon} ${d.label}${p.destinyLevel?'的轨迹再次松动了':'的轨迹第一次松动了'}</h3>
      <p>你的成长底色没有消失，但连续的超预期表现已经把原本的曲线撞出裂缝。教练组提出一套极端训练方案：整个休赛期围绕你的弱点和比赛负荷重做。如果成功，之后的成长效率会永久提高、年龄衰退也会被削弱。</p>
      <div class="potential-breakthrough-grid">
        <div><span>成长底色</span><strong>${d.label}</strong><em>${d.tone}</em></div>
        <div><span>上一赛季</span><strong>${last?.rating?`${last.rating.toFixed(1)}分`:'未出场'}</strong><em>${last?.result||'职业赛季'}</em></div>
        <div><span>当前命运</span><strong>${p.destinyLevel?'突破Ⅰ':'既定轨迹'}</strong><em>${destinyText(p)}</em></div>
      </div>
      <div class="meeting-note"><strong>这不是免费潜力+1。</strong>押上整个休赛期会消耗状态，而且存在失败可能；你也可以暂时不赌，保留这次突破资格到以后。</div>
      <div class="potential-breakthrough-actions">
        <button class="primary-btn" id="potentialAllInBtn">🔥 押上这个休赛期</button>
        <button class="secondary-btn" id="potentialWaitBtn">先不冒险</button>
      </div>`;
    wrap.querySelector('#potentialAllInBtn')?.addEventListener('click',()=>{
      const success=pUnit(`${state.careerSeed}|breakthrough|${careerState.seasonYear}|${p.destinyLevel}|${p.destinyScore}`)<chance;
      careerState.condition=clampP(Number(careerState.condition||70)-12,0,100);p.breakthroughPending=false;
      if(success){p.destinyLevel=clampP(p.destinyLevel+1,0,2);const threshold=p.destinyLevel===1?60:115;p.destinyScore=Math.max(0,p.destinyScore-threshold);p.breakthroughHistory.push({year:careerState.seasonYear,age:careerState.age,success:true,level:p.destinyLevel});
        // 突破发生在训练正式分配前：本休赛期就享受新的成长效率。
        if(offseasonState.ageTransitionApplied&&!offseasonState.trainingConfirmed){offseasonState.trainingBreakdown=getTrainingPointBreakdown(careerState.age);offseasonState.trainingPoints=offseasonState.trainingBreakdown.total;offseasonState.trainingRemaining=offseasonState.trainingPoints;}
        window.__OWL_V790_MEMORY_QA?.addMemory?.(`potential-breakthrough-${p.destinyLevel}`,'🔥','你把成长曲线掰弯了',`${careerState.age}岁休赛期，你用一个极端训练周期完成了生涯突破。${d.label}仍是你的底色，但它不再是结局。`,3.2,'生涯锚点',{season:careerState.seasonYear});
        window.__OWL_V16_MODAL?.result?.({icon:'🔥',kicker:'CAREER BREAKTHROUGH · 命运拐点',title:'生涯突破成功',body:`<p>命运偏移提升至 <strong>${p.destinyLevel===1?'Ⅰ':'Ⅱ'}</strong>。</p><p>之后成长效率永久提高，年龄衰退也会减轻。</p>`});
      }else{p.destinyScore=Math.max(0,p.destinyScore-25);p.breakthroughHistory.push({year:careerState.seasonYear,age:careerState.age,success:false,level:p.destinyLevel});window.__OWL_V16_MODAL?.result?.({icon:'🩹',kicker:'CAREER BREAKTHROUGH · 命运拐点',title:'这次没有突破',body:'<p>极端训练没有完成突破。你付出了状态代价，但职业生涯还没结束。</p><p>失败不会抹掉这段经历，下一次重新撞开成长窗口时，它仍然算数。</p>',tone:'warning'});}
      renderOffseason();
    });
    wrap.querySelector('#potentialWaitBtn')?.addEventListener('click',()=>{p.breakthroughPending=false;p.breakthroughDeferredYear=careerState.seasonYear;renderOffseason();});
  }

  const _renderTrainingPotential=renderTrainingCamp;
  renderTrainingCamp=function(wrap){
    const p=ensurePotentialProfile();
    if(p.breakthroughPending&&Number(p.breakthroughDeferredYear)!==Number(careerState.seasonYear))return renderBreakthrough(wrap);
    const out=_renderTrainingPotential.call(this,wrap),d=profileDef(),b=offseasonState.trainingBreakdown||getTrainingPointBreakdown(careerState.age);
    const formula=wrap.querySelector('.training-breakdown');if(formula){const pf=Number(b.potentialFactor||currentGrowthFactor(careerState.age)),pb=Number(b.potentialBonus||0);formula.textContent=`基础 ${b.base} 点 × 赛季 ${Number(b.multiplier||1).toFixed(2)} × 潜力 ${pf.toFixed(2)}${pb?` + 曲线奖励 ${pb}`:''} = ${b.total} 点`;}
    const host=wrap.querySelector('.training-summary-grid')||wrap.querySelector('.meeting-note');
    if(host&&!wrap.querySelector('.potential-training-note')){
      const n=document.createElement('div');n.className='potential-training-note';n.innerHTML=`<strong>${d.icon} ${d.label}</strong><span>${phaseText(careerState.age)}</span><em>本年龄成长修正 ×${Number(b.potentialFactor||currentGrowthFactor(careerState.age)).toFixed(2)} · ${destinyText(p)}</em>`;
      host.insertAdjacentElement('afterend',n);
    }
    return out;
  };

  function potentialCardHtml(){const p=ensurePotentialProfile(),d=profileDef();return`<section class="potential-card"><div class="potential-icon">${d.icon}</div><div><div class="offseason-kicker">SCOUTING GROWTH REPORT · 成长底色</div><h3>${d.label} <small>${d.tone}</small></h3><p>${d.desc}</p><div class="potential-status"><span>${phaseText(careerState.age)}</span><span>${destinyText(p)}</span></div></div></section>`;}

  const _renderRevealPotential=renderRevealScreen;
  renderRevealScreen=function(...args){ensurePotentialProfile({newCareer:true});const out=_renderRevealPotential.apply(this,args);const tag=els.revealContent?.querySelector('.reveal-tag-card');if(tag&&!els.revealContent.querySelector('.potential-card'))tag.insertAdjacentHTML('afterend',potentialCardHtml());return out;};

  const _renderCareerOverviewPotential=renderCareerOverview;
  renderCareerOverview=function(...args){const out=_renderCareerOverviewPotential.apply(this,args),host=els.careerTabContent;if(host&&!host.querySelector('.potential-card'))host.insertAdjacentHTML('afterbegin',potentialCardHtml());return out;};

  const _renderRetiredPotential=renderRetiredCareerResume;
  renderRetiredCareerResume=function(...args){const out=_renderRetiredPotential.apply(this,args),host=document.getElementById('retiredResumeTotals')?.parentElement;if(host&&!host.querySelector('.potential-retired-line')){const p=ensurePotentialProfile(),d=profileDef(),n=document.createElement('div');n.className='potential-retired-line';n.innerHTML=`<strong>${d.icon} ${d.label}</strong><span>${p.destinyLevel>=2?'完成两次命运突破':p.destinyLevel===1?'完成一次命运突破':'职业生涯始终沿原始成长底色展开'}</span>`;host.appendChild(n);}return out;};

  // Small creation-screen hint. Potential itself is rolled only after the player confirms age/name.
  const ageWrap=document.querySelector('.age-input-wrap');
  if(ageWrap&&!document.getElementById('potentialCreateHint'))ageWrap.insertAdjacentHTML('afterend','<div class="potential-create-hint" id="potentialCreateHint"><span>🧬 成长底色</span><strong>确认角色后随机锁定</strong><small>天才少年 / 大器晚成 / 稳步成长 / 伤仲永 / 常青树。不能手选，但职业生涯可以把命运掰弯。</small></div>');

  // Old save safety + initial render.
  ensurePotentialProfile();

  window.__OWL_POTENTIAL={
    version:VERSION,profiles:PROFILES,ensure:()=>JSON.parse(JSON.stringify(ensurePotentialProfile())),
    factor:(age=careerState.age)=>currentGrowthFactor(Number(age)),decline:(age=careerState.age)=>declineFactor(ensurePotentialProfile().type,Number(age))*destinyDeclineFactor(),
    destinyText:()=>destinyText(),phaseText:(age=careerState.age)=>phaseText(Number(age)),
    qaForce:(type='steady',score=0,level=0)=>{careerState.potentialProfile=makeProfile(PROFILES[type]?type:'steady',Number(careerState.startAge||state.playerStartAge||16));careerState.potentialProfile.destinyScore=Number(score)||0;careerState.potentialProfile.destinyLevel=clampP(Number(level)||0,0,2);state.playerPotentialType=careerState.potentialProfile.type;return JSON.parse(JSON.stringify(careerState.potentialProfile));},
    qaScore:(record)=>scoreSeason(record),qaRoll:(age)=>rollType(Number(age)||16),qaChance:()=>breakthroughChance()
  };
})();
