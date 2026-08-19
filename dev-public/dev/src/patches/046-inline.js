
/* ===== Public Beta 1.0 RC1 · P0/P1 release hardening ===== */
(function(){
  const RELEASE='Public Beta 1.0 RC1';
  window.__OWL_PUBLIC_BETA_100_QA=window.__OWL_PUBLIC_BETA_091_QA;

  // P1：2022年度季后赛：12队双败。5-12号种子先打首轮，前4号种子轮空到胜者组第二轮。
  // C1-C4 表示首轮结束后的“选对手”槽：1-3号种子依次拿剩余最低种子，4号种子接最后一队。
  const V100_PLAYOFF_2022=[
    {id:'R1A',lane:'upper',stage:'胜者组首轮',order:1,target:3,sources:['S5','S12']},{id:'R1B',lane:'upper',stage:'胜者组首轮',order:1,target:3,sources:['S6','S11']},
    {id:'R1C',lane:'upper',stage:'胜者组首轮',order:1,target:3,sources:['S7','S10']},{id:'R1D',lane:'upper',stage:'胜者组首轮',order:1,target:3,sources:['S8','S9']},
    {id:'U1',lane:'upper',stage:'胜者组第二轮',order:2,target:3,sources:['S1','C1']},{id:'U2',lane:'upper',stage:'胜者组第二轮',order:2,target:3,sources:['S2','C2']},
    {id:'U3',lane:'upper',stage:'胜者组第二轮',order:2,target:3,sources:['S3','C3']},{id:'U4',lane:'upper',stage:'胜者组第二轮',order:2,target:3,sources:['S4','C4']},
    {id:'L1',lane:'lower',stage:'败者组首轮',order:3,target:3,sources:['L:R1A','L:U3']},{id:'L2',lane:'lower',stage:'败者组首轮',order:3,target:3,sources:['L:R1B','L:U4']},
    {id:'L3',lane:'lower',stage:'败者组首轮',order:3,target:3,sources:['L:R1C','L:U1']},{id:'L4',lane:'lower',stage:'败者组首轮',order:3,target:3,sources:['L:R1D','L:U2']},
    {id:'U5',lane:'upper',stage:'胜者组第三轮',order:3,target:3,sources:['W:U1','W:U2']},{id:'U6',lane:'upper',stage:'胜者组第三轮',order:3,target:3,sources:['W:U3','W:U4']},
    {id:'L5',lane:'lower',stage:'败者组第二轮',order:4,target:3,sources:['W:L1','W:L2']},{id:'L6',lane:'lower',stage:'败者组第二轮',order:4,target:3,sources:['W:L3','W:L4']},
    {id:'L7',lane:'lower',stage:'败者组第三轮',order:5,target:3,sources:['W:L5','L:U6']},{id:'L8',lane:'lower',stage:'败者组第三轮',order:5,target:3,sources:['W:L6','L:U5']},
    {id:'U7',lane:'upper',stage:'胜者组决赛',order:4,target:3,sources:['W:U5','W:U6']},{id:'L9',lane:'lower',stage:'败者组第四轮',order:6,target:3,sources:['W:L7','W:L8']},
    {id:'L10',lane:'lower',stage:'败者组决赛',order:7,target:3,sources:['W:L9','L:U7']},{id:'G1',lane:'grand',stage:'总决赛',order:8,target:4,sources:['W:U7','W:L10']}
  ];
  function v100ChoiceWinner2022(slot){
    const first=['R1A','R1B','R1C','R1D'].map(id=>getBracketMatch(id)?.result?.winner).filter(Boolean);
    if(first.length<4)return null;
    const ordered=[...first].sort((a,b)=>(teamSeed(b)||99)-(teamSeed(a)||99));
    return ordered[Math.max(0,Math.min(3,Number(slot)-1))]||null;
  }
  const _v100ResolveBracketSource=resolveBracketSource;
  resolveBracketSource=function(source){
    if(Number(careerState.seasonYear)===2022&&/^C[1-4]$/.test(String(source||'')))return v100ChoiceWinner2022(Number(String(source).slice(1)));
    return _v100ResolveBracketSource(source);
  };

  // P1：2023年度季后赛采用“两组四队双败 -> 四强单败”，不再套用普通八队全局双败。
  const V100_PLAYOFF_2023=[
    {id:'A1',lane:'upper',stage:'A组首轮',order:1,target:3,sources:['S1','S8']},{id:'A2',lane:'upper',stage:'A组首轮',order:1,target:3,sources:['S4','S5']},
    {id:'B1',lane:'upper',stage:'B组首轮',order:1,target:3,sources:['S2','S7']},{id:'B2',lane:'upper',stage:'B组首轮',order:1,target:3,sources:['S3','S6']},
    {id:'A3',lane:'upper',stage:'A组胜者战',order:2,target:3,sources:['W:A1','W:A2']},{id:'A4',lane:'lower',stage:'A组败者战',order:2,target:3,sources:['L:A1','L:A2']},
    {id:'B3',lane:'upper',stage:'B组胜者战',order:2,target:3,sources:['W:B1','W:B2']},{id:'B4',lane:'lower',stage:'B组败者战',order:2,target:3,sources:['L:B1','L:B2']},
    {id:'A5',lane:'lower',stage:'A组晋级战',order:3,target:3,sources:['L:A3','W:A4']},{id:'B5',lane:'lower',stage:'B组晋级战',order:3,target:3,sources:['L:B3','W:B4']},
    {id:'F1',lane:'upper',stage:'季后赛半决赛',order:4,target:3,sources:['W:A3','W:B5']},{id:'F2',lane:'upper',stage:'季后赛半决赛',order:4,target:3,sources:['W:B3','W:A5']},
    {id:'G1',lane:'grand',stage:'总决赛',order:5,target:4,sources:['W:F1','W:F2']}
  ];
  const _v100SetupPlayoffs=setupPlayoffs;
  setupPlayoffs=function(){
    const year=Number(careerState.seasonYear);
    if(year===2022){
      resetPlayoffState();playoffState.active=true;playoffState.seed=clamp(careerState.postseasonSeed||estimateSeasonRank(),1,12);
      const others=shuffle(v50ActiveTeams().filter(t=>t.name!==careerState.team?.name)).slice(0,11),seeds=Array(12).fill(null);seeds[playoffState.seed-1]=careerState.team;let oi=0;for(let i=0;i<12;i++)if(!seeds[i])seeds[i]=others[oi++];
      playoffState.teams=seeds;playoffState.matches=V100_PLAYOFF_2022.map(x=>({...x,result:null}));playoffState.v772BracketExpanded=false;
      // 前4号种子有首轮Bye；若玩家在前4，先只模拟胜者组首轮以生成其对手。
      advanceBracketAI(1);syncDoubleElimBracket(null);renderPlayoffs();return;
    }
    if(year!==2023)return _v100SetupPlayoffs();
    resetPlayoffState();playoffState.active=true;playoffState.seed=clamp(careerState.postseasonSeed||estimateSeasonRank(),1,8);
    const others=shuffle(v50ActiveTeams().filter(t=>t.name!==careerState.team?.name)).slice(0,7),seeds=Array(8).fill(null);seeds[playoffState.seed-1]=careerState.team;let oi=0;for(let i=0;i<8;i++)if(!seeds[i])seeds[i]=others[oi++];
    playoffState.teams=seeds;playoffState.matches=V100_PLAYOFF_2023.map(x=>({...x,result:null}));playoffState.v772BracketExpanded=false;syncDoubleElimBracket(null);renderPlayoffs();
  };
  const _v100Sync=syncDoubleElimBracket;
  syncDoubleElimBracket=function(completedOrder=null){
    const year=Number(careerState.seasonYear);
    if(year===2022){
      if(completedOrder!=null)advanceBracketAI(completedOrder);
      const grand=getBracketMatch('G1');
      if(grand?.result&&(grand.result.winner.name===careerState.team.name||grand.result.loser.name===careerState.team.name)){playoffState.nextMatchId=null;playoffState.round=grand.result.winner.name===careerState.team.name?'champion':'runnerup';return;}
      if(countPlayerLosses()>=2){playoffState.nextMatchId=null;playoffState.round='eliminated';advanceBracketAI(8);playoffState.postElimFinished=!!getBracketMatch('G1')?.result;if(playoffState.postElimFinished)resolveFinalsMVP();return;}
      let next=findPlayerNextMatch();
      if(!next){const start=completedOrder==null?1:completedOrder+1;for(let order=start;order<=8&&!next;order++){advanceBracketAI(order);next=findPlayerNextMatch();}}
      if(next){playoffState.nextMatchId=next.id;playoffState.round=next.id==='G1'?'final':'active';return;}playoffState.nextMatchId=null;playoffState.round='active';return;
    }
    if(year!==2023)return _v100Sync(completedOrder);
    if(completedOrder!=null)advanceBracketAI(completedOrder);
    const grand=getBracketMatch('G1');
    if(grand?.result&&(grand.result.winner.name===careerState.team.name||grand.result.loser.name===careerState.team.name)){playoffState.nextMatchId=null;playoffState.round=grand.result.winner.name===careerState.team.name?'champion':'runnerup';return;}
    const semiLoss=playoffState.matches.some(m=>['F1','F2'].includes(m.id)&&m.result?.loser?.name===careerState.team?.name);
    if(countPlayerLosses()>=2||semiLoss){playoffState.nextMatchId=null;playoffState.round='eliminated';advanceBracketAI(5);playoffState.postElimFinished=!!getBracketMatch('G1')?.result;if(playoffState.postElimFinished)resolveFinalsMVP();return;}
    let next=findPlayerNextMatch();if(!next&&completedOrder!=null){for(let order=completedOrder+1;order<=5&&!next;order++){advanceBracketAI(order);next=findPlayerNextMatch();}}
    if(next){playoffState.nextMatchId=next.id;playoffState.round=next.id==='G1'?'final':'active';return;}playoffState.nextMatchId=null;playoffState.round='active';
  };
  const _v100ResultLabel=getPlayoffResultLabel;
  getPlayoffResultLabel=function(){
    const y=Number(careerState.seasonYear),last=[...playoffState.results].reverse().find(r=>!r.won);
    if(y===2022&&playoffState.round==='eliminated'){
      if(['L1','L2','L3','L4'].includes(last?.matchId))return '季后赛9-12名';
      if(['L5','L6'].includes(last?.matchId))return '季后赛7-8名';
      if(['L7','L8'].includes(last?.matchId))return '季后赛5-6名';
      if(last?.matchId==='L9')return '季后赛四强';if(last?.matchId==='L10')return '季后赛季军';
    }
    if(y===2023&&playoffState.round==='eliminated')return ['F1','F2'].includes(last?.matchId)?'季后赛四强':'季后赛八强';
    return _v100ResultLabel();
  };
  const _v100RenderPlayoffs=renderPlayoffs;
  renderPlayoffs=function(){
    const out=_v100RenderPlayoffs(),year=Number(careerState.seasonYear);
    const host=document.getElementById('playoffBracket'),seed=document.getElementById('playoffSeedText'),cur=currentPlayoffMatch(),k=document.getElementById('playoffNextKicker');
    if(year===2022){
      if(host)host.innerHTML=`<div class="double-bracket v100-2022-bracket"><section class="double-lane"><div class="double-lane-head"><h4>⬆️ 胜者组 · 12队</h4><span>前4号种子首轮轮空</span></div><div class="double-rounds">${renderDoubleRound('首轮 · 5-12号种子 · FT3',['R1A','R1B','R1C','R1D'])}${renderDoubleRound('第二轮 · 前4加入 / 选对手 · FT3',['U1','U2','U3','U4'])}${renderDoubleRound('第三轮 · FT3',['U5','U6'])}${renderDoubleRound('胜者组决赛 · FT3',['U7'])}</div></section><section class="double-lane"><div class="double-lane-head"><h4>⬇️ 败者组</h4><span>第二次失利才会出局</span></div><div class="double-rounds">${renderDoubleRound('败者组首轮 · FT3',['L1','L2','L3','L4'])}${renderDoubleRound('败者组第二轮 · FT3',['L5','L6'])}${renderDoubleRound('败者组第三轮 · FT3',['L7','L8'])}${renderDoubleRound('败者组第四轮 · FT3',['L9'])}${renderDoubleRound('败者组决赛 · FT3',['L10'])}</div></section><section class="double-lane"><div class="double-lane-head"><h4>🏆 GRAND FINAL</h4><span>FT4</span></div><div class="double-rounds">${renderDoubleRound('总决赛 · FT4',['G1'])}</div></section></div>`;
      if(seed)seed.innerHTML=`年度季后赛 · 12队双败 · #${playoffState.seed}种子 <span class="bracket-loss-dot">当前 ${countPlayerLosses()} 负</span>`;
      if(k&&cur)k.textContent=cur.id==='G1'?'GRAND FINAL · FT4':`${cur.stage.toUpperCase()} · FT3`;return out;
    }
    if(year!==2023)return out;
    if(host)host.innerHTML=`<div class="double-bracket v100-2023-bracket"><section class="double-lane"><div class="double-lane-head"><h4>🅰️ A组 · 四队双败</h4><span>两队晋级四强</span></div><div class="double-rounds">${renderDoubleRound('A组首轮 · FT3',['A1','A2'])}${renderDoubleRound('A组胜者/败者战 · FT3',['A3','A4'])}${renderDoubleRound('A组晋级战 · FT3',['A5'])}</div></section><section class="double-lane"><div class="double-lane-head"><h4>🅱️ B组 · 四队双败</h4><span>两队晋级四强</span></div><div class="double-rounds">${renderDoubleRound('B组首轮 · FT3',['B1','B2'])}${renderDoubleRound('B组胜者/败者战 · FT3',['B3','B4'])}${renderDoubleRound('B组晋级战 · FT3',['B5'])}</div></section><section class="double-lane"><div class="double-lane-head"><h4>⚔️ 四强淘汰赛</h4><span>半决赛单败 · 总决赛FT4</span></div><div class="double-rounds">${renderDoubleRound('半决赛 · FT3',['F1','F2'])}${renderDoubleRound('GRAND FINAL · FT4',['G1'])}</div></section></div>`;
    if(seed)seed.innerHTML=`年度季后赛 · 8队 · 两组双败 → 四强单败 <span class="bracket-loss-dot">组内 ${countPlayerLosses()} 负</span>`;
    if(k&&cur)k.textContent=cur.id==='G1'?'GRAND FINAL · FT4':['F1','F2'].includes(cur.id)?'FINAL FOUR · FT3':`${cur.stage.includes('A组')?'GROUP A':'GROUP B'} · FT3`;
    return out;
  };

  // P1：扩充职业生涯事件池。不是再塞一堆“+3信任”的换皮弹窗，而是补不同阶段会遇到的真实职业选择。
  const V100_EXTRA_EVENTS=[
    {
      id:'v100-rival-callout',icon:'🥊',kicker:'RIVALRY · 对手喊话',title:'老对手赛前公开点名你',eventTags:['rivalry','media'],weight:1.25,minCareer:2,
      text:'一名多次交手的对位选手在采访里直说：“他们最麻烦的就是你，但我们已经知道怎么限制你。”这句话很快被剪成短视频，赛前气氛瞬间多了点火药味。',
      choices:[
        {label:'公开回敬',desc:'把压力变成话题，也把下一场变成必须兑现的赌注。',effects:{popularity:10,nextMatchBonus:1.2,condition:-3},outcome:'采访区终于有了想要的标题。现在唯一的问题，是比赛结果也会永久跟着这个标题。'},
        {label:'只在比赛里回答',desc:'保持专注，提高教练信任。',effects:{coachTrust:6,nextRatingBonus:.14,condition:3},outcome:'你没陪媒体加戏。教练很满意，剪辑账号则明显有些失望。'},
        {label:'私下和对手开玩笑',desc:'缓和敌意，保持职业圈关系。',effects:{teammateBond:3,popularity:4,condition:5},outcome:'公开场合剑拔弩张，私聊里却只是两个天天加班的人互相吐槽。职业电竞有时没那么戏剧化。'}
      ]
    },
    {
      id:'v100-strategy-disagreement',icon:'🧩',kicker:'TACTICS · 战术分歧',title:'你和教练对版本答案意见相反',eventTags:['coach','tactics'],weight:1.3,minCareer:1,
      text:'训练赛里，教练坚持一套数据上更稳定的阵容，但你认为它把自己的优势完全磨平。连续两天效果都不好后，教练把决定权丢回给你：那你想怎么试？',
      choices:[
        {label:'拿数据证明自己的方案',desc:'承担额外复盘工作，争取更大的战术话语权。',effects:{awarenessAttr:1,coachTrust:5,condition:-6,nextMatchBonus:.7},outcome:'你没拿“我感觉”当论据，而是带着录像和数据回来。教练没完全认输，但至少愿意再试一次。'},
        {label:'执行教练方案',desc:'牺牲一点个人舒适区，换取体系稳定。',effects:{coachTrust:8,teammateBond:5,nextRatingBonus:-.06},outcome:'你按体系做了该做的事。数据未必漂亮，但至少训练赛终于不像五个人各写一份版本答案。'},
        {label:'提出折中阵容',desc:'兼顾个人发挥和整体体系。',effects:{coachTrust:4,teammateBond:4,nextMatchBonus:.45},outcome:'没有谁完全满意，反而说明这方案大概能用。'}
      ]
    },
    {
      id:'v100-burnout-week',icon:'🪫',kicker:'MENTAL · 赛程疲劳',title:'你开始对打开训练服都感到厌烦',eventTags:['health','mental'],weight:1.15,minCareer:2,
      text:'不是伤病，也不是连败。只是连续几个月训练、比赛、复盘以后，你发现自己坐到电脑前时第一反应不再是兴奋，而是“怎么又来”。',
      choices:[
        {label:'主动申请减量一周',desc:'明显恢复状态，但训练参与度下降。',effects:{condition:17,coachTrust:1,nextMatchBonus:-.35},outcome:'这一周你少打了不少训练赛。奇怪的是，回来以后你反而重新记得自己为什么想打职业。'},
        {label:'换训练内容调节',desc:'用英雄池练习代替纯强度堆叠。',effects:{poolAttr:1,condition:5,coachTrust:3},outcome:'你没停练，只是终于不再把每一分钟都练成同一种疲惫。'},
        {label:'继续咬牙顶满',desc:'保持训练量，短期状态进一步透支。',effects:{condition:-13,coachTrust:5,nextMatchBonus:.8},outcome:'训练计划一格没少。至于人是不是还剩一整格，那就不好说了。'}
      ]
    },
    {
      id:'v100-rookie-social-pressure',icon:'📱',kicker:'ROOKIE · 舆论压力',title:'第一次成为评论区的集中火力',eventTags:['rookie','media'],weight:1.8,minAge:16,maxAge:20,maxCareer:2,
      text:'一场发挥失常后，你第一次发现自己的名字占满了论坛首页。有人认真分析，也有人只是需要一个今天可以骂的人。年轻选手的成人礼，有时就是被陌生人集体写赛后总结。',
      choices:[
        {label:'彻底关闭社交媒体',desc:'快速恢复精神状态，暂时减少曝光。',effects:{condition:12,popularity:-3,coachTrust:3},outcome:'手机终于安静了。世界并没有因为你不看评论而停止转动——这消息其实挺好。'},
        {label:'只看教练整理的反馈',desc:'把有效建议和噪音分开。',effects:{awarenessAttr:1,coachTrust:6,condition:3},outcome:'你第一次学会：不是所有批评都值得反驳，也不是所有批评都该忽略。'},
        {label:'直播里正面回应',desc:'获得关注，但会继续消耗状态。',effects:{popularity:12,condition:-7,teammateBond:-1},outcome:'你把自己的想法说了出来。有人改观，也有人只是获得了第二轮素材。互联网非常勤奋。'}
      ]
    },
    {
      id:'v100-veteran-role-cut',icon:'🪑',kicker:'VETERAN · 轮换变化',title:'教练准备减少你的常规赛出场',eventTags:['veteran','roster'],weight:1.7,minAge:26,minCareer:5,
      text:'教练很直接：你的经验仍然重要，但年轻替补需要更多常规赛时间。你不会立刻失去位置，却第一次被要求接受“关键比赛优先、平时轮换”的角色。',
      choices:[
        {label:'接受轮换并带新人',desc:'强化团队价值，保留更多身体状态。',effects:{condition:12,teammateBond:9,coachTrust:7},outcome:'你的比赛少了一点，影响力却没跟着一起消失。老将最烦人的地方，就是有些价值根本不写在首发名单上。'},
        {label:'要求凭表现竞争',desc:'维持首发野心，以训练负荷换机会。',effects:{condition:-8,nextMatchBonus:1.4,coachTrust:1},outcome:'你拒绝提前进入养老模式。年轻人得到的第一堂课，是位置从来不会因为年龄自动让出来。'},
        {label:'开始考虑下一站',desc:'降低当前队内投入，提高个人关注。',effects:{popularity:7,teammateBond:-5,coachTrust:-5,condition:4},outcome:'你没有立刻做决定，但经纪人的电话明显变多了。更衣室也不是完全听不见风声。'}
      ]
    },
    {
      id:'v100-team-financial-cut',icon:'💼',kicker:'FRONT OFFICE · 阵容调整',title:'管理层暗示休赛期预算会收紧',eventTags:['contract','team'],weight:1.05,minCareer:2,
      text:'管理层没有公开说要重建，只是开始频繁使用“成本效率”“阵容灵活性”这些危险词。队友们都知道，这通常意味着下个休赛期不会人人留下。',
      choices:[
        {label:'主动稳定更衣室',desc:'提升团队关系和领导评价。',effects:{teammateBond:9,coachTrust:5,condition:-3},outcome:'你没法替管理层承诺合同，但至少阻止了训练室提前变成求职网站。'},
        {label:'让经纪人提前摸市场',desc:'提高个人市场热度，但损伤队内信任。',effects:{popularity:8,coachTrust:-4,teammateBond:-3},outcome:'你开始准备最坏情况。职业生涯不是童话，提前看下一家公司也不算背叛，只是大家通常不爱听。'},
        {label:'完全不参与讨论',desc:'保持竞技状态，把问题留到休赛期。',effects:{condition:8,coachTrust:1},outcome:'你选择先把剩下的比赛打完。至少记分牌不会问队伍明年有多少预算。'}
      ]
    },
    {
      id:'v100-map-specialist',icon:'🗺️',kicker:'IDENTITY · 地图专长',title:'教练想把一张关键地图交给你主导',eventTags:['prime','tactics'],weight:1.15,minAge:20,minCareer:2,
      text:'分析组发现你在某类地图上的决策数据长期领先全队。教练想让你负责这张地图的部分赛前方案，这意味着更多话语权，也意味着输了以后没有“战术不是我定的”可用。',
      choices:[
        {label:'接过地图主导权',desc:'强化意识、信任和下一场发挥。',effects:{awarenessAttr:1,coachTrust:7,nextMatchBonus:.8,condition:-4},outcome:'你第一次不只是背战术，而是参与写战术。看别人执行自己的方案，比自己执行别人的更容易心率升高。'},
        {label:'和队长共同负责',desc:'稳妥增加责任并强化团队关系。',effects:{coachTrust:4,teammateBond:6,nextMatchBonus:.45},outcome:'责任被拆成两份，沟通也因此多了一层保险。职业比赛不一定需要每件事都有唯一主角。'},
        {label:'暂时只提供建议',desc:'保留个人精力，放弃部分领导机会。',effects:{condition:7,coachTrust:-2,nextRatingBonus:.08},outcome:'你继续做最熟悉的执行者。方案里仍有你的痕迹，只是输的时候不用第一个看教练脸色。'}
      ]
    },
    {
      id:'v100-retirement-rumor',icon:'📰',kicker:'LEGACY · 退役传闻',title:'媒体开始替你安排退役时间',eventTags:['veteran','media'],weight:1.35,minAge:28,minCareer:6,
      text:'你还没说过要退役，报道却已经开始用“最后一舞”“或许是生涯最后一年”做标题。记者甚至问你有没有想过退役后的工作，仿佛下一场比赛已经不重要了。',
      choices:[
        {label:'明确表示还会继续打',desc:'强化竞争状态和公众话题。',effects:{popularity:8,nextMatchBonus:1.1,condition:-2},outcome:'你把“最后一舞”四个字退回给编辑部。下一场如果打爆，标题自然会自己改。'},
        {label:'不承诺任何时间表',desc:'保持灵活，减少额外压力。',effects:{condition:7,coachTrust:3,popularity:2},outcome:'你没有给出他们想要的日期。职业生涯什么时候结束，至少还没轮到标题编辑决定。'},
        {label:'开始认真规划退役后',desc:'降低竞技焦虑，增加一点当下分心。',effects:{condition:9,nextMatchBonus:-.3,teammateBond:4},outcome:'你第一次允许自己想象比赛之外的生活。奇怪的是，想过以后，下一场反而没那么像世界末日。'}
      ]
    }
  ];
  V100_EXTRA_EVENTS.forEach(e=>{if(!SEASON_EVENTS.some(x=>x.id===e.id))SEASON_EVENTS.push(e)});

  // P1：跨赛季事件冷却。普通事件两年内不原样复读；强制剧情不受影响。
  careerState.eventCareerHistory=careerState.eventCareerHistory||{};
  const _v100Choose=chooseSeasonEvent;
  chooseSeasonEvent=function(){
    if(seasonState.specialForcedEventId)return _v100Choose();
    const year=Number(careerState.seasonYear||2019),hist=careerState.eventCareerHistory||{};
    let last=null;
    for(let i=0;i<10;i++){
      const e=_v100Choose(); if(!e)return e; last=e;
      const seen=Number(hist[e.id]||0);
      if(!seen||year-seen>=3)return e;
    }
    return last;
  };
  function v100RememberEvent(id){if(!id||String(id).startsWith('injury-')||String(id).startsWith('trade-'))return;careerState.eventCareerHistory=careerState.eventCareerHistory||{};careerState.eventCareerHistory[id]=Number(careerState.seasonYear||2019);}
  const _v100Resolve=resolveSeasonEvent;
  resolveSeasonEvent=function(index){const id=seasonState.currentEvent?.event?.id;const out=_v100Resolve(index);v100RememberEvent(id);return out;};
  if(typeof v32AutoResolveSeasonEvent==='function'){
    const _v100Auto=v32AutoResolveSeasonEvent;
    v32AutoResolveSeasonEvent=function(){const before=seasonState.eventHistory?.length||0;const out=_v100Auto();if((seasonState.eventHistory?.length||0)>before)v100RememberEvent(seasonState.eventHistory.at(-1)?.id);return out;};
  }

  // P1：年份规则说明只保留真正会影响玩家决策的那一句，别让UI写论文。
  const V100_FORMAT_NOTES={
    2019:'4个Stage；前三个Stage有阶段季后赛，年度季后赛另算。',
    2020:'疫情赛季按地区路线模拟 May Melee / Summer Showdown / Countdown Cup。',
    2021:'4个锦标赛循环；常规赛胜场与锦标赛 League Points 共同决定季后赛席位。',
    2022:'24场；前三阶段赛事提供 League Points，Countdown阶段连接地区Play-Ins与12队季后赛。',
    2023:'Spring：西部前2直通Midseason Madness、其余晋级队走Knockouts；年度季后赛为8队。'
  };
  function v100RouteNote(){
    const y=Number(careerState.seasonYear||0),host=document.getElementById('seasonLeagueText');if(!host||!V100_FORMAT_NOTES[y])return;
    let note=document.getElementById('v100FormatNote');if(!note){note=document.createElement('div');note.id='v100FormatNote';note.className='v100-format-note';host.parentElement?.appendChild(note);}
    let txt=V100_FORMAT_NOTES[y];
    if(y===2023&&seasonState.stageBreakPending===1){const row=buildStageTable(1).find(r=>r.isUser),rr=row?.regionRank||99,reg=row?.region;txt=reg==='West'?(rr<=2?'Spring西部前2：直通 Midseason Madness。':'Spring西部：进入 Knockouts，争夺 Midseason Madness 席位。'):'Spring东部：OWL队伍进入混合 Knockouts，争夺 Midseason Madness 席位。';}
    note.textContent=txt;
  }
  const _v100RenderSeason=renderSeason;
  renderSeason=function(){const out=_v100RenderSeason();v100RouteNote();return out;};

  // P0：可供发布前自动化调用的流程诊断。
  function criticalButtonReport(){
    const active=document.querySelector('.screen.active'),buttons=[...(active?.querySelectorAll('button')||[])];
    return buttons.filter(b=>!b.disabled&&/继续|进入|确认|下一|结算|签约|开始|比赛|模拟|退役|休赛期/.test(b.textContent||'')).map(b=>({id:b.id||null,text:(b.textContent||'').trim().slice(0,40),connected:b.isConnected,visible:!!(b.offsetWidth||b.offsetHeight||b.getClientRects().length)}));
  }
  window.__OWL_V100_QA={
    version:RELEASE,
    flow:()=>({screen:document.querySelector('.screen.active')?.id||null,year:Number(careerState.seasonYear||0),age:Number(careerState.age||0),played:Number(seasonState.played||0),total:Number(seasonState.total||0),stageBreak:seasonState.stageBreakPending||null,buttons:criticalButtonReport(),duplicateIds:[...document.querySelectorAll('[id]')].map(x=>x.id).filter((id,i,a)=>a.indexOf(id)!==i)}),
    age:()=>window.__OWL_V62_QA?.birthCoverage?.()||null,
    eventHistory:()=>({...careerState.eventCareerHistory}),
    formatNotes:V100_FORMAT_NOTES
  };

  if(!document.getElementById('v100Style')){const st=document.createElement('style');st.id='v100Style';st.textContent=`
    .v100-format-note{margin-top:5px;font-size:10px;line-height:1.5;color:var(--muted);max-width:760px}
    @media(max-width:720px){.v100-format-note{font-size:9px}}
  `;document.head.appendChild(st);}
  try{if(document.getElementById('seasonScreen')?.classList.contains('active'))v100RouteNote();}catch(_){}
})();
