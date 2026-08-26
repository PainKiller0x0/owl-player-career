/* ===== BUNDLE MODULE: systems/v74_dynamic_hero_mastery.js ===== */
/* ========================================================================== 
   V7.4 · 动态英雄熟练度 / 版本适应
   - 英雄熟练度不再出生即定型：实战使用会成长，长期不用会退化
   - 2024+ 每个Stage开始选择一次训练重点：招牌打磨 / 扩展英雄池 / 版本适应
   - 版本Meta会改变本图英雄优先级，但不直接改写基础总评
   - 高熟练区成长显著递减；年龄越大，反应型英雄长期不用时掉得更快
   - 新英雄按真实proYear进入职业池；刚进入职业赛时需要重新学习，不会凭空全员90+
   ========================================================================== */
  function v74HeroPlayerKey(player){
    if(player?.isUser)return `user|${player.role||state.role}`;
    return `${player?.name||'AI'}|${player?.role||'未知'}`;
  }
  function v74HeroStore(player){
    if(player?.isUser){
      careerState.heroProficiency=careerState.heroProficiency||{};
      return careerState.heroProficiency[player.role]||(careerState.heroProficiency[player.role]={});
    }
    careerState.aiHeroProficiency=careerState.aiHeroProficiency||{};
    const key=v74HeroPlayerKey(player);
    return careerState.aiHeroProficiency[key]||(careerState.aiHeroProficiency[key]={});
  }
  function v74HeroSeenStore(player){
    careerState.v74HeroSeen=careerState.v74HeroSeen||{};
    const key=v74HeroPlayerKey(player);
    return careerState.v74HeroSeen[key]||(careerState.v74HeroSeen[key]={});
  }
  function v74HeroUsageStore(player){
    careerState.v74HeroUsage=careerState.v74HeroUsage||{};
    const key=v74HeroPlayerKey(player);
    return careerState.v74HeroUsage[key]||(careerState.v74HeroUsage[key]={});
  }
  function v74PlayerPoolAptitude(player){
    if(player?.isUser)return Number(state.locked?.pool?.value||76);
    return Number(player?.attrs?.pool||player?.overall||76);
  }
  function v74PlayerAge(player){return player?.isUser?Number(careerState.age||18):Number(player?.age||21);}
  function v74LearningTalent(player){
    const seed=v71Hash01(`${v74HeroPlayerKey(player)}|learning`),pool=v74PlayerPoolAptitude(player);
    return clamp(.82+seed*.28+(pool-75)*.006,.72,1.28);
  }
  function v74NewHeroStartingValue(player,hero,baseValue,year){
    if(hero.proYear!==year)return baseValue;
    const aptitude=v74PlayerPoolAptitude(player),talent=v74LearningTalent(player),roll=v71Hash01(`${v74HeroPlayerKey(player)}|${hero.id}|launch`);
    return clamp(57+(aptitude-65)*.38+talent*5+roll*10,58,86);
  }

  // 把V7.1的确定性初始英雄池升级为持久可变存储；旧档第一次读取时自动继承已有值。
  const _v74HeroPoolBase=v71HeroPool;
  v71HeroPool=function(player,year=v71Year()){
    const store=v74HeroStore(player),seen=v74HeroSeenStore(player),knownBefore={};
    v71AvailableHeroes(year).filter(h=>h.group===v71RoleGroup(player.role)).forEach(h=>knownBefore[h.id]=Object.prototype.hasOwnProperty.call(store,h.id)||!!seen[h.id]);
    const raw=_v74HeroPoolBase(player,year);
    raw.forEach(h=>{
      if(!Number.isFinite(store[h.id]))store[h.id]=h.value;
      if(!knownBefore[h.id]&&!seen[h.id]){
        store[h.id]=v74NewHeroStartingValue(player,h,Number(store[h.id]),year);
        seen[h.id]={year,value:Number(store[h.id].toFixed(2))};
      }
    });
    // AI也会做阶段备战：不是只有主角在练英雄。训练幅度很小，主要防止AI英雄池永远冻结在出生那天。
    if(!player.isUser&&year>=2024){
      careerState.v74AiStagePrep=careerState.v74AiStagePrep||{};const stamp=`${year}-${v74StageNo()}`,pk=v74HeroPlayerKey(player),prep=careerState.v74AiStagePrep[pk]||(careerState.v74AiStagePrep[pk]={});
      if(!prep[stamp]){const candidates=raw.filter(h=>h.group===v71RoleGroup(player.role)).sort((a,b)=>v74MetaRaw(b,year,v74StageNo())-v74MetaRaw(a,year,v74StageNo()));const target=candidates[0],second=candidates[1],tal=v74LearningTalent(player);if(target)store[target.id]=clamp(Number(store[target.id]||target.value)+.28+.24*tal,55,99);if(second)store[second.id]=clamp(Number(store[second.id]||second.value)+.10,55,99);prep[stamp]=true;}
    }
    return raw.map(h=>{const value=clamp(Number(store[h.id]),55,99);store[h.id]=value;return {...h,value:Number(value.toFixed(1)),label:v71HeroLabel(value)};}).sort((a,b)=>b.value-a.value);
  };

  function v74StageNo(){return v71IsOwl2()?v71StageNo():Math.max(1,Math.min(4,Number(currentStageNumber?.()||1)));}
  function v74MetaRaw(hero,year=v71Year(),stage=v74StageNo()){
    if(year<2024)return 0;
    const balance=(v71Hash01(`${year}|${stage}|${hero.id}|balance`)-.5)*4.8;
    const seasonal=(v71Hash01(`${year}|${hero.id}|season-meta`)-.5)*2.0;
    const launch=hero.proYear===year?1.0:0;
    return clamp(balance+seasonal+launch,-3.2,4.2);
  }
  function v74MetaTier(score){return score>=2.7?'S':score>=1.1?'A':score>=-.4?'B':'C';}
  function v74MetaBoard(role=state.role,year=v71Year(),stage=v74StageNo()){
    const group=v71RoleGroup(role);
    return v71AvailableHeroes(year).filter(h=>h.group===group).map(h=>({...h,meta:v74MetaRaw(h,year,stage)})).sort((a,b)=>b.meta-a.meta);
  }
  const _v74HeroMapBonusBase=v71HeroMapBonus;
  v71HeroMapBonus=function(hero,map){
    const base=_v74HeroMapBonusBase(hero,map);
    return base+(v71Year()>=2024?v74MetaRaw(hero,v71Year(),v74StageNo()):0);
  };

  function v74FocusRoot(){
    careerState.heroTrainingFocus=careerState.heroTrainingFocus||{};
    const y=String(v71Year());
    return careerState.heroTrainingFocus[y]||(careerState.heroTrainingFocus[y]={});
  }
  function v74CurrentFocus(stage=v74StageNo()){return v74FocusRoot()[stage]||null;}
  function v74StageStart(stage){return stage===1?0:stage===2?19:37;}
  function v74CanChooseFocus(stage=v74StageNo()){
    if(!v71IsOwl2()||seasonState.played!==v74StageStart(stage)||seasonState.stageBreakPending)return false;
    if(stage===3&&seasonState.v71AllStarPending)return false;
    return !v74CurrentFocus(stage);
  }
  function v74HeroByName(player,name){return v71HeroPool(player).find(h=>h.name===name)||null;}
  function v74ApplyHeroDelta(player,heroName,delta,source='成长'){
    if(!heroName||!Number.isFinite(delta)||Math.abs(delta)<.001)return 0;
    const store=v74HeroStore(player),pool=v71HeroPool(player),hero=pool.find(h=>h.name===heroName);if(!hero)return 0;
    const before=Number(store[hero.id]??hero.value),after=clamp(before+delta,55,99),actual=after-before;
    store[hero.id]=after;
    if(player.isUser&&Math.abs(actual)>=.05){
      careerState.v74HeroGrowthLog=careerState.v74HeroGrowthLog||[];
      careerState.v74HeroGrowthLog.push({year:v71Year(),stage:v74StageNo(),hero:heroName,delta:Number(actual.toFixed(2)),source,before:Number(before.toFixed(1)),after:Number(after.toFixed(1))});
      careerState.v74HeroGrowthLog=careerState.v74HeroGrowthLog.slice(-180);
    }
    return actual;
  }
  function v74ExpansionTarget(player){
    const pool=v71HeroPool(player),meta=v74MetaBoard(player.role),metaMap=new Map(meta.map(h=>[h.name,h.meta]));
    const below=pool.filter(h=>h.value<78).sort((a,b)=>(metaMap.get(b.name)||0)-(metaMap.get(a.name)||0)||b.value-a.value);
    if(below.length)return below[0];
    return [...pool].sort((a,b)=>a.value-b.value)[0]||pool[0];
  }
  function v74ChooseStageFocus(type='meta',auto=false){
    const stage=v74StageNo();if(!v74CanChooseFocus(stage))return v74CurrentFocus(stage);
    const user=careerState.starters?.find(p=>p.isUser)||{isUser:true,name:getPlayerName(),role:state.role,attrs:Object.fromEntries(ATTRS.map(a=>[a.key,state.locked[a.key]?.value||75])),overall:Number(getMyOvr()==='--'?78:getMyOvr())};
    const pool=v71HeroPool(user),meta=v74MetaBoard(user.role),top=pool[0];let target=null,label='',extra=[];
    if(type==='signature'){
      target=top;label='招牌打磨';if(target)v74ApplyHeroDelta(user,target.name,.72,'Stage招牌训练');
    }else if(type==='expand'){
      target=v74ExpansionTarget(user);label='扩展英雄池';if(target)v74ApplyHeroDelta(user,target.name,target.value<78?1.35:.72,'Stage英雄池扩展');
    }else{
      target=pool.find(h=>h.name===meta[0]?.name)||top;label='版本适应';if(target)v74ApplyHeroDelta(user,target.name,.90,'Stage版本适应');
      const second=pool.find(h=>h.name===meta[1]?.name);if(second&&second.name!==target?.name){v74ApplyHeroDelta(user,second.name,.30,'Stage版本适应');extra.push(second.name);}
    }
    const rec={type,label,target:target?.name||'—',extra,year:v71Year(),stage,auto,chosenAt:seasonState.played};v74FocusRoot()[stage]=rec;
    if(auto){careerState.v74HeroGrowthLog=careerState.v74HeroGrowthLog||[];careerState.v74HeroGrowthLog.push({year:v71Year(),stage,hero:rec.target,delta:0,source:'未手动选择训练，教练自动安排版本适应'});}
    renderSeason();return rec;
  }
  function v74EnsureStageFocus(){if(v71IsOwl2()&&v74CanChooseFocus())return v74ChooseStageFocus('meta',true);return v74CurrentFocus();}

  function v74PracticeGain(player,heroValue,rating=6.7,won=false,heroName=''){
    const age=v74PlayerAge(player),talent=v74LearningTalent(player),pool=v74PlayerPoolAptitude(player);
    const base=heroValue<68?.105:heroValue<78?.078:heroValue<88?.052:heroValue<95?.031:.014;
    const ageMul=age<=19?1.28:age<=22?1.15:age<=24?1.04:age<=26?.94:age<=28?.82:.72;
    const performance=clamp(.82+(rating-6.2)*.10+(won?.05:0),.72,1.28),poolMul=clamp(.92+(pool-75)*.008,.78,1.18);
    let focusMul=1,focus=player.isUser?v74CurrentFocus():null;
    if(focus){if(focus.target===heroName)focusMul=focus.type==='expand'&&heroValue<78?1.85:1.42;else if(focus.type==='meta'&&focus.extra?.includes(heroName))focusMul=1.20;}
    return base*ageMul*talent*performance*poolMul*focusMul;
  }
  function v74RecordHeroUse(player,heroName,rating,won,source='正式比赛'){
    if(!heroName)return;
    const hero=v74HeroByName(player,heroName);if(!hero)return;
    const usage=v74HeroUsageStore(player),u=usage[heroName]||(usage[heroName]={maps:0,wins:0,ratingSum:0,seasonYear:null,seasonMaps:0,seasonWins:0,seasonRatingSum:0,lastSeason:null,lastStage:null});
    const year=v71Year();if(u.seasonYear!==year){u.seasonYear=year;u.seasonMaps=0;u.seasonWins=0;u.seasonRatingSum=0;}
    u.maps++;u.wins+=won?1:0;u.ratingSum+=Number(rating||6.5);u.seasonMaps++;u.seasonWins+=won?1:0;u.seasonRatingSum+=Number(rating||6.5);u.lastSeason=year;u.lastStage=v74StageNo();
    const gain=v74PracticeGain(player,hero.value,Number(rating||6.5),!!won,heroName);
    v74ApplyHeroDelta(player,heroName,gain,source);
  }
  function v74UsedHeroFor(player,map,side){
    if(v71HasStrategicDraft()&&matchState.currentBans&&typeof v73HeroPlans==='function'){
      const p=v73HeroPlans(player,map,side);return p.planB?.name||p.ideal?.name||null;
    }
    return v71BestHeroFor(player,map,[])?.name||null;
  }

  // 每张实际地图结算后积累英雄经验。最后一张同样会触发，不依赖advanceSeriesMapAfterResult。
  const _v74ApplyMapRatingsBase=applyMapRatings;
  applyMapRatings=function(side,roster,effective,won,forcedUserRating){
    _v74ApplyMapRatingsBase(side,roster,effective,won,forcedUserRating);
    const map=currentMatchMap();if(!map)return;
    roster.forEach(p=>{
      const vals=matchState.ratings?.[side]?.[p.id]||[],rating=vals.length?vals[vals.length-1]:6.5;
      v74RecordHeroUse(p,v74UsedHeroFor(p,map,side),rating,won,'实战地图');
    });
  };

  function v74AbstractMatchPractice(won,rating){
    if(v71Year()<2019)return;
    const user=careerState.starters?.find(p=>p.isUser);if(!user)return;
    v74EnsureStageFocus();
    const pool=v71HeroPool(user),meta=new Map(v74MetaBoard(user.role).map(h=>[h.name,h.meta]));
    const ranked=pool.map(h=>({...h,practiceScore:h.value*.55+(meta.get(h.name)||0)*5+v71Hash01(`${v71Year()}|${seasonState.played}|${h.name}|quick`)*6})).sort((a,b)=>b.practiceScore-a.practiceScore);
    const maps=3+(v71Hash01(`${v71Year()}|${seasonState.played}|maps`)> .58?1:0);
    for(let i=0;i<maps;i++){const hero=i<2?ranked[0]:ranked[Math.min(1+(i%Math.min(3,Math.max(1,ranked.length-1))),ranked.length-1)];if(hero)v74RecordHeroUse(user,hero.name,rating,won,'快速比赛训练量');}
  }

  const _v74SingleRegularBase=simulateSingleRegularMatch;
  simulateSingleRegularMatch=function(){
    const before=seasonState.played,w=seasonState.wins,r=seasonState.userRatings.length;v74EnsureStageFocus();const out=_v74SingleRegularBase();
    if(seasonState.played>before&&seasonState.userRatings.length>r){const rating=seasonState.userRatings[r];v74AbstractMatchPractice(seasonState.wins>w,rating);}return out;
  };
  const _v74FastSeasonStepBase=fastSeasonStep;
  fastSeasonStep=function(){
    const before=seasonState.played,w=seasonState.wins,r=seasonState.userRatings.length;v74EnsureStageFocus();const out=_v74FastSeasonStepBase();
    if(seasonState.played>before&&seasonState.userRatings.length>r){const rating=seasonState.userRatings[r];v74AbstractMatchPractice(seasonState.wins>w,rating);}return out;
  };
  const _v74SilentRegularBase=v32SilentRegularGame;
  v32SilentRegularGame=function(){
    const before=seasonState.played,w=seasonState.wins,r=seasonState.userRatings.length;v74EnsureStageFocus();const out=_v74SilentRegularBase();
    if(seasonState.played>before&&seasonState.userRatings.length>r){const rating=seasonState.userRatings[r];v74AbstractMatchPractice(seasonState.wins>w,rating);}return out;
  };
  const _v74OpenSeasonMatchBase=openNextSeasonMatch;
  openNextSeasonMatch=function(){v74EnsureStageFocus();return _v74OpenSeasonMatchBase();};

  function v74MechanicalHero(name){return /猎空|源氏|黑百合|索杰恩|探奇|弗蕾娅|斩仇|D\.Va|温斯顿|破坏球|末日铁拳|卢西奥|朱诺|安燃|飞天猫/.test(name);}
  function v74ApplySeasonDecay(nextAge){
    const year=v71Year();careerState.v74HeroDecayApplied=careerState.v74HeroDecayApplied||{};if(careerState.v74HeroDecayApplied[year])return;
    const user=careerState.starters?.find(p=>p.isUser)||{isUser:true,name:getPlayerName(),role:state.role,attrs:{pool:state.locked.pool?.value||75}};
    const usage=v74HeroUsageStore(user),pool=v71HeroPool(user,year),changes=[];
    pool.forEach(h=>{
      const u=usage[h.name],maps=u?.seasonYear===year?Number(u.seasonMaps||0):0,last=u?.lastSeason;
      let decay=maps>=8?0:maps>=3?.16:maps>0?.34:.62;
      if(h.value>=95&&maps<5)decay+=.22;
      if(last!=null&&year-last>=2)decay+=Math.min(.75,(year-last-1)*.28);
      if(nextAge>=25&&v74MechanicalHero(h.name)&&maps<8)decay+=Math.min(.72,(nextAge-24)*.09);
      if(h.value<68)decay*=.55;
      if(decay>.03){const actual=v74ApplyHeroDelta(user,h.name,-decay,'休赛期长期不用/年龄衰减');if(actual<-.03)changes.push({hero:h.name,delta:actual,maps});}
    });
    careerState.v74HeroDecayApplied[year]={changes,age:nextAge};
  }

  // 赛季重开恢复赛季开始时英雄池，防止靠反复重开刷实战成长。
  function v74SnapshotUserHeroes(){
    const user=careerState.starters?.find(p=>p.isUser);if(!user)return null;
    return {role:user.role,skills:{...v74HeroStore(user)},usage:JSON.parse(JSON.stringify(v74HeroUsageStore(user))),focus:JSON.parse(JSON.stringify(careerState.heroTrainingFocus||{}))};
  }
  function v74RestoreUserHeroes(snap){
    if(!snap)return;careerState.heroProficiency=careerState.heroProficiency||{};careerState.heroProficiency[snap.role]={...snap.skills};
    careerState.v74HeroUsage=careerState.v74HeroUsage||{};careerState.v74HeroUsage[`user|${snap.role}`]=JSON.parse(JSON.stringify(snap.usage||{}));careerState.heroTrainingFocus=JSON.parse(JSON.stringify(snap.focus||{}));
  }
  const _v74SetupSeasonBase=setupSeason;
  setupSeason=function(isRestart=false){
    if(isRestart)v74RestoreUserHeroes(seasonState.v74HeroBaseline);
    const out=_v74SetupSeasonBase(isRestart);
    if(!isRestart||!seasonState.v74HeroBaseline)seasonState.v74HeroBaseline=v74SnapshotUserHeroes();
    careerState.v74SeasonHeroBaseline=careerState.v74SeasonHeroBaseline||{};const user=careerState.starters?.find(p=>p.isUser);if(user&&!careerState.v74SeasonHeroBaseline[v71Year()])careerState.v74SeasonHeroBaseline[v71Year()]={...v74HeroStore(user)};
    return out;
  };

  const _v74PrepareTrainingBase=prepareTrainingCamp;
  prepareTrainingCamp=function(nextAge){v74ApplySeasonDecay(nextAge);return _v74PrepareTrainingBase(nextAge);};

  function v74UserHero(){return careerState.starters?.find(p=>p.isUser)||{isUser:true,name:getPlayerName(),role:state.role,attrs:{pool:state.locked.pool?.value||75},overall:Number(getMyOvr()==='--'?78:getMyOvr())};}
  function v74SeasonHeroDelta(hero){
    const base=careerState.v74SeasonHeroBaseline?.[v71Year()]?.[hero.id];return Number.isFinite(base)?hero.value-base:0;
  }
  function v74FocusDesc(f){
    if(!f)return '尚未选择';if(f.type==='signature')return `招牌打磨 · ${f.target}`;if(f.type==='expand')return `扩展英雄池 · ${f.target}`;return `版本适应 · ${f.target}${f.extra?.length?' / '+f.extra.join(' / '):''}`;
  }
  function v74RenderSeasonHeroPanel(){
    if(!v71IsOwl2()||!careerState.team)return;
    const complete=document.getElementById('seasonCompleteArea');if(!complete?.parentNode)return;
    let panel=document.getElementById('v74HeroDevelopmentPanel');if(!panel){panel=document.createElement('section');panel.id='v74HeroDevelopmentPanel';panel.className='v74-hero-dev';complete.parentNode.insertBefore(panel,complete);}
    const user=v74UserHero(),stage=v74StageNo(),focus=v74CurrentFocus(stage),can=v74CanChooseFocus(stage),pool=v71HeroPool(user).slice(0,8),meta=v74MetaBoard(user.role).slice(0,5);
    const expand=v74ExpansionTarget(user);
    panel.innerHTML=`<div class="v74-head"><div><span>HERO MASTERY · Stage ${stage}</span><h3>英雄池成长</h3><p>实战提升熟练度，长期不用会掉手感；高熟练度成长更慢。</p></div><div class="v74-focus-now"><small>本阶段训练</small><strong>${v74FocusDesc(focus)}</strong></div></div>
      <div class="v74-meta"><span>本阶段版本趋势</span>${meta.map(h=>`<b class="tier-${v74MetaTier(h.meta)}">${h.name} · ${v74MetaTier(h.meta)}</b>`).join('')}</div>
      <div class="v74-hero-grid">${pool.map(h=>{const d=v74SeasonHeroDelta(h);return `<div class="v74-hero-item"><span>${h.name}</span><strong>${h.value.toFixed(1)}</strong><em>${h.label}${Math.abs(d)>=.05?` · ${d>0?'+':''}${d.toFixed(1)}`:''}</em></div>`;}).join('')}</div>
      ${focus?'':can?`<div class="v74-focus-actions"><button data-v74-focus="signature"><strong>🎯 招牌打磨</strong><span>${pool[0]?.name||'招牌英雄'}继续冲上限</span></button><button data-v74-focus="expand"><strong>🧰 扩展英雄池</strong><span>${expand?.name||'弱项'}优先补到可用线</span></button><button data-v74-focus="meta"><strong>🔥 版本适应</strong><span>围绕当前强势英雄准备</span></button></div>`:`<div class="v74-locked">下一次训练重点将在下个Stage正式开始后开放。</div>`}`;
    panel.querySelectorAll('[data-v74-focus]').forEach(btn=>btn.addEventListener('click',()=>v74ChooseStageFocus(btn.dataset.v74Focus,false)));
  }
  const _v74RenderSeasonBase=renderSeason;
  renderSeason=function(){_v74RenderSeasonBase();v74RenderSeasonHeroPanel();};

  const _v74RenderTrainingBase=renderTrainingCamp;
  renderTrainingCamp=function(wrap){
    _v74RenderTrainingBase(wrap);if(v71Year()<2024)return;
    const user=v74UserHero(),pool=v71HeroPool(user).slice(0,10),decay=careerState.v74HeroDecayApplied?.[v71Year()]?.changes||[];
    const block=document.createElement('div');block.className='v74-offseason-heroes';
    block.innerHTML=`<div class="offseason-kicker">HERO POOL · 英雄池结算</div><h4>英雄池结算</h4><p>常用英雄更容易保持熟练度；长期不用会回落。</p><div class="v74-offseason-grid">${pool.map(h=>`<span>${h.name}<b>${h.value.toFixed(1)}</b><small>${h.label}</small></span>`).join('')}</div><div class="v74-decay-note">${decay.length?`本休赛期手感回落：${decay.sort((a,b)=>a.delta-b.delta).slice(0,6).map(x=>`${x.hero} ${x.delta.toFixed(1)}`).join('、')}`:'✓ 本休赛期没有明显英雄熟练度衰减。'}</div>`;
    const actions=wrap.querySelector('.training-actions');if(actions)wrap.insertBefore(block,actions);else wrap.appendChild(block);
  };

  const _v74RecordSeasonBase=recordCompletedCareerSeason;
  recordCompletedCareerSeason=function(){
    const before=careerState.careerArchive?.length||0;const out=_v74RecordSeasonBase();
    if((careerState.careerArchive?.length||0)>before){const rec=careerState.careerArchive[careerState.careerArchive.length-1],user=v74UserHero();rec.heroPool=v71HeroPool(user,careerState.seasonYear).slice(0,8).map(h=>({name:h.name,value:h.value,label:h.label}));rec.heroGrowth=(careerState.v74HeroGrowthLog||[]).filter(x=>x.year===careerState.seasonYear);}
    return out;
  };

  window.__OWL_V74_DIAGNOSTICS=()=>{
    const user=v74UserHero(),pool=v71HeroPool(user),stage=v74StageNo(),meta=v74MetaBoard(user.role).slice(0,5);
    return {version:'7.4',year:v71Year(),stage,focus:v74CurrentFocus(stage),topHeroes:pool.slice(0,6).map(h=>({name:h.name,value:h.value,label:h.label})),meta:meta.map(h=>({name:h.name,tier:v74MetaTier(h.meta),score:Number(h.meta.toFixed(2))})),usage:v74HeroUsageStore(user)};
  };

  if(!document.getElementById('v74HeroStyle')){const st=document.createElement('style');st.id='v74HeroStyle';st.textContent=`.v74-hero-dev{margin-top:14px;padding:16px;border:1px solid var(--line);border-radius:22px;background:linear-gradient(145deg,rgba(255,122,67,.07),rgba(44,110,170,.05))}.v74-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start}.v74-head>div:first-child span{font-size:10px;color:var(--accent);font-weight:900;letter-spacing:.1em}.v74-head h3{margin:4px 0;font-size:20px}.v74-head p{margin:0;color:var(--muted);font-size:11px;line-height:1.6;max-width:720px}.v74-focus-now{text-align:right;min-width:170px}.v74-focus-now small{display:block;color:var(--muted);font-size:9px}.v74-focus-now strong{display:block;margin-top:4px;font-size:12px}.v74-meta{display:flex;gap:5px;align-items:center;flex-wrap:wrap;margin:11px 0}.v74-meta>span{font-size:10px;color:var(--muted);margin-right:3px}.v74-meta b{font-size:9px;border-radius:999px;padding:3px 7px;border:1px solid var(--line)}.v74-meta .tier-S{color:#c04d2f;background:rgba(255,100,56,.10)}.v74-meta .tier-A{color:#94711f}.v74-hero-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.v74-hero-item{padding:8px 9px;border:1px solid var(--line);border-radius:12px;background:rgba(255,255,255,.5)}.v74-hero-item span,.v74-hero-item em{display:block;font-size:9px;color:var(--muted);font-style:normal}.v74-hero-item strong{display:block;font-size:18px;margin:2px 0}.v74-focus-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:11px}.v74-focus-actions button{padding:10px;text-align:left;border:1px solid var(--line);border-radius:13px;background:var(--panel);color:var(--ink);cursor:pointer}.v74-focus-actions button:hover{border-color:var(--accent);transform:translateY(-1px)}.v74-focus-actions strong,.v74-focus-actions span{display:block}.v74-focus-actions strong{font-size:11px}.v74-focus-actions span{font-size:9px;color:var(--muted);margin-top:3px}.v74-locked{margin-top:9px;color:var(--muted);font-size:10px}.v74-offseason-heroes{margin:14px 0;padding:15px;border:1px solid var(--line);border-radius:18px;background:rgba(44,110,170,.045)}.v74-offseason-heroes h4{margin:5px 0;font-size:17px}.v74-offseason-heroes p{margin:0 0 10px;color:var(--muted);font-size:11px;line-height:1.65}.v74-offseason-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}.v74-offseason-grid>span{padding:7px;border:1px solid var(--line);border-radius:10px;font-size:9px;color:var(--muted)}.v74-offseason-grid b,.v74-offseason-grid small{display:block}.v74-offseason-grid b{font-size:16px;color:var(--ink);margin:2px 0}.v74-decay-note{margin-top:9px;font-size:10px;color:var(--muted)}html[data-theme="dark"] .v74-hero-item,html[data-theme="dark"] .v74-offseason-heroes{background:rgba(255,255,255,.04)}@media(max-width:760px){.v74-head{display:block}.v74-focus-now{text-align:left;margin-top:8px}.v74-hero-grid{grid-template-columns:repeat(2,1fr)}.v74-focus-actions{grid-template-columns:1fr}.v74-offseason-grid{grid-template-columns:repeat(2,1fr)}}`;document.head.appendChild(st);}


