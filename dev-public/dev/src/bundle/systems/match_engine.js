/* ===== BUNDLE MODULE: systems/match_engine.js ===== */
/* ==========================================================================
   MODULE: systems/match_engine.js
   Detailed match simulation, map logic, tactics and ratings
   Migrated from V6.2 lines 7748-8546; execution order is defined by manifest.json.
   ========================================================================== */
    // V7.1：比赛界面只展示正式地图名，不再把子地图/控制点名称当成主地图名。
    const MATCH_MAPS = [
      { id:'ilios', name:'伊利奥斯', type:'控制', modeGroup:'control', releaseYear:2016, tags:['开阔','侧翼','长距离'], fights:8 },
      { id:'kings_row', name:'国王大道', type:'混合', modeGroup:'hybrid', releaseYear:2016, tags:['高台','中距离','攻守转换'], fights:8 },
      { id:'rialto', name:'里阿尔托', type:'运载', modeGroup:'escort', releaseYear:2018, tags:['长距离','开阔','适合消耗'], fights:9 },
      { id:'dorado', name:'多拉多', type:'运载', modeGroup:'escort', releaseYear:2016, tags:['高台','中距离','攻守转换'], fights:8 },
      { id:'lijiang_tower', name:'漓江塔', type:'控制', modeGroup:'control', releaseYear:2016, tags:['狭窄','高节奏','强调抗压'], fights:7 },
      { id:'busan', name:'釜山', type:'控制', modeGroup:'control', releaseYear:2018, tags:['近距离','高节奏','适合突进'], fights:7 },
      { id:'havana', name:'哈瓦那', type:'运载', modeGroup:'escort', releaseYear:2019, tags:['长距离','高台','适合消耗'], fights:9 }
    ];

    const ROLE_WEIGHTS = {
      '坦克': { decision:.21, awareness:.17, cooldown:.16, survival:.13, synergy:.15, shotcalling:.10, mechanics:.08 },
      '长枪输出': { hitscan:.28, positioning:.18, mechanics:.14, awareness:.12, survival:.09, decision:.08, clutch:.11 },
      '弹道输出': { projectile:.26, mechanics:.19, cooldown:.13, decision:.11, synergy:.10, awareness:.10, pool:.11 },
      '输出支援': { cooldown:.20, hitscan:.15, positioning:.16, survival:.14, awareness:.14, decision:.09, synergy:.07, clutch:.05 },
      '战术支援': { shotcalling:.21, synergy:.20, awareness:.17, decision:.15, survival:.11, cooldown:.09, positioning:.07 }
    };

    const STYLES = {
      aggressive: { name:'激进出击', desc:'上限更高，失误时也死得更有节目效果', variance:2.5, personal:1.1 },
      steady: { name:'稳健执行', desc:'降低波动，优先保证站位和生存', variance:.8, personal:.4 },
      team: { name:'团队优先', desc:'强化协同与资源交换，个人数据稍朴素', variance:1.2, personal:.7 }
    };

    const TACTICS = ['突进','消耗','阵地'];
    const matchState = {
      homeTeam:null, awayTeam:null, homeRoster:[], awayRoster:[],
      mapIndex:0, homeScore:0, awayScore:0, results:[], logs:[],
      style:'steady', simulating:false, finished:false,
      ratings:{ home:{}, away:{} }, currentTactics:null,
      mapSession:null, context:'demo', targetWins:3,
      playerVenue:'neutral', mapSelectionEnabled:false, mapSequence:[], availableMaps:[], mapPicker:'home', playoffMatchId:null
    };

    function enterMatchDemo() {
      if (!state.role) state.role = '长枪输出';
      seasonState.active=false;
      matchState.context='demo';
      document.getElementById('matchKicker').textContent='Career Debut · Match Simulation V0.2';
      document.getElementById('matchTitle').textContent='职业生涯首秀';
      document.getElementById('matchDesc').textContent='比赛会在关键团战暂停。你需要亲自做决定，属性、风险与局势共同决定结果。';
      document.getElementById('matchWeekText').textContent='第 1 周';
      setupMatch(false);
      showScreen('match');
    }

    function setupMatch(forceOpponent, targetWins=3, options={}) {
      const oldHome = matchState.homeTeam;
      matchState.targetWins = targetWins;
      matchState.homeTeam = careerState.team || oldHome || pick(TEAMS);
      const opponentPool = TEAMS.filter(t => t.name !== matchState.homeTeam.name && (!forceOpponent || !matchState.awayTeam || t.name !== matchState.awayTeam.name));
      matchState.awayTeam = pick(opponentPool);
      matchState.homeRoster = careerState.team && careerState.starters.length ? careerState.starters.map(p => ({...p, attrs:{...p.attrs}})) : createRoster(matchState.homeTeam, true);
      matchState.awayRoster = createRoster(matchState.awayTeam, false);
      matchState.mapIndex = 0;
      matchState.playerVenue = options.playerVenue || 'neutral';
      matchState.mapSelectionEnabled = !!options.mapSelectionEnabled;
      matchState.mapSequence = matchState.mapSelectionEnabled ? [] : MATCH_MAPS.slice(0,targetWins*2-1);
      matchState.availableMaps = [...MATCH_MAPS];
      matchState.mapPicker = options.firstMapPicker || 'home';
      matchState.playoffMatchId = options.playoffMatchId || null;
      matchState.homeScore = 0;
      matchState.awayScore = 0;
      matchState.results = [];
      matchState.logs = [{ map:'赛前', side:'event', text:`${matchState.homeTeam.name} 对阵 ${matchState.awayTeam.name}。双方已提交首发名单。` }];
      matchState.style = 'steady';
      matchState.simulating = false;
      matchState.finished = false;
      matchState.ratings = { home:{}, away:{} };
      matchState.currentTactics = null;
      matchState.mapSession = null;
      renderMatch();
    }

    function createCareerPlayer() {
      const role = state.role || '长枪输出';
      const attrs = {};
      const bias = roleBias[role] || {};
      ATTRS.forEach(a => {
        attrs[a.key] = state.locked[a.key]?.value ?? clamp(78 + Math.round((bias[a.key] || 0) * .45) + rand(-3,3), 67, 91);
      });
      return {
        id:'career-player', name:getPlayerName(), role, attrs,
        overall:Math.round(Object.values(attrs).reduce((x,y)=>x+y,0)/ATTRS.length),
        color:matchState.homeTeam?.color || TEAMS[0].color, isUser:true
      };
    }

    function createRoster(team, includeUser) {
      const user = includeUser ? createCareerPlayer() : null;
      return ROLES.map((r,index) => {
        if (includeUser && r.name === user.role) return { ...user, color:team.color };
        const projectedRank=careerState.rank||10;
        const teamTalentAdjust=includeUser?clamp(Math.round((11-projectedRank)*.22),-1,2):0;
        const talent=includeUser?rand(76+teamTalentAdjust,88+teamTalentAdjust):rand(73,87);
        const attrs = generateMatchAttributes(r.name,talent);
        return {
          id:`${includeUser?'h':'a'}-${Date.now()}-${index}-${Math.random()}`,
          name:pick(NAMES.filter(n => n !== getPlayerName())),
          role:r.name,
          attrs,
          overall:Math.round(Object.values(attrs).reduce((x,y)=>x+y,0)/ATTRS.length),
          color:team.color,
          isUser:false
        };
      });
    }

    function generateMatchAttributes(role, talent) {
      const attrs = {};
      const bias = roleBias[role] || {};
      ATTRS.forEach(a => attrs[a.key] = clamp(talent + rand(-7,7) + Math.round((bias[a.key] || 0)*.65), 58,96));
      return attrs;
    }

    function roleEffective(player, map, styleKey, isUser) {
      const weights = ROLE_WEIGHTS[player.role];
      let score = 0;
      Object.entries(weights).forEach(([key,w]) => score += player.attrs[key] * w);
      let tagBonus = 0;
      const tags = map.tags.join('|');
      if (/长距离|开阔|高台/.test(tags)) tagBonus += ((player.attrs.hitscan + player.attrs.positioning + player.attrs.awareness)/3 - 78) * .045;
      if (/近距离|狭窄|混战/.test(tags)) tagBonus += ((player.attrs.projectile + player.attrs.mechanics + player.attrs.cooldown)/3 - 78) * .045;
      if (/决胜局|高节奏/.test(tags)) tagBonus += (player.attrs.clutch - 78) * .04;
      if (/侧翼|攻守转换/.test(tags)) tagBonus += (player.attrs.decision - 78) * .035;

      let variance = randomCentered(2.2);
      let styleBonus = 0;
      if (isUser) {
        const style = STYLES[styleKey];
        variance = randomCentered(style.variance);
        if (styleKey === 'aggressive') styleBonus = ((player.attrs.mechanics + player.attrs.clutch)/2 - 78) * .035 + .7;
        if (styleKey === 'steady') styleBonus = ((player.attrs.positioning + player.attrs.survival)/2 - 78) * .035 + .4;
        if (styleKey === 'team') styleBonus = ((player.attrs.synergy + player.attrs.decision)/2 - 78) * .04 + .5;
      }
      return score + tagBonus + styleBonus + variance;
    }

    function getTeamProfile(roster) {
      const avgAttr = key => roster.reduce((sum,p)=>sum+p.attrs[key],0)/roster.length;
      return {
        cohesion:(avgAttr('synergy')*.55 + avgAttr('awareness')*.2 + avgAttr('shotcalling')*.25),
        coaching:clamp(Math.round(74 + (avgAttr('decision')-74)*.30 + (avgAttr('shotcalling')-74)*.18),68,91),
        tactics:{
          '突进':avgAttr('mechanics')*.31 + avgAttr('synergy')*.35 + avgAttr('decision')*.20 + avgAttr('projectile')*.14,
          '消耗':avgAttr('hitscan')*.35 + avgAttr('positioning')*.30 + avgAttr('awareness')*.22 + avgAttr('survival')*.13,
          '阵地':avgAttr('survival')*.30 + avgAttr('cooldown')*.28 + avgAttr('decision')*.24 + avgAttr('shotcalling')*.18
        }
      };
    }

    function chooseTactic(roster, map) {
      const profile = getTeamProfile(roster);
      const bonus = { '突进':0, '消耗':0, '阵地':0 };
      const tags = map.tags.join('|');
      if (/近距离|狭窄|高节奏|侧翼/.test(tags)) bonus['突进'] += 3;
      if (/长距离|开阔|高台/.test(tags)) bonus['消耗'] += 3;
      if (/混战|推进|攻守转换/.test(tags)) bonus['阵地'] += 2;
      const chosen=TACTICS.map(t => ({ name:t, value:profile.tactics[t] + bonus[t] + randomCentered(1.5) })).sort((a,b)=>b.value-a.value)[0].name;
      const hook=window.__OWL_V20_ALPHA1?.chooseTactic;
      return typeof hook==='function' ? (hook(chosen,{roster,map,profile})||chosen) : chosen;
    }

    function tacticModifier(our, enemy) {
      const beats = { '突进':'消耗', '消耗':'阵地', '阵地':'突进' };
      if (beats[our] === enemy) return 2.2;
      if (beats[enemy] === our) return -2.2;
      return 0;
    }

    // 实力差先经过“优势区间”校准：10分以内只给正常优势，超过10分才逐步进入碾压区。
    function mapFightWinProbability(diff) {
      const value=Number(diff)||0, gap=Math.abs(value), direction=value<0?-1:1;
      const edge=gap<=10?gap*.015:.15+(gap-10)*.025;
      return clamp(.5+direction*edge,.12,.88);
    }
    window.__OWL_BALANCE=window.__OWL_BALANCE||{};
    window.__OWL_BALANCE.mapFightWinProbability=mapFightWinProbability;

    function teamMapPower(roster, map, tactic, enemyTactic, isHome) {
      const profile = getTeamProfile(roster);
      const individual = roster.map(p => roleEffective(p,map,matchState.style,isHome && p.isUser));
      const avg = individual.reduce((a,b)=>a+b,0)/individual.length;
      const tacticSkill = profile.tactics[tactic];
      const venueBonus=isHome?(matchState.playerVenue==='home'?1.0:0):(matchState.playerVenue==='away'?1.0:0);
      const power = avg*.73 + profile.cohesion*.11 + profile.coaching*.07 + tacticSkill*.09 + tacticModifier(tactic,enemyTactic) + venueBonus;
      const base={ power, individual, profile };
      const hook=window.__OWL_V20_ALPHA1?.adjustTeamMapPower;
      return typeof hook==='function' ? (hook(base,{roster,map,tactic,enemyTactic,isHome})||base) : base;
    }


    function teamDisplayPower(roster) {
      const profile = getTeamProfile(roster);
      const baseScores = roster.map(player => {
        const weights = ROLE_WEIGHTS[player.role];
        return Object.entries(weights).reduce((sum,[key,w]) => sum + player.attrs[key] * w, 0);
      });
      const avg = baseScores.reduce((a,b)=>a+b,0) / baseScores.length;
      const bestTactic = Math.max(...Object.values(profile.tactics));
      return avg*.76 + profile.cohesion*.11 + profile.coaching*.06 + bestTactic*.07;
    }

    function currentMatchMap() {
      return matchState.mapSequence[matchState.mapIndex] || (!matchState.mapSelectionEnabled ? MATCH_MAPS[Math.min(matchState.mapIndex,MATCH_MAPS.length-1)] : null);
    }

    function mapFitValue(roster,map) {
      const p=getTeamProfile(roster),tags=map.tags.join('|');
      let value=Math.max(...Object.values(p.tactics))*.45+p.cohesion*.20+p.coaching*.10;
      if(/近距离|狭窄|高节奏|侧翼/.test(tags))value+=p.tactics['突进']*.25;
      if(/长距离|开阔|高台/.test(tags))value+=p.tactics['消耗']*.25;
      if(/混战|推进|攻守转换/.test(tags))value+=p.tactics['阵地']*.22;
      return value;
    }

    function autoChooseMapForSide(side,available=matchState.availableMaps) {
      const roster=side==='home'?matchState.homeRoster:matchState.awayRoster;
      return [...available].sort((a,b)=>mapFitValue(roster,b)-mapFitValue(roster,a))[0] || MATCH_MAPS[0];
    }

    function commitSeriesMap(map,side=matchState.mapPicker,rerender=true) {
      if(!map)return;
      matchState.mapSequence[matchState.mapIndex]=map;
      matchState.availableMaps=matchState.availableMaps.filter(item=>item.name!==map.name);
      matchState.currentTactics=null;
      matchState.logs.push({map:`M${matchState.mapIndex+1}`,side:'event',text:`${side==='home'?matchState.homeTeam.name:matchState.awayTeam.name} 获得选图权，选择了「${map.name}」。`});
      if(rerender)renderMatch();
    }

    function ensureCurrentMapSelected(autoPlayer=false) {
      if(currentMatchMap())return true;
      if(!matchState.mapSelectionEnabled){matchState.mapSequence[matchState.mapIndex]=MATCH_MAPS[Math.min(matchState.mapIndex,MATCH_MAPS.length-1)];return true;}
      if(matchState.mapPicker==='away'||autoPlayer){commitSeriesMap(autoChooseMapForSide(matchState.mapPicker),matchState.mapPicker,false);return true;}
      return false;
    }

    function advanceSeriesMapAfterResult(winner) {
      matchState.mapPicker=winner==='home'?'away':'home'; // 败者选下一张地图
      matchState.mapIndex++;
      matchState.currentTactics=null;
      ensureCurrentMapSelected(false);
    }

    function renderMatch() {
      if (!matchState.homeTeam) return;
      ensureCurrentMapSelected(false);
      const map = currentMatchMap();
      if (!matchState.finished && map && !matchState.currentTactics) {
        matchState.currentTactics = { home:chooseTactic(matchState.homeRoster,map), away:chooseTactic(matchState.awayRoster,map) };
      }
      document.getElementById('homeTeamName').textContent = matchState.homeTeam.name;
      document.getElementById('awayTeamName').textContent = matchState.awayTeam.name;
      document.getElementById('homeLogo').textContent = matchState.homeTeam.short;
      document.getElementById('awayLogo').textContent = matchState.awayTeam.short;
      document.getElementById('homeLogo').style.background = matchState.homeTeam.color;
      document.getElementById('awayLogo').style.background = matchState.awayTeam.color;
      const homeLabel=document.getElementById('homeVenueLabel'),awayLabel=document.getElementById('awayVenueLabel');
      if(homeLabel)homeLabel.innerHTML=matchState.playerVenue==='home'?'<span class="venue-badge">主场 · 你的队伍</span>':matchState.playerVenue==='away'?'<span class="venue-badge away">客场 · 你的队伍</span>':'你的队伍';
      if(awayLabel)awayLabel.innerHTML=matchState.playerVenue==='home'?'<span class="venue-badge away">客场 · 对手</span>':matchState.playerVenue==='away'?'<span class="venue-badge">主场 · 对手</span>':'对手';
      document.getElementById('seriesTargetLabel').textContent = `FIRST TO ${matchState.targetWins}`;
      document.getElementById('homeSeriesScore').textContent = matchState.homeScore;
      document.getElementById('awaySeriesScore').textContent = matchState.awayScore;
      document.getElementById('mapTrack').innerHTML = Array.from({length:matchState.targetWins*2-1},(_,i) => {
        const r = matchState.results[i],m=matchState.mapSequence[i];
        return `<span class="map-dot ${r ? (r.winner==='home'?'home':'away') : ''} ${i===matchState.mapIndex && !matchState.finished?'current':''}" title="${m?.name||'待选地图'}"></span>`;
      }).join('');

      const currentTactics = matchState.currentTactics || { home:'—', away:'—' };
      document.getElementById('homePower').textContent = teamDisplayPower(matchState.homeRoster).toFixed(1);
      document.getElementById('awayPower').textContent = teamDisplayPower(matchState.awayRoster).toFixed(1);
      renderRosters();
      renderMapControl();
      renderLiveLog();
      renderRatings();
      try{ window.__OWL_V20_ALPHA1?.decorateDetailedMatch?.(); }catch(_){}
    }

    function renderRosters() {
      const row = (p, side) => {
        const averages = matchState.ratings[side][p.id] || [];
        const displayScore = averages.length ? (averages.reduce((a,b)=>a+b,0)/averages.length).toFixed(1) : p.overall;
        return `<div class="roster-player ${p.isUser?'you':''}">
          <div class="mini-avatar" style="background:${p.color}">${p.name.slice(0,2).toUpperCase()}</div>
          <div style="min-width:0"><div class="roster-name">${p.name}${p.isUser?'<span class="you-mark">你</span>':''}</div><div class="roster-role">${p.role}</div></div>
          <div class="roster-score">${displayScore}</div>
        </div>`;
      };
      document.getElementById('homeRoster').innerHTML = matchState.homeRoster.map(p=>row(p,'home')).join('');
      document.getElementById('awayRoster').innerHTML = matchState.awayRoster.map(p=>row(p,'away')).join('');
    }

    const KEY_EVENTS = {
      '坦克': [
        {
          title:'对方后排出现短暂脱节',
          text:'你已经吃到第一轮控制，但对方支援与前排拉开了距离。现在开团可能直接撕开阵型，也可能让队友看着你一个人蒸发。',
          choices:[
            { label:'强行切入后排', desc:'赌操作和抗压，成功时能制造决定性缺口。', attrs:['decision','mechanics','clutch'], difficulty:82, risk:'高风险', tone:'high', success:3.1, fail:-3.2, style:'aggressive', successText:'你顶住控制完成切入，对方后排被迫交出全部资源。', failText:'你切得很果断，队友跟得很犹豫——或者说，根本没跟。' },
            { label:'压住正面等待同步', desc:'先确认队友位置，再利用技能资源稳步推进。', attrs:['awareness','cooldown','synergy'], difficulty:76, risk:'中风险', tone:'mid', success:2.0, fail:-1.5, style:'team', successText:'你卡住关键位置，队友同步压进，正面空间被彻底吃下。', failText:'等待让窗口稍纵即逝，对方重新补齐了阵型。' },
            { label:'回身保护己方后排', desc:'放弃开团窗口，优先阻止对方侧翼交换后排。', attrs:['awareness','survival','shotcalling'], difficulty:73, risk:'低风险', tone:'low', success:1.3, fail:-.9, style:'steady', successText:'你及时回头拆掉对方切入，队伍保住了完整阵型。', failText:'你回防得太深，正面空间被对方白白接管。' }
          ]
        },
        {
          title:'加时前的最后一次进场',
          text:'目标点即将进入加时，双方资源都不完整。你必须决定是提前抢位置，还是等对方先交技能。',
          choices:[
            { label:'提前抢占目标点', desc:'用生存和技能管理换取第一落位。', attrs:['survival','cooldown','decision'], difficulty:78, risk:'中风险', tone:'mid', success:2.3, fail:-2.0, style:'steady', successText:'你稳稳踩住目标点，逼迫对方在不舒服的角度接团。', failText:'你提前落位，却被对方集火得像免费试用靶。' },
            { label:'藏住位置反开', desc:'依赖意识和指挥，在敌方交出位移后反击。', attrs:['awareness','shotcalling','clutch'], difficulty:81, risk:'高风险', tone:'high', success:3.0, fail:-2.8, style:'team', successText:'你的反开时机精准，对方冲进来后才发现这是个口袋。', failText:'反开慢了半拍，等你进场时队友已经少了两个。' },
            { label:'正面换资源', desc:'不耍花活，靠阵地能力打完最后一波。', attrs:['cooldown','synergy','survival'], difficulty:74, risk:'低风险', tone:'low', success:1.5, fail:-1.0, style:'steady', successText:'资源交换完全按计划进行，我方保持人数优势。', failText:'正面处理略显僵硬，对方靠更快的技能循环取得先手。' }
          ]
        }
      ],
      '长枪输出': [
        {
          title:'侧翼出现一条危险枪线',
          text:'对方支援短暂暴露，但你必须离开安全高台才能追击。拿到首杀就能改变团战，空枪则会把自己送进对方镜头。',
          choices:[
            { label:'拉出枪线强吃首杀', desc:'相信长枪与抗压，在极短窗口内完成终结。', attrs:['hitscan','clutch','mechanics'], difficulty:83, risk:'高风险', tone:'high', success:3.2, fail:-3.0, style:'aggressive', successText:'你的第一枪没有给对方反应时间，团战从五打四开始。', failText:'你拉出了全场最醒目的枪线，然后用空枪向对面报到。' },
            { label:'保持高台持续压制', desc:'不追求击杀，用站位和意识封死对方移动。', attrs:['positioning','awareness','hitscan'], difficulty:75, risk:'低风险', tone:'low', success:1.7, fail:-1.0, style:'steady', successText:'你没有贪枪，却让对方整波推进都不敢抬头。', failText:'压制角度过于保守，对方借掩体顺利完成转点。' },
            { label:'跟随队伍同步转火', desc:'牺牲个人枪线，等待坦克报点后集火同一目标。', attrs:['synergy','decision','hitscan'], difficulty:77, risk:'中风险', tone:'mid', success:2.2, fail:-1.5, style:'team', successText:'你的转火几乎与指挥同时落下，目标瞬间蒸发。', failText:'转火目标不断变化，伤害打得很满，击杀一个没有。' }
          ]
        },
        {
          title:'决胜团前的狙击对位',
          text:'对方核心正在与你争夺同一条长枪线。你可以正面对枪，也可以放弃数据，换一条更隐蔽的侧线。',
          choices:[
            { label:'接受正面对枪', desc:'纯粹的枪法与抗压检验，赢的人掌控整片区域。', attrs:['hitscan','clutch','survival'], difficulty:84, risk:'高风险', tone:'high', success:3.0, fail:-3.1, style:'aggressive', successText:'你在对方开镜的瞬间完成反杀，现场气氛直接炸开。', failText:'你接受了对枪，也很礼貌地把首杀送给了对方。' },
            { label:'换侧线寻找角度', desc:'依靠意识与站位，避开正面对拼。', attrs:['awareness','positioning','decision'], difficulty:76, risk:'中风险', tone:'mid', success:2.1, fail:-1.4, style:'steady', successText:'侧线角度成功绕过注意力，你连续获得自由输出。', failText:'转点途中被提前察觉，你既没枪线，也没退路。' },
            { label:'为队伍报点牵制', desc:'减少开枪频率，用信息帮助队友处理正面。', attrs:['shotcalling','synergy','awareness'], difficulty:74, risk:'低风险', tone:'low', success:1.4, fail:-.8, style:'team', successText:'你的信息让队伍避开危险枪线，从另一侧完成突破。', failText:'信息虽然完整，但队伍没能抓住转瞬即逝的窗口。' }
          ]
        }
      ],
      '弹道输出': [
        {
          title:'对方后排正在转点',
          text:'地形给了你一次绕后机会。你可以独自切入，也可以保留技能等待队伍正面开团。',
          choices:[
            { label:'独自绕后完成刺杀', desc:'高风险个人秀，依赖弹道、操作和生存。', attrs:['projectile','mechanics','survival'], difficulty:83, risk:'高风险', tone:'high', success:3.2, fail:-3.3, style:'aggressive', successText:'你的技能链没有给对方任何喘息，后排瞬间减员。', failText:'你完成了漂亮的绕后路线，最后把自己绕进了五个人中间。' },
            { label:'等待正面同步进场', desc:'与坦克同拍切入，降低个人风险。', attrs:['synergy','decision','cooldown'], difficulty:76, risk:'中风险', tone:'mid', success:2.2, fail:-1.5, style:'team', successText:'你与前排同时进场，技能衔接让对方无处可退。', failText:'你和坦克的进场差了半秒，足够对方逐个处理。' },
            { label:'留技能防守侧翼', desc:'牺牲进攻上限，保护己方后排和撤退路线。', attrs:['awareness','cooldown','positioning'], difficulty:73, risk:'低风险', tone:'low', success:1.3, fail:-.9, style:'steady', successText:'你提前拦住对方侧翼，队伍后排获得完整输出空间。', failText:'你等来的不是侧翼，而是正面队友的阵亡播报。' }
          ]
        },
        {
          title:'终极技能可以强行开局',
          text:'你的终极技能已经就绪，但对方可能留有反制资源。现在交出，可能一波打穿，也可能给空气做按摩。',
          choices:[
            { label:'直接交大招抢先手', desc:'赌技能命中和临场操作。', attrs:['cooldown','projectile','clutch'], difficulty:81, risk:'高风险', tone:'high', success:3.0, fail:-2.8, style:'aggressive', successText:'大招精准覆盖关键区域，对方阵型当场崩解。', failText:'大招声势很足，实际效果主要是提醒对方赶紧散开。' },
            { label:'等控制技能后衔接', desc:'强化技能联动，以协同换稳定命中。', attrs:['synergy','cooldown','decision'], difficulty:75, risk:'中风险', tone:'mid', success:2.2, fail:-1.4, style:'team', successText:'控制与大招严丝合缝，对方没有任何逃生窗口。', failText:'队友控制提前结束，你的大招只赶上了散场。' },
            { label:'继续保留反打', desc:'让对方先交资源，再用大招扭转团战。', attrs:['awareness','decision','clutch'], difficulty:77, risk:'低风险', tone:'low', success:1.8, fail:-1.2, style:'steady', successText:'你忍住冲动，在对方资源真空期完成反打。', failText:'你把大招捏得很稳，稳到团战结束都没找到机会。' }
          ]
        }
      ],
      '输出支援': [
        {
          title:'前排残血，但敌方核心同样暴露',
          text:'你只能在很短时间里决定：继续治疗保住前排，还是补枪争取击杀。两边都想要，通常意味着两边都没拿到。',
          choices:[
            { label:'切换输出完成击杀', desc:'依赖长枪、决策和抗压，成功可直接结束团战。', attrs:['hitscan','decision','clutch'], difficulty:82, risk:'高风险', tone:'high', success:3.0, fail:-3.0, style:'aggressive', successText:'你补上最后一枪，对方核心倒下，治疗压力随之消失。', failText:'你没补掉目标，前排也在你切枪时倒下。标准的两头落空。' },
            { label:'全力维持前排血线', desc:'优先保证阵型，依赖技能管理和站位。', attrs:['cooldown','positioning','survival'], difficulty:74, risk:'低风险', tone:'low', success:1.6, fail:-1.0, style:'steady', successText:'你精准分配资源，前排硬是从死亡线上被拉了回来。', failText:'治疗资源见底，前排仍被对方第二轮爆发击穿。' },
            { label:'呼叫队友共同转火', desc:'用信息和协同让队伍替你完成选择。', attrs:['shotcalling','synergy','awareness'], difficulty:76, risk:'中风险', tone:'mid', success:2.2, fail:-1.5, style:'team', successText:'你的报点让全队瞬间转火，威胁目标被迅速处理。', failText:'报点过于混乱，队友各打各的，场面像五个单排撞车。' }
          ]
        },
        {
          title:'关键保命技能只够救一个人',
          text:'坦克和另一名输出同时被集火。你必须判断谁才是这波团战真正的胜负手。',
          choices:[
            { label:'优先保住坦克', desc:'稳定正面空间，但可能损失输出能力。', attrs:['decision','cooldown','awareness'], difficulty:75, risk:'中风险', tone:'mid', success:2.0, fail:-1.5, style:'steady', successText:'坦克活下来重新接管空间，队伍获得反打机会。', failText:'坦克虽然活了，输出缺口却让对方毫无压力地收尾。' },
            { label:'救下核心输出', desc:'赌其后续收割，风险与收益都更高。', attrs:['awareness','clutch','synergy'], difficulty:80, risk:'高风险', tone:'high', success:2.9, fail:-2.7, style:'aggressive', successText:'核心输出被救下后完成连续击杀，团战瞬间翻盘。', failText:'输出被你救下三秒，然后和你一起被正面碾过。' },
            { label:'保留技能自保', desc:'确保自身存活，等待队友复活后的下一波。', attrs:['survival','positioning','decision'], difficulty:72, risk:'低风险', tone:'low', success:1.2, fail:-.8, style:'steady', successText:'你成功撤离并保住关键资源，下一波仍有完整战力。', failText:'撤退路线被提前封死，技能留到了回放画面里。' }
          ]
        }
      ],
      '战术支援': [
        {
          title:'队伍正在争论下一波怎么打',
          text:'对方已经开始转点，而我方语音里同时出现三个方案。你必须立刻统一信息，否则这波团战会先输在麦克风里。',
          choices:[
            { label:'明确指挥全队强压正面', desc:'用指挥与协同快速统一行动。', attrs:['shotcalling','synergy','decision'], difficulty:77, risk:'中风险', tone:'mid', success:2.4, fail:-1.8, style:'team', successText:'你的口令干净明确，五个人终于像一支队伍同时压上。', failText:'指令下得很快，但目标没说清楚，全队整齐地打了不同的人。' },
            { label:'临时改为保守接团', desc:'优先维持阵型，降低沟通失误带来的风险。', attrs:['awareness','survival','positioning'], difficulty:73, risk:'低风险', tone:'low', success:1.4, fail:-.9, style:'steady', successText:'你把队伍收回安全区域，成功化解对方第一轮进攻。', failText:'收缩过度让出全部空间，对方几乎没有付出代价。' },
            { label:'呼叫侧翼执行奇袭', desc:'高风险战术变化，依赖判断和抗压。', attrs:['shotcalling','awareness','clutch'], difficulty:82, risk:'高风险', tone:'high', success:3.1, fail:-3.0, style:'aggressive', successText:'侧翼按你的时机切入，对方注意力被完全撕开。', failText:'奇袭路线被读到，侧翼选手成为全场最孤独的人。' }
          ]
        },
        {
          title:'敌方终极技能资源明显占优',
          text:'正面硬接很可能被一波清场。你可以尝试骗技能、主动绕开，或者相信队友的操作强行顶住。',
          choices:[
            { label:'派人试探骗出大招', desc:'依赖指挥和意识，用少量风险换资源优势。', attrs:['shotcalling','awareness','decision'], difficulty:78, risk:'中风险', tone:'mid', success:2.3, fail:-1.8, style:'team', successText:'对方被假动作骗出关键大招，我方完整撤退。', failText:'试探选手没能撤回，假动作最后演成了真送头。' },
            { label:'全队绕行避开正面', desc:'考验站位和协同，成功可完全跳过资源劣势。', attrs:['synergy','positioning','awareness'], difficulty:76, risk:'低风险', tone:'low', success:1.8, fail:-1.2, style:'steady', successText:'全队无声完成转点，对方大招握在手里却找不到目标。', failText:'转点路线暴露，队伍在狭窄通道里被堵了个正着。' },
            { label:'强行接团打操作', desc:'相信队伍上限，失败时也别装作意外。', attrs:['clutch','synergy','shotcalling'], difficulty:84, risk:'高风险', tone:'high', success:3.3, fail:-3.4, style:'aggressive', successText:'队伍在资源劣势下连续规避关键技能，完成惊险反打。', failText:'对方大招一个不少地砸下来，结果与赛前预测高度一致。' }
          ]
        }
      ]
    };

    function chooseDecisionFights(fights, count) {
      const pool = Array.from({length:Math.max(1,fights-2)},(_,i)=>i+2);
      return shuffle(pool).slice(0,Math.min(count,pool.length)).sort((a,b)=>a-b);
    }

    function attrName(key) {
      return ATTRS.find(a=>a.key===key)?.name || key;
    }

    function getChoiceChance(choice, session) {
      const user = matchState.homeRoster.find(p=>p.isUser);
      const avg = choice.attrs.reduce((sum,k)=>sum+user.attrs[k],0)/choice.attrs.length;
      let chance = .50 + (avg-choice.difficulty)*.017;
      if (choice.style === matchState.style) chance += .055;
      if (session.homeFights < session.awayFights) chance += (user.attrs.clutch-78)*.0025;
      if (session.momentum > 1) chance += .025;
      if (session.momentum < -1) chance -= .025;
      return clamp(chance,.20,.88);
    }

    function createDecision(session) {
      const templates = KEY_EVENTS[state.role] || KEY_EVENTS['长枪输出'];
      const unused = templates.filter((_,i)=>!session.usedEvents.includes(i));
      const template = pick(unused.length ? unused : templates);
      const index = templates.indexOf(template);
      session.usedEvents.push(index);
      return { ...template, choices:template.choices.map((c,i)=>({ ...c, id:`choice-${i}`, chance:getChoiceChance(c,session) })) };
    }

    function startInteractiveMap() {
      if (matchState.simulating || matchState.finished || matchState.mapSession) return;
      if(!ensureCurrentMapSelected(false)){renderMatch();return;}
      const map = currentMatchMap();
      const tactics = matchState.currentTactics || { home:chooseTactic(matchState.homeRoster,map), away:chooseTactic(matchState.awayRoster,map) };
      const homeData = teamMapPower(matchState.homeRoster,map,tactics.home,tactics.away,true);
      const awayData = teamMapPower(matchState.awayRoster,map,tactics.away,tactics.home,false);
      const decidingMap = matchState.mapIndex === matchState.targetWins*2-2 || (matchState.homeScore===matchState.targetWins-1 && matchState.awayScore===matchState.targetWins-1);
      const decisionCount = decidingMap ? 3 : 2;
      matchState.mapSession = {
        map, tactics, homeData, awayData,
        fight:0, homeFights:0, awayFights:0, momentum:0, ultSwing:0,
        userSuccess:0, userFail:0, decisionScore:0,
        decisionFights:chooseDecisionFights(map.fights,decisionCount),
        pendingDecision:null, pendingOutcome:null, usedEvents:[], fightResults:[]
      };
      matchState.logs.push({ map:`M${matchState.mapIndex+1}`, side:'event', text:`${map.name} 开始：${matchState.homeTeam.name} 使用「${tactics.home}」，${matchState.awayTeam.name} 使用「${tactics.away}」。` });
      advanceInteractiveMap();
    }

    function advanceInteractiveMap() {
      const session = matchState.mapSession;
      if (!session || session.pendingDecision || session.pendingOutcome) return;
      while (session.fight < session.map.fights) {
        session.fight++;
        if (session.decisionFights.includes(session.fight)) {
          session.pendingDecision = createDecision(session);
          renderMatch();
          scrollLiveToEnd();
          return;
        }
        resolveInteractiveFight(session,0,null);
      }
      finalizeInteractiveMap(session);
    }

    function chooseKeyDecision(choiceId) {
      const session = matchState.mapSession;
      if (!session?.pendingDecision) return;
      const choice = session.pendingDecision.choices.find(c=>c.id===choiceId);
      if (!choice) return;
      const success = Math.random() < choice.chance;
      const swing = success ? choice.success : choice.fail;
      if (success) { session.userSuccess++; session.decisionScore += 1; }
      else { session.userFail++; session.decisionScore -= 1; }
      matchState.logs.push({
        map:`M${matchState.mapIndex+1}·团${session.fight}`,
        side:'event',
        text:`${getPlayerName()} 选择「${choice.label}」：${success?choice.successText:choice.failText}`
      });
      const homeWin = resolveInteractiveFight(session,swing,{success,choice});
      session.pendingOutcome = {
        success, choice,
        text:success?choice.successText:choice.failText,
        homeWin,
        score:`${session.homeFights}:${session.awayFights}`
      };
      session.pendingDecision = null;
      renderMatch();
      scrollLiveToEnd();
    }

    function continueAfterDecision() {
      const session = matchState.mapSession;
      if (!session?.pendingOutcome) return;
      session.pendingOutcome = null;
      advanceInteractiveMap();
    }

    function resolveInteractiveFight(session, personalSwing=0, decisionMeta=null) {
      const diff = (session.homeData.power-session.awayData.power) + session.momentum + session.ultSwing + personalSwing + randomCentered(2.8);
      const homeProb = mapFightWinProbability(diff);
      const homeWin = Math.random()<homeProb;
      if(homeWin) {
        session.homeFights++;
        session.momentum=clamp(session.momentum+1.0,-3,3);
        session.ultSwing=clamp(session.ultSwing-.45,-2,2);
        matchState.logs.push({ map:`M${matchState.mapIndex+1}·团${session.fight}`, side:'home', text:decisionMeta && decisionMeta.success ? '你的决策成功转化为人数优势，我方顺势收下团战。' : pick([
          `${matchState.homeTeam.name} 控住先手，完成一波干净的资源交换。`,
          `我方顶住第一轮技能，反打收下团战。`,
          `我方集火更快，对手的阵型被切成两段。`
        ])});
      } else {
        session.awayFights++;
        session.momentum=clamp(session.momentum-1.0,-3,3);
        session.ultSwing=clamp(session.ultSwing+.45,-2,2);
        matchState.logs.push({ map:`M${matchState.mapIndex+1}·团${session.fight}`, side:'away', text:decisionMeta && !decisionMeta.success ? '个人决策没有奏效，对方抓住空档完成清场。' : pick([
          `${matchState.awayTeam.name} 抢到主动权，我方被迫后撤。`,
          `对方用终极技能资源扳回节奏。`,
          `我方转火不够统一，对手逐个完成清理。`
        ])});
      }
      session.fightResults.push(homeWin?'home':'away');
      return homeWin;
    }

    function finalizeInteractiveMap(session) {
      if(session.homeFights===session.awayFights) {
        session.fight++;
        const overtimeDiff=(session.homeData.power-session.awayData.power)+(session.userSuccess-session.userFail)*.8+randomCentered(4);
        if(overtimeDiff>=0) session.homeFights++; else session.awayFights++;
        matchState.logs.push({ map:`M${matchState.mapIndex+1}·加时`, side:overtimeDiff>=0?'home':'away', text:overtimeDiff>=0?'决胜团中，我方保留的资源更多，艰难收下地图。':'决胜团的第一波集火失败，对方在加时完成终结。' });
      }
      const user=matchState.homeRoster.find(p=>p.isUser);
      const userIndex=matchState.homeRoster.indexOf(user);
      const winner=session.homeFights>session.awayFights?'home':'away';
      const ratingBase=6.35+(session.homeData.individual[userIndex]-78)*.065+(winner==='home'?.35:-.18)+session.userSuccess*.30-session.userFail*.32+session.decisionScore*.12;
      const userRating=clamp(ratingBase+randomCentered(.30),4.4,9.8);
      const highlight=session.userSuccess>=2 && session.userSuccess>session.userFail?'多次关键决策直接改变了地图走势':session.userFail>session.userSuccess?'关键选择连续失手，队伍为此付出了额外代价':matchState.style==='team'?'个人数据不算夸张，但关键时刻保持了团队同步':'关键节点处理相对稳健，没有制造大型事故';
      applyMapRatings('home',matchState.homeRoster,session.homeData.individual,winner==='home',userRating);
      applyMapRatings('away',matchState.awayRoster,session.awayData.individual,winner==='away',null);
      matchState.logs.push({ map:`M${matchState.mapIndex+1}`, side:winner, text:`地图结束，${winner==='home'?matchState.homeTeam.name:matchState.awayTeam.name} 以 ${session.homeFights}:${session.awayFights} 赢下 ${session.map.name}。` });
      const result={ mapName:session.map.name, winner, homeFights:session.homeFights, awayFights:session.awayFights, userRating, highlight, logs:[], decisions:session.userSuccess+session.userFail };
      matchState.results.push(result);
      if (winner==='home') matchState.homeScore++; else matchState.awayScore++;
      matchState.mapSession=null;
      if (matchState.homeScore>=matchState.targetWins || matchState.awayScore>=matchState.targetWins) matchState.finished=true;
      else advanceSeriesMapAfterResult(winner);
      renderMatch();
      scrollLiveToEnd();
    }

    function scrollLiveToEnd() {
      const live=document.getElementById('liveLog');
      if(live) live.scrollTop=live.scrollHeight;
    }

    function renderMapControl() {
      const area = document.getElementById('mapControlArea');
      if (matchState.finished) {
        const won = matchState.homeScore > matchState.awayScore;
        const user = matchState.homeRoster.find(p=>p.isUser);
        const userRatings = matchState.ratings.home[user.id] || [];
        const avgRating = userRatings.length ? (userRatings.reduce((a,b)=>a+b,0)/userRatings.length).toFixed(1) : '—';
        area.innerHTML = `<div class="series-finish">
          <div class="series-finish-icon">${won?'🏆':'📋'}</div>
          <h3>${won?'首秀告捷':'首秀失利'}</h3>
          <p>系列赛 ${matchState.homeScore}:${matchState.awayScore} · 你的平均评分 ${avgRating}</p>
          <div style="display:flex;gap:9px;justify-content:center;flex-wrap:wrap;margin-top:13px">
            ${matchState.context==='regular'?'<button class="primary-btn" id="returnSeasonBtn">返回常规赛</button>':matchState.context==='playoff'?'<button class="primary-btn" id="returnPlayoffBtn">返回季后赛</button>':'<button class="primary-btn" id="playAgainBtn">再模拟一场</button>'}
          </div>
        </div>`;
        const playAgainBtn=document.getElementById('playAgainBtn');
        if(playAgainBtn) playAgainBtn.addEventListener('click',()=>setupMatch(true));
        const returnSeasonBtn=document.getElementById('returnSeasonBtn');
        if(returnSeasonBtn) returnSeasonBtn.addEventListener('click',()=>{ recordManualSeasonMatch(); returnToSeasonAfterMatch(); });
        const returnPlayoffBtn=document.getElementById('returnPlayoffBtn');
        if(returnPlayoffBtn) returnPlayoffBtn.addEventListener('click',()=>{ recordPlayoffMatch(); renderPlayoffs(); showScreen('playoff'); });
        return;
      }
      const map = currentMatchMap();
      const last = matchState.results[matchState.results.length-1];
      if(!map && matchState.mapSelectionEnabled && matchState.mapPicker==='home') {
        const options=matchState.availableMaps.map(item=>`<button class="map-pick-option" data-pick-map="${item.name}"><strong>${item.name} · ${item.type}</strong><span>${item.tags.join(' · ')}</span></button>`).join('');
        area.innerHTML=`<div class="map-header"><div><div class="map-kicker">MAP ${matchState.mapIndex+1} · 选图阶段</div><h3 class="map-title">轮到你选择地图</h3></div><div class="map-count"><span>选图权</span><strong>我方</strong></div></div><div class="map-pick-panel"><div class="map-pick-head"><strong>选择第 ${matchState.mapIndex+1} 张地图</strong><span>${matchState.mapIndex===0?'高顺位拥有首图选图权':'上一张地图的败者拥有选图权'}</span></div><div class="map-pick-grid">${options}</div><div class="map-picker-note">地图不重复；快速模拟会自动选择适配度最高的地图。</div></div>`;
        area.querySelectorAll('[data-pick-map]').forEach(btn=>btn.addEventListener('click',()=>commitSeriesMap(MATCH_MAPS.find(m=>m.name===btn.dataset.pickMap),'home',true)));
        return;
      }
      const session = matchState.mapSession;
      const fightTrack = session ? `<div class="fight-progress">
          <div class="fight-progress-head"><strong>地图进行中 · 第 ${Math.min(session.fight,map.fights)} / ${map.fights} 波关键团战</strong><span>团战比分 ${session.homeFights}:${session.awayFights}</span></div>
          <div class="fight-progress-track" style="--fight-count:${map.fights}">${Array.from({length:map.fights},(_,i)=>`<i class="fight-pip ${session.fightResults[i]||''} ${i+1===session.fight && (session.pendingDecision||session.pendingOutcome)?'current':''}"></i>`).join('')}</div>
        </div>` : '';

      let actionArea = '';
      if (session?.pendingDecision) {
        const d=session.pendingDecision;
        const momentumText=session.momentum>1?'我方占优':session.momentum<-1?'对方占优':'势均力敌';
        const resourceText=session.ultSwing>0.6?'我方资源占优':session.ultSwing<-0.6?'对方资源占优':'资源接近';
        actionArea=`<div class="decision-card">
          <div class="decision-top"><span class="decision-kicker">KEY DECISION · 团战 ${session.fight}</span><span class="decision-state">比赛暂停</span></div>
          <h3 class="decision-title">${d.title}</h3>
          <p class="decision-copy">${d.text}</p>
          <div class="decision-context">
            <div class="context-chip"><span>当前团战比分</span><strong>${session.homeFights}:${session.awayFights}</strong></div>
            <div class="context-chip"><span>场上节奏</span><strong>${momentumText}</strong></div>
            <div class="context-chip"><span>技能资源</span><strong>${resourceText}</strong></div>
          </div>
          <div class="decision-options">${d.choices.map(c=>`<button class="decision-option" data-decision="${c.id}">
            <div><strong>${c.label}</strong><p>${c.desc}</p><div class="option-tags">${c.attrs.map(k=>`<span class="option-tag">${attrName(k)}</span>`).join('')}<span class="option-tag option-risk ${c.tone==='mid'?'mid':c.tone==='low'?'low':''}">${c.risk}</span></div></div>
          </button>`).join('')}</div>
        </div>`;
      } else if (session?.pendingOutcome) {
        const o=session.pendingOutcome;
        actionArea=`<div class="decision-card"><div class="decision-result ${o.success?'':'fail'}">
          <div class="result-icon">${o.success?'✓':'!'}</div>
          <h3>${o.success?'决策奏效':'决策失手'}</h3>
          <p><strong>「${o.choice.label}」</strong>：${o.text}</p>
          <div class="result-fight">本波团战由<strong>${o.homeWin?'我方':'对方'}</strong>拿下 · 当前团战比分 ${o.score}</div>
          <button class="primary-btn continue-fight-btn" id="continueFightBtn">继续比赛 →</button>
        </div></div>`;
      } else if (session) {
        actionArea=`<div class="strategy-box"><div class="strategy-title"><strong>比赛正在推进</strong><span>下一个关键节点会自动暂停</span></div></div>`;
      } else {
        actionArea=`<div class="strategy-box">
          <div class="strategy-title"><strong>你的比赛策略</strong><span>每张地图可重新选择</span></div>
          <div class="style-options">
            ${Object.entries(STYLES).map(([key,v])=>`<button class="style-btn ${matchState.style===key?'selected':''}" data-style="${key}" ${matchState.simulating?'disabled':''}><strong>${v.name}</strong><span>${v.desc}</span></button>`).join('')}
          </div>
          <div class="tactic-readout">
            <div class="tactic-side">我方体系<b>${matchState.currentTactics.home}</b></div>
            <div class="tactic-vs">VS</div>
            <div class="tactic-side">对方体系<b>${matchState.currentTactics.away}</b></div>
          </div>
        </div>
        ${last ? `<div class="map-summary ${last.winner==='home'?'win':'loss'}"><div class="map-summary-head"><strong>${last.mapName} · ${last.winner==='home'?'地图胜利':'地图失利'}</strong><span class="map-summary-score">${last.homeFights}:${last.awayFights}</span></div><p>你的地图评分 ${last.userRating==null?'未登场':last.userRating.toFixed(1)} · ${last.highlight}</p></div>` : ''}
        <div class="match-actions">
          <button class="primary-btn" id="simMapBtn">▶ 开始第 ${matchState.mapIndex+1} 张地图</button>
          <button class="secondary-btn" id="fastSeriesBtn">⏩ 快速模拟整场</button>
        </div>`;
      }

      area.innerHTML = `
        <div class="map-header">
          <div>
            <div class="map-kicker">MAP ${matchState.mapIndex+1} · ${map.type}</div>
            <h3 class="map-title">${map.name}</h3>
            <div class="map-tags">${map.tags.map(t=>`<span class="map-tag">${t}</span>`).join('')}</div>
          </div>
          <div class="map-count"><span>关键决策</span><strong>${session?session.decisionFights.length:((matchState.mapIndex===matchState.targetWins*2-2 || (matchState.homeScore===matchState.targetWins-1 && matchState.awayScore===matchState.targetWins-1))?3:2)}</strong></div>
        </div>
        ${fightTrack}
        ${actionArea}`;

      area.querySelectorAll('[data-style]').forEach(btn=>btn.addEventListener('click',()=>{
        matchState.style=btn.dataset.style; renderMatch();
      }));
      area.querySelectorAll('[data-decision]').forEach(btn=>btn.addEventListener('click',()=>chooseKeyDecision(btn.dataset.decision)));
      document.getElementById('continueFightBtn')?.addEventListener('click',continueAfterDecision);
      document.getElementById('simMapBtn')?.addEventListener('click',startInteractiveMap);
      document.getElementById('fastSeriesBtn')?.addEventListener('click',()=>simulateFullSeries());
    }

    function simulateNextMap(fast) {
      if (matchState.simulating || matchState.finished || matchState.mapSession) return;
      matchState.simulating = true;
      if (!fast) renderMatch();
      const run = () => {
        const result = simulateMap();
        matchState.results.push(result);
        if (result.winner==='home') matchState.homeScore++; else matchState.awayScore++;
        result.logs.forEach(l=>matchState.logs.push(l));
        if (matchState.homeScore>=matchState.targetWins || matchState.awayScore>=matchState.targetWins) {
          matchState.finished=true;
        } else {
          advanceSeriesMapAfterResult(result.winner);
        }
        matchState.simulating=false;
        renderMatch();
        const live=document.getElementById('liveLog'); if(live) live.scrollTop=live.scrollHeight;
      };
      if (fast) run(); else setTimeout(run,650);
    }

    function simulateFullSeries() {
      if (matchState.simulating || matchState.finished || matchState.mapSession) return;
      matchState.simulating=true;
      while (!matchState.finished) {
        ensureCurrentMapSelected(true);
        const map = currentMatchMap();
        if (!matchState.currentTactics) matchState.currentTactics={ home:chooseTactic(matchState.homeRoster,map), away:chooseTactic(matchState.awayRoster,map) };
        const result=simulateMap();
        matchState.results.push(result);
        if(result.winner==='home') matchState.homeScore++; else matchState.awayScore++;
        result.logs.forEach(l=>matchState.logs.push(l));
        if(matchState.homeScore>=matchState.targetWins || matchState.awayScore>=matchState.targetWins) matchState.finished=true;
        else advanceSeriesMapAfterResult(result.winner);
      }
      matchState.simulating=false;
      renderMatch();
      const live=document.getElementById('liveLog'); if(live) live.scrollTop=live.scrollHeight;
    }

    function simulateMap() {
      ensureCurrentMapSelected(true);
      const map = currentMatchMap();
      const tactics = matchState.currentTactics || { home:chooseTactic(matchState.homeRoster,map), away:chooseTactic(matchState.awayRoster,map) };
      const homeData = teamMapPower(matchState.homeRoster,map,tactics.home,tactics.away,true);
      const awayData = teamMapPower(matchState.awayRoster,map,tactics.away,tactics.home,false);
      let homeFights=0, awayFights=0, momentum=0, ultSwing=0;
      let userSuccess=0, userFail=0;
      const logs=[];
      const user=matchState.homeRoster.find(p=>p.isUser);
      const userIndex=matchState.homeRoster.indexOf(user);

      for(let i=1;i<=map.fights;i++) {
        let personalSwing=0;
        const eventRoll=Math.random();
        const userCore=homeData.individual[userIndex];
        const style=matchState.style;
        let eventText='';
        if(eventRoll<.28) {
          let successChance=.52 + (userCore-78)*.012;
          if(style==='aggressive') successChance+=.07;
          if(style==='steady') successChance+=.02;
          if(style==='team') successChance+=.04;
          successChance=clamp(successChance,.25,.82);
          if(Math.random()<successChance) {
            userSuccess++; personalSwing=style==='aggressive'?2.4:style==='team'?1.8:1.5;
            eventText=pick([
              `${getPlayerName()} 抓住短暂破绽，率先完成击杀。`,
              `${getPlayerName()} 的站位没有露头送命，反而逼退了对方核心。`,
              `${getPlayerName()} 与队友完成同步集火，打开团战缺口。`
            ]);
          } else {
            userFail++; personalSwing=style==='aggressive'?-2.6:-1.4;
            eventText=pick([
              `${getPlayerName()} 尝试扩大优势，但脱离阵型后被迅速处理。`,
              `${getPlayerName()} 判断慢了半拍，对方先手直接撕开缺口。`,
              `${getPlayerName()} 的关键技能落空，这波多少有点替对面省事。`
            ]);
          }
          logs.push({ map:`M${matchState.mapIndex+1}·团${i}`, side:'event', text:eventText });
        }

        const diff = (homeData.power-awayData.power) + momentum + ultSwing + personalSwing + randomCentered(2.8);
        const homeProb = mapFightWinProbability(diff);
        const homeWin = Math.random()<homeProb;
        if(homeWin) {
          homeFights++;
          momentum=clamp(momentum+1.0,-3,3);
          ultSwing=clamp(ultSwing-.45,-2,2);
          logs.push({ map:`M${matchState.mapIndex+1}·团${i}`, side:'home', text:pick([
            `${matchState.homeTeam.name} 控住先手，完成一波干净的资源交换。`,
            `我方顶住第一轮技能，反打收下团战。`,
            `我方集火更快，对手的阵型被切成两段。`
          ])});
        } else {
          awayFights++;
          momentum=clamp(momentum-1.0,-3,3);
          ultSwing=clamp(ultSwing+.45,-2,2);
          logs.push({ map:`M${matchState.mapIndex+1}·团${i}`, side:'away', text:pick([
            `${matchState.awayTeam.name} 抢到主动权，我方被迫后撤。`,
            `对方用终极技能资源扳回节奏。`,
            `我方转火不够统一，对手逐个完成清理。`
          ])});
        }
      }
      if(homeFights===awayFights) {
        const overtimeDiff=(homeData.power-awayData.power)+(userSuccess-userFail)*.8+randomCentered(4);
        if(overtimeDiff>=0) homeFights++; else awayFights++;
        logs.push({ map:`M${matchState.mapIndex+1}·加时`, side:overtimeDiff>=0?'home':'away', text:overtimeDiff>=0?'决胜团中，我方保留的资源更多，艰难收下地图。':'决胜团的第一波集火失败，对方在加时完成终结。' });
      }
      const winner=homeFights>awayFights?'home':'away';
      const ratingBase=6.35+(homeData.individual[userIndex]-78)*.065+(winner==='home'?.35:-.18)+userSuccess*.28-userFail*.30;
      const userRating=clamp(ratingBase+randomCentered(.35),4.4,9.8);
      const highlight=userSuccess>userFail+1?'连续完成最后一击，直接改变了地图走势':userFail>userSuccess?'几次冒进让队伍付出了额外代价':matchState.style==='team'?'个人数据普通，但协同贡献稳定':'整体发挥平稳，没有制造大型事故';
      applyMapRatings('home',matchState.homeRoster,homeData.individual,winner==='home',userRating);
      applyMapRatings('away',matchState.awayRoster,awayData.individual,winner==='away',null);
      logs.unshift({ map:`M${matchState.mapIndex+1}`, side:'event', text:`${map.name} 开始：${matchState.homeTeam.name} 使用「${tactics.home}」，${matchState.awayTeam.name} 使用「${tactics.away}」。` });
      logs.push({ map:`M${matchState.mapIndex+1}`, side:winner, text:`地图结束，${winner==='home'?matchState.homeTeam.name:matchState.awayTeam.name} 以 ${homeFights}:${awayFights} 赢下 ${map.name}。` });
      const result={ mapName:map.name, winner, homeFights, awayFights, userRating, highlight, logs };
      try{ return window.__OWL_V20_ALPHA1?.annotateDetailedMap?.(result,{map,tactics,homeData,awayData})||result; }catch(_){ return result; }
    }

    function applyMapRatings(side, roster, effective, won, forcedUserRating) {
      roster.forEach((p,i)=>{
        let rating=6.25+(effective[i]-78)*.06+(won?.30:-.15)+randomCentered(.45);
        if(p.isUser && forcedUserRating!=null) rating=forcedUserRating;
        rating=clamp(rating,4.3,9.7);
        if(!matchState.ratings[side][p.id]) matchState.ratings[side][p.id]=[];
        matchState.ratings[side][p.id].push(rating);
      });
    }

    function renderLiveLog() {
      const box=document.getElementById('liveLog');
      if(!matchState.logs.length) { box.innerHTML='<div style="padding:20px;text-align:center;color:var(--muted);font-size:11px">比赛尚未开始</div>'; return; }
      box.innerHTML=matchState.logs.map(l=>`<div class="log-line"><span class="log-map">${l.map}</span><span class="log-side ${l.side}">${l.side==='home'?'我方':l.side==='away'?'对方':'事件'}</span><span>${l.text}</span></div>`).join('');
    }

    function renderRatings() {
      const panel=document.getElementById('ratingsPanel');
      if(!matchState.finished) { panel.classList.add('hidden'); return; }
      panel.classList.remove('hidden');
      const all=[
        ...matchState.homeRoster.map(p=>({ ...p, side:matchState.homeTeam.name, values:matchState.ratings.home[p.id]||[] })),
        ...matchState.awayRoster.map(p=>({ ...p, side:matchState.awayTeam.name, values:matchState.ratings.away[p.id]||[] }))
      ].map(p=>({ ...p, avg:p.values.length?p.values.reduce((a,b)=>a+b,0)/p.values.length:0 }))
       .sort((a,b)=>b.avg-a.avg);
      const mvp=all[0]?.id;
      document.getElementById('ratingsTable').innerHTML=`<table class="rating-table"><thead><tr><th>排名</th><th>选手</th><th>队伍</th><th>位置</th><th style="text-align:right">评分</th></tr></thead><tbody>${all.map((p,i)=>`<tr><td>${i+1}</td><td class="${p.id===mvp?'mvp':''}"><strong>${p.name}${p.isUser?'（你）':''}</strong>${p.id===mvp?' · MVP':''}</td><td>${p.side}</td><td>${p.role}</td><td class="num ${p.id===mvp?'mvp':''}">${p.avg.toFixed(1)}</td></tr>`).join('')}</tbody></table>`;
    }

    function randomCentered(range) { return (Math.random()+Math.random()-1)*range; }


    init();
  


