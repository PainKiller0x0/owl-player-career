
/* ===== V7.8.0 · Career Story Layer / historical-inspiration memories ===== */
(function(){
  const VER='V7.8.0';
  const clamp78=(n,a,b)=>Math.max(a,Math.min(b,n));
  function y78(){return Number(careerState.seasonYear||2019)}
  function mems78(){careerState.careerMemories=careerState.careerMemories||[];return careerState.careerMemories}
  function has78(key){return mems78().some(x=>x.key===key)}
  function hasPrefix78(prefix){return mems78().some(x=>String(x.key||'').startsWith(prefix))}
  function moments78(){seasonState.v78Moments=seasonState.v78Moments||[];return seasonState.v78Moments}
  function addMoment78(icon,title,text,importance=2,rec=null,voice=''){
    const m={icon,title,text,importance,year:y78(),stage:rec?.stage||0,matchNo:rec?.matchNo||Number(seasonState.played||0),voice};
    const list=moments78();if(list.some(x=>x.title===m.title&&x.matchNo===m.matchNo&&x.year===m.year))return null;list.push(m);return m;
  }
  function addMem78(key,icon,title,text,weight=2,rec=null,voice=''){
    if(has78(key))return null;
    mems78().push({key,icon,title,text,weight,year:y78(),age:careerState.age,team:careerState.team?.name||'—'});
    addMoment78(icon,title,text,Math.max(2,weight),rec,voice);return true;
  }
  function dedupHistory78(){
    const map=new Map();for(const r of careerState.v75StoryHistory||[]){const k=`${r.year}-${r.matchNo}`;map.set(k,r)}return [...map.values()].sort((a,b)=>a.year-b.year||a.matchNo-b.matchNo);
  }
  function recent78(n=10){return dedupHistory78().slice(-n)}
  function streakVs78(opponent,n=4){return dedupHistory78().filter(x=>x.opponent===opponent).slice(-Math.max(1,Number(n)||4))}
  function hash78(s){let h=0;for(const c of String(s||''))h=((h<<5)-h+c.charCodeAt(0))|0;return Math.abs(h)}
  function nickname78(){const pools={'坦克':['城墙','铁门','推土机'],'长枪输出':['大老板','警长','冷枪'],'弹道输出':['鬼影','飞刀','风暴'],'输出支援':['火线医生','炮台','电池'],'战术支援':['司令塔','节拍器','指挥官']};const a=pools[state.role]||['大心脏','怪物','关键先生'];return a[hash78(getPlayerName())%a.length]}
  function detail78(){
    const results=matchState?.results||[],all=matchState?.ratings?.home||{},user=all['career-player']||[];let gap=null;
    if(user.length){const u=user.reduce((a,b)=>a+b,0)/user.length,others=[];Object.entries(all).forEach(([id,vals])=>{if(id!=='career-player')(vals||[]).forEach(v=>others.push(Number(v)||0))});if(others.length)gap=Number((u-others.reduce((a,b)=>a+b,0)/others.length).toFixed(2))}
    return{teamGap:gap,mapSequence:results.map(x=>x.winner),maps:results.map(x=>({name:x.mapName||x.map?.name||'未知地图',won:x.winner==='home'}))};
  }
  function updateMapRecords78(detail,rec){
    careerState.v78MapRecords=careerState.v78MapRecords||{};
    for(const row of detail?.maps||[]){if(!row.name||row.name==='未知地图')continue;const r=careerState.v78MapRecords[row.name]||(careerState.v78MapRecords[row.name]={played:0,wins:0});r.played++;if(row.won)r.wins++;if(r.wins>=5&&r.played>=6&&r.wins/r.played>=.8)addMem78(`map-garden:${row.name}`,'🏟️',`${row.name}后花园`,`你在${row.name}已经打出 ${r.wins}-${r.played-r.wins} 的长期战绩。社区开始默认：来到这里，就得先问你同不同意。`,2.3,rec,'🏟️ 解说席：这里已经快成你的后花园了。')}
  }
  function process78(rec,detail={}){
    if(!rec||!rec.matchNo)return rec;
    // DNP 是队伍比赛，不是玩家与对手的个人交手；不上场就不生成杀手/宿敌/个人梗。
    if(Number(rec.mapsPlayed||0)<=0)return rec;
    updateMapRecords78(detail,rec);
    const avg=Number(rec.avg),validAvg=Number.isFinite(avg),recent5=recent78(5),recent6=recent78(6),recent8=recent78(8),recent10=recent78(10);
    if(!careerState.careerNickname&&validAvg&&avg>=9.2&&recent5.filter(x=>Number(x.avg)>=8.8).length>=2){const nick=nickname78();careerState.careerNickname=nick;careerState.popularity=clamp78(Number(careerState.popularity||0)+7,0,100);addMem78('caster-nickname','🎙️','解说造梗：外号诞生',`连续的爆炸表现让解说临场喊出了“${nick}”。这个称呼没有经过你同意，但社区显然已经替你同意了。`,2.5,rec,`🎙️ 解说席：“${nick}又来了！”`)}
    const gap=detail?.teamGap;if(validAvg&&avg>=9.0&&((Number.isFinite(gap)&&gap>=1.55)||(!rec.won&&avg>=9.3))){careerState.popularity=clamp78(Number(careerState.popularity||0)+5,0,100);addMem78('deadlift-carry','🏋️','一个人扛着队伍走','这轮系列赛里，你的个人表现和全队形成了肉眼可见的断层。输赢已经不是讨论重点，大家开始讨论你到底背了几个人。',2.8,rec,'🏋️ 社区热帖：“这不是Carry，这是搬家。”')}
    if(rec.hero==='源氏'&&!rec.won&&validAvg&&avg<=5.8&&!has78('blade-meme')){careerState.popularity=clamp78(Number(careerState.popularity||0)+4,0,100);careerState.coachTrust=clamp78(Number(careerState.coachTrust||0)-2,0,100);addMem78('blade-meme','🐉',`${getPlayerName()} Blade`,`你用源氏打出了一场足以进入社区黑历史的比赛。大招节奏拖得太久，评论区甚至开始拿你的ID当时间单位。`,2.7,rec,`😂 社区热帖：“一局过去了几${getPlayerName()}？”`)}
    if(has78('blade-meme')&&!has78('blade-redemption')&&rec.hero==='源氏'&&rec.won&&validAvg&&avg>=8.8)addMem78('blade-redemption','🐉','Blade还债成功',`那个被拿来当时间单位的老梗终于有了后半段：你用源氏打出${avg.toFixed(1)}评分赢下系列赛。旧截图又被翻出来了，这次评论区是在道歉。`,2.6,rec,'🎙️ 解说席：“当年那个Blade梗，今天可以还债了。”')
    const closeLoss=!rec.won&&/^(2-3|3-4)$/.test(String(rec.score||''));if(closeLoss&&!has78('objective-blunder')&&Math.random()<.07){careerState.popularity=clamp78(Number(careerState.popularity||0)+3,0,100);careerState.coachTrust=clamp78(Number(careerState.coachTrust||0)-2,0,100);addMem78('objective-blunder','🤦','忘点风波','一场原本有机会拿下的系列赛，因为最后时刻没人处理目标点留下了巨大问号。社区很快把你的ID和“9”绑在了一起。',2.7,rec,'🤦 社区热帖：“团战赢了，点呢？”')}
    if(has78('objective-blunder')&&!has78('objective-redemption')&&rec.won&&/^(3-2|4-3)$/.test(String(rec.score||'')))addMem78('objective-redemption','✅','这次记得碰点了','又是一场打到最后一图的比赛。这次目标点没有再成为主角，社区终于找到机会把旧梗反着刷。',1.8,rec,'💬 评论区：“确认过了，这次真的有人站点。”')
    const seq=detail?.mapSequence||[];if(rec.won&&seq.length>=5&&seq[0]==='away'&&seq[1]==='away'&&seq.slice(2,5).every(x=>x==='home'))addMem78('first-reverse-sweep','🔄','第一次让二追三','0:2落后时系列赛已经站在悬崖边，你们却把后面三张图全部拿了回来。',2.4,rec,'🔄 解说席：“从0比2开始，这支队伍像换了五个人。”')
    if(rec.won&&/^(3-2|4-3)$/.test(String(rec.score||''))&&validAvg&&avg>=8.8)addMem78('game5-clutch','🧊','决胜图先生','比赛拖到最后一张图时，你反而打出了最稳定的一段表现。以后再进决胜图，镜头会更愿意找你。',2.2,rec,'🧊 解说席：“比赛越晚，他越冷静。”')
    if(rec.returned&&rec.won&&validAvg&&avg>=8.5)addMem78('bench-savior','🪑','替补救世','系列赛中途你一度坐在替补席，重新登场后却直接改变了比赛方向。以后教练再看替补席，眼神会多停半秒。',2.2,rec,'🪑 社区热帖：“所以为什么不早点上他？”')
    const banProof=dedupHistory78().filter(x=>Number(x.directBans)>=2&&x.won&&!Number(x.severeBans)).slice(-8);if(banProof.length>=3&&!has78('ban-proof-reputation'))addMem78('ban-proof-reputation','🚫','Ban不完','越来越多对手把禁用资源砸在你身上，但最近三次集中针对都没有真正解决问题。你的英雄池开始成为赛前会议里最烦人的那一页。',2.8,rec,'🚫 解说席：“你可以Ban一个英雄，但你Ban不掉这个人。”')
    const heroRows=recent10.filter(x=>x.hero&&Number(x.avg)>=7.2),uniqueHeroes=[...new Set(heroRows.map(x=>x.hero))];if(uniqueHeroes.length>=4&&!has78('hero-ocean'))addMem78('hero-ocean','🌊','英雄海认证',`最近一段时间，你已经用 ${uniqueHeroes.slice(0,5).join('、')} 等不同英雄交出合格表现。“英雄池深”不再只是属性面板上的一句话。`,2.2,rec,'🌊 解说席：“阵容锁了，但他的英雄还没锁。”')
    const sixHeroes=recent6.map(x=>x.hero).filter(Boolean);if(sixHeroes.length>=5){const freq={};sixHeroes.forEach(h=>freq[h]=(freq[h]||0)+1);const top=Object.entries(freq).sort((a,b)=>b[1]-a[1])[0];if(top&&top[1]>=5&&recent6.filter(x=>Number(x.avg)>=7.6).length>=4){careerState.v78OneTrickHero=top[0];addMem78(`one-trick:${top[0]}`,'🎯',`${top[0]}绝活哥`,`连续多个系列赛，你几乎都靠${top[0]}解决问题。这个标签既是夸奖，也等于把赛前针对答案写在了黑板上。`,2.0,rec,`🎯 社区热帖：“知道他要玩${top[0]}，然后呢？”`)}}
    if(hasPrefix78('one-trick:')&&!has78('one-trick-broken')&&uniqueHeroes.length>=4&&heroRows.length>=6)addMem78('one-trick-broken','🧰','撕掉绝活哥标签','曾经所有人都知道你会掏什么；现在对手知道得越多，BP反而越难做。',2.1,rec,'🧰 解说席：“以前是绝活，现在是题库。”')
    const vs5=streakVs78(rec.opponent,5);if(vs5.length>=5&&vs5.every(x=>x.won))addMem78(`landlord:${rec.opponent}`,'🎯',`${rec.opponent}杀手`,`连续五次交手，你都击败了${rec.opponent}。这已经很难再解释成单纯手感好，社区开始直接叫你“${rec.opponent}杀手”。`,2.25,rec,'🎯 社区热帖：“五连杀，这已经不是偶然了。”');const vs4=streakVs78(rec.opponent,4);if(vs4.length>=4&&vs4.every(x=>!x.won))addMem78(`nemesis:${rec.opponent}`,'😵',`${rec.opponent}成为苦主`,`连续四次碰面都没能赢下${rec.opponent}。以后赛程表上再出现这个名字，讨论区会自动开始翻旧账。`,2.0,rec,'😵 赛前讨论：“怎么又是他们？”')
    if(rec.won&&String(rec.score)==='3-0'&&validAvg&&avg>=9.0)addMoment78('⚡','速通局',`3:0，个人评分${avg.toFixed(1)}。比赛结束得比赛前分析还快。`,1.5,rec,'⚡ 解说席：“今天不用加班。”')
    if(recent8.length>=8&&recent8.every(x=>x.won)&&!has78('eight-win-streak'))addMem78('eight-win-streak','🔥','八连胜','你所在的队伍已经连续八场没有输过。连胜开始从“状态不错”变成整个联盟都在等谁来终结。',1.8,rec,'🔥 社区热帖：“下一支受害者是谁？”')
    if(recent6.length>=3&&recent6.slice(-3).every(x=>Number(x.mapsPlayed)===0)&&rec.mapsPlayed>0&&rec.won&&validAvg&&avg>=8.4)addMem78('bench-comeback','📣','板凳尽头的反弹','连续坐了几场之后，你终于重新得到机会，而且没有浪费它。',1.8,rec,'📣 社区热帖：“他一直坐板凳到底是谁的主意？”')
    return rec;
  }

  careerState.v78ResolvedStoryEvents=careerState.v78ResolvedStoryEvents||[];const resolved78=id=>(careerState.v78ResolvedStoryEvents||[]).includes(id);
  const extras=[
    {id:'v78-nickname-interview',icon:'🎙️',kicker:'MEDIA · 外号发酵',title:'那个外号已经传开了',text:'解说席随口喊出的称呼已经被做成表情包、剪辑标题，甚至出现在了现场应援牌上。媒体问你：喜欢这个外号吗？',weight:.55,condition:()=>!!careerState.careerNickname&&!resolved78('v78-nickname-interview'),choices:[{label:'“挺好，就这么叫吧”',desc:'主动认领这个梗，让它成为个人品牌。',effects:{popularity:12,teammateBond:2},outcome:'你亲口认证以后，这个称呼彻底从解说口误升级成了你的个人标签。'},{label:'“随他们开心”',desc:'不抗拒，也不刻意经营。',effects:{popularity:5,coachTrust:2},outcome:'你没有给媒体更多戏剧性，社区却把这种无所谓的态度也做成了梗。'},{label:'“别这么叫我”',desc:'拒绝这个称呼，热度会下降，但个人边界更清晰。',effects:{popularity:-4,coachTrust:4},outcome:'你明确表示不喜欢。大多数正式场合停用了这个称呼——评论区当然没有。'}]},
    {id:'v78-one-trick-interview',icon:'🎯',kicker:'META · 绝活争议',title:'“你是不是只会这一招？”',text:'连续几轮比赛，你的招牌英雄出场率高得离谱。采访区的问题开始变得不客气：如果对手把这个英雄拿掉，你还剩什么？',weight:.62,condition:()=>hasPrefix78('one-trick:')&&!resolved78('v78-one-trick-interview'),choices:[{label:'“会这一招就够赢你们”',desc:'把绝活标签直接变成挑衅。',effects:{popularity:13,coachTrust:-3,nextMatchBonus:1.4},outcome:'标题党获得了全年最佳素材。以后每次被针对，这句话都会被重新贴出来。'},{label:'主动扩展英雄池',desc:'承认问题，训练更多备选。',effects:{poolAttr:1,condition:-7,coachTrust:8},outcome:'你没有和问题争辩，而是把下一段训练时间交给了英雄池。'},{label:'“比赛会回答”',desc:'不接节奏，把压力留给下一场。',effects:{coachTrust:4,teammateBond:3},outcome:'回答很无聊。好处是，如果下一场赢了，它会突然显得很帅。'}]},
    {id:'v78-objective-aftermath',icon:'🤦',kicker:'COMMUNITY · 忘点余波',title:'那个“9”还在评论区里',text:'已经过去几场比赛了，社区依旧没有放过那次目标点事故。每当比赛进入加时，直播间就开始刷你的ID。',weight:.55,condition:()=>has78('objective-blunder')&&!resolved78('v78-objective-aftermath'),choices:[{label:'主动认错',desc:'承认当时沟通出了问题。',effects:{coachTrust:8,teammateBond:6,popularity:3},outcome:'一句“那波确实是我的问题”让争论失去了继续升级的燃料。梗还在，人倒是翻篇了。'},{label:'自己先玩这个梗',desc:'把黑历史变成节目效果。',effects:{popularity:14,teammateBond:4},outcome:'你自己都开始刷那个“9”。黑历史没有消失，只是从攻击素材变成了个人节目效果。'},{label:'强调团队沟通问题',desc:'把责任放回团队层面，风险是队友未必喜欢。',effects:{coachTrust:-2,teammateBond:-8,popularity:5},outcome:'逻辑上没有错，但更衣室里显然有人觉得你把锅重新端了回来。'}]}
  ];extras.forEach(e=>{if(!SEASON_EVENTS.some(x=>x.id===e.id))SEASON_EVENTS.push(e)});
  function storyEventResolved78(id,choice,outcome){if(!id?.startsWith('v78-'))return;careerState.v78ResolvedStoryEvents=careerState.v78ResolvedStoryEvents||[];if(!careerState.v78ResolvedStoryEvents.includes(id))careerState.v78ResolvedStoryEvents.push(id);addMoment78('🎬','旧梗有了后续',`${choice}：${outcome}`,1.6,null,'')}
  const _resolve78=resolveSeasonEvent;resolveSeasonEvent=function(index){const id=seasonState.currentEvent?.event?.id,choice=seasonState.currentEvent?.event?.choices?.[index];const out=_resolve78(index);if(id?.startsWith('v78-')&&choice)storyEventResolved78(id,choice.label,choice.outcome);return out};
  if(typeof v32AutoResolveSeasonEvent==='function'){const _autoEv78=v32AutoResolveSeasonEvent;v32AutoResolveSeasonEvent=function(){const before=(seasonState.eventHistory||[]).length,out=_autoEv78(),last=(seasonState.eventHistory||[]).at(-1);if((seasonState.eventHistory||[]).length>before&&last?.id?.startsWith('v78-')){const e=SEASON_EVENTS.find(x=>x.id===last.id),c=e?.choices?.find(x=>x.label===last.choice);storyEventResolved78(last.id,last.choice,c?.outcome||'这段旧梗又翻出了新的一页。')}return out}}

  function processNew78(detail=null){
    const rows=seasonState.v75StoryLog||[];for(const rec of rows){if(rec.v78Processed)continue;rec.v78Processed=true;const d=detail&&rec===rows.at(-1)?detail:{};const h=(careerState.v75StoryHistory||[]).filter(x=>x.year===rec.year&&x.matchNo===rec.matchNo).at(-1);if(h){Object.assign(h,{v78Processed:true});if(d?.teamGap!=null)h.v78TeamGap=d.teamGap;if(d?.mapSequence)h.v78MapSequence=d.mapSequence;if(d?.maps)h.v78Maps=d.maps}process78(rec,d)}
  }
  function enhance78(){
    const box=document.querySelector('#seasonScreen .v75-story-recap');if(box){box.querySelector('.v78-story-moments')?.remove();box.querySelectorAll('.v78-story-echo').forEach(x=>x.remove());const stage=Number(seasonState.stageBreakPending)||(typeof currentStageNumber==='function'?currentStageNumber():0);let pool=moments78().filter(x=>x.year===y78());if(seasonState.played<seasonState.total){const s=pool.filter(x=>x.stage===stage);if(s.length)pool=s}const show=[...pool].sort((a,b)=>b.importance-a.importance||b.matchNo-a.matchNo).slice(0,seasonState.played>=seasonState.total?3:2);if(show.length){const el=document.createElement('div');el.className='v78-story-moments';el.innerHTML=show.map(m=>`<div class="v78-story-moment"><b>${m.icon} ${m.title}</b><span>${m.text}</span></div>`).join('');box.querySelector('.v75-story-head')?.insertAdjacentElement('afterend',el)}
      for(const p of box.querySelectorAll('.v75-story-lines p')){const m=(p.textContent||'').match(/G(\d+)/),no=m?Number(m[1]):null;if(!no)continue;const mm=moments78().filter(x=>x.year===y78()&&x.matchNo===no&&x.voice).sort((a,b)=>b.importance-a.importance)[0];let voice=mm?.voice||'';const rec=(seasonState.v75StoryLog||[]).find(x=>x.matchNo===no);if(!voice&&rec){if(has78(`nemesis:${rec.opponent}`)&&!rec.won)voice='😵 赛后讨论：“苦主还是那个苦主。”';else if(careerState.careerNickname&&Number(rec.avg)>=8.6)voice=`🎙️ 解说席：“${careerState.careerNickname}今天又来了。”`}if(voice&&!p.querySelector('.v78-story-echo'))p.insertAdjacentHTML('beforeend',`<small class="v78-story-echo">${voice}</small>`)}
    }
  }
  // Global hooks: the story system observes the already-existing Career Feed instead of maintaining a second match engine.
  const _record78=recordManualSeasonMatch;recordManualSeasonMatch=function(){const out=_record78();processNew78(detail78());enhance78();return out};
  for(const fn of ['simulateSingleRegularMatch','v32SilentRegularGame','fastSeasonStep']){if(typeof window[fn]==='function'){const base=window[fn];window[fn]=function(...args){const out=base.apply(this,args);processNew78(null);enhance78();return out}}}
  const _render78=renderSeason;renderSeason=function(){const out=_render78();processNew78(null);enhance78();return out};
  const _team78=renderCareerTeam;renderCareerTeam=function(){const out=_team78();if(careerState.careerNickname)document.querySelectorAll('#careerStarterList .squad-name').forEach(el=>{if(el.textContent.includes(getPlayerName())&&!el.querySelector('.v78-nickname-chip'))el.insertAdjacentHTML('beforeend',`<span class="v78-nickname-chip">🎙️ ${careerState.careerNickname}</span>`)});return out};
  const _archive78=recordCompletedCareerSeason;recordCompletedCareerSeason=function(){const n=careerState.careerArchive?.length||0,out=_archive78();if((careerState.careerArchive?.length||0)>n){const r=careerState.careerArchive.at(-1);r.storyMoments=(moments78()||[]).filter(x=>x.year===r.year).map(x=>({...x}));r.careerNickname=careerState.careerNickname||null}return out};
  const _setup78=setupSeason;setupSeason=function(isRestart=false){if(isRestart&&seasonState.v78StartSnapshot){careerState.careerMemories=JSON.parse(JSON.stringify(seasonState.v78StartSnapshot.memories||[]));careerState.careerNickname=seasonState.v78StartSnapshot.nickname||null;careerState.v78MapRecords=JSON.parse(JSON.stringify(seasonState.v78StartSnapshot.maps||{}));careerState.v78ResolvedStoryEvents=[...(seasonState.v78StartSnapshot.resolved||[])];careerState.v75StoryHistory=(careerState.v75StoryHistory||[]).slice(0,seasonState.v78StartSnapshot.historyLen||0)}const out=_setup78(isRestart);seasonState.v78Moments=[];if(!isRestart||!seasonState.v78StartSnapshot)seasonState.v78StartSnapshot={memories:JSON.parse(JSON.stringify(mems78())),nickname:careerState.careerNickname||null,maps:JSON.parse(JSON.stringify(careerState.v78MapRecords||{})),resolved:[...(careerState.v78ResolvedStoryEvents||[])],historyLen:(careerState.v75StoryHistory||[]).length};return out};

  window.__OWL_V780_STORY_QA={version:VER,process:(rec,detail={})=>process78(rec,detail),addMoment:addMoment78,moments:()=>JSON.parse(JSON.stringify(moments78())),memories:()=>JSON.parse(JSON.stringify(mems78())),reset:()=>{careerState.careerMemories=[];careerState.v75StoryHistory=[];careerState.v78MapRecords={};careerState.careerNickname=null;careerState.v78ResolvedStoryEvents=[];seasonState.v78Moments=[]},summary:()=>({nickname:careerState.careerNickname||null,memoryCount:mems78().length,moments:moments78().length,followups:extras.map(x=>x.id)})};
})();