/* ===== HOTFIX V7.4.1: OWL2 Major stage UI / live standings / 3-stage track ===== */
  function v741Owl2Teams(){
    v71EnsureOwl2Teams();
    return TEAMS.filter(t=>t&&t.active!==false);
  }
  function v741MeanStrength(teams){
    const arr=(teams||[]).map(t=>Number(t.strength)||80);
    return arr.length?arr.reduce((a,b)=>a+b,0)/arr.length:80;
  }
  function v741LiveStandings(){
    const teams=v741Owl2Teams(),played=Math.max(0,Number(seasonState.played)||0),year=v71Year(),mean=v741MeanStrength(teams);
    if(!played)return teams.map((team,i)=>({team,wins:0,losses:0,mapDiff:0,isUser:team.name===careerState.team?.name,rank:i+1}));
    const userWins=clamp(Number(seasonState.wins)||0,0,played),userLosses=Math.max(0,played-userWins);
    const rows=teams.map(team=>{
      const isUser=team.name===careerState.team?.name;
      if(isUser){
        const avg=getSeasonAverageRating?.()||7;
        return {team,isUser,wins:userWins,losses:userLosses,mapDiff:Math.round((userWins-userLosses)*2.15+(avg-7)*3.5),lp:userWins+Number(seasonState.majorBonusLP||0)};
      }
      const delta=(Number(team.strength)||mean)-mean;
      const rate=clamp(.50+delta*.017+stableSeasonNoise(team.name,year*101+played,5)*.009,.24,.76);
      const wins=clamp(Math.round(played*rate),0,played),losses=played-wins;
      const major=clamp(Math.round(Math.max(0,delta)/4+stableSeasonNoise(team.name,year+played*17,6)),0,8);
      return {team,isUser,wins,losses,mapDiff:Math.round((wins-losses)*2+stableSeasonNoise(team.name,year+played*17,6)),lp:wins+major};
    });
    rows.sort((a,b)=>b.wins-a.wins||b.mapDiff-a.mapDiff||(Number(b.team.strength)||80)-(Number(a.team.strength)||80));
    rows.forEach((r,i)=>r.rank=i+1);
    return rows;
  }

  const _v741EstimateSeasonRankBase=estimateSeasonRank;
  estimateSeasonRank=function(){
    if(!v71IsOwl2())return _v741EstimateSeasonRankBase();
    if(!seasonState.played)return careerState.rank||7;
    if(seasonState.played>=seasonState.total){
      return syntheticFinalStandings().find(r=>r.isUser||r.team?.name===careerState.team?.name)?.rank||20;
    }
    return v741LiveStandings().find(r=>r.isUser)?.rank||20;
  };

  const _v741SyntheticFinalBase=syntheticFinalStandings;
  syntheticFinalStandings=function(){
    if(!v71IsOwl2())return _v741SyntheticFinalBase();
    if(seasonState.v741FinalStandingsCache)return seasonState.v741FinalStandingsCache;
    const teams=v741Owl2Teams(),year=v71Year(),mean=v741MeanStrength(teams),userLP=(Number(seasonState.wins)||0)+(Number(seasonState.majorBonusLP)||0);
    const rows=teams.map(team=>{
      const isUser=team.name===careerState.team?.name;
      if(isUser){
        const wins=Number(seasonState.wins)||0,losses=Math.max(0,56-wins),avg=getSeasonAverageRating?.()||7;
        return {team,isUser,wins,losses,mapDiff:Math.round((wins-losses)*2.1+(avg-7)*4),lp:userLP};
      }
      const delta=(Number(team.strength)||mean)-mean;
      const rate=clamp(.50+delta*.017+stableSeasonNoise(team.name,year*131,5)*.009,.24,.76);
      const wins=clamp(Math.round(56*rate),10,46),losses=56-wins;
      const major=clamp(Math.round(Math.max(0,delta)/4+stableSeasonNoise(team.name,year+881,3)),0,8);
      return {team,isUser,wins,losses,mapDiff:Math.round((wins-losses)*2+stableSeasonNoise(team.name,year+177,7)),lp:wins+major};
    }).sort((a,b)=>b.lp-a.lp||b.wins-a.wins||b.mapDiff-a.mapDiff||(Number(b.team.strength)||80)-(Number(a.team.strength)||80));
    rows.forEach((r,i)=>{r.rank=i+1;r.direct=i<8;});
    seasonState.v741FinalStandingsCache=rows;
    return rows;
  };

  function v741StageVisual(stageNo){
    const [start,end]=v71StageBounds(stageNo),len=end-start,played=clamp((Number(seasonState.played)||0)-start,0,len),rec=stageRecord(stageNo),processed=(seasonState.stageProcessed||[]).includes(stageNo),active=v71StageNo()===stageNo&&seasonState.played<v71SeasonFormat().total;
    const dots=Array.from({length:len},(_,j)=>{
      const i=start+j,r=seasonState.results[i],opp=seasonState.opponents?.[i];
      return `<i class="season-dot ${r||''} ${i===seasonState.played&&seasonState.played<v71SeasonFormat().total?'current':''}" title="Stage ${stageNo} · 第${j+1}场${opp?' · '+opp.name:''}"></i>`;
    }).join('');
    return `<div class="stage-dot-group ${active?'active':''} ${processed?'done':''}" style="--stage-len:${len}"><div class="stage-dot-head"><b>STAGE ${stageNo}</b><span>${rec.wins}-${rec.losses} · ${played}/${len}</span><em>${processed?'已完成':active?'进行中':'待开始'}</em></div><div class="stage-dot-row">${dots}</div></div>`;
  }
  function v741InlineArea(){
    const track=document.querySelector('#seasonScreen .season-track-card'),actions=track?.querySelector('.season-actions');
    if(!track||!actions)return null;
    let box=document.getElementById('v741SeasonInlineMilestone');
    if(!box){box=document.createElement('div');box.id='v741SeasonInlineMilestone';box.className='v741-season-inline-milestone';track.insertBefore(box,actions);}
    return box;
  }
  function v741FixSeasonUi(){
    if(!v71IsOwl2()||!careerState.team)return;
    const dots=document.getElementById('seasonDots');
    if(dots){dots.classList.add('owl2-stage-dots');dots.innerHTML=[1,2,3].map(v741StageVisual).join('');}
    const rank=document.getElementById('seasonRankText');if(rank)rank.textContent=seasonState.played?`第 ${estimateSeasonRank()}`:'—';

    const inline=v741InlineArea(),bottom=document.getElementById('seasonCompleteArea'),milestone=!!seasonState.stageBreakPending||!!seasonState.v71LastMajorSummary;
    if(inline){
      inline.innerHTML='';
      if(seasonState.stageBreakPending&&bottom){
        while(bottom.firstChild)inline.appendChild(bottom.firstChild);inline.classList.add('show');
      }else if(seasonState.v71LastMajorSummary){
        const h=seasonState.v71LastMajorSummary,oldMajor=bottom?.querySelector('.v71-major-result');
        if(oldMajor){while(bottom.firstChild)inline.appendChild(bottom.firstChild);}
        else{
          const slot=h.championConference==='East'?'东5西3':'东3西5';
          inline.innerHTML=`<div class="stage-break-card v71-major-result"><div class="offseason-kicker">MAJOR ${h.stage} · FINAL</div><h3>🏆 ${h.champion}</h3><p>${v71ConferenceZh(h.championConference)}赢下Major；下一届Major席位变为 ${slot}。你的成绩：<strong>${h.result}</strong>${h.bonusLP?` · +${h.bonusLP} LP`:''}</p><button class="primary-btn" id="v741ContinueMajorBtn">继续赛季 →</button></div>`;
          if(bottom)bottom.innerHTML='';
          document.getElementById('v741ContinueMajorBtn')?.addEventListener('click',()=>{seasonState.v71LastMajorSummary=null;renderSeason();});
        }
        inline.classList.add('show');
      }else inline.classList.remove('show');
    }
    document.querySelector('#seasonScreen .season-track-card .season-actions')?.classList.toggle('v741-milestone-blocked',milestone);
  }

  const _v741RenderSeasonBase=renderSeason;
  renderSeason=function(){_v741RenderSeasonBase();v741FixSeasonUi();};

  const _v741RunMajorBase=v71RunMajor;
  v71RunMajor=function(stageNo){seasonState.v741FinalStandingsCache=null;const out=_v741RunMajorBase(stageNo);seasonState.v741FinalStandingsCache=null;return out;};
  const _v741SetupSeasonBase=setupSeason;
  setupSeason=function(isRestart=false){const out=_v741SetupSeasonBase(isRestart);seasonState.v741FinalStandingsCache=null;return out;};

  window.__OWL_V741_DIAGNOSTICS=()=>({version:'7.4.1',year:v71Year(),played:seasonState.played,wins:seasonState.wins,rank:estimateSeasonRank(),stage:v71IsOwl2()?v71StageNo():null,inlineMajor:!!document.getElementById('v741SeasonInlineMilestone')?.classList.contains('show'),liveTop5:v71IsOwl2()?v741LiveStandings().slice(0,5).map(r=>`${r.rank}.${r.team.short||r.team.name}:${r.wins}-${r.losses}`):[]});

  if(!document.getElementById('v741Style')){const st=document.createElement('style');st.id='v741Style';st.textContent=`
    #seasonDots.owl2-stage-dots{display:flex!important;flex-direction:column;gap:8px!important;max-width:760px!important;margin:10px auto 14px!important}
    #seasonDots.owl2-stage-dots .stage-dot-group{display:grid!important;grid-template-columns:118px minmax(0,1fr);align-items:center;gap:12px;padding:8px 11px!important;border:1px solid var(--line);border-radius:13px;background:rgba(255,255,255,.38);min-width:0;transition:.2s ease}
    #seasonDots.owl2-stage-dots .stage-dot-group.active{border-color:rgba(255,139,78,.7);box-shadow:0 0 0 3px rgba(255,139,78,.08);background:rgba(255,139,78,.045)}
    #seasonDots.owl2-stage-dots .stage-dot-group.done{opacity:.88}
    #seasonDots.owl2-stage-dots .stage-dot-head{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:2px 8px;min-width:0}
    #seasonDots.owl2-stage-dots .stage-dot-head b{margin:0!important;color:var(--ink);font-size:10px;letter-spacing:.08em}
    #seasonDots.owl2-stage-dots .stage-dot-head span{justify-self:end;font-size:9px;color:var(--muted);white-space:nowrap}
    #seasonDots.owl2-stage-dots .stage-dot-head em{grid-column:1/-1;font-style:normal;font-size:8px;color:var(--muted)}
    #seasonDots.owl2-stage-dots .stage-dot-group.active .stage-dot-head em{color:#e76f34;font-weight:800}
    #seasonDots.owl2-stage-dots .stage-dot-row{display:grid!important;grid-template-columns:repeat(var(--stage-len),minmax(0,1fr))!important;gap:5px!important;align-items:center;min-width:0}
    #seasonDots.owl2-stage-dots .stage-dot-row .season-dot{width:11px!important;height:11px!important;min-width:11px!important;border-width:2px!important;justify-self:center!important}
    #seasonDots.owl2-stage-dots .stage-dot-row .season-dot.current{transform:scale(1.22)!important;box-shadow:0 0 0 4px rgba(255,139,78,.13)!important}
    #seasonDots.owl2-stage-dots .stage-dot-row .season-dot.current::after{inset:-4px!important;border-width:1px!important}
    .v741-season-inline-milestone{display:none;margin:4px 0 12px}.v741-season-inline-milestone.show{display:block}
    .v741-season-inline-milestone .stage-break-card,.v741-season-inline-milestone .season-complete-banner{margin:0!important;box-shadow:none!important}
    #seasonScreen .season-actions.v741-milestone-blocked{display:none!important}
    html[data-theme="dark"] #seasonDots.owl2-stage-dots .stage-dot-group{background:#232a35;border-color:#3b4452}
    html[data-theme="dark"] #seasonDots.owl2-stage-dots .stage-dot-group.active{background:rgba(255,139,78,.08);border-color:rgba(255,139,78,.55)}
    @media(max-width:720px){#seasonDots.owl2-stage-dots .stage-dot-group{grid-template-columns:1fr;gap:6px;padding:8px!important}#seasonDots.owl2-stage-dots .stage-dot-head{grid-template-columns:auto auto 1fr}#seasonDots.owl2-stage-dots .stage-dot-head span{justify-self:start}#seasonDots.owl2-stage-dots .stage-dot-head em{grid-column:auto;justify-self:end}#seasonDots.owl2-stage-dots .stage-dot-row{gap:3px!important}#seasonDots.owl2-stage-dots .stage-dot-row .season-dot{width:8px!important;height:8px!important;min-width:8px!important;border-width:1px!important}}
  `;document.head.appendChild(st);}


