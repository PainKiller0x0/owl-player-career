/* ===== BUNDLE MODULE: systems/v73_hero_ban_plan_b.js ===== */
/* ==========================================================================
   V7.3 · Hero Ban 后 Plan B
   - 2025+: 地图 → 阵容锁定 → Hero Ban → Plan B英雄/战术适应 → 开图
   - Ban只影响被对手禁掉英雄的一侧，不再把双方Ban一起扣到每个人头上
   - 根据独立英雄熟练度、地图适配、替代英雄差距与个人适应属性计算实际衰减
   - 阵容锁定后不再换人：扛得住就切Plan B，扛不住就真掉战力
   ========================================================================== */

  function v73OpposingBan(side){
    if(!matchState.currentBans)return null;
    return side==='home'?matchState.currentBans.away:matchState.currentBans.home;
  }
  function v73SideFromRoster(roster,isHome=false){
    if(roster===matchState.homeRoster)return 'home';
    if(roster===matchState.awayRoster)return 'away';
    return isHome?'home':'away';
  }
  function v73Adaptability(player){
    const a=player?.attrs||{},vals=[a.decision,a.mechanics,a.cooldown,a.awareness].filter(Number.isFinite);
    const avg=vals.length?vals.reduce((x,y)=>x+y,0)/vals.length:Number(player?.overall||78);
    return clamp((avg-65)/30,0,1);
  }
  function v73HeroPlans(player,map,side){
    const banName=v73OpposingBan(side),group=v71RoleGroup(player.role);
    const pool=v71HeroPool(player).map(h=>({...h,mapScore:h.value+v71HeroMapBonus(h,map)})).sort((a,b)=>b.mapScore-a.mapScore);
    const ideal=pool[0]||null,banned=banName?pool.find(h=>h.name===banName):null;
    const legal=pool.filter(h=>h.name!==banName),planB=legal[0]||null;
    const roleTouched=!!banned&&banned.group===group;
    const directHit=!!ideal&&ideal.name===banName;
    const closeFlex=!!banned&&!!ideal&&banned.mapScore>=ideal.mapScore-3;
    const rawDrop=ideal&&planB?Math.max(0,ideal.mapScore-planB.mapScore):0;
    const nearAlts=ideal?legal.filter(h=>h.mapScore>=ideal.mapScore-4).length:0;
    const adaptability=v73Adaptability(player);
    let penalty=0,status='未受影响',detail='对方Ban没有碰到本图核心英雄。';
    if(directHit){
      // 英雄海与高决策选手更容易把理论掉档吃掉一部分，但不能完全免疫。
      const cushion=Math.min(2.2,adaptability*1.35+Math.min(3,nearAlts)*.28);
      penalty=-clamp(rawDrop*.82-cushion+.45,.25,9.5);
      if(rawDrop<=1.8){status='无缝切换';detail='招牌被封，但Plan B几乎同档。';}
      else if(rawDrop<=4.5){status='Plan B充足';detail='需要换英雄，强度只有轻微损失。';}
      else if(rawDrop<=7.5){status='明显降档';detail='被迫离开本图最佳英雄，发挥明显受限。';}
      else{status='被Ban穿';detail='替代英雄断档，阵容锁死后只能硬扛。';}
    }else if(roleTouched&&closeFlex){
      penalty=-clamp(.35+(banned.mapScore-(ideal?.mapScore||banned.mapScore)+3)*.12,0.25,1.1);
      status='战术受限';detail='首选仍在，但一个高价值备选被拿走。';
    }
    return {player,side,banName,ideal,banned,planB,roleTouched,directHit,rawDrop,nearAlts,adaptability,penalty,status,detail};
  }
  function v73HeroArchetype(hero){
    const n=hero?.name||'';
    if(/温斯顿|D\.Va|破坏球|末日铁拳|猎空|源氏|回声|探奇|卢西奥|雾子|朱诺|飞天猫|安燃/.test(n))return '突进';
    if(/西格玛|黑百合|艾什|卡西迪|索杰恩|士兵|半藏|安娜|巴蒂斯特|伊拉锐|西拉/.test(n))return '消耗';
    if(/莱因哈特|奥丽莎|查莉娅|路霸|拉玛刹|毛加|渣客女王|美|死神|秩序之光|布丽吉塔|莫伊拉/.test(n))return '阵地';
    return '均衡';
  }
  function v73TeamPlan(side,map){
    const roster=side==='home'?matchState.homeRoster:matchState.awayRoster;
    const rows=(roster||[]).map(p=>v73HeroPlans(p,map,side));
    const counts={'突进':0,'消耗':0,'阵地':0,'均衡':0};
    rows.forEach(r=>counts[v73HeroArchetype(r.planB||r.ideal)]++);
    const tactic=['突进','消耗','阵地'].sort((a,b)=>counts[b]-counts[a])[0];
    const directHits=rows.filter(r=>r.directHit).length,severe=rows.filter(r=>r.status==='被Ban穿').length;
    const avgPenalty=rows.length?rows.reduce((s,r)=>s+r.penalty,0)/rows.length:0;
    // 单个选手衰减会进入individual；这里仅补阵容联动损失，避免双重重罚。
    const teamPenalty=-clamp(severe*.65+Math.max(0,directHits-1)*.22,0,2.2);
    const worst=[...rows].sort((a,b)=>a.penalty-b.penalty)[0]||null;
    const team=side==='home'?matchState.homeTeam:matchState.awayTeam;
    return {side,team,rows,tactic,counts,directHits,severe,avgPenalty,teamPenalty,worst,banName:v73OpposingBan(side)};
  }
  function v73PlanText(row){
    if(!row)return '—';
    const from=row.ideal?.name||'—',to=row.planB?.name||from;
    if(!row.roleTouched)return `${row.player.name}：${from}`;
    if(row.directHit)return `${row.player.name}：${from} → ${to} · ${row.status}${row.penalty<-.05?` ${row.penalty.toFixed(1)}`:''}`;
    return `${row.player.name}：${from} · ${row.status}`;
  }

  // 修正V7.1遗留：roleEffective不再把home/away两个Ban同时作用于所有选手。
  // Ban后的side-aware衰减统一在teamMapPower里做。
  roleEffective=function(player,map,styleKey,isUser){
    const base=_v71RoleEffectiveBase(player,map,styleKey,isUser);
    if(v71Year()<2024)return base;
    const best=v71BestHeroFor(player,map,[]),heroLift=best?clamp((best.mapScore-82)*.09,-2.3,2.5):0;
    return base+heroLift;
  };

  // Ban价值也改成“这人本图真准备玩什么”。Ban一个熟练但本图根本不是首选的英雄，不该像点穴一样神奇。
  v71HeroBanValue=function(hero,targetRoster,map){
    let best=0;
    (targetRoster||[]).filter(p=>v71RoleGroup(p.role)===hero.group).forEach(p=>{
      const pool=v71HeroPool(p).map(h=>({...h,mapScore:h.value+v71HeroMapBonus(h,map)})).sort((a,b)=>b.mapScore-a.mapScore);
      const ideal=pool[0],hit=pool.find(h=>h.name===hero.name),alt=pool.filter(h=>h.name!==hero.name)[0];if(!hit||!ideal)return;
      const direct=ideal.name===hero.name,drop=direct?Math.max(0,ideal.mapScore-(alt?.mapScore||65)):Math.max(0,hit.mapScore-ideal.mapScore+3);
      const fragility=direct?drop*4.0:(hit.mapScore>=ideal.mapScore-3?4:0);
      const value=(direct?ideal.mapScore*1.18:hit.mapScore*.42)+fragility+v71HeroMapBonus(hero,map)*2.4+(p.isUser?4:0);
      best=Math.max(best,value);
    });
    return best;
  };

  const _v73TeamMapPowerBase=teamMapPower;
  teamMapPower=function(roster,map,tactic,enemyTactic,isHome){
    const data=_v73TeamMapPowerBase(roster,map,tactic,enemyTactic,isHome);
    if(!v71HasStrategicDraft()||!matchState.currentBans)return data;
    const side=v73SideFromRoster(roster,isHome),plan=v73TeamPlan(side,map);
    const rowMap=new Map(plan.rows.map(r=>[v72PlayerKey(r.player),r]));
    const individual=data.individual.map((v,i)=>v+(rowMap.get(v72PlayerKey(roster[i]))?.penalty||0));
    const oldAvg=data.individual.reduce((a,b)=>a+b,0)/Math.max(1,data.individual.length),newAvg=individual.reduce((a,b)=>a+b,0)/Math.max(1,individual.length);
    const tacticPlanBonus=plan.tactic===tactic?.35:0;
    const power=data.power+(newAvg-oldAvg)*.73+plan.teamPenalty+tacticPlanBonus;
    return {...data,power,individual,heroPlan:plan};
  };

  const _v73ChooseTacticBase=chooseTactic;
  chooseTactic=function(roster,map){
    const base=_v73ChooseTacticBase(roster,map);
    if(!v71HasStrategicDraft()||!matchState.currentBans)return base;
    const side=v73SideFromRoster(roster,roster===matchState.homeRoster),plan=v73TeamPlan(side,map);
    // Ban真的打穿核心时，更倾向围绕剩余英雄重构Plan B；否则保留原战术，避免每图抽风。
    return (plan.directHits>=2||plan.severe>=1)?plan.tactic:base;
  };

  const _v73ResolveBansBase=v71ResolveBans;
  v71ResolveBans=function(){
    if(!v71HasStrategicDraft())return _v73ResolveBansBase();
    _v73ResolveBansBase();
    if(matchState.pregamePhase!=='ready'||!matchState.currentBans)return;
    const map=currentMatchMap();if(!map)return;
    const home=v73TeamPlan('home',map),away=v73TeamPlan('away',map);matchState.v73PlanB={home,away,mapIndex:matchState.mapIndex};
    const userRow=home.rows.find(r=>r.player.isUser),rec=[...(matchState.v72PlayerMaps||[])].reverse().find(x=>x.mapIndex===matchState.mapIndex);
    if(rec&&userRow)Object.assign(rec,{opponentBan:home.banName||null,planB:userRow.planB?.name||null,banStatus:userRow.status,banPenalty:userRow.penalty});
    const h=home.worst&&home.worst.penalty<-.05?v73PlanText(home.worst):'核心英雄池完整';
    const a=away.worst&&away.worst.penalty<-.05?v73PlanText(away.worst):'核心英雄池完整';
    matchState.logs.push({map:`M${matchState.mapIndex+1}`,side:'event',text:`Plan B确认：${matchState.homeTeam.name}【${h}】；${matchState.awayTeam.name}【${a}】。阵容已经锁定，接下来只能靠英雄池和临场适应扛Ban。`});
    renderMatch();
  };

  const _v73CommitSeriesMapBase=commitSeriesMap;
  commitSeriesMap=function(map,side=matchState.mapPicker,rerender=true){
    const r=_v73CommitSeriesMapBase(map,side,rerender);if(v71HasStrategicDraft())matchState.v73PlanB=null;return r;
  };
  const _v73AdvanceSeriesMapBase=advanceSeriesMapAfterResult;
  advanceSeriesMapAfterResult=function(winner){
    const r=_v73AdvanceSeriesMapBase(winner);if(v71HasStrategicDraft())matchState.v73PlanB=null;return r;
  };

  function v73RenderTeamPlan(plan,isUserSide=false){
    if(!plan)return '';
    const impacted=plan.rows.filter(r=>r.penalty<-.05).sort((a,b)=>a.penalty-b.penalty),user=plan.rows.find(r=>r.player.isUser);
    const show=v72UniquePlayers([user?.player,...impacted.slice(0,2).map(r=>r.player)]).map(p=>plan.rows.find(r=>v72PlayerKey(r.player)===v72PlayerKey(p))).filter(Boolean);
    return `<div class="v73-plan-team ${isUserSide?'user':''}"><div class="v73-plan-head"><div><span>${plan.team?.name||'队伍'}</span><strong>${plan.banName?`遭禁：${plan.banName}`:'无禁用'}</strong></div><b>${plan.tactic} Plan B</b></div><div class="v73-plan-meta"><span>直接命中 ${plan.directHits}</span><span>严重断档 ${plan.severe}</span><span>阵容修正 ${plan.teamPenalty.toFixed(1)}</span></div>${show.length?`<div class="v73-plan-rows">${show.map(r=>`<div class="v73-plan-row ${r.player.isUser?'me':''}"><span>${r.player.name}${r.player.isUser?'（你）':''}</span><strong>${r.directHit?`${r.ideal?.name||'—'} → ${r.planB?.name||'—'}`:(r.ideal?.name||'—')}</strong><em class="${r.status==='被Ban穿'||r.status==='明显降档'?'bad':r.status==='无缝切换'||r.status==='Plan B充足'?'good':''}">${r.status}${r.penalty<-.05?` · ${r.penalty.toFixed(1)}`:''}</em><small>${r.detail}</small></div>`).join('')}</div>`:`<div class="v73-plan-clean">✓ 本图核心选择没有被Ban命中</div>`}</div>`;
  }

  const _v73RenderMapControlBase=renderMapControl;
  renderMapControl=function(){
    _v73RenderMapControlBase();
    if(!v71HasStrategicDraft()||matchState.finished||matchState.pregamePhase!=='ready'||!matchState.currentBans)return;
    const area=document.getElementById('mapControlArea'),map=currentMatchMap();if(!area||!map)return;
    const plans=matchState.v73PlanB&&matchState.v73PlanB.mapIndex===matchState.mapIndex?matchState.v73PlanB:{home:v73TeamPlan('home',map),away:v73TeamPlan('away',map),mapIndex:matchState.mapIndex};
    matchState.v73PlanB=plans;
    const panel=document.createElement('div');panel.className='v73-plan-panel';panel.innerHTML=`<div class="v73-plan-title"><div><span>🧠 Ban后落地 · Plan B</span><strong>阵容已锁，开始执行Plan B</strong></div><small>不是Ban完再换人；英雄池够不够深，现在才见真章。</small></div><div class="v73-plan-grid">${v73RenderTeamPlan(plans.home,true)}${v73RenderTeamPlan(plans.away,false)}</div>`;
    const ban=area.querySelector('.v71-ban-summary');if(ban)ban.insertAdjacentElement('afterend',panel);else area.prepend(panel);
  };

  // 阵容卡在Ban完成后直接亮出本图实际首选英雄；被砍到招牌时显示替代方案。
  const _v73RenderRostersBase=renderRosters;
  renderRosters=function(){
    _v73RenderRostersBase();
    if(!v71HasStrategicDraft()||matchState.pregamePhase!=='ready'||!matchState.currentBans)return;
    const map=currentMatchMap();if(!map)return;
    [['homeRoster','home'],['awayRoster','away']].forEach(([id,side])=>{
      const box=document.getElementById(id),roster=side==='home'?matchState.homeRoster:matchState.awayRoster;if(!box)return;
      [...box.querySelectorAll('.roster-player')].forEach((node,i)=>{
        const p=roster[i];if(!p)return;const plan=v73HeroPlans(p,map,side),tag=document.createElement('div');tag.className=`v73-plan-chip ${plan.directHit?'hit':''}`;
        tag.innerHTML=plan.directHit?`🚫 ${plan.ideal?.name||'—'} → <b>${plan.planB?.name||'—'}</b> · ${plan.status}`:`▶ ${plan.planB?.name||plan.ideal?.name||'—'} · ${plan.status}`;
        node.querySelector('div[style*="min-width"]')?.appendChild(tag);
      });
    });
  };

  window.__OWL_V73_DIAGNOSTICS=()=>{
    const map=currentMatchMap(),active=v71HasStrategicDraft()&&!!map&&!!matchState.currentBans;
    const home=active?v73TeamPlan('home',map):null,away=active?v73TeamPlan('away',map):null;
    return {version:'7.3',year:v71Year(),map:map?.name||null,bans:matchState.currentBans||null,home:home?{banAgainst:home.banName,tactic:home.tactic,directHits:home.directHits,severe:home.severe,worst:home.worst?v73PlanText(home.worst):null}:null,away:away?{banAgainst:away.banName,tactic:away.tactic,directHits:away.directHits,severe:away.severe,worst:away.worst?v73PlanText(away.worst):null}:null};
  };

  if(!document.getElementById('v73PlanBStyle')){const st=document.createElement('style');st.id='v73PlanBStyle';st.textContent=`.v73-plan-panel{margin:10px 0 12px;padding:12px;border:1px solid var(--line);border-radius:15px;background:rgba(44,110,170,.045)}.v73-plan-title{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin-bottom:10px}.v73-plan-title span{display:block;color:var(--muted);font-size:10px}.v73-plan-title strong{display:block;margin-top:2px;font-size:13px}.v73-plan-title small{color:var(--muted);text-align:right}.v73-plan-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.v73-plan-team{padding:10px;border:1px solid var(--line);border-radius:12px;background:rgba(255,255,255,.52)}.v73-plan-team.user{box-shadow:inset 3px 0 0 rgba(255,100,56,.58)}.v73-plan-head{display:flex;justify-content:space-between;gap:8px;align-items:center}.v73-plan-head span{display:block;color:var(--muted);font-size:9px}.v73-plan-head strong{display:block;font-size:11px;margin-top:2px}.v73-plan-head>b{font-size:10px;color:var(--accent)}.v73-plan-meta{display:flex;gap:5px;flex-wrap:wrap;margin:7px 0}.v73-plan-meta span{font-size:9px;border:1px solid var(--line);border-radius:999px;padding:2px 6px;color:var(--muted)}.v73-plan-rows{display:grid;gap:5px}.v73-plan-row{display:grid;grid-template-columns:minmax(70px,.8fr) minmax(88px,1.2fr) auto;gap:3px 7px;align-items:center;padding:6px 7px;border-radius:9px;background:rgba(0,0,0,.028)}.v73-plan-row.me{outline:1px solid rgba(255,100,56,.28)}.v73-plan-row span{font-size:10px}.v73-plan-row strong{font-size:10px}.v73-plan-row em{font-style:normal;font-size:9px;color:var(--muted);white-space:nowrap}.v73-plan-row em.bad{color:#c45f45;font-weight:800}.v73-plan-row em.good{color:#26805d;font-weight:800}.v73-plan-row small{grid-column:1/-1;color:var(--muted);font-size:9px}.v73-plan-clean{font-size:10px;color:#26805d;padding-top:4px}.v73-plan-chip{margin-top:4px;font-size:9px;color:#26805d}.v73-plan-chip.hit{color:#c45f45}.v73-plan-chip b{color:inherit}html[data-theme="dark"] .v73-plan-panel,html[data-theme="dark"] .v73-plan-team{background:rgba(255,255,255,.045)}@media(max-width:760px){.v73-plan-grid{grid-template-columns:1fr}.v73-plan-title{display:block}.v73-plan-title small{display:block;text-align:left;margin-top:4px}.v73-plan-row{grid-template-columns:1fr auto}.v73-plan-row strong{grid-column:1/-1}}`;document.head.appendChild(st);}

