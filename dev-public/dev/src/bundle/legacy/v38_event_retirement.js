/* ===== BUNDLE MODULE: legacy/v38_event_retirement.js ===== */
/* ==========================================================================
   MODULE: legacy/v38_event_retirement.js
   Compatibility layer: event automation, role competition, retired resume
   Migrated from V6.2 lines 9877-9931; execution order is defined by manifest.json.
   ========================================================================== */
    /* ================= V3.8 · 关键事件设置 / 转位竞争 / 退役履历 ================= */

    function v38RoleCompetition(target,targetOvr){
      const depth=v37RuntimeRoleDepth(careerState.team,target)
        .map(x=>({name:x.name,ovr:Math.round(Number(x.ovr)||70)}))
        .sort((a,b)=>b.ovr-a.ovr);
      if(!depth.length){
        return {depth,best:0,gap:99,key:'open',label:'位置空缺，转位后有很直接的首发机会',detail:'当前一线阵容没有成熟的同位置选手。'};
      }
      const best=depth[0].ovr,gap=targetOvr-best;
      if(gap>=4)return {depth,best,gap,key:'ahead',label:'具备直接争取首发的实力',detail:`你的新位置总评比队内最强同位置高 ${gap} 点，但转位适应期仍会影响开季定位。`};
      if(gap>=-3)return {depth,best,gap,key:'fight',label:'需要重新竞争首发',detail:`你与队内最强同位置相差 ${gap>=0?'+':''}${gap} 点，原位置的首发承诺不会自动继承到新职责。`};
      return {depth,best,gap,key:'bench',label:'大概率从轮换 / 替补开始',detail:`你的新位置总评暂时落后队内最强同位置 ${Math.abs(gap)} 点，需要靠适应度、状态和实际比赛重新抢位置。`};
    }

    renderRolePlanning=function(wrap){
      const current=state.role,target=offseasonState.roleTarget;
      const currentOvr=v36RoleOvr(current),targetOvr=v36RoleOvr(target),effectiveTargetOvr=clamp(Math.round(targetOvr+(70-100)*.07),45,99),delta=effectiveTargetOvr-currentOvr;
      const comp=v38RoleCompetition(target,targetOvr);
      const competitors=comp.depth.slice(0,4).map(p=>`<span class="role-competitor">${v36FlagMarkup(p.name,false)}<b>${p.name}</b><em>OVR ${p.ovr}</em></span>`).join('');
      wrap.innerHTML=`
        <div class="offseason-kicker">ROLE PLAN · 位置规划</div>
        <h3>教练提出了转位置方案</h3>
        <p>教练组认为你的能力结构具备转型空间。转位之后会使用新职责的总评、位置适应度和队内竞争重新决定出场顺位，不会把原位置的首发身份直接复制过去。</p>
        <div class="role-shift-board">
          <div class="role-shift-card"><span>当前位置</span><strong>${current}</strong><em>职责总评 ${currentOvr}</em></div>
          <div class="role-shift-arrow">➜</div>
          <div class="role-shift-card proposed"><span>建议转型</span><strong>${target}</strong><em>理论职责总评 ${targetOvr} · 初始适应 70%（有效约 ${effectiveTargetOvr}，${delta>=0?'+':''}${delta}）</em></div>
        </div>
        <div class="role-competition-card ${comp.key}">
          <div class="role-competition-head"><div><small>${careerState.team?.name||'当前队伍'} · ${target}</small><strong>${comp.label}</strong></div><span>${comp.depth.length?`同位置 ${comp.depth.length} 人`:'位置空缺'}</span></div>
          <p>${comp.detail}</p>
          <div class="role-competitor-list">${competitors||'<span class="role-competitor empty">当前没有成熟的同位置竞争者</span>'}</div>
        </div>
        <div class="role-choice-grid">
          <button class="role-choice" data-role-choice="accept"><strong>接受正式转位</strong><span>下赛季以 ${target} 身份进入竞争。位置适应从70%开始，并通过出场逐步恢复。</span></button>
          <button class="role-choice" data-role-choice="trial"><strong>保留原位，兼练新位置</strong><span>主位置仍为 ${current}，同时获得 ${target} 客串标签，不立刻改变比赛职责权重。</span></button>
          <button class="role-choice" data-role-choice="decline"><strong>拒绝转位，强化原位置</strong><span>继续以 ${current} 为核心路线，把训练资源留给当前职责。</span></button>
        </div>`;
      wrap.querySelectorAll('[data-role-choice]').forEach(btn=>btn.addEventListener('click',()=>applyRoleDecision(btn.dataset.roleChoice)));
    };