/* ===== HOTFIX: V7.4.2 · Major Continue State Machine ===== */
(function(){
  function v742ResumeAfterMajor(){
    const h=seasonState.v71LastMajorSummary;
    if(!h){
      renderSeason();
      return;
    }
    const stage=Number(h.stage)||0;
    seasonState.v71LastMajorSummary=null;
    seasonState.stageBreakPending=null;
    seasonState.simulating=false;
    if(seasonState.timer){clearTimeout(seasonState.timer);seasonState.timer=null;}
    if(stage && !(seasonState.stageProcessed||[]).includes(stage)){
      seasonState.stageProcessed=seasonState.stageProcessed||[];
      seasonState.stageProcessed.push(stage);
    }
    // Major 2之后先进入全明星周末；其余Major直接返回常规赛。
    if(stage===2 && seasonState.v71AllStarPending && typeof v71OpenAllStarWeekend==='function'){
      v71OpenAllStarWeekend();
      return;
    }
    renderSeason();
    requestAnimationFrame(()=>{
      const actions=document.querySelector('#seasonScreen .season-track-card .season-actions');
      actions?.classList.remove('v741-milestone-blocked');
      const inline=document.getElementById('v741SeasonInlineMilestone');
      if(inline&&!seasonState.stageBreakPending&&!seasonState.v71LastMajorSummary){inline.innerHTML='';inline.classList.remove('show');}
    });
  }

  // 使用捕获阶段委托，避免Major卡被旧版兼容层移动DOM后丢失click handler。
  document.addEventListener('click',function(e){
    const btn=e.target?.closest?.('#v71ContinueMajorBtn,#v741ContinueMajorBtn,#v742ContinueMajorBtn');
    if(!btn)return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    v742ResumeAfterMajor();
  },true);

  // 将V7.4.1临时生成按钮统一换成稳定ID，并取消对单节点监听器的依赖。
  const _v742FixSeasonUiBase=v741FixSeasonUi;
  v741FixSeasonUi=function(){
    _v742FixSeasonUiBase();
    const btn=document.querySelector('#v741SeasonInlineMilestone #v741ContinueMajorBtn');
    if(btn){btn.id='v742ContinueMajorBtn';btn.type='button';btn.disabled=false;}
    const legacy=document.querySelector('#v741SeasonInlineMilestone #v71ContinueMajorBtn');
    if(legacy){legacy.type='button';legacy.disabled=false;}
  };

  const _v742RenderSeasonBase=renderSeason;
  renderSeason=function(){_v742RenderSeasonBase();v741FixSeasonUi();};


  /* V8 Public Beta · offseason hero-specialization API */
  window.__OWL_V800_HERO_IO={
    pool:(year=v71Year()+1)=>{
      const user=v74UserHero();
      return v71HeroPool(user,Number(year)).map(h=>({id:h.id,name:h.name,value:h.value,label:h.label,proYear:h.proYear,group:h.group}));
    },
    train:(names=[],year=v71Year()+1)=>{
      const user=v74UserHero(),pool=v71HeroPool(user,Number(year)),store=v74HeroStore(user);
      const unique=[...new Set((names||[]).filter(Boolean))].slice(0,2),results=[];
      const locked=state.locked||{},attrAvg=['mechanics','decision','pool'].map(k=>Number(locked[k]?.value||75)).reduce((a,b)=>a+b,0)/3;
      const condition=Number(careerState.condition||70);
      const aptitude=clamp(.90+(attrAvg-72)*.006,.88,1.12);
      const stateFactor=clamp(.94+(condition-65)*.0025,.90,1.10);
      const potentialFactor=clamp(Number(window.__OWL_POTENTIAL?.factor?.(careerState.age)||1),.82,1.22);
      unique.forEach((name,index)=>{
        const h=pool.find(x=>x.name===name);if(!h)return;
        const before=Number(store[h.id]??h.value);
        // 休赛期专项：60+/70+/80+/90+ 基础成长分别为 7/5/3/2；副练保留主副差异。
        const tierBase=before>=90?2:before>=80?3:before>=70?5:7;
        const roleFactor=index===0?1:.72;
        const gain=tierBase*roleFactor*aptitude*stateFactor*potentialFactor;
        const after=clamp(before+gain,55,99);store[h.id]=after;
        const actual=after-before;
        careerState.v74HeroGrowthLog=careerState.v74HeroGrowthLog||[];
        careerState.v74HeroGrowthLog.push({year:v71Year(),stage:0,hero:h.name,delta:Number(actual.toFixed(2)),source:index===0?'休赛期主练英雄':'休赛期副练英雄',before:Number(before.toFixed(1)),after:Number(after.toFixed(1))});
        results.push({name:h.name,before:Number(before.toFixed(1)),after:Number(after.toFixed(1)),delta:Number(actual.toFixed(2)),primary:index===0,newHero:Number(h.proYear)===Number(year),tierBase,aptitude:Number(aptitude.toFixed(2)),stateFactor:Number(stateFactor.toFixed(2)),potentialFactor:Number(potentialFactor.toFixed(2))});
      });
      careerState.v74HeroGrowthLog=careerState.v74HeroGrowthLog.slice(-220);
      return results;
    },
    boost:(name,base=3,source='赛季中特训')=>{
      const user=v74UserHero(),pool=v71HeroPool(user,Number(v71Year())),store=v74HeroStore(user),h=pool.find(x=>x.name===name);if(!h)return null;
      const before=Number(store[h.id]??h.value),locked=state.locked||{};
      const attrAvg=['mechanics','decision','pool'].map(k=>Number(locked[k]?.value||75)).reduce((a,b)=>a+b,0)/3;
      const condition=Number(careerState.condition||70),aptitude=clamp(.90+(attrAvg-72)*.006,.88,1.12),stateFactor=clamp(.94+(condition-65)*.0025,.90,1.10);
      const lowMastery=before<70?1.25:before<80?1.12:before<90?1:.82;
      const gain=Number(base||3)*aptitude*stateFactor*lowMastery;
      const after=clamp(before+gain,55,99);store[h.id]=after;const actual=after-before;
      careerState.v74HeroGrowthLog=careerState.v74HeroGrowthLog||[];careerState.v74HeroGrowthLog.push({year:v71Year(),stage:typeof currentStageNumber==='function'?currentStageNumber():0,hero:h.name,delta:Number(actual.toFixed(2)),source,before:Number(before.toFixed(1)),after:Number(after.toFixed(1))});careerState.v74HeroGrowthLog=careerState.v74HeroGrowthLog.slice(-220);
      return{name:h.name,before:Number(before.toFixed(1)),after:Number(after.toFixed(1)),delta:Number(actual.toFixed(2)),source};
    },
    qaSet:(name,value,year=v71Year())=>{
      const user=v74UserHero(),pool=v71HeroPool(user,Number(year)),store=v74HeroStore(user),h=pool.find(x=>x.name===name);if(!h)return null;
      store[h.id]=clamp(Number(value)||55,55,99);return{name:h.name,value:Number(store[h.id].toFixed(1))};
    }
  };

  window.__OWL_V742_DIAGNOSTICS=()=>({
    version:'7.4.2',
    year:v71Year(),
    played:seasonState.played,
    stage:v71IsOwl2()?v71StageNo():null,
    majorSummary:seasonState.v71LastMajorSummary?{stage:seasonState.v71LastMajorSummary.stage,result:seasonState.v71LastMajorSummary.result}:null,
    continueButton:document.querySelector('#v71ContinueMajorBtn,#v741ContinueMajorBtn,#v742ContinueMajorBtn')?.id||null,
    actionsHidden:document.querySelector('#seasonScreen .season-actions')?.classList.contains('v741-milestone-blocked')||false
  });
})();


/* ===== HOTFIX: V7.4.3 · Stage milestone idempotency / developer season skip ===== */
(function(){
  function v743StageCardHtml(stageNo){
    const rec=stageRecord(stageNo),rank=stageEstimatedRank(stageNo),q=(typeof stageQualified==='function'?stageQualified(stageNo):rank<=8),slots=v71MajorSlots();
    const slotText=`东部${slots.East}席 / 西部${slots.West}席`;
    return `<div class="stage-break-card" data-v743-stage-card="${stageNo}"><div class="offseason-kicker">STAGE ${stageNo} COMPLETE · MAJOR QUALIFICATION</div><h3>Stage ${stageNo} 结束 · Major ${stageNo}</h3><p>本Stage独立排名决定Major资格。当前Champion Slot：${slotText}；Major冠军会替自己的赛区拿到下一届额外席位。</p><div class="stage-break-stats"><div><span>阶段战绩</span><strong>${rec.wins}-${rec.losses}</strong></div><div><span>${v71ConferenceZh(careerState.team)}排名</span><strong>第 ${rank}</strong></div><div><span>资格</span><strong>${q?'晋级Major':'未晋级'}</strong></div></div><button class="primary-btn" id="resolveStageBreakBtn" type="button">${q?`模拟 Major ${stageNo} →`:`结算 Major ${stageNo} →`}</button></div>`;
  }
  function v743MajorCardHtml(h){
    const slot=h.championConference==='East'?'东5西3':'东3西5';
    return `<div class="stage-break-card v71-major-result" data-v743-major-card="${h.stage}"><div class="offseason-kicker">MAJOR ${h.stage} · FINAL</div><h3>🏆 ${h.champion}</h3><p>${v71ConferenceZh(h.championConference)}赢下Major；下一届Major席位变为 ${slot}。你的成绩：<strong>${h.result}</strong>${h.bonusLP?` · +${h.bonusLP} LP`:''}</p><button class="primary-btn" id="v742ContinueMajorBtn" type="button">继续赛季 →</button></div>`;
  }

  // V7.4.2会让v741FixSeasonUi在同一次render中被调用两遍。
  // 这里改成“同状态重复调用不破坏DOM”的幂等版本：第一次搬/创建，第二次只校验。
  v741FixSeasonUi=function(){
    if(!v71IsOwl2()||!careerState.team)return;
    const dots=document.getElementById('seasonDots');
    if(dots){dots.classList.add('owl2-stage-dots');dots.innerHTML=[1,2,3].map(v741StageVisual).join('');}
    const rank=document.getElementById('seasonRankText');if(rank)rank.textContent=seasonState.played?`第 ${estimateSeasonRank()}`:'—';
    const inline=v741InlineArea(),bottom=document.getElementById('seasonCompleteArea'),actions=document.querySelector('#seasonScreen .season-track-card .season-actions');
    const pending=Number(seasonState.stageBreakPending)||0,h=seasonState.v71LastMajorSummary||null;
    const stateKey=pending?`stage:${pending}`:h?`major:${h.stage}`:'none';
    const milestone=stateKey!=='none';
    if(!inline){actions?.classList.toggle('v741-milestone-blocked',milestone);return;}

    if(stateKey==='none'){
      if(inline.dataset.v743State!=='none'){inline.innerHTML='';inline.classList.remove('show');inline.dataset.v743State='none';}
      actions?.classList.remove('v741-milestone-blocked');
      return;
    }

    // 若旧render刚在bottom生成了本节点，优先搬进来；否则按状态重建。
    if(inline.dataset.v743State!==stateKey || !inline.firstElementChild){
      inline.innerHTML='';
      if(bottom?.firstElementChild){while(bottom.firstChild)inline.appendChild(bottom.firstChild);}
      if(!inline.firstElementChild){inline.innerHTML=pending?v743StageCardHtml(pending):v743MajorCardHtml(h);}
      inline.dataset.v743State=stateKey;
    }else if(bottom?.firstElementChild){
      // 第二次调用时bottom可能又被底层render填了一遍，直接丢弃副本，保留inline原卡。
      bottom.innerHTML='';
    }
    inline.classList.add('show');
    actions?.classList.add('v741-milestone-blocked');

    const stageBtn=inline.querySelector('#resolveStageBreakBtn');
    if(stageBtn&&!stageBtn.dataset.v743Bound){
      stageBtn.dataset.v743Bound='1';
      stageBtn.addEventListener('click',()=>{
        const st=Number(seasonState.stageBreakPending)||pending;if(!st)return;
        const q=(typeof stageQualified==='function'?stageQualified(st):stageEstimatedRank(st)<=8);
        q?simulateStagePlayoff(st):skipStageBreak(st);
      });
    }
    const majorBtn=inline.querySelector('#v71ContinueMajorBtn,#v741ContinueMajorBtn,#v742ContinueMajorBtn');
    if(majorBtn){majorBtn.id='v742ContinueMajorBtn';majorBtn.type='button';majorBtn.disabled=false;}
  };

  function v743StopSeasonTransients(){
    seasonState.simulating=false;
    if(seasonState.timer){clearTimeout(seasonState.timer);seasonState.timer=null;}
    seasonState.eventDue=null;seasonState.currentEvent=null;seasonState.resumeFastAfterEvent=false;seasonState.resumeWholeAfterEvent=false;seasonState.v71ResumeWholeAfterAllStar=false;
    document.getElementById('seasonEventOverlay')?.classList.add('hidden');
    document.getElementById('injuryOverlay')?.classList.add('ui-hidden');
  }
  function v743ResolveMilestoneSilently(){
    const st=Number(seasonState.stageBreakPending)||0;if(!st)return;
    if(v71IsOwl2())v71RunMajor(st);else (stageQualified(st)?simulateStagePlayoff(st):skipStageBreak(st));
    seasonState.stageBreakPending=null;
    seasonState.v71LastMajorSummary=null;
    if(v71IsOwl2()&&st===2&&seasonState.v71AllStarPending){
      if(typeof v71BuildAllStarResult==='function')v71BuildAllStarResult();
      seasonState.v71AllStarPending=false;
    }
  }
  function v743FinishRegularSilently(){
    v743StopSeasonTransients();
    let guard=0;
    while(seasonState.played<seasonState.total&&guard++<160){
      v32SilentRegularGame();
      seasonState.eventDue=null;seasonState.currentEvent=null;
      markStageBreakIfNeeded();
      if(seasonState.stageBreakPending)v743ResolveMilestoneSilently();
    }
    if(seasonState.stageBreakPending)v743ResolveMilestoneSilently();
    seasonState.v71LastMajorSummary=null;seasonState.v71AllStarPending=false;seasonState.simulating=false;
  }
  function v743FinishPlayoffsSilently(){
    const qualified=estimateSeasonRank()<=8;
    if(!qualified){resetPlayoffState();return;}
    setupPlayoffs();
    let guard=0;
    while(currentPlayoffMatch()&&guard++<16)simulateSinglePlayoffSeries();
  }
  function v743AutoTraining(){
    if(careerState.age>=30)return false;
    prepareTrainingCamp(careerState.age+1);
    let guard=0;
    while(offseasonState.trainingRemaining>0&&canSpendTrainingPoint()&&guard++<120){
      const weights=ROLE_WEIGHTS[state.role]||{};
      const candidates=ATTRS.map(a=>{
        const value=state.locked[a.key]?.value||75,count=offseasonState.trainingAllocations[a.key]||0,cost=trainingPointCost(value);
        return {a,value,count,cost,score:(weights[a.key]||0)*100+(99-value)*.12-cost*.7+(a.key==='pool'?6:0)};
      }).filter(x=>x.value<99&&x.count<4&&x.cost<=offseasonState.trainingRemaining).sort((a,b)=>b.score-a.score);
      const x=candidates[0];if(!x)break;
      offseasonState.trainingRemaining-=x.cost;offseasonState.trainingAllocations[x.a.key]=(offseasonState.trainingAllocations[x.a.key]||0)+1;
      offseasonState.trainingHistory[x.a.key]=offseasonState.trainingHistory[x.a.key]||[];offseasonState.trainingHistory[x.a.key].push(x.cost);
      setCareerAttributeValue(x.a.key,x.value+1);
    }
    offseasonState.trainingConfirmed=true;
    careerState.peakOvr=Math.max(careerState.peakOvr,Number(getMyOvr()==='--'?0:getMyOvr()));
    return true;
  }
  function v743FinishOffseasonSilently(){
    offseasonState.active=false;setupOffseason();
    if(careerState.age>=30){retireCareer('30岁强制退役');return false;}
    // 开发者跳季默认继续职业，不触发转位选择；训练点自动投到当前职责的高收益属性。
    offseasonState.showRetirement=false;offseasonState.roleOpportunity=false;
    v743AutoTraining();
    if(offseasonState.contractExpired){
      generateContractOffers();
      const offers=offseasonState.offers||[];
      const offer=[...offers].sort((a,b)=>{
        const sa=(a.renewal?8:0)+(a.fit||0)*.42+(a.teamPower||0)*.28+(a.years||1)*2+(a.salary||0)*.04;
        const sb=(b.renewal?8:0)+(b.fit||0)*.42+(b.teamPower||0)*.28+(b.years||1)*2+(b.salary||0)*.04;return sb-sa;
      })[0];
      if(offer){offseasonState.selectedOfferId=offer.id;offseasonState.signedOffer=offer;applyTeamFromOffer(offer);}else return false;
    }else continueExistingContract();
    offseasonState.active=false;offseasonState.phase='signed';
    return true;
  }

  function v743SkipCurrentSeason(){
    if(!gameSettings.developerMode)return;
    const year=careerState.seasonYear;
    const proceed=()=>{try{
      if(!seasonState.active)setupSeason(false);
      v743FinishRegularSilently();
      v743FinishPlayoffsSilently();
      // Developer UI skip is a season-completion shortcut, not a career-advance shortcut.
      // Stop at the authoritative offseason review so every offseason branch stays testable.
      if(!offseasonState.active)setupOffseason();
      renderOffseason();
      showScreen('offseason');
      const note=document.getElementById('offseasonContent')?.querySelector('.v21-dev-skip-note');
      if(!note){
        const host=document.getElementById('offseasonContent');
        if(host){const n=document.createElement('div');n.className='v21-dev-skip-note';n.textContent=`🛠 已跳过 ${year} 赛季比赛并进入休赛期；训练、转位置与合同未自动处理。`;host.prepend(n);}
      }
      window.scrollTo({top:0,behavior:'smooth'});
    }catch(err){
      console.error('[V7.4.3 dev skip]',err);if(window.__OWL_V16_MODAL?.result)window.__OWL_V16_MODAL.result({icon:'⚠️',kicker:'DEVELOPER · 调试操作',title:'跳过赛季失败',body:`<p>${String(err?.message||err)}</p>`,confirmText:'知道了',tone:'warning'});
    }};
    if(!window.__OWL_CONFIRM?.({icon:'⏭️',kicker:'DEVELOPER · 调试操作',title:`跳过 ${year} 赛季？`,body:`<p>将直接结算 ${year} 赛季与季后赛，并停在休赛期。</p><p>训练、转位置与合同仍由你手动测试；该操作不可撤销。</p>`,confirmText:'跳过并进入休赛期',cancelText:'取消',tone:'warning',onConfirm:proceed}))return;
  }

  function v743EnsureDevSkipButton(){
    const actions=document.querySelector('#seasonScreen .top-actions');if(!actions||document.getElementById('v743SkipSeasonBtn'))return;
    const btn=document.createElement('button');btn.className='ghost-btn dev-only';btn.id='v743SkipSeasonBtn';btn.type='button';btn.textContent='⏭ 跳过当前赛季';
    btn.addEventListener('click',v743SkipCurrentSeason);actions.insertBefore(btn,document.getElementById('resetSeasonBtn')||null);
  }
  v743EnsureDevSkipButton();


  window.__OWL_V800_DEV_SKIP_SILENT=()=>{
    const year=careerState.seasonYear;
    try{
      if(!seasonState.active)setupSeason(false);
      v743FinishRegularSilently();
      v743FinishPlayoffsSilently();
      const advanced=v743FinishOffseasonSilently();
      return{ok:true,from:year,to:careerState.seasonYear,advanced,retired:careerState.retired,age:careerState.age};
    }catch(err){return{ok:false,from:year,error:String(err?.message||err),retired:careerState.retired,age:careerState.age};}
  };

  window.__OWL_V743_DIAGNOSTICS=()=>({
    version:'7.4.3',year:v71Year(),played:seasonState.played,stage:v71IsOwl2()?v71StageNo():null,
    stageBreakPending:seasonState.stageBreakPending||null,stageProcessed:[...(seasonState.stageProcessed||[])],
    majorSummary:seasonState.v71LastMajorSummary?.stage||null,allStarPending:!!seasonState.v71AllStarPending,
    inlineState:document.getElementById('v741SeasonInlineMilestone')?.dataset.v743State||null,
    inlineHasCard:!!document.querySelector('#v741SeasonInlineMilestone .stage-break-card'),
    actionsHidden:document.querySelector('#seasonScreen .season-actions')?.classList.contains('v741-milestone-blocked')||false,
    devSkip:!!document.getElementById('v743SkipSeasonBtn')
  });
})();


