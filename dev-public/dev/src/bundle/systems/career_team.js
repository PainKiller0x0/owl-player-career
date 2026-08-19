/* ===== BUNDLE MODULE: systems/career_team.js ===== */
/* ==========================================================================
   MODULE: systems/career_team.js
   Career team selection, contract confirmation and roster setup
   Migrated from V6.2 lines 4838-5140; execution order is defined by manifest.json.
   ========================================================================== */
    /* ---------------- 签约与阵容确认 ---------------- */
    const careerState = {
      team:null,
      starters:[],
      bench:[],
      rank:null,
      goal:'冲击季后赛',
      tactic:'消耗',
      condition:82,
      coachTrust:60,
      teammateBond:58,
      popularity:18,
      nextMatchBonus:0,
      nextRatingBonus:0,
      positionTrial:null,
      roleAdaptation:100,
      contract:null,
      seasonYear:2019,
      careerYears:1,
      roleHistory:[],
      awaitingTeamChoice:false,
      teamSelectionTarget:null,
      teamSelectManual:false,
      age:16,
      startAge:16,
      birthYear:2003,
      retired:false,
      retirementReason:null,
      careerArchive:[],
      peakOvr:0,
      injuryGames:0,
      injuryPenalty:0,
      illnessGames:0,
      illnessPenalty:0,
      illnessRestGames:0,
      injuryHistory:[],
      recentEventIds:[],
      lastRolePlanYear:null,
      contractTickYear:null,
      relationshipTeamName:null
    };

    function enterCareerTeam() {
      openRookieTeamSelection();
    }

    function enterRevealScreen() {
      renderRevealScreen();
      showScreen('reveal');
    }

    function setupCareerTeam(forceNew, fixedTeam=null) {
      if (seasonState.active) {
        if (seasonState.timer) clearTimeout(seasonState.timer);
        seasonState.active=false;
        seasonState.baseLocked=null;
        resetPlayoffState();
      }
      const previousName = careerState.team?.name;
      const pool = TEAMS.filter(t => !forceNew || t.name !== previousName);
      careerState.team = fixedTeam || pick(pool.length ? pool : TEAMS);
      careerState.rank = rand(5, 18);
      careerState.goal = careerState.rank <= 6 ? '争夺联赛冠军' : careerState.rank <= 10 ? '冲击季后赛' : '完成阵容磨合';
      careerState.tactic = pick(TACTICS);
      if(careerState.careerYears===1) {
        careerState.contract={years:2,remaining:2,salary:12,rolePromise:'新秀首发',teamName:careerState.team.name};
        careerState.contractTickYear=null;
      }

      matchState.homeTeam = careerState.team;
      careerState.starters = createRoster(careerState.team, true);
      const usedNames = new Set(careerState.starters.map(p => p.name));
      careerState.bench = Array.from({length:4}, (_, index) => {
        const role = pick(ROLES).name;
        const attrs = generateMatchAttributes(role, rand(70,82));
        let name = pick(NAMES);
        let guard = 0;
        while (usedNames.has(name) && guard++ < 20) name = pick(NAMES);
        usedNames.add(name);
        return {
          id:`bench-${Date.now()}-${index}-${Math.random()}`,
          name, role, attrs,
          overall:Math.round(Object.values(attrs).reduce((a,b)=>a+b,0)/ATTRS.length),
          color:careerState.team.color,
          isUser:false
        };
      });
      renderCareerTeam();
    }

    function getPlayerName() { return state.playerName || 'Rookie'; }

    function getRevealTemplates() {
      const byRole = {
        '坦克': ['Anchor · 开团坦', 'Bulwark · 团队盾牌', 'Rook · 节奏前排'],
        '长枪输出': ['Vanta · 远点狙手', 'Lynx · 关键终结', 'Morrow · 稳定火力'],
        '弹道输出': ['Nova · 侧翼切入', 'Echo · 爆发绝活', 'Flint · 团战撕裂'],
        '输出支援': ['Aster · 输出奶位', 'Mira · 节奏支援', 'Juno · 保核专精'],
        '战术支援': ['Rune · 团队大脑', 'Haku · 指挥节拍器', 'Sora · 资源调度']
      };
      return byRole[state.role] || ['Vanta · 模板一','Morrow · 模板二','Aster · 模板三'];
    }

    function renderRevealScreen() {
      const buildMain = els.buildType.textContent || '未成型';
      const buildSub = els.buildSub.textContent || '';
      const templates = getRevealTemplates();
      const attrCards = ATTRS.map(attr => {
        const item = state.locked[attr.key];
        const value = item?.value || 0;
        const rank = value ? getRank(value).label : '—';
        return `<div class="reveal-attr-box"><small>${attr.name}</small><strong>${rank}</strong><em>${item ? item.player : '未继承'}</em></div>`;
      }).join('');
      els.revealContent.innerHTML = `
        <div class="season-chip">🏆 2019 OWL 赛季</div>
        <div class="reveal-hero"><h2>🎉 揭幕</h2><p>我的选手已建成</p></div>
        <section class="reveal-card">
          <div class="reveal-player-main">
            <div style="color:var(--muted);font-size:18px;margin-bottom:8px">我的选手</div>
            <div class="name">${getPlayerName()}</div>
            <div class="ovr">${getMyOvr()}</div>
            <div class="role">${state.role} · ${careerState.age}岁入行</div>
          </div>
          <div class="reveal-attr-grid">${attrCards}</div>
        </section>
        <section class="reveal-tag-card"><div class="reveal-tag-pill">⭐ <span>${buildMain}</span></div><div class="tiny-note" style="text-align:center;margin-top:8px">${buildSub}</div></section>
        <section class="reveal-template-card"><h3>🔎 选手模板</h3><div class="reveal-template-list">${templates.map((name,i)=>`<div class="reveal-template-row"><div class="reveal-template-avatar">${name[0]}</div><div><strong>${name.split(' · ')[0]}</strong><div class="reveal-template-copy">${name.split(' · ')[1]||'模板风格参考'}</div></div></div>`).join('')}</div></section>
        <div class="reveal-actions"><button class="primary-btn" id="startCareerFlowBtn">开始生涯</button></div>`;
      const btn = document.getElementById('startCareerFlowBtn');
      if (btn) btn.addEventListener('click', beginOpeningFlow);
    }

    function openRookieTeamSelection() {
      careerState.awaitingTeamChoice = true;
      careerState.team = null;
      careerState.teamSelectionTarget = null;
      careerState.teamSelectManual = false;
      renderCareerTeam();
      showScreen('team');
    }

    function randomizeCareerTeamChoice() {
      if(state.rolling) return;
      state.rolling=true;
      careerState.teamSelectManual=false;
      els.randomCareerTeamBtn.disabled=true;
      els.careerTeamWheel.classList.add('roulette-flash');
      showRandomFx('正在随机生涯队伍',TEAMS.map(t=>t.name));
      let ticks=0;
      const timer=setInterval(()=>{
        careerState.teamSelectionTarget=pick(TEAMS);
        renderTeamChoiceWheel();
        ticks++;
        if(ticks>=9) {
          clearInterval(timer);
          state.rolling=false;
          els.randomCareerTeamBtn.disabled=false;
          els.careerTeamWheel.classList.remove('roulette-flash');
          hideRandomFx();
        }
      },90);
    }

    function toggleManualCareerTeam() {
      careerState.teamSelectManual = !careerState.teamSelectManual;
      if (!careerState.teamSelectionTarget) careerState.teamSelectionTarget = TEAMS[0];
      renderCareerTeam();
    }

    function chooseManualCareerTeam(name) {
      const team = TEAMS.find(t => t.name === name);
      if (!team) return;
      careerState.teamSelectionTarget = team;
      careerState.teamSelectManual = true;
      renderCareerTeam();
    }

    function confirmCareerTeamChoice() {
      if (!careerState.teamSelectionTarget) careerState.teamSelectionTarget = pick(TEAMS);
      careerState.awaitingTeamChoice = false;
      setupCareerTeam(false, careerState.teamSelectionTarget);
      renderCareerTeam();
    }

    function renderTeamChoiceWheel() {
      const wheel = els.careerTeamWheel;
      if (!wheel) return;
      const target = careerState.teamSelectionTarget || pick(TEAMS);
      if (!careerState.teamSelectionTarget) careerState.teamSelectionTarget = target;
      const idx = TEAMS.findIndex(t=>t.name===target.name);
      const list = [];
      for (let offset=-2; offset<=2; offset++) list.push(TEAMS[(idx+offset+TEAMS.length)%TEAMS.length]);
      wheel.innerHTML = list.map(team=>`<div class="team-pick-row ${team.name===target.name?'current':''}" ${team.name===target.name?'aria-current="true"':''}><span class="team-pick-name">${team.name}</span><span class="team-pick-selected">✓ 当前选择</span></div>`).join('');
      els.careerTeamManualGrid.innerHTML = TEAMS.map(team=>`<button class="team-manual-item ${careerState.teamSelectionTarget?.name===team.name?'active':''}" data-manual-team="${team.name}">${team.name}</button>`).join('');
      els.careerTeamManualGrid.querySelectorAll('[data-manual-team]').forEach(btn=>btn.addEventListener('click',()=>chooseManualCareerTeam(btn.dataset.manualTeam)));
      els.careerTeamManualGrid.classList.toggle('ui-hidden', !careerState.teamSelectManual);
      els.confirmCareerTeamBtn.textContent = `确认加入 ${target.name} →`;
      els.manualCareerTeamBtn.textContent = careerState.teamSelectManual ? '收起队伍列表' : '🎯 自选队伍';
    }

    const OPENING_EVENTS = [];

    function beginOpeningFlow() {
      const overlay = document.getElementById('seasonEventOverlay');
      const holder = document.getElementById('seasonEventContent');
      if (!overlay || !holder) {
        openRookieTeamSelection();
        return;
      }
      openingState.completed = false;
      openingState.queue = OPENING_EVENTS.map(e=>JSON.parse(JSON.stringify(e)));
      openingState.current = null;
      openingState.popularity = 0; openingState.condition = 0; openingState.coachTrust = 0; openingState.teammateBond = 0;
      openNextOpeningEvent();
    }

    function openNextOpeningEvent() {
      const next = openingState.queue.shift();
      if (!next) {
        openingState.completed = true;
        document.getElementById('seasonEventOverlay').classList.add('hidden');
        openRookieTeamSelection();
        return;
      }
      openingState.current = { event: next, resolved: false, choice: null };
      renderOpeningEvent();
      document.getElementById('seasonEventOverlay').classList.remove('hidden');
    }

    function renderOpeningEvent() {
      const holder = document.getElementById('seasonEventContent');
      const current = openingState.current;
      if (!holder || !current) return;
      const event = current.event;
      if (!current.resolved) {
        holder.innerHTML = `<div class="season-event-top"><span class="season-event-kicker">${event.kicker}</span><span class="season-event-round">开局流程</span></div><h2 class="season-event-title">${event.title}</h2><p class="season-event-copy">${event.text}</p><div class="season-event-choices">${event.choices.map((choice,index)=>`<button class="season-event-choice" data-opening-choice="${index}"><div><strong>${choice.label}</strong><p>${choice.desc}</p></div></button>`).join('')}</div>`;
        holder.querySelectorAll('[data-opening-choice]').forEach(btn=>btn.addEventListener('click',()=>resolveOpeningEvent(Number(btn.dataset.openingChoice))));
      } else {
        const effects = eventEffectBadges(current.choice.effects);
        holder.innerHTML = `<div class="season-event-result"><div class="result-mark">✓</div><h3>${event.title}</h3><p>${current.choice.outcome}</p><div class="season-event-result-summary">${effects.map(x=>`<span class="season-event-effect ${x.kind}">${x.text}</span>`).join('')}</div><button class="primary-btn" id="continueOpeningFlowBtn">继续</button></div>`;
        const btn = document.getElementById('continueOpeningFlowBtn'); if (btn) btn.addEventListener('click', openNextOpeningEvent);
      }
    }

    function resolveOpeningEvent(index) {
      const current = openingState.current;
      if (!current || current.resolved) return;
      const choice = current.event.choices[index];
      openingState.popularity += choice.effects.popularity || 0;
      openingState.condition += choice.effects.condition || 0;
      openingState.coachTrust += choice.effects.coachTrust || 0;
      openingState.teammateBond += choice.effects.teammateBond || 0;
      current.choice = choice;
      current.resolved = true;
      renderOpeningEvent();
    }

    function renderCareerTeam() {
      const selectionMode = careerState.awaitingTeamChoice && !careerState.team;
      els.careerTeamPickCard.classList.toggle('ui-hidden', !selectionMode);
      els.careerContractCard.classList.toggle('ui-hidden', selectionMode);
      els.careerSquadCard.classList.toggle('ui-hidden', selectionMode);
      els.rerollCareerTeamBtn.style.display = selectionMode ? 'none' : (careerState.careerYears>1?'none':'');
      els.backBuilderFromTeamBtn.style.display = selectionMode ? '' : (careerState.careerYears>1?'none':'');
      if (selectionMode) {
        const seasonChip=document.getElementById('careerSeasonChip');
        if(seasonChip) seasonChip.textContent=`🏆 ${careerState.seasonYear} 赛季`;
        renderTeamChoiceWheel();
        return;
      }
      const team = careerState.team;
      if (!team) return;
      const logo = document.getElementById('careerTeamLogo');
      logo.textContent = team.short;
      logo.style.background = team.color;
      document.getElementById('careerTeamName').textContent = team.name;
      const seasonChip=document.getElementById('careerSeasonChip');
      if(seasonChip) seasonChip.textContent=`🏆 ${careerState.seasonYear} 赛季`;
      const contractCopy=careerState.contract?`${careerState.contract.years} 年合同 · 剩余 ${careerState.contract.remaining} 年 · 年薪 ${careerState.contract.salary} 万 · ${careerState.contract.rolePromise}`:'合同待定';
      document.getElementById('careerContractMeta').textContent = `${careerState.seasonYear<=2023?'OWL':'OWL 2.0'} · ${contractCopy} · 季前排名第 ${careerState.rank}`;
      document.getElementById('careerRoleText').textContent = `${careerState.contract?.rolePromise||'首发'} · ${state.role} · ${careerState.age}岁`;
      const startBtn=document.getElementById('startSeasonBtn');
      if(startBtn) startBtn.textContent=`🎮 开始 ${careerState.seasonYear} 赛季`;
      const rerollBtn=document.getElementById('rerollCareerTeamBtn');
      const backBtn=document.getElementById('backBuilderFromTeamBtn');
      if(rerollBtn) rerollBtn.style.display=careerState.careerYears>1?'none':'';
      if(backBtn) backBtn.style.display=careerState.careerYears>1?'none':'';
      document.getElementById('careerGoal').textContent = careerState.goal;
      document.getElementById('careerTactic').textContent = careerState.tactic;
      const avg = careerState.starters.reduce((sum,p)=>sum+p.overall,0) / Math.max(1,careerState.starters.length);
      document.getElementById('careerRosterOvr').textContent = avg.toFixed(1);
      document.getElementById('careerStarterList').innerHTML = careerState.starters.map(p=>careerSquadRow(p)).join('');
      document.getElementById('careerBenchList').innerHTML = careerState.bench.map(p=>careerSquadRow(p)).join('');
    }

    function careerSquadRow(player) {
      return `<div class="squad-row ${player.isUser ? 'user' : ''}">
        <div class="squad-avatar" style="background:${player.color}">${player.isUser ? 'ME' : player.name.slice(0,2).toUpperCase()}</div>
        <div class="squad-role">${player.role}</div>
        <div class="squad-name">${player.isUser ? getPlayerName() : player.name}${player.isUser ? '<small>★ 你</small>' : ''}</div>
        <div class="squad-ovr">${player.overall}</div>
      </div>`;
    }

    /* ---------------- 赛季随机事件 V0.1 ---------------- */


