
/* ===== V7.9.0 · Living Career Memory / callbacks / relationships / heat ===== */
(function(){
  const VER='V7.9.0';
  const clamp79=(n,a,b)=>Math.max(a,Math.min(b,n));
  const year79=()=>Number(careerState.seasonYear||2019);

  function memRoot79(){ careerState.careerMemories=careerState.careerMemories||[]; return careerState.careerMemories; }
  function relRoot79(){
    careerState.v79Relationships=careerState.v79Relationships||{teams:{},maps:{},heroes:{}};
    careerState.v79Relationships.teams=careerState.v79Relationships.teams||{};
    careerState.v79Relationships.maps=careerState.v79Relationships.maps||{};
    careerState.v79Relationships.heroes=careerState.v79Relationships.heroes||{};
    return careerState.v79Relationships;
  }
  function narrativeRoot79(){ careerState.v79NarrativeHistory=careerState.v79NarrativeHistory||[]; return careerState.v79NarrativeHistory; }
  function callbackRoot79(){ seasonState.v79Callbacks=seasonState.v79Callbacks||[]; return seasonState.v79Callbacks; }
  function callbackSeen79(key){ careerState.v79CallbackKeys=careerState.v79CallbackKeys||[]; return careerState.v79CallbackKeys.includes(key); }

  function defaultState79(m){
    const k=String(m.key||'');
    if(k==='blade-meme')return '黑历史';
    if(k==='blade-redemption')return '洗白名场面';
    if(k==='objective-blunder')return '黑历史';
    if(k==='objective-redemption')return '已翻篇';
    if(k==='caster-nickname')return '个人标签';
    if(k.startsWith('one-trick:'))return '争议标签';
    if(k==='one-trick-broken')return '已撕标签';
    if(k.startsWith('landlord:'))return '长期压制';
    if(k.startsWith('nemesis:'))return '苦主阴影';
    if(k.startsWith('rivalry:'))return '宿敌';
    if(k.startsWith('map-garden:'))return '个人地盘';
    if(k.startsWith('former-team:'))return '老东家';
    if(k.startsWith('champion-'))return '生涯锚点';
    if(k==='ban-proof-reputation')return '联盟口碑';
    if(k==='hero-ocean')return '联盟口碑';
    return '生涯片段';
  }
  function baseHeat79(m){
    const w=Number(m.weight||1);
    let h=26+w*17;
    const k=String(m.key||'');
    if(/blade|objective|nickname|champion|landlord|nemesis|rivalry|former-team|map-garden/.test(k))h+=10;
    return clamp79(Math.round(h),18,96);
  }
  function heatBand79(h){
    h=Number(h||0);
    if(h>=75)return '热议';
    if(h>=50)return '常被提起';
    if(h>=28)return '偶尔翻出';
    return '沉寂';
  }
  function normalizeMem79(m){
    if(!m||typeof m!=='object')return m;
    m.createdYear=Number(m.createdYear||m.year||year79());
    m.state=m.state||defaultState79(m);
    if(!Number.isFinite(Number(m.heat)))m.heat=baseHeat79(m);
    m.mentions=Number(m.mentions||0);
    m.lastMentionYear=Number(m.lastMentionYear||m.year||m.createdYear||year79());
    m.lastDecayYear=Number(m.lastDecayYear||m.createdYear||year79());
    m.heatBand=heatBand79(m.heat);
    return m;
  }
  function normalizeAll79(){ memRoot79().forEach(normalizeMem79); syncStates79(); return memRoot79(); }
  function mem79(key){ return normalizeAll79().find(x=>x.key===key)||null; }
  function memPrefix79(prefix){ return normalizeAll79().filter(x=>String(x.key||'').startsWith(prefix)); }

  function touchMem79(m,amount=9){
    if(!m)return;
    normalizeMem79(m);
    m.heat=clamp79(Number(m.heat||0)+amount,0,100);
    m.mentions=Number(m.mentions||0)+1;
    m.lastMentionYear=year79();
    m.heatBand=heatBand79(m.heat);
  }
  function addMemory79(key,icon,title,text,weight=2,state=null,meta={}){
    if(memRoot79().some(x=>x.key===key))return mem79(key);
    const m=normalizeMem79({
      key,icon,title,text,weight,year:year79(),createdYear:year79(),age:careerState.age,
      team:careerState.team?.name||'—',state:state||undefined,...meta
    });
    memRoot79().push(m);
    return m;
  }
  function decayMemories79(){
    const y=year79();
    for(const m of normalizeAll79()){
      let last=Number(m.lastDecayYear||m.createdYear||y);
      while(last<y){
        const w=Number(m.weight||1);
        const sticky=/黑历史|个人标签|宿敌|生涯锚点|老东家/.test(String(m.state||''))||w>=2.5;
        const rate=sticky?.92:w>=2?.84:.73;
        m.heat=clamp79(Number(m.heat||0)*rate,0,100);
        last++;
      }
      m.lastDecayYear=y;
      m.heatBand=heatBand79(m.heat);
    }
  }

  function syncStates79(){
    const all=memRoot79();
    const has=k=>all.some(x=>x.key===k);
    const blade=all.find(x=>x.key==='blade-meme'); if(blade&&has('blade-redemption'))blade.state='已洗白';
    const obj=all.find(x=>x.key==='objective-blunder'); if(obj&&has('objective-redemption'))obj.state='已翻篇';
    if(has('one-trick-broken'))all.filter(x=>String(x.key||'').startsWith('one-trick:')).forEach(x=>x.state='已撕标签');
    const teams=relRoot79().teams;
    for(const m of all){
      const k=String(m.key||'');
      if(k.startsWith('landlord:')){
        const team=k.slice('landlord:'.length),r=teams[team];
        if(r&&r.meetings>=6){
          const wr=r.wins/Math.max(1,r.meetings);
          m.state=wr>=.67?'长期压制':wr>=.5?'优势松动':'宿敌化';
        }
      }
      if(k.startsWith('nemesis:')){
        const team=k.slice('nemesis:'.length),r=teams[team];
        if(r&&r.meetings>=5){
          const last=(r.results||[]).slice(-3);
          const wins=last.filter(Boolean).length;
          m.state=wins>=2?'已破咒':wins===1?'破咒中':'苦主阴影';
        }
      }
    }
  }

  function addCallback79(key,icon,title,text,memKey=null,importance=2,rec=null){
    const y=year79(),no=Number(rec?.matchNo||seasonState.played||0);
    const full=`${key}:${y}:${no}`;
    if(callbackSeen79(full))return null;
    careerState.v79CallbackKeys.push(full);
    const c={key:full,icon,title,text,importance,year:y,matchNo:no,stage:rec?.stage||0,memKey};
    callbackRoot79().push(c);
    narrativeRoot79().push({...c});
    careerState.v79NarrativeHistory=careerState.v79NarrativeHistory.slice(-180);
    if(memKey)touchMem79(mem79(memKey),12);
    return c;
  }

  function teamRel79(name){
    if(!name)return null;
    const teams=relRoot79().teams;
    return teams[name]||(teams[name]={team:name,meetings:0,wins:0,losses:0,streak:0,results:[],firstYear:year79(),lastYear:null,label:'普通对手',formerTeam:false,formerSince:null,formerMeetingBase:0});
  }
  function relLabel79(r){
    if(!r)return '普通对手';
    if(r.formerTeam)return '老东家';
    if(r.meetings>=6){
      const wr=r.wins/Math.max(1,r.meetings);
      if(wr>=.72)return '长期压制';
      if(wr<=.28)return '你的苦主';
      if(wr>=.38&&wr<=.62)return '宿敌';
    }
    return '普通对手';
  }
  function markFormerTeam79(teamName){
    if(!teamName)return;
    const r=teamRel79(teamName);
    if(!r.formerTeam){
      r.formerTeam=true;r.formerSince=year79();r.formerMeetingBase=r.meetings;
      addMemory79(`former-team:${teamName}`,'🔁',`${teamName}成为老东家`,`你离开了${teamName}。以后再次碰面，普通赛程会多一层旧关系。`,2.3,'老东家',{subject:teamName});
    }
  }

  function updateTeamRelation79(rec){
    if(!rec?.opponent)return null;
    // 只有真正出场才算玩家与这支队伍交手；DNP 不积累宿敌/苦主/杀手关系。
    if(Number(rec.mapsPlayed||0)<=0)return teamRel79(rec.opponent);
    const r=teamRel79(rec.opponent);
    r.meetings++; if(rec.won)r.wins++; else r.losses++;
    r.streak=rec.won?(r.streak>=0?r.streak+1:1):(r.streak<=0?r.streak-1:-1);
    r.results=(r.results||[]).concat(!!rec.won).slice(-12);
    r.lastYear=Number(rec.year||year79());
    r.label=relLabel79(r);

    if(r.meetings>=6){
      const wr=r.wins/Math.max(1,r.meetings);
      if(wr>=.38&&wr<=.62&&!memRoot79().some(x=>x.key===`rivalry:${rec.opponent}`)){
        addMemory79(`rivalry:${rec.opponent}`,'⚔️',`与${rec.opponent}的宿敌关系成形`,`交手次数越来越多，胜负也始终拉不开。赛程表上的这个名字已经不再只是“下一场对手”。`,2.35,'宿敌',{subject:rec.opponent});
        addCallback79(`rivalry-born:${rec.opponent}`,'⚔️','宿敌关系成形',`你和${rec.opponent}已经打到很难再用“普通常规赛”解释这组对局。`,`rivalry:${rec.opponent}`,2.4,rec);
      }
    }
    return r;
  }

  function currentHistory79(){
    careerState.v75StoryHistory=careerState.v75StoryHistory||[];
    return careerState.v75StoryHistory;
  }
  function mapNames79(h){
    const rows=h?.v78Maps||[];
    return rows.map(x=>x?.name).filter(Boolean);
  }

  function callbacksForMatch79(h,r){
    if(!h||!r||Number(h.mapsPlayed||0)<=0)return;
    const y=Number(h.year||year79()),avg=Number(h.avg),validAvg=Number.isFinite(avg);

    // 老东家：第一次真正交手一定回收。
    if(r.formerTeam&&r.meetings===Number(r.formerMeetingBase||0)+1){
      const result=h.won?'你赢下了第一次重逢。':'第一次重逢由老东家拿走。';
      addCallback79(`former-first:${h.opponent}`,'🔁','第一次面对老东家',`${h.opponent}已经不再和你坐在同一边。${result}`,`former-team:${h.opponent}`,2.8,h);
    }

    // 去年以前形成的宿敌/苦主/长期压制，在新赛季再次相遇时重新升温，一年最多一次。
    for(const pref of ['landlord:','nemesis:','rivalry:']){
      const m=mem79(`${pref}${h.opponent}`);
      if(m&&Number(m.createdYear)<y){
        const annual=`${pref}${h.opponent}:annual:${y}`;
        if(!callbackSeen79(`${annual}:${y}:${h.matchNo}`)){
          const already=(careerState.v79NarrativeHistory||[]).some(x=>x.key?.startsWith(`${annual}:`));
          if(!already){
            const text=pref==='landlord:'?`${h.opponent}又出现在赛程上。过去那段五连胜统治也跟着一起被翻了出来。`
              :pref==='nemesis:'?`赛程公布以后，评论区第一反应不是阵容，而是：这个苦主你到底什么时候能过？`
              :`你和${h.opponent}又碰面了。现在每一次交手，都在给这段宿敌关系继续加素材。`;
            addCallback79(annual,pref==='landlord:'?'🎯':pref==='nemesis:'?'😵':'⚔️','旧账重新升温',text,m.key,2.1,h);
          }
        }
      }
    }

    // 外号多年后仍会被高光重新叫出来，但每赛季只做一次重点回收。
    const nick=mem79('caster-nickname');
    if(nick&&careerState.careerNickname&&Number(nick.createdYear)<y&&validAvg&&avg>=8.8){
      const key=`nickname-return:${y}`;
      if(!(careerState.v79NarrativeHistory||[]).some(x=>x.key?.startsWith(`${key}:`))){
        addCallback79(key,'🎙️','老外号又响起来了',`高光一回来，解说席也顺手把那个熟悉的称呼翻了出来：“${careerState.careerNickname}又来了。”`,'caster-nickname',2.0,h);
      }
    }

    // Blade / 忘点：旧黑历史在对应场景重现时才回调。
    const blade=mem79('blade-meme');
    if(blade&&Number(blade.createdYear)<y&&h.hero==='源氏'){
      const key=`blade-return:${y}`;
      if(!(careerState.v79NarrativeHistory||[]).some(x=>x.key?.startsWith(`${key}:`))){
        const redeemed=!!mem79('blade-redemption');
        addCallback79(key,'🐉',redeemed?'洗白后的源氏又回来了':'那个Blade老梗又被翻出来了',
          redeemed?'曾经的笑话已经完成洗白，但每次你重新锁下源氏，老截图还是会准时出现。':'你重新拿出源氏，直播间的计时器梗几乎是条件反射般重新出现。','blade-meme',2.2,h);
      }
    }
    const obj=mem79('objective-blunder');
    if(obj&&Number(obj.createdYear)<y&&/^(3-2|2-3|4-3|3-4)$/.test(String(h.score||''))){
      const key=`objective-return:${y}`;
      if(!(careerState.v79NarrativeHistory||[]).some(x=>x.key?.startsWith(`${key}:`))){
        addCallback79(key,'🤦',mem79('objective-redemption')?'加时镜头又想起那个旧梗':'评论区又开始刷“点呢？”',
          mem79('objective-redemption')?'比赛再次拖到最后时刻，旧黑历史被提了一嘴——但它现在更像一个已经翻篇的老梗。':'只要比赛进入最后加时，那次目标点事故就很难完全消失。','objective-blunder',2.0,h);
      }
    }

    // 地图后花园：只有真的再次打到那张图才提。
    for(const mapName of mapNames79(h)){
      const m=mem79(`map-garden:${mapName}`);
      if(m&&Number(m.createdYear)<y){
        const key=`garden-return:${mapName}:${y}`;
        if(!(careerState.v79NarrativeHistory||[]).some(x=>x.key?.startsWith(`${key}:`))){
          addCallback79(key,'🏟️','回到自己的“后花园”',`地图池转到${mapName}时，解说第一反应已经不是地图特性，而是你的旧战绩。`,m.key,2.15,h);
        }
      }
    }
  }

  function syncDerivedStates79(){
    normalizeAll79();
    const teams=relRoot79().teams;
    for(const [name,r] of Object.entries(teams)){
      r.label=relLabel79(r);
      const lm=mem79(`landlord:${name}`); if(lm)lm.state=r.label==='长期压制'?'长期压制':r.label==='宿敌'?'宿敌化':'优势松动';
      const nm=mem79(`nemesis:${name}`);
      if(nm){
        const wins=(r.results||[]).slice(-3).filter(Boolean).length;
        nm.state=wins>=2?'已破咒':wins===1?'破咒中':'苦主阴影';
      }
    }
  }

  function processNewRelations79(){
    const rows=currentHistory79();
    for(const h of rows){
      if(h.v79Processed)continue;
      h.v79Processed=true;
      const r=updateTeamRelation79(h);
      callbacksForMatch79(h,r);
    }
    syncDerivedStates79();
  }

  function topMemories79(){
    return normalizeAll79().filter(m=>Number(m.heat||0)>=18)
      .sort((a,b)=>Number(b.heat||0)-Number(a.heat||0)||Number(b.weight||0)-Number(a.weight||0)).slice(0,4);
  }
  function enhanceCareerFeed79(){
    const box=document.querySelector('#seasonScreen .v75-story-recap'); if(!box)return;
    box.querySelector('.v79-memory-callbacks')?.remove();
    box.querySelector('.v79-active-memories')?.remove();

    let callbacks=(callbackRoot79()||[]).filter(x=>Number(x.year)===year79());
    if(Number(seasonState.played||0)<Number(seasonState.total||0)){
      const stage=Number(seasonState.stageBreakPending)||(typeof currentStageNumber==='function'?currentStageNumber():0);
      const s=callbacks.filter(x=>Number(x.stage)===stage); if(s.length)callbacks=s;
    }
    callbacks=callbacks.slice(-2).reverse();
    if(callbacks.length){
      const el=document.createElement('div'); el.className='v79-memory-callbacks';
      el.innerHTML=callbacks.map(c=>`<div class="v79-memory-callback"><b>${c.icon} ${c.title}</b><span>${c.text}</span></div>`).join('');
      const head=box.querySelector('.v75-story-head'); if(head)head.insertAdjacentElement('afterend',el);
    }
    const tops=topMemories79();
    if(tops.length){
      const strip=document.createElement('div');strip.className='v79-active-memories';
      strip.innerHTML=tops.map(m=>`<span class="v79-memory-chip ${Number(m.heat)>=70?'hot':''}" title="${m.text||''}">${m.icon||'📌'} <strong>${m.title}</strong> · ${m.state} · ${m.heatBand}</span>`).join('');
      box.appendChild(strip);
    }
  }

  function seasonAnchor79(record){
    if(!record)return;
    const isChamp=String(record.result||'').includes('总冠军');
    if(!isChamp)return;
    const champs=(careerState.careerArchive||[]).filter(x=>String(x.result||'').includes('总冠军'));
    const count=champs.length;
    const key=count===1?'champion-first':`champion-${count}`;
    const title=count===1?'第一次站上联盟之巅':count===2?'第二冠：第一次不再是偶然':`第${count}冠`;
    const text=count===1?`${record.year}年，你拿到了职业生涯第一座OWL总冠军。这会成为之后所有“你到底是什么级别选手”讨论里的第一个锚点。`
      :`${record.year}年，你拿到生涯第${count}座OWL总冠军。冠军次数已经开始从成绩变成时代标签。`;
    addMemory79(key,'🏆',title,text,3.0,'生涯锚点',{season:record.year});
  }

  // Team changes are detected from the most recently archived season.
  function detectTeamChange79(){
    const prev=(careerState.careerArchive||[]).at(-1),now=careerState.team?.name;
    if(prev?.team&&now&&prev.team!==now)markFormerTeam79(prev.team);
  }

  const _recordArchive79=recordCompletedCareerSeason;
  recordCompletedCareerSeason=function(){
    const before=careerState.careerArchive?.length||0;
    const out=_recordArchive79();
    if((careerState.careerArchive?.length||0)>before)seasonAnchor79(careerState.careerArchive.at(-1));
    return out;
  };

  const _setupSeason79=setupSeason;
  setupSeason=function(isRestart=false){
    const restartSnap=isRestart?seasonState.v79StartSnapshot:null;
    const out=_setupSeason79(isRestart);
    if(isRestart&&restartSnap){
      careerState.v79Relationships=JSON.parse(JSON.stringify(restartSnap.relationships||{teams:{},maps:{},heroes:{}}));
      careerState.v79NarrativeHistory=JSON.parse(JSON.stringify(restartSnap.narrative||[]));
      careerState.v79CallbackKeys=[...(restartSnap.callbackKeys||[])];
      careerState.careerMemories=JSON.parse(JSON.stringify(restartSnap.memories||careerState.careerMemories||[]));
    }else{
      decayMemories79();
      detectTeamChange79();
    }
    seasonState.v79Callbacks=[];
    processNewRelations79();
    if(!isRestart||!restartSnap){
      seasonState.v79StartSnapshot={
        relationships:JSON.parse(JSON.stringify(relRoot79())),
        narrative:JSON.parse(JSON.stringify(narrativeRoot79())),
        callbackKeys:[...(careerState.v79CallbackKeys||[])],
        memories:JSON.parse(JSON.stringify(normalizeAll79()))
      };
    }
    return out;
  };

  // Observe the existing story log; no second match simulator is introduced.
  const _renderSeason79=renderSeason;
  renderSeason=function(){
    const out=_renderSeason79();
    processNewRelations79();
    enhanceCareerFeed79();
    return out;
  };
  for(const fn of ['simulateSingleRegularMatch','v32SilentRegularGame','fastSeasonStep','recordManualSeasonMatch']){
    if(typeof window[fn]==='function'){
      const base=window[fn];
      window[fn]=function(...args){
        const out=base.apply(this,args);
        processNewRelations79();
        enhanceCareerFeed79();
        return out;
      };
    }
  }

  // Initial migration for old saves.
  normalizeAll79();
  relRoot79();
  processNewRelations79();

  window.__OWL_V790_MEMORY_QA={
    version:VER,
    normalize:()=>JSON.parse(JSON.stringify(normalizeAll79())),
    relationships:()=>JSON.parse(JSON.stringify(relRoot79())),
    callbacks:()=>JSON.parse(JSON.stringify(callbackRoot79())),
    addMemory:(...args)=>addMemory79(...args),
    addCallback:(...args)=>addCallback79(...args),
    process:()=>{processNewRelations79();enhanceCareerFeed79();},
    decay:()=>decayMemories79(),
    markFormer:team=>markFormerTeam79(team),
    summary:()=>({
      memories:normalizeAll79().length,
      hot:normalizeAll79().filter(x=>Number(x.heat)>=70).length,
      teams:Object.keys(relRoot79().teams).length,
      callbacks:callbackRoot79().length,
      narrative:narrativeRoot79().length
    })
  };
})();