/* ===== RELEASE V7.5 · 收口：轻量模拟统一 / 英雄池市场价值 / 生涯故事摘要 ===== */
(function(){
  const V75_VERSION='7.5';

  // -----------------------------------------------------------------------
  // A. 前台收口：动态世界继续计算，但不把AI谁涨谁跌逐条汇报给玩家。
  // -----------------------------------------------------------------------
  if(typeof v60NewsMarkup==='function') v60NewsMarkup=function(){return '';};
  const _v75RenderSigningCompleteBase=renderSigningComplete;
  renderSigningComplete=function(wrap){
    _v75RenderSigningCompleteBase(wrap);
    wrap?.querySelectorAll('.v60-world-card').forEach(n=>n.remove());
  };

  // -----------------------------------------------------------------------
  // C. 英雄池价值：不新增“英雄池总评”，而是从真实熟练度反推市场标签。
  // 2025+ Hero Ban时代更看重深度与抗针对；2024以前只给较轻的溢价。
  // -----------------------------------------------------------------------
  function v75UserPlayer(){
    return careerState.starters?.find(p=>p.isUser)||{
      id:'career-player',isUser:true,name:getPlayerName(),role:state.role,
      overall:Number(getMyOvr()==='--'?78:getMyOvr()),
      attrs:Object.fromEntries(ATTRS.map(a=>[a.key,state.locked[a.key]?.value||75]))
    };
  }
  function v75HeroMarketProfile(player=v75UserPlayer(),year=v71Year()){
    const pool=(typeof v71HeroPool==='function'?v71HeroPool(player,year):[]).slice().sort((a,b)=>b.value-a.value);
    if(!pool.length)return{top:0,elite:0,solid:0,breadth:0,fragility:0,premium:0,label:'英雄池待建立',topHeroes:[]};
    const top=Number(pool[0]?.value||0),elite=pool.filter(h=>h.value>=88).length,solid=pool.filter(h=>h.value>=78).length;
    const breadth=typeof v71HeroPoolBreadth==='function'?v71HeroPoolBreadth(player):solid;
    const third=Number(pool[Math.min(2,pool.length-1)]?.value||top),fragility=Math.max(0,top-third);
    const banEra=year>=2025&&year<2033;
    let premium=(top-82)*.22+elite*.65+Math.min(8,breadth)*.28-fragility*.18;
    if(banEra)premium+=Math.min(10,solid)*.42+Math.max(0,4-fragility)*.30;
    else premium*=.55;
    premium=clamp(premium,-2.5,10);
    let label='均衡型';
    if(top>=94&&fragility>=8)label='绝活核心';
    else if(solid>=7||breadth>=7)label=banEra?'抗Ban英雄海':'英雄海';
    else if(elite>=3)label='多核型';
    else if(top>=92)label='招牌型';
    return{top,elite,solid,breadth,fragility:Number(fragility.toFixed(1)),premium:Number(premium.toFixed(1)),label,topHeroes:pool.slice(0,5)};
  }
  function v75RolePromise(score){return score>=88?'核心首发':score>=80?'稳定首发':score>=71?'首发竞争':'轮换选手';}

  const _v75GenerateOffersBase=generateContractOffers;
  generateContractOffers=function(){
    const out=_v75GenerateOffersBase();
    const profile=v75HeroMarketProfile();
    (offseasonState.offers||[]).forEach(offer=>{
      if(offer.v75HeroAdjusted)return;
      const lift=profile.premium;
      offer.starterScore=Number(offer.starterScore||72)+lift*.62;
      offer.salary=Math.max(8,Math.round(Number(offer.salary||10)*(1+Math.max(-1,lift)*.012)));
      offer.rolePromise=v75RolePromise(offer.starterScore);
      offer.v75HeroAdjusted=true;
      offer.heroMarket={label:profile.label,premium:profile.premium,breadth:profile.breadth,elite:profile.elite,fragility:profile.fragility};
    });
    return out;
  };

  const _v75RenderContractMarketBase=renderContractMarket;
  renderContractMarket=function(wrap){
    _v75RenderContractMarketBase(wrap);
    (offseasonState.offers||[]).forEach(offer=>{
      const card=wrap?.querySelector(`[data-offer-id="${offer.id}"]`);if(!card||card.querySelector('.v75-offer-hero'))return;
      const h=offer.heroMarket;if(!h)return;
      const node=document.createElement('div');node.className='v75-offer-hero';
      node.innerHTML=`<span>🎮 英雄池市场评价</span><strong>${h.label}</strong><small>${v71Year()+1>=2025&&v71Year()+1<2033?`抗Ban深度 ${h.breadth} · 精通以上 ${h.elite}`:`英雄池宽度 ${h.breadth} · 精通以上 ${h.elite}`} · 市场修正 ${h.premium>=0?'+':''}${h.premium}</small>`;
      card.appendChild(node);
    });
  };

  const _v75RenderCareerTeamBase=renderCareerTeam;
  renderCareerTeam=function(){
    _v75RenderCareerTeamBase();
    if(!careerState.team)return;
    const host=document.getElementById('careerSquadCard');if(!host)return;
    host.querySelector('.v75-hero-market-card')?.remove();
    const h=v75HeroMarketProfile(),node=document.createElement('div');node.className='v75-hero-market-card';
    node.innerHTML=`<div><span>🎮 HERO POOL · 市场画像</span><strong>${h.label}</strong><small>${v71StrategicEra()?'Hero Ban时代会直接影响首发与市场价值':'英雄熟练度已经影响地图适配与首发竞争'}</small></div><div class="v75-hero-market-stats"><b>${h.topHeroes.slice(0,4).map(x=>`${x.name} ${Math.round(x.value)}`).join(' · ')||'—'}</b><small>宽度 ${h.breadth} · 精通以上 ${h.elite} · 断层 ${h.fragility}</small></div>`;
    host.appendChild(node);
  };

  // Major仍使用赛程引擎，但玩家队伍的概率现在会读取英雄池价值，避免轻量结算完全无视2025后的抗Ban能力。
  const _v75MajorProbabilityBase=typeof v71MajorProbability==='function'?v71MajorProbability:null;
  if(_v75MajorProbabilityBase){
    v71MajorProbability=function(a,b){
      let p=_v75MajorProbabilityBase(a,b),shift=0;
      if(a.team?.name===careerState.team?.name)shift+=v75HeroMarketProfile().premium*.0045;
      if(b.team?.name===careerState.team?.name)shift-=v75HeroMarketProfile().premium*.0045;
      return clamp(p+shift,.18,.82);
    };
  }

  // -----------------------------------------------------------------------
  // D. 生涯记忆 + 文字摘要（最小框架）
  // 不是随机弹窗海：先把系统真实发生过的事记录成能被后续叙事读取的数据。
  // -----------------------------------------------------------------------
  function v75StoryRoot(){seasonState.v75StoryLog=seasonState.v75StoryLog||[];return seasonState.v75StoryLog;}
  function v75MemoryRoot(){careerState.careerMemories=careerState.careerMemories||[];return careerState.careerMemories;}
  function v75AddMemory(key,icon,title,text,weight=1){
    const list=v75MemoryRoot();if(list.some(x=>x.key===key))return null;
    const rec={key,icon,title,text,weight,year:v71Year(),age:careerState.age,team:careerState.team?.name||'—'};list.push(rec);return rec;
  }
  function v75Mode(arr){
    const m=new Map();(arr||[]).filter(Boolean).forEach(x=>m.set(x,(m.get(x)||0)+1));
    return [...m.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0]||null;
  }
  function v75CaptureMatchStory(idx){
    if(matchState.v75StoryCaptured||idx==null||!matchState.finished)return null;
    const opponent=seasonState.opponents?.[idx]||matchState.awayTeam,won=matchState.homeScore>matchState.awayScore;
    const totalMaps=matchState.results?.length||0,vals=(matchState.ratings?.home?.['career-player']||[]),avg=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null;
    const playerMaps=matchState.v72PlayerMaps||[],playedMaps=playerMaps.filter(x=>x.played),banRows=playedMaps.filter(x=>x.opponentBan);
    const actualMapsPlayed=playerMaps.length?playedMaps.length:vals.length;
    const severe=banRows.filter(x=>x.banStatus==='被Ban穿').length,direct=banRows.filter(x=>['无缝切换','Plan B充足','明显降档','被Ban穿'].includes(x.banStatus)).length;
    const planHeroes=playedMaps.map(x=>x.planB||x.best).filter(Boolean),hero=v75Mode(planHeroes);
    const wasBenched=actualMapsPlayed<totalMaps,returned=playerMaps.some((x,i)=>!x.played&&playerMaps.slice(i+1).some(y=>y.played));
    const rec={
      year:v71Year(),stage:v71IsOwl2()?v71StageNo():currentStageNumber(),matchNo:idx+1,opponent:opponent?.name||'未知对手',won,
      score:`${matchState.homeScore}-${matchState.awayScore}`,mapsPlayed:actualMapsPlayed,totalMaps,avg:avg==null?null:Number(avg.toFixed(1)),
      targetedBans:direct,banObserved:banRows.length,directBans:direct,severeBans:severe,hero,wasBenched,returned,
      lineupNotes:(matchState.v72LineupHistory||[]).map(x=>x.homeSwap).filter(Boolean).slice(0,5)
    };
    v75StoryRoot().push(rec);careerState.v75StoryHistory=careerState.v75StoryHistory||[];careerState.v75StoryHistory.push({...rec});careerState.v75StoryHistory=careerState.v75StoryHistory.slice(-300);
    matchState.v75StoryCaptured=true;

    if(rec.directBans>=2&&won&&severe===0)v75AddMemory('first-ban-proof','🚫','第一次扛住集中针对',`对手在一场系列赛里多次针对你的英雄池，但你依旧帮助${careerState.team?.name||'队伍'}拿下比赛。`,2);
    if(severe>=2)v75AddMemory('first-ban-broken','🧱','第一次被Ban穿',`阵容锁定后，你的招牌英雄连续遭到针对，Plan B出现明显断层。`,2);
    if(returned)v75AddMemory('first-bench-return','🔄','第一次从替补席杀回来',`你在系列赛中途被换下，却又随着地图变化重新回到首发。`,1.5);
    if(avg!=null&&avg>=9.1)v75AddMemory('first-9plus','🔥','第一次打出9分级系列赛',`你对阵${rec.opponent}打出 ${avg.toFixed(1)} 的系列赛评分，社区第一次真正把“爆种”两个字贴到你身上。`,1.5);
    if((careerState.specialEventsTriggered||[]).includes('ie30-cheat-rumor'))v75AddMemory('ie30-cheat-rumor','🖱️','IE3.0风波',`那场围绕录像、鼠标轨迹与IE3.0的争议，已经成为你早期生涯绕不开的一段旧闻。`,2.5);
    return rec;
  }
  function v75StoryImportance(r){
    let s=(r.avg||6.5)-6.5;if(r.avg>=9)s+=4;if(r.directBans>=2)s+=3;if(r.severeBans)s+=r.severeBans*3;if(r.returned)s+=3;if(r.mapsPlayed===0)s+=2;if(r.score==='3-0'||r.score==='0-3')s+=.8;return s;
  }
  function v75StoryVoice(r){
    if(r.directBans>=2&&r.won&&!r.severeBans)return '💬 社区热帖：“Ban了这么多，怎么还是让他打出来了？”';
    if(r.severeBans&& !r.won)return '🎙️ 解说席：招牌被砍掉以后，Plan B的断层被彻底暴露。';
    if(r.returned)return '🧑‍🏫 教练组：地图变了，人也得变。你重新回到了首发。';
    if(r.avg!=null&&r.avg>=9)return `🔥 社区热帖：${r.avg.toFixed(1)}？这场录像今晚肯定要被翻烂。`;
    if(r.mapsPlayed===0)return '🪑 赛后讨论：这轮系列赛你没有得到出场机会。';
    return '';
  }
  function v75StoryLine(r){
    const bits=[];
    if(r.mapsPlayed===0)bits.push('你整场DNP');
    else if(r.mapsPlayed<r.totalMaps)bits.push(`你出场 ${r.mapsPlayed}/${r.totalMaps} 图`);
    else bits.push(`你打满 ${r.totalMaps} 图`);
    if(r.targetedBans)bits.push(`遭到 ${r.targetedBans} 图针对Ban${r.severeBans?`，${r.severeBans}次被Ban穿`:''}`);
    if(r.hero)bits.push(`主要使用 ${r.hero}`);
    if(r.avg!=null)bits.push(`评分 ${r.avg.toFixed(1)}`);
    const voice=v75StoryVoice(r);
    const gameNo=Number(r.matchNo||0)>0?`<b class="v773-game-no">G${Number(r.matchNo)}</b> · `:'';
    return `${gameNo}<span class="v16-result-pill ${r.won?'win':'loss'}">${r.won?'胜':'负'}</span> ${r.opponent} ${r.score} · ${bits.join(' · ')}${voice?`<small>${voice}</small>`:''}`;
  }
  function v75RenderStoryRecap(){
    const host=document.querySelector('#seasonScreen .season-track-card');if(!host)return;
    host.querySelector('.v75-story-recap')?.remove();
    const rows=v75StoryRoot();if(!rows.length)return;
    const targetStage=Number(seasonState.stageBreakPending)||(v71IsOwl2()?v71StageNo():currentStageNumber());
    const pool=seasonState.played>=seasonState.total?rows:rows.filter(x=>x.stage===targetStage);
    const source=pool.length?pool:rows;
    const limit=seasonState.played>=seasonState.total?5:4;
    const latest=[...source].sort((a,b)=>Number(b.matchNo||0)-Number(a.matchNo||0)).slice(0,Math.min(2,limit));
    const latestKeys=new Set(latest.map(x=>`${x.year||v71Year()}-${x.matchNo||0}`));
    const highlights=[...source].filter(x=>!latestKeys.has(`${x.year||v71Year()}-${x.matchNo||0}`)).sort((a,b)=>v75StoryImportance(b)-v75StoryImportance(a)||Number(b.matchNo||0)-Number(a.matchNo||0)).slice(0,Math.max(0,limit-latest.length));
    const show=[...latest,...highlights].sort((a,b)=>Number(b.matchNo||0)-Number(a.matchNo||0));
    const box=document.createElement('div');box.className='v75-story-recap';
    const memories=v75MemoryRoot().filter(x=>x.year===v71Year()).slice(-2);
    const title=seasonState.played>=seasonState.total?`你的 ${v71Year()} 常规赛`:seasonState.stageBreakPending?`Stage ${seasonState.stageBreakPending} 小结`:'最近的职业生涯片段';
    box.innerHTML=`<div class="v75-story-head"><div><span>📼 CAREER FEED</span><strong>${title}</strong></div><small>最近2场 + 本阶段高光</small></div><div class="v75-story-lines">${show.map(r=>`<p>${v75StoryLine(r)}</p>`).join('')}</div>${memories.length?`<div class="v75-memory-strip">${memories.map(m=>`<span>${m.icon} <b>${m.title}</b> · ${m.text}</span>`).join('')}</div>`:''}`;
    const actions=host.querySelector('.season-actions');if(actions)host.insertBefore(box,actions);else host.appendChild(box);
  }

  // -----------------------------------------------------------------------
  // B. 轻量模拟统一：2024+不再用“总战力掷骰子”的第二套比赛。
  // 后台真正跑完整系列赛内核；2025+自然执行 地图→换人→Hero Ban→Plan B。
  // 展示层单独静音：计算照跑，比赛页DOM不在后台反复重绘。
  // -----------------------------------------------------------------------
  let V75_HEADLESS_MATCH=false;
  const _v75RenderMatchBase=renderMatch;
  renderMatch=function(){if(V75_HEADLESS_MATCH)return;return _v75RenderMatchBase();};

  // matchState会跨系列赛复用；换人/Ban历史必须每场清空，否则第56场会背着前55场的板凳史一起打。
  const _v75SetupMatchSeriesBase=setupMatch;
  setupMatch=function(...args){
    const out=_v75SetupMatchSeriesBase(...args);
    if(v71HasStrategicDraft()){
      matchState.v72LineupHistory=[];matchState.v72PlayerMaps=[];matchState.v72LastLineup=null;
      matchState.homeSquad=null;matchState.awaySquad=null;matchState.v72HomeSquadTeam=null;matchState.v72AwaySquadTeam=null;
    }
    return out;
  };
  function v75RunStrategicRegularMatch(source='quick'){
    const idx=Number(seasonState.played)||0,opponent=seasonState.opponents?.[idx];if(!opponent||idx>=seasonState.total)return null;
    if(typeof v74EnsureStageFocus==='function')v74EnsureStageFocus();
    const venue=regularVenueAt(idx),strategic=v71HasStrategicDraft();
    V75_HEADLESS_MATCH=true;
    try{
      matchState.homeTeam=careerState.team;
      setupMatch(false,3,{playerVenue:venue,mapSelectionEnabled:strategic,firstMapPicker:venue==='home'?'home':'away'});
      matchState.homeTeam=careerState.team;
      if(strategic)matchState.homeRoster=(careerState.starters||[]).map(p=>({...p,attrs:{...(p.attrs||{})}}));
      applyCareerMatchModifiers(matchState.homeRoster);
      matchState.awayTeam=opponent;matchState.awayRoster=createRoster(opponent,false);
      matchState.context='regular';matchState.v75StoryCaptured=false;matchState.v75QuickSource=source;
      seasonState.pendingManualIndex=idx;seasonState.manualRecorded=false;
      if(strategic&&typeof v72EnsureMatchSquads==='function')v72EnsureMatchSquads(true);
      simulateFullSeries();
    }finally{V75_HEADLESS_MATCH=false;}
    const story=v75CaptureMatchStory(idx);
    recordManualSeasonMatch();
    if(gameSettings.autoSeasonEvents&&seasonState.eventDue&&typeof v32AutoResolveSeasonEvent==='function')v32AutoResolveSeasonEvent();
    return story;
  }

  const _v75SingleRegularBase=simulateSingleRegularMatch;
  simulateSingleRegularMatch=function(){
    if(v71Year()<2024)return _v75SingleRegularBase();
    if(seasonState.played>=seasonState.total)return;
    const story=v75RunStrategicRegularMatch('single');if(!story)return;
    const note=document.getElementById('seasonSimNote');if(note)note.textContent=`第 ${story.matchNo} 场轻量模拟：${story.won?'胜利':'失利'} ${story.score}。${story.mapsPlayed?`你出场${story.mapsPlayed}/${story.totalMaps}图${story.targetedBans?`，遭到${story.targetedBans}图Hero Ban针对`:''}。`:'你本场未进入实际比赛阵容。'}`;
    renderSeason();showScreen('season');
    if(seasonState.played>=seasonState.total){setTimeout(openRegularSeasonAwards,320);return;}
    if(seasonState.eventDue&&!gameSettings.autoSeasonEvents)setTimeout(openScheduledSeasonEvent,180);
  };

  const _v75SilentRegularBase=v32SilentRegularGame;
  v32SilentRegularGame=function(){
    if(v71Year()<2024)return _v75SilentRegularBase();
    return v75RunStrategicRegularMatch('batch');
  };

  // 快速季后赛同样走完整系列赛内核。2025+会真的选图、换人、Ban和找Plan B。
  const _v75QuickPlayoffBase=simulateSinglePlayoffSeries;
  simulateSinglePlayoffSeries=function(){
    if(v71Year()<2024)return _v75QuickPlayoffBase();
    const bracketMatch=currentPlayoffMatch();if(!bracketMatch)return;
    const opponent=currentPlayoffOpponent(),target=bracketMatch.target,strategic=v71HasStrategicDraft();
    const playerHigher=(teamSeed(careerState.team)||8)<(teamSeed(opponent)||8);
    V75_HEADLESS_MATCH=true;
    try{
      matchState.homeTeam=careerState.team;
      setupMatch(false,target,{playerVenue:playerHigher?'home':'away',mapSelectionEnabled:strategic,firstMapPicker:playerHigher?'home':'away',playoffMatchId:bracketMatch.id});
      matchState.homeTeam=careerState.team;if(strategic)matchState.homeRoster=(careerState.starters||[]).map(p=>({...p,attrs:{...(p.attrs||{})}}));applyCareerMatchModifiers(matchState.homeRoster);
      matchState.awayTeam=opponent;matchState.awayRoster=createRoster(opponent,false);matchState.context='playoff';matchState.v75StoryCaptured=false;
      playoffState.pendingMatchId=bracketMatch.id;playoffState.manualRecorded=false;
      if(strategic&&typeof v72EnsureMatchSquads==='function')v72EnsureMatchSquads(true);
      simulateFullSeries();
    }finally{V75_HEADLESS_MATCH=false;}
    recordPlayoffMatch();renderPlayoffs();showScreen('playoff');
  };

  // 详细模式结束也进入同一份Story Log；轻量/详细只是“看不看过程”的区别。
  const _v75RecordManualSeasonBase=recordManualSeasonMatch;
  recordManualSeasonMatch=function(){
    const idx=seasonState.pendingManualIndex;
    if(idx!=null&&matchState.finished&&!matchState.v75StoryCaptured)v75CaptureMatchStory(idx);
    return _v75RecordManualSeasonBase();
  };

  const _v75RenderSeasonBase=renderSeason;
  renderSeason=function(){
    _v75RenderSeasonBase();
    if(careerState.team)v75RenderStoryRecap();
  };

  // 开新赛季时只清当季Feed，不清长期生涯记忆。
  const _v75SetupSeasonBase=setupSeason;
  setupSeason=function(isRestart=false){
    const out=_v75SetupSeasonBase(isRestart);
    if(!isRestart)seasonState.v75StoryLog=[];
    return out;
  };

  // 季末归档保留当季“发生过什么”，后续可以直接拿它生成更完整的年度纪录片。
  const _v75RecordSeasonBase=recordCompletedCareerSeason;
  recordCompletedCareerSeason=function(){
    const before=careerState.careerArchive?.length||0,out=_v75RecordSeasonBase();
    if((careerState.careerArchive?.length||0)>before){const rec=careerState.careerArchive.at(-1);rec.storyHighlights=(seasonState.v75StoryLog||[]).slice(-12);rec.careerMemories=(careerState.careerMemories||[]).filter(x=>x.year===rec.year);}
    return out;
  };

  window.__OWL_V75_DIAGNOSTICS=()=>({
    version:V75_VERSION,year:v71Year(),heroMarket:v75HeroMarketProfile(),storyCount:(seasonState.v75StoryLog||[]).length,
    memories:(careerState.careerMemories||[]).slice(-5),worldEvolutionVisible:!!document.querySelector('.v60-world-card'),
    lastStory:(seasonState.v75StoryLog||[]).at(-1)||null
  });

  if(!document.getElementById('v75Style')){const st=document.createElement('style');st.id='v75Style';st.textContent=`
    .v60-world-card{display:none!important}
    .v75-hero-market-card{margin-top:10px;padding:11px 12px;border:1px solid var(--line);border-radius:14px;display:grid;grid-template-columns:1fr 1.4fr;gap:14px;background:rgba(44,110,170,.045)}
    .v75-hero-market-card span,.v75-hero-market-card small,.v75-offer-hero span,.v75-offer-hero small{display:block;color:var(--muted);font-size:9px}.v75-hero-market-card strong{display:block;margin:2px 0;font-size:13px}.v75-hero-market-stats{text-align:right}.v75-hero-market-stats b{display:block;font-size:10px}.v75-offer-hero{margin-top:8px;padding:8px 9px;border:1px solid var(--line);border-radius:10px;background:rgba(255,255,255,.36)}.v75-offer-hero strong{display:block;font-size:11px;margin:2px 0}
    .v75-story-recap{margin:12px 0;padding:13px 14px;border:1px solid var(--line);border-radius:16px;background:linear-gradient(135deg,rgba(44,110,170,.055),rgba(255,122,67,.035))}.v75-story-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-end}.v75-story-head span{display:block;color:var(--accent);font-size:9px;font-weight:900;letter-spacing:.08em}.v75-story-head strong{display:block;margin-top:2px;font-size:13px}.v75-story-head small{color:var(--muted);font-size:9px;text-align:right}.v75-story-lines{display:grid;gap:4px;margin-top:9px}.v75-story-lines p{margin:0;padding:6px 8px;border-radius:9px;background:rgba(255,255,255,.42);font-size:10px;color:var(--muted)}.v75-story-lines p small{display:block;margin-top:3px;color:var(--ink);font-size:9px;opacity:.78}.v75-memory-strip{display:grid;gap:4px;margin-top:8px;padding-top:8px;border-top:1px dashed var(--line)}.v75-memory-strip span{font-size:9px;color:var(--muted)}.v75-memory-strip b{color:var(--ink)}
    html[data-theme="dark"] .v75-hero-market-card,html[data-theme="dark"] .v75-offer-hero,html[data-theme="dark"] .v75-story-recap,html[data-theme="dark"] .v75-story-lines p{background:rgba(255,255,255,.04)}
    @media(max-width:760px){.v75-hero-market-card{grid-template-columns:1fr}.v75-hero-market-stats{text-align:left}.v75-story-head{display:block}.v75-story-head small{display:block;text-align:left;margin-top:4px}}
  `;document.head.appendChild(st);}
})();


