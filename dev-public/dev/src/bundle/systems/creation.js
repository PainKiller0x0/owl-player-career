/* ===== BUNDLE MODULE: systems/creation.js ===== */
/* ==========================================================================
   MODULE: systems/creation.js
   Character creation, attribute roll/inheritance and reveal prep
   Migrated from V6.2 lines 4381-4837; execution order is defined by manifest.json.
   ========================================================================== */
    function resetBuildOnly() {
      state.locked = {};
      state.round = 0;
      state.team = null;
      state.players = [];
      state.selectedPlayerId = null;
      state.rerolls = 5;
      state.hasRolled = false;
      state.rolling = false;
      openingState.completed = false;
      openingState.queue = [];
      openingState.current = null;
      openingState.popularity = 0;
      openingState.condition = 0;
      openingState.coachTrust = 0;
      openingState.teammateBond = 0;
      if (els.rollAttrsBtn) {
        els.rollAttrsBtn.disabled = false;
        els.rollAttrsBtn.classList.remove('rolling');
        els.rollAttrsBtn.textContent = '⚡ 一键随机';
      }
      careerState.team = null;
      careerState.starters = [];
      careerState.bench = [];
      careerState.rank = null;
      careerState.contract = null;
      const selectedStartAge=Math.max(16,Math.min(26,Number(state.playerStartAge)||16));
      const selectedStartYear=Number(careerState.startYear||careerState.seasonYear||2019);
      careerState.seasonYear = 2019;
      careerState.careerYears = 1;
      careerState.roleHistory = [];
      careerState.startAge = selectedStartAge;
      careerState.age = selectedStartAge;
      careerState.birthYear = selectedStartYear-selectedStartAge;
      careerState.retired = false;
      careerState.retirementReason = null;
      careerState.careerArchive = [];
      careerState.peakOvr = 0;
      careerState.injuryGames = 0;
      careerState.injuryPenalty = 0;
      careerState.illnessGames = 0;
      careerState.illnessPenalty = 0;
      careerState.illnessRestGames = 0;
      careerState.injuryHistory = [];
      careerState.recentEventIds = [];
      careerState.lastRolePlanYear = null;
      careerState.contractTickYear = null;
      careerState.relationshipTeamName = null;
      seasonState.startDynamics = null;
      injuryState.pendingPlayoffMode='quick';
      injuryState.active=false;
      if(els.injuryOverlay) els.injuryOverlay.classList.add('ui-hidden');
      if(els.retirementPressOverlay) els.retirementPressOverlay.classList.add('ui-hidden');
      seasonState.active = false;
      seasonState.baseLocked = null;
      resetPlayoffState();
      setStatus('', '');
    }

    function rollAllAttributes() {
      if (state.rolling || !state.role) return;

      const currentCount = Object.keys(state.locked).length;
      const hasManualProgress = currentCount > 0 && Object.values(state.locked).some(item => item.player !== '系统Roll');
      const proceed=()=>{
        state.rolling = true;
        els.rollAttrsBtn.disabled = true;
        els.rollAttrsBtn.classList.add('rolling');
        els.rollAttrsBtn.textContent = '⚡ 随机中…';
        setStatus('正在生成初始属性。', '');
        showRandomFx('正在生成能力倾向',ATTRS.map(a=>a.name));

        setTimeout(() => {
        const rolled = generateAttributes(state.role);
        state.locked = {};
        const priority=getSystemRollPriority(state.role);
        priority.forEach((attr,index) => {
          const rate=getInheritanceRate(index);
          state.locked[attr.key] = {
            value: applyInheritanceDecay(rolled[attr.key],index),
            rawValue: rolled[attr.key],
            efficiency: rate,
            pickOrder:index+1,
            player: '系统Roll',
            team: '初始天赋',
            role: state.role
          };
        });
        state.round = ATTRS.length;
        state.team = null;
        state.players = [];
        state.selectedPlayerId = null;
        state.rerolls = 5;
        state.hasRolled = false;
        state.rolling = false;

        careerState.team = null;
        careerState.starters = [];
        careerState.bench = [];
        careerState.rank = null;

        els.rollAttrsBtn.disabled = false;
        els.rollAttrsBtn.classList.remove('rolling');
        els.rollAttrsBtn.textContent = '⚡ 再 Roll';
        hideRandomFx();
        setStatus(`属性 Roll 完成：OVR ${getMyOvr()}。`, 'success');
        renderAll();
        }, 520);
      };
      if(hasManualProgress){if(!window.__OWL_CONFIRM?.({icon:'🎲',kicker:'ATTRIBUTE ROLL · 初始属性',title:'覆盖手动属性？',body:'<p>Roll 属性点会覆盖当前手动选择的属性。</p>',confirmText:'覆盖并重新 Roll',cancelText:'继续手动选择',tone:'warning',onConfirm:proceed}))return;return;}
      proceed();
    }

    function beginRoll() {
      if (state.rolling || state.round >= ATTRS.length) return;
      state.rolling = true;
      els.rollTeamBtn.disabled = true;
      els.rollTeamBtn.classList.add('rolling');
      els.rollTeamBtn.textContent = '🎲 随机中…';
      setStatus('联盟名单正在洗牌。很科学，主要靠命。', '');
      showRandomFx('正在抽取战队与选手',TEAMS.map(t=>t.name));
      els.roundContent.innerHTML = `
        <div class="draw-stage waiting">
          <div class="draw-wait">
            <div class="draw-wait-icon" style="background:linear-gradient(145deg,var(--accent),var(--accent-2));color:#fff;animation:rollPulse .42s ease infinite alternate">🎲</div>
            <h3>正在抽取战队与候选选手</h3>
            <p>正在抽取战队与候选选手。</p>
          </div>
        </div>`;

      setTimeout(() => {
        rollTeamData();
        state.rolling = false;
        state.hasRolled = true;
        els.rollTeamBtn.disabled = false;
        els.rollTeamBtn.classList.remove('rolling');
        els.rollTeamBtn.textContent = '🏟️ 重抽战队';
        hideRandomFx();
        setStatus(`本轮抽中「${state.team.name}」，从四名候选中选择一人。`, '');
        renderRoundContent();
      }, 720);
    }

    function rollTeamData() {
      const candidates = TEAMS.filter(t => !state.team || t.name !== state.team.name);
      state.team = pick(candidates);
      state.players = generatePlayers(state.team);
      state.selectedPlayerId = null;
      state.rerolls = 5;
    }

    function generatePlayers(team) {
      const shuffledRoles = shuffle(ROLES.map(r => r.name));
      const names = shuffle([...NAMES]).slice(0, 4);
      return Array.from({ length: 4 }, (_, index) => {
        const role = shuffledRoles[index % shuffledRoles.length];
        const attrs = generateAttributes(role);
        const overall = Math.round(Object.values(attrs).reduce((a,b)=>a+b,0) / ATTRS.length);
        const best = [...ATTRS]
          .sort((a,b) => attrs[b.key] - attrs[a.key])
          .slice(0,2)
          .map(a => `${a.name} ${attrs[a.key]}`)
          .join(' / ');
        return {
          id: `${Date.now()}-${index}-${Math.random()}`,
          name: names[index],
          role,
          overall,
          attrs,
          best,
          color: team.color
        };
      });
    }

    function generateAttributes(role) {
      const attrs = {};
      const bias = roleBias[role] || {};
      const talent = rand(68,85);
      ATTRS.forEach(attr => {
        attrs[attr.key] = clamp(talent + rand(-8,8) + (bias[attr.key] || 0), 58, 97);
      });
      return attrs;
    }

    function selectPlayer(id) {
      state.selectedPlayerId = id;
      const player = state.players.find(p => p.id === id);
      setStatus(`已选择 ${player.name}，请点击左侧属性进行锁定。`, '');
      renderRoundContent();
    }

    function lockAttribute(attrKey) {
      if (state.locked[attrKey] || state.round >= ATTRS.length) return;
      const player = state.players.find(p => p.id === state.selectedPlayerId);
      if (!player) return;
      const attr = ATTRS.find(a => a.key === attrKey);

      const orderIndex=Object.keys(state.locked).length;
      const rawValue=player.attrs[attrKey];
      const rate=getInheritanceRate(orderIndex);
      const inheritedValue=applyInheritanceDecay(rawValue,orderIndex);
      state.locked[attrKey] = {
        value: inheritedValue,
        rawValue,
        efficiency:rate,
        pickOrder:orderIndex+1,
        player: player.name,
        team: state.team.name,
        role: player.role
      };
      state.round = Object.keys(state.locked).length;
      setStatus(`第${orderIndex+1}顺位继承 ${player.name} 的「${attr.name}」：${rawValue} → ${inheritedValue}。`, 'success');

      if (state.round >= ATTRS.length) {
        state.hasRolled = false;
        renderAll();
        renderFinish();
        return;
      }

      state.team = null;
      state.players = [];
      state.selectedPlayerId = null;
      state.rerolls = 5;
      state.hasRolled = false;
      renderAll();
      els.rollTeamBtn.textContent = '🎲 随机下一轮';
      els.roundBadge.textContent = `第 ${state.round + 1} 轮等待随机`;
    }

    function rerollPlayers() {
      if (state.rerolls <= 0 || state.rolling) return;
      state.rolling=true;
      showRandomFx('正在刷新候选选手',NAMES);
      setTimeout(()=>{
        state.rerolls -= 1;
        state.players = generatePlayers(state.team);
        state.selectedPlayerId = null;
        state.rolling=false;
        hideRandomFx();
        setStatus(`候选选手已刷新，本轮还剩 ${state.rerolls} 次。`, '');
        renderRoundContent();
      },520);
    }

    function renderAll() {
      renderProgress();
      renderLockedAttrs();
      renderBuildSummary();
      if (state.round >= ATTRS.length) renderFinish();
      else if (state.hasRolled) renderRoundContent();
      else renderWaitingStage();
    }

    function renderProgress() {
      const count = Object.keys(state.locked).length;
      els.progressNow.textContent = count;
      els.progressBar.style.width = `${count / ATTRS.length * 100}%`;
      els.roundText.textContent = count >= ATTRS.length
        ? '属性创建完成'
        : state.hasRolled
          ? `第 ${count + 1} 轮进行中`
          : count === 0
            ? '尚未开始随机'
            : `第 ${count + 1} 轮等待随机`;
      els.currentRole.textContent = state.role || '—';
      if(els.inheritanceRateText) els.inheritanceRateText.textContent = count>=ATTRS.length ? '继承完成' : inheritanceLabel(count);
      if(els.rollAttrsBtn && !state.rolling) {
        els.rollAttrsBtn.disabled=false;
        els.rollAttrsBtn.classList.remove('rolling');
        els.rollAttrsBtn.textContent=count>=ATTRS.length?'⚡ 再 Roll':count>0?'⚡ 整套重 Roll':'⚡ 一键随机';
      }
    }

    function renderLockedAttrs() {
      const selected = state.players.find(p => p.id === state.selectedPlayerId);
      els.lockedAttrList.innerHTML = ATTRS.map(attr => {
        const item = state.locked[attr.key];
        const rawPreview = selected ? selected.attrs[attr.key] : null;
        const previewValue = selected ? applyInheritanceDecay(rawPreview,Object.keys(state.locked).length) : null;
        const value = item ? item.value : previewValue;
        const rankInfo = value ? getRank(value) : null;
        const rowClass = item ? 'locked' : selected ? 'preview' : 'empty';
        const copy = item
          ? (item.player==='系统Roll' ? '系统Roll' : `${item.player} · #${item.pickOrder||'—'}`)
          : selected
            ? (rawPreview===previewValue?String(previewValue):`${previewValue}（原${rawPreview}）`)
            : '—';
        const title = item
          ? `${item.player} · ${item.team} · ${item.role} · ${Math.round((item.efficiency||1)*100)}%继承`
          : selected
            ? `点击继承 ${selected.name} 的${attr.name}：原始${rawPreview}，本顺位继承${previewValue}`
            : '请先在右侧选择选手';
        return `
          <div class="attr-row ${rowClass}" data-lock-attr="${attr.key}" title="${title}">
            <div class="attr-name">${attr.name}</div>
            <div class="attr-rank-text">${rankInfo ? rankInfo.label : '—'}</div>
            <div class="attr-value-copy">${copy}</div>
          </div>`;
      }).join('');

      if (selected) {
        els.lockedAttrList.querySelectorAll('.attr-row.preview').forEach(row => {
          row.addEventListener('click', () => lockAttribute(row.dataset.lockAttr));
        });
      }
    }

    function renderWaitingStage() {
      const count = Object.keys(state.locked).length;
      els.roundBadge.textContent = count === 0 ? `等待开始第 1 轮 · ${Math.round(getInheritanceRate(0)*100)}%` : `第 ${count + 1} 轮等待随机 · ${Math.round(getInheritanceRate(count)*100)}%`;
      els.rollTeamBtn.disabled = false;
      els.rollTeamBtn.textContent = count === 0 ? '🎲 随机选队' : '🎲 随机下一轮';
      els.roundContent.innerHTML = `
        <div class="draw-stage waiting">
          <div class="draw-wait">
            <div class="draw-wait-icon">🎲</div>
            <h3>${count === 0 ? '还没有抽取战队' : `准备开始第 ${count + 1} 轮`}</h3>
            <p>左侧属性保持空白。点击右上角随机按钮后，才会出现本轮战队和候选选手。</p>
          </div>
        </div>`;
      renderLockedAttrs();
    }

    function renderRoundContent() {
      if (!state.hasRolled || !state.team) return renderWaitingStage();
      els.roundBadge.textContent = `第 ${state.round + 1} / ${ATTRS.length} 轮 · ${Math.round(getInheritanceRate(state.round)*100)}%继承`;
      els.rollTeamBtn.textContent = '🏟️ 重抽战队';

      const teamIndex = TEAMS.findIndex(t => t.name === state.team.name);
      const prevTeam = TEAMS[(teamIndex - 1 + TEAMS.length) % TEAMS.length];
      const nextTeam = TEAMS[(teamIndex + 1) % TEAMS.length];

      els.roundContent.innerHTML = `
        <div class="draw-stage">
          <div class="team-draw-card">
            <div class="team-draw-title">
              <span>🎰 本轮随机战队</span>
              <span>${divisionZh(state.team.division)}</span>
            </div>
            <div class="team-slot">
              <div class="team-slot-row">${prevTeam.name}</div>
              <div class="team-slot-row current"><img class="team-mini-logo" src="${state.team.logo}" onerror="this.style.visibility='hidden'">${state.team.name}</div>
              <div class="team-slot-row">${nextTeam.name}</div>
            </div>
            <div class="team-meta">
              <span>从本队候选中选择一名选手</span>
              <span>选手刷新 ${state.rerolls} 次</span>
            </div>
          </div>

          <div class="candidate-title">
            <strong>候选选手</strong>
            <span>点击一名选手查看其全部属性</span>
          </div>
          <div class="player-grid">
            ${state.players.map(player => `
              <button class="player-card ${player.id === state.selectedPlayerId ? 'selected' : ''}" data-player-id="${player.id}">
                <div class="player-head">
                  <div class="avatar" style="background:${player.color}">${player.name.slice(0,2).toUpperCase()}</div>
                  <div style="min-width:0">
                    <div class="player-name">${player.name}</div>
                    <div class="player-role">${player.role}</div>
                  </div>
                </div>
                <div class="player-ovr"><span>OVR</span><strong>${player.overall}</strong></div>
              </button>`).join('')}
          </div>

          <div class="round-actions">
            <button class="secondary-btn" id="rerollPlayersBtn" ${state.rerolls <= 0 ? 'disabled' : ''}>🎲 更换选手（${state.rerolls}）</button>
          </div>
          <div class="lock-hint ${state.selectedPlayerId ? '' : 'muted'}">
            ${state.selectedPlayerId ? '点击左侧未锁定属性' : '选择一名选手'}
          </div>
        </div>`;

      els.roundContent.querySelectorAll('[data-player-id]').forEach(btn => {
        btn.addEventListener('click', () => selectPlayer(btn.dataset.playerId));
      });

      const rerollBtn = document.getElementById('rerollPlayersBtn');
      if (rerollBtn) rerollBtn.addEventListener('click', rerollPlayers);
      renderLockedAttrs();
    }

    function renderFinish() {
      const ovr = getMyOvr();
      const topAttrs = ATTRS
        .filter(a => state.locked[a.key])
        .sort((a,b) => state.locked[b.key].value - state.locked[a.key].value)
        .slice(0,3)
        .map(a => `${a.name} ${state.locked[a.key].value}`)
        .join('、');
      els.roundBadge.textContent = '创建完成';
      els.rollTeamBtn.disabled = true;
      els.rollTeamBtn.textContent = '✓ 已完成';
      els.roundContent.innerHTML = `
        <div class="finish show">
          <div>
            <div class="finish-badge">🏆</div>
            <h3>你的 ${state.role} 已创建完成</h3>
            <p>最终综合评价为 <strong>${ovr}</strong>，最突出的三项能力是：${topAttrs}。</p>
            <button class="primary-btn" id="enterTeamBtn" style="margin-top:15px;min-width:210px">进入选手揭幕 →</button>
          </div>
        </div>`;
      const enterTeamBtn = document.getElementById('enterTeamBtn');
      if (enterTeamBtn) enterTeamBtn.addEventListener('click', enterRevealScreen);
    }

    function renderBuildSummary() {
      const lockedItems = ATTRS.filter(a => state.locked[a.key]);
      if (!lockedItems.length) {
        els.myOvr.textContent = '--';
        els.buildType.textContent = '尚未成型';
        els.buildSub.textContent = '十二项能力等待继承';
        return;
      }
      els.myOvr.textContent = getMyOvr();
      const scores = Object.fromEntries(ATTRS.map(a => [a.key, state.locked[a.key]?.value || 0]));
      const archetypes = [
        { name: '机械怪物', score: scores.hitscan + scores.projectile + scores.mechanics, sub: '先把人点掉，再讨论战术' },
        { name: '战术大脑', score: scores.awareness + scores.decision + scores.shotcalling, sub: '队友最好跟得上他的脑回路' },
        { name: '团队核心', score: scores.synergy + scores.cooldown + scores.positioning, sub: '存在感未必炸裂，但谁都离不开' },
        { name: '关键先生', score: scores.clutch + scores.survival + scores.hitscan, sub: '越到生死局越像突然通电' },
        { name: '万金油', score: scores.pool + scores.awareness + scores.synergy, sub: '版本怎么抽风都能想办法上班' }
      ].sort((a,b) => b.score - a.score);
      els.buildType.textContent = archetypes[0].name;
      els.buildSub.textContent = lockedItems.length < 4 ? '继续锁定属性以形成能力倾向' : archetypes[0].sub;
    }

    function getMyOvr() {
      const values = Object.values(state.locked).map(x => x.value);
      return values.length ? Math.round(values.reduce((a,b)=>a+b,0) / values.length) : '--';
    }

    function getRank(value) {
      if (value >= 94) return { label: 'S+', className: 'rank-s' };
      if (value >= 90) return { label: 'S', className: 'rank-s' };
      if (value >= 86) return { label: 'A+', className: 'rank-a' };
      if (value >= 82) return { label: 'A', className: 'rank-a' };
      if (value >= 78) return { label: 'B+', className: 'rank-b' };
      if (value >= 73) return { label: 'B', className: 'rank-b' };
      return { label: 'C', className: 'rank-c' };
    }

    function setStatus(text, type) {
      els.statusText.textContent = text;
      els.statusText.className = `status ${type || ''}`;
    }
    function rand(min,max) { return Math.floor(Math.random() * (max-min+1)) + min; }
    function clamp(value,min,max) { return Math.max(min, Math.min(max,value)); }
    function pick(array) { return array[Math.floor(Math.random() * array.length)]; }
    function shuffle(array) {
      for (let i=array.length-1;i>0;i--) {
        const j=Math.floor(Math.random()*(i+1));
        [array[i],array[j]]=[array[j],array[i]];
      }
      return array;
    }



