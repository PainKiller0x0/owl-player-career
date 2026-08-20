/* ===== Public Beta 1.9 RC24 · Tactical Identity ===== */
(function(){
  'use strict';
  const VER='Public Beta 1.9 RC24';
  const FULL='Public Beta 1.9 RC24 · Tactical Identity';
  const MAJORS=['突进','消耗','阵地'];

  // RC24：战术不再是每个大类硬塞两个“策划自造小类”。
  // 大体系 = 队伍长期打法；战术 = 当年具体执行框架；战术特点 = 英雄组合 / 后排结构 / 战术机制。
  const TACTIC_LIBRARY={
    '突进':[
      {id:'classic_dive',name:'传统放狗',from:2019,role:{'坦克':3,'弹道输出':3,'长枪输出':-1,'输出支援':2,'战术支援':2},heroes:['温斯顿','D.Va','猎空','源氏'],traits:['双短枪','双飞']},
      {id:'sombra_dive',name:'黑影放狗',from:2019,role:{'坦克':2,'弹道输出':4,'长枪输出':-2,'输出支援':2,'战术支援':2},heroes:['温斯顿','破坏球','黑影','猎空'],traits:['黑影切后','双短枪']},
      {id:'ball_dive',name:'破坏球放狗',from:2019,role:{'坦克':3,'弹道输出':4,'长枪输出':0,'输出支援':1,'战术支援':2},heroes:['破坏球','猎空','黑影','法老之鹰'],traits:['天地狗','双短枪','双飞']},
      {id:'double_bubble',name:'猩猩毛妹',from:2020,to:2021,role:{'坦克':4,'弹道输出':3,'长枪输出':0,'输出支援':2,'战术支援':3},heroes:['温斯顿','查莉娅','猎空','安娜'],traits:['双短枪','安娜资源']},
      {id:'doom_dive',name:'铁拳突进',from:2022,role:{'坦克':4,'弹道输出':4,'长枪输出':-2,'输出支援':2,'战术支援':2},heroes:['末日铁拳','猎空','黑影','源氏'],traits:['双短枪','快速集火']}
    ],
    '消耗':[
      {id:'bunker',name:'奥巴堡',from:2019,to:2020,requiredTraits:['堡垒阵地'],role:{'坦克':2,'弹道输出':-1,'长枪输出':3,'输出支援':3,'战术支援':2},heroes:['奥丽莎','堡垒','巴蒂斯特'],traits:['堡垒阵地','远程火力']},
      {id:'double_shield',name:'双盾体系',from:2019,to:2021,role:{'坦克':3,'弹道输出':0,'长枪输出':4,'输出支援':3,'战术支援':3},heroes:['奥丽莎','西格玛','巴蒂斯特','禅雅塔'],traits:['双狙','双枪辅']},
      {id:'sigma_poke',name:'西格玛长枪',from:2020,role:{'坦克':3,'弹道输出':0,'长枪输出':4,'输出支援':3,'战术支援':3},heroes:['西格玛','黑百合','艾什','索杰恩','巴蒂斯特','禅雅塔','伊拉锐'],traits:['双狙','双枪辅','远程消耗']},
      {id:'sig_bastion',name:'西八堡',from:2023,role:{'坦克':3,'弹道输出':0,'长枪输出':3,'输出支援':4,'战术支援':2},heroes:['西格玛','堡垒','巴蒂斯特','伊拉锐'],traits:['堡垒阵地','双枪辅']},
      {id:'tp_sig_bastion',name:'西八堡',from:2023,requiredTraits:['传送门'],role:{'坦克':2,'弹道输出':2,'长枪输出':2,'输出支援':4,'战术支援':3},heroes:['西格玛','堡垒','秩序之光','巴蒂斯特'],traits:['传送门','双枪辅']},
      {id:'long_range_poke',name:'远程消耗',from:2019,role:{'坦克':0,'弹道输出':0,'长枪输出':4,'输出支援':3,'战术支援':2},heroes:['黑百合','半藏','艾什','法老之鹰','狂鼠','安娜','巴蒂斯特','禅雅塔'],traits:['双狙','双枪辅','天地双炸']}
    ],
    '阵地':[
      {id:'goats',name:'303体系',from:2019,to:2019,requiredTraits:['三坦三辅'],role:{'坦克':4,'弹道输出':-3,'长枪输出':-3,'输出支援':3,'战术支援':4},heroes:['莱因哈特','查莉娅','D.Va','卢西奥','布丽吉塔','禅雅塔'],traits:['三坦三辅','卢西奥加速']},
      {id:'rein_rush',name:'大锤地推',from:2019,role:{'坦克':4,'弹道输出':2,'长枪输出':0,'输出支援':2,'战术支援':4},heroes:['莱因哈特','美','死神','卡西迪','卢西奥'],traits:['卢西奥加速','小美控场','近身爆发']},
      {id:'zombie',name:'放狼体系',from:2021,to:2021,requiredTraits:['抱团扑脸'],role:{'坦克':3,'弹道输出':4,'长枪输出':-2,'输出支援':2,'战术支援':4},heroes:['温斯顿','D.Va','死神','黑影','莫伊拉','卢西奥'],traits:['抱团扑脸','卢西奥加速']},
      {id:'jq_rush',name:'女王地推',from:2022,role:{'坦克':4,'弹道输出':3,'长枪输出':0,'输出支援':2,'战术支援':4},heroes:['渣客女王','索杰恩','源氏','卢西奥','布丽吉塔','雾子'],traits:['卢西奥加速','抱团扑脸']},
      {id:'ram_rush',name:'拉玛刹地推',from:2023,role:{'坦克':4,'弹道输出':2,'长枪输出':1,'输出支援':2,'战术支援':4},heroes:['拉玛刹','美','死神','卡西迪','卢西奥','雾子'],traits:['卢西奥加速','正面压制']}
    ]
  };
  const TRAIT_HEROES={
    '天地狗':['法老之鹰','猎空','黑影'],
    '天地双炸':['法老之鹰','狂鼠'],
    '双枪辅':['安娜','巴蒂斯特','禅雅塔','伊拉锐','朱诺'],
    '双狙':['黑百合','半藏','艾什'],
    '双飞':['法老之鹰','回声','天使'],
    '双短枪':['猎空','黑影'],
    '传送门':['秩序之光'],
    '黑影切后':['黑影'],
    '安娜资源':['安娜'],
    '堡垒阵地':['堡垒','巴蒂斯特'],
    '远程火力':['黑百合','半藏','艾什','堡垒','索杰恩'],
    '远程消耗':['黑百合','半藏','艾什','索杰恩','法老之鹰'],
    '卢西奥加速':['卢西奥'],
    '小美控场':['美'],
    '近身爆发':['死神','卡西迪'],
    '抱团扑脸':['死神','莫伊拉','卢西奥'],
    '正面压制':['拉玛刹','美','死神'],
    '快速集火':['猎空','黑影','源氏'],
    '三坦三辅':['莱因哈特','查莉娅','D.Va','卢西奥','布丽吉塔','禅雅塔']
  };

  function hash(text){let h=2166136261>>>0;for(const c of String(text||'')){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function available(major,year){return (TACTIC_LIBRARY[major]||[]).filter(x=>Number(year)>=Number(x.from||2019)&&(!x.to||Number(year)<=Number(x.to)));}
  function pickStyle(major,team,year,slot='primary',avoid=null){
    let rows=available(major,year);if(avoid&&rows.length>1)rows=rows.filter(x=>x.id!==avoid)||rows;if(!rows.length)rows=TACTIC_LIBRARY[major]||[];
    const key=`${team?.short||team?.name||'TEAM'}|${year}|${major}|${slot}`;return rows[hash(key)%rows.length]||null;
  }
  function pickTraits(style,team,year,slot){
    const rows=[...(style?.traits||[])],required=[...(style?.requiredTraits||[])];if(!rows.length&&!required.length)return[];
    const key=`${team?.short||team?.name||'TEAM'}|${year}|${style.id}|${slot}|traits`,pool=rows.filter(x=>!required.includes(x)),out=[...required];
    if(pool.length){const start=hash(key)%pool.length,want=Math.min(pool.length,Math.max(0,2-out.length));for(let i=0;i<want;i++){const v=pool[(start+i)%pool.length];if(v&&!out.includes(v))out.push(v);}}
    return out.slice(0,3);
  }
  function validStyle(major,id,year){return available(major,year).find(x=>x.id===id)||null;}
  function normalizeSide(raw,major,team,year,slot){
    let style=validStyle(major,raw?.styleId,year)||pickStyle(major,team,year,slot,raw?.styleId);
    // RC23 old saves carried `sub`; never expose the made-up old names again.
    if(!style)style=pickStyle(major,team,year,slot);
    const traits=(Array.isArray(raw?.traits)&&raw.traits.length?raw.traits:pickTraits(style,team,year,slot)).filter(Boolean).slice(0,3);
    return{major,styleId:style?.id||'generic',style:style?.name||`${major}体系`,traits};
  }
  function normalizeProfile(raw,team,year,primaryMajor=null){
    const key=team?.short||team?.name||'TEAM';let primary=raw?.primary?.major||primaryMajor||MAJORS[hash(`${key}|${year}|primary`)%3];if(!MAJORS.includes(primary))primary='突进';
    let secondary=raw?.secondary?.major;if(!MAJORS.includes(secondary)||secondary===primary){const others=MAJORS.filter(x=>x!==primary);secondary=others[hash(`${key}|${year}|secondary`)%others.length];}
    return{version:2,year:Number(year),primary:normalizeSide(raw?.primary,primary,team,year,'primary'),secondary:normalizeSide(raw?.secondary,secondary,team,year,'secondary')};
  }
  function ensureCurrentProfile(){
    if(!careerState?.team)return null;careerState.tacticProfile=normalizeProfile(careerState.tacticProfile,careerState.team,Number(careerState.seasonYear||2019),careerState.tactic||null);careerState.tactic=careerState.tacticProfile.primary.major;return careerState.tacticProfile;
  }
  function attrs(){const a={};ATTRS.forEach(x=>a[x.key]=Number(state.locked?.[x.key]?.value||70));return a;}
  function styleDef(side,year){return validStyle(side.major,side.styleId,year)||(TACTIC_LIBRARY[side.major]||[]).find(x=>x.id===side.styleId)||null;}
  function userPool(year){
    try{if(typeof v71HeroPool!=='function')return[];return v71HeroPool({name:typeof getPlayerName==='function'?getPlayerName():(state.playerName||'Rookie'),role:state.role,overall:typeof myOvr==='function'?myOvr():80,isUser:true},year)||[];}catch(_){return[];}
  }
  function heroAffinity(side,year){
    const pool=userPool(year),def=styleDef(side,year);if(!pool.length||!def)return{score:80,hero:null,trait:null,detail:'英雄池按职责参与体系适配'};
    const styleSet=new Set(def.heroes||[]),traitSet=new Map();(side.traits||[]).forEach(t=>(TRAIT_HEROES[t]||[]).forEach(h=>traitSet.set(h,t)));
    const matches=pool.filter(h=>styleSet.has(h.name)||traitSet.has(h.name)).sort((a,b)=>b.value-a.value);if(!matches.length)return{score:76,hero:null,trait:null,detail:'当前职责在该战术中的英雄池覆盖一般'};
    const top=matches[0],second=matches[1],score=clamp(Math.round(Number(top.value)*.72+Number(second?.value||top.value)*.28),55,99),trait=traitSet.get(top.name)||null;
    return{score,hero:top.name,value:Number(top.value),trait,detail:trait?`${top.name} ${Math.round(top.value)} · 契合「${trait}」`:`${top.name} ${Math.round(top.value)} · 契合「${def.name}」`};
  }
  function sideRoleBonus(role,side,year){const def=styleDef(side,year);return Number(def?.role?.[role]||0);}
  function recalcOffer(o){
    if(!o?.team)return o;const year=Number(careerState.seasonYear||2019)+1,existing=o.renewal?ensureCurrentProfile():null;o.tacticProfile=normalizeProfile(existing,o.team,year,o.tactic||null);o.tactic=o.tacticProfile.primary.major;
    const a=attrs(),p=o.tacticProfile.primary,s=o.tacticProfile.secondary,pHero=heroAffinity(p,year),sHero=heroAffinity(s,year);
    const pPersonal=Number(v37PersonalTacticFit(state.role,p.major,a))+sideRoleBonus(state.role,p,year)+(pHero.score-80)*.13,sPersonal=Number(v37PersonalTacticFit(state.role,s.major,a))+sideRoleBonus(state.role,s,year)+(sHero.score-80)*.13;
    const pNatural=Number(v37NaturalRoleFit(state.role,p.major))+sideRoleBonus(state.role,p,year),sNatural=Number(v37NaturalRoleFit(state.role,s.major))+sideRoleBonus(state.role,s,year);
    const personal=clamp(Math.round(pPersonal*.75+sPersonal*.25),45,99),natural=clamp(Math.round(pNatural*.75+sNatural*.25),45,99),roster=Number(o.fitBreakdown?.rosterNeed??80),total=clamp(Math.round(personal*.50+natural*.30+roster*.20),45,99),old=Number(o.fit||total);
    o.fit=total;o.tacticHeroFit={primary:pHero,secondary:sHero};o.fitBreakdown={...(o.fitBreakdown||{}),personal,natural,total,primaryPersonal:Math.round(pPersonal),secondaryPersonal:Math.round(sPersonal),heroFit:Math.round(pHero.score*.75+sHero.score*.25)};
    if(Number.isFinite(Number(o.starterScore))){o.starterScore=Number(o.starterScore)+(total-old)*.30;o.rolePromise=o.starterScore>=88?'核心首发':o.starterScore>=80?'稳定首发':o.starterScore>=71?'首发竞争':'轮换选手';}
    return o;
  }
  function sideHtml(side,label,styleLabel,hero){
    const traits=(side.traits||[]).length?(side.traits||[]).map(x=>`<b>${esc(x)}</b>`).join('<i>·</i>'):'<b>标准执行</b>';
    return `<div class="v23-tactic-item ${label==='主体系'?'primary':''}"><span>${label}</span><strong>${esc(side.major)}</strong><small>${styleLabel}：<em>${esc(side.style)}</em></small><div class="v24-tactic-traits"><u>战术特点</u>${traits}</div>${hero?.hero?`<div class="v24-hero-fit">英雄池契合：${esc(hero.detail)}</div>`:''}</div>`;
  }
  function profileHtml(o){
    const p=o?.tacticProfile;if(!p)return'';const hf=o.tacticHeroFit||{};
    return `<section class="v23-tactic-profile v24-tactic-profile"><div class="v19-section-label">战术体系 · 详细视图</div><div class="v23-tactic-grid">${sideHtml(p.primary,'主体系','招牌战术',hf.primary)}${sideHtml(p.secondary,'副体系','第二战术',hf.secondary)}</div><p>综合体系适配 <strong>${Number(o.fit||0)}</strong> · 主体系约 75%、副体系约 25% 参与签约适配；战术与战术特点会结合你的英雄池计算契合度。</p></section>`;
  }
  function decorateMarket(wrap){
    if(!wrap||!offseasonState?.contractExpired)return;(offseasonState.offers||[]).forEach(o=>{recalcOffer(o);const card=wrap.querySelector(`[data-offer-id="${CSS.escape(o.id)}"]`),shell=card?.closest('.offer-card-shell');if(!shell)return;
      const body=shell.querySelector('.v19-offer-details-body');if(body){[...body.querySelectorAll(':scope > .v19-detail-line')].forEach(n=>{if(n.querySelector('span')?.textContent.trim()==='主打体系')n.remove();});body.querySelector('.v23-tactic-profile')?.remove();body.insertAdjacentHTML('afterbegin',profileHtml(o));}
      const fit=card.querySelector('.offer-fit strong');if(fit)fit.textContent=String(o.fit);
    });
  }
  const baseGenerate=generateContractOffers;generateContractOffers=function(){const out=baseGenerate.apply(this,arguments);(offseasonState.offers||[]).forEach(recalcOffer);return out;};
  const baseApply=applyTeamFromOffer;applyTeamFromOffer=function(offer){if(offer)recalcOffer(offer);const out=baseApply.apply(this,arguments);if(offer?.tacticProfile){careerState.tacticProfile=JSON.parse(JSON.stringify(offer.tacticProfile));careerState.tactic=careerState.tacticProfile.primary.major;}return out;};
  const baseMarket=renderContractMarket;renderContractMarket=function(wrap){(offseasonState.offers||[]).forEach(recalcOffer);const out=baseMarket.apply(this,arguments);decorateMarket(wrap);return out;};
  const baseSetup=setupSeason;setupSeason=function(){ensureCurrentProfile();const out=baseSetup.apply(this,arguments);ensureCurrentProfile();return out;};
  ensureCurrentProfile();
  const api=Object.freeze({version:VER,release:FULL,library:TACTIC_LIBRARY,traitHeroes:TRAIT_HEROES,profileFor:(team,year,primary)=>normalizeProfile(null,team,year,primary),recalcOffer,ensureCurrentProfile,heroAffinity,available:(major,year)=>available(major,year).map(x=>x.name),honorImportance:typeof honorImportance==='function'?honorImportance:null});
  window.__OWL_V24_TACTICAL_IDENTITY=api;
  // Keep the old seam alive for old saves / old QA callers, but the data schema is V2.
  window.__OWL_V23_CAREER_SYSTEMS=api;
})();
