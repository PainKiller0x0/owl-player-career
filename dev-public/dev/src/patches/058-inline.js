/* ======================================================================
   Public Beta 1.9 RC8 · Career Continuity & Choice Polish
   - second-pass fake-choice cleanup
   - health events use two honest, medically sensible routes
   - archive seasons show one continuing career thread without extra popups
   - final operation-copy trim and version sync
   ====================================================================== */
(function(){
  const VER='Public Beta 1.9 RC8';
  const esc22=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ev22=id=>SEASON_EVENTS.find(x=>x.id===id);
  const set22=(id,label,effects,desc)=>{const c=ev22(id)?.choices?.find(x=>x.label===label);if(!c)return false;c.effects={...effects};if(desc)c.desc=desc;return true;};

  // Health choices should not contain a knowingly bad "be tough and ignore care" button.
  // Keep the real career decision: miss one match and recover, or remain available at a short-term performance cost.
  const food=ev22('food-poisoning');
  if(food)food.choices=[
    {label:'报备并休息一场',desc:'缺席下一场，恢复最多；不会记入伤病次数。',effects:{condition:16,illnessRest:1,coachTrust:2},outcome:'你缺席了下一场比赛，身体很快恢复。病假不会计入伤病记录。'},
    {label:'接受治疗后出战',desc:'保住出场，但下一场状态和评分会受影响。',effects:{condition:2,illnessGames:1,illnessPenalty:-1.6,coachTrust:3,nextMatchBonus:-.4},outcome:'治疗让你能够出场，但身体状态明显不在最佳线。'}
  ];
  const flu=ev22('flu-fever');
  if(flu)flu.choices=[
    {label:'隔离休息一场',desc:'缺席下一场并快速恢复；不会记入伤病记录。',effects:{condition:18,illnessRest:1,teammateBond:2},outcome:'你被安排隔离休息。下一场缺席，但恢复更快，也避免影响队友。'},
    {label:'治疗后有限度出战',desc:'保住出场，下一场比赛状态会下降。',effects:{condition:3,illnessGames:1,illnessPenalty:-1.5,coachTrust:2,nextMatchBonus:-.3},outcome:'体温稳定下来，你可以出场，但反应和耐力仍会受到影响。'}
  ];

  set22('map-pool','主动负责专项训练',{awarenessAttr:1,coachTrust:5,teammateBond:2,condition:-8},'提升地图理解与教练信任，训练负担更高。');
  set22('map-pool','专注自己的站位路线',{nextRatingBonus:.26,nextMatchBonus:1.0,condition:-2,teammateBond:-3},'优先保证个人发挥，团队收益较少。');
  set22('map-pool','让队长统一安排',{teammateBond:9,coachTrust:4,condition:4},'强化团队同步，并保留更多状态。');

  set22('v100-map-specialist','接过地图主导权',{awarenessAttr:1,coachTrust:6,nextMatchBonus:1.1,condition:-8},'获得更高战术话语权，也承担更多训练与比赛压力。');
  set22('v100-map-specialist','和队长共同负责',{coachTrust:5,teammateBond:9,nextMatchBonus:.4,condition:-2},'分担责任，强化团队协同。');
  set22('v100-map-specialist','暂时只提供建议',{condition:9,nextRatingBonus:.16,coachTrust:-2},'保留个人精力，放弃部分领导机会。');

  set22('v78-nickname-interview','“挺好，就这么叫吧”',{popularity:15,teammateBond:2,condition:-2},'主动经营个人标签，获得更多关注。');
  set22('v78-nickname-interview','“随他们开心”',{popularity:5,coachTrust:2,condition:4},'不经营这个梗，把精力留给比赛。');
  set22('v78-nickname-interview','“别这么叫我”',{popularity:-7,coachTrust:4,condition:8},'明确个人边界，热度下降但额外曝光更少。');

  // -------------------------------------------------------------------
  // Cross-season continuity: attach one existing narrative thread to each
  // archived year. No new event, no extra click.
  // -------------------------------------------------------------------
  function threadFor22(year){
    year=Number(year||0);
    const narr=(careerState.v79NarrativeHistory||[]).filter(x=>Number(x.year)===year).sort((a,b)=>Number(b.importance||0)-Number(a.importance||0));
    if(narr[0])return{icon:narr[0].icon||'↪️',title:narr[0].title||'旧故事有了后续',text:narr[0].text||''};
    const mems=(careerState.careerMemories||[]).filter(m=>Number(m.lastMentionYear||m.createdYear||m.year)===year&&Number(m.createdYear||m.year||year)<year)
      .sort((a,b)=>Number(b.heat||0)-Number(a.heat||0)||Number(b.weight||0)-Number(a.weight||0));
    if(mems[0])return{icon:mems[0].icon||'↪️',title:`${mems[0].title} · ${mems[0].state||'延续'}`,text:mems[0].text||''};
    const archive=careerState.careerArchive||[],idx=archive.findIndex(r=>Number(r.year)===year),cur=idx>=0?archive[idx]:null,prev=idx>0?archive[idx-1]:null;
    if(cur&&prev&&cur.team!==prev.team)return{icon:'🔁',title:`转会：${prev.team} → ${cur.team}`,text:`${year}赛季换了新的队伍环境。`};
    if(cur&&prev&&cur.role!==prev.role)return{icon:'🔄',title:`转位：${prev.role} → ${cur.role}`,text:`${year}赛季以新职责继续职业生涯。`};
    if(cur&&prev&&cur.result==='总冠军'&&prev.result==='总冠军')return{icon:'🏆',title:'卫冕成功',text:`连续两个赛季拿下总冠军。`};
    if(cur&&prev&&prev.result==='总冠军'&&cur.result==='联赛亚军')return{icon:'🥈',title:'卫冕止步亚军',text:`距离连续夺冠只差最后一步。`};
    if(cur&&prev&&cur.result==='联赛亚军'&&prev.result==='联赛亚军')return{icon:'🎯',title:'连续冲到决赛',text:`连续两个赛季打进最终舞台。`};
    return null;
  }
  function ensureThread22(r){if(!r)return null;if(!r.seasonThread)r.seasonThread=threadFor22(r.year);return r.seasonThread||null;}
  const _record22=recordCompletedCareerSeason;
  recordCompletedCareerSeason=function(){const before=careerState.careerArchive?.length||0,out=_record22.apply(this,arguments);if((careerState.careerArchive?.length||0)>before)ensureThread22(careerState.careerArchive.at(-1));return out;};
  (careerState.careerArchive||[]).forEach(ensureThread22);

  function injectThreads22(){
    const rows=[...document.querySelectorAll('#careerTabContent .career-season-row')],archive=[...(careerState.careerArchive||[])].reverse();
    rows.forEach((row,i)=>{row.querySelector('.v22-season-thread')?.remove();const t=ensureThread22(archive[i]);if(!t)return;const host=row.children?.[1];if(!host)return;const n=document.createElement('div');n.className='v22-season-thread';n.innerHTML=`${esc22(t.icon)} <strong>${esc22(t.title)}</strong>`;host.appendChild(n);});
  }
  const _overview22=renderCareerOverview;
  renderCareerOverview=function(){const out=_overview22.apply(this,arguments);injectThreads22();return out;};

  window.__OWL_V22_UX={version:VER,thread:threadFor22,ensureThread:ensureThread22};
})();
