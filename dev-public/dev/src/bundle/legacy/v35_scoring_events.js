/* ===== BUNDLE MODULE: legacy/v35_scoring_events.js ===== */
/* ==========================================================================
   MODULE: legacy/v35_scoring_events.js
   Compatibility layer: role-profile scoring, flags, special events, stage integration
   Migrated from V6.2 lines 9320-9628; execution order is defined by manifest.json.
   ========================================================================== */
    /* ================= V3.5 · 职责画像评分 / 国旗 / 特殊事件 / 季后赛收尾 ================= */

    // 1) 评分机制：职责基础画像 + OVR差值成长。核心能力随实力快速成长，非职责属性只缓慢增长。
    const V35_ROLE_BASE_80={
      '坦克':{hitscan:60,projectile:68,mechanics:74,cooldown:80,positioning:78,survival:80,awareness:81,decision:82,synergy:82,shotcalling:80,pool:76,clutch:78},
      '长枪输出':{hitscan:83,projectile:66,mechanics:81,cooldown:72,positioning:83,survival:77,awareness:79,decision:77,synergy:74,shotcalling:65,pool:77,clutch:83},
      '弹道输出':{hitscan:67,projectile:83,mechanics:84,cooldown:79,positioning:78,survival:77,awareness:79,decision:79,synergy:79,shotcalling:65,pool:83,clutch:81},
      '输出支援':{hitscan:78,projectile:65,mechanics:76,cooldown:83,positioning:82,survival:80,awareness:82,decision:80,synergy:80,shotcalling:72,pool:78,clutch:78},
      '战术支援':{hitscan:60,projectile:61,mechanics:67,cooldown:77,positioning:78,survival:79,awareness:81,decision:80,synergy:83,shotcalling:84,pool:74,clutch:76}
    };
    const V35_ROLE_GROWTH={
      '坦克':{hitscan:.18,projectile:.30,mechanics:.46,cooldown:.68,positioning:.62,survival:.68,awareness:.76,decision:.80,synergy:.78,shotcalling:.72,pool:.50,clutch:.58},
      '长枪输出':{hitscan:.88,projectile:.20,mechanics:.76,cooldown:.38,positioning:.78,survival:.52,awareness:.60,decision:.54,synergy:.38,shotcalling:.22,pool:.54,clutch:.78},
      '弹道输出':{hitscan:.24,projectile:.88,mechanics:.82,cooldown:.70,positioning:.60,survival:.52,awareness:.58,decision:.60,synergy:.58,shotcalling:.22,pool:.78,clutch:.70},
      '输出支援':{hitscan:.72,projectile:.20,mechanics:.58,cooldown:.86,positioning:.80,survival:.70,awareness:.78,decision:.66,synergy:.70,shotcalling:.44,pool:.64,clutch:.58},
      '战术支援':{hitscan:.20,projectile:.20,mechanics:.40,cooldown:.66,positioning:.72,survival:.74,awareness:.86,decision:.82,synergy:.88,shotcalling:.90,pool:.56,clutch:.62}
    };
    function v35RoleProfileAttrs(role,ovr,seed=`generated-${Math.random()}`,jitterRange=2){
      const base=V35_ROLE_BASE_80[role]||V35_ROLE_BASE_80['长枪输出'];
      const growth=V35_ROLE_GROWTH[role]||V35_ROLE_GROWTH['长枪输出'];
      const delta=Number(ovr||80)-80,attrs={};
      ATTRS.forEach(a=>{
        const raw=(base[a.key]??75)+delta*(growth[a.key]??.5)+deterministicJitter(seed,a.key,jitterRange);
        attrs[a.key]=clamp(Math.round(raw),48,99);
      });
      return attrs;
    }
    function v35RoleCompositeOvr(attrs,role){
      const values=ATTRS.map(a=>attrs?.[a.key]).filter(v=>Number.isFinite(v));
      if(!values.length)return '--';
      const general=values.reduce((a,b)=>a+b,0)/values.length;
      const weights=ROLE_WEIGHTS[role]||{};let weighted=0,totalW=0;
      Object.entries(weights).forEach(([key,w])=>{const v=attrs?.[key];if(Number.isFinite(v)){weighted+=v*w;totalW+=w;}});
      const roleScore=totalW?weighted/totalW:general;
      return clamp(Math.round(roleScore*.80+general*.20),45,99);
    }
    historicalAttributes=function(entry){
      const [name,role,ovr]=entry;
      return v35RoleProfileAttrs(role,ovr,`hist-${name}`,2);
    };
    generateAttributes=function(role){
      const talent=rand(68,85);
      return v35RoleProfileAttrs(role,talent,`roll-${Date.now()}-${Math.random()}`,3);
    };
    generateMatchAttributes=function(role,talent){
      return v35RoleProfileAttrs(role,talent,`match-${role}-${talent}-${Math.random()}`,3);
    };
    getMyOvr=function(){
      const attrs={};ATTRS.forEach(a=>{if(state.locked[a.key])attrs[a.key]=state.locked[a.key].value;});
      return v35RoleCompositeOvr(attrs,state.role);
    };
    const _v35CreateCareerPlayerBase=createCareerPlayer;
    createCareerPlayer=function(){
      const p=_v35CreateCareerPlayerBase();
      p.overall=v35RoleCompositeOvr(p.attrs,p.role);
      return p;
    };
    const _v35ModifyCareerAttributeBase=modifyCareerAttribute;
    modifyCareerAttribute=function(key,delta){
      _v35ModifyCareerAttributeBase(key,delta);
      const user=[...(careerState.starters||[]),...(careerState.bench||[])].find(p=>p.isUser);
      if(user)user.overall=v35RoleCompositeOvr(user.attrs,user.role);
    };
    const _v35SetCareerAttributeValueBase=setCareerAttributeValue;
    setCareerAttributeValue=function(key,value){
      _v35SetCareerAttributeValueBase(key,value);
      const user=[...(careerState.starters||[]),...(careerState.bench||[])].find(p=>p.isUser);
      if(user)user.overall=v35RoleCompositeOvr(user.attrs,user.role);
    };
    const _v35ApplyCareerMatchModifiersBase=applyCareerMatchModifiers;
    applyCareerMatchModifiers=function(roster){
      const bonus=_v35ApplyCareerMatchModifiersBase(roster);
      const user=roster.find(p=>p.isUser);if(user)user.overall=v35RoleCompositeOvr(user.attrs,user.role);
      return bonus;
    };

    // 2) 国旗：2019名单绝大多数为韩国选手，下面显式覆盖所有非韩国选手与后续新秀。
    const V35_PLAYER_FLAGS={
      // Atlanta
      babybay:'🇺🇸',NLaaeR:'🇷🇺',dafran:'🇩🇰',frd:'🇺🇸',Gator:'🇺🇸',Dogman:'🇺🇸',Kodak:'🇩🇪',Masaa:'🇫🇮',FunnyAstro:'🇬🇧',
      // Boston
      Colourhex:'🇳🇿',blasé:'🇺🇸',Fusions:'🇬🇧',rCk:'🇫🇮',Kellex:'🇩🇰',alemao:'🇧🇷',NotE:'🇨🇦',
      // Chengdu
      JinMu:'🇨🇳',Baconjack:'🇹🇼',YangXiaoLong:'🇨🇳',Ameng:'🇨🇳',Elsa:'🇨🇳',LateYoung:'🇨🇳',jiqiren:'🇨🇳',Kyo:'🇨🇳',Yveltal:'🇨🇳',GARRY:'🇨🇳',
      // Dallas
      aKm:'🇫🇷',Taimou:'🇫🇮',ZachaREEE:'🇺🇸',NotE:'🇨🇦',Mickie:'🇹🇭',Trill:'🇦🇺',uNKOE:'🇫🇷',HarryHook:'🇪🇸',
      // Florida
      TviQ:'🇸🇪',
      // Guangzhou
      Eileen:'🇨🇳',nero:'🇺🇸',Fragi:'🇫🇮',OnlyWish:'🇨🇳',
      // Hangzhou
      Krystal:'🇨🇳',guxue:'🇨🇳',
      // Houston
      Danteh:'🇺🇸',LiNkzr:'🇫🇮',JAKE:'🇺🇸',Muma:'🇺🇸',SPREE:'🇧🇪',Coolmatt:'🇺🇸',Rawkus:'🇺🇸',Bani:'🇨🇦',Boink:'🇺🇸',
      // Gladiators
      Surefour:'🇨🇦',Hydration:'🇺🇸',Shaz:'🇫🇮',Ripa:'🇫🇮',BigGoose:'🇫🇮',
      // Valiant
      Shax:'🇩🇰',KSF:'🇺🇸',Agilities:'🇨🇦',FCTFCTN:'🇺🇸',McGravy:'🇺🇸',SPACE:'🇺🇸',Custa:'🇦🇺',
      // Paris
      SoOn:'🇫🇷',ShaDowBurn:'🇷🇺',Danye:'🇵🇱',NiCOgdh:'🇫🇷',BenBest:'🇫🇷',LhCloudy:'🇫🇮',Finnsi:'🇫🇮',Greyy:'🇵🇹',HyP:'🇫🇷',Kruise:'🇬🇧',
      // Philadelphia
      Eqo:'🇮🇱',Kyb:'🇬🇧',Poko:'🇫🇷',Boombox:'🇬🇧',Elk:'🇺🇸',neptuNo:'🇪🇸',
      // Shock
      sinatraa:'🇺🇸',super:'🇺🇸',Nevix:'🇸🇪',Moth:'🇺🇸',
      // Toronto
      Logix:'🇧🇪',Mangachu:'🇨🇦',Gods:'🇺🇸',sharyk:'🇱🇻',
      // Washington
      Corey:'🇺🇸',Stratus:'🇺🇸',Sleepy:'🇺🇸',
      // Future award pools
      Shy:'🇨🇳',Mmonk:'🇨🇳',Nisha:'🇨🇳',Reiner:'🇺🇸',Sugarfree:'🇺🇸'
    };
    function v35HistoricalNames(){const s=new Set();Object.values(OWL2019_ROSTERS).forEach(list=>list.forEach(e=>s.add(e[0])));return s;}
    function v35PlayerFlag(name,isUser=false){
      if(isUser||name===getPlayerName())return '🌐';
      if(V35_PLAYER_FLAGS[name])return V35_PLAYER_FLAGS[name];
      return v35HistoricalNames().has(name)||Object.values(V32_ROOKIE_CLASSES||{}).some(list=>list.some(e=>e[0]===name))?'🇰🇷':'🌐';
    }
    function v35PrependFlag(el,name,isUser=false){
      if(!el||el.querySelector(':scope > .player-flag'))return;
      const span=document.createElement('span');span.className='player-flag';span.textContent=v35PlayerFlag(name,isUser);span.title=isUser?'自建选手':'选手国籍/地区';el.prepend(span);
    }
    const _v35RenderRoundContentBase=renderRoundContent;
    renderRoundContent=function(){
      _v35RenderRoundContentBase();
      document.querySelectorAll('#roundContent [data-player-id]').forEach(btn=>{const p=state.players.find(x=>x.id===btn.dataset.playerId);if(p)v35PrependFlag(btn.querySelector('.player-name'),p.name,false);});
    };
    const _v35RenderRevealScreenBase=renderRevealScreen;
    renderRevealScreen=function(){
      _v35RenderRevealScreenBase();
      document.querySelectorAll('.reveal-template-row strong').forEach(el=>v35PrependFlag(el,el.textContent.trim(),false));
      const myName=document.querySelector('#revealContent .reveal-player-main .name');if(myName)v35PrependFlag(myName,getPlayerName(),true);
    };
    const _v35RenderCareerTeamBase=renderCareerTeam;
    renderCareerTeam=function(){
      _v35RenderCareerTeamBase();
      const starterEls=[...document.querySelectorAll('#careerStarterList .squad-name')],benchEls=[...document.querySelectorAll('#careerBenchList .squad-name')];
      (careerState.starters||[]).forEach((p,i)=>v35PrependFlag(starterEls[i],p.isUser?getPlayerName():p.name,!!p.isUser));
      (careerState.bench||[]).forEach((p,i)=>v35PrependFlag(benchEls[i],p.isUser?getPlayerName():p.name,!!p.isUser));
    };
    const _v35RenderMatchBase=renderMatch;
    renderMatch=function(){
      _v35RenderMatchBase();
      const home=[...document.querySelectorAll('#homeRoster .roster-name')],away=[...document.querySelectorAll('#awayRoster .roster-name')];
      (matchState.homeRoster||[]).forEach((p,i)=>v35PrependFlag(home[i],p.isUser?getPlayerName():p.name,!!p.isUser));
      (matchState.awayRoster||[]).forEach((p,i)=>v35PrependFlag(away[i],p.name,false));
      document.querySelectorAll('#ratingsTable tbody tr td:nth-child(2) strong').forEach(el=>{const raw=el.textContent.replace('（你）','').trim();v35PrependFlag(el,raw,raw===getPlayerName());});
    };
    const _v35RenderRegularAwardsBase=renderRegularSeasonAwards;
    renderRegularSeasonAwards=function(){
      _v35RenderRegularAwardsBase();
      document.querySelectorAll('#regularAwardsContent .award-winner-copy strong,#regularAwardsContent .award-role-winner strong').forEach(el=>{const name=el.textContent.trim();v35PrependFlag(el,name,name===getPlayerName());});
    };
    renderFmvpCard=function(){
      const award=resolveFinalsMVP();if(!award)return '';
      return `<div class="fmvp-card"><div class="fmvp-icon">👑</div><div><small>总决赛 MVP</small><strong><span class="player-flag">${v35PlayerFlag(award.name,award.isUser)}</span>${award.name}${award.isUser?' · 你':''}</strong><em>${award.team} · ${award.role}</em></div><div class="fmvp-rating">${award.rating.toFixed(1)}</div></div>`;
    };

    // 3) 特殊生涯事件：IE3.0开挂风波。限定前两个赛季、高长枪属性、五连胜，且每个生涯只触发一次。
    SEASON_EVENTS.push({
      id:'ie30-cheat-rumor',icon:'🖱️',kicker:'CONTROVERSY · IE3.0 风波',title:'IE3.0开挂风波',
      text:'你连续打出夸张的长枪表现，一段高倍慢放剪辑在社区爆炸传播。鼠标轨迹、录像帧数、IE3.0，全被拿来当作“证据”。舆论迅速从“这个新人真猛”变成“这不可能是人打出来的”。俱乐部正在等待你的处理方式。',
      weight:.01,
      choices:[
        {label:'默默承受',desc:'不回应、不争辩，把所有情绪压回训练室，用后续比赛自己证明。',effects:{condition:-22,popularity:-12,coachTrust:6,teammateBond:9,nextRatingBonus:-.12},outcome:'你没有参与任何口水战，外界质疑却持续了很久。队友知道你承受了什么，也更加愿意站在你身边。数周后调查结论正式公布：暴雪官方经调查，确定{{PLAYER}}没有开挂行为。'},
        {label:'直播面对流言',desc:'直接开播展示设备、操作习惯与训练过程，当着所有人的面正面回应质疑。',effects:{condition:-14,popularity:28,coachTrust:-4,teammateBond:6,nextMatchBonus:1.4,nextRatingBonus:.18},outcome:'直播把整个社区的注意力都拉到了你身上。有人改口，也有人继续阴谋论，但你的名字一夜之间传遍联赛。随后调查结论正式公布：暴雪官方经调查，确定{{PLAYER}}没有开挂行为。'},
        {label:'主动申请官方核验',desc:'让俱乐部提交比赛录像、设备与机器记录，主动要求联盟与暴雪进行完整技术核验。',effects:{condition:-10,popularity:14,coachTrust:18,teammateBond:11,nextMatchBonus:-.8},outcome:'你把是否清白的问题彻底交给证据。核验期间训练节奏被打乱，但俱乐部与教练组公开站到了你身后。最终调查结论公布：暴雪官方经调查，确定{{PLAYER}}没有开挂行为。'}
      ]
    });
    function v35Ie30Eligible(){
      careerState.specialEventsTriggered=careerState.specialEventsTriggered||[];
      if(careerState.specialEventsTriggered.includes('ie30-cheat-rumor'))return false;
      if(state.role!=='长枪输出'||careerState.careerYears>2)return false;
      if((state.locked.hitscan?.value||0)<90)return false;
      const last5=seasonState.results.slice(Math.max(0,seasonState.played-5),seasonState.played);
      return last5.length===5&&last5.every(x=>x==='win');
    }
    const _v35MarkSeasonEventDueBase=markSeasonEventDue;
    markSeasonEventDue=function(){
      if(!seasonState.currentEvent&&v35Ie30Eligible()){
        seasonState.specialForcedEventId='ie30-cheat-rumor';seasonState.eventDue=true;return true;
      }
      return _v35MarkSeasonEventDueBase();
    };
    const _v35ChooseSeasonEventBase=chooseSeasonEvent;
    chooseSeasonEvent=function(){
      if(seasonState.specialForcedEventId){const special=SEASON_EVENTS.find(e=>e.id===seasonState.specialForcedEventId);if(special)return special;}
      return _v35ChooseSeasonEventBase();
    };
    const _v35ResolveSeasonEventBase=resolveSeasonEvent;
    resolveSeasonEvent=function(index){
      const id=seasonState.currentEvent?.event?.id;
      _v35ResolveSeasonEventBase(index);
      if(id==='ie30-cheat-rumor'){
        careerState.specialEventsTriggered=careerState.specialEventsTriggered||[];
        if(!careerState.specialEventsTriggered.includes(id))careerState.specialEventsTriggered.push(id);
        seasonState.specialForcedEventId=null;seasonState.eventDue=false;
      }
    };
    const _v35RenderSeasonEventBase=renderSeasonEvent;
    renderSeasonEvent=function(){
      _v35RenderSeasonEventBase();
      if(seasonState.currentEvent?.event?.id==='ie30-cheat-rumor'&&seasonState.currentEvent.resolved){
        const p=document.querySelector('#seasonEventContent .season-event-result p');if(p)p.textContent=p.textContent.replaceAll('{{PLAYER}}',getPlayerName());
      }
    };
    const _v35AutoResolveSeasonEventBase=v32AutoResolveSeasonEvent;
    v32AutoResolveSeasonEvent=function(){
      // V3.8：完整赛季模拟默认不替玩家做事件选择；只有设置中主动开启后才自动处理。
      if(!gameSettings.autoSeasonEvents || !seasonState.eventDue) return false;
      const event=chooseSeasonEvent();
      if(!event) return false;
      const choice=pick(event.choices);
      applySeasonEventEffects(choice.effects);
      const summary=eventEffectBadges(choice.effects).map(x=>x.text).join('、')||'没有即时数值变化';
      seasonState.eventHistory.push({
        id:event.id,icon:event.icon,title:event.title,choice:choice.label,
        summary:`自动选择：${choice.label}${summary?` · ${summary}`:''}`,afterMatch:seasonState.played
      });
      careerState.recentEventIds=[...(careerState.recentEventIds||[]).filter(id=>id!==event.id),event.id].slice(-12);
      if(!seasonState.eventTriggeredAt.includes(seasonState.played)) seasonState.eventTriggeredAt.push(seasonState.played);
      if(event.id==='ie30-cheat-rumor'){
        careerState.specialEventsTriggered=careerState.specialEventsTriggered||[];
        if(!careerState.specialEventsTriggered.includes(event.id))careerState.specialEventsTriggered.push(event.id);
        seasonState.specialForcedEventId=null;
      }
      seasonState.eventDue=false;
      return true;
    };
    function v35SimulateWholeSeason(){
      if(seasonState.simulating||seasonState.played>=28)return;
      seasonState.simulating=true;
      if(seasonState.stageBreakPending){
        const s=seasonState.stageBreakPending;
        stageQualified(s)?simulateStagePlayoff(s):skipStageBreak(s);
        seasonState.stageBreakPending=null;
      }
      let guard=0;
      while(seasonState.played<28&&guard++<40){
        v32SilentRegularGame();
        const boundary={7:1,14:2,21:3}[seasonState.played];

        // 默认在任何关键事件处停下。开启设置后，v32SilentRegularGame 会自动完成选择并继续。
        if(seasonState.eventDue){
          if(boundary&&!seasonState.stageProcessed.includes(boundary))seasonState.stageBreakPending=boundary;
          seasonState.simulating=false;
          seasonState.resumeWholeAfterEvent=true;
          document.getElementById('seasonSimNote').textContent='模拟在关键事件处暂停。处理完事件后会继续模拟剩余赛季。';
          renderSeason();
          setTimeout(openScheduledSeasonEvent,80);
          return;
        }

        if(boundary&&!seasonState.stageProcessed.includes(boundary)){
          seasonState.stageBreakPending=boundary;
          if(stageQualified(boundary))simulateStagePlayoff(boundary);else skipStageBreak(boundary);
          seasonState.stageBreakPending=null;
        }
      }
      seasonState.simulating=false;
      seasonState.stageBreakPending=null;
      seasonState.resumeWholeAfterEvent=false;
      document.getElementById('seasonSimNote').textContent=`✓ 已模拟完整常规赛：${seasonState.wins}胜${seasonState.losses}负。前三个Stage的阶段赛资格也已同步处理。`;
      renderSeason();
      window.scrollTo({top:0,behavior:'smooth'});
    }
    const v35FullSimBtn=document.getElementById('fullSimSeasonBtn');
    if(v35FullSimBtn)v35FullSimBtn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();v35SimulateWholeSeason();},true);

    // 4) 玩家季后赛出局后，后台继续把剩余双败赛程模拟到总决赛，并展示冠亚军。
    const _v35SyncDoubleElimBase=syncDoubleElimBracket;
    syncDoubleElimBracket=function(completedOrder=null){
      _v35SyncDoubleElimBase(completedOrder);
      if(playoffState.round==='eliminated'){
        advanceBracketAI(6);
        playoffState.postElimFinished=!!getBracketMatch('G1')?.result;
        if(playoffState.postElimFinished)resolveFinalsMVP();
      }
    };
    const _v35RenderPlayoffsBase=renderPlayoffs;
    renderPlayoffs=function(){
      _v35RenderPlayoffsBase();
      if(playoffState.round==='eliminated'){
        const grand=getBracketMatch('G1');
        if(grand?.result){
          const winner=grand.result.winner,loser=grand.result.loser;
          const winnerScore=grand.result.teamA.name===winner.name?grand.result.scoreA:grand.result.scoreB;
          const loserScore=grand.result.teamA.name===loser.name?grand.result.scoreA:grand.result.scoreB;
          const banner=document.querySelector('#playoffCompleteArea .playoff-result-banner');
          if(banner&&!banner.querySelector('.playoff-after-elim'))banner.insertAdjacentHTML('beforeend',`<div class="playoff-after-elim"><strong>🏆 后续赛果：${winner.name} 夺冠 · ${loser.name} 亚军</strong><span>总决赛 ${winnerScore}:${loserScore}。你已经出局，但这个赛季并没有随着你的比赛结束而停止。</span></div>`);
          const desc=document.getElementById('playoffNextDesc');if(desc)desc.textContent='你的季后赛已经结束；剩余对局已模拟至总决赛，最终冠亚军结果如下。';
        }
      }
    };

    // 5) Stage季后赛节点直接嵌入常规赛赛程卡顶部，不再与赛程分家。
    const _v35RenderSeasonBase=renderSeason;
    renderSeason=function(){
      document.querySelectorAll('#seasonScreen .stage-break-card.v35-inline-stage').forEach(node=>node.remove());
      _v35RenderSeasonBase();
      const card=document.querySelector('#seasonCompleteArea .stage-break-card');
      const track=document.querySelector('#seasonScreen .season-track-card');
      if(card&&track){card.classList.add('v35-inline-stage');track.insertBefore(card,track.firstChild);}
    };

    // 新角色重开时清理一次性特殊事件记录。
    const _v35ResetBuildOnlyBase=resetBuildOnly;
    resetBuildOnly=function(){_v35ResetBuildOnlyBase();delete careerState.specialEventsTriggered;delete seasonState.specialForcedEventId;};