/* ===== V7.6 · 历史模拟 / 梦幻模拟分支 ===== */
(function(){
  const V76_VERSION='V7.6.1';
  const V76_SELECTION={mode:'fantasy',startYear:2019};
  const V76_FANTASY_WORLD={startYear:null,seasons:{},retired:[],newsByYear:{},rebirthQueue:[],generatedSeq:0,frozenTeamMeta:{},reservedNames:new Set(),building:false};
  let V76_ROSTER_QUERY_YEAR=null;

  function v76IsFantasy(){return (careerState.simulationMode||V76_SELECTION.mode)==='fantasy';}
  function v76ModeName(){return v76IsFantasy()?'梦幻模拟':'历史模拟';}
  function v76StartYear(){return Number(careerState.startYear||V76_SELECTION.startYear||2019);}
  function v76RealEntries(team,year){
    if(!team)return [];
    year=Number(year)||2019;
    if(year===2019){const base=V50_BASE_TEAM_META[team.short]||{};return OWL2019_ROSTERS[base.enName||team.enName||team.name]||[];}
    return V50_OWL_ROSTERS[year]?.[team.short]||[];
  }
  function v76LastSeen(name){const rows=V60_HIST_INDEX[name]||[];return rows.length?Math.max(...rows.map(r=>r.year)):2023;}
  function v76PlayerFromEntry(entry,teamShort,year){
    const [name,role,ovr]=entry,first=v60FirstSeen(name),realAge=v62RealAgeAtSeason(name,year),golden=first===2023;
    const age=realAge??clamp(v60EstimatedAge2023(name)-(2023-year),15,32),peak=v60HistoricalPeak(name,Number(ovr)||80);
    const p={id:`dream-real-${name}`,name,role,country:v60CountryFor(name,entry),teamShort,age,birthDate:v100BirthDateFor(name),ageSource:realAge==null?'estimated':'wiki',ovr:Number(ovr)||80,
      potential:clamp(Math.max(Number(ovr)||80,peak+v60Int(`dream-pot-${name}`,0,2)+(golden?1:0)),60,99),peakRecorded:peak,peakAge:golden?Math.max(23,v60PeakAge(name,age)):v60PeakAge(name,age),retirementAge:v60RetirementAge(name,peak),
      proYears:Math.max(1,(year-first+1)+v60PreOwlMileage(name,first)),legacyVeteran:false,styleDelta:v60StyleDelta(name,role,Number(ovr)||80,entry),debutYear:first,
      historicalExitYear:v76LastSeen(name)+1,generated:false,lineage:'historical',templateName:null,lastRating:null,talentClass:golden?'golden':'standard',talentCohortYear:golden?2023:null};
    p.legacyVeteran=p.proYears>=6;p.attrs=v60BuildDynamicAttrs(p);p.ovr=v35RoleCompositeOvr(p.attrs,p.role);p.peakRecorded=Math.max(p.peakRecorded,p.ovr);p.archetype=v60Archetype(p);V60_COUNTRY_BY_NAME[p.name]=p.country;return p;
  }
  function v76Clone(p){return {...p,attrs:{...(p.attrs||{})},styleDelta:{...(p.styleDelta||{})},archetype:[...(p.archetype||[])]};}
  function v76AllNames(){const used=new Set(Object.keys(V60_HIST_INDEX));Object.values(V76_FANTASY_WORLD.seasons).forEach(s=>Object.values(s.teams||{}).forEach(list=>list.forEach(p=>used.add(p.name))));V76_FANTASY_WORLD.retired.forEach(p=>used.add(p.name));return used;}
  function v76NewHandle(country,seed){const pool=V60_NAME_STEMS[country]||V60_NAME_STEMS.default,used=v76AllNames();V76_FANTASY_WORLD.reservedNames.forEach(n=>used.add(n));const base=pool[v60Int(`${seed}-stem`,0,pool.length-1)],variants=[base,`${base}${v60Int(`${seed}-n`,2,9)}`,`${base}x`,`${base}${String.fromCharCode(65+v60Int(`${seed}-c`,0,25))}`];let chosen=null;for(const n of variants)if(!used.has(n)){chosen=n;break;}if(!chosen){do{chosen=`${base}${++V76_FANTASY_WORLD.generatedSeq}`;}while(used.has(chosen));}V76_FANTASY_WORLD.reservedNames.add(chosen);return chosen;}
  function v76ChooseTeam(role,teams,seed){
    const candidates=Object.entries(teams).map(([short,list])=>{const same=(list||[]).filter(p=>p.role===role).sort((a,b)=>b.ovr-a.ovr),best=same[0]?.ovr||58,total=list.length;return{short,need:105-(best-70)*1.5-same.length*7-Math.max(0,total-8)*5+v60Signed(`${seed}-${short}`,5)};}).sort((a,b)=>b.need-a.need);
    const top=candidates.slice(0,Math.min(5,candidates.length));return top[v60Int(`${seed}-pick`,0,Math.max(0,top.length-1))]?.short||candidates[0]?.short;
  }
  function v76Academy(role,teamShort,year,seed,country='kr'){
    const name=v76NewHandle(country,`dream-academy-${year}-${teamShort}-${role}-${seed}`),age=15+v60Int(`dream-age-${name}`,0,3),potential=clamp(82+v60Int(`dream-pot-${name}`,0,13),80,96),[gapMin,gapMax]=v60TransitionAcademyGap(year);
    const p={id:`dream-academy-${year}-${name}-${++V76_FANTASY_WORLD.generatedSeq}`,name,role,country,teamShort,age,ovr:clamp(potential-v60Int(`dream-gap-${name}`,gapMin,gapMax),59,87),potential,peakRecorded:0,peakAge:23+v60Int(`dream-peak-${name}`,0,3),retirementAge:27+v60Int(`dream-retire-${name}`,0,5),proYears:1,legacyVeteran:false,styleDelta:{},debutYear:year,generated:true,lineage:'academy',templateName:null,lastRating:null,historicalExitYear:null};
    ATTRS.forEach(a=>p.styleDelta[a.key]=v60Int(`dream-style-${name}-${a.key}`,-3,3));p.attrs=v60BuildDynamicAttrs(p);p.ovr=v35RoleCompositeOvr(p.attrs,p.role);p.peakRecorded=p.ovr;p.archetype=v60Archetype(p);V60_COUNTRY_BY_NAME[p.name]=p.country;return p;
  }
  function v76ScheduleRebirth(p,year){
    // Alarm's real career ended in 2021; historical integrity takes precedence over the generic AI rebirth system.
    if(p?.name==='Alarm')return;
    if(V76_FANTASY_WORLD.rebirthQueue.some(q=>q.templateId===p.id&&q.retiredYear===year))return;
    V76_FANTASY_WORLD.rebirthQueue.push({templateId:p.id,templateName:p.name,retiredYear:year,spawnYear:year+v60Int(`dream-rebirth-delay-${year}-${p.id}`,1,3),country:p.country||'kr',role:p.role,peakTarget:clamp((p.peakRecorded||p.potential||p.ovr)+v60Int(`dream-rebirth-peak-${year}-${p.id}`,-2,2),70,99),styleDelta:{...(p.styleDelta||{})},archetype:[...(p.archetype||[])]});
  }
  function v76CreateRebirth(q,year,teams){
    const name=v76NewHandle(q.country||'kr',`dream-rebirth-${year}-${q.templateId}`),age=15+v60Int(`dream-rookie-age-${name}`,0,2),styleDelta={},[gapMin,gapMax]=v60TransitionRebirthGap(year);ATTRS.forEach(a=>styleDelta[a.key]=clamp(Number(q.styleDelta?.[a.key]||0)+v60Int(`dream-mut-${name}-${a.key}`,-1,1),-6,6));
    const p={id:`dream-regen-${year}-${name}-${++V76_FANTASY_WORLD.generatedSeq}`,name,role:q.role,country:q.country||'kr',age,ovr:clamp(q.peakTarget-v60Int(`dream-rookie-gap-${name}`,gapMin,gapMax),60,87),potential:q.peakTarget,peakRecorded:0,peakAge:23+v60Int(`dream-rpeak-${name}`,0,3),retirementAge:27+v60Int(`dream-rret-${name}`,0,5),proYears:1,legacyVeteran:false,styleDelta,debutYear:year,generated:true,lineage:'rebirth',templateName:q.templateName,lastRating:null,historicalExitYear:null,archetype:[...(q.archetype||[])]};
    p.attrs=v60BuildDynamicAttrs(p);p.ovr=v35RoleCompositeOvr(p.attrs,p.role);p.peakRecorded=p.ovr;p.teamShort=v76ChooseTeam(p.role,teams,`dream-team-${p.id}`);V60_COUNTRY_BY_NAME[p.name]=p.country;return p;
  }
  function v76SpawnGoldenClass(teams,year,news){
    const boom=v60TalentBoomInfo(year);if(!boom||Number(year)===2023)return;
    const count=2+v60Int(`dream-golden-count-${v60TalentSeed()}-${year}`,0,2),countries=['kr','cn','us','ca','fr','fi','se','dk'];
    for(let i=0;i<count;i++){
      const role=ROLES[(i+v60Int(`dream-golden-role-${year}`,0,ROLES.length-1))%ROLES.length].name,country=countries[v60Int(`dream-golden-country-${year}-${i}`,0,countries.length-1)];
      const p=v60TuneGoldenRookie(v76Academy(role,null,year,`golden-${i}`,country),year,i),to=v76ChooseTeam(role,teams,`dream-golden-team-${year}-${i}`);
      if(!to)continue;p.teamShort=to;teams[to]=teams[to]||[];teams[to].push(p);V60_COUNTRY_BY_NAME[p.name]=p.country;
      news.rookies.push({name:p.name,teamShort:to,role:p.role,lineage:'golden-academy',talentClass:'golden'});boom.players.push(p.name);
    }
    boom.count=boom.players.length;news.talentBoom=boom;
  }

  function v76RealDebuts(year){
    const rows=[];Object.entries(V60_HIST_INDEX).forEach(([name,hist])=>{const first=Math.min(...hist.map(r=>r.year));if(first!==year)return;const row=hist.filter(r=>r.year===year).sort((a,b)=>(Number(b.entry?.[2])||0)-(Number(a.entry?.[2])||0))[0];if(row)rows.push(row);});return rows.sort((a,b)=>(Number(b.entry?.[2])||0)-(Number(a.entry?.[2])||0));
  }
  function v76HistoricalExitRetire(p,nextYear){
    // Alarm must leave the simulated league after the 2021 season in every timeline.
    if(p?.name==='Alarm'&&Number(nextYear)>=2022)return true;
    if(!p.historicalExitYear||nextYear<p.historicalExitYear)return false;
    const performance=p.lastRating||7,star=(p.ovr>=90||performance>=7.8),chance=star?.005:p.ovr>=84?.015:p.ovr>=78?.04:.09;
    return v60Unit(`dream-soft-exit-${nextYear}-${p.id}`)<chance;
  }
  function v76ShouldRetire(p,year){
    const pro=Number(p.proYears||1),age=Number(p.age||20);if(age>=33||pro>=14)return true;if(p.generated&&age<26&&pro<10)return false;if(age<24&&pro<6)return false;
    const ageChance={24:.001,25:.003,26:.006,27:.012,28:.025,29:.045,30:.08,31:.14,32:.25}[age]||0;
    const mileageChance={6:.005,7:.012,8:.025,9:.05,10:.09,11:.16,12:.28,13:.45}[Math.min(13,pro)]||0;
    const drop=Math.max(0,(p.peakRecorded||p.ovr)-p.ovr),low=p.ovr<72?.03:p.ovr<78?.01:0,star=(p.peakRecorded||0)>=94?.65:1;
    const chance=clamp((Math.max(ageChance,mileageChance)+drop*.008+low)*star,0,.72);return v60Unit(`dream-retire-${year}-${p.id}`)<chance;
  }
  function v76TradeRosters(teams,year,news){
    const moved=new Set(),maxMoves=2+v60Int(`dream-moves-${year}`,0,3);
    for(let step=0;step<maxMoves;step++){
      let best=null;
      Object.entries(teams).forEach(([targetShort,target])=>ROLES.forEach(r=>{
        const own=target.filter(p=>p.role===r.name).sort((a,b)=>b.ovr-a.ovr),ownBest=own[0]?.ovr||58;
        Object.entries(teams).forEach(([fromShort,from])=>{if(fromShort===targetShort)return;const same=from.filter(p=>p.role===r.name&&!moved.has(p.id)).sort((a,b)=>b.ovr-a.ovr);if(same.length<2)return;const cand=same[1],gain=cand.ovr-ownBest,need=(own.length===0?18:0)+(ownBest<80?(80-ownBest)*.6:0)-Math.max(0,target.length-9)*4+v60Signed(`dream-trade-${year}-${step}-${targetShort}-${fromShort}-${r.name}`,3);const score=gain+need;if(score>4&&(!best||score>best.score))best={score,targetShort,fromShort,cand};});
      }));
      if(!best)break;teams[best.fromShort]=teams[best.fromShort].filter(p=>p.id!==best.cand.id);const movedP=v76Clone(best.cand);movedP.teamShort=best.targetShort;teams[best.targetShort].push(movedP);moved.add(movedP.id);news.trades.push({name:movedP.name,from:best.fromShort,to:best.targetShort,role:movedP.role});
    }
  }
  function v76EnsureMinimums(teams,year,news){
    Object.entries(teams).forEach(([short,list])=>{
      const country=v60MajorityCountry(list);
      ROLES.forEach(r=>{if(!list.some(p=>p.role===r.name)){const p=v76Academy(r.name,short,year,`role-${r.name}`,country);list.push(p);news.rookies.push({name:p.name,teamShort:short,role:p.role,lineage:'academy'});}});
      while(list.length<6){const role=ROLES.slice().sort((a,b)=>list.filter(p=>p.role===a.name).length-list.filter(p=>p.role===b.name).length)[0].name,p=v76Academy(role,short,year,`depth-${list.length}`,country);list.push(p);news.rookies.push({name:p.name,teamShort:short,role:p.role,lineage:'academy'});}
      while(list.length>10){const counts={};list.forEach(p=>counts[p.role]=(counts[p.role]||0)+1);const removable=list.filter(p=>(counts[p.role]||0)>1).sort((a,b)=>a.ovr-b.ovr)[0]||[...list].sort((a,b)=>a.ovr-b.ovr)[0];if(!removable)break;const idx=list.findIndex(p=>p.id===removable.id);if(idx<0)break;list.splice(idx,1);news.releases.push({name:removable.name,teamShort:short,role:removable.role});}teams[short]=list;
    });
  }
  function v76BuildStartSnapshot(){
    const year=v76StartYear();if(V76_FANTASY_WORLD.seasons[year])return V76_FANTASY_WORLD.seasons[year];V76_FANTASY_WORLD.building=true;V76_FANTASY_WORLD.startYear=year;
    const teams={};TEAMS.forEach(team=>{const meta=_v76TeamMetaBase(team,year);V76_FANTASY_WORLD.frozenTeamMeta[team.short]={...meta};if(meta.active===false)return;const entries=v76RealEntries(team,year);if(entries.length)teams[team.short]=entries.map(e=>v76PlayerFromEntry(e,team.short,year));});
    const boom=v60TalentBoomInfo(year);if(boom&&year===2023){const cohort=Object.values(teams).flat().filter(p=>Number(p.debutYear)===2023);boom.count=cohort.length;boom.players=cohort.slice().sort((a,b)=>b.ovr-a.ovr).slice(0,4).map(p=>p.name);}
    const snap={year,teams,teamStrength:{},news:{retirements:[],rookies:[],trades:[],releases:[],gainers:[],decliners:[],talentBoom:boom}};Object.keys(teams).forEach(short=>snap.teamStrength[short]=v60CalcTeamStrength(teams[short]));V76_FANTASY_WORLD.seasons[year]=snap;V76_FANTASY_WORLD.building=false;return snap;
  }
  function v76AdvanceOneYear(fromYear){
    const nextYear=fromYear+1,prev=V76_FANTASY_WORLD.seasons[fromYear]||v76BuildStartSnapshot();if(V76_FANTASY_WORLD.seasons[nextYear])return V76_FANTASY_WORLD.seasons[nextYear];
    const teams={};Object.keys(prev.teams||{}).forEach(short=>teams[short]=[]);if(nextYear>=2024)TEAMS.forEach(t=>{if(!teams[t.short])teams[t.short]=[];});
    const news={retirements:[],rookies:[],trades:[],releases:[],gainers:[],decliners:[],talentBoom:v60TalentBoomInfo(nextYear)};
    Object.entries(prev.teams||{}).forEach(([short,list])=>(list||[]).forEach(old=>{
      const rating=v60SimRating(old,short,fromYear,prev),p=v76Clone(old),before=old.ovr;p.lastRating=rating;p.age=(old.age||20)+1;p.proYears=(old.proYears||1)+1;p.ovr=v60NextOvr({...old,proYears:p.proYears},rating,p.age,fromYear);p.attrs=v60BuildDynamicAttrs(p);p.ovr=v35RoleCompositeOvr(p.attrs,p.role);p.peakRecorded=Math.max(old.peakRecorded||before,p.ovr);p.archetype=v60Archetype(p);const diff=p.ovr-before;if(diff>=1)news.gainers.push({name:p.name,diff,from:before,to:p.ovr,teamShort:short});if(diff<=-1)news.decliners.push({name:p.name,diff,from:before,to:p.ovr,teamShort:short});
      const retire=v76ShouldRetire(p,fromYear)||v76HistoricalExitRetire(p,nextYear);if(retire){news.retirements.push({name:p.name,teamShort:short,role:p.role,age:p.age,peak:p.peakRecorded});V76_FANTASY_WORLD.retired.push({...v76Clone(p),retiredYear:fromYear});v76ScheduleRebirth(p,fromYear);}else{p.teamShort=short;teams[short].push(p);V60_COUNTRY_BY_NAME[p.name]=p.country;}
    }));
    // 现实新人只保留“何时出现”，不保留“去哪支队”。
    if(nextYear<=2023)v76RealDebuts(nextYear).forEach(row=>{const p=v76PlayerFromEntry(row.entry,null,nextYear),to=v76ChooseTeam(p.role,teams,`real-rookie-${nextYear}-${p.name}`);if(!to)return;p.teamShort=to;teams[to].push(p);news.rookies.push({name:p.name,teamShort:to,role:p.role,lineage:'real-debut',talentClass:p.talentClass||'standard'});if(nextYear===2023&&news.talentBoom){news.talentBoom.players.push(p.name);news.talentBoom.count=news.talentBoom.players.length;}});
    // 2024以后继续沿用现有的传承/学院新人思路。
    const due=V76_FANTASY_WORLD.rebirthQueue.filter(q=>q.spawnYear===nextYear);due.forEach(q=>{const p=v76CreateRebirth(q,nextYear,teams);if(p.teamShort){teams[p.teamShort].push(p);news.rookies.push({name:p.name,teamShort:p.teamShort,role:p.role,lineage:'rebirth'});}});V76_FANTASY_WORLD.rebirthQueue=V76_FANTASY_WORLD.rebirthQueue.filter(q=>q.spawnYear>nextYear);
    v76SpawnGoldenClass(teams,nextYear,news);
    v76TradeRosters(teams,nextYear,news);v76EnsureMinimums(teams,nextYear,news);
    const snap={year:nextYear,teams,teamStrength:{},news};Object.keys(teams).forEach(short=>snap.teamStrength[short]=v60CalcTeamStrength(teams[short]));V76_FANTASY_WORLD.seasons[nextYear]=snap;V76_FANTASY_WORLD.newsByYear[nextYear]=news;return snap;
  }
  function v76EnsureWorldToYear(year){year=Number(year)||v76StartYear();if(year<=v76StartYear())return v76BuildStartSnapshot();v76BuildStartSnapshot();for(let y=v76StartYear();y<year;y++)if(!V76_FANTASY_WORLD.seasons[y+1])v76AdvanceOneYear(y);return V76_FANTASY_WORLD.seasons[year];}
  function v76FantasyEntries(team,year){const snap=v76EnsureWorldToYear(year),list=snap?.teams?.[team.short]||[];return list.map(p=>[p.name,p.role,p.ovr,p.country,{v60:true,v76:true,id:p.id,age:p.age,birthDate:p.birthDate||null,ageSource:p.ageSource||'generated',attrs:{...p.attrs},potential:p.potential,peakRecorded:p.peakRecorded,peakAge:p.peakAge,retirementAge:p.retirementAge,retirementReady:!!(p.age>=p.retirementAge||p.age>=32||p.proYears>=13),proYears:p.proYears,legacyVeteran:p.legacyVeteran,debutYear:p.debutYear,generated:p.generated,lineage:p.lineage,lastRating:p.lastRating,templateName:p.templateName,talentClass:p.talentClass||'standard',talentCohortYear:p.talentCohortYear||null}]);}

  // 保存V7.5最终实现，梦幻模式只替换“世界数据源”。
  const _v76RosterBase=v50RosterEntriesFor;
  const _v76TeamMetaBase=v50TeamMetaForYear;
  const _v76ApplyWorldBase=v50ApplySeasonWorld;
  const _v76TeamActiveBase=v50TeamActiveNextYear;
  const _v76GeneratePlayersBase=generatePlayers;
  const _v76RollTeamDataBase=rollTeamData;
  const _v76RenderTeamChoiceWheelBase=renderTeamChoiceWheel;
  const _v76CareerPowerBase=careerLikeTeamPower;
  const _v76GenerateOffersBase=generateContractOffers;
  const _v76AwardPoolBase=buildRegularAwardLeaguePool;
  const _v76RenderSeasonBase=renderSeason;
  const _v76RenderCareerTeamBase=renderCareerTeam;
  const _v76RenderRevealBase=renderRevealScreen;
  const _v76RenderSigningBase=renderSigningComplete;
  const _v76ResetBuildBase=resetBuildOnly;
  const _v76ShowScreenBase=showScreen;

  v50RosterEntriesFor=function(team,year=careerState.seasonYear||2019){if(v76IsFantasy()){const q=Number(V76_ROSTER_QUERY_YEAR||year||v76StartYear());return v76FantasyEntries(team,q);}return _v76RosterBase(team,year);};
  historicalRosterEntries=function(team){return v50RosterEntriesFor(team,V76_ROSTER_QUERY_YEAR||V60_ROSTER_QUERY_YEAR||careerState.seasonYear||2019);};
  v50TeamMetaForYear=function(team,year){
    if(!v76IsFantasy())return _v76TeamMetaBase(team,year);
    const frozen=V76_FANTASY_WORLD.frozenTeamMeta[team.short]||_v76TeamMetaBase(team,v76StartYear()),snap=V76_FANTASY_WORLD.seasons[Number(year)];
    return {...frozen,active:Number(year)>=2024?true:frozen.active!==false,strength:snap?.teamStrength?.[team.short]??frozen.strength??80,displayShort:frozen.displayShort||team.short};
  };
  v50ApplySeasonWorld=function(year){
    if(!v76IsFantasy())return _v76ApplyWorldBase(year);const y=Number(year)||v76StartYear(),snap=v76EnsureWorldToYear(y);_v76ApplyWorldBase(y);
    TEAMS.forEach(team=>{const f=V76_FANTASY_WORLD.frozenTeamMeta[team.short]||_v76TeamMetaBase(team,v76StartYear());team.name=f.name;team.enName=f.enName;team.city=f.city;team.division=f.division;team.logo=f.logo;team.color=f.color;team.displayShort=f.displayShort||team.short;team.active=y>=2024?true:f.active!==false;team.conference=(team.division==='Atlantic'?'East':'West');team.strength=snap?.teamStrength?.[team.short]??f.strength??80;});
    if(careerState.team){careerState.team=TEAMS.find(t=>t.short===careerState.team.short)||careerState.team;matchState.homeTeam=careerState.team;if(careerState.contract)careerState.contract.teamName=careerState.team.name;}return y;
  };
  v50TeamActiveNextYear=function(team,nextYear){if(v76IsFantasy()){if(Number(nextYear)>=2024)return true;const f=V76_FANTASY_WORLD.frozenTeamMeta[team.short]||_v76TeamMetaBase(team,v76StartYear());return f.active!==false;}return _v76TeamActiveBase(team,nextYear);};
  generatePlayers=function(team){
    if(v76IsFantasy()&&(careerState.careerYears||1)<=1&&!seasonState.active){const old=careerState.active;careerState.active=true;try{return _v76GeneratePlayersBase(team);}finally{careerState.active=old;}}
    return _v76GeneratePlayersBase(team);
  };
  rollTeamData=function(){if(!v76IsFantasy())return _v76RollTeamDataBase();const candidates=v50ActiveTeams().filter(t=>!state.team||t.name!==state.team.name);state.team=pick(candidates.length?candidates:v50ActiveTeams());state.players=generatePlayers(state.team);state.selectedPlayerId=null;state.rerolls=5;};
  renderTeamChoiceWheel=function(){if(v76IsFantasy()&&(!careerState.teamSelectionTarget||careerState.teamSelectionTarget.active===false))careerState.teamSelectionTarget=pick(v50ActiveTeams());return _v76RenderTeamChoiceWheelBase();};
  careerLikeTeamPower=function(team){if(v76IsFantasy()&&V76_ROSTER_QUERY_YEAR&&team){const snap=v76EnsureWorldToYear(V76_ROSTER_QUERY_YEAR);return (snap?.teamStrength?.[team.short]||team.strength||80)+randomCentered(.55);}return _v76CareerPowerBase(team);};
  generateContractOffers=function(){if(!v76IsFantasy())return _v76GenerateOffersBase();const next=(careerState.seasonYear||v76StartYear())+1;v76EnsureWorldToYear(next);const old=V76_ROSTER_QUERY_YEAR;V76_ROSTER_QUERY_YEAR=next;try{return _v76GenerateOffersBase();}finally{V76_ROSTER_QUERY_YEAR=old;}};
  buildRegularAwardLeaguePool=function(){
    if(!v76IsFantasy())return _v76AwardPoolBase();const year=careerState.seasonYear,snap=v76EnsureWorldToYear(year),pool=[];v50ActiveTeams().forEach(team=>(snap.teams?.[team.short]||[]).forEach(p=>pool.push({id:`dream-${year}-${p.id}`,isUser:false,name:p.name,team:team.name,role:p.role,rating:v60SimRating(p,team.short,year,snap),ovr:p.ovr,wins:clamp(Math.round((seasonState.total||28)*.5+(snap.teamStrength?.[team.short]-80)*.7+v60Signed(`dream-award-wins-${year}-${team.short}`,3)),2,Math.max(3,(seasonState.total||28)-2)),popularity:clamp(Math.round(28+(p.ovr-76)*2.6+v60Signed(`dream-pop-${year}-${p.id}`,10)),8,99),rookie:p.debutYear===year,roleQuality:p.ovr})));pool.push(getSeasonUserAwardProfile());return pool;
  };

  resetBuildOnly=function(){const mode=careerState.simulationMode||V76_SELECTION.mode,start=careerState.startYear||V76_SELECTION.startYear,out=_v76ResetBuildBase();careerState.simulationMode=mode;careerState.startYear=Number(start)||2019;careerState.seasonYear=careerState.simulationMode==='history'?2019:careerState.startYear;Object.keys(V76_FANTASY_WORLD.seasons).forEach(k=>delete V76_FANTASY_WORLD.seasons[k]);V76_FANTASY_WORLD.retired.length=0;V76_FANTASY_WORLD.rebirthQueue.length=0;V76_FANTASY_WORLD.newsByYear={};V76_FANTASY_WORLD.generatedSeq=0;V76_FANTASY_WORLD.frozenTeamMeta={};V76_FANTASY_WORLD.reservedNames.clear();V76_FANTASY_WORLD.startYear=null;if(careerState.simulationMode==='fantasy')v76BuildStartSnapshot();v50ApplySeasonWorld(careerState.seasonYear);return out;};

  showScreen=function(name){_v76ShowScreenBase(name);document.getElementById('modeScreen')?.classList.toggle('active',name==='mode');};
  renderRevealScreen=function(){_v76RenderRevealBase();const chip=document.querySelector('#revealScreen .season-chip');if(chip)chip.innerHTML=`${v76IsFantasy()?'🌌':'📜'} ${careerState.seasonYear} ${v76ModeName()} · 新秀赛季`;const role=document.querySelector('#revealScreen .reveal-player-main .role');if(role)role.textContent=`${state.role} · ${careerState.age}岁入行`;};
  function v76InjectModePill(host){if(!host||host.querySelector('.v76-mode-pill'))return;host.insertAdjacentHTML('beforeend',`<span class="v76-mode-pill">${v76IsFantasy()?'🌌':'📜'} ${v76ModeName()}${v76IsFantasy()?` · ${v76StartYear()}分叉`:''}</span>`);}
  renderSeason=function(){_v76RenderSeasonBase();v76InjectModePill(document.getElementById('seasonLeagueText')?.parentElement);};
  renderCareerTeam=function(){_v76RenderCareerTeamBase();if(v76IsFantasy()&&careerState.awaitingTeamChoice){document.querySelectorAll('#careerTeamManualGrid [data-manual-team]').forEach(btn=>{const t=TEAMS.find(x=>x.name===btn.dataset.manualTeam);if(t&&t.active===false)btn.remove();});}v76InjectModePill(document.getElementById('careerContractMeta')?.parentElement);};
  renderSigningComplete=function(wrap){_v76RenderSigningBase(wrap);if(!v76IsFantasy())return;const card=wrap.querySelector('.v50-roster-transition');if(card){const kicker=card.querySelector('.offseason-kicker');if(kicker)kicker.textContent=`${careerState.seasonYear} · 梦幻时间线`;const title=card.querySelector('h4');if(title)title.textContent=`${careerState.seasonYear} 梦幻阵容已生成`;const p=card.querySelector('p');if(p)p.textContent='本赛季不会按现实名单强制重置。离队、新秀与交易都来自当前存档自己的世界演化。';}wrap.querySelectorAll('.v60-world-card').forEach(x=>x.remove());const snap=v76EnsureWorldToYear(Number(careerState.seasonYear));if(snap?.news?.talentBoom&&!wrap.querySelector('.v15-talent-boom-card')){const target=wrap.querySelector('.v50-roster-transition')||wrap.lastElementChild;target?.insertAdjacentHTML('afterend',v60TalentBoomMarkup(snap.news.talentBoom));}};

  function v76SetSelection(mode,startYear){V76_SELECTION.mode=mode==='history'?'history':'fantasy';V76_SELECTION.startYear=V76_SELECTION.mode==='history'?2019:clamp(Number(startYear)||2019,2019,2023);careerState.simulationMode=V76_SELECTION.mode;careerState.startYear=V76_SELECTION.startYear;}
  function v76RefreshModeUI(){
    const fantasy=V76_SELECTION.mode==='fantasy',f=document.getElementById('fantasyModeCard'),h=document.getElementById('historyModeCard'),panel=document.getElementById('fantasyYearPanel'),note=document.getElementById('modeRuleNote'),confirm=document.getElementById('modeConfirmBtn');f?.classList.toggle('selected',fantasy);h?.classList.toggle('selected',!fantasy);if(panel)panel.style.opacity=fantasy?'1':'.45';document.querySelectorAll('[data-start-year]').forEach(b=>b.classList.toggle('active',Number(b.dataset.startYear)===V76_SELECTION.startYear));if(note)note.innerHTML=fantasy?'<b>梦幻模拟规则：</b>一旦开档，下一年的真实名单不会覆盖当前世界。现实新人仍会在正确年份出现，但队伍归属由这个存档自己的阵容需求、交易和退役决定。':'<b>历史模拟规则：</b>固定从2019开始。2019–2023继续按真实赛季名单和联盟变化校准；你的比赛结果可以改变冠军，但大规模人员更替仍服从历史轨道。';if(confirm)confirm.textContent=fantasy?`从${V76_SELECTION.startYear}开启梦幻时间线 →`:'从2019进入历史时间线 →';
  }
  function v76OpenMode(){V76_SELECTION.mode=careerState.simulationMode||'fantasy';V76_SELECTION.startYear=careerState.startYear||2019;v76RefreshModeUI();showScreen('mode');}
  function v76StartCareer(){v76SetSelection(V76_SELECTION.mode,V76_SELECTION.startYear);registerCareerStartForRoleTraining();hardReset();careerState.simulationMode=V76_SELECTION.mode;careerState.startYear=V76_SELECTION.startYear;careerState.seasonYear=V76_SELECTION.mode==='history'?2019:V76_SELECTION.startYear;if(v76IsFantasy()){Object.keys(V76_FANTASY_WORLD.seasons).forEach(k=>delete V76_FANTASY_WORLD.seasons[k]);V76_FANTASY_WORLD.frozenTeamMeta={};v76BuildStartSnapshot();}v50ApplySeasonWorld(careerState.seasonYear);renderRoleCards();showScreen('role');}

  document.getElementById('fantasyModeCard')?.addEventListener('click',()=>{V76_SELECTION.mode='fantasy';v76RefreshModeUI();});
  document.getElementById('historyModeCard')?.addEventListener('click',()=>{V76_SELECTION.mode='history';V76_SELECTION.startYear=2019;v76RefreshModeUI();});
  document.getElementById('fantasyYearList')?.addEventListener('click',e=>{const b=e.target.closest('[data-start-year]');if(!b)return;V76_SELECTION.mode='fantasy';V76_SELECTION.startYear=Number(b.dataset.startYear);v76RefreshModeUI();});
  document.getElementById('modeBackBtn')?.addEventListener('click',()=>showScreen('cover'));document.getElementById('modeCancelBtn')?.addEventListener('click',()=>showScreen('cover'));document.getElementById('modeConfirmBtn')?.addEventListener('click',v76StartCareer);

  // 旧V7.5把“开始新生涯”直接绑到hardReset；capture阶段截住，先进入模式选择。
  els.coverStartBtn?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();v76OpenMode();},true);
  els.restartCareerBtn?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();v76OpenMode();},true);
  // 梦幻2023开局时排除当年已不参赛的franchise，随机按钮不能抽到幽灵队伍。
  els.randomCareerTeamBtn?.addEventListener('click',e=>{if(!v76IsFantasy())return;e.preventDefault();e.stopImmediatePropagation();if(state.rolling)return;const pool=v50ActiveTeams();state.rolling=true;careerState.teamSelectManual=false;els.randomCareerTeamBtn.disabled=true;showRandomFx('正在随机生涯队伍',pool.map(t=>t.name));let ticks=0;const timer=setInterval(()=>{careerState.teamSelectionTarget=pick(pool);renderTeamChoiceWheel();if(++ticks>=9){clearInterval(timer);state.rolling=false;els.randomCareerTeamBtn.disabled=false;hideRandomFx();}},90);},true);
  els.confirmCareerTeamBtn?.addEventListener('click',e=>{if(!v76IsFantasy())return;const pool=v50ActiveTeams();if(!careerState.teamSelectionTarget||careerState.teamSelectionTarget.active===false)careerState.teamSelectionTarget=pick(pool);},true);

  window.__OWL_V76_DIAGNOSTICS=(inspectYear=null)=>{const y=Number(inspectYear||careerState.seasonYear||v76StartYear()),snap=v76IsFantasy()?v76EnsureWorldToYear(y):null;return{version:V76_VERSION,mode:careerState.simulationMode||V76_SELECTION.mode,startYear:v76StartYear(),seasonYear:careerState.seasonYear||v76StartYear(),inspectYear:y,activeTeams:v50ActiveTeams().length,fantasyPlayers:snap?Object.values(snap.teams||{}).flat().length:null,rookies:snap?.news?.rookies||[],talentBoom:snap?.news?.talentBoom||null,goldenYears:v60GoldenClassYears(Math.max(2038,y)),trades:snap?.news?.trades||[],retirements:snap?.news?.retirements||[],teams:snap?Object.fromEntries(Object.entries(snap.teams||{}).map(([k,v])=>[k,v.map(p=>p.name)])):null};};
  // Console-only regression hook; not exposed in normal UI.
  window.__OWL_V76_TEST_WORLD=(startYear=2019,inspectYear=startYear)=>{v76SetSelection('fantasy',startYear);careerState.simulationMode='fantasy';careerState.startYear=Number(startYear);careerState.seasonYear=Number(startYear);Object.keys(V76_FANTASY_WORLD.seasons).forEach(k=>delete V76_FANTASY_WORLD.seasons[k]);V76_FANTASY_WORLD.retired.length=0;V76_FANTASY_WORLD.rebirthQueue.length=0;V76_FANTASY_WORLD.newsByYear={};V76_FANTASY_WORLD.frozenTeamMeta={};V76_FANTASY_WORLD.reservedNames.clear();v76BuildStartSnapshot();v50ApplySeasonWorld(Number(startYear));return window.__OWL_V76_DIAGNOSTICS(Number(inspectYear));};
  window.__OWL_V76_TEST_HISTORY=(year=2019)=>{v76SetSelection('history',2019);careerState.simulationMode='history';careerState.startYear=2019;careerState.seasonYear=Number(year)||2019;v50ApplySeasonWorld(careerState.seasonYear);const team=TEAMS.find(t=>t.active!==false),entries=team?historicalRosterEntries(team):[];return{mode:'history',year:careerState.seasonYear,activeTeams:v50ActiveTeams().length,sampleTeam:team?.name||null,sampleRoster:entries.slice(0,8).map(e=>e[0])};};


  /* V8 Public Beta · fantasy timeline persistent IO + soft ecosystem guard */
  function v800WorldClone(value){return JSON.parse(JSON.stringify(value));}
  function v800StabilizeFantasySnapshot(snap,year){
    if(!snap?.teams)return snap;
    const roleNames=ROLES.map(r=>r.name);
    Object.entries(snap.teams).forEach(([short,list])=>{
      list=(list||[]);
      list.forEach(p=>{
        p.age=clamp(Number(p.age||20),15,35);
        p.ovr=clamp(Number(p.ovr||76),55,97);
        p.potential=clamp(Math.max(Number(p.potential||p.ovr),p.ovr),60,99);
        p.peakRecorded=clamp(Math.max(Number(p.peakRecorded||p.ovr),p.ovr),55,99);
      });
      // A public save must never arrive in a season with an impossible roster hole.
      // Only add academy players when a role is literally missing; no artificial super-team balancing.
      const missing=roleNames.filter(role=>!list.some(p=>p.role===role));
      missing.forEach((role,i)=>{
        if(list.length>=12)return;
        const p=v76Academy(role,short,Number(year),`public-roster-hole-${year}-${short}-${role}-${i}`,pick(['kr','cn','us','ca','fr']));
        p.ovr=clamp(p.ovr,60,82);p.potential=clamp(p.potential,78,94);
        list.push(p);
        snap.news=snap.news||{retirements:[],rookies:[],trades:[],releases:[],gainers:[],decliners:[]};
        snap.news.rookies=snap.news.rookies||[];
        snap.news.rookies.push({name:p.name,team:short,role:p.role,source:'紧急青训补位'});
      });
      snap.teams[short]=list;
      snap.teamStrength=snap.teamStrength||{};
      snap.teamStrength[short]=v60CalcTeamStrength(list);
    });
    return snap;
  }
  const _v800EnsureWorld=v76EnsureWorldToYear;
  v76EnsureWorldToYear=function(year){
    const snap=_v800EnsureWorld(Number(year));
    if(v76IsFantasy())v800StabilizeFantasySnapshot(snap,Number(year));
    return snap;
  };
  window.__OWL_V800_WORLD_IO={
    export:()=>({
      selection:{mode:V76_SELECTION.mode,startYear:V76_SELECTION.startYear},
      startYear:V76_FANTASY_WORLD.startYear,
      seasons:v800WorldClone(V76_FANTASY_WORLD.seasons||{}),
      retired:v800WorldClone(V76_FANTASY_WORLD.retired||[]),
      newsByYear:v800WorldClone(V76_FANTASY_WORLD.newsByYear||{}),
      rebirthQueue:v800WorldClone(V76_FANTASY_WORLD.rebirthQueue||[]),
      generatedSeq:Number(V76_FANTASY_WORLD.generatedSeq||0),
      frozenTeamMeta:v800WorldClone(V76_FANTASY_WORLD.frozenTeamMeta||{}),
      reservedNames:[...V76_FANTASY_WORLD.reservedNames],
      building:false
    }),
    import:(data={})=>{
      V76_SELECTION.mode=data.selection?.mode==='history'?'history':'fantasy';
      V76_SELECTION.startYear=Number(data.selection?.startYear||2019);
      V76_FANTASY_WORLD.startYear=data.startYear??null;
      V76_FANTASY_WORLD.seasons=v800WorldClone(data.seasons||{});
      V76_FANTASY_WORLD.retired=v800WorldClone(data.retired||[]);
      V76_FANTASY_WORLD.newsByYear=v800WorldClone(data.newsByYear||{});
      V76_FANTASY_WORLD.rebirthQueue=v800WorldClone(data.rebirthQueue||[]);
      V76_FANTASY_WORLD.generatedSeq=Number(data.generatedSeq||0);
      V76_FANTASY_WORLD.frozenTeamMeta=v800WorldClone(data.frozenTeamMeta||{});
      V76_FANTASY_WORLD.reservedNames.clear();
      (data.reservedNames||[]).forEach(n=>V76_FANTASY_WORLD.reservedNames.add(n));
      V76_FANTASY_WORLD.building=false;V76_ROSTER_QUERY_YEAR=null;
      Object.values(V76_FANTASY_WORLD.seasons||{}).forEach(s=>v800StabilizeFantasySnapshot(s,Number(s?.year||careerState.seasonYear||2019)));
      v76RefreshModeUI();
      return true;
    },
    health:(year=careerState.seasonYear)=>{
      const snap=v76IsFantasy()?v76EnsureWorldToYear(Number(year)):null;
      if(!snap)return{mode:'history',year:Number(year)};
      const rows=Object.values(snap.teams||{}).flat(),sizes=Object.fromEntries(Object.entries(snap.teams||{}).map(([k,v])=>[k,v.length]));
      const holes=[];
      Object.entries(snap.teams||{}).forEach(([short,list])=>ROLES.forEach(r=>{if(!list.some(p=>p.role===r.name))holes.push(`${short}:${r.name}`)}));
      return{
        mode:'fantasy',year:Number(year),players:rows.length,avgOvr:rows.length?Number((rows.reduce((s,p)=>s+Number(p.ovr||0),0)/rows.length).toFixed(1)):0,
        elite94:rows.filter(p=>Number(p.ovr)>=94).length,maxOvr:rows.length?Math.max(...rows.map(p=>Number(p.ovr||0))):0,
        minRoster:Object.keys(sizes).length?Math.min(...Object.values(sizes)):0,maxRoster:Object.keys(sizes).length?Math.max(...Object.values(sizes)):0,
        roleHoles:holes,retired:V76_FANTASY_WORLD.retired.length,generatedSeq:V76_FANTASY_WORLD.generatedSeq
      };
    }
  };

  v76RefreshModeUI();
})();

