/* ============================================================================
   Public Beta 1.1 RC2 · WORLD CUP INTEGRATION
   国家队观察 / 试训 / 7人名单 / 资格赛 / 小组赛 / 淘汰赛 / 国家队履历
   史实举办年：2016/2017/2018/2019/2023/2026；当前生涯从2019开始。
   2027+ 为架空动态世界：每年举办一届，国家队资格赛与俱乐部赛季并行，主赛在本作俱乐部年终总决赛后进行。
   ============================================================================ */
(function(){
  const VWC_VERSION=1;
  const VWC_COUNTRIES={
    cn:'中国',kr:'韩国',us:'美国',ca:'加拿大',fr:'法国',gb:'英国',fi:'芬兰',se:'瑞典',dk:'丹麦',de:'德国',ru:'俄罗斯',nl:'荷兰',be:'比利时',es:'西班牙',pt:'葡萄牙',at:'奥地利',ie:'爱尔兰',il:'以色列',sa:'沙特阿拉伯',th:'泰国',au:'澳大利亚',nz:'新西兰',tw:'中国台湾',
    ar:'阿根廷',br:'巴西',cl:'智利',co:'哥伦比亚',cr:'哥斯达黎加',ec:'厄瓜多尔',gt:'危地马拉',hn:'洪都拉斯',mx:'墨西哥',pa:'巴拿马',pe:'秘鲁',pr:'波多黎各',
    no:'挪威',pl:'波兰',it:'意大利',is:'冰岛',cz:'捷克',ee:'爱沙尼亚',gr:'希腊',bh:'巴林',lv:'拉脱维亚',za:'南非',ch:'瑞士',tr:'土耳其',
    hk:'中国香港',jp:'日本',in:'印度',id:'印度尼西亚',my:'马来西亚',pk:'巴基斯坦',ph:'菲律宾',sg:'新加坡'
  };
  const VWC_ISO={cn:'CHN',kr:'KOR',us:'USA',ca:'CAN',fr:'FRA',gb:'GBR',fi:'FIN',se:'SWE',dk:'DEN',de:'GER',ru:'RUS',nl:'NED',be:'BEL',es:'ESP',pt:'POR',at:'AUT',ie:'IRL',il:'ISR',sa:'KSA',th:'THA',au:'AUS',nz:'NZL',tw:'TPE',ar:'ARG',br:'BRA',cl:'CHL',co:'COL',cr:'CRC',ec:'ECU',gt:'GUA',hn:'HON',mx:'MEX',pa:'PAN',pe:'PER',pr:'PUR',no:'NOR',pl:'POL',it:'ITA',is:'ISL',cz:'CZE',ee:'EST',gr:'GRE',bh:'BRN',lv:'LAT',za:'RSA',ch:'SUI',tr:'TUR',hk:'HKG',jp:'JPN',in:'IND',id:'IDN',my:'MAS',pk:'PAK',ph:'PHI',sg:'SGP'};
  const VWC_REGION={
    cn:'ASIA',kr:'ASIA',tw:'ASIA',hk:'ASIA',jp:'ASIA',au:'ASIA',nz:'ASIA',th:'ASIA',in:'ASIA',id:'ASIA',my:'ASIA',pk:'ASIA',ph:'ASIA',sg:'ASIA',
    us:'AMER',ca:'AMER',ar:'AMER',br:'AMER',cl:'AMER',co:'AMER',cr:'AMER',ec:'AMER',gt:'AMER',hn:'AMER',mx:'AMER',pa:'AMER',pe:'AMER',pr:'AMER',
    fr:'EMEA',gb:'EMEA',fi:'EMEA',se:'EMEA',dk:'EMEA',de:'EMEA',ru:'EMEA',nl:'EMEA',be:'EMEA',es:'EMEA',pt:'EMEA',at:'EMEA',ie:'EMEA',il:'EMEA',sa:'EMEA',no:'EMEA',pl:'EMEA',it:'EMEA',is:'EMEA',cz:'EMEA',ee:'EMEA',gr:'EMEA',bh:'EMEA',lv:'EMEA',za:'EMEA',ch:'EMEA',tr:'EMEA'
  };
  const VWC_STRENGTH={kr:96,cn:94,us:92,sa:91,fr:89,fi:89,se:88,dk:88,ca:87,gb:87,jp:87,es:86,de:86,ru:86,au:84,br:84,co:84,no:84,pl:83,nl:83,mx:83,th:82,hk:81,pt:81,at:81,ie:80,ph:80,pk:79,in:79,tw:82,nz:78,be:79,it:79,tr:81,ar:80,cl:79,pr:78};
  const VWC_2019_DIRECT=new Set(['kr','cn','ca','us','fr']);
  const VWC_2023_QUALIFIER=new Set(['us','ca','mx','pr','cr','gt','co','br','cl','pe','ar','ec','be','fr','gb','it','nl','es','de','no','pl','sa','se','tr','tw','hk','id','jp','ph','kr','au','in','my','nz','sg','th']);
  const VWC_2023_WILDCARD=new Set(['dk','fi','is','pt']);
  const VWC_2026_INVITED=new Set(['br','ca','co','mx','us','dk','fi','fr','gb','no','sa','es','se','au','cn','hk','jp','kr','th']);
  const VWC_2026_DIRECT_FINALISTS=new Set(['sa','cn']);
  const VWC_2026_CONFERENCE=new Set(['ar','cl','cr','ec','gt','hn','pa','pe','pr','at','bh','be','cz','ee','de','gr','is','ie','il','it','lv','nl','pl','pt','za','ch','tr','in','my','nz','pk','ph','sg']);
  const VWC_2026_MAIN=new Set([...VWC_2026_INVITED,'ar','cl','pr','de','pl','ie','at','pt','in','pk','ph']);
  const VWC_2026_PROGRAM=new Set([...VWC_2026_INVITED,...VWC_2026_CONFERENCE]);
  const VWC_2026_QUAL_GROUPS=[['ca','co','br','pr'],['us','mx','ar','cl'],['kr','jp','hk','pk'],['au','th','in','ph'],['fi','se','dk','at'],['gb','no','pt','de'],['es','fr','ie','pl']];
  const VWC_2026_GROUPS=[['cn','us','se','jp'],['sa','au','mx','gb'],['ca','de','th','es'],['fr','kr','dk','co']];
  const VWC_2026_FINAL16=new Set(VWC_2026_GROUPS.flat());
  const VWC_2023_GROUPS=[['kr','fi','co','mx'],['gb','au','ca','br'],['cn','es','th','hk'],['us','sa','fr','jp']];
  const VWC_2023_FINAL_FIELD=[...new Set(VWC_2023_GROUPS.flat())];
  const VWC_2019_FIELD=['kr','cn','us','ca','fr','gb','dk','nl','ru','se','fi','au','br','jp','de','no'];
  const VWC_STAGE_LABEL={selection:'国家队选拔',preliminary:'预选赛',wildcard:'Wild Card Challenge',conference:'Conference Cup',qualifier:'在线资格赛',group:'世界杯小组赛',knockout:'世界杯淘汰赛'};

  function vwcEsc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function vwcHash01(seed){const careerSeed=String(state?.careerSeed||careerState?.careerSeed||'owl-default');const scoped=`${careerSeed}|${seed}`;if(typeof v60Unit==='function')return v60Unit(`vwc|${scoped}`);let h=2166136261>>>0;for(const ch of String(scoped)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0)/4294967295;}
  function vwcSigned(seed,range=1){return (vwcHash01(seed)*2-1)*range;}
  function vwcClamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function vwcCountryName(code){return VWC_COUNTRIES[code]||V52_PLAYER_COUNTRIES?.[code]||String(code||'--').toUpperCase();}
  function vwcFlag(code){return `<img src="${v51SvgData(v51FlagSvg(code))}" alt="${vwcEsc(VWC_ISO[code]||String(code).toUpperCase())}">`;}
  function vwcPower(code){return Number(VWC_STRENGTH[code]??76);}
  function vwcRegion(code){return VWC_REGION[code]||'EMEA';}
  function vwcRoleGroup(role){if(role==='坦克')return'tank';if(String(role).includes('支援'))return'support';return'damage';}
  function vwcRoleZh(g){return g==='tank'?'坦克':g==='support'?'支援':'输出';}
  function vwcOvr(){return Number(getMyOvr()==='--'?78:getMyOvr());}
  function vwcYear(){return Number(careerState.seasonYear||2019);}

  function vwcConfig(year){
    year=Number(year);
    if(year===2016)return{year,edition:1,historical:true,display:'2016 Overwatch World Cup',selectionWindow:'2016年夏季',finalWindow:'11月 · BlizzCon',note:'首届世界杯 · 史实档案'};
    if(year===2017)return{year,edition:2,historical:true,display:'2017 Overwatch World Cup',selectionWindow:'2017年春夏',finalWindow:'11月 · BlizzCon',note:'四站小组赛 → BlizzCon'};
    if(year===2018)return{year,edition:3,historical:true,display:'2018 Overwatch World Cup',selectionWindow:'2018年春夏',finalWindow:'11月 · BlizzCon',note:'四地小组赛 → 八强'};
    if(year===2019)return{year,edition:4,historical:true,display:'2019 Overwatch World Cup',selectionWindow:'6–7月试训',qualifierWindow:'10月31日预选',groupWindow:'11月1日小组赛',finalWindow:'11月2日 · BlizzCon',note:'10队小组赛 · 单败淘汰'};
    if(year===2023)return{year,edition:5,historical:true,display:'2023 Overwatch World Cup',selectionWindow:'2月Trials / 3月试训 / 4月锁7人名单',qualifierWindow:'6月在线资格赛',groupWindow:'10月29日–11月1日',finalWindow:'11月3–4日 · BlizzCon',note:'36支邀请队 + Wild Card · 16队正赛'};
    if(year===2026)return{year,edition:6,historical:true,display:'2026 Overwatch World Cup',selectionWindow:'2–4月试训 · 5月4日锁名单',qualifierWindow:'Conference Cup：3月13–15日 AMER / 3月14–15日 ASIA / 4月17–19日 EMEA · 在线资格赛：5月29–31日 ASIA / 5月30–31日、6月6–7日 AMER+EMEA',groupWindow:'8月20–23日 · 韩国',finalWindow:'9月12–13日 · Anaheim · BlizzCon',note:'52队项目 · 30队主赛 · 16队韩国小组赛 · BlizzCon八强'};
    if(year>2026)return{year,edition:null,historical:false,display:`${year} Overwatch World Cup`,selectionWindow:'春季国家队选拔',qualifierWindow:'初夏地区资格赛',groupWindow:'夏末世界小组赛',finalWindow:'秋季世界总决赛',note:'2026规则延续 · 区域赛区 + 上届冠亚军直通'};
    return null;
  }

  function vwcInstallCountries(){
    Object.assign(V52_PLAYER_COUNTRIES,VWC_COUNTRIES);
    const select=document.getElementById('playerCountrySelect');if(!select)return;
    const existing=new Set([...select.options].map(o=>o.value));
    const regionOrder=['ASIA','AMER','EMEA'];
    regionOrder.forEach(region=>Object.entries(VWC_COUNTRIES).filter(([c])=>vwcRegion(c)===region&&!existing.has(c)).sort((a,b)=>a[1].localeCompare(b[1],'zh-CN')).forEach(([code,name])=>{const o=document.createElement('option');o.value=code;o.textContent=name;select.appendChild(o);existing.add(code);}));
    const small=select.closest('.name-input-wrap')?.querySelector('small');if(small)small.textContent='国籍会影响世界杯国家队资格、选拔竞争与2026突破选手机会；已扩展至世界杯主要参赛国家/地区。';
  }

  function vwcRoot(){
    if(!careerState.worldCup||typeof careerState.worldCup!=='object')careerState.worldCup={version:VWC_VERSION,seasons:{}};
    careerState.worldCup.version=VWC_VERSION;careerState.worldCup.seasons=careerState.worldCup.seasons||{};return careerState.worldCup;
  }
  function vwcDirectFinalists(year){
    year=Number(year);if(year===2026)return new Set(VWC_2026_DIRECT_FINALISTS);
    const prev=vwcRoot().seasons?.[year-1],final=(prev?.observerReport||[]).find(row=>row.round==='总决赛')||(prev?.observerReport||[]).at(-1),out=[prev?.worldChampion,prev?.worldRunnerUp,final?.loser].filter(code=>VWC_COUNTRIES[code]);
    if(out.length<2)[...VWC_2026_DIRECT_FINALISTS].filter(code=>!out.includes(code)).slice(0,2-out.length).forEach(code=>out.push(code));
    return new Set(out.length?out:VWC_2026_DIRECT_FINALISTS);
  }
  function vwcRoute(year,country){
    if(year===2019)return VWC_2019_DIRECT.has(country)?'direct-group':'preliminary';
    if(year===2023){if(country==='cn')return'direct-group';if(VWC_2023_QUALIFIER.has(country))return'qualifier';if(VWC_2023_WILDCARD.has(country))return'wildcard';return'no-team';}
    if(year>=2026){if(vwcDirectFinalists(year).has(country))return'direct-group';if(VWC_2026_INVITED.has(country))return'qualifier';if(VWC_2026_CONFERENCE.has(country))return'conference';if(!VWC_2026_PROGRAM.has(country))return'breakthrough';return'no-team';}
    return'no-team';
  }
  function vwcFirstStage(rec){
    if(rec.route==='direct-group')return'group';if(rec.route==='wildcard')return'wildcard';if(rec.route==='conference')return'conference';if(rec.route==='preliminary')return'preliminary';return'qualifier';
  }
  function vwcTrigger(rec,stage){
    if(stage==='selection')return 0;
    if(rec.year===2019)return 1;
    if(rec.year===2023){if(stage==='wildcard')return .12;if(stage==='qualifier')return .34;return 1;}
    if(rec.year===2026){if(stage==='conference')return .12;if(stage==='qualifier')return .31;if(stage==='group')return .62;if(stage==='knockout')return .76;}
    if(stage==='conference')return .14;if(stage==='qualifier')return .32;if(stage==='group')return .62;if(stage==='knockout')return .78;return 1;
  }
  function vwcTriggerGames(rec,stage){const t=vwcTrigger(rec,stage);return Math.min(seasonState.total||28,Math.ceil((seasonState.total||28)*t));}
  // 国家队选拔/地区资格赛可以与俱乐部赛季并行；世界杯正赛与淘汰赛统一放到
  // 俱乐部年终总决赛之后。2019/2023符合现实主赛时间线；2026+是本作OWL延续线的排期约束。
  function vwcPostClubStage(rec,stage){
    if(!rec||!stage)return false;
    if(rec.year===2019)return ['preliminary','group','knockout'].includes(stage);
    return ['group','knockout'].includes(stage);
  }
  function vwcClubPostseasonResolved(rec){
    if(Number(seasonState.played||0)<Number(seasonState.total||0))return false;
    if(['champion','runnerup','eliminated'].includes(playoffState.round))return true;
    // 2019 / 2023 世界杯正赛发生在 OWL 年度季后赛之后。
    // 非季后赛队伍在玩家明确“结束俱乐部赛季”时才推进这条全联盟时间线，
    // 避免常规赛刚打完就把十月底的世界杯提前召唤出来。
    return rec?.clubCalendarReleased===true;
  }
  function vwcHasClubPostseasonPath(year){
    if(['champion','runnerup','eliminated'].includes(playoffState.round))return false;
    try{
      if(Number(year)>=2020&&Number(year)<=2023&&typeof syntheticFinalStandings==='function'&&typeof v762Postseason==='function'){
        const mine=syntheticFinalStandings().find(r=>r.isUser),post=mine?v762Postseason(mine):null;
        if(!post)return false;
        if(post.direct)return true;
        // 入围赛突围后现有系统会写 postseasonSeed；没有这个标记时，
        // 进入“休赛期”视为玩家已经结束/放弃该俱乐部季后赛路径。
        return !!post.playIn&&Number(careerState.postseasonSeed||0)>0;
      }
    }catch(e){}
    return typeof estimateSeasonRank==='function'?estimateSeasonRank()<=8:false;
  }
  function vwcDue(rec){
    if(!rec||rec.completed)return false;
    if(rec.phase==='selection')return true;
    const stage=rec.nextStage;if(!stage)return false;
    const reached=Number(seasonState.played||0)>=vwcTriggerGames(rec,stage);if(!reached)return false;
    // 世界杯主赛统一在俱乐部年终总决赛之后；资格赛/Conference Cup仍可发生在赛季中。
    if(vwcPostClubStage(rec,stage))return vwcClubPostseasonResolved(rec);
    return true;
  }

  function vwcEnsureRecord(year=vwcYear()){
    const cfg=vwcConfig(year);if(!cfg)return null;const root=vwcRoot();let rec=root.seasons[year];
    if(rec){
      // 旧版/半截存档迁移：世界杯记录允许向前兼容，不能因为新增字段缺失在事件或比赛时崩掉。
      rec.events=Array.isArray(rec.events)?rec.events:[];rec.matches=Array.isArray(rec.matches)?rec.matches:[];rec.roster=Array.isArray(rec.roster)?rec.roster:[];
      rec.eventMods=rec.eventMods&&typeof rec.eventMods==='object'?rec.eventMods:{power:0,rating:0};
      rec.eventMods.power=Number(rec.eventMods.power||0);rec.eventMods.rating=Number(rec.eventMods.rating||0);
      rec.nationalCohesion=Number.isFinite(Number(rec.nationalCohesion))?vwcClamp(Number(rec.nationalCohesion),0,100):50;
      rec.homeCountry=rec.homeCountry||state.playerCountry||'cn';rec.representingCountry=rec.representingCountry||rec.homeCountry;
      rec.route=rec.route||vwcRoute(year,rec.homeCountry);if(year>=2026&&!rec.completed&&!rec.selected&&rec.phase==='selection')rec.route=vwcRoute(year,rec.homeCountry);rec.worldRunnerUp=rec.worldRunnerUp||null;rec.version=VWC_VERSION;
      rec.selected=!!rec.selected;rec.starter=!!rec.starter;rec.completed=!!rec.completed;
      rec.observerReport=Array.isArray(rec.observerReport)?rec.observerReport:[];rec.declineMedia=rec.declineMedia||null;
      rec.eventCount=Number(rec.eventCount||rec.events.filter(e=>e?.kind==='random'||e?.kind==='standby').length||0);
      rec.standbyEligible=!!rec.standbyEligible;rec.standbyChecked=!!rec.standbyChecked;rec.standbyPending=!!rec.standbyPending;
      return rec;
    }
    const home=state.playerCountry||'cn',route=vwcRoute(year,home);
    rec={version:VWC_VERSION,year,homeCountry:home,representingCountry:home,breakthrough:false,route,phase:'selection',nextStage:null,pendingStage:'selection',selected:false,starter:false,roster:[],matches:[],observerReport:[],events:[],eventCount:0,nationalCohesion:50,selectionChoice:null,selectionRank:null,eventMods:{power:0,rating:0},declineMedia:null,standbyEligible:false,standbyChecked:false,standbyPending:false,completed:false,result:null,worldChampion:null,worldRunnerUp:null,createdAt:new Date().toISOString()};
    root.seasons[year]=rec;
    if(route==='no-team'){rec.phase='no-team';rec.pendingStage=null;rec.completed=true;rec.result='当届国家/地区未进入世界杯计划';return rec;}
    if(route==='breakthrough'){rec.breakthrough=true;rec.representingCountry=vwcBreakthroughHost(home,year);rec.note=`以 ${vwcCountryName(home)} 突破选手身份竞争 ${vwcCountryName(rec.representingCountry)} 的7人名单`;}
    return rec;
  }
  function vwcBreakthroughHost(home,year){
    const region=vwcRegion(home),pool=[...VWC_2026_MAIN].filter(c=>vwcRegion(c)===region&&c!==home).sort((a,b)=>vwcPower(b)-vwcPower(a));
    if(!pool.length)return home;return pool[Math.floor(vwcHash01(`${year}|${home}|breakthrough`)*Math.min(5,pool.length))];
  }

  function vwcWorldPlayers(year,country){
    const out=[],seen=new Set();
    function push(p){if(!p?.name||seen.has(p.name)||p.country!==country)return;seen.add(p.name);out.push(p);}
    try{
      if(year>=2024){
        const snap=(typeof v76IsFantasy==='function'&&v76IsFantasy()&&typeof v76EnsureWorldToYear==='function')?v76EnsureWorldToYear(year):(typeof v60EnsureWorldToYear==='function'?v60EnsureWorldToYear(year):null);
        Object.values(snap?.teams||{}).flat().forEach(p=>push({name:p.name,role:p.role,ovr:Number(p.ovr||78),country:p.country||'kr',club:p.teamShort||'职业队'}));
      }else{
        TEAMS.forEach(team=>(v50RosterEntriesFor(team,year)||[]).forEach(e=>push({name:e[0],role:e[1],ovr:Number(e[2]||78),country:e[3]||V60_COUNTRY_BY_NAME?.[e[0]]||'kr',club:team.name})));
      }
    }catch(e){}
    const stems=['Nova','Pulse','Orbit','Rook','Mira','Aster','Vanta','Lynx','Sora','Echo','Flint','Rune'];
    const quotas={tank:3,damage:6,support:5};
    Object.entries(quotas).forEach(([g,n])=>{let have=out.filter(p=>vwcRoleGroup(p.role)===g).length;for(let i=have;i<n;i++){const role=g==='tank'?'坦克':g==='support'?(i%2?'战术支援':'输出支援'):(i%2?'弹道输出':'长枪输出');const name=`${stems[(i+Math.floor(vwcHash01(country+g)*stems.length))%stems.length]}-${(VWC_ISO[country]||country.toUpperCase()).slice(0,3)}${i+1}`;push({name,role,ovr:Math.round(vwcClamp(vwcPower(country)-8+vwcSigned(`${year}|${country}|${g}|${i}`,5),62,94)),country,club:'本土赛区'});}});
    return out;
  }
  function vwcSelectionPool(rec){
    const country=rec.representingCountry,pool=vwcWorldPlayers(rec.year,country);
    const user={name:getPlayerName(),role:state.role,ovr:vwcOvr(),country:rec.homeCountry,club:careerState.team?.name||'职业队',isUser:true};pool.push(user);return pool;
  }
  function vwcChoiceData(year){
    if(year===2023)return[
      {id:'trials',title:'报名 World Cup Trials',desc:'直接把自己扔进公开试炼，和其他候选人现场抢位置。',effect:'选拔爆发 +3.2 · 状态 -4',bonus:3.2,condition:-4,cohesion:0},
      {id:'system',title:'参加委员会正式试训',desc:'展示沟通、战术执行和角色纪律。没那么炸，但教练最容易睡得着。',effect:'选拔 +2.0 · 国家队磨合 +5',bonus:2.0,condition:-1,cohesion:5},
      {id:'pool',title:'提交多位置英雄池方案',desc:'用版本适应和英雄池证明：换版本也别急着把我踢出群聊。',effect:'选拔 +2.5 · 英雄池高时额外加成',bonus:2.5,condition:-2,cohesion:2}
    ];
    return[
      {id:'flash',title:'爆发型试训',desc:'把机械能力和关键局表现拉满。风险是训练量也跟着拉满。',effect:'选拔 +3.0 · 状态 -4',bonus:3,condition:-4,cohesion:0},
      {id:'system',title:'体系型试训',desc:'强调沟通、协同和战术服从。国家队不是排位五排，虽然有时也挺像。',effect:'选拔 +2.0 · 磨合 +5',bonus:2,condition:-1,cohesion:5},
      {id:'pool',title:'英雄池展示',desc:'优先展示多版本可用性与临场切换能力。',effect:'选拔 +2.4 · 英雄池高时额外加成',bonus:2.4,condition:-2,cohesion:2}
    ];
  }
  function vwcSameCountryClubmates(){
    const code=state.playerCountry||'cn',rows=[...(careerState.starters||[]),...(careerState.bench||[])];
    const live=rows.filter(p=>!p?.isUser&&p?.country===code);
    if(live.length)return live;
    try{
      return (v50RosterEntriesFor(careerState.team,vwcYear())||[]).filter(e=>e?.[3]===code&&e?.[0]!==getPlayerName()).map(e=>({name:e[0],country:e[3]}));
    }catch(_){return[];}
  }
  function vwcApplyWithdrawalPenalty(rec){
    const streak=Number(careerState.worldCupDeclineStreak||0)+1;careerState.worldCupDeclineStreak=streak;
    const popLoss=Math.min(25,10+(streak-1)*5),sameCountry=vwcSameCountryClubmates(),bondLoss=sameCountry.length?Math.min(15,5+(streak-1)*5):0;
    careerState.popularity=vwcClamp(Number(careerState.popularity||0)-popLoss,0,100);
    if(bondLoss)careerState.teammateBond=vwcClamp(Number(careerState.teammateBond||50)-bondLoss,0,100);
    careerState.condition=vwcClamp(Number(careerState.condition||70)+8,0,100);
    rec.declinePenalty={streak,popLoss,bondLoss,sameCountry:sameCountry.map(x=>x.name).slice(0,4),conditionGain:8};
    return rec.declinePenalty;
  }
  function vwcBuildAiRoster(rec){
    const groups={tank:[],damage:[],support:[]};
    vwcWorldPlayers(rec.year,rec.representingCountry).forEach(p=>groups[vwcRoleGroup(p.role)].push({...p,selectionScore:Number(p.ovr||78)+vwcSigned(`${rec.year}|${rec.representingCountry}|reserve|${p.name}`,2)}));
    const quota={tank:2,damage:3,support:2},out=[];Object.entries(groups).forEach(([g,list])=>{list.sort((a,b)=>b.selectionScore-a.selectionScore);out.push(...list.slice(0,quota[g]));});
    return out.map(p=>({name:p.name,role:p.role,ovr:Math.round(p.ovr),club:p.club,isUser:false,country:p.country}));
  }
  function vwcMaybePrepareStandby(rec){
    if(!rec?.completed||!rec.standbyEligible||rec.standbyChecked||rec.standbyPending)return false;
    const total=Math.max(1,Number(seasonState.total||28)),gate=Math.max(1,Math.floor(total*.58));if(Number(seasonState.played||0)<gate)return false;
    rec.standbyChecked=true;
    if(Number(rec.eventCount||0)>=3)return false;
    const hit=vwcHash01(`${rec.year}|${rec.homeCountry}|standby-visa`)<.34;if(!hit)return false;
    rec.standbyPending=true;rec.eventCount=Number(rec.eventCount||0)+1;return true;
  }
  function vwcResolveStandby(choice='accept'){
    const rec=vwcEnsureRecord();if(!rec?.standbyPending)return rec;rec.standbyPending=false;
    if(choice!=='accept'){
      rec.events.push({kind:'standby',phase:'standby',title:'签证突发 · 国家队递补',choice:'婉拒递补',summary:'首发选手签证未能及时获批，国家队询问你是否紧急递补；你选择不改变原计划。'});vwcRenderSeasonLayer();vwcOpen();return rec;
    }
    let roster=(rec.roster||[]).filter(p=>!p.isUser);if(roster.length<6)roster=vwcBuildAiRoster(rec);
    const g=vwcRoleGroup(state.role),same=roster.filter(p=>vwcRoleGroup(p.role)===g).sort((a,b)=>Number(a.ovr||0)-Number(b.ovr||0));
    const remove=same[0];if(remove)roster=roster.filter(p=>p.name!==remove.name);
    roster.push({name:getPlayerName(),role:state.role,ovr:vwcOvr(),club:careerState.team?.name||'职业队',isUser:true,country:rec.homeCountry});
    rec.roster=roster;rec.selected=true;rec.starter=false;rec.completed=false;rec.result=null;rec.note='签证突发后紧急递补进入国家队7人名单';rec.phase='ready';rec.pendingStage=null;rec.nextStage=vwcFirstStage(rec);rec.nationalCohesion=vwcClamp(Math.max(42,Number(rec.nationalCohesion||50)-5),0,100);careerState.worldCupDeclineStreak=0;
    rec.events.push({kind:'standby',phase:'standby',title:'签证突发 · 国家队递补',choice:'接受紧急征召',summary:`一名${remove?.role||'首发'}选手签证未能及时获批，你作为递补进入7人名单。临时入队让磨合略有下降。`});vwcMaybeMarkDue();vwcRenderSeasonLayer();vwcOpen();return rec;
  }
  function vwcBeginDeclineSelection(){
    const rec=vwcEnsureRecord();if(!rec||rec.completed||rec.phase!=='selection')return rec;
    const commit=()=>{const penalty=vwcApplyWithdrawalPenalty(rec);rec.selectionChoice='decline';rec.phase='decline-interview';rec.pendingStage='selection';rec.declineMedia={pending:true};rec.events.push({phase:'selection',title:'主动放弃国家队选拔',choice:'不参加选拔',summary:`你决定不参加 ${rec.year} Overwatch World Cup 国家队选拔。公众关注 -${penalty.popLoss}${penalty.bondLoss?` · 同国俱乐部队友信任 -${penalty.bondLoss}`:''} · 本赛季状态 +${penalty.conditionGain}。`});vwcOpen();};
    if(window.__OWL_V16_MODAL?.confirm){window.__OWL_V16_MODAL.confirm({icon:'🌍',kicker:'WORLD CUP · 国家队决定',title:'确定不参加本届国家队选拔？',body:'<p>你将主动放弃本届世界杯出场机会。</p><p><strong>退出后触发采访与舆情。</strong></p>',confirmText:'确认退出选拔',cancelText:'继续参加',tone:'warning',onConfirm:commit});return rec;}
    return rec;
  }
  function vwcResolveDeclineInterview(choiceId){
    const rec=vwcEnsureRecord();if(!rec||rec.phase!=='decline-interview')return rec;
    const choices={
      club:{label:'专注俱乐部赛季',summary:'你表示希望把全部精力留给俱乐部目标。',popularity:0,coachTrust:3},
      body:{label:'身体与赛程负荷优先',summary:'你强调长期健康和密集赛程风险，舆论整体表示理解。',popularity:0,coachTrust:1,condition:3},
      protest:{label:'公开质疑本届选拔安排',summary:'你直言不认同本届国家队选拔方式。支持者叫好，争议也随之放大。',popularity:7,coachTrust:-5}
    };
    const c=choices[choiceId]||choices.club;careerState.popularity=vwcClamp(Number(careerState.popularity||0)+c.popularity,0,100);careerState.coachTrust=vwcClamp(Number(careerState.coachTrust||0)+c.coachTrust,0,100);if(c.condition)careerState.condition=vwcClamp(Number(careerState.condition||0)+c.condition,0,100);
    rec.declineMedia={pending:false,choice:choiceId,label:c.label,summary:c.summary};rec.events.push({kind:'media',phase:'selection',title:'退出选拔后的采访',choice:c.label,summary:c.summary});
    rec.phase='declined';rec.completed=true;rec.result='主动放弃国家队选拔';rec.note=c.summary;rec.pendingStage=null;rec.nextStage=null;rec.standbyEligible=true;rec.standbyChecked=false;vwcFinalize(rec);vwcRenderSeasonLayer();vwcOpen();return rec;
  }
  function vwcResolveSelection(choiceId){
    const rec=vwcEnsureRecord();if(!rec||rec.completed||rec.phase!=='selection')return rec;const choice=vwcChoiceData(rec.year).find(x=>x.id===choiceId)||vwcChoiceData(rec.year)[0];
    rec.selectionChoice=choice.id;careerState.worldCupDeclineStreak=0;careerState.condition=vwcClamp(careerState.condition+choice.condition,0,100);rec.nationalCohesion=vwcClamp(rec.nationalCohesion+choice.cohesion,0,100);
    const pool=vwcSelectionPool(rec),groups={tank:[],damage:[],support:[]};
    pool.forEach(p=>{const g=vwcRoleGroup(p.role),heroPool=Number(state.locked?.pool?.value||75),userExtra=p.isUser?(3.2+choice.bonus+Math.max(0,(Number(careerState.popularity||18)-20)*.035)+(choice.id==='pool'?Math.max(0,heroPool-80)*.08:0)+(Number(careerState.coachTrust||60)-50)*.018):0;const score=Number(p.ovr||78)+userExtra+vwcSigned(`${rec.year}|${rec.representingCountry}|select|${p.name}`,2.6);groups[g].push({...p,selectionScore:score});});
    const quota={tank:2,damage:3,support:2},roster=[];Object.entries(groups).forEach(([g,list])=>{list.sort((a,b)=>b.selectionScore-a.selectionScore);roster.push(...list.slice(0,quota[g]));});roster.sort((a,b)=>b.selectionScore-a.selectionScore);
    const user=roster.find(p=>p.isUser),roleRank=[...groups[vwcRoleGroup(state.role)]].sort((a,b)=>b.selectionScore-a.selectionScore).findIndex(p=>p.isUser)+1;
    rec.selectionRank=roleRank||null;rec.roster=roster.map(p=>({name:p.name,role:p.role,ovr:Math.round(p.ovr),club:p.club,isUser:!!p.isUser,country:p.country}));
    rec.events.push({phase:'selection',title:'国家队选拔',choice:choice.title,summary:user?`成功进入 ${vwcCountryName(rec.representingCountry)} 7人名单`:`同职责排名第${roleRank||'—'}，未进入最终7人名单`});
    if(!user){rec.phase='not-selected';rec.pendingStage=null;rec.completed=true;rec.result='国家队落选';rec.standbyEligible=true;rec.standbyChecked=false;vwcFinalize(rec);vwcRenderSeasonLayer();vwcOpen();return rec;}
    rec.selected=true;const roleMates=roster.filter(p=>vwcRoleGroup(p.role)===vwcRoleGroup(state.role)).sort((a,b)=>b.selectionScore-a.selectionScore);rec.starter=roleMates[0]?.isUser===true;rec.phase='ready';rec.pendingStage=null;rec.nextStage=vwcFirstStage(rec);vwcMaybeMarkDue();
    careerState.popularity=vwcClamp(careerState.popularity+2,0,100);vwcRenderSeasonLayer();vwcOpen();return rec;
  }

  const VWC_EVENTS=[
    {id:'club-country',title:'俱乐部与国家队抢训练时间',stages:['conference','qualifier'],body:'俱乐部教练希望你控制额外训练量，国家队却要临时加一轮集训。两个教练都觉得自己最重要，经典。',choices:[
      {id:'country',label:'国家队优先',desc:'提高国家队磨合，但牺牲俱乐部状态。',effects:{cohesion:5,condition:-4,coachTrust:-2,power:1}},
      {id:'balance',label:'严格控制训练量',desc:'保住身体状态，磨合慢一点。',effects:{cohesion:1,condition:3,power:0}},
      {id:'share',label:'共享俱乐部战术笔记',desc:'把熟悉的体系带进国家队。',effects:{cohesion:3,condition:-1,power:1,coachTrust:1}}
    ]},
    {id:'jetlag',title:'跨时区集训',stages:['group'],body:'落地后的第一轮训练，身体告诉你现在应该睡觉，赛程告诉你少废话。',choices:[
      {id:'hard',label:'强行倒时差',desc:'磨合更快，身体更累。',effects:{cohesion:4,condition:-4,power:1}},
      {id:'rest',label:'先恢复睡眠',desc:'状态回升，但少一轮合练。',effects:{cohesion:-1,condition:5,power:0}},
      {id:'light',label:'轻量训练 + 录像复盘',desc:'两边都不极端。',effects:{cohesion:2,condition:1,rating:1}}
    ]},
    {id:'shotcall',title:'关键局由谁指挥？',stages:['qualifier','group','knockout'],body:'训练赛连续打到决胜图，教练问你愿不愿意承担更多临场指挥。嘴一张很容易，背锅也会跟着来。',choices:[
      {id:'lead',label:'主动接过指挥',desc:'团队上限提高，你的个人评分波动也更大。',effects:{cohesion:4,power:2,rating:0}},
      {id:'role',label:'只专注自己的职责',desc:'个人发挥更稳。',effects:{rating:2,cohesion:0}},
      {id:'assist',label:'做副指挥补信息',desc:'稳妥的团队方案。',effects:{cohesion:2,power:1,rating:1}}
    ]},
    {id:'role-rival',title:'国家队内部位置竞争',stages:['qualifier','group'],body:'同职责队友训练赛状态爆炸。7人名单不是“入选即首发”的慈善项目。',choices:[
      {id:'duel',label:'主动要求轮换对抗',desc:'赢了能抢首发权，训练消耗更高。',effects:{condition:-3,rating:2,power:1}},
      {id:'team',label:'接受轮换安排',desc:'磨合提升，个人存在感略低。',effects:{cohesion:4,rating:-1}},
      {id:'specialist',label:'强化招牌图专精',desc:'关键地图获得额外价值。',effects:{power:1,rating:1}}
    ]},
    {id:'media',title:'国家队媒体日',stages:['group','knockout'],body:'记者把话筒怼到脸上：你们是不是本届黑马？这问题最大的作用通常是制造明天的标题。',choices:[
      {id:'bold',label:'“目标只有冠军”',desc:'关注度大涨，压力也上来。',effects:{popularity:5,condition:-1,power:1}},
      {id:'calm',label:'“一场一场打”',desc:'不会上热搜，但也不容易变素材。',effects:{cohesion:2,popularity:1}},
      {id:'praise',label:'把镜头推给队友',desc:'更衣室关系明显变好。',effects:{cohesion:4,popularity:2}}
    ]},
    {id:'meta',title:'版本风向突然变化',stages:['qualifier','group'],body:'刚练熟的体系被版本拧了一把。国家队训练时间有限，现在没有谁想听“我以前很会”。',choices:[
      {id:'adapt',label:'主动扩英雄池',desc:'短期消耗状态，后续系列赛更稳。',effects:{condition:-3,power:2}},
      {id:'comfort',label:'坚持成熟阵容',desc:'首场更强，但没有额外上限。',effects:{power:1}},
      {id:'study',label:'承担版本研究',desc:'提高磨合与个人评价。',effects:{cohesion:3,rating:1}}
    ]},
    {id:'scrim',title:'训练赛内容被泄露',stages:['group','knockout'],body:'社媒突然出现你们的训练赛阵容截图。国家队群里安静了十秒，然后所有人开始怀疑所有人。',choices:[
      {id:'change',label:'立即换战术',desc:'降低被针对风险，但磨合受损。',effects:{cohesion:-2,power:1}},
      {id:'fake',label:'顺势放烟雾弹',desc:'博弈成功会赚到一点赛前优势。',effects:{power:2,condition:-1}},
      {id:'ignore',label:'不跟网络打比赛',desc:'保持训练计划。',effects:{cohesion:1,rating:1}}
    ]},
    {id:'wrist',title:'训练量后的手腕不适',stages:['qualifier','group','knockout'],body:'队医说没有结构性伤势，但继续硬顶不是勇敢，是给未来的自己写欠条。',choices:[
      {id:'play',label:'贴肌效继续练',desc:'保持战术磨合，状态下降。',effects:{condition:-6,power:1}},
      {id:'rest',label:'休息一个训练日',desc:'状态恢复，磨合少一点。',effects:{condition:5,cohesion:-2}},
      {id:'limit',label:'限制训练量',desc:'折中处理。',effects:{condition:2,cohesion:1}}
    ]},
    {id:'extra-scrim',title:'要不要加约一场训练赛？',stages:['qualifier','group'],body:'正赛间隔只有一点空档，教练问要不要约一场高强度训练赛。多打一场能更快磨合，也可能把状态打空。',choices:[
      {id:'full',label:'约满一场高强度训练赛',desc:'磨合提升明显，但消耗状态。',effects:{cohesion:5,condition:-4,power:1}},
      {id:'controlled',label:'只打半程 + 录像复盘',desc:'用较小消耗换稳定磨合。',effects:{cohesion:3,condition:-1,rating:1}},
      {id:'skip',label:'取消训练赛，优先恢复',desc:'不额外磨合，保存比赛状态。',effects:{condition:4}}
    ]},
    {id:'food-poison',title:'正赛前食物中毒',stages:['group','knockout'],body:'赛前一天肠胃突然造反。不是伤病，但它显然没有阅读赛事日程。',choices:[
      {id:'play',label:'吃药照常首发',desc:'保持阵容不变，但个人状态明显下降。',effects:{condition:-7,rating:-2,cohesion:1}},
      {id:'bench',label:'先让队友顶一场',desc:'身体恢复更快，临时轮换影响一点磨合。',effects:{condition:5,cohesion:-2}},
      {id:'limited',label:'缩短训练，视情况登场',desc:'折中处理，尽量不把比赛和身体一起赌掉。',effects:{condition:1,rating:-1}}
    ]}
  ];
  function vwcPrepareEvent(rec,stage){
    if(rec.pendingEvent&&rec.pendingEvent.stage===stage)return rec.pendingEvent;
    rec.eventCount=Number(rec.eventCount||rec.events.filter(e=>e?.kind==='random'||e?.kind==='standby').length||0);if(rec.eventCount>=3)return null;
    if(rec.events.some(e=>e.phase===stage&&e.kind==='random'))return null;
    if(vwcHash01(`${rec.year}|${rec.representingCountry}|${stage}|event-roll`)>=.58)return null;
    const used=new Set(rec.events.filter(e=>e?.kind==='random').map(e=>e.eventId));const pool=VWC_EVENTS.filter(e=>e.stages.includes(stage)&&!used.has(e.id));if(!pool.length)return null;const e=pool[Math.floor(vwcHash01(`${rec.year}|${rec.representingCountry}|${stage}|event`)*pool.length)];rec.pendingEvent={stage,id:e.id};return rec.pendingEvent;
  }
  function vwcApplyEffects(rec,effects={}){
    rec.nationalCohesion=vwcClamp(rec.nationalCohesion+Number(effects.cohesion||0),0,100);careerState.condition=vwcClamp(careerState.condition+Number(effects.condition||0),0,100);careerState.popularity=vwcClamp(careerState.popularity+Number(effects.popularity||0),0,100);careerState.coachTrust=vwcClamp(careerState.coachTrust+Number(effects.coachTrust||0),0,100);rec.eventMods.power=Number(rec.eventMods.power||0)+Number(effects.power||0);rec.eventMods.rating=Number(rec.eventMods.rating||0)+Number(effects.rating||0);
  }
  function vwcResolveEvent(choiceId){
    const rec=vwcEnsureRecord();if(!rec?.pendingEvent)return;const stage=rec.pendingEvent.stage,e=VWC_EVENTS.find(x=>x.id===rec.pendingEvent.id),choice=e?.choices.find(x=>x.id===choiceId)||e?.choices[0];if(!e||!choice)return;vwcApplyEffects(rec,choice.effects);rec.events.push({kind:'random',eventId:e.id,phase:stage,title:e.title,choice:choice.label,summary:choice.desc});rec.eventCount=Math.min(3,Number(rec.eventCount||0)+1);rec.pendingEvent=null;vwcBuildStage(rec,stage);vwcOpen();
  }

  function vwcStageOpponents(rec,stage){
    const me=rec.representingCountry,year=rec.year;let pool=[];
    if(year===2026&&stage==='qualifier'){const g=VWC_2026_QUAL_GROUPS.find(x=>x.includes(me));if(g)return g.filter(x=>x!==me);}
    if(year===2026&&stage==='group'){const g=VWC_2026_GROUPS.find(x=>x.includes(me));if(g)return g.filter(x=>x!==me);pool=[...VWC_2026_FINAL16];}
    else if(year===2026&&stage==='conference')pool=[...VWC_2026_CONFERENCE].filter(c=>vwcRegion(c)===vwcRegion(me));
    else if(year===2023&&stage==='group'){const g=VWC_2023_GROUPS.find(x=>x.includes(me));if(g)return g.filter(x=>x!==me);pool=VWC_2023_FINAL_FIELD;}
    else if(year===2023&&stage==='qualifier')pool=[...VWC_2023_QUALIFIER].filter(c=>vwcRegion(c)===vwcRegion(me));
    else if(year===2023&&stage==='wildcard')pool=[...VWC_2023_WILDCARD];
    else if(year===2023)pool=VWC_2023_FINAL_FIELD;
    else if(year===2019)pool=VWC_2019_FIELD;
    else if(stage==='conference')pool=Object.keys(VWC_COUNTRIES).filter(c=>vwcRegion(c)===vwcRegion(me));
    else pool=Object.keys(VWC_COUNTRIES).filter(c=>vwcPower(c)>=79);
    pool=[...new Set(pool.filter(c=>c!==me))].sort((a,b)=>vwcHash01(`${year}|${stage}|${me}|${a}`)-vwcHash01(`${year}|${stage}|${me}|${b}`));
    const count=stage==='qualifier'&&year===2023?5:stage==='group'&&year===2019?4:3;return pool.slice(0,count);
  }
  function vwcBuildStage(rec,stage){
    if(rec.stageState?.stage===stage&&!rec.stageState.done)return rec.stageState;let opponents=vwcStageOpponents(rec,stage),elim=stage==='preliminary'||stage==='knockout';
    if(stage==='wildcard'||stage==='conference')elim=false;
    if(stage==='knockout'){
      const count=(rec.year===2019&&Number(rec.groupWins||0)>=3)?2:3;const strong=(rec.year===2026?[...VWC_2026_FINAL16]:rec.year===2023?VWC_2023_FINAL_FIELD:VWC_2019_FIELD).filter(c=>c!==rec.representingCountry).sort((a,b)=>vwcPower(b)-vwcPower(a)+vwcSigned(`${rec.year}|ko|${a}`,2)-vwcSigned(`${rec.year}|ko|${b}`,2));opponents=strong.slice(0,count);
    }
    rec.stageState={stage,opponents,matches:[],index:0,elim,done:false,wins:0,losses:0};rec.phase=stage;rec.pendingStage=null;return rec.stageState;
  }
  function vwcTeamPower(rec){
    const roster=rec.roster||[],avg=roster.length?roster.reduce((a,p)=>a+Number(p.ovr||78),0)/roster.length:vwcPower(rec.representingCountry);const userImpact=rec.selected?(vwcOvr()-80)*.12:0;return avg*.58+vwcPower(rec.representingCountry)*.42+userImpact+(rec.nationalCohesion-50)*.035+Number(rec.eventMods.power||0);
  }
  function vwcKnockoutRoundLabel(st){
    if(!st||st.stage!=='knockout')return null;
    const n=Number(st.opponents?.length||0),i=Number(st.index||0);
    if(n>=3)return ['世界杯1/4决赛','世界杯半决赛','世界杯决赛'][Math.min(i,2)];
    if(n===2)return ['世界杯半决赛','世界杯决赛'][Math.min(i,1)];
    return '世界杯决赛';
  }
  function vwcCommitMatch(rec,st,opp,won,score,rating,extra={}){
    if(!rec||!st||st.done)return null;
    const row={stage:st.stage,roundLabel:vwcKnockoutRoundLabel(st),opponent:opp,won:!!won,score:String(score||'0:0'),rating:Number(Number(rating||6.5).toFixed(1)),playedAt:seasonState.played,...extra};
    st.matches.push(row);rec.matches.push(row);st.index++;if(won)st.wins++;else st.losses++;
    careerState.condition=vwcClamp(careerState.condition-(st.stage==='knockout'?2:1),0,100);
    // 一支国家队真正的磨合应该来自一起打比赛，而不是选拔结束后冻结成常量。
    rec.nationalCohesion=vwcClamp(Number(rec.nationalCohesion||50)+(won?3:2),0,100);
    if(row.rating>=8)careerState.popularity=vwcClamp(careerState.popularity+1,0,100);
    if(st.elim&&!won){st.done=true;vwcResolveStage(rec,st);}
    else if(st.index>=st.opponents.length){st.done=true;vwcResolveStage(rec,st);}
    return row;
  }
  function vwcPlayNext(){
    const rec=vwcEnsureRecord();if(!rec||rec.completed)return rec;const st=rec.stageState;if(!st||st.done||st.index>=st.opponents.length)return rec;
    const opp=st.opponents[st.index],our=vwcTeamPower(rec),their=vwcPower(opp)+vwcSigned(`${rec.year}|${st.stage}|opp|${opp}`,2.4),chance=vwcClamp(.5+(our-their)*.034+(rec.starter?.012:-.005),.12,.88),won=vwcHash01(`${rec.year}|${rec.representingCountry}|${st.stage}|${st.index}|match`)<chance;
    const loserMaps=Math.floor(vwcHash01(`${rec.year}|${st.stage}|${opp}|score`)*3),score=won?`3:${loserMaps}`:`${loserMaps}:3`,rating=vwcClamp(6.35+(vwcOvr()-80)*.055+(won?.55:-.25)+(rec.starter?.12:-.05)+Number(rec.eventMods.rating||0)*.08+vwcSigned(`${rec.year}|${st.stage}|${st.index}|rating`,.48),5.2,9.7);
    const row=vwcCommitMatch(rec,st,opp,won,score,rating,{mode:'quick'});
    vwcOpen();return row;
  }
  function vwcNationalTeam(code,rec,home=false){
    const strength=home?vwcTeamPower(rec):vwcPower(code);
    return{name:`${vwcCountryName(code)}国家队`,short:VWC_ISO[code]||String(code).toUpperCase(),city:vwcCountryName(code),division:'World Cup',conference:'World Cup',strength:Math.round(strength),color:home?'linear-gradient(135deg,#e6452f,#f5c447)':'linear-gradient(135deg,#315c8f,#53a7c2)',logo:''};
  }
  function vwcPlayerAttrs(role,ovr,isUser=false){
    if(isUser){const attrs={};ATTRS.forEach(a=>attrs[a.key]=Number(state.locked?.[a.key]?.value??ovr));return attrs;}
    return generateMatchAttributes(role,Math.round(ovr));
  }
  function vwcDetailedRoster(rec,code,home=false){
    const source=home?(rec.roster||[]):vwcWorldPlayers(rec.year,code);
    const used=new Set(),out=[];
    ROLES.forEach((r,idx)=>{
      let pickp=home&&r.name===state.role?source.find(p=>p.isUser):null;
      if(!pickp)pickp=[...source].filter(p=>!used.has(p.name)&&p.role===r.name).sort((a,b)=>Number(b.ovr||0)-Number(a.ovr||0))[0];
      if(!pickp)pickp=[...source].filter(p=>!used.has(p.name)&&vwcRoleGroup(p.role)===vwcRoleGroup(r.name)).sort((a,b)=>Number(b.ovr||0)-Number(a.ovr||0))[0];
      if(!pickp)pickp={name:`${VWC_ISO[code]||code.toUpperCase()}-${idx+1}`,role:r.name,ovr:Math.round(vwcPower(code)-5+idx),club:'国家队'};
      used.add(pickp.name);const isUser=!!pickp.isUser;
      const attrs=vwcPlayerAttrs(r.name,Number(pickp.ovr||78),isUser);
      out.push({id:isUser?'career-player':`vwc-${code}-${rec.year}-${idx}-${String(pickp.name).replace(/\W/g,'')}`,name:isUser?getPlayerName():pickp.name,role:r.name,attrs,overall:Math.round(Object.values(attrs).reduce((a,b)=>a+Number(b||0),0)/ATTRS.length),color:home?'#e96a44':'#4e86b3',isUser,club:pickp.club||'国家队'});
    });
    return out;
  }
  function vwcPlayDetailed(){
    const rec=vwcEnsureRecord();if(!rec||rec.completed)return rec;const st=rec.stageState;if(!st||st.done||st.index>=st.opponents.length)return rec;
    const opp=st.opponents[st.index],meta={year:rec.year,stage:st.stage,index:st.index,opponent:opp,country:rec.representingCountry,roundLabel:vwcKnockoutRoundLabel(st)||VWC_STAGE_LABEL[st.stage]||st.stage};
    document.getElementById('vwcOverlay')?.classList.add('ui-hidden');
    setupMatch(false,3,{playerVenue:'neutral',mapSelectionEnabled:typeof v71StrategicEra==='function'?v71StrategicEra():rec.year===2025,firstMapPicker:'home'});
    matchState.context='worldcup';matchState.worldCupMeta=meta;
    matchState.homeTeam=vwcNationalTeam(rec.representingCountry,rec,true);matchState.awayTeam=vwcNationalTeam(opp,rec,false);
    matchState.homeRoster=vwcDetailedRoster(rec,rec.representingCountry,true);matchState.awayRoster=vwcDetailedRoster(rec,opp,false);
    matchState.logs=[{map:'赛前',side:'event',text:`${matchState.homeTeam.name} 对阵 ${matchState.awayTeam.name}。${meta.roundLabel}，双方提交首发5人。`}];
    document.getElementById('matchKicker').textContent=`Overwatch World Cup · ${meta.roundLabel}`;
    document.getElementById('matchTitle').textContent=`${vwcCountryName(rec.representingCountry)} vs ${vwcCountryName(opp)}`;
    document.getElementById('matchDesc').textContent='世界杯详细比赛：按地图推进、处理关键团战；竞技时代沿用选图 / 阵容 / Ban / Plan 竞技层。默认入口仍为快速模拟。';
    document.getElementById('matchWeekText').textContent=`${rec.year} · 国家队`;
    renderMatch();showScreen('match');window.scrollTo({top:0,behavior:'auto'});return meta;
  }
  function vwcFinishDetailedMatch(){
    const meta=matchState.worldCupMeta,rec=vwcEnsureRecord();if(!meta||!rec||rec.completed)return null;
    const st=rec.stageState;if(!st||Number(st.index)!==Number(meta.index)||st.stage!==meta.stage)return null;
    const won=Number(matchState.homeScore)>Number(matchState.awayScore),score=`${matchState.homeScore}:${matchState.awayScore}`;
    const user=matchState.homeRoster?.find(p=>p.isUser),vals=user?(matchState.ratings?.home?.[user.id]||[]):[];
    const rating=vals.length?vals.reduce((a,b)=>a+Number(b||0),0)/vals.length:vwcClamp(6.4+(vwcOvr()-80)*.05+(won?.45:-.2),5.2,9.6);
    const row=vwcCommitMatch(rec,st,meta.opponent,won,score,rating,{mode:'detail',mapsPlayed:(matchState.results||[]).length});
    matchState.worldCupMeta=null;showScreen('season');vwcOpen();return row;
  }
  function vwcResolveStage(rec,st){
    const stage=st.stage,w=st.wins,n=st.opponents.length;rec.events.push({phase:stage,title:VWC_STAGE_LABEL[stage]||stage,choice:`${w}-${st.losses}`,summary:`${n}场 · ${w}胜${st.losses}负`});
    let advance=false,next=null;
    if(stage==='preliminary'){advance=st.losses===0;next='group';}
    else if(stage==='wildcard'){advance=w>=2;next='qualifier';}
    else if(stage==='conference'){advance=w>=2;next='qualifier';}
    else if(stage==='qualifier'){advance=w>=Math.ceil(n*.55);next='group';}
    else if(stage==='group'){advance=w>=Math.ceil(n*.5);rec.groupWins=w;next='knockout';}
    else if(stage==='knockout'){
      if(st.losses>0){const lossAt=st.matches.findIndex(x=>!x.won),rounds=n;const result=lossAt===rounds-1?'世界杯亚军':lossAt===rounds-2?'世界杯四强':'世界杯八强';vwcComplete(rec,result,st.matches.find(x=>!x.won)?.opponent);return;}
      if(w===n){vwcComplete(rec,'世界杯冠军',rec.representingCountry);return;}
    }
    if(!advance){
      if(rec.year===2026&&stage==='conference'&&!VWC_2026_MAIN.has(rec.homeCountry)){
        const host=vwcBreakthroughHost(rec.homeCountry,rec.year);
        if(host&&host!==rec.homeCountry){
          rec.events.push({phase:'breakthrough',title:'Breakthrough Player 二次征召',choice:vwcCountryName(host),summary:`${vwcCountryName(rec.homeCountry)} 未从 Conference Cup 晋级；你获得同赛区 ${vwcCountryName(host)} 的突破选手试训机会。`});
          rec.conferenceAttempted=true;rec.breakthrough=true;rec.representingCountry=host;rec.route='breakthrough';rec.note=`Conference Cup 出局后获得二次机会：以 ${vwcCountryName(rec.homeCountry)} 突破选手身份竞争 ${vwcCountryName(host)} 的7人名单`;
          rec.phase='selection';rec.pendingStage='selection';rec.nextStage=null;rec.selected=false;rec.starter=false;rec.roster=[];rec.selectionChoice=null;rec.selectionRank=null;rec.stageState=null;rec.eventMods={power:0,rating:0};
          vwcRenderSeasonLayer();return;
        }
      }
      const result=stage==='group'?'世界杯小组赛出局':stage==='qualifier'?'世界杯资格赛出局':stage==='conference'?'Conference Cup出局':stage==='wildcard'?'Wild Card Challenge出局':'世界杯预选赛出局';vwcComplete(rec,result);return;
    }
    rec.stageState=null;rec.phase='ready';rec.nextStage=next;rec.pendingStage=null;rec.eventMods={power:0,rating:0};vwcMaybeMarkDue();
  }
  function vwcChampionPool(rec){if(rec.year===2026)return[...VWC_2026_FINAL16];if(rec.year===2023)return VWC_2023_FINAL_FIELD;if(rec.year===2019)return VWC_2019_FIELD;return Object.keys(VWC_COUNTRIES).filter(c=>vwcPower(c)>=83);}
  function vwcSimChampion(rec,exclude=null){
    const blocked=exclude instanceof Set?exclude:new Set(Array.isArray(exclude)?exclude:(exclude?[exclude]:[]));
    return vwcChampionPool(rec).filter(c=>!blocked.has(c)).sort((a,b)=>(vwcPower(b)+vwcSigned(`${rec.year}|champ|${b}`,4))-(vwcPower(a)+vwcSigned(`${rec.year}|champ|${a}`,4)))[0]||'kr';
  }
  function vwcNeutralSeries(rec,a,b,round,index){
    const pa=vwcPower(a)+vwcSigned(`${rec.year}|observer|${round}|${index}|${a}`,2.8),pb=vwcPower(b)+vwcSigned(`${rec.year}|observer|${round}|${index}|${b}`,2.8);
    const chance=vwcClamp(.5+(pa-pb)*.035,.16,.84),aWins=vwcHash01(`${rec.year}|observer|${round}|${index}|${a}|${b}`)<chance,winner=aWins?a:b,loser=aWins?b:a;
    const loserMaps=Math.floor(vwcHash01(`${rec.year}|observer-score|${round}|${index}|${a}|${b}`)*3);return{round,a,b,winner,loser,score:aWins?`3:${loserMaps}`:`${loserMaps}:3`};
  }
  function vwcBuildObserverReport(rec){
    if(Array.isArray(rec.observerReport)&&rec.observerReport.length)return rec.observerReport;
    let eight=[...vwcChampionPool(rec)].sort((a,b)=>(vwcPower(b)+vwcSigned(`${rec.year}|observer-seed|${b}`,3))-(vwcPower(a)+vwcSigned(`${rec.year}|observer-seed|${a}`,3))).slice(0,8);
    while(eight.length<8){const c=Object.keys(VWC_COUNTRIES).filter(x=>!eight.includes(x)).sort((a,b)=>vwcPower(b)-vwcPower(a))[0];if(!c)break;eight.push(c)}
    const qPairs=[[0,7],[3,4],[1,6],[2,5]],rows=[],q=[];qPairs.forEach((pair,i)=>{const r=vwcNeutralSeries(rec,eight[pair[0]],eight[pair[1]],'八强',i);rows.push(r);q.push(r.winner)});
    const s1=vwcNeutralSeries(rec,q[0],q[1],'半决赛',0),s2=vwcNeutralSeries(rec,q[2],q[3],'半决赛',1);rows.push(s1,s2);const f=vwcNeutralSeries(rec,s1.winner,s2.winner,'总决赛',0);rows.push(f);rec.observerReport=rows;rec.worldChampion=f.winner;rec.worldRunnerUp=f.loser;return rows;
  }
  function vwcComplete(rec,result,finalOpp=null){
    rec.completed=true;rec.phase='complete';rec.pendingStage=null;rec.nextStage=null;rec.stageState=null;rec.result=result;rec.finishedAtGames=seasonState.played;
    if(result==='世界杯冠军'){rec.worldChampion=rec.representingCountry;rec.worldRunnerUp=finalOpp&&finalOpp!==rec.representingCountry?finalOpp:vwcSimChampion(rec,new Set([rec.worldChampion]));careerState.popularity=vwcClamp(careerState.popularity+12,0,100);careerState.coachTrust=vwcClamp(careerState.coachTrust+4,0,100);}
    else{
      const eliminated=new Set([rec.representingCountry]);
      (rec.matches||[]).filter(m=>m.stage==='knockout'&&m.won).forEach(m=>eliminated.add(m.opponent));
      rec.worldChampion=result==='世界杯亚军'&&finalOpp?finalOpp:vwcSimChampion(rec,eliminated);
      rec.worldRunnerUp=result==='世界杯亚军'?rec.representingCountry:vwcSimChampion(rec,new Set([rec.worldChampion]));
      careerState.popularity=vwcClamp(careerState.popularity+(result.includes('亚军')?8:result.includes('四强')?5:result.includes('八强')?3:1),0,100);
    }
    vwcFinalize(rec);vwcSyncArchive(rec.year);vwcRenderSeasonLayer();
  }
  function vwcFinalize(rec){
    const root=vwcRoot(),records=Object.values(root.seasons);root.appearances=records.filter(r=>r.selected).length;root.titles=records.filter(r=>r.result==='世界杯冠军').length;root.medals=records.filter(r=>/冠军|亚军|四强/.test(r.result||'')).length;root.lastYear=rec.year;
  }
  function vwcMaybeResolveObserverChampion(rec){
    if(!rec?.completed||rec.worldChampion||rec.result==='世界杯冠军')return rec;
    // 玩家落选/拒绝/年龄不符后，世界赛仍会继续。到现实总决赛时间点后补完AI冠军，避免履历永远显示“待定”。
    const reached=vwcClubPostseasonResolved(rec);
    if(!reached)return rec;
    vwcBuildObserverReport(rec);
    if(!(rec.events||[]).some(e=>e.kind==='observer-final'))rec.events.push({kind:'observer-final',phase:'knockout',title:'世界杯落幕',choice:vwcCountryName(rec.worldChampion),summary:`${vwcCountryName(rec.worldChampion)} 赢得 ${rec.year} Overwatch World Cup。你虽然没有出场，仍可查看完整八强战报。`});
    vwcFinalize(rec);vwcSyncArchive(rec.year);return rec;
  }
  function vwcMaybeMarkDue(){const rec=vwcEnsureRecord();if(!rec)return rec;if(rec.completed){vwcMaybePrepareStandby(rec);if(!rec.standbyPending)vwcMaybeResolveObserverChampion(rec);return rec;}if(rec.phase==='selection'){rec.pendingStage='selection';return rec;}if(rec.nextStage&&vwcDue(rec)){rec.pendingStage=rec.nextStage;if(seasonState.simulating){seasonState.simulating=false;if(seasonState.timer){clearTimeout(seasonState.timer);seasonState.timer=null;}}}return rec;}

  function vwcTimeline(rec){
    let phases=['selection'];if(rec.route==='preliminary')phases.push('preliminary');if(rec.route==='wildcard')phases.push('wildcard');if(rec.route==='conference'||rec.conferenceAttempted)phases.push('conference');if(!['direct-group','preliminary'].includes(rec.route)||rec.year===2023&&rec.route==='wildcard'||rec.year===2026&&rec.route==='conference')phases.push('qualifier');phases.push('group','knockout');
    phases=[...new Set(phases)];const done=new Set((rec.events||[]).map(e=>e.phase));if(rec.selected||rec.selectionChoice)done.add('selection');return phases.map(p=>{const current=rec.pendingStage===p||rec.phase===p;return`<span class="vwc-phase ${done.has(p)?'done':current?'current':'locked'}">${vwcEsc(VWC_STAGE_LABEL[p]||p)}</span>`;}).join('');
  }
  function vwcRosterHtml(rec){return(rec.roster||[]).map(p=>`<div class="vwc-player ${p.isUser?'user':''}"><span class="role">${vwcRoleZh(vwcRoleGroup(p.role))}</span><div><strong>${vwcEsc(p.name)}${p.isUser?' · 你':''}</strong><small>${vwcEsc(p.role)} · ${vwcEsc(p.club||'')}</small></div><strong>${p.ovr}</strong></div>`).join('');}
  function vwcDisplayMatchLabel(m,list,index){if(m.roundLabel)return m.roundLabel;if(m.stage!=='knockout')return VWC_STAGE_LABEL[m.stage]||m.stage;const ko=list.filter(x=>x.stage==='knockout'),pos=ko.indexOf(m),n=ko.length;if(n>=3)return ['世界杯1/4决赛','世界杯半决赛','世界杯决赛'][Math.min(pos,2)];if(n===2)return ['世界杯半决赛','世界杯决赛'][Math.min(pos,1)];return '世界杯决赛';}
  function vwcMatchesHtml(rec,filterStage=null){const list=(rec.matches||[]).filter(x=>!filterStage||x.stage===filterStage);return list.length?`<div class="vwc-match-list">${list.map((m,i)=>`<div class="vwc-match ${m.won?'win':'loss'}"><div><strong>${vwcDisplayMatchLabel(m,list,i)}</strong><small style="display:block;color:var(--muted)">vs ${vwcEsc(vwcCountryName(m.opponent))}</small></div><div class="score">${m.score}</div><div class="rating">个人 ${m.rating.toFixed(1)}分</div></div>`).join('')}</div>`:'<div class="vwc-note">暂无比赛记录。</div>';}
  function vwcRenderSelection(rec,cfg){const choices=vwcChoiceData(rec.year);return`<div class="vwc-hero"><section class="vwc-card"><div class="vwc-kicker">NATIONAL TEAM SELECTION</div><div class="vwc-big">竞争 ${vwcCountryName(rec.representingCountry)} 7人名单</div><p>${rec.breakthrough?`你的国家/地区没有进入2026世界杯计划，但你符合“突破选手”路线：以同赛区外援身份竞争 ${vwcCountryName(rec.representingCountry)} 的一个名单位置。`:'先通过国家队选拔，再进入世界杯赛程。'}</p><div class="vwc-note">${cfg.selectionWindow} · 当前 ${careerState.age}岁 · OVR ${vwcOvr()} · 公众关注 ${Math.round(careerState.popularity)}</div></section><section class="vwc-card"><div class="vwc-kicker">ROUTE</div><h3>${rec.route==='direct-group'?'正赛直通国家':rec.route==='conference'?'Conference Cup路线':rec.route==='wildcard'?'Wild Card路线':rec.route==='preliminary'?'2019预选路线':rec.breakthrough?'突破选手路线':'在线资格赛路线'}</h3><p>${rec.note||'先通过国家队选拔，再进入世界杯赛程。'}</p></section></div><section class="vwc-card"><h3>你怎么打这次试训？</h3><div class="vwc-choice-grid">${choices.map(c=>`<button class="vwc-choice" data-vwc-select="${c.id}"><b>${c.title}</b><span>${c.desc}</span><em>${c.effect}</em></button>`).join('')}</div><div class="vwc-decline-row"><button class="secondary-btn vwc-decline-btn" id="vwcDeclineSelection">不参加本届国家队选拔</button><span>需要二次确认；会触发采访与舆情。</span></div></section>`;}
  function vwcRenderDeclineInterview(rec){const p=rec.declinePenalty||{};return`<section class="vwc-card vwc-event"><div class="vwc-kicker">MEDIA · 国家队退出采访</div><h3>你主动退出了本届国家队选拔</h3><p>消息刚公布，采访区已经堵到门口。你可以不打世界杯，但不能指望互联网也跟着休假。</p><div class="vwc-note">退出决定已结算：公众关注 <strong>-${p.popLoss||0}</strong>${p.bondLoss?` · 同国俱乐部队友信任 <strong>-${p.bondLoss}</strong>`:''} · 本赛季状态 <strong>+${p.conditionGain||0}</strong>${p.streak>1?` · 连续第${p.streak}次退出，惩罚递增`:''}</div><div class="vwc-choice-grid"><button class="vwc-choice" data-vwc-decline-media="club"><b>专注俱乐部赛季</b><span>强调职业合同与俱乐部目标。</span><em>俱乐部更容易理解你的选择</em></button><button class="vwc-choice" data-vwc-decline-media="body"><b>身体与赛程负荷优先</b><span>把决定解释为长期健康管理。</span><em>恢复更充分 · 舆情相对温和</em></button><button class="vwc-choice" data-vwc-decline-media="protest"><b>质疑本届选拔安排</b><span>公开表达不满，热度和争议一起上来。</span><em>态度更强硬 · 关注与争议都会上升</em></button></div></section>`;}
  function vwcRenderRandomEvent(rec){const pe=rec.pendingEvent,e=VWC_EVENTS.find(x=>x.id===pe?.id);if(!e)return'';return`<section class="vwc-card vwc-event"><div class="vwc-kicker">NATIONAL TEAM EVENT · ${VWC_STAGE_LABEL[pe.stage]}</div><h3>${e.title}</h3><p>${e.body}</p><div class="vwc-choice-grid">${e.choices.map(c=>`<button class="vwc-choice" data-vwc-event="${c.id}"><b>${c.label}</b><span>${c.desc}</span></button>`).join('')}</div></section>`;}
  function vwcStageWindow(rec,stage,cfg){if(rec.year===2026&&stage==='conference'){const r=vwcRegion(rec.representingCountry);return r==='AMER'?'3月13–15日 · AMER Conference Cup':r==='ASIA'?'3月14–15日 · ASIA Conference Cup':'4月17–19日 · EMEA Conference Cup';}if(rec.year===2026&&stage==='qualifier'){const r=vwcRegion(rec.representingCountry);return r==='ASIA'?'5月29–31日 · ASIA 在线资格赛':'5月30–31日、6月6–7日 · AMER / EMEA 在线资格赛';}return stage==='group'?cfg.groupWindow:stage==='knockout'?cfg.finalWindow:cfg.qualifierWindow||cfg.selectionWindow;}
  function vwcRenderStage(rec,cfg){const st=rec.stageState||vwcBuildStage(rec,rec.pendingStage||rec.nextStage),opp=st.index<st.opponents.length?vwcCountryName(st.opponents[st.index]):'结算';return`<div class="vwc-hero"><section class="vwc-card"><div class="vwc-kicker">${VWC_STAGE_LABEL[st.stage]||st.stage}</div><div class="vwc-big">${vwcCountryName(rec.representingCountry)} · ${st.wins}-${st.losses}</div><p>${vwcStageWindow(rec,st.stage,cfg)}</p><div class="vwc-stat-grid"><div class="vwc-stat"><span>国家队磨合</span><strong>${Math.round(rec.nationalCohesion)}</strong></div><div class="vwc-stat"><span>我的定位</span><strong>${rec.starter?'首发':'轮换'}</strong></div><div class="vwc-stat"><span>当前状态</span><strong>${Math.round(careerState.condition)}</strong></div><div class="vwc-stat"><span>下一场</span><strong>${opp}</strong></div></div></section><section class="vwc-card"><h3>7人国家队名单</h3><div class="vwc-roster">${vwcRosterHtml(rec)}</div></section></div><section class="vwc-card"><h3>赛事进程</h3>${vwcMatchesHtml(rec,st.stage)}<div class="vwc-actions">${!st.done&&st.index<st.opponents.length?`<button class="primary-btn" id="vwcPlayNext">⚡ 快速模拟 · vs ${opp}</button><button class="secondary-btn" id="vwcPlayDetailed">🎮 详细比赛</button>`:''}<button class="secondary-btn" id="vwcCloseInline">返回俱乐部</button></div><p class="vwc-mode-note">详细比赛：地图、阵容与关键团战。</p></section>`;}
  function vwcObserverHtml(rec){const rows=rec.observerReport||[];if(!rows.length)return`<div class="vwc-note">你没有参加本届国家队比赛；世界杯正赛将在俱乐部年终总决赛结束后更新战报与冠军。</div>`;return`<div class="vwc-observer-list">${rows.map(m=>`<div class="vwc-observer-match"><span>${m.round}</span><strong>${vwcCountryName(m.a)} ${m.score} ${vwcCountryName(m.b)}</strong><em>胜者：${vwcCountryName(m.winner)}</em></div>`).join('')}</div>`;}
  function vwcRenderComplete(rec,cfg){const champ=rec.worldChampion?vwcCountryName(rec.worldChampion):'待定';const observer=!rec.selected?`<h3 style="margin-top:18px">世界杯淘汰赛战报</h3>${vwcObserverHtml(rec)}`:'';return`<section class="vwc-result"><div class="vwc-kicker">WORLD CUP · FINAL RECORD</div><h2>${rec.result}</h2><p>${rec.selected?`${vwcCountryName(rec.representingCountry)} 国家队 · ${rec.starter?'主要首发':'轮换成员'} · 共出战 ${rec.matches.length} 场。`:(rec.note||'本届未获得国家队出场，但你仍会收到赛事战报和最终结果。')}</p><div class="vwc-stat-grid"><div class="vwc-stat"><span>世界冠军</span><strong>${champ}</strong></div><div class="vwc-stat"><span>国家队比赛</span><strong>${rec.matches.length}</strong></div><div class="vwc-stat"><span>平均评分</span><strong>${rec.matches.length?(rec.matches.reduce((a,m)=>a+m.rating,0)/rec.matches.length).toFixed(1):'—'}</strong></div><div class="vwc-stat"><span>国家队磨合</span><strong>${Math.round(rec.nationalCohesion||0)}</strong></div></div></section><section class="vwc-card" style="margin-top:14px"><h3>${rec.selected?'国家队比赛记录':'世界杯观赛中心'}</h3>${rec.selected?vwcMatchesHtml(rec):observer}${rec.events?.length?`<h3 style="margin-top:18px">国家队 / 舆情事件</h3><div class="vwc-log">${rec.events.map(e=>`<div class="vwc-log-row"><strong>${vwcEsc(e.title)}</strong> · ${vwcEsc(e.choice||'')}<br><span style="color:var(--muted)">${vwcEsc(e.summary||'')}</span></div>`).join('')}</div>`:''}</section>`;}
  function vwcRenderStandby(rec){
    return `<section class="vwc-result"><div class="vwc-kicker">WORLD CUP · EMERGENCY CALL-UP</div><h2>🛂 首发选手签证未通过 · 国家队询问紧急递补</h2><p>一名同职责选手未能及时完成签证手续。你原本${rec.result==='主动放弃国家队选拔'?'已经退出本届国家队':'没有进入最终7人名单'}，现在教练组给你一个临时回归窗口。</p><div class="vwc-note">接受：作为轮换紧急入队，国家队磨合略降；拒绝：保持当前俱乐部计划。本届世界杯随机事件总量仍不超过3次。</div><div class="vwc-actions"><button class="primary-btn" data-vwc-standby="accept">接受紧急递补 →</button><button class="secondary-btn" data-vwc-standby="decline">婉拒，继续俱乐部赛季</button></div></section>`;
  }
  function vwcRenderOverlay(){
    const rec=vwcEnsureRecord(),body=document.getElementById('vwcBody');if(!body)return;const cfg=vwcConfig(vwcYear());if(!rec||!cfg){body.innerHTML='<div class="vwc-note">当前年份没有世界杯赛事。</div>';return;}
    document.getElementById('vwcTitle').textContent=cfg.display;document.getElementById('vwcSub').textContent=`${cfg.note} · ${cfg.historical?'现实赛历':'架空未来赛历'}`;
    const top=`<div class="vwc-country">${vwcFlag(rec.representingCountry)}<div><strong>${vwcCountryName(rec.representingCountry)}</strong><small style="display:block;color:var(--muted)">${VWC_ISO[rec.representingCountry]||rec.representingCountry.toUpperCase()}${rec.breakthrough?` · 突破选手（原籍 ${vwcCountryName(rec.homeCountry)}）`:''}</small></div></div><div class="vwc-timeline">${vwcTimeline(rec)}</div>`;
    if(rec.standbyPending){body.innerHTML=top+vwcRenderStandby(rec);body.querySelectorAll('[data-vwc-standby]').forEach(b=>b.addEventListener('click',()=>vwcResolveStandby(b.dataset.vwcStandby)));return;}
    if(rec.completed){body.innerHTML=top+vwcRenderComplete(rec,cfg);return;}
    if(rec.phase==='decline-interview'){body.innerHTML=top+vwcRenderDeclineInterview(rec);body.querySelectorAll('[data-vwc-decline-media]').forEach(b=>b.addEventListener('click',()=>vwcResolveDeclineInterview(b.dataset.vwcDeclineMedia)));return;}
    if(rec.phase==='selection'){body.innerHTML=top+vwcRenderSelection(rec,cfg);body.querySelectorAll('[data-vwc-select]').forEach(b=>b.addEventListener('click',()=>vwcResolveSelection(b.dataset.vwcSelect)));document.getElementById('vwcDeclineSelection')?.addEventListener('click',vwcBeginDeclineSelection);return;}
    if(rec.pendingStage&&rec.pendingStage!=='selection'&&!rec.stageState){vwcPrepareEvent(rec,rec.pendingStage);}
    if(rec.pendingEvent){body.innerHTML=top+vwcRenderRandomEvent(rec);body.querySelectorAll('[data-vwc-event]').forEach(b=>b.addEventListener('click',()=>vwcResolveEvent(b.dataset.vwcEvent)));return;}
    if(rec.stageState||rec.pendingStage){body.innerHTML=top+vwcRenderStage(rec,cfg);document.getElementById('vwcPlayNext')?.addEventListener('click',vwcPlayNext);document.getElementById('vwcPlayDetailed')?.addEventListener('click',vwcPlayDetailed);document.getElementById('vwcCloseInline')?.addEventListener('click',vwcClose);return;}
    const trigger=rec.nextStage?vwcTriggerGames(rec,rec.nextStage):null,postClub=vwcPostClubStage(rec,rec.nextStage);body.innerHTML=top+`<div class="vwc-hero"><section class="vwc-card"><div class="vwc-kicker">NATIONAL TEAM CAMP</div><div class="vwc-big">已入选 · 等待 ${VWC_STAGE_LABEL[rec.nextStage]||'下一阶段'}</div><p>${rec.starter?'你目前是同职责首选。':'你进入了7人名单，目前定位为轮换。'}</p><div class="vwc-note">下一节点：${rec.nextStage?VWC_STAGE_LABEL[rec.nextStage]:'待定'} · ${postClub?'俱乐部年终总决赛结束后触发。':`俱乐部赛程约第 ${trigger??'—'} 场触发。`}</div></section><section class="vwc-card"><h3>7人名单</h3><div class="vwc-roster">${vwcRosterHtml(rec)}</div></section></div>`;
  }
  function vwcOpen(){vwcMaybeMarkDue();vwcRenderOverlay();document.getElementById('vwcOverlay')?.classList.remove('ui-hidden');}
  function vwcClose(){
    document.getElementById('vwcOverlay')?.classList.add('ui-hidden');vwcRenderSeasonLayer();
    const rec=vwcEnsureRecord();
    if(seasonState.v13ResumeWholeAfterWorldCup&&(!rec||rec.completed||!rec.pendingStage)){if(window.__OWL_V14?.deferWorldCupResume?.(rec))return;seasonState.v13ResumeWholeAfterWorldCup=false;window.__OWL_RUNTIME?.simulation?.resumeWhole?.(140)}
  }

  function vwcSeasonBannerMarkup(rec,cfg){
    const due=!!rec.standbyPending||(!!rec.pendingStage&&!rec.completed);const status=rec.standbyPending?'紧急递补待决定':rec.completed?rec.result:rec.phase==='selection'?'等待国家队选拔':due?`必须处理：${VWC_STAGE_LABEL[rec.pendingStage]}`:rec.selected?`已入选 · 下一站 ${VWC_STAGE_LABEL[rec.nextStage]}`:'国家队观察中';
    const detail=rec.completed?(rec.worldChampion?`本届冠军：${vwcCountryName(rec.worldChampion)}`:(rec.note||'')):`${cfg.display} · ${cfg.historical?'现实赛历':'架空未来赛历'}${rec.breakthrough?' · 突破选手路线':''}`;
    return`<div class="vwc-season-banner" id="vwcSeasonBanner"><div><strong>🌍 世界杯国家队 · ${status}</strong><span>${detail}</span></div><button class="${due?'primary-btn':'secondary-btn'}" id="vwcSeasonOpen">${due?'处理国家队节点 →':'查看世界杯'}</button></div>`;
  }
  function vwcClubMilestoneLock(){
    if(seasonState.stageBreakPending||seasonState.v769TournamentResultPending)return true;
    // 2019旧Stage结果卡要求玩家先看完上一轮结果；世界杯层不能把它误解锁。
    const unseen=(seasonState.stagePlayoffHistory||[]).some(h=>
      Number(h?.stage)<=3&&Number(seasonState.played)===Number(h?.stage)*7&&
      !(seasonState.stageResultSeen||[]).includes(Number(h?.stage))
    );
    return unseen;
  }
  function vwcRestoreClubSeasonControls(){
    // World Cup节点会临时把俱乐部赛季按钮置灰；节点结束后必须显式恢复。
    // 但“恢复”必须尊重俱乐部自己的里程碑/事件锁，不能为了救世界杯死锁又反向绕过Stage结算。
    const done=Number(seasonState.played||0)>=Number(seasonState.total||0);
    const milestoneLock=vwcClubMilestoneLock();
    const eventLock=!!seasonState.currentEvent||!!seasonState.eventDue;
    const play=document.getElementById('playNextSeasonMatchBtn');
    const fast=document.getElementById('fastSimSeasonBtn');
    const full=document.getElementById('fullSimSeasonBtn');
    if(play)play.disabled=milestoneLock||done||!!seasonState.simulating||eventLock;
    if(fast)fast.disabled=milestoneLock||done||!!seasonState.currentEvent;
    if(full){full.disabled=milestoneLock||done||!!seasonState.simulating;full.title='';}
  }
  function vwcRenderSeasonLayer(){
    const wrap=document.querySelector('#seasonScreen .season-overview');if(!wrap)return;document.getElementById('vwcSeasonBanner')?.remove();const cfg=vwcConfig(vwcYear());if(!cfg)return;const rec=vwcEnsureRecord();vwcMaybeMarkDue();
    // 先恢复俱乐部本身应有的按钮状态，再叠加世界杯锁。这样“落选 / 拒绝 / 世界杯结束”
    // 都不会把 disabled 从上一个国家队节点遗留到常规赛。
    vwcRestoreClubSeasonControls();
    wrap.insertAdjacentHTML('afterbegin',vwcSeasonBannerMarkup(rec,cfg));document.getElementById('vwcSeasonOpen')?.addEventListener('click',vwcOpen);
    const block=!!rec.standbyPending||(!!rec.pendingStage&&!rec.completed);['playNextSeasonMatchBtn','fastSimSeasonBtn'].forEach(id=>{const b=document.getElementById(id);if(block)b.disabled=true;});
    const full=document.getElementById('fullSimSeasonBtn');
    // 1.3起完整赛季模拟会分批执行，并在世界杯节点自动停下，因此不再整年封死按钮。
    if(full&&block){full.disabled=true;full.title='先处理当前国家队节点；处理完后可以继续模拟全部常规赛。';}
    else if(full){full.title='完整赛季模拟会在世界杯 / Major / 关键事件 / 交易节点自动暂停。';}
    if(block&&seasonState.simulating){seasonState.simulating=false;if(seasonState.timer){clearTimeout(seasonState.timer);seasonState.timer=null;}}
  }

  function vwcSyncArchive(year){const rec=vwcRoot().seasons?.[year],arc=careerState.careerArchive?.find(r=>Number(r.year)===Number(year));if(!rec||!arc)return;arc.worldCup={year:rec.year,country:rec.representingCountry,homeCountry:rec.homeCountry,breakthrough:rec.breakthrough,selected:rec.selected,starter:rec.starter,result:rec.result,matches:rec.matches.length,avgRating:rec.matches.length?rec.matches.reduce((a,m)=>a+m.rating,0)/rec.matches.length:0,worldChampion:rec.worldChampion};arc.honors=arc.honors||[];if(rec.result==='世界杯冠军'&&!arc.honors.includes('世界杯冠军'))arc.honors.push('世界杯冠军');if(rec.result==='世界杯亚军'&&!arc.honors.includes('世界杯亚军'))arc.honors.push('世界杯亚军');if(rec.selected&&!arc.honors.includes('国家队成员'))arc.honors.push('国家队成员');}
  function vwcCareerSection(){const rows=Object.values(vwcRoot().seasons||{}).sort((a,b)=>b.year-a.year);if(!rows.length)return'';return`<section class="career-block" id="vwcCareerBlock"><h3>🌍 国家队履历</h3>${rows.map(r=>`<div class="vwc-career-row"><div class="year">${r.year}</div><div><strong>${vwcCountryName(r.representingCountry||r.homeCountry)}</strong><small>${r.breakthrough?`突破选手 · 原籍${vwcCountryName(r.homeCountry)}`:r.selected?(r.starter?'国家队首发/轮换核心':'国家队轮换成员'):'未获得国家队出场'} · ${r.matches?.length||0}场</small></div><div class="result">${vwcEsc(r.result||'进行中')}</div></div>`).join('')}</section>`;}

  // ---- 接入现有生涯流程：最后加载，因此包住的是所有历史赛制/梦幻模式补丁后的最终函数。 ----
  const _vwcSetupSeason=setupSeason;setupSeason=function(...args){const out=_vwcSetupSeason.apply(this,args);vwcEnsureRecord();vwcMaybeMarkDue();vwcRenderSeasonLayer();return out;};
  const _vwcRenderSeason=renderSeason;renderSeason=function(...args){const out=_vwcRenderSeason.apply(this,args);vwcMaybeMarkDue();vwcRenderSeasonLayer();return out;};
  const _vwcOpenNext=openNextSeasonMatch;openNextSeasonMatch=function(...args){const rec=vwcMaybeMarkDue();if(rec?.pendingStage&&!rec.completed){vwcOpen();return;}return _vwcOpenNext.apply(this,args);};
  const _vwcFast=toggleFastSeasonSimulation;toggleFastSeasonSimulation=function(...args){const rec=vwcMaybeMarkDue();if(rec?.pendingStage&&!rec.completed){vwcOpen();return;}return _vwcFast.apply(this,args);};
  if(typeof v35SimulateWholeSeason==='function'){const _vwcWhole=v35SimulateWholeSeason;v35SimulateWholeSeason=function(...args){const rec=vwcEnsureRecord();if(rec&&!rec.completed){const note=document.getElementById('seasonSimNote');if(note)note.textContent='🌍 世界杯年份禁用“一口气模拟到底”，请用“模拟本赛段”推进，否则国家队教练会发现你人已经跑到年底了。';vwcOpen();return;}return _vwcWhole.apply(this,args);};}
  const _vwcOffseason=enterOffseason;enterOffseason=function(...args){
    let rec=vwcEnsureRecord();
    const clubSeasonDone=Number(seasonState.played)>=Number(seasonState.total);
    // 已经落选/无资格的玩家也仍处在同一个世界时间线：当自己的俱乐部赛季彻底结束时，
    // 允许后台世界杯补完冠军，不能让“世界冠军：待定”永远挂在生涯里。
    if(rec?.completed&&clubSeasonDone&&!vwcHasClubPostseasonPath(rec.year)){
      rec.clubCalendarReleased=true;vwcMaybeResolveObserverChampion(rec);
    }
    const gatedStage=rec&&vwcPostClubStage(rec,rec.nextStage);
    if(rec&&!rec.completed&&clubSeasonDone&&gatedStage&&!vwcClubPostseasonResolved(rec)){
      if(vwcHasClubPostseasonPath(rec.year))return _vwcOffseason.apply(this,args);
      // 没有后续俱乐部季后赛可打：这次“进入休赛期”动作同时把世界时间线
      // 推进到联赛季后赛结束，再开启现实中更晚发生的世界杯正赛。
      rec.clubCalendarReleased=true;
    }
    rec=vwcMaybeMarkDue();
    if(rec&&!rec.completed&&clubSeasonDone&&rec.pendingStage){vwcOpen();return;}
    return _vwcOffseason.apply(this,args);
  };
  const _vwcRecord=recordCompletedCareerSeason;recordCompletedCareerSeason=function(...args){const out=_vwcRecord.apply(this,args);vwcSyncArchive(vwcYear());return out;};
  const _vwcOverview=renderCareerOverview;renderCareerOverview=function(...args){const out=_vwcOverview.apply(this,args);const host=els.careerTabContent;if(host&&!document.getElementById('vwcCareerBlock'))host.insertAdjacentHTML('beforeend',vwcCareerSection());return out;};
  const _vwcHonor=renderHonorWall;renderHonorWall=function(...args){Object.assign(HONOR_ICONS,{'世界杯冠军':'🌍','世界杯亚军':'🥈','国家队成员':'🏳️'});return _vwcHonor.apply(this,args);};
  const _vwcReset=resetBuildOnly;resetBuildOnly=function(...args){const out=_vwcReset.apply(this,args);careerState.worldCup={version:VWC_VERSION,seasons:{}};document.getElementById('vwcOverlay')?.classList.add('ui-hidden');return out;};

  document.getElementById('vwcClose')?.addEventListener('click',vwcClose);
  document.getElementById('vwcOverlay')?.addEventListener('click',e=>{if(e.target?.id==='vwcOverlay')vwcClose();});
  vwcInstallCountries();
  Object.assign(HONOR_ICONS,{'世界杯冠军':'🌍','世界杯亚军':'🥈','国家队成员':'🏳️'});

  window.__OWL_WORLD_CUP={
    version:'Public Beta 1.6 RC1',config:vwcConfig,ensure:(y)=>vwcEnsureRecord(y),maybeMarkDue:vwcMaybeMarkDue,open:vwcOpen,close:vwcClose,resolveSelection:vwcResolveSelection,declineSelection:vwcBeginDeclineSelection,resolveDeclineInterview:vwcResolveDeclineInterview,resolveStandby:vwcResolveStandby,resolveEvent:vwcResolveEvent,playNext:vwcPlayNext,playDetailed:vwcPlayDetailed,finishDetailed:vwcFinishDetailedMatch,
    snapshot:()=>JSON.parse(JSON.stringify(vwcRoot())),countryName:vwcCountryName,qaHash:(seed)=>vwcHash01(seed),
    diagnostics:()=>{const r=vwcEnsureRecord();return{year:vwcYear(),config:vwcConfig(vwcYear()),record:r,played:seasonState.played,total:seasonState.total,ovr:vwcOvr(),country:state.playerCountry};},
    qaSet:(year=2023,country='cn',age=20)=>{careerState.seasonYear=Number(year);careerState.age=Number(age);state.playerCountry=country;const root=vwcRoot();delete root.seasons[year];const r=vwcEnsureRecord(year);return r;},
    qaForceDue:(stage)=>{const r=vwcEnsureRecord();r.selected=true;r.phase='ready';r.nextStage=stage;r.pendingStage=stage;r.roster=r.roster?.length?r.roster:[{name:getPlayerName(),role:state.role,ovr:vwcOvr(),isUser:true,club:careerState.team?.name||'TEST'}];r.starter=true;return r;},
    qaForceStandby:()=>{const r=vwcEnsureRecord();r.completed=true;r.standbyEligible=true;r.standbyChecked=true;r.standbyPending=true;r.eventCount=Math.min(3,Number(r.eventCount||0)+1);return r;},
    qaComplete:(rec,result,finalOpp=null)=>{vwcComplete(rec||vwcEnsureRecord(),result,finalOpp);return(rec||vwcEnsureRecord()).worldChampion;}
  };
  window.__OWL_VWC_QA=()=>({realYears:[2016,2017,2018,2019,2023,2026].map(y=>!!vwcConfig(y)),future2027:!!vwcConfig(2027),future2028:!!vwcConfig(2028),future2029:!!vwcConfig(2029),no2024:!vwcConfig(2024),countries:Object.keys(VWC_COUNTRIES).length,invited2026:VWC_2026_INVITED.size,conference2026:VWC_2026_CONFERENCE.size,main2026:VWC_2026_MAIN.size,final162026:VWC_2026_FINAL16.size,groups2026:VWC_2026_GROUPS.map(g=>g.length),groups2023:VWC_2023_GROUPS.map(g=>g.length),final2023:VWC_2023_FINAL_FIELD.length,russia:VWC_COUNTRIES.ru});
})();
