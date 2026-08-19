/* ===== BUNDLE MODULE: legacy/v36_division_flags_role.js ===== */
/* ==========================================================================
   MODULE: legacy/v36_division_flags_role.js
   Compatibility layer: division display, image flags, role-transition criteria
   Migrated from V6.2 lines 9629-9712; execution order is defined by manifest.json.
   ========================================================================== */
    /* ================= V3.6 · 赛区 / 国旗 / 转位判定 ================= */

    // 1) 2019两赛区显示校正：随机战队卡只显示真实 Atlantic / Pacific 分区。
    // 当前20队division数据按2019名单固定，不再用城市名拼“XX赛区”。
    const V36_DIVISION_TEAMS={
      Atlantic:new Set(['ATL','BOS','FLA','HOU','LDN','NYXL','PAR','PHI','TOR','WAS']),
      Pacific:new Set(['CDH','DAL','GZC','HZS','GLA','VAL','SFS','SEO','SHD','VAN'])
    };
    TEAMS.forEach(team=>{
      if(V36_DIVISION_TEAMS.Atlantic.has(team.short))team.division='Atlantic';
      else if(V36_DIVISION_TEAMS.Pacific.has(team.short))team.division='Pacific';
    });

    // 2) 国旗改为图片，不再依赖操作系统是否支持彩色Emoji。
    const V36_FLAG_CODE_BY_EMOJI={
      '🇺🇸':'us','🇷🇺':'ru','🇩🇰':'dk','🇩🇪':'de','🇫🇮':'fi','🇬🇧':'gb','🇳🇿':'nz','🇧🇷':'br','🇨🇦':'ca',
      '🇨🇳':'cn','🇹🇼':'tw','🇫🇷':'fr','🇹🇭':'th','🇦🇺':'au','🇸🇪':'se','🇧🇪':'be','🇪🇸':'es','🇵🇱':'pl',
      '🇵🇹':'pt','🇮🇱':'il','🇱🇻':'lv','🇰🇷':'kr'
    };
    function v36CountryCode(name,isUser=false){
      if(isUser||name===getPlayerName())return null;
      const emoji=V35_PLAYER_FLAGS[name]||'🇰🇷';
      return V36_FLAG_CODE_BY_EMOJI[emoji]||'kr';
    }
    function v36FlagMarkup(name,isUser=false){
      const code=v36CountryCode(name,isUser);
      if(!code)return '<span class="player-flag user-world" title="自建选手">🌐</span>';
      const upper=code.toUpperCase();
      return `<span class="player-flag" title="${upper}"><img src="https://flagcdn.com/${code}.svg" alt="${upper}" loading="lazy" onerror="this.parentElement.textContent='${upper}'"></span>`;
    }
    v35PrependFlag=function(el,name,isUser=false){
      if(!el||el.querySelector(':scope > .player-flag'))return;
      el.insertAdjacentHTML('afterbegin',v36FlagMarkup(name,isUser));
    };
    renderFmvpCard=function(){
      const award=resolveFinalsMVP();if(!award)return '';
      return `<div class="fmvp-card"><div class="fmvp-icon">👑</div><div><small>总决赛 MVP</small><strong>${v36FlagMarkup(award.name,award.isUser)}${award.name}${award.isUser?' · 你':''}</strong><em>${award.team} · ${award.role}</em></div><div class="fmvp-rating">${award.rating.toFixed(1)}</div></div>`;
    };

    // 3) 转位置：完全使用V3.5新职责OVR，而不是旧“适配评分”。
    function v36CurrentAttrs(){
      const attrs={};ATTRS.forEach(a=>attrs[a.key]=state.locked[a.key]?.value||70);return attrs;
    }
    function v36RoleOvr(role){return v35RoleCompositeOvr(v36CurrentAttrs(),role);}
    function v36RoleTransitionEligible(target){
      if(careerState.age<19)return false;
      if(careerState.lastRolePlanYear!=null&&careerState.seasonYear-careerState.lastRolePlanYear<3)return false;
      const currentOvr=v36RoleOvr(state.role),targetOvr=v36RoleOvr(target),form=careerState.condition;
      const highFormPath=form>=80&&targetOvr>=currentOvr*.80;
      const lowFormPath=form<=60&&targetOvr>=currentOvr;
      return highFormPath||lowFormPath;
    }
    const _v36SetupOffseasonBase=setupOffseason;
    setupOffseason=function(){
      _v36SetupOffseasonBase();
      const candidates=ROLE_TRANSITION_CANDIDATES[state.role]||ROLES.map(r=>r.name).filter(r=>r!==state.role);
      offseasonState.roleTarget=[...candidates].sort((a,b)=>v36RoleOvr(b)-v36RoleOvr(a))[0];
      offseasonState.roleOpportunity=isRoleTrainingUnlocked()&&v36RoleTransitionEligible(offseasonState.roleTarget);
    };
    renderRolePlanning=function(wrap){
      const current=state.role,target=offseasonState.roleTarget;
      const currentOvr=v36RoleOvr(current),targetOvr=v36RoleOvr(target),ratio=Math.round(targetOvr/Math.max(1,currentOvr)*100),form=careerState.condition;
      const path=form>=80?'当前竞技状态很好，教练组愿意接受一定的转位损耗。':'当前竞技状态低迷，只有新位置理论总评不低于原位置，教练组才会提出正式转型。';
      wrap.innerHTML=`
        <div class="offseason-kicker">ROLE PLAN · 位置规划</div>
        <h3>教练提出了转位置方案</h3>
        <p>${path} 本次评估直接使用新的职责OVR体系，不再沿用旧版“位置适配评分”。</p>
        <div class="role-shift-board">
          <div class="role-shift-card"><span>当前位置</span><strong>${current}</strong><em>职责总评 ${currentOvr}</em></div>
          <div class="role-shift-arrow">➜</div>
          <div class="role-shift-card proposed"><span>建议转型</span><strong>${target}</strong><em>转位总评 ${targetOvr} · ${ratio}%</em></div>
        </div>
        <div style="margin:10px 0 14px;color:var(--muted);font-size:11px">当前竞技状态：<strong style="color:var(--ink)">${form}</strong> · 触发规则：状态≥80时新位置总评至少达到当前80%；状态≤60时新位置总评必须不低于当前。</div>
        <div class="role-choice-grid">
          <button class="role-choice" data-role-choice="accept"><strong>接受正式转位</strong><span>下赛季以 ${target} 身份进入市场。位置适应从70%开始，并通过新赛季出场逐步恢复。</span></button>
          <button class="role-choice" data-role-choice="trial"><strong>保留原位，兼练新位置</strong><span>主位置仍为 ${current}，同时获得 ${target} 客串标签，不立刻改变比赛职责权重。</span></button>
          <button class="role-choice" data-role-choice="decline"><strong>拒绝转位，强化原位置</strong><span>继续以 ${current} 为核心路线，把训练资源留给当前职责。</span></button>
        </div>`;
      wrap.querySelectorAll('[data-role-choice]').forEach(btn=>btn.addEventListener('click',()=>applyRoleDecision(btn.dataset.roleChoice)));
    };