/* ===== V7.6.2 · 2019–2023真实赛制路由 + 排名账本修复 ===== */
(function(){
  const V762_VERSION='V7.6.2';
  const V762_RULES=Object.freeze({
    2019:{year:2019,total:28,regionMode:'global',stages:[
      {name:'Stage 1',games:7,tournament:'Stage 1季后赛',tournamentAfter:true},
      {name:'Stage 2',games:7,tournament:'Stage 2季后赛',tournamentAfter:true},
      {name:'Stage 3',games:7,tournament:'Stage 3季后赛',tournamentAfter:true},
      {name:'Stage 4',games:7,tournament:null,tournamentAfter:false}
    ],summary:'20支队伍 · 28场 · 4个Stage × 7场'},
    2020:{year:2020,total:21,regionMode:'2020',stages:[
      {name:'赛季前段',games:6,tournament:null,tournamentAfter:false},
      {name:'May Melee资格期',games:5,tournament:'May Melee',tournamentAfter:true},
      {name:'Summer Showdown资格期',games:5,tournament:'Summer Showdown',tournamentAfter:true},
      {name:'Countdown Cup资格期',games:5,tournament:'Countdown Cup',tournamentAfter:true}
    ],summary:'20支队伍 · 21场 · 三项赛季中锦标赛'},
    2021:{year:2021,total:16,regionMode:'2021',stages:[
      {name:'May Melee资格赛',games:4,tournament:'May Melee',tournamentAfter:true},
      {name:'June Joust资格赛',games:4,tournament:'June Joust',tournamentAfter:true},
      {name:'Summer Showdown资格赛',games:4,tournament:'Summer Showdown',tournamentAfter:true},
      {name:'Countdown Cup资格赛',games:4,tournament:'Countdown Cup',tournamentAfter:true}
    ],summary:'20支队伍 · 16场 · 4个锦标赛循环 × 4场'},
    2022:{year:2022,total:24,regionMode:'2022',stages:[
      {name:'Kickoff Clash资格赛',games:6,tournament:'Kickoff Clash',tournamentAfter:true},
      {name:'Midseason Madness资格赛',games:6,tournament:'Midseason Madness',tournamentAfter:true},
      {name:'Summer Showdown资格赛',games:6,tournament:'Summer Showdown',tournamentAfter:true},
      {name:'Countdown Cup资格赛',games:6,tournament:'地区Play-Ins',tournamentAfter:true}
    ],summary:'20支队伍 · 24场 · 4个锦标赛阶段 × 6场'},
    2023:{year:2023,total:16,regionMode:'2023',stages:[
      {name:'Spring Stage',games:8,tournament:'Midseason Madness',tournamentAfter:true},
      {name:'Summer Stage',games:8,tournament:null,tournamentAfter:false}
    ],summary:'Spring / Summer · 每Stage 8场 · 共16场'}
  });
  const EAST_2021=new Set(['CDH','GZC','HZS','VAL','NYE','PHI','SEO','SHD']);
  const EAST_2022=new Set(['CDH','GZC','HZS','VAL','PHI','SEO','SHD']);
  const EAST_2023=new Set(['DAL','GZC','HZS','PHI','SEO','SHD']);
  const ASIA_2020=new Set(['CDH','GZC','HZS','LDN','NYE','SEO','SHD']);

  function v762Year(){return Number(careerState.seasonYear||2019);}
  function v762HistoricalEra(){const y=v762Year();return y>=2019&&y<=2023;}
  function v762Rule(year=v762Year()){return V762_RULES[Number(year)]||null;}
  function v762Region(team,year=v762Year()){
    if(!team)return 'GLOBAL'; const s=team.short;
    if(year===2019)return 'GLOBAL';
    if(year===2020)return ASIA_2020.has(s)?'East':'West';
    if(year===2021)return EAST_2021.has(s)?'East':'West';
    if(year===2022)return EAST_2022.has(s)?'East':'West';
    if(year===2023)return EAST_2023.has(s)?'East':'West';
    return team.conference||((team.division==='Atlantic')?'East':'West');
  }
  function v762RegionZh(region){return region==='East'?'东部':region==='West'?'西部':'全联盟';}
  function v762StageStarts(rule=v762Rule()){
    let p=0; return (rule?.stages||[]).map(s=>{const start=p;p+=s.games;return start;});
  }
  function v762StageBounds(stageNo,rule=v762Rule()){
    const starts=v762StageStarts(rule),s=rule?.stages?.[stageNo-1];if(!s)return[0,rule?.total||0];return[starts[stageNo-1],starts[stageNo-1]+s.games];
  }
  function v762StageNo(played=seasonState.played,rule=v762Rule()){
    if(!rule)return 1;let acc=0;for(let i=0;i<rule.stages.length;i++){acc+=rule.stages[i].games;if(played<acc)return i+1;}return rule.stages.length;
  }
  function v762TournamentBreakAtPlayed(played,rule=v762Rule()){
    if(!rule)return 0;let acc=0;for(let i=0;i<rule.stages.length;i++){acc+=rule.stages[i].games;if(acc===played&&rule.stages[i].tournamentAfter)return i+1;}return 0;
  }
  function v762TournamentBonusFor(label,stageNo=0,year=v762Year(),participated=false){
    const s=Number(stageNo)||0,y=Number(year)||v762Year(),txt=String(label||'');
    if(y===2022){
      if(s===2){if(/冠军/.test(txt))return 4;if(/亚军/.test(txt))return 3;if(/季军/.test(txt))return 2;return participated||/四强|八强|晋级/.test(txt)?1:0;}
      if(s===1||s===3){if(/冠军/.test(txt))return 3;if(/亚军/.test(txt))return 2;return participated||/四强|八强|晋级/.test(txt)?1:0;}
      return 0; // Countdown Cup阶段本身用于决定Play-In/季后赛席位，不再额外叠赛事积分。
    }
    if(y===2021){if(/冠军/.test(txt))return 3;if(/亚军/.test(txt))return 2;if(/季军|第三/.test(txt))return 1;return 0;}
    return 0;
  }
  function v762UserTournamentLP(){return (seasonState.stagePlayoffHistory||[]).reduce((n,h)=>n+Number(h.leaguePointBonus??v762TournamentBonusFor(h.result||'',h.stage,v762Year(),!/未晋级/.test(h.result||''))),0);}

  const _v762CurrentStageBase=currentStageNumber;
  currentStageNumber=function(){return v762HistoricalEra()?v762StageNo():_v762CurrentStageBase();};
  const _v762StageSliceBase=stageSlice;
  stageSlice=function(stageNo){if(!v762HistoricalEra())return _v762StageSliceBase(stageNo);const[a,b]=v762StageBounds(stageNo);return seasonState.results.slice(a,b);};
  const _v762StageRecordBase=stageRecord;
  stageRecord=function(stageNo){if(!v762HistoricalEra())return _v762StageRecordBase(stageNo);const a=stageSlice(stageNo);return{wins:a.filter(x=>x==='win').length,losses:a.filter(x=>x==='loss').length};};

  function v762Schedule(){
    const rule=v762Rule(),me=careerState.team,all=v50ActiveTeams().filter(t=>t.name!==me?.name);if(!rule||!me||!all.length)return;
    const year=v762Year(),myRegion=v762Region(me,year),same=all.filter(t=>v762Region(t,year)===myRegion),cross=all.filter(t=>v762Region(t,year)!==myRegion);
    let bag=shuffle([...all]),guard=0;
    while(bag.length<rule.total&&guard++<8){bag.push(...shuffle([...(same.length?same:all),...(cross.length?cross:all)]));}
    bag=bag.slice(0,rule.total);
    for(let i=1;i<bag.length;i++)if(bag[i]?.name===bag[i-1]?.name){const j=bag.findIndex((x,k)=>k>i&&x?.name!==bag[i-1]?.name);if(j>i)[bag[i],bag[j]]=[bag[j],bag[i]];}
    const starts=v762StageStarts(rule);
    seasonState.opponents=bag;seasonState.venues=bag.map((_,i)=>i%2===0?'home':'away');
    seasonState.legs=bag.map((_,i)=>{let si=0;while(si<starts.length-1&&i>=starts[si+1])si++;return rule.stages[si]?.name||`阶段${si+1}`;});
  }

  const _v762SetupSeasonBase=setupSeason;
  setupSeason=function(isRestart=false){
    const out=_v762SetupSeasonBase(isRestart);if(!v762HistoricalEra())return out;
    const rule=v762Rule();seasonState.total=rule.total;seasonState.results=Array(rule.total).fill(null);seasonState.played=0;seasonState.wins=0;seasonState.losses=0;seasonState.userRatings=[];
    seasonState.stageBreakPending=null;seasonState.stageProcessed=[];seasonState.stagePlayoffHistory=[];seasonState.stageTitles=[];seasonState.stageTables={};seasonState.finalStandingsCache=null;seasonState.v741FinalStandingsCache=null;seasonState.v762FinalStandingsCache=null;seasonState.historicalLeaguePoints=0;
    v762Schedule();renderSeason();return out;
  };

  const _v762MarkStageBase=markStageBreakIfNeeded;
  markStageBreakIfNeeded=function(){
    if(!v762HistoricalEra())return _v762MarkStageBase();const s=v762TournamentBreakAtPlayed(seasonState.played);if(s&&!(seasonState.stageProcessed||[]).includes(s)){seasonState.stageBreakPending=s;seasonState.simulating=false;if(seasonState.timer)clearTimeout(seasonState.timer);seasonState.timer=null;}
  };

  function v762MeanStrength(teams){return teams.reduce((n,t)=>n+(Number(t.strength)||80),0)/Math.max(1,teams.length);}
  function v762Rows(games=null){
    const rule=v762Rule(),year=v762Year(),teams=v50ActiveTeams(),total=games==null?rule.total:Math.max(1,Number(games)||1),mean=v762MeanStrength(teams),userGames=games==null?rule.total:Math.min(seasonState.played,total);
    const rows=teams.map(team=>{
      const isUser=team.name===careerState.team?.name;
      if(isUser){const wins=games==null?seasonState.wins:Math.min(seasonState.wins,userGames),losses=Math.max(0,userGames-wins),avg=getSeasonAverageRating?.()||7;return{team,isUser,wins,losses,mapDiff:Math.round((wins-losses)*2.2+(avg-7)*3.5),region:v762Region(team,year)};}
      const delta=(Number(team.strength)||mean)-mean,noise=stableSeasonNoise(team.name,year*97+total,4);
      const rate=clamp(.50+delta*.013+noise*.011,.25,.75),wins=clamp(Math.round(total*rate),0,total),losses=total-wins;
      return{team,isUser,wins,losses,mapDiff:Math.round((wins-losses)*2+stableSeasonNoise(team.name,year+total*13,5)),region:v762Region(team,year)};
    });
    if(year===2021||year===2022){rows.forEach(r=>{const aiBonus=r.isUser?v762UserTournamentLP():clamp(Math.round(Math.max(0,(Number(r.team.strength)||mean)-mean)/5+stableSeasonNoise(r.team.name,year+713,2)),0,6);r.lp=r.wins+aiBonus;});rows.sort((a,b)=>b.lp-a.lp||b.wins-a.wins||b.mapDiff-a.mapDiff||(Number(b.team.strength)||80)-(Number(a.team.strength)||80));}
    else rows.sort((a,b)=>b.wins-a.wins||b.mapDiff-a.mapDiff||(Number(b.team.strength)||80)-(Number(a.team.strength)||80));
    rows.forEach((r,i)=>r.globalRank=i+1);
    const groups={};rows.forEach(r=>(groups[r.region]??=[]).push(r));Object.values(groups).forEach(g=>g.forEach((r,i)=>r.regionRank=i+1));
    return rows;
  }
  function v762Postseason(row){
    const y=v762Year(),rr=row.regionRank||row.globalRank,region=row.region;
    if(y===2019)return row.globalRank<=6?{direct:true,playIn:false,text:'直接晋级赛季季后赛'}:row.globalRank<=12?{direct:false,playIn:true,text:'进入入围赛，争夺最后2席'}:{direct:false,playIn:false,text:'未进入季后赛'};
    if(y===2020)return{direct:false,playIn:true,text:'进入地区季后赛 / 入围阶段'};
    if(y===2021){const direct=region==='West'?rr<=3:rr<=2,playIn=!direct&&(region==='West'?rr<=9:rr<=5);return{direct,playIn,text:direct?'直接晋级赛季季后赛':playIn?'进入地区入围赛':'未进入季后赛'};}
    if(y===2022){
      const direct=region==='West'?rr<=6:rr<=3,played=careerState.v100PlayInResult?.year===2022?careerState.v100PlayInResult:null;
      if(direct)return{direct:true,playIn:false,text:'直接晋级12队季后赛'};
      if(played)return played.qualified?{direct:true,playIn:false,text:'地区Play-Ins突围，晋级12队季后赛'}:{direct:false,playIn:false,text:'地区Play-Ins出局'};
      return{direct:false,playIn:true,text:'进入地区Play-Ins，争夺季后赛席位'};
    }
    if(y===2023){const direct=region==='West'?rr<=3:rr<=2,playIn=!direct&&(region==='West'?rr<=10:true);return{direct,playIn,text:direct?'直接晋级赛季季后赛':playIn?'进入地区Play-Ins':'未进入季后赛'};}
    return{direct:row.globalRank<=8,playIn:false,text:row.globalRank<=8?'晋级季后赛':'未进入季后赛'};
  }

  const _v762SyntheticBase=syntheticFinalStandings;
  syntheticFinalStandings=function(){
    if(!v762HistoricalEra())return _v762SyntheticBase();if(seasonState.v762FinalStandingsCache)return seasonState.v762FinalStandingsCache;
    const rows=v762Rows();rows.forEach(r=>{r.rank=r.globalRank;Object.assign(r,v762Postseason(r));});seasonState.v762FinalStandingsCache=rows;seasonState.finalStandingsCache=rows;return rows;
  };
  const _v762EstimateRankBase=estimateSeasonRank;
  estimateSeasonRank=function(){
    if(!v762HistoricalEra())return _v762EstimateRankBase();if(!seasonState.played)return careerState.rank||7;const rows=seasonState.played>=seasonState.total?syntheticFinalStandings():v762Rows(seasonState.played);return rows.find(r=>r.isUser)?.globalRank||v50ActiveTeams().length;
  };

  const _v762BuildStageBase=buildStageTable;
  buildStageTable=function(stageNo){
    if(!v762HistoricalEra()||v762Year()===2019)return _v762BuildStageBase(stageNo);seasonState.stageTables=seasonState.stageTables||{};const key=`v762-${v762Year()}-${stageNo}-${seasonState.played}`;if(seasonState.stageTables[key])return seasonState.stageTables[key];
    const rule=v762Rule(),stage=rule.stages[stageNo-1],rec=stageRecord(stageNo),year=v762Year(),teams=v50ActiveTeams(),myRegion=v762Region(careerState.team,year),len=stage.games,mean=v762MeanStrength(teams);
    const rows=teams.map(team=>{const isUser=team.name===careerState.team?.name,region=v762Region(team,year);if(isUser)return{team,isUser,region,wins:rec.wins,losses:rec.losses,mapDiff:(rec.wins-rec.losses)*2+stableSeasonNoise(team.name,stageNo,2)};const d=(Number(team.strength)||mean)-mean,rate=clamp(.5+d*.014+stableSeasonNoise(team.name,year*31+stageNo,3)*.018,.20,.80),wins=clamp(Math.round(len*rate),0,len);return{team,isUser,region,wins,losses:len-wins,mapDiff:(wins-(len-wins))*2+stableSeasonNoise(team.name,stageNo+43,3)};});
    rows.sort((a,b)=>b.wins-a.wins||b.mapDiff-a.mapDiff||(Number(b.team.strength)||80)-(Number(a.team.strength)||80));rows.forEach((r,i)=>r.globalRank=i+1);const rg=rows.filter(r=>r.region===myRegion);rg.forEach((r,i)=>r.regionRank=i+1);
    rows.forEach(r=>{if(r.region!==myRegion){r.qualified=false;return;}const rr=r.regionRank||99;if(year===2020)r.qualified=true;else if(year===2021)r.qualified=myRegion==='West'?rr<=6:rr<=4;else if(year===2022)r.qualified=stageNo<4?(myRegion==='West'?rr<=8:rr<=4):(myRegion==='West'?(rr>=7&&rr<=10):(rr>=4&&rr<=6));else if(year===2023)r.qualified=stageNo===1&&(myRegion==='West'?rr<=10:true);else r.qualified=false;});
    seasonState.stageTables[key]=rows;return rows;
  };
  const _v762StageRankBase=stageEstimatedRank;
  stageEstimatedRank=function(stageNo){if(!v762HistoricalEra()||v762Year()===2019)return _v762StageRankBase(stageNo);const mine=buildStageTable(stageNo).find(r=>r.isUser);return mine?.regionRank||mine?.globalRank||v50ActiveTeams().length;};
  const _v762StageQualifiedBase=stageQualified;
  stageQualified=function(stageNo){if(!v762HistoricalEra()||v762Year()===2019)return _v762StageQualifiedBase(stageNo);return!!buildStageTable(stageNo).find(r=>r.isUser)?.qualified;};

  function v762HistoricalTournament(stageNo,participated){
    const rule=v762Rule(),s=rule.stages[stageNo-1],rank=stageEstimatedRank(stageNo),year=v762Year(),region=v762Region(careerState.team,year),our=teamDisplayPower(careerState.starters||[]),teamPower=Number(careerState.team?.strength||80),base=clamp(.22+(our-teamPower)*.015+(90-rank*3)*.003,.13,.58);
    let name=s.tournament||s.name,result='未晋级',rounds=[],bonus=0;

    // 2022 Countdown cycle closes with regional Play-Ins: West 7-10 -> 2 slots; East 4-6 -> 1 slot.
    if(year===2022&&stageNo===4){
      const direct=region==='West'?rank<=6:rank<=3;
      if(direct){result='无需Play-In';careerState.v100PlayInResult=null;}
      else if(participated){
        const slots=region==='West'?2:1,field=region==='West'?4:3;
        const seedEdge=clamp((field-rank+(region==='West'?7:4))*.035,-.08,.10),chance=clamp(.42+(our-teamPower)*.018+seedEdge,.22,.78),qualified=Math.random()<chance;
        result=qualified?'突围成功':'出局';
        rounds=[{round:`${v762RegionZh(region)} Play-Ins`,opponent:'地区入围赛对手',won:qualified,target:3}];
        careerState.v100PlayInResult={year:2022,region,rank,qualified,slots};
        if(qualified)careerState.postseasonSeed=Math.min(12,Math.max(1,estimateSeasonRank()));
      }else result='未获Play-In资格';
      bonus=0;
    }
    // 2023 Spring: West top 2 go straight to MM; West 3-10 / all East OWL teams must survive Knockouts first.
    else if(year===2023&&stageNo===1&&participated){
      const direct=region==='West'&&rank<=2;
      let mainQualified=direct;
      if(!direct){
        const knockoutChance=clamp((region==='West'?.34:.30)+(our-teamPower)*.018+(region==='West'?(11-rank)*.025:(7-rank)*.03),.12,.72);
        mainQualified=Math.random()<knockoutChance;
        rounds.push({round:'Spring Stage Knockouts',opponent:region==='East'?'OWL / Contenders混合对手':'西部Knockouts对手',won:mainQualified,target:3});
      }
      if(!mainQualified){name='Spring Stage Knockouts';result='出局';}
      else{
        const r=Math.random();
        if(r<base*.22)result='冠军';else if(r<base*.48)result='亚军';else if(r<base*.80)result='四强';else result='六强';
        rounds.push({round:'Midseason Madness',opponent:'跨赛区晋级队',won:result==='冠军',target:result==='冠军'?4:3});
        careerState.v100MidseasonRoute={year:2023,region,rank,direct,qualified:true};
      }
    }
    else if(participated){
      const r=Math.random();
      if(r<base*.22)result='冠军';else if(r<base*.48)result='亚军';else if(year===2022&&stageNo===2&&r<base*.66)result='季军';else if(r<base*.80)result='四强';else result='八强';
      rounds=[{round:name,opponent:'地区/国际晋级队',won:result==='冠军',target:3}];
      bonus=(year===2021||year===2022)?v762TournamentBonusFor(result,stageNo,year,true):0;
    }
    if((year===2021||year===2022)&&!(year===2022&&stageNo===4))bonus=v762TournamentBonusFor(result,stageNo,year,participated);
    const h={stage:stageNo,rank,result:`${name}${/未晋级|无需|未获/.test(result)?` · ${result}`:` · ${result}`}`,rounds,champion:null,runnerUp:null,leaguePointBonus:bonus,competitionId:`OWL${year}_${name.replace(/\s+/g,'_').toUpperCase()}`};
    seasonState.stagePlayoffHistory=seasonState.stagePlayoffHistory||[];seasonState.stagePlayoffHistory=seasonState.stagePlayoffHistory.filter(x=>x.stage!==stageNo);seasonState.stagePlayoffHistory.push(h);seasonState.stageProcessed=seasonState.stageProcessed||[];if(!seasonState.stageProcessed.includes(stageNo))seasonState.stageProcessed.push(stageNo);seasonState.stageBreakPending=null;seasonState.finalStandingsCache=null;seasonState.v762FinalStandingsCache=null;
    if(result==='冠军'){seasonState.stageTitles=seasonState.stageTitles||[];seasonState.stageTitles.push(`${name}冠军`);careerState.popularity=clamp(careerState.popularity+7,0,100);careerState.coachTrust=clamp(careerState.coachTrust+4,0,100);}renderSeason();window.scrollTo({top:0,behavior:'smooth'});
  }
  const _v762SimTournamentBase=simulateStagePlayoff;
  simulateStagePlayoff=function(stageNo){if(!v762HistoricalEra()||v762Year()===2019)return _v762SimTournamentBase(stageNo);return v762HistoricalTournament(stageNo,true);};
  const _v762SkipTournamentBase=skipStageBreak;
  skipStageBreak=function(stageNo){if(!v762HistoricalEra()||v762Year()===2019)return _v762SkipTournamentBase(stageNo);return v762HistoricalTournament(stageNo,false);};

  function v762StageDots(){
    const rule=v762Rule(),starts=v762StageStarts(rule),count=rule?.stages?.length||0;
    return rule.stages.map((s,si)=>{
      const [a,b]=v762StageBounds(si+1,rule),rec=stageRecord(si+1),played=clamp(seasonState.played-a,0,s.games),done=seasonState.played>=b,active=seasonState.played>=a&&seasonState.played<b;
      const status=done?'已完成':active?'进行中':'待开始';
      const dots=Array.from({length:s.games},(_,j)=>{
        const i=starts[si]+j,r=seasonState.results[i];
        return `<i class="season-dot ${r||''} ${i===seasonState.played&&seasonState.played<rule.total?'current':''}" title="${s.name} · 第${j+1}场${seasonState.opponents[i]?' · '+seasonState.opponents[i].name:''}"></i>`;
      }).join('');
      return `<div class="stage-dot-group ${active?'current-stage':''} ${done?'done':''}"><div class="stage-dot-head"><div><b>${s.name}</b><small>${rec.wins}-${rec.losses} · ${played}/${s.games}</small></div><em>${status}</em></div><div class="stage-dot-row">${dots}</div></div>`;
    }).join('');
  }
  function v762FinalCard(area){
    const rows=syntheticFinalStandings(),mine=rows.find(r=>r.isUser),post=v762Postseason(mine),regionText=mine.region==='GLOBAL'?`全联盟第 ${mine.globalRank}`:`${v762RegionZh(mine.region)}第 ${mine.regionRank} · 全联盟第 ${mine.globalRank}`,lp=(v762Year()===2021||v762Year()===2022)?` · ${seasonState.wins+v762UserTournamentLP()} 联赛积分`:'';
    area.innerHTML=`<div class="season-complete-banner"><strong>常规赛完成：${seasonState.wins} 胜 ${seasonState.losses} 负${lp} · ${regionText}。</strong><br>${post.text}。<div style="margin-top:13px;display:flex;gap:10px;flex-wrap:wrap"><button class="secondary-btn" id="viewRegularAwardsBtn">${seasonState.awardsViewed?'🏅 返回年度奖项':'🏅 揭晓年度奖项'}</button>${post.direct?'<button class="primary-btn" id="enterPlayoffsBtn">🏆 进入季后赛</button>':post.playIn?'<button class="primary-btn" id="v762PlayInBtn">🎟️ 模拟地区入围赛</button>':''}<button class="secondary-btn" data-open-season-summary="1">📊 查看赛季结算</button></div></div>`;
    document.getElementById('viewRegularAwardsBtn')?.addEventListener('click',openRegularSeasonAwards);document.getElementById('enterPlayoffsBtn')?.addEventListener('click',()=>{careerState.postseasonSeed=mine.globalRank;enterPlayoffs();});document.getElementById('v762PlayInBtn')?.addEventListener('click',()=>{
      const chance=clamp(.54+(teamDisplayPower(careerState.starters||[])-(careerState.team?.strength||80))*.018+(mine.regionRank<=5?.06:0),.28,.78),won=Math.random()<chance;
      const proceed=()=>{if(won){careerState.postseasonSeed=Math.min(8,mine.globalRank);enterPlayoffs();}else showSeasonSummary();};
      if(window.__OWL_V16_MODAL?.result){
        window.__OWL_V16_MODAL.result({icon:won?'🎟️':'🏁',kicker:'POSTSEASON · 入围赛',title:won?'入围赛突围成功':'入围赛出局',body:won?'<p>你拿到了季后赛最后阶段的席位。</p>':'<p>本赛季的正式比赛到此结束。</p>',confirmText:won?'进入季后赛':'查看赛季结算',tone:won?'normal':'warning',onConfirm:proceed});
      }else proceed();
    });
  }

  const _v762RenderSeasonBase=renderSeason;
  renderSeason=function(){
    _v762RenderSeasonBase();if(!v762HistoricalEra()||!careerState.team)return;const rule=v762Rule(),stageNo=v762StageNo(),stage=rule.stages[stageNo-1],[a,b]=v762StageBounds(stageNo,rule),played=clamp(seasonState.played-a,0,stage.games),region=v762Region(careerState.team,v762Year());
    const league=document.getElementById('seasonLeagueText');if(league)league.innerHTML=`Overwatch League · ${v762Year()} · ${v762RegionZh(region)} · ${stage.name}`;
    const head=document.querySelector('.season-track-head h3+span');if(head)head.textContent=rule.summary;
    const dots=document.getElementById('seasonDots');if(dots){dots.classList.remove('season-dots-count-2','season-dots-count-3','season-dots-count-4');dots.classList.add(`season-dots-count-${rule.stages.length}`);dots.innerHTML=v762StageDots();}
    const progress=document.getElementById('seasonProgressCopy');if(progress){
      if(seasonState.played>=rule.total) progress.innerHTML=`常规赛结束 · <strong>${seasonState.played} / ${rule.total}</strong>${(v762Year()===2021||v762Year()===2022)?` · 联赛积分 ${seasonState.wins+v762UserTournamentLP()}`:''}`;
      else progress.innerHTML=`${stage.name} · <strong>${played} / ${stage.games}</strong> · 全赛季 ${seasonState.played} / ${rule.total}${(v762Year()===2021||v762Year()===2022)?` · 联赛积分 ${seasonState.wins+v762UserTournamentLP()}`:''}`;
    }
    const next=seasonState.opponents?.[seasonState.played],nextVenue=seasonState.venues?.[seasonState.played]==='home'?'主场':'客场';const nxt=document.getElementById('seasonNextOpponent');if(nxt)nxt.textContent=seasonState.played>=rule.total?'常规赛已结束':`下一场：${next?.name||'待定'} · ${seasonState.legs?.[seasonState.played]||stage.name} · ${nextVenue}`;
    const play=document.getElementById('playNextSeasonMatchBtn'),fast=document.getElementById('fastSimSeasonBtn'),full=document.getElementById('fullSimSeasonBtn');if(play){play.disabled=!!seasonState.stageBreakPending||seasonState.played>=rule.total||seasonState.simulating;play.textContent=seasonState.played>=rule.total?'✓ 常规赛结束':gameSettings.matchDetailsEnabled?'🎮 比赛详情':'⚡ 模拟单场';}if(fast){fast.disabled=!!seasonState.stageBreakPending||seasonState.played>=rule.total;fast.textContent=seasonState.simulating?'⏸ 暂停':'⏩ 模拟本赛段';}if(full){full.disabled=!!seasonState.stageBreakPending||seasonState.played>=rule.total||seasonState.simulating;full.textContent='🚀 模拟全部常规赛';}
    const area=document.getElementById('seasonCompleteArea');if(!area)return;
    if(seasonState.stageBreakPending){const s=seasonState.stageBreakPending,st=rule.stages[s-1],rec=stageRecord(s),rank=stageEstimatedRank(s),q=stageQualified(s);area.innerHTML=`<div class="stage-break-card"><div class="offseason-kicker">${st.tournament||st.name} · QUALIFICATION</div><h3>${st.name}结束</h3><p>该阶段战绩已经锁定。${v762RegionZh(region)}排名决定${st.tournament||'阶段赛事'}资格。</p><div class="stage-break-stats"><div><span>阶段战绩</span><strong>${rec.wins}-${rec.losses}</strong></div><div><span>${v762RegionZh(region)}排名</span><strong>第 ${rank}</strong></div><div><span>资格</span><strong>${q?'晋级':'未晋级'}</strong></div></div><button class="primary-btn" id="resolveStageBreakBtn">${q?`模拟 ${st.tournament} →`:`结算 ${st.tournament} →`}</button></div>`;document.getElementById('resolveStageBreakBtn')?.addEventListener('click',()=>q?simulateStagePlayoff(s):skipStageBreak(s));return;}
    if(seasonState.played>=rule.total)v762FinalCard(area);else if(!seasonState.v71LastMajorSummary)area.innerHTML='';
  };

  const _v762WholeSeasonBase=v35SimulateWholeSeason;
  v35SimulateWholeSeason=function(){
    if(!v762HistoricalEra())return _v762WholeSeasonBase();if(seasonState.simulating||seasonState.played>=seasonState.total)return;seasonState.simulating=true;
    if(seasonState.stageBreakPending){const s=seasonState.stageBreakPending;stageQualified(s)?simulateStagePlayoff(s):skipStageBreak(s);}
    let guard=0;while(seasonState.played<seasonState.total&&guard++<100){v32SilentRegularGame();markStageBreakIfNeeded();if(seasonState.eventDue&&!gameSettings.autoSeasonEvents){window.__OWL_RUNTIME?.simulation?.pauseWhole?.();seasonState.resumeWholeAfterEvent=true;renderSeason();setTimeout(openScheduledSeasonEvent,80);return;}if(seasonState.stageBreakPending){const s=seasonState.stageBreakPending;stageQualified(s)?simulateStagePlayoff(s):skipStageBreak(s);}}
    seasonState.simulating=false;seasonState.stageBreakPending=null;seasonState.resumeWholeAfterEvent=false;const note=document.getElementById('seasonSimNote');if(note)note.textContent=`✓ 已模拟完整${v762Year()}常规赛：${seasonState.wins}胜${seasonState.losses}负。赛季中锦标赛节点已同步结算。`;renderSeason();window.scrollTo({top:0,behavior:'smooth'});
  };
  document.getElementById('fullSimSeasonBtn')?.addEventListener('click',e=>{if(!v762HistoricalEra())return;e.preventDefault();e.stopImmediatePropagation();v35SimulateWholeSeason();},true);

  // 开发/回归诊断：让浏览器测试能够直接验证年份赛制与排名，不再靠肉眼点完整赛季。
  window.__OWL_V762_DIAGNOSTICS=()=>{const rule=v762Rule(),rows=v762HistoricalEra()&&seasonState.played? (seasonState.played>=seasonState.total?syntheticFinalStandings():v762Rows(seasonState.played)):[];const mine=rows.find(r=>r.isUser);return{version:V762_VERSION,year:v762Year(),mode:careerState.simulationMode,total:seasonState.total,ruleTotal:rule?.total,stageNames:rule?.stages.map(s=>s.name),stageGames:rule?.stages.map(s=>s.games),played:seasonState.played,wins:seasonState.wins,losses:seasonState.losses,globalRank:mine?.globalRank||mine?.rank||null,region:mine?.region||null,regionRank:mine?.regionRank||null,opponents:seasonState.opponents?.length||0};};
  window.__OWL_V762_TEST_FORMAT=(year=2022,teamShort='GZC',wins=15)=>{careerState.simulationMode='fantasy';careerState.startYear=Number(year);careerState.seasonYear=Number(year);v50ApplySeasonWorld(Number(year));careerState.team=TEAMS.find(t=>t.short===teamShort)||v50ActiveTeams()[0];careerState.starters=createRoster(careerState.team,true);careerState.bench=createBenchForTeam(careerState.team);setupSeason(false);const target=Math.min(Number(wins)||0,seasonState.total);seasonState.played=seasonState.total;seasonState.wins=target;seasonState.losses=seasonState.total-target;seasonState.results=Array.from({length:seasonState.total},(_,i)=>i<target?'win':'loss');seasonState.userRatings=Array(seasonState.total).fill(7.2);seasonState.stageBreakPending=null;seasonState.stageProcessed=v762Rule().stages.map((_,i)=>i+1);seasonState.v762FinalStandingsCache=null;seasonState.finalStandingsCache=null;renderSeason();return window.__OWL_V762_DIAGNOSTICS();};

  if(!document.getElementById('v762Style')){const st=document.createElement('style');st.id='v764Style';st.textContent=`
    /* V7.6.3 · 赛程可读性：按Stage数量自适应，不再把四个Stage硬塞成四根细条 */
    #seasonDots{display:grid!important;gap:10px!important;align-items:stretch!important;max-width:860px!important;margin:10px auto 18px!important}
    #seasonDots.season-dots-count-4{grid-template-columns:repeat(2,minmax(0,1fr))!important}
    #seasonDots.season-dots-count-3{grid-template-columns:1fr!important}
    #seasonDots.season-dots-count-2{grid-template-columns:repeat(2,minmax(0,1fr))!important}
    #seasonDots .stage-dot-group{display:block!important;min-width:0;padding:11px 12px!important;border-radius:14px!important;background:rgba(255,255,255,.34);border:1px solid var(--line);transition:.2s ease}
    #seasonDots .stage-dot-group.current-stage{border-color:rgba(255,139,78,.62);box-shadow:0 0 0 2px rgba(255,139,78,.08)}
    #seasonDots .stage-dot-group.done{opacity:.96}
    #seasonDots .stage-dot-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px;min-width:0}
    #seasonDots .stage-dot-head>div{display:flex;align-items:baseline;gap:8px;min-width:0}
    #seasonDots .stage-dot-head b{display:block;margin:0!important;color:var(--ink);font-size:11px!important;font-weight:900;letter-spacing:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #seasonDots .stage-dot-head small{display:block;flex:0 0 auto;color:var(--muted);font-size:9px;font-weight:850;white-space:nowrap}
    #seasonDots .stage-dot-head em{flex:0 0 auto;color:var(--muted);font-size:9px;font-style:normal;font-weight:850;white-space:nowrap}
    #seasonDots .current-stage .stage-dot-head em{color:var(--accent)}
    #seasonDots .stage-dot-row{display:grid!important;grid-template-columns:repeat(var(--stage-games,6),minmax(0,1fr));gap:7px!important;width:100%;min-width:0}
    #seasonDots.season-dots-count-4 .stage-dot-group .stage-dot-row{grid-template-columns:repeat(6,minmax(0,1fr))!important}
    #seasonDots.season-dots-count-2 .stage-dot-group .stage-dot-row{grid-template-columns:repeat(8,minmax(0,1fr))!important}
    #seasonDots .season-dot{width:100%!important;max-width:24px!important;aspect-ratio:1!important;height:auto!important;min-width:0!important;justify-self:center!important;border-width:2px!important}
    #seasonDots.season-dots-count-3 .season-dot{max-width:17px!important}
    #seasonDots.season-dots-count-4 .season-dot{max-width:23px!important}
    #seasonDots.season-dots-count-2 .season-dot{max-width:22px!important}
    #seasonDots .season-dot.current{transform:scale(1.16)!important;box-shadow:0 0 0 5px rgba(255,139,78,.12)!important}
    #seasonDots .season-dot.current::after{inset:-5px!important;border-width:1px!important}
    html[data-theme="dark"] #seasonDots .stage-dot-group{background:#232a35;border-color:#3b4452}
    /* 2024+：三个Stage不再横向挤成三条，改成三张可读的完整宽卡片 */
    #seasonDots.owl2-stage-dots{display:grid!important;grid-template-columns:1fr!important;gap:9px!important;max-width:860px!important}
    #seasonDots.owl2-stage-dots .stage-dot-group{display:block!important;padding:11px 12px!important}
    #seasonDots.owl2-stage-dots .stage-dot-row{grid-template-columns:repeat(19,minmax(0,1fr))!important;gap:5px!important}
    #seasonDots.owl2-stage-dots .stage-dot-row .season-dot{width:100%!important;max-width:18px!important;min-width:0!important;height:auto!important;aspect-ratio:1!important}
    @media(max-width:720px){
      #seasonDots,#seasonDots.season-dots-count-2,#seasonDots.season-dots-count-4{grid-template-columns:1fr!important;max-width:none!important;gap:8px!important}
      #seasonDots .stage-dot-group{padding:10px!important}
      #seasonDots .stage-dot-head{margin-bottom:8px}
      #seasonDots .stage-dot-head b{font-size:10px!important}
      #seasonDots .stage-dot-head small,#seasonDots .stage-dot-head em{font-size:8px!important}
      #seasonDots .stage-dot-row{gap:5px!important}
      #seasonDots .season-dot,#seasonDots.season-dots-count-4 .season-dot,#seasonDots.season-dots-count-2 .season-dot{max-width:25px!important}
      #seasonDots.season-dots-count-3 .season-dot{max-width:19px!important}
    }
    @media(max-width:380px){
      #seasonDots .stage-dot-head>div{gap:5px}
      #seasonDots .stage-dot-head b{max-width:150px}
      #seasonDots .stage-dot-row{gap:3px!important}
      #seasonDots .season-dot{max-width:22px!important}
    }
  `;document.head.appendChild(st);}
})();
