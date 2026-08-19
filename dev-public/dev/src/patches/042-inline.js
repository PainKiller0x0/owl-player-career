
/* ===== V7.10.0 · WHO ARE YOU / Career Identity Portrait ===== */
(function(){
  const VER='V7.10.0';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const archive=()=>Array.isArray(careerState.careerArchive)?careerState.careerArchive:[];
  const memories=()=>Array.isArray(careerState.careerMemories)?careerState.careerMemories:[];
  const relTeams=()=>careerState.v79Relationships?.teams||{};
  const playerName=()=>{try{return String(getPlayerName?.()||state.playerName||'Rookie').trim()||'Rookie'}catch(_){return String(state.playerName||'Rookie').trim()||'Rookie'}};

  function honorCounts(){
    try{return getHonorCounts()}catch(_){
      const out={};archive().forEach(r=>(r.honors||[]).forEach(h=>out[h]=(out[h]||0)+1));return out;
    }
  }
  function teamCounts(){
    return archive().reduce((o,r)=>{if(r.team)o[r.team]=(o[r.team]||0)+1;return o},{});
  }
  function longestTeam(){
    const list=Object.entries(teamCounts()).sort((a,b)=>b[1]-a[1]||String(a[0]).localeCompare(String(b[0])));
    return list[0]||[careerState.team?.name||'—',0];
  }
  function currentTopMemories(){
    return [...memories()].filter(Boolean).sort((a,b)=>Number(b.heat||0)-Number(a.heat||0)||Number(b.weight||0)-Number(a.weight||0));
  }
  function findMem(key){return memories().find(m=>m?.key===key)||null}
  function findPrefix(prefix){return currentTopMemories().filter(m=>String(m?.key||'').startsWith(prefix))}
  function relationshipCandidates(){
    return Object.values(relTeams()).filter(Boolean).sort((a,b)=>Number(b.meetings||0)-Number(a.meetings||0));
  }
  function bestRelationship(label){
    return relationshipCandidates().filter(r=>r.label===label).sort((a,b)=>Number(b.meetings||0)-Number(a.meetings||0))[0]||null;
  }
  function formerTeams(){
    return relationshipCandidates().filter(r=>r.formerTeam).sort((a,b)=>Number(b.meetings||0)-Number(a.meetings||0));
  }
  function signatureHero(){
    const snapshots=archive().flatMap(r=>Array.isArray(r.heroPool)?r.heroPool:[]);
    if(snapshots.length){
      const by={};
      snapshots.forEach(h=>{
        if(!h?.name)return;
        const v=Number(h.value||0);
        if(!by[h.name]||v>by[h.name].value)by[h.name]={name:h.name,value:v,label:h.label||''};
      });
      return Object.values(by).sort((a,b)=>b.value-a.value)[0]||null;
    }
    return null;
  }
  function careerStats(){
    const a=archive(),h=honorCounts(),tc=teamCounts(),[fav,favYears]=longestTeam();
    const teams=Object.keys(tc),seasons=a.length;
    const wins=a.reduce((s,r)=>s+Number(r.wins||0),0),losses=a.reduce((s,r)=>s+Number(r.losses||0),0);
    const ratings=a.filter(r=>Number(r.rating)>0),avg=ratings.length?ratings.reduce((s,r)=>s+Number(r.rating),0)/ratings.length:0;
    const champs=Number(h['总冠军']||0),mvps=Number(h['MVP']||h['常规赛最有价值选手']||0);
    const fmvp=Number(h['总决赛MVP']||h['总决赛最有价值选手']||0);
    const allstars=Number(h['全明星']||h['全明星入选']||h['全明星首发']||0);
    const roleStars=Number(h['职责之星']||h['年度职责之星']||h['年度角色之星']||0);
    return{a,h,tc,fav,favYears,teams,seasons,wins,losses,avg,champs,mvps,fmvp,allstars,roleStars};
  }

  function identityArchetype(final=false){
    const s=careerStats(),single=s.teams.length===1&&s.seasons>=4;
    const nick=careerState.careerNickname;
    let base='';
    if(single&&s.seasons>=6)base=`${s.fav}队史旗帜`;
    else if(s.champs>=3)base='王朝核心';
    else if(s.champs>=1&&s.mvps>=1)base='冠军级超级明星';
    else if(s.mvps>=1)base='联盟MVP级核心';
    else if(findMem('hero-ocean')||findMem('ban-proof-reputation'))base='英雄海核心';
    else if(findPrefix('one-trick:').some(x=>x.state!=='已撕标签'))base='招牌专精选手';
    else if(findMem('deadlift-carry'))base='孤胆核心';
    else if(s.allstars>=3||s.roleStars>=2)base='联盟明星';
    else if(s.seasons>=4)base='资深主力';
    else base='正在形成标签的职业选手';
    if(nick)base+=` · 「${nick}」`;
    if(final&&s.seasons>=8&&s.champs>=2&&!base.includes('传奇'))base=`联盟传奇 · ${base}`;
    return base;
  }

  function buildStory(final=false){
    const s=careerStats(),hero=signatureHero(),nick=careerState.careerNickname;
    const sentences=[],tags=[];
    const allOne=s.teams.length===1&&s.seasons>=4;

    if(s.seasons){
      let first=`${playerName()}已经完成${s.seasons}个完整赛季`;
      if(allOne)first+=`，全部献给${s.fav}`;
      else if(s.favYears>=3)first+=`，其中${s.favYears}年效力于${s.fav}`;
      first+=`。`;
      if(s.champs||s.mvps||s.allstars){
        const honors=[];
        if(s.champs)honors.push(`${s.champs}座总冠军`);
        if(s.mvps)honors.push(`${s.mvps}次MVP`);
        if(s.fmvp)honors.push(`${s.fmvp}次总决赛MVP`);
        if(s.allstars)honors.push(`${s.allstars}次全明星`);
        first+=` 目前最硬的履历是${honors.slice(0,3).join('、')}。`;
      }
      sentences.push(first);
    }else{
      sentences.push(`${playerName()}的职业身份还在形成中。现在最重要的不是履历长度，而是第一批真正会留下来的标签。`);
    }

    const blade=findMem('blade-meme'),bladeRed=findMem('blade-redemption');
    const objective=findMem('objective-blunder'),objectiveRed=findMem('objective-redemption');
    const oneTrick=findPrefix('one-trick:').find(x=>x.state!=='已撕标签');
    const broken=findMem('one-trick-broken');
    const ocean=findMem('hero-ocean')||findMem('ban-proof-reputation');

    if(blade){
      sentences.push(bladeRed||blade.state==='已洗白'
        ?`职业生涯里最著名的黑历史之一曾是“${blade.title}”，但后来已经亲手完成洗白；现在它更像一个会被反复翻出的老梗。`
        :`“${blade.title}”仍是职业生涯里躲不开的黑历史，尤其每次重新拿出源氏时，旧截图就会准时回来。`);
    }else if(objective){
      sentences.push(objectiveRed||objective.state==='已翻篇'
        ?`早年的目标点事故已经被后来关键局里的稳定处理翻篇，但那个梗并没有真正消失。`
        :`一次著名的目标点事故仍挂在公众记忆里，关键加时越多，这段黑历史越容易被翻出来。`);
    }else if(broken){
      sentences.push(`早年“绝活哥”的质疑已经被更完整的英雄池撕掉；从被针对一个英雄就难受，到现在很难用一个Ban解决，这是职业形象最大的变化之一。`);
    }else if(oneTrick){
      sentences.push(`公众对你的评价仍带着明显的“绝活”色彩：招牌英雄足够吓人，但英雄池宽度仍然是对手和媒体最爱追问的话题。`);
    }else if(ocean){
      sentences.push(`英雄池已经成为你最稳定的职业标签之一：对手可以针对一个英雄，却越来越难用一次Ban把整个人按下去。`);
    }else if(hero){
      sentences.push(`${hero.name}是目前履历里最鲜明的招牌英雄之一，最高熟练度记录达到${Number(hero.value).toFixed(0)}。`);
    }

    const rival=bestRelationship('宿敌');
    const landlord=bestRelationship('长期压制');
    const nemesis=bestRelationship('你的苦主');
    const formers=formerTeams();

    if(rival){
      sentences.push(`和${rival.team}的${rival.meetings}次交手已经形成真正的宿敌关系：胜负不再只是积分，而是在给同一段故事继续加页数。`);
    }else if(landlord){
      sentences.push(`你对${landlord.team}留下过最鲜明的长期压制印象之一，“${landlord.team}杀手”也因此成了这段对局的固定标签。`);
    }else if(nemesis){
      sentences.push(`${nemesis.team}至今仍是最难绕开的苦主之一；每次赛程再次出现这个名字，讨论都会比普通比赛更早开始。`);
    }else if(formers.length){
      sentences.push(`${formers[0].team}已经成为老东家。再次相遇时，比赛天然会多一层“以前坐在同一边”的意味。`);
    }

    const garden=findPrefix('map-garden:')[0];
    if(garden&&sentences.length<4)sentences.push(`${String(garden.key).slice('map-garden:'.length)}已经逐渐变成公认的“后花园”，只要地图池转到这里，解说就会先翻你的旧战绩。`);

    if(final){
      if(allOne&&s.seasons>=6)sentences.push(`最终，“一人一城”本身也成为履历的一部分：很多队友和版本都换过，但你没有换过胸前那支队伍。`);
      else if(s.teams.length>=3)sentences.push(`你最终穿过${s.teams.length}支队伍的队服，职业生涯的身份并不属于某一座城市，而属于一路累积下来的比赛和故事。`);
    }

    if(s.champs)tags.push({t:`🏆 ${s.champs}×总冠军`,c:'gold'});
    if(s.mvps)tags.push({t:`👑 ${s.mvps}×MVP`,c:'gold'});
    if(s.fmvp)tags.push({t:`🌟 ${s.fmvp}×总决赛MVP`,c:'gold'});
    if(s.allstars)tags.push({t:`⭐ ${s.allstars}×全明星`,c:''});
    if(allOne)tags.push({t:'🏠 一人一城',c:'hot'});
    if(nick)tags.push({t:`🎙️ ${nick}`,c:'hot'});
    if(ocean)tags.push({t:'🌊 英雄海',c:''});
    if(blade)tags.push({t:`🐉 ${blade.state||'黑历史'}`,c:blade.state==='已洗白'?'':'hot'});
    if(rival)tags.push({t:`⚔️ ${rival.team}宿敌`,c:''});
    else if(landlord)tags.push({t:`🎯 ${landlord.team}杀手`,c:''});
    else if(nemesis)tags.push({t:`😵 ${nemesis.team}苦主`,c:'hot'});
    if(hero&&tags.length<7)tags.push({t:`🎮 ${hero.name} ${Number(hero.value).toFixed(0)}`,c:''});

    return{
      title:identityArchetype(final),
      copy:sentences.slice(0,final?5:4).join(' '),
      tags:tags.slice(0,7),
      evidence:`基于 ${s.seasons} 个完整赛季 · ${memories().length} 条生涯记忆 · ${relationshipCandidates().length} 组长期对手关系动态生成`,
      final
    };
  }

  function portraitHTML(final=false){
    const p=buildStory(final);
    return `<div class="v710-portrait-head"><div><div class="v710-portrait-kicker">${final?'LEGACY PORTRAIT · 最终人物画像':'WHO ARE YOU · 当前人物画像'}</div><h3 class="v710-portrait-title">${esc(p.title)}</h3></div><div class="v710-portrait-era">${final?'职业生涯定稿':`截至 ${Number(careerState.seasonYear||2019)} 赛季`}</div></div>
      <p class="v710-portrait-copy">${esc(p.copy)}</p>
      ${p.tags.length?`<div class="v710-portrait-tags">${p.tags.map(x=>`<span class="v710-portrait-tag ${x.c||''}"><strong>${esc(x.t)}</strong></span>`).join('')}</div>`:''}
      <div class="v710-portrait-evidence">${esc(p.evidence)}</div>`;
  }
  function insertPortrait(host,final=false,id='v710CareerPortrait',before=null){
    if(!host)return;
    host.querySelector(`#${id}`)?.remove();
    const box=document.createElement('section');box.id=id;box.className='v710-portrait';box.innerHTML=portraitHTML(final);
    if(before&&before.parentNode===host)host.insertBefore(box,before);else host.appendChild(box);
    return box;
  }

  const _renderOffseason710=renderOffseason;
  renderOffseason=function(){
    const out=_renderOffseason710();
    if(offseasonState?.phase==='review'){
      const wrap=document.getElementById('offseasonContent');
      const actions=wrap?.querySelector('.offer-actions');
      insertPortrait(wrap,false,'v710OffseasonPortrait',actions||null);
    }
    return out;
  };

  const _renderCareerOverview710=renderCareerOverview;
  renderCareerOverview=function(){
    const out=_renderCareerOverview710();
    const host=els?.careerTabContent||document.getElementById('careerTabContent');
    if(host){
      const first=host.firstElementChild;
      insertPortrait(host,!!careerState.retired,'v710CareerHubPortrait',first||null);
    }
    return out;
  };

  const _renderRetirement710=renderRetirementScreen;
  renderRetirementScreen=function(){
    const out=_renderRetirement710();
    const app=document.querySelector('#retirementScreen .retirement-app');
    const honors=app?.querySelector('.retirement-honors');
    insertPortrait(app,true,'v710RetirementPortrait',honors||null);
    return out;
  };

  const _renderRetiredResume710=renderRetiredCareerResume;
  renderRetiredCareerResume=function(){
    const out=_renderRetiredResume710();
    const app=document.querySelector('#retiredCareerScreen .retired-career-app');
    const honors=app?.querySelector('.retired-resume-section');
    insertPortrait(app,true,'v710RetiredResumePortrait',honors||null);
    return out;
  };

  const _openPress710=openRetirementPressConference;
  openRetirementPressConference=function(){
    const out=_openPress710();
    const body=els?.retirementPressContent?.querySelector('.retirement-press-body');
    if(body){
      body.querySelector('.v710-press-identity')?.remove();
      const p=buildStory(true);
      const div=document.createElement('div');div.className='v710-press-identity';
      div.style.cssText='margin:12px 0;padding:11px 12px;border-left:3px solid var(--accent);background:rgba(255,255,255,.03);border-radius:8px';
      div.innerHTML=`<strong>媒体给你的最终定义：</strong> ${esc(p.title)}<br><span style="color:var(--muted)">${esc(p.copy)}</span>`;
      const btn=body.querySelector('#closeRetirementPressBtn');body.insertBefore(div,btn||null);
    }
    return out;
  };

  window.__OWL_V7100_PORTRAIT_QA={
    version:VER,
    build:(final=false)=>JSON.parse(JSON.stringify(buildStory(!!final))),
    renderCurrent:()=>{renderOffseason();return document.getElementById('v710OffseasonPortrait')?.innerText||''},
    renderFinal:()=>{renderRetirementScreen();return document.getElementById('v710RetirementPortrait')?.innerText||''},
    counts:()=>({
      offseason:document.querySelectorAll('#v710OffseasonPortrait').length,
      career:document.querySelectorAll('#v710CareerHubPortrait').length,
      retirement:document.querySelectorAll('#v710RetirementPortrait').length,
      retiredResume:document.querySelectorAll('#v710RetiredResumePortrait').length
    })
  };
})();
