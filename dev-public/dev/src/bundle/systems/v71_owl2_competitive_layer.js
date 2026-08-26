/* ===== BUNDLE MODULE: systems/v71_owl2_competitive_layer.js ===== */
/* ==========================================================================
   V7.1 · OWL 2.0 / 2025竞技层
   - 2024+: 20队 East/West、56场(同区4+跨区2)、19/18/19 三Stage
   - 2025+: 地图选择 → 阵容确认/换人 → 英雄禁用 → 开图
   - 正式地图名 + 2019~2026英雄/地图内容时间轴
   - 每位选手独立英雄熟练度；Ban真正影响地图发挥
   - 2027+刻意不生成内容，等待后续设计
   ========================================================================== */

  const V71_CONTENT_TIMELINE=Object.freeze({
    2019:{heroes:['巴蒂斯特','西格玛'],maps:['巴黎','哈瓦那']},
    2020:{heroes:['回声'],maps:[]},
    2021:{heroes:[],maps:[]},
    2022:{heroes:['索杰恩','渣客女王','雾子','拉玛刹'],maps:['皇家赛道','斗兽场','中城','新皇后街','帕拉伊苏','埃斯佩兰萨','香巴里寺院']},
    2023:{heroes:['生命之梭','伊拉锐','毛加'],maps:['南极半岛','新渣客城','苏拉瓦萨','萨摩亚']},
    2024:{heroes:['探奇','朱诺','骇灾'],maps:['鲁纳塞彼','花冈','阿努比斯王座']},
    2025:{heroes:['弗蕾娅','无漾','斩仇'],maps:['阿特利斯']},
    2026:{heroes:['金驭','埃姆雷','瑞稀','安燃','飞天猫','西拉','死怨'],maps:['霓虹枢纽']}
  });

  const V71_MAP_CATALOG=Object.freeze([
    // OW1 / 2019前已存在
    {id:'ilios',name:'伊利奥斯',type:'控制',modeGroup:'control',releaseYear:2016,proYear:2016,tags:['开阔','侧翼','长距离'],fights:8},
    {id:'lijiang_tower',name:'漓江塔',type:'控制',modeGroup:'control',releaseYear:2016,proYear:2016,tags:['狭窄','高节奏','侧翼'],fights:7},
    {id:'nepal',name:'尼泊尔',type:'控制',modeGroup:'control',releaseYear:2016,proYear:2016,tags:['高低差','近距离','抗压'],fights:8},
    {id:'oasis',name:'绿洲城',type:'控制',modeGroup:'control',releaseYear:2017,proYear:2017,tags:['开阔','侧翼','高节奏'],fights:8},
    {id:'busan',name:'釜山',type:'控制',modeGroup:'control',releaseYear:2018,proYear:2018,tags:['近距离','高节奏','侧翼'],fights:7},
    {id:'kings_row',name:'国王大道',type:'混合',modeGroup:'hybrid',releaseYear:2016,proYear:2016,tags:['高台','中距离','攻守转换'],fights:8},
    {id:'hollywood',name:'好莱坞',type:'混合',modeGroup:'hybrid',releaseYear:2016,proYear:2016,tags:['高台','中距离','侧翼'],fights:8},
    {id:'numbani',name:'努巴尼',type:'混合',modeGroup:'hybrid',releaseYear:2016,proYear:2016,tags:['高台','开阔','攻守转换'],fights:8},
    {id:'eichenwalde',name:'艾兴瓦尔德',type:'混合',modeGroup:'hybrid',releaseYear:2016,proYear:2016,tags:['高低差','近距离','攻守转换'],fights:8},
    {id:'blizzard_world',name:'暴雪世界',type:'混合',modeGroup:'hybrid',releaseYear:2018,proYear:2018,tags:['中距离','高台','阵地'],fights:8},
    {id:'dorado',name:'多拉多',type:'运载',modeGroup:'escort',releaseYear:2016,proYear:2016,tags:['高台','中距离','攻守转换'],fights:8},
    {id:'route_66',name:'66号公路',type:'运载',modeGroup:'escort',releaseYear:2016,proYear:2016,tags:['长距离','开阔','高台'],fights:9},
    {id:'gibraltar',name:'监测站：直布罗陀',type:'运载',modeGroup:'escort',releaseYear:2016,proYear:2016,tags:['高台','垂直','突进'],fights:9},
    {id:'junkertown',name:'渣客镇',type:'运载',modeGroup:'escort',releaseYear:2017,proYear:2017,tags:['长距离','开阔','消耗'],fights:9},
    {id:'rialto',name:'里阿尔托',type:'运载',modeGroup:'escort',releaseYear:2018,proYear:2018,tags:['长距离','开阔','消耗'],fights:9},
    {id:'havana',name:'哈瓦那',type:'运载',modeGroup:'escort',releaseYear:2019,proYear:2019,tags:['长距离','高台','消耗'],fights:9},
    {id:'hanamura',name:'花村',type:'攻防作战',modeGroup:'assault',releaseYear:2016,proYear:2016,retireYear:2022,tags:['狭窄','高台','阵地'],fights:8},
    {id:'temple_anubis',name:'阿努比斯神殿',type:'攻防作战',modeGroup:'assault',releaseYear:2016,proYear:2016,retireYear:2022,tags:['狭窄','高台','阵地'],fights:8},
    {id:'volskaya',name:'沃斯卡娅工业区',type:'攻防作战',modeGroup:'assault',releaseYear:2016,proYear:2016,retireYear:2022,tags:['开阔','阵地','消耗'],fights:8},
    {id:'horizon',name:'地平线月球基地',type:'攻防作战',modeGroup:'assault',releaseYear:2017,proYear:2017,retireYear:2021,tags:['高台','开阔','突进'],fights:8},
    {id:'paris',name:'巴黎',type:'攻防作战',modeGroup:'assault',releaseYear:2019,proYear:2019,retireYear:2021,tags:['狭窄','长距离','阵地'],fights:8},
    // OW2
    {id:'antarctic_peninsula',name:'南极半岛',type:'控制',modeGroup:'control',releaseYear:2023,proYear:2023,tags:['近距离','侧翼','高节奏'],fights:8},
    {id:'samoa',name:'萨摩亚',type:'控制',modeGroup:'control',releaseYear:2023,proYear:2023,tags:['开阔','高低差','侧翼'],fights:8},
    {id:'midtown',name:'中城',type:'混合',modeGroup:'hybrid',releaseYear:2022,proYear:2022,tags:['中距离','高台','阵地'],fights:8},
    {id:'paraiso',name:'帕拉伊苏',type:'混合',modeGroup:'hybrid',releaseYear:2022,proYear:2022,tags:['侧翼','高低差','突进'],fights:8},
    {id:'circuit_royal',name:'皇家赛道',type:'运载',modeGroup:'escort',releaseYear:2022,proYear:2022,tags:['长距离','开阔','高台'],fights:9},
    {id:'shambali',name:'香巴里寺院',type:'运载',modeGroup:'escort',releaseYear:2022,proYear:2023,tags:['高台','中距离','阵地'],fights:9},
    {id:'new_queen_street',name:'新皇后街',type:'推进',modeGroup:'push',releaseYear:2022,proYear:2022,tags:['混战','侧翼','高节奏'],fights:8},
    {id:'colosseo',name:'斗兽场',type:'推进',modeGroup:'push',releaseYear:2022,proYear:2022,tags:['中距离','混战','阵地'],fights:8},
    {id:'esperanca',name:'埃斯佩兰萨',type:'推进',modeGroup:'push',releaseYear:2022,proYear:2022,tags:['侧翼','高低差','高节奏'],fights:8},
    {id:'runasapi',name:'鲁纳塞彼',type:'推进',modeGroup:'push',releaseYear:2024,proYear:2024,tags:['高低差','侧翼','长距离'],fights:8},
    {id:'new_junk_city',name:'新渣客城',type:'闪点',modeGroup:'flash_clash',releaseYear:2023,proYear:2023,tags:['混战','转点','高节奏'],fights:9},
    {id:'suravasa',name:'苏拉瓦萨',type:'闪点',modeGroup:'flash_clash',releaseYear:2023,proYear:2023,tags:['转点','侧翼','高低差'],fights:9},
    {id:'aatlis',name:'阿特利斯',type:'闪点',modeGroup:'flash_clash',releaseYear:2025,proYear:2025,tags:['转点','高节奏','侧翼'],fights:9},
    {id:'hanaoka',name:'花冈',type:'攻防阵线',modeGroup:'flash_clash',releaseYear:2024,proYear:2024,tags:['近距离','高节奏','阵地'],fights:8},
    {id:'throne_anubis',name:'阿努比斯王座',type:'攻防阵线',modeGroup:'flash_clash',releaseYear:2024,proYear:2024,tags:['高低差','阵地','混战'],fights:8},
    {id:'neon_junction',name:'霓虹枢纽',type:'混合',modeGroup:'hybrid',releaseYear:2026,proYear:2026,tags:['高台','侧翼','攻守转换'],fights:9}
  ]);

  const V71_HERO_CATALOG=Object.freeze([
    // Tank
    ['D.Va','tank',2016],['温斯顿','tank',2016],['莱因哈特','tank',2016],['破坏球','tank',2018],['奥丽莎','tank',2017],['西格玛','tank',2019],['路霸','tank',2016],['查莉娅','tank',2016],['末日铁拳','tank',2022],['渣客女王','tank',2022],['拉玛刹','tank',2022],['毛加','tank',2023],['骇灾','tank',2024],['金驭','tank',2026],
    // Damage
    ['猎空','damage',2016],['源氏','damage',2016],['卡西迪','damage',2016],['艾什','damage',2018],['黑百合','damage',2016],['士兵：76','damage',2016],['索杰恩','damage',2022],['回声','damage',2020],['法老之鹰','damage',2016],['半藏','damage',2016],['美','damage',2016],['秩序之光','damage',2016],['黑影','damage',2016],['死神','damage',2016],['堡垒','damage',2016],['托比昂','damage',2016],['狂鼠','damage',2016],['探奇','damage',2024],['弗蕾娅','damage',2025],['斩仇','damage',2025],['埃姆雷','damage',2026],['安燃','damage',2026],['西拉','damage',2026],['死怨','damage',2026],
    // Support
    ['安娜','support',2016],['卢西奥','support',2016],['天使','support',2016],['禅雅塔','support',2016],['莫伊拉','support',2017],['布丽吉塔','support',2018],['巴蒂斯特','support',2019],['雾子','support',2022],['生命之梭','support',2023],['伊拉锐','support',2023],['朱诺','support',2024],['无漾','support',2025],['瑞稀','support',2026],['飞天猫','support',2026]
  ].map(([name,group,releaseYear])=>({id:name,name,group,releaseYear,proYear:releaseYear})));

  function v71Year(){return Number(careerState.seasonYear||2019);}
  function v71IsOwl2(){return v71Year()>=2024;}
  function v71StrategicEra(){return v71Year()>=2025 && v71Year()<2033;}
  function v71HasStrategicDraft(){return v71StrategicEra() && matchState.context!=='allstar';}
  function v71Conference(team){return (team?.division==='Atlantic'||team?.conference==='East')?'East':'West';}
  function v71ConferenceZh(teamOrKey){const k=typeof teamOrKey==='string'?teamOrKey:v71Conference(teamOrKey);return k==='East'?'东部':'西部';}
  function v71RoleGroup(role){return role==='坦克'?'tank':(/输出/.test(role)&&role!=='输出支援')?'damage':role==='长枪输出'||role==='弹道输出'?'damage':'support';}
  function v71AvailableHeroes(year=v71Year()){return V71_HERO_CATALOG.filter(h=>h.proYear<=year);}
  function v71AvailableMaps(year=v71Year()){
    return V71_MAP_CATALOG.filter(m=>m.proYear<=year && (!m.retireYear||year<m.retireYear));
  }
  function v71CompetitiveMaps(year=v71Year()){
    const maps=v71AvailableMaps(year);
    if(year>=2022)return maps.filter(m=>m.modeGroup!=='assault');
    return maps;
  }
  function v71SeasonFormat(){
    const format=window.__OWL_FUTURE_RULES_CONFIG?.seasonFormat;
    return typeof format==='function'?format(v71Year()):{total:56,lens:[19,18,19],summary:'20 支队伍 · 同区4回合 / 跨区2回合'};
  }
  function v71StageNo(){const p=Number(seasonState.played||0),lens=v71SeasonFormat().lens;return p<lens[0]?1:p<lens[0]+lens[1]?2:3;}
  function v71StageBounds(stage){const lens=v71SeasonFormat().lens,s=Number(stage);const start=s===1?0:s===2?lens[0]:lens[0]+lens[1];return[start,start+lens[Math.max(0,Math.min(2,s-1))]];}
  function v71StageLength(stage){const [a,b]=v71StageBounds(stage);return b-a;}

  // 2024改革世界保持20席：2023退出的成都席位在架空联盟改革后恢复为原franchise席位。
  // 这是赛制层的占位处理；未来若敲定2024具体继任队名，只需改team meta，不动赛程算法。
  function v71EnsureOwl2Teams(){
    if(!v71IsOwl2())return;
    TEAMS.forEach(t=>{t.active=true;t.conference=v71Conference(t);});
  }
  const _v71ApplyWorldBase=v50ApplySeasonWorld;
  v50ApplySeasonWorld=function(year){
    const r=_v71ApplyWorldBase(year);
    if(Number(year)>=2024){TEAMS.forEach(t=>{t.active=true;t.conference=v71Conference(t);});}
    return r;
  };
  v50TeamActiveNextYear=function(team,nextYear){return Number(nextYear)>=2024?true:v50TeamMetaForYear(team,nextYear).active!==false;};

  // ---------- 英雄熟练度 ----------
  function v71Hash01(text){let h=2166136261>>>0,s=String(text);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0)/4294967295;}
  function v71HeroLabel(v){return v>=95?'招牌':v>=88?'精通':v>=78?'熟练':v>=68?'可用':'生疏';}
  function v71HeroPool(player,year=v71Year()){
    const group=v71RoleGroup(player.role),heroes=v71AvailableHeroes(year).filter(h=>h.group===group);
    careerState.heroProficiency=careerState.heroProficiency||{};
    const userStore=player.isUser?(careerState.heroProficiency[player.role]||(careerState.heroProficiency[player.role]={})):null;
    return heroes.map((h,i)=>{
      let value;
      if(userStore&&Number.isFinite(userStore[h.id]))value=userStore[h.id];
      else{
        // 1.9 RC4：初始英雄熟练度由“英雄池”属性决定基准与广度，随机只负责风格/招牌。
        // 旧公式 72~92 + 7 招牌会让普通 80 OVR 选手随机出 99，并经常一开档全英雄熟练，
        // 进而让地图适配压过 OVR / 合同身份。现在保留个体差异，但不再让名字随机决定是否是全能怪。
        const poolAptitude=player.isUser
          ?Number(state.locked?.pool?.value??player?.attrs?.pool??player?.overall??78)
          :Number(player?.attrs?.pool??player?.overall??78);
        const overall=Number(player.overall||80);
        const base=66+(poolAptitude-70)*.30+v71Hash01(`${player.name}|${h.id}|base`)*16+(overall-80)*.08;
        const specialist=v71Hash01(`${player.name}|${player.role}|special`)>.72;
        const signature=(v71Hash01(`${player.name}|${h.id}|sig`)> (specialist?.88:.96))?5:0;
        value=Math.round(clamp(base+signature,58,99));
        if(userStore)userStore[h.id]=value;
      }
      return {...h,value,label:v71HeroLabel(value)};
    }).sort((a,b)=>b.value-a.value);
  }
  function v71HeroMapBonus(hero,map){
    const t=(map?.tags||[]).join('|'),n=hero.name;
    let b=0;
    if(/长距离|开阔|高台/.test(t)&&/黑百合|艾什|卡西迪|索杰恩|士兵|安娜|巴蒂斯特|伊拉锐|西拉/.test(n))b+=3;
    if(/近距离|狭窄|混战|高节奏/.test(t)&&/猎空|源氏|死神|探奇|温斯顿|D.Va|卢西奥|雾子|安燃/.test(n))b+=3;
    if(/侧翼|转点|高低差/.test(t)&&/猎空|源氏|回声|探奇|朱诺|卢西奥|破坏球|温斯顿|飞天猫/.test(n))b+=2;
    if(/阵地|攻守转换/.test(t)&&/莱因哈特|西格玛|拉玛刹|巴蒂斯特|美|卡西迪/.test(n))b+=2;
    return b;
  }
  function v71BestHeroFor(player,map,banned=[]){
    const ban=new Set(banned||[]),pool=v71HeroPool(player).filter(h=>!ban.has(h.name));
    return pool.map(h=>({...h,mapScore:h.value+v71HeroMapBonus(h,map)})).sort((a,b)=>b.mapScore-a.mapScore)[0]||null;
  }
  function v71HeroPoolBreadth(player){return v71HeroPool(player).filter(h=>h.value>=78).length;}
  function v71BanPenalty(player,map){
    if(!v71HasStrategicDraft()||!matchState.currentBans)return 0;
    const unrestricted=v71BestHeroFor(player,map,[]),restricted=v71BestHeroFor(player,map,[matchState.currentBans.home,matchState.currentBans.away].filter(Boolean));
    if(!unrestricted||!restricted)return 0;
    return clamp((restricted.mapScore-unrestricted.mapScore)*.34,-6,1);
  }
  const _v71RoleEffectiveBase=roleEffective;
  roleEffective=function(player,map,styleKey,isUser){
    const base=_v71RoleEffectiveBase(player,map,styleKey,isUser);
    if(v71Year()<2024)return base;
    const best=v71BestHeroFor(player,map,[]),heroLift=best?clamp((best.mapScore-82)*.09,-2.3,2.5):0;
    return base+heroLift+v71BanPenalty(player,map);
  };

  // 小型英雄池展示，2024开始直接让玩家看得见“为什么这个人适合这张图”。
  const _v71RenderRostersBase=renderRosters;
  renderRosters=function(){
    _v71RenderRostersBase();
    if(v71Year()<2024)return;
    [['homeRoster','home'],['awayRoster','away']].forEach(([id,side])=>{
      const box=document.getElementById(id),roster=side==='home'?matchState.homeRoster:matchState.awayRoster;if(!box)return;
      [...box.querySelectorAll('.roster-player')].forEach((node,i)=>{
        const p=roster[i];if(!p)return;const top=v71HeroPool(p).slice(0,3);
        const mini=document.createElement('div');mini.className='v71-hero-mini';mini.innerHTML=top.map(h=>`<span title="${h.name} ${h.value}">${h.name}<b>${h.value}</b></span>`).join('');
        node.querySelector('div[style*="min-width"]')?.appendChild(mini);
      });
    });
  };

  // ---------- 2024+ 56场赛程 ----------
  function v71Build56Schedule(){
    v71EnsureOwl2Teams();
    const me=careerState.team,all=TEAMS.filter(t=>t.name!==me.name),myConf=v71Conference(me);
    const same=all.filter(t=>v71Conference(t)===myConf),cross=all.filter(t=>v71Conference(t)!==myConf);
    const entries=[];
    same.forEach(o=>{entries.push({opponent:o,venue:'home',tag:'同区·第1回合'});entries.push({opponent:o,venue:'away',tag:'同区·第2回合'});entries.push({opponent:o,venue:'home',tag:'同区·第3回合'});entries.push({opponent:o,venue:'away',tag:'同区·第4回合'});});
    cross.forEach(o=>{entries.push({opponent:o,venue:'home',tag:'跨区·主场'});entries.push({opponent:o,venue:'away',tag:'跨区·客场'});});
    // 带约束洗牌：尽量把连续复仇局打散；总量与主客场对称不动。
    const pool=shuffle(entries);
    for(let i=1;i<pool.length;i++){
      if(pool[i].opponent.name===pool[i-1].opponent.name){
        const j=pool.findIndex((x,k)=>k>i&&x.opponent.name!==pool[i-1].opponent.name&&(!pool[i+1]||x.opponent.name!==pool[i+1].opponent.name));
        if(j>i)[pool[i],pool[j]]=[pool[j],pool[i]];
      }
    }
    seasonState.opponents=pool.map(x=>x.opponent);
    seasonState.venues=pool.map(x=>x.venue);
    const lens=v71SeasonFormat().lens,b1=lens[0],b2=b1+lens[1];
    seasonState.legs=pool.map((x,i)=>`Stage ${i<b1?1:i<b2?2:3} · ${x.tag}`);
  }

  const _v71SetupSeasonBase=setupSeason;
  setupSeason=function(isRestart=false){
    _v71SetupSeasonBase(isRestart);
    if(!v71IsOwl2())return;
    v71EnsureOwl2Teams();
    const format=v71SeasonFormat();seasonState.total=format.total;seasonState.results=Array(format.total).fill(null);seasonState.played=0;seasonState.wins=0;seasonState.losses=0;
    seasonState.stageBreakPending=null;seasonState.stageProcessed=[];seasonState.stagePlayoffHistory=[];seasonState.stageTitles=[];seasonState.stageTables={};seasonState.finalStandingsCache=null;
    seasonState.majorBonusLP=0;seasonState.majorSlotOwner=careerState.nextMajor1ChampionConference||null;seasonState.v71LastMajorSummary=null;
    v71Build56Schedule();
    renderSeason();
    setTimeout(v71MaybeShowSeasonIntro,120);
  };

  const _v71CurrentStageBase=currentStageNumber;
  currentStageNumber=function(){return v71IsOwl2()?v71StageNo():_v71CurrentStageBase();};
  const _v71StageSliceBase=stageSlice;
  stageSlice=function(stageNo){if(!v71IsOwl2())return _v71StageSliceBase(stageNo);const[a,b]=v71StageBounds(stageNo);return seasonState.results.slice(a,b);};
  const _v71StageRecordBase=stageRecord;
  stageRecord=function(stageNo){if(!v71IsOwl2())return _v71StageRecordBase(stageNo);const arr=stageSlice(stageNo);return{wins:arr.filter(x=>x==='win').length,losses:arr.filter(x=>x==='loss').length};};

  function v71MajorSlots(){return seasonState.majorSlotOwner==='East'?{East:5,West:3}:seasonState.majorSlotOwner==='West'?{East:3,West:5}:{East:4,West:4};}
  function v71BuildStageTables(stageNo){
    seasonState.stageTables=seasonState.stageTables||{};const key=`v71-${stageNo}-${seasonState.played}-${seasonState.majorSlotOwner||'44'}`;
    if(seasonState.stageTables[key])return seasonState.stageTables[key];
    const len=v71StageLength(stageNo),rec=stageRecord(stageNo),slots=v71MajorSlots(),year=v71Year();
    const rows=TEAMS.filter(t=>t.active!==false).map(team=>{
      const isUser=team.name===careerState.team?.name;let wins,mapDiff;
      if(isUser){wins=rec.wins;mapDiff=Math.round((rec.wins-rec.losses)*2.1+(getSeasonAverageRating()-7)*4);}
      else{const rate=clamp(.50+(team.strength-80)*.018+stableSeasonNoise(team.name,year*10+stageNo,3)*.012,.18,.82);wins=clamp(Math.round(len*rate),1,len-1);mapDiff=Math.round((wins-(len-wins))*2+stableSeasonNoise(team.name,stageNo+71,5));}
      return{team,isUser,wins,losses:len-wins,mapDiff,conference:v71Conference(team)};
    });
    ['East','West'].forEach(conf=>{
      const group=rows.filter(r=>r.conference===conf).sort((a,b)=>b.wins-a.wins||b.mapDiff-a.mapDiff||b.team.strength-a.team.strength);
      group.forEach((r,i)=>{r.conferenceRank=i+1;r.qualified=i<slots[conf];});
    });
    const sorted=[...rows].sort((a,b)=>b.wins-a.wins||b.mapDiff-a.mapDiff||b.team.strength-a.team.strength);sorted.forEach((r,i)=>r.rank=i+1);
    seasonState.stageTables[key]=sorted;return sorted;
  }
  const _v71StageRankBase=stageEstimatedRank;
  stageEstimatedRank=function(stageNo){if(!v71IsOwl2())return _v71StageRankBase(stageNo);return v71BuildStageTables(stageNo).find(r=>r.isUser)?.conferenceRank||10;};
  const _v71StageQualifiedBase=stageQualified;
  stageQualified=function(stageNo){if(!v71IsOwl2())return _v71StageQualifiedBase(stageNo);return !!v71BuildStageTables(stageNo).find(r=>r.isUser)?.qualified;};

  const _v71MarkStageBreakBase=markStageBreakIfNeeded;
  markStageBreakIfNeeded=function(){
    if(!v71IsOwl2())return _v71MarkStageBreakBase();
    const format=v71SeasonFormat(),b1=format.lens[0],b2=b1+format.lens[1],boundary=seasonState.played===b1?1:seasonState.played===b2?2:seasonState.played===format.total?3:null;
    if(boundary&&!seasonState.stageProcessed.includes(boundary)){seasonState.stageBreakPending=boundary;seasonState.simulating=false;if(seasonState.timer)clearTimeout(seasonState.timer);seasonState.timer=null;}
  };

  function v71MajorProbability(a,b){
    const pa=a.team?.name===careerState.team?.name?teamDisplayPower(careerState.starters):(a.team?.strength||80);
    const pb=b.team?.name===careerState.team?.name?teamDisplayPower(careerState.starters):(b.team?.strength||80);
    return clamp(.5+(pa-pb)*.027,.20,.80);
  }
  function v71MajorEntries(stageNo){
    const rows=v71BuildStageTables(stageNo).filter(r=>r.qualified).sort((a,b)=>b.wins-a.wins||b.mapDiff-a.mapDiff);
    const base=rows.slice(0,8).map((r,i)=>({team:r.team,seed:i+1,stageSeed:i+1,isUser:r.isUser,region:r.conference,stageWins:r.wins}));
    // 全明星胜方只获得“首轮选对手优先权”，不加席位、不加LP、不加战力。
    // TournamentEngine首轮按1-8/2-7/3-6/4-5配对，因此仅重排pairing seed；真实Stage seed保存在stageSeed。
    const priority=stageNo===3?seasonState.v71AllStarDraftPriority:null;
    if(!priority)return base;
    const selector=base.filter(x=>x.region===priority&&x.stageSeed<=4).sort((a,b)=>a.stageSeed-b.stageSeed)[0];
    if(!selector)return base;
    const bottom=base.filter(x=>x.stageSeed>=5),target=[...bottom].sort((a,b)=>(a.team.strength||80)-(b.team.strength||80)||b.stageSeed-a.stageSeed)[0];
    if(!target)return base;
    const topRest=base.filter(x=>x.stageSeed<=4&&x!==selector).sort((a,b)=>a.stageSeed-b.stageSeed);
    const bottomRest=base.filter(x=>x.stageSeed>=5&&x!==target).sort((a,b)=>a.stageSeed-b.stageSeed);
    selector.seed=1;target.seed=8;topRest.forEach((x,i)=>x.seed=2+i);bottomRest.forEach((x,i)=>x.seed=7-i);
    seasonState.v71AllStarDraftUsed={stage:stageNo,conference:priority,selector:selector.team.name,target:target.team.name};
    return [...base].sort((a,b)=>a.seed-b.seed);
  }
  function v71UserMajorPlacement(result){
    const me=careerState.team?.name;if(result.champion?.name===me)return{label:'冠军',bonus:4};if(result.runnerUp?.name===me)return{label:'亚军',bonus:3};
    const mine=result.series.filter(s=>s.teamA?.name===me||s.teamB?.name===me);if(!mine.length)return{label:'未参赛',bonus:0};
    const last=mine[mine.length-1],idx=result.series.indexOf(last);return idx>=result.series.length-3?{label:'季军',bonus:2}:{label:'八强/六强',bonus:1};
  }
  function v71RunMajor(stageNo){
    const entries=v71MajorEntries(stageNo),me=careerState.team?.name,participated=entries.some(x=>x.team.name===me);
    const config={id:`OWL2_${v71Year()}_MAJOR_${stageNo}`,name:`${v71Year()} Major ${stageNo}`,format:'doubleElimination',participantCount:8,series:{defaultTargetWins:3,finalTargetWins:4}};
    const result=TournamentEngine._internals.runDoubleElimination(config,entries,{probabilityFn:v71MajorProbability});
    const championConf=v71Conference(result.champion),placement=participated?v71UserMajorPlacement(result):{label:'未晋级',bonus:0};
    seasonState.majorBonusLP=(seasonState.majorBonusLP||0)+placement.bonus;
    seasonState.majorSlotOwner=championConf;if(stageNo===2){seasonState.v71TradeClosed=true;seasonState.v71AllStarPending=true;}if(stageNo===3)careerState.nextMajor1ChampionConference=championConf;
    const rounds=participated?window.__OWL_SERIES_PROJECTION.forTeam(result,me):[];
    const finalSeries=result.series?.find(s=>s.roundKey==='grandFinal')||result.series?.at(-1);const championName=result.champion?.name||'待定';const finalScore=finalSeries?(finalSeries.teamA?.name===championName?`${finalSeries.scoreA}:${finalSeries.scoreB}`:`${finalSeries.scoreB}:${finalSeries.scoreA}`):'';const h={stage:stageNo,rank:stageEstimatedRank(stageNo),result:`Major ${stageNo} ${placement.label}`,rounds,bracketSeries:window.__OWL_SERIES_PROJECTION.archive(result),champion:championName,runnerUp:result.runnerUp?.name||'待定',finalScore,championConference:championConf,bonusLP:placement.bonus,competitionId:config.id};
    seasonState.stagePlayoffHistory=seasonState.stagePlayoffHistory||[];seasonState.stagePlayoffHistory=seasonState.stagePlayoffHistory.filter(x=>x.stage!==stageNo);seasonState.stagePlayoffHistory.push(h);
    if(placement.label==='冠军'){seasonState.stageTitles.push(`Major ${stageNo}冠军`);careerState.popularity=clamp(careerState.popularity+9,0,100);}
    if(!seasonState.stageProcessed.includes(stageNo))seasonState.stageProcessed.push(stageNo);seasonState.stageBreakPending=null;seasonState.v71LastMajorSummary=h;
    renderSeason();window.scrollTo({top:0,behavior:'smooth'});
  }
  const _v71SimStageBase=simulateStagePlayoff;
  simulateStagePlayoff=function(stageNo){return v71IsOwl2()?v71RunMajor(stageNo):_v71SimStageBase(stageNo);};
  const _v71SkipStageBase=skipStageBreak;
  skipStageBreak=function(stageNo){return v71IsOwl2()?v71RunMajor(stageNo):_v71SkipStageBase(stageNo);};

  // 全年排名：56场胜负为主体，Major Bonus LP用于同层级拉开差距。
  const _v71SyntheticBase=syntheticFinalStandings;
  syntheticFinalStandings=function(){
    if(!v71IsOwl2())return _v71SyntheticBase();if(seasonState.finalStandingsCache)return seasonState.finalStandingsCache;
    const userLP=seasonState.wins+(seasonState.majorBonusLP||0),rows=TEAMS.filter(t=>t.active!==false).map(team=>{
      const total=v71SeasonFormat().total;
      if(team.name===careerState.team?.name)return{team,wins:seasonState.wins,losses:total-seasonState.wins,mapDiff:Math.round((seasonState.wins-seasonState.losses)*2.1),lp:userLP,isUser:true};
      const rate=clamp(.5+(team.strength-80)*.018+stableSeasonNoise(team.name,v71Year(),4)*.01,.20,.80),wins=clamp(Math.round(total*rate),8,total-8),major=clamp(Math.round((team.strength-78)/6+stableSeasonNoise(team.name,88,2)),0,8);return{team,wins,losses:total-wins,mapDiff:(wins-total/2)*2+stableSeasonNoise(team.name,177,7),lp:wins+major,isUser:false};
    }).sort((a,b)=>b.lp-a.lp||b.wins-a.wins||b.mapDiff-a.mapDiff||b.team.strength-a.team.strength);
    rows.forEach((r,i)=>{r.rank=i+1;r.direct=i<8;});seasonState.finalStandingsCache=rows;return rows;
  };
  const _v71EstimateBase=estimateSeasonRank;
  estimateSeasonRank=function(){
    if(!v71IsOwl2())return _v71EstimateBase();if(!seasonState.played)return careerState.rank||7;if(seasonState.played>=v71SeasonFormat().total)return syntheticFinalStandings().find(r=>r.isUser)?.rank||v71SeasonFormat().teams||20;
    const rate=seasonState.wins/Math.max(1,seasonState.played);return clamp(Math.round(20.5-rate*22),1,20);
  };

  const _v71RenderSeasonBase=renderSeason;
  renderSeason=function(){
    _v71RenderSeasonBase();if(!v71IsOwl2()||!careerState.team)return;
    const stage=v71StageNo(),[a,b]=v71StageBounds(stage),stagePlayed=clamp(seasonState.played-a,0,b-a),slots=v71MajorSlots();
    const league=document.getElementById('seasonLeagueText');if(league)league.innerHTML=`OWL 2.0 · ${v71ConferenceZh(careerState.team)} · Stage ${stage}`;
    const format=v71SeasonFormat(),head=document.querySelector('.season-track-head h3+span');if(head)head.textContent=`${format.summary} · 3个Stage`;
    const dots=document.getElementById('seasonDots');if(dots){
      const lens=format.lens,starts=[0,lens[0],lens[0]+lens[1]];dots.innerHTML=lens.map((len,si)=>`<div class="stage-dot-group"><b>STAGE ${si+1}</b><div class="stage-dot-row">${Array.from({length:len},(_,j)=>{const i=starts[si]+j,r=seasonState.results[i];return `<i class="season-dot ${r||''} ${i===seasonState.played&&seasonState.played<format.total?'current':''}" title="Stage ${si+1} · 第${j+1}场${seasonState.opponents[i]?' · '+seasonState.opponents[i].name:''}"></i>`}).join('')}</div></div>`).join('');
    }
    const progress=document.getElementById('seasonProgressCopy');if(progress&&seasonState.played<format.total)progress.innerHTML=`Stage ${stage} · <strong>${stagePlayed} / ${b-a}</strong> · 全赛季 ${seasonState.played} / ${format.total} · Major加分 ${seasonState.majorBonusLP||0}`;
    const area=document.getElementById('seasonCompleteArea');if(!area)return;
    if(seasonState.stageBreakPending){
      const s=seasonState.stageBreakPending,rec=stageRecord(s),rank=stageEstimatedRank(s),q=stageQualified(s),slotText=`东部${slots.East}席 / 西部${slots.West}席`;
      area.innerHTML=`<div class="stage-break-card"><div class="offseason-kicker">STAGE ${s} COMPLETE · MAJOR QUALIFICATION</div><h3>Stage ${s} 结束 · Major ${s}</h3><p>本Stage独立排名决定Major资格。当前Champion Slot：${slotText}；Major冠军会替自己的赛区拿到下一届额外席位。</p><div class="stage-break-stats"><div><span>阶段战绩</span><strong>${rec.wins}-${rec.losses}</strong></div><div><span>${v71ConferenceZh(careerState.team)}排名</span><strong>第 ${rank}</strong></div><div><span>资格</span><strong>${q?'晋级Major':'未晋级'}</strong></div></div><button class="primary-btn" id="resolveStageBreakBtn">${q?`模拟 Major ${s} →`:`结算 Major ${s} →`}</button></div>`;
      document.getElementById('resolveStageBreakBtn')?.addEventListener('click',()=>q?simulateStagePlayoff(s):skipStageBreak(s));
      ['playNextSeasonMatchBtn','fastSimSeasonBtn','fullSimSeasonBtn'].forEach(id=>{const n=document.getElementById(id);if(n)n.disabled=true;});return;
    }
    if(seasonState.v71LastMajorSummary&&seasonState.played<format.total){const h=seasonState.v71LastMajorSummary;area.innerHTML=`<div class="stage-break-card v71-major-result"><div class="offseason-kicker">MAJOR ${h.stage} · FINAL</div><h3>🏆 ${h.champion}</h3><p>${v71ConferenceZh(h.championConference)}赢下Major，下一届国际赛名额变为 ${h.championConference==='East'?'东5西3':'东3西5'}。你的成绩：<strong>${h.result}</strong>${h.bonusLP?` · +${h.bonusLP} LP`:''}</p><button class="primary-btn" id="v71ContinueMajorBtn">继续赛季 →</button></div>`;document.getElementById('v71ContinueMajorBtn')?.addEventListener('click',()=>{seasonState.v71LastMajorSummary=null;renderSeason();});return;}
    if(seasonState.played>=format.total){
      const rank=estimateSeasonRank(),awardLabel=seasonState.awardsViewed?'🏅 返回年度奖项':'🏅 揭晓年度奖项';
      area.innerHTML=`<div class="season-complete-banner"><strong>常规赛完成：${seasonState.wins} 胜 ${seasonState.losses} 负 · ${seasonState.wins+(seasonState.majorBonusLP||0)} LP · 全联盟第 ${rank}。</strong><br>${rank<=8?'进入年度八队双败季后赛。':'未进入全联盟前8，本赛季季后赛到此为止。'}<div style="margin-top:13px;display:flex;gap:10px;flex-wrap:wrap"><button class="secondary-btn" id="viewRegularAwardsBtn">${awardLabel}</button>${rank<=8?'<button class="primary-btn" id="enterPlayoffsBtn">🏆 进入季后赛</button>':''}<button class="secondary-btn" data-open-season-summary="1">📊 查看赛季结算</button></div></div>`;
      document.getElementById('viewRegularAwardsBtn')?.addEventListener('click',openRegularSeasonAwards);document.getElementById('enterPlayoffsBtn')?.addEventListener('click',()=>{careerState.postseasonSeed=rank;enterPlayoffs();});
    }
  };

  // ---------- 2025：选地图 → 阵容确认 → Hero Bans ----------
  function v71ModeLabel(group){return({control:'控制',hybrid:'混合',escort:'运载',push:'推进',flash_clash:'闪点 / 攻防阵线'})[group]||group;}
  function v71UsedMapIds(){return new Set((matchState.mapSequence||[]).filter(Boolean).map(m=>m.id||m.name));}
  function v71EligibleModeGroups(){
    const groups=['control','hybrid','flash_clash','escort','push'];if(matchState.mapIndex===0)return['control'];
    matchState.usedModeGroups=matchState.usedModeGroups||[];const used=new Set(matchState.usedModeGroups);
    if(used.size>=groups.length){matchState.usedModeGroups=[];return groups;}
    return groups.filter(g=>!used.has(g));
  }
  function v71EligibleMaps(){
    const ids=v71UsedMapIds(),groups=new Set(v71EligibleModeGroups());return v71CompetitiveMaps().filter(m=>groups.has(m.modeGroup)&&!ids.has(m.id||m.name));
  }
  function v71MapPoolForMatch(){return v71CompetitiveMaps();}

  const _v71SetupMatchBase=setupMatch;
  setupMatch=function(forceOpponent,targetWins=3,options={}){
    const strategic=v71HasStrategicDraft();
    _v71SetupMatchBase(forceOpponent,targetWins,{...options,mapSelectionEnabled:strategic?true:options.mapSelectionEnabled});
    const pool=v71MapPoolForMatch();matchState.availableMaps=[...pool];
    if(v71Year()>=2019&&!strategic&&!options.mapSelectionEnabled){matchState.mapSequence=shuffle([...pool]).slice(0,targetWins*2-1);}
    if(strategic){matchState.mapSelectionEnabled=true;matchState.mapSequence=[];matchState.usedModeGroups=[];matchState.pregamePhase='map';matchState.currentBans=null;matchState.banHistory={home:[],away:[]};matchState.lockedBanHeroes=[];matchState.lineupNotes={home:'待确认',away:'待确认'};}
    renderMatch();
  };

  const _v71CurrentMapBase=currentMatchMap;
  currentMatchMap=function(){if(v71HasStrategicDraft())return matchState.mapSequence[matchState.mapIndex]||null;return _v71CurrentMapBase();};

  function v71AutoChooseMap(side){const list=v71EligibleMaps();const roster=side==='home'?matchState.homeRoster:matchState.awayRoster;return [...list].sort((a,b)=>mapFitValue(roster,b)-mapFitValue(roster,a))[0]||list[0];}
  const _v71AutoMapBase=autoChooseMapForSide;
  autoChooseMapForSide=function(side,available=matchState.availableMaps){return v71HasStrategicDraft()?v71AutoChooseMap(side):_v71AutoMapBase(side,available);};

  const _v71CommitMapBase=commitSeriesMap;
  commitSeriesMap=function(map,side=matchState.mapPicker,rerender=true){
    if(!v71HasStrategicDraft())return _v71CommitMapBase(map,side,rerender);if(!map)return;
    matchState.mapSequence[matchState.mapIndex]=map;matchState.availableMaps=v71MapPoolForMatch().filter(m=>!v71UsedMapIds().has(m.id||m.name));
    matchState.usedModeGroups=matchState.usedModeGroups||[];if(!matchState.usedModeGroups.includes(map.modeGroup))matchState.usedModeGroups.push(map.modeGroup);
    matchState.pregamePhase='roster';matchState.currentBans=null;matchState.currentTactics=null;
    matchState.logs.push({map:`M${matchState.mapIndex+1}`,side:'event',text:`${side==='home'?matchState.homeTeam.name:matchState.awayTeam.name} 获得选图权，选择「${map.name}」（${map.type}）。双方现在确认本图阵容。`});
    if(rerender)renderMatch();
  };

  const _v71EnsureMapBase=ensureCurrentMapSelected;
  ensureCurrentMapSelected=function(autoPlayer=false){
    if(!v71HasStrategicDraft())return _v71EnsureMapBase(autoPlayer);if(currentMatchMap())return true;
    if(matchState.mapPicker==='away'||autoPlayer){commitSeriesMap(v71AutoChooseMap(matchState.mapPicker),matchState.mapPicker,false);return true;}return false;
  };

  function v71MapLineupSummary(side,map){
    const roster=side==='home'?matchState.homeRoster:matchState.awayRoster,team=side==='home'?matchState.homeTeam:matchState.awayTeam;
    const scores=roster.map(p=>{const h=v71BestHeroFor(p,map,[]);return{p,h,score:(h?.mapScore||75)+(p.overall||80)*.25}}).sort((a,b)=>b.score-a.score);
    const user=roster.find(p=>p.isUser),userHero=user?v71BestHeroFor(user,map,[]):null;
    const userRisk=userHero&&userHero.value<74?' · 你的英雄池在本图存在明显轮换风险':userHero?' · 你的本图首选英雄：'+userHero.name:' ';
    return `${team.name}确认首发5人${userRisk}`;
  }
  function v71ConfirmRosters(){
    const map=currentMatchMap();if(!map)return;
    matchState.lineupNotes={home:v71MapLineupSummary('home',map),away:v71MapLineupSummary('away',map)};matchState.pregamePhase='ban';
    matchState.logs.push({map:`M${matchState.mapIndex+1}`,side:'event',text:`阵容确认：${matchState.lineupNotes.home}；${matchState.lineupNotes.away}。阵容锁定后进入英雄禁用。`});renderMatch();
  }
  function v71HeroBanValue(hero,targetRoster,map){
    const relevant=targetRoster.filter(p=>v71RoleGroup(p.role)===hero.group);let best=0;
    relevant.forEach(p=>{const hp=v71HeroPool(p).find(x=>x.name===hero.name);if(!hp)return;const alt=v71HeroPool(p).filter(x=>x.name!==hero.name).slice(0,3)[0];const drop=Math.max(0,hp.value-(alt?.value||68));best=Math.max(best,hp.value*1.15+drop*2.2+v71HeroMapBonus(hero,map)*3+(p.isUser?4:0));});return best;
  }
  function v71PickBan(bySide,targetSide,map,blockedGroup=null){
    const history=new Set(matchState.banHistory?.[bySide]||[]),locked=new Set(matchState.lockedBanHeroes||[]),target=targetSide==='home'?matchState.homeRoster:matchState.awayRoster;
    const candidates=v71AvailableHeroes().filter(h=>!history.has(h.name)&&!locked.has(h.name)&&(!blockedGroup||h.group!==blockedGroup));
    return [...candidates].sort((a,b)=>v71HeroBanValue(b,target,map)-v71HeroBanValue(a,target,map))[0]||null;
  }
  function v71ResolveBans(){
    const map=currentMatchMap();if(!map)return;
    matchState.banHistory=matchState.banHistory||{home:[],away:[]};
    // 地图选择方先交ban；另一方必须换职责。
    const first=matchState.mapPicker||'home',second=first==='home'?'away':'home';
    const firstHero=v71PickBan(first,second,map,null),secondHero=v71PickBan(second,first,map,firstHero?.group||null);
    const bans={home:null,away:null};if(firstHero)bans[first]=firstHero.name;if(secondHero)bans[second]=secondHero.name;matchState.currentBans=bans;
    [['home',bans.home],['away',bans.away]].forEach(([side,name])=>{if(!name)return;matchState.banHistory[side].push(name);const other=side==='home'?'away':'home';if(matchState.banHistory[other].includes(name)&&!matchState.lockedBanHeroes.includes(name))matchState.lockedBanHeroes.push(name);});
    matchState.pregamePhase='ready';matchState.currentTactics=null;
    matchState.logs.push({map:`M${matchState.mapIndex+1}`,side:'event',text:`英雄禁用完成：${matchState.homeTeam.name} 禁用「${bans.home||'—'}」；${matchState.awayTeam.name} 禁用「${bans.away||'—'}」。现在才真正开图。`});renderMatch();
  }
  function v71AutoResolvePregame(){
    if(!v71HasStrategicDraft())return true;if(!ensureCurrentMapSelected(true))return false;
    if(matchState.pregamePhase==='roster')v71ConfirmRosters();if(matchState.pregamePhase==='ban')v71ResolveBans();return matchState.pregamePhase==='ready';
  }

  const _v71AdvanceMapBase=advanceSeriesMapAfterResult;
  advanceSeriesMapAfterResult=function(winner){
    if(!v71HasStrategicDraft())return _v71AdvanceMapBase(winner);
    matchState.mapPicker=winner==='home'?'away':'home';matchState.mapIndex++;matchState.currentTactics=null;matchState.currentBans=null;matchState.pregamePhase='map';
    ensureCurrentMapSelected(false);
  };

  const _v71RenderMapControlBase=renderMapControl;
  renderMapControl=function(){
    if(!v71HasStrategicDraft())return _v71RenderMapControlBase();
    const area=document.getElementById('mapControlArea');if(matchState.finished)return _v71RenderMapControlBase();
    const map=currentMatchMap();
    if(!map){
      if(matchState.mapPicker==='away'){ensureCurrentMapSelected(true);return renderMapControl();}
      const groups=v71EligibleModeGroups(),options=v71EligibleMaps().map(item=>`<button class="map-pick-option" data-v71-map="${item.id}"><strong>${item.name} · ${item.type}</strong><span>${item.tags.join(' · ')}</span></button>`).join('');
      area.innerHTML=`<div class="map-header"><div><div class="map-kicker">MAP ${matchState.mapIndex+1} · 第1层博弈</div><h3 class="map-title">地图选择</h3></div><div class="map-count"><span>本轮可选模式</span><strong>${groups.map(v71ModeLabel).join(' / ')}</strong></div></div><div class="map-pick-panel"><div class="map-pick-head"><strong>选择本图</strong><span>${matchState.mapIndex===0?'首图限定控制模式':'上一图败者选图；未用模式优先，全部用完后重置模式池'}</span></div><div class="map-pick-grid">${options}</div><div class="map-picker-note">具体地图整场不重复；闪点与攻防阵线共享一个模式组。</div></div>`;
      area.querySelectorAll('[data-v71-map]').forEach(btn=>btn.addEventListener('click',()=>commitSeriesMap(V71_MAP_CATALOG.find(m=>m.id===btn.dataset.v71Map),'home',true)));return;
    }
    if(matchState.pregamePhase==='roster'){
      const user=matchState.homeRoster.find(p=>p.isUser),best=user?v71BestHeroFor(user,map,[]):null,breadth=user?v71HeroPoolBreadth(user):0;
      area.innerHTML=`<div class="map-header"><div><div class="map-kicker">MAP ${matchState.mapIndex+1} · 第2层博弈</div><h3 class="map-title">${map.name} · 阵容确认</h3><div class="map-tags"><span class="map-tag">${map.type}</span>${map.tags.map(t=>`<span class="map-tag">${t}</span>`).join('')}</div></div><div class="map-count"><span>你的本图首选</span><strong>${best?`${best.name} ${best.value}`:'—'}</strong></div></div><div class="v71-pregame"><p>地图已经公开。双方现在可以根据地图决定是否换人；阵容提交后，本图不能再换人，然后对手才会看到这5个人并进行英雄禁用。</p><div class="v71-pregame-grid"><div><span>你的英雄池宽度</span><strong>${breadth}</strong></div><div><span>当前首选熟练</span><strong>${best?.label||'—'}</strong></div><div><span>换人规则</span><strong>仅地图之间</strong></div></div><button class="primary-btn" id="v71ConfirmRosterBtn">确认双方阵容 → Hero Ban</button></div>`;
      document.getElementById('v71ConfirmRosterBtn')?.addEventListener('click',v71ConfirmRosters);return;
    }
    if(matchState.pregamePhase==='ban'){
      area.innerHTML=`<div class="map-header"><div><div class="map-kicker">MAP ${matchState.mapIndex+1} · 第3层博弈</div><h3 class="map-title">英雄禁用</h3></div><div class="map-count"><span>规则</span><strong>每队1Ban</strong></div></div><div class="v71-pregame"><p>${matchState.lineupNotes.home}<br>${matchState.lineupNotes.away}</p><p>根据<strong>已确定的地图 + 5人阵容</strong>进行禁用；同图两队不能 Ban 同一职责。</p><button class="primary-btn" id="v71ResolveBanBtn">提交英雄禁用 → 开图</button></div>`;
      document.getElementById('v71ResolveBanBtn')?.addEventListener('click',v71ResolveBans);return;
    }
    if(matchState.pregamePhase==='ready'){
      const bans=matchState.currentBans||{};_v71RenderMapControlBase();
      const host=document.getElementById('mapControlArea');if(host){const box=document.createElement('div');box.className='v71-ban-summary';box.innerHTML=`<span>🚫 本图Hero Bans</span><strong>${matchState.homeTeam.name}：${bans.home||'—'}　/　${matchState.awayTeam.name}：${bans.away||'—'}</strong>`;host.prepend(box);}return;
    }
    return _v71RenderMapControlBase();
  };

  const _v71StartInteractiveBase=startInteractiveMap;
  startInteractiveMap=function(){if(v71HasStrategicDraft()&&!v71AutoResolvePregame()){renderMatch();return;}_v71StartInteractiveBase();};
  const _v71SimMapBase=simulateMap;
  simulateMap=function(){if(v71HasStrategicDraft())v71AutoResolvePregame();return _v71SimMapBase();};
  const _v71FullSeriesBase=simulateFullSeries;
  simulateFullSeries=function(){
    if(!v71HasStrategicDraft())return _v71FullSeriesBase();if(matchState.simulating||matchState.finished||matchState.mapSession)return;matchState.simulating=true;
    while(!matchState.finished){v71AutoResolvePregame();const result=_v71SimMapBase();matchState.results.push(result);if(result.winner==='home')matchState.homeScore++;else matchState.awayScore++;result.logs.forEach(l=>matchState.logs.push(l));if(matchState.homeScore>=matchState.targetWins||matchState.awayScore>=matchState.targetWins)matchState.finished=true;else advanceSeriesMapAfterResult(result.winner);}matchState.simulating=false;renderMatch();
  };

  // 常规赛详细模式从2025开始同样走完整三重博弈，不只给季后赛开特权。
  const _v71OpenNextSeasonBase=openNextSeasonMatch;
  openNextSeasonMatch=function(){
    if(v71Year()<2025||!gameSettings.matchDetailsEnabled)return _v71OpenNextSeasonBase();
    if(seasonState.eventDue){openScheduledSeasonEvent();return;}if(careerState.illnessRestGames>0){simulateIllnessRestRegularMatch(false);return;}if(shouldTriggerInjuryInquiry('regular')){openInjuryInquiry('regular');return;}if(seasonState.played>=seasonState.total||seasonState.simulating||seasonState.currentEvent)return;
    const opponent=seasonState.opponents[seasonState.played],venue=regularVenueAt(seasonState.played);matchState.context='regular';matchState.homeTeam=careerState.team;
    setupMatch(false,3,{playerVenue:venue,mapSelectionEnabled:true,firstMapPicker:venue==='home'?'home':'away'});matchState.awayTeam=opponent;matchState.awayRoster=createRoster(opponent,false);applyCareerMatchModifiers(matchState.homeRoster);
    matchState.logs=[{map:'赛前',side:'event',text:`常规赛第 ${seasonState.played+1} 场：${careerState.team.name} vs ${opponent.name}。`}];seasonState.pendingManualIndex=seasonState.played;seasonState.manualRecorded=false;
    document.getElementById('matchKicker').textContent='Regular Season · Map Draft + Hero Bans';document.getElementById('matchTitle').textContent=`常规赛第 ${seasonState.played+1} 场`;document.getElementById('matchDesc').textContent='地图 → 阵容 → Hero Ban';document.getElementById('matchWeekText').textContent=`第 ${seasonState.played+1} 轮 · ${venue==='home'?'主场':'客场'}`;renderMatch();showScreen('match');
  };

  // 2025+季后赛描述同步，不再显示旧版“败者随便选剩余地图”的简化文案。
  const _v71OpenPlayoffBase=openNextPlayoffMatch;
  openNextPlayoffMatch=function(mode='quick'){
    _v71OpenPlayoffBase(mode);if(mode==='detail'&&v71HasStrategicDraft()&&matchState.context==='playoff'&&matchState.homeTeam){matchState.pregamePhase=currentMatchMap()?'roster':'map';matchState.usedModeGroups=[];matchState.banHistory={home:[],away:[]};matchState.lockedBanHeroes=[];matchState.currentBans=null;matchState.availableMaps=v71MapPoolForMatch();document.getElementById('matchDesc').textContent=(matchState.targetWins===4?'总决赛FT4。':'本轮FT3。')+' 竞技流程：选图 → 确认换人 → Hero Ban → 开图；模式池用尽后重置，具体地图不重复。';renderMatch();}
  };

  // ---------- 2024+合同：1~4年 ----------
  const _v71GenerateOffersBase=generateContractOffers;
  generateContractOffers=function(){
    _v71GenerateOffersBase();if(v71Year()+1<2024)return;const ovr=Number(getMyOvr()==='--'?78:getMyOvr()),age=careerState.age||18;
    (offseasonState.offers||[]).forEach((offer,i)=>{const elite=ovr>=90&&age<=23,core=ovr>=85&&age<=25;const r=v71Hash01(`${offer.team.short}|${v71Year()}|${i}|contract`);offer.years=elite?(r<.58?4:3):core?(r<.32?4:r<.72?3:2):(r<.18?3:r<.62?2:1);offer.years=clamp(offer.years,1,4);});
  };

  // ---------- 2024+年度奖项：中文名 + MIP；移除“社区之星”的伪奖名 ----------
  function v71HawelkaScore(p){
    // RC23：Dennis Hawelka奖不再近似“人气奖”。玩家与AI都需要团队精神 / 职业风范。
    // AI没有长期关系状态，因此使用年度稳定的隐藏职业风范与团队口碑，避免玩家天然垄断。
    const year=v71Year();
    if(p.isUser){
      const recent=(careerState.careerArchive||[]).slice(-3).filter(r=>(r.honors||[]).some(h=>normalizeHonorName(h)==='Dennis Hawelka奖')).length;
      return Number(p.popularity||0)*.24+Number(careerState.teammateBond||50)*.34+Number(careerState.coachTrust||50)*.28+Number(p.rating||0)*1.55+Number(p.wins||0)*.07-recent*9;
    }
    const professionalism=52+v71Hash01(`${year}|${p.name}|hawelka-pro`)*46;
    const teamSpirit=50+v71Hash01(`${year}|${p.name}|hawelka-team`)*48;
    return Number(p.popularity||0)*.28+professionalism*.34+teamSpirit*.28+Number(p.rating||0)*1.45+Number(p.wins||0)*.07;
  }
  const _v71EnsureAwardsBase=ensureRegularSeasonAwards;
  ensureRegularSeasonAwards=function(){
    if(!v71IsOwl2())return _v71EnsureAwardsBase();const cached=seasonState.awards;if(cached?.v71&&Number(cached.generatedYear)===v71Year()&&cached.mvp?.winner&&cached.rookie?.winner&&cached.mip?.winner&&cached.hawelka?.winner&&['tank','damage','support'].every(g=>cached.roleStars?.[g]?.winners?.length))return cached;
    const pool=buildRegularAwardLeaguePool();
    const mvp=rankAwardCandidates(pool,p=>p.rating*10+p.ovr*.16+p.wins*.50);
    const rookiePool=pool.filter(p=>p.rookie),rookie=rankAwardCandidates(rookiePool.length?rookiePool:pool.slice(0,1),p=>p.rating*10+p.ovr*.15+p.wins*.4);rookie.userEligible=careerState.careerYears===1;if(!rookie.userEligible)rookie.userRank=null;
    const hawelka=rankAwardCandidates(pool,v71HawelkaScore);
    const groupRows={tank:pool.filter(p=>v71RoleGroup(p.role)==='tank'),damage:pool.filter(p=>v71RoleGroup(p.role)==='damage'),support:pool.filter(p=>v71RoleGroup(p.role)==='support')};
    const roleStars={};Object.entries(groupRows).forEach(([g,list])=>{const ranked=list.map(p=>({...p,awardScore:p.rating*9+p.ovr*.20+p.wins*.28+p.roleQuality*.08+randomCentered(.5)})).sort((a,b)=>b.awardScore-a.awardScore),count=g==='tank'?3:4,userIndex=ranked.findIndex(p=>p.isUser);roleStars[g]={winners:ranked.slice(0,count),userRank:userIndex>=0?userIndex+1:null};});
    const prev=careerState.careerArchive?.[careerState.careerArchive.length-1],userPrev=prev?.ovr||Number(getMyOvr()==='--'?78:getMyOvr())-1;
    const mipPool=pool.filter(p=>!p.rookie).map(p=>({...p,improvement:p.isUser?(p.ovr-userPrev):Math.round((v71Hash01(`${p.name}|mip|${v71Year()}`)*12)-3)})),mipCandidates=mipPool.length?mipPool:pool.map(p=>({...p,improvement:0}));
    const mip=rankAwardCandidates(mipCandidates,p=>p.improvement*8+p.rating*2+p.ovr*.04);mip.userEligible=careerState.careerYears>1;if(!mip.userEligible)mip.userRank=null;
    seasonState.awards={mvp,rookie,community:hawelka,hawelka,roleStars,mip,generatedYear:v71Year(),v71:true};return seasonState.awards;
  };
  const _v71RenderAwardsBase=renderRegularSeasonAwards;
  renderRegularSeasonAwards=function(){
    if(!v71IsOwl2())return _v71RenderAwardsBase();const a=ensureRegularSeasonAwards();document.getElementById('awardsSeasonChip').textContent=`🏆 ${v71Year()} 赛季`;
    const roleLabel={tank:'坦克',damage:'输出',support:'支援'},rows=['tank','damage','support'].map(g=>{const r=a.roleStars[g],names=r.winners.map(x=>x.name).join(' · '),my=v71RoleGroup(state.role)===g;return `<div class="award-role-row ${my?'mine':''}"><div class="award-role-label">${g==='tank'?'🛡️':g==='damage'?'🎯':'💉'} ${roleLabel[g]}</div><div class="award-role-winner"><strong>${names}</strong><span>${g==='tank'?'3名':'4名'}年度职责之星</span></div><div class="award-role-rank">${my?`你的排名<br><strong>${awardRankText(r.userRank,true)}</strong>`:'年度职责之星'}</div></div>`}).join('');
    els.regularAwardsContent.innerHTML=`${awardSpotlightCard('👑','常规赛最有价值选手','全年常规赛与Major阶段综合表现',a.mvp,true)}<article class="award-card"><div class="award-card-head"><h3>🌟 年度职责之星</h3><span>坦克3人 · 输出4人 · 支援4人</span></div><div class="award-role-list">${rows}</div></article>${awardSpotlightCard('🌱','Alarm年度最佳新秀奖','首个OWL赛季限定',a.rookie,a.rookie.userEligible)}${awardSpotlightCard('📈','年度进步最快选手','新秀不参与，比较上一完整赛季',a.mip,a.mip.userEligible)}${awardSpotlightCard('❤️','Dennis Hawelka奖','团队精神、公众影响与职业风范',a.hawelka,true)}`;
    const rank=estimateSeasonRank();els.awardsContinueBtn.textContent=rank<=8?(playoffState.active?'🏆 返回季后赛':'🏆 进入季后赛'):'📊 进入赛季结算';
  };

  // 生涯荣誉中文化；娱乐赛奖项未来接入时只走Popularity，不进历史地位权重。
  HONOR_ICONS['常规赛最有价值选手']='👑';HONOR_ICONS['年度职责之星']='🌟';HONOR_ICONS['Alarm年度最佳新秀奖']='🌱';HONOR_ICONS['年度进步最快选手']='📈';HONOR_ICONS['Dennis Hawelka奖']='❤️';HONOR_ICONS['狙王']='🎯';HONOR_ICONS['全能王']='🎲';
  const _v71DeriveHonorsBase=deriveSeasonHonors;
  deriveSeasonHonors=function(record,index){
    if(!v71IsOwl2())return _v71DeriveHonorsBase(record,index);const h=[],a=ensureRegularSeasonAwards();if(a.mvp.userRank===1)h.push('常规赛最有价值选手');const g=v71RoleGroup(state.role);if(a.roleStars[g]?.userRank&&a.roleStars[g].userRank<=(g==='tank'?3:4))h.push('年度职责之星');if(a.hawelka.userRank===1)h.push('Dennis Hawelka奖');if(a.mip.userEligible&&a.mip.userRank===1)h.push('年度进步最快选手');if(a.rookie.userEligible&&a.rookie.userRank===1)h.push('Alarm年度最佳新秀奖');if(record.result==='总冠军')h.push('总冠军');if(record.result==='总冠军'&&playoffState.fmvp?.isUser)h.push('总决赛最有价值选手');return[...new Set(h)];
  };

  // ---------- 赛季规则弹窗 ----------
  function v71MaybeShowSeasonIntro(){
    // 2025是竞技流程真正发生变化的一年：只在第一次进入2025赛季时自动说明。
    // 2026+规则不再年年复读；玩家可通过常规赛顶部“规则说明”随时查看。
    if(!v71IsOwl2()||v71Year()!==2025||careerState.v13RuleIntroSeen2025)return;
    careerState.v13RuleIntroSeen2025=true;seasonState.v71IntroYear=2025;const overlay=document.getElementById('seasonEventOverlay'),holder=document.getElementById('seasonEventContent');if(!overlay||!holder)return;
    const draft=v71StrategicEra()?'<li><strong>2025竞技升级：</strong>地图选择 → 阵容确认/换人 → 英雄禁用 → 开图。</li><li>闪点与攻防阵线共享地图模式组；模式池用尽后重置，具体地图整场不重复。</li>':'<li>当前年份不启用Hero Bans与Map Voting，比赛内规则保持传统版本。</li>';
    holder.innerHTML=`<div class="season-event-top"><span class="season-event-kicker">OWL ${v71Year()} · SEASON RULEBOOK</span><span class="season-event-round">赛季规则</span></div><h2 class="season-event-title">${v71Year()===2024?'OWL 2.0 正式启动':'OWL 2.0 · 竞技规则更新'}</h2><div class="season-event-copy"><ul><li>20队分东/西部；56场常规赛：同区4次、跨区2次。</li><li>Stage 1/2/3：19 / 18 / 19场，每阶段结束举办8队Major。</li><li>Major Champion Slot动态分配：基础4:4，上届冠军赛区下一届5:3。</li>${draft}</ul></div><div class="season-event-choices"><button class="season-event-choice" id="v71CloseIntro"><div><strong>开始赛季 →</strong></div></button></div>`;
    document.getElementById('v71CloseIntro')?.addEventListener('click',()=>overlay.classList.add('hidden'));overlay.classList.remove('hidden');
  }



  // ---------- 2024+ ALL-STAR WEEKEND ----------
  function v71AllStarScore(p){return Number(p.rating||6.5)*10+Number(p.ovr||78)*.13+Number(p.popularity||40)*.18+Number(p.wins||0)*.16;}
  function v71AllStarConferenceForProfile(p){const t=TEAMS.find(x=>x.name===p.team);return t?v71Conference(t):null;}
  function v71AllStarEventNames(r){
    if(!r?.selected)return [];
    const out=[`全明星正赛（${r.starter?'原定首发':'替补'}）`];
    if(r.risingEligible)out.push('新星赛');
    if(r.sniperEntered)out.push('狙王挑战');
    if(r.allRoundEntered)out.push('全能王');
    return out;
  }
  function v71AttendAllStar(r){
    if(!r||r.participation==='attend')return r;r.participation='attend';careerState.allStarDeclineStreak=0;
    if(!r.popApplied){careerState.popularity=clamp(Number(careerState.popularity||0)+Number(r.popGain||0),0,100);r.popApplied=true;}
    return r;
  }
  function v71WithdrawAllStar(r){
    if(!r||r.participation==='decline')return r;const streak=Number(careerState.allStarDeclineStreak||0)+1;careerState.allStarDeclineStreak=streak;
    const popLoss=Math.min(25,8+(streak-1)*5);careerState.popularity=clamp(Number(careerState.popularity||0)-popLoss,0,100);careerState.condition=clamp(Number(careerState.condition||70)+5,0,100);
    r.participation='decline';r.withdrawPenalty={streak,popLoss,conditionGain:5};r.popApplied=true;return r;
  }
  window.__OWL_ALLSTAR_DECISION={attend:v71AttendAllStar,withdraw:v71WithdrawAllStar,eventNames:v71AllStarEventNames};
  function v71BuildAllStarResult(){
    if(seasonState.v71AllStar?.year===v71Year())return seasonState.v71AllStar;
    const pool=buildRegularAwardLeaguePool(),me=pool.find(p=>p.isUser)||getSeasonUserAwardProfile(),myConf=v71Conference(careerState.team),group=v71RoleGroup(state.role);
    const confPool=pool.filter(p=>v71AllStarConferenceForProfile(p)===myConf&&v71RoleGroup(p.role)===group).sort((a,b)=>v71AllStarScore(b)-v71AllStarScore(a));
    const slots=group==='tank'?2:4,userRank=Math.max(1,confPool.findIndex(p=>p.isUser)+1),selected=userRank<=slots;
    const starterSlots=group==='tank'?1:2;
    const fanPool=[...confPool].sort((a,b)=>(Number(b.popularity||0)*.55+v71AllStarScore(b)*.45)-(Number(a.popularity||0)*.55+v71AllStarScore(a)*.45));
    const fanRank=Math.max(1,fanPool.findIndex(p=>p.isUser)+1),starter=selected&&fanRank<=starterSlots;
    const confPower=conf=>{const ps=pool.filter(p=>v71AllStarConferenceForProfile(p)===conf).sort((a,b)=>v71AllStarScore(b)-v71AllStarScore(a)).slice(0,10);return ps.length?ps.reduce((n,p)=>n+v71AllStarScore(p),0)/ps.length:80;};
    const east=confPower('East'),west=confPower('West'),eastChance=clamp(.5+(east-west)*.012,.35,.65),winner=Math.random()<eastChance?'East':'West';
    const hp=v71HeroPool({...createCareerPlayer(),isUser:true}),widow=hp.find(h=>h.name==='黑百合'),breadth=hp.filter(h=>h.value>=78).length;
    const sniperEligible=selected&&group==='damage'&&Number(widow?.value||0)>=78,sniperEntered=sniperEligible&&Math.random()<clamp(.35+(Number(widow?.value||78)-78)*.025,.35,.78),sniperWin=sniperEntered&&Math.random()<clamp(.10+(Number(widow?.value||78)-78)*.018+(starter?.04:0),.10,.48);
    const allRoundEligible=selected&&breadth>=4,allRoundEntered=allRoundEligible&&Math.random()<clamp(.30+breadth*.045,.42,.82),allRoundWin=allRoundEntered&&Math.random()<clamp(.08+(breadth-4)*.025+(getMyOvr()-80)*.008,.08,.42);
    const risingEligible=careerState.careerYears<=2,risingMvp=selected&&risingEligible&&Math.random()<clamp(.12+(getMyOvr()-78)*.012,.10,.38);
    const allStarMvp=selected&&winner===myConf&&Math.random()<clamp(.08+(getMyOvr()-80)*.010+(starter?.07:0),.08,.34);
    const result={year:v71Year(),conference:myConf,selected,starter,userRank,fanRank,winner,sniperEntered,sniperWin,allRoundEntered,allRoundWin,risingEligible,risingMvp,allStarMvp,breadth,widow:Number(widow?.value||0),participation:selected?null:'not-selected',popApplied:false};
    seasonState.v71AllStar=result;seasonState.v71AllStarDraftPriority=winner;
    let pop=0;if(selected)pop+=4;if(starter)pop+=2;if(winner===myConf&&selected)pop+=1;if(sniperWin)pop+=8;if(allRoundWin)pop+=8;if(risingMvp)pop+=5;if(allStarMvp)pop+=6;result.popGain=pop;
    return result;
  }
  function v71OpenAllStarWeekend(){
    if(!v71IsOwl2())return;const r=v71BuildAllStarResult(),overlay=document.getElementById('seasonEventOverlay'),holder=document.getElementById('seasonEventContent');if(!overlay||!holder){seasonState.v71AllStarPending=false;renderSeason();return;}
    const selection=r.selected?(r.starter?'⭐ 全明星首发':'⭐ 全明星替补'):'未入选全明星正赛';
    const closeAllStar=()=>{overlay.classList.add('hidden');seasonState.v71AllStarPending=false;const resume=!!seasonState.v71ResumeWholeAfterAllStar;seasonState.v71ResumeWholeAfterAllStar=false;seasonState.v71LastMajorSummary=null;renderSeason();if(resume)window.__OWL_RUNTIME?.simulation?.resumeWhole?.(180);};
    if(r.selected&&!r.participation){
      const events=v71AllStarEventNames(r);
      holder.innerHTML=`<div class="season-event-top"><span class="season-event-kicker">ALL-STAR INVITATION · 参赛决定</span><span class="season-event-round">Major 2 后</span></div><div class="season-event-icon">⭐</div><h2 class="season-event-title">${v71Year()} OWL 全明星周末邀请</h2><div class="season-event-copy"><p>你已经入选今年的全明星。先决定去不去，再看比赛结果——总不能奖杯都发完了才问选手有没有上飞机。</p><div class="v71-pregame-grid"><div><span>你的身份</span><strong>${selection}</strong></div><div><span>本届安排</span><strong>${events.length} 个项目</strong></div><div><span>赛事性质</span><strong>表演赛 · 不影响联赛排名</strong></div></div><p><strong>你将参加：</strong><br>${events.map(x=>`• ${x}`).join('<br>')}</p><p>退出全明星会降低公众关注，但不影响队友信任；同时减少赛程消耗，让本赛季状态更好。</p></div><div class="season-event-choices"><button class="season-event-choice" id="v71AttendAllStar"><div><strong>参加今年全明星 →</strong><p>按当前项目安排出赛。</p></div></button><button class="season-event-choice danger" id="v71WithdrawAllStar"><div><strong>退出今年全明星</strong><p>公众关注下降 · 本赛季状态提升。</p></div></button></div>`;
      document.getElementById('v71AttendAllStar')?.addEventListener('click',()=>{v71AttendAllStar(r);v71OpenAllStarWeekend();});
      document.getElementById('v71WithdrawAllStar')?.addEventListener('click',()=>{v71WithdrawAllStar(r);v71OpenAllStarWeekend();});overlay.classList.remove('hidden');return;
    }
    if(r.participation==='decline'){
      const p=r.withdrawPenalty||{};holder.innerHTML=`<div class="season-event-top"><span class="season-event-kicker">ALL-STAR · WITHDRAWN</span><span class="season-event-round">Major 2 后</span></div><div class="season-event-icon">⭐</div><h2 class="season-event-title">你退出了 ${v71Year()} OWL 全明星周末</h2><div class="season-event-copy"><p>全明星席位仍记录为“入选”，但你没有实际参加正赛与娱乐项目，因此不会获得首发/MVP/狙王/全能王等参赛结果。</p><div class="v71-pregame-grid"><div><span>公众关注</span><strong>-${p.popLoss||0}</strong></div><div><span>本赛季状态</span><strong>+${p.conditionGain||0}</strong></div><div><span>连续退出</span><strong>第 ${p.streak||1} 次</strong></div></div></div><div class="season-event-choices"><button class="season-event-choice" id="v71CloseAllStar"><div><strong>进入 Stage 3 →</strong></div></button></div>`;document.getElementById('v71CloseAllStar')?.addEventListener('click',closeAllStar);overlay.classList.remove('hidden');return;
    }
    if(r.selected&&r.participation!=='attend')v71AttendAllStar(r);
    const skills=[r.risingEligible?`新星赛：${r.risingMvp?'🏆 新星赛最有价值选手':'参赛 / 未获MVP'}`:'新星赛：已超过二年级资格',`狙王：${r.sniperEntered?(r.sniperWin?'🏆 狙王':'参赛 / 未夺冠'):'未参赛'}`,`全能王：${r.allRoundEntered?(r.allRoundWin?'🏆 全能王':'参赛 / 未夺冠'):'未参赛'}`];
    holder.innerHTML=`<div class="season-event-top"><span class="season-event-kicker">TRADE DEADLINE → ALL-STAR WEEKEND</span><span class="season-event-round">Major 2 后</span></div><h2 class="season-event-title">⭐ ${v71Year()} OWL 全明星周末</h2><div class="season-event-copy"><div class="v71-pregame-grid"><div><span>你的全明星身份</span><strong>${selection}</strong></div><div><span>正赛结果</span><strong>${v71ConferenceZh(r.winner)}获胜${r.allStarMvp?' · 你获正赛MVP':''}</strong></div><div><span>Major 3奖励</span><strong>${v71ConferenceZh(r.winner)}获得首轮选对手优先权</strong></div></div><p><strong>你实际参加的项目：</strong><br>${v71AllStarEventNames(r).map(x=>`• ${x}`).join('<br>')}</p><p><strong>Day 1 · 娱乐夜</strong><br>${skills.join('<br>')}</p><p><strong>全能王规则：</strong>随机英雄1v1，英雄池越宽越占便宜；狙王/全能王只增加人气，不进入历史地位评分。</p></div><div class="season-event-choices"><button class="season-event-choice" id="v71CloseAllStar"><div><strong>进入 Stage 3 →</strong></div></button></div>`;
    document.getElementById('v71CloseAllStar')?.addEventListener('click',closeAllStar);overlay.classList.remove('hidden');
  }

  // All-Star正式履历：入选/首发/正赛MVP记入生涯；狙王/全能王只在当季事件记录和人气里存在。
  HONOR_ICONS['全明星首发']='⭐';HONOR_ICONS['全明星正赛最有价值选手']='🌟';HONOR_ICONS['新星赛最有价值选手']='🌱';
  const _v71AllStarHonorBase=deriveSeasonHonors;
  deriveSeasonHonors=function(record,index){
    const h=_v71AllStarHonorBase(record,index);if(!v71IsOwl2())return h;const r=seasonState.v71AllStar;if(!r)return h;
    if(r.selected&&!h.includes('全明星'))h.push('全明星');const attended=r.participation!=='decline';if(attended&&r.starter)h.push('全明星首发');if(attended&&r.allStarMvp)h.push('全明星正赛最有价值选手');if(attended&&r.risingMvp)h.push('新星赛最有价值选手');return[...new Set(h)];
  };

  // ---------- V7.1 稳定性补丁：56场模拟 / Stage3结算 / 全球前8 ----------
  // 旧兼容层仍有若干“28场赛季”的硬编码。2024+在最外层统一拦截，避免赛季打到一半突然收工。
  const _v71FastSeasonStepLegacy=fastSeasonStep;
  fastSeasonStep=function(){
    if(!v71IsOwl2())return _v71FastSeasonStepLegacy();
    if(seasonState.simulating && careerState.illnessRestGames>0){simulateIllnessRestRegularMatch(true);return;}
    if(seasonState.simulating && shouldTriggerInjuryInquiry('regular')){seasonState.simulating=false;injuryState.resumeFast=true;openInjuryInquiry('regular');return;}
    if(!seasonState.simulating||seasonState.played>=seasonState.total){seasonState.simulating=false;renderSeason();return;}
    v32SilentRegularGame();
    markStageBreakIfNeeded();
    document.getElementById('seasonSimNote').textContent=`第 ${seasonState.played} 场快速结算完成：${seasonState.results[seasonState.played-1]==='win'?'胜利':'失利'}。`;
    renderSeason();
    if(seasonState.stageBreakPending){seasonState.simulating=false;if(seasonState.timer)clearTimeout(seasonState.timer);seasonState.timer=null;return;}
    if(seasonState.eventDue){window.__OWL_RUNTIME?.simulation?.pauseFast?.();setTimeout(openScheduledSeasonEvent,180);return;}
    if(seasonState.played>=seasonState.total){seasonState.simulating=false;renderSeason();return;}
    seasonState.timer=setTimeout(fastSeasonStep,420);
  };

  const _v71WholeSeasonLegacy=v35SimulateWholeSeason;
  v35SimulateWholeSeason=function(){
    if(!v71IsOwl2())return _v71WholeSeasonLegacy();
    if(seasonState.simulating||seasonState.played>=seasonState.total)return;
    seasonState.simulating=true;
    if(seasonState.stageBreakPending){
      const s=seasonState.stageBreakPending;stageQualified(s)?simulateStagePlayoff(s):skipStageBreak(s);seasonState.stageBreakPending=null;
    }
    let guard=0;
    while(seasonState.played<seasonState.total&&guard++<80){
      v32SilentRegularGame();
      markStageBreakIfNeeded();
      if(seasonState.eventDue){
        window.__OWL_RUNTIME?.simulation?.pauseWhole?.();seasonState.resumeWholeAfterEvent=true;
        document.getElementById('seasonSimNote').textContent='模拟在关键事件处暂停。处理完事件后继续跑完56场。';
        renderSeason();setTimeout(openScheduledSeasonEvent,80);return;
      }
      if(seasonState.stageBreakPending){
        const st=seasonState.stageBreakPending;stageQualified(st)?simulateStagePlayoff(st):skipStageBreak(st);seasonState.stageBreakPending=null;
        if(st===2&&seasonState.v71AllStarPending){seasonState.simulating=false;seasonState.v71ResumeWholeAfterAllStar=true;renderSeason();setTimeout(v71OpenAllStarWeekend,90);return;}
      }
    }
    seasonState.simulating=false;seasonState.resumeWholeAfterEvent=false;
    document.getElementById('seasonSimNote').textContent=`✓ 已模拟完整常规赛：${seasonState.wins}胜${seasonState.losses}负；三届Major均按阶段节点同步结算。`;
    renderSeason();window.scrollTo({top:0,behavior:'smooth'});
  };

  // 任何旧逻辑提前触发年度奖项时，Stage 3 Major 尚未结算就先挡回赛季页。
  const _v71OpenAwardsLegacy=openRegularSeasonAwards;
  openRegularSeasonAwards=function(){
    if(v71IsOwl2()&&seasonState.stageBreakPending&&!seasonState.stageProcessed.includes(seasonState.stageBreakPending)){
      renderSeason();showScreen('season');return;
    }
    return _v71OpenAwardsLegacy();
  };

  // 2024+季后赛名单严格来自全年LP榜前8，不再使用旧版“玩家+随机7队”。
  const _v71SetupPlayoffsLegacy=setupPlayoffs;
  setupPlayoffs=function(){
    if(!v71IsOwl2())return _v71SetupPlayoffsLegacy();
    resetPlayoffState();
    const top8=syntheticFinalStandings().slice(0,8);
    const userIndex=top8.findIndex(r=>r.team.name===careerState.team?.name);
    if(userIndex<0){playoffState.active=false;return;}
    playoffState.active=true;playoffState.seed=userIndex+1;careerState.postseasonSeed=userIndex+1;
    playoffState.teams=top8.map(r=>r.team);
    playoffState.matches=PLAYOFF_MATCH_BLUEPRINT.map(item=>({...item,result:null}));
    syncDoubleElimBracket(null);renderPlayoffs();
  };

  // 最外层修正2024+赛季按钮状态和文案，覆盖历史兼容层的28场硬编码。
  const _v71RenderSeasonFinal=renderSeason;
  renderSeason=function(){
    _v71RenderSeasonFinal();
    if(!v71IsOwl2())return;
    const play=document.getElementById('playNextSeasonMatchBtn'),fast=document.getElementById('fastSimSeasonBtn'),full=document.getElementById('fullSimSeasonBtn');
    const locked=!!seasonState.stageBreakPending||seasonState.played>=seasonState.total;
    if(play){play.disabled=locked||seasonState.simulating;play.textContent=gameSettings.matchDetailsEnabled?'🎮 比赛详情':'⚡ 模拟单场';}
    if(fast){fast.disabled=!!seasonState.stageBreakPending||seasonState.played>=seasonState.total;fast.textContent=seasonState.simulating?'⏸ 暂停':'⏩ 模拟本赛段';}
    if(full){full.disabled=!!seasonState.stageBreakPending||seasonState.played>=seasonState.total||seasonState.simulating;full.textContent='🚀 模拟全部常规赛';}
    const next=seasonState.opponents?.[seasonState.played];
    if(next&&seasonState.played<seasonState.total){const venue=seasonState.venues?.[seasonState.played]==='home'?'主场':'客场';const n=document.getElementById('seasonNextOpponent');if(n)n.textContent=`下一场：${next.name} · ${seasonState.legs?.[seasonState.played]||''} · ${venue}`;}
    const majorContinue=document.getElementById('v71ContinueMajorBtn');
    if(majorContinue&&seasonState.v71LastMajorSummary?.stage===2&&seasonState.v71AllStarPending&&!majorContinue.dataset.allstarHook){majorContinue.dataset.allstarHook='1';majorContinue.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();seasonState.v71LastMajorSummary=null;v71OpenAllStarWeekend();},{capture:true,once:true});}
  };

  // 开发期只读诊断：方便以后继续拆模块时快速确认OWL 2.0骨架没被旧代码污染。
  window.__OWL_V71_DIAGNOSTICS=()=>{
    const conf={East:TEAMS.filter(t=>v71Conference(t)==='East').length,West:TEAMS.filter(t=>v71Conference(t)==='West').length};
    const me=careerState.team||TEAMS[0],same=TEAMS.filter(t=>t.name!==me.name&&v71Conference(t)===v71Conference(me)).length,cross=TEAMS.filter(t=>v71Conference(t)!==v71Conference(me)).length;
    return {version:'7.1',year:v71Year(),conferenceTeams:conf,expectedGames:same*4+cross*2,expectedHome:same*2+cross,stageLengths:[v71StageLength(1),v71StageLength(2),v71StageLength(3)],strategicDraft:v71StrategicEra(),heroCount:v71AvailableHeroes().length,mapCount:v71CompetitiveMaps().length};
  };

  // runtime CSS
  if(!document.getElementById('v71Owl2Style')){const st=document.createElement('style');st.id='v71Owl2Style';st.textContent=`.v71-hero-mini{display:flex;gap:4px;flex-wrap:wrap;margin-top:4px}.v71-hero-mini span{font-size:9px;color:var(--muted);border:1px solid var(--line);border-radius:8px;padding:1px 4px}.v71-hero-mini b{margin-left:3px;color:var(--ink)}.v71-pregame{padding:15px;border:1px solid var(--line);border-radius:16px;background:rgba(255,255,255,.42);line-height:1.65}.v71-pregame-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}.v71-pregame-grid>div{padding:9px;border-radius:12px;background:rgba(0,0,0,.035)}.v71-pregame-grid span{display:block;color:var(--muted);font-size:10px}.v71-pregame-grid strong{display:block;margin-top:3px}.v71-ban-summary{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:9px 12px;margin-bottom:10px;border:1px solid var(--line);border-radius:12px;background:#fff8ef;font-size:12px}.v71-ban-summary span{color:var(--muted)}html[data-theme="dark"] .v71-pregame,html[data-theme="dark"] .v71-ban-summary{background:rgba(255,255,255,.05)}@media(max-width:720px){.v71-pregame-grid{grid-template-columns:1fr}.v71-ban-summary{display:block}}`;document.head.appendChild(st);}
