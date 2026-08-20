/* ===== BUNDLE MODULE: engine/runtime.js ===== */
/* ==========================================================================
   MODULE: engine/runtime.js
   Runtime: settings, DOM refs, bootstrap, navigation and global lifecycle
   Migrated from V6.2 lines 3948-4380; execution order is defined by manifest.json.
   ========================================================================== */
    const INHERITANCE_RATES = [1,1,1,.92,.92,.92,.82,.82,.82,.70,.70,.70];
    function getInheritanceRate(orderIndex=state.round) { return INHERITANCE_RATES[clamp(orderIndex,0,INHERITANCE_RATES.length-1)] || .70; }
    function applyInheritanceDecay(rawValue,orderIndex=state.round) {
      const rate=getInheritanceRate(orderIndex);
      return clamp(Math.round(50+(rawValue-50)*rate)+1,50,99);
    }
    function inheritanceLabel(orderIndex=state.round) { return `第${orderIndex+1}顺位 · ${Math.round(getInheritanceRate(orderIndex)*100)}%继承`; }
    function getSystemRollPriority(role) {
      const bias=roleBias[role]||{};
      return [...ATTRS].sort((a,b)=>(bias[b.key]||0)-(bias[a.key]||0));
    }


    const openingState = {
      completed: false,
      queue: [],
      current: null,
      popularity: 0,
      condition: 0,
      coachTrust: 0,
      teammateBond: 0
    };

    const injuryState = {
      active:false,
      context:null,
      severity:'轻伤',
      penalty:-2,
      recoveryGames:3,
      bypass:false,
      resumeFast:false,
      pendingPlayoffMode:'quick'
    };

    const careerViewState = { tab:'overview' };


    const SETTINGS_KEYS = {
      detailsUnlocked:'owl_path_match_details_unlocked_v1',
      detailsEnabled:'owl_path_match_details_enabled_v1',
      developerMode:'owl_path_developer_mode_v1',
      autoSeasonEvents:'owl_path_auto_season_events_v2',
      roleTrainingUnlocked:'owl_path_role_training_unlocked_v1',
      roleTrainingIntroSeen:'owl_path_role_training_intro_seen_v1',
      careerStartedOnce:'owl_path_career_started_once_v1'
    };
    const gameSettings = {
      matchDetailsUnlocked:false,
      matchDetailsEnabled:false,
      developerMode:false,
      autoSeasonEvents:false
    };

    function readBoolSetting(key) {
      try { return localStorage.getItem(key)==='1'; } catch (_) { return false; }
    }
    function writeBoolSetting(key,value) {
      try { localStorage.setItem(key,value?'1':'0'); } catch (_) {}
    }
    function isLocalDeveloperEnvironment() {
      const host=(location.hostname||'').toLowerCase();
      return location.protocol==='file:' || host==='localhost' || host==='127.0.0.1' || host==='::1';
    }
    function initGameSettings() {
      gameSettings.matchDetailsUnlocked=readBoolSetting(SETTINGS_KEYS.detailsUnlocked);
      gameSettings.matchDetailsEnabled=gameSettings.matchDetailsUnlocked && readBoolSetting(SETTINGS_KEYS.detailsEnabled);
      gameSettings.developerMode=isLocalDeveloperEnvironment() && readBoolSetting(SETTINGS_KEYS.developerMode);
      // V4.1：使用独立的v2设置键，避免旧版本测试状态让“自动处理事件”看起来默认开启。
      // 新键不存在时 readBoolSetting() 明确返回 false；开发者模式不影响此设置。
      gameSettings.autoSeasonEvents=readBoolSetting(SETTINGS_KEYS.autoSeasonEvents);
      renderGameSettings();
    }
    function renderGameSettings() {
      if(!els.matchDetailsToggle) return;
      const unlocked=gameSettings.matchDetailsUnlocked;
      const enabled=unlocked && gameSettings.matchDetailsEnabled;
      els.matchDetailsToggle.disabled=!unlocked;
      els.matchDetailsToggle.classList.toggle('on',enabled);
      els.matchDetailsToggle.textContent=!unlocked?'未解锁':enabled?'已开启':'已关闭';
      els.matchDetailsSettingCopy.textContent=!unlocked
        ? '首个角色退役后解锁。默认使用快速结算，不进入逐图比赛和关键团战。'
        : enabled
          ? '逐图比赛和关键团战决策已开启。下一场会进入完整比赛页面。'
          : '当前使用快速结算。点击开关后，新比赛才会进入完整比赛页面。';
      els.settingsHint.textContent=!unlocked
        ? '完成第一段职业生涯并退役后解锁。'
        : '该设置会保存在浏览器中。重新创建角色时仍然有效。';
      if(els.quickMatchBtn) els.quickMatchBtn.classList.toggle('ui-hidden',!enabled);
      const localDev=isLocalDeveloperEnvironment();
      if(!localDev) gameSettings.developerMode=false;
      document.body.classList.toggle('dev-mode',localDev && !!gameSettings.developerMode);
      const developerSettingRow=document.getElementById('developerSettingRow');
      if(developerSettingRow) developerSettingRow.classList.toggle('ui-hidden',!localDev);
      if(els.developerModeToggle) {
        els.developerModeToggle.disabled=!localDev;
        els.developerModeToggle.classList.toggle('on',localDev && !!gameSettings.developerMode);
        els.developerModeToggle.textContent=localDev?(gameSettings.developerMode?'已开启':'已关闭'):'不可用';
      }
      if(els.autoSeasonEventsToggle) {
        els.autoSeasonEventsToggle.classList.toggle('on',!!gameSettings.autoSeasonEvents);
        els.autoSeasonEventsToggle.textContent=gameSettings.autoSeasonEvents?'已开启':'已关闭';
      }
      if(els.autoSeasonEventsSettingCopy) {
        els.autoSeasonEventsSettingCopy.textContent=gameSettings.autoSeasonEvents
          ? '使用「模拟全部常规赛」时，系统会自动跑完常规赛与阶段赛事；关键事件可由系统代选。年终季后赛不会自动模拟。'
          : '默认关闭。使用「模拟全部常规赛」时遇到关键事件会暂停，交给你亲自选择；年终季后赛不会自动模拟。';
      }
      if(els.playNextSeasonMatchBtn && seasonState?.active) renderSeason();
      if(els.playNextPlayoffMatchBtn && playoffState?.active) renderPlayoffs();
    }
    function openSettings() { renderGameSettings(); els.settingsOverlay.classList.remove('ui-hidden'); }
    function closeSettings() { els.settingsOverlay.classList.add('ui-hidden'); }
    function toggleMatchDetails() {
      if(!gameSettings.matchDetailsUnlocked) return;
      gameSettings.matchDetailsEnabled=!gameSettings.matchDetailsEnabled;
      writeBoolSetting(SETTINGS_KEYS.detailsEnabled,gameSettings.matchDetailsEnabled);
      renderGameSettings();
    }
    function toggleDeveloperMode() {
      if(!isLocalDeveloperEnvironment()) return;
      gameSettings.developerMode=!gameSettings.developerMode;
      writeBoolSetting(SETTINGS_KEYS.developerMode,gameSettings.developerMode);
      renderGameSettings();
    }
    function toggleAutoSeasonEvents() {
      gameSettings.autoSeasonEvents=!gameSettings.autoSeasonEvents;
      writeBoolSetting(SETTINGS_KEYS.autoSeasonEvents,gameSettings.autoSeasonEvents);
      renderGameSettings();
    }
    function unlockMatchDetailsSetting() {
      if(gameSettings.matchDetailsUnlocked) return false;
      gameSettings.matchDetailsUnlocked=true;
      gameSettings.matchDetailsEnabled=false;
      writeBoolSetting(SETTINGS_KEYS.detailsUnlocked,true);
      writeBoolSetting(SETTINGS_KEYS.detailsEnabled,false);
      renderGameSettings();
      els.settingsToggle.classList.add('unlock-pop');
      setTimeout(()=>els.settingsToggle.classList.remove('unlock-pop'),1900);
      return true;
    }
    function isRoleTrainingUnlocked(){
      return readBoolSetting(SETTINGS_KEYS.roleTrainingUnlocked)||!!gameSettings.matchDetailsUnlocked;
    }
    function unlockRoleTrainingSetting(){
      if(readBoolSetting(SETTINGS_KEYS.roleTrainingUnlocked)) return false;
      writeBoolSetting(SETTINGS_KEYS.roleTrainingUnlocked,true);return true;
    }
    function hasSeenRoleTrainingIntro(){return readBoolSetting(SETTINGS_KEYS.roleTrainingIntroSeen);}
    function markRoleTrainingIntroSeen(){writeBoolSetting(SETTINGS_KEYS.roleTrainingIntroSeen,true);}
    function hasStartedCareerOnce(){return readBoolSetting(SETTINGS_KEYS.careerStartedOnce);}
    function markCareerStartedOnce(){writeBoolSetting(SETTINGS_KEYS.careerStartedOnce,true);}
    function registerCareerStartForRoleTraining(){
      const hadCareer=hasStartedCareerOnce();
      if(hadCareer) unlockRoleTrainingSetting();
      else markCareerStartedOnce();
      return {hadCareer,roleTrainingUnlocked:isRoleTrainingUnlocked()};
    }


    const els = {
      coverScreen: document.getElementById('coverScreen'),
      coverStartBtn: document.getElementById('coverStartBtn'),
      coverGuideBtn: document.getElementById('coverGuideBtn'),
      coverGuide: document.getElementById('coverGuide'),
      coverBackBtn: document.getElementById('coverBackBtn'),
      roleScreen: document.getElementById('roleScreen'),
      nameScreen: document.getElementById('nameScreen'),
      builderScreen: document.getElementById('builderScreen'),
      revealScreen: document.getElementById('revealScreen'),
      teamScreen: document.getElementById('teamScreen'),
      seasonScreen: document.getElementById('seasonScreen'),
      awardsScreen: document.getElementById('awardsScreen'),
      playoffScreen: document.getElementById('playoffScreen'),
      summaryScreen: document.getElementById('summaryScreen'),
      careerScreen: document.getElementById('careerScreen'),
      offseasonScreen: document.getElementById('offseasonScreen'),
      retirementScreen: document.getElementById('retirementScreen'),
      retiredCareerScreen: document.getElementById('retiredCareerScreen'),
      matchScreen: document.getElementById('matchScreen'),
      roleGrid: document.getElementById('roleGrid'),
      selectedRoleCopy: document.getElementById('selectedRoleCopy'),
      confirmRoleBtn: document.getElementById('confirmRoleBtn'),
      playerNameInput: document.getElementById('playerNameInput'),
      playerNamePreview: document.getElementById('playerNamePreview'),
      playerCountrySelect: document.getElementById('playerCountrySelect'),
      playerCountryFlagPreview: document.getElementById('playerCountryFlagPreview'),
      playerCountryPreview: document.getElementById('playerCountryPreview'),
      playerAgeSelect: document.getElementById('playerAgeSelect'),
      playerAgeBadgePreview: document.getElementById('playerAgeBadgePreview'),
      playerAgePreview: document.getElementById('playerAgePreview'),
      playerAgeHint: document.getElementById('playerAgeHint'),
      backRoleFromNameBtn: document.getElementById('backRoleFromNameBtn'),
      skipPlayerNameBtn: document.getElementById('skipPlayerNameBtn'),
      confirmPlayerNameBtn: document.getElementById('confirmPlayerNameBtn'),
      currentRole: document.getElementById('currentRole'),
      rollAttrsBtn: document.getElementById('rollAttrsBtn'),
      backRoleBtn: document.getElementById('backRoleBtn'),
      resetBtn: document.getElementById('resetBtn'),
      quickMatchBtn: document.getElementById('quickMatchBtn'),
      backBuilderBtn: document.getElementById('backBuilderBtn'),
      newMatchBtn: document.getElementById('newMatchBtn'),
      backBuilderFromRevealBtn: document.getElementById('backBuilderFromRevealBtn'),
      revealContent: document.getElementById('revealContent'),
      backBuilderFromTeamBtn: document.getElementById('backBuilderFromTeamBtn'),
      rerollCareerTeamBtn: document.getElementById('rerollCareerTeamBtn'),
      careerTeamPickCard: document.getElementById('careerTeamPickCard'),
      careerContractCard: document.getElementById('careerContractCard'),
      careerSquadCard: document.getElementById('careerSquadCard'),
      careerTeamWheel: document.getElementById('careerTeamWheel'),
      careerTeamManualGrid: document.getElementById('careerTeamManualGrid'),
      randomCareerTeamBtn: document.getElementById('randomCareerTeamBtn'),
      manualCareerTeamBtn: document.getElementById('manualCareerTeamBtn'),
      confirmCareerTeamBtn: document.getElementById('confirmCareerTeamBtn'),
      startSeasonBtn: document.getElementById('startSeasonBtn'),
      backTeamFromSeasonBtn: document.getElementById('backTeamFromSeasonBtn'),
      resetSeasonBtn: document.getElementById('resetSeasonBtn'),
      playNextSeasonMatchBtn: document.getElementById('playNextSeasonMatchBtn'),
      fastSimSeasonBtn: document.getElementById('fastSimSeasonBtn'),
      backSeasonFromAwardsBtn: document.getElementById('backSeasonFromAwardsBtn'),
      awardsSummaryBtn: document.getElementById('awardsSummaryBtn'),
      awardsContinueBtn: document.getElementById('awardsContinueBtn'),
      regularAwardsContent: document.getElementById('regularAwardsContent'),
      backSeasonFromPlayoffBtn: document.getElementById('backSeasonFromPlayoffBtn'),
      playNextPlayoffMatchBtn: document.getElementById('playNextPlayoffMatchBtn'),
      playDetailedMatchBtn: document.getElementById('playDetailedMatchBtn'),
      playoffModeNote: document.getElementById('playoffModeNote'),
      backFromSummaryBtn: document.getElementById('backFromSummaryBtn'),
      restartFromSummaryBtn: document.getElementById('restartFromSummaryBtn'),
      summaryOffseasonBtn: document.getElementById('summaryOffseasonBtn'),
      backSummaryFromCareerBtn: document.getElementById('backSummaryFromCareerBtn'),
      careerTabContent: document.getElementById('careerTabContent'),
      themeToggle: document.getElementById('themeToggle'),
      settingsToggle: document.getElementById('settingsToggle'),
      settingsOverlay: document.getElementById('settingsOverlay'),
      settingsCloseBtn: document.getElementById('settingsCloseBtn'),
      matchDetailsToggle: document.getElementById('matchDetailsToggle'),
      matchDetailsSettingCopy: document.getElementById('matchDetailsSettingCopy'),
      developerModeToggle: document.getElementById('developerModeToggle'),
      appearanceModeToggle: document.getElementById('appearanceModeToggle'),
      autoSeasonEventsToggle: document.getElementById('autoSeasonEventsToggle'),
      autoSeasonEventsSettingCopy: document.getElementById('autoSeasonEventsSettingCopy'),
      settingsHint: document.getElementById('settingsHint'),
      inheritanceRateText: document.getElementById('inheritanceRateText'),
      injuryOverlay: document.getElementById('injuryOverlay'),
      injuryContent: document.getElementById('injuryContent'),
      retirementPressOverlay: document.getElementById('retirementPressOverlay'),
      retirementPressContent: document.getElementById('retirementPressContent'),
      restartCareerBtn: document.getElementById('restartCareerBtn'),
      viewRetiredCareerBtn: document.getElementById('viewRetiredCareerBtn'),
      backRetirementDecisionBtn: document.getElementById('backRetirementDecisionBtn'),
      retiredResumeTitle: document.getElementById('retiredResumeTitle'),
      retiredResumeCopy: document.getElementById('retiredResumeCopy'),
      retiredResumeHistoryScore: document.getElementById('retiredResumeHistoryScore'),
      retiredResumeTotals: document.getElementById('retiredResumeTotals'),
      retiredResumeHonors: document.getElementById('retiredResumeHonors'),
      retiredResumeSeasons: document.getElementById('retiredResumeSeasons'),
      backSummaryFromOffseasonBtn: document.getElementById('backSummaryFromOffseasonBtn'),
      progressNow: document.getElementById('progressNow'),
      progressBar: document.getElementById('progressBar'),
      roundText: document.getElementById('roundText'),
      myOvr: document.getElementById('myOvr'),
      buildType: document.getElementById('buildType'),
      buildSub: document.getElementById('buildSub'),
      lockedAttrList: document.getElementById('lockedAttrList'),
      roundBadge: document.getElementById('roundBadge'),
      rollTeamBtn: document.getElementById('rollTeamBtn'),
      roundContent: document.getElementById('roundContent'),
      statusText: document.getElementById('statusText')
    };

    function init() {
      initTheme();
      initGameSettings();
      renderRoleCards();
      renderLockedAttrs();
      renderWaitingStage();
      bindEvents();
    }

    function bindEvents() {
      els.coverStartBtn.addEventListener('click', hardReset);
      els.coverBackBtn.addEventListener('click', () => showScreen('cover'));
      els.coverGuideBtn.addEventListener('click', () => {
        const hidden=els.coverGuide.classList.toggle('ui-hidden');
        els.coverGuideBtn.textContent=hidden?'查看试玩说明':'收起试玩说明';
      });
      els.confirmRoleBtn.addEventListener('click', enterNameScreen);
      els.backRoleFromNameBtn.addEventListener('click', () => showScreen('role'));
      els.playerNameInput.addEventListener('input', updatePlayerNamePreview);
      els.playerNameInput.addEventListener('keydown', (event) => { if(event.key==='Enter') confirmPlayerName(false); });
      if(els.playerCountrySelect) els.playerCountrySelect.addEventListener('change', () => { state.playerCountry=els.playerCountrySelect.value||'cn'; updatePlayerCountryPreview(); });
      if(els.playerAgeSelect) els.playerAgeSelect.addEventListener('change', () => { state.playerStartAge=normalizePlayerStartAge(els.playerAgeSelect.value); updatePlayerAgePreview(); });
      els.skipPlayerNameBtn.addEventListener('click', () => confirmPlayerName(true));
      els.confirmPlayerNameBtn.addEventListener('click', () => confirmPlayerName(false));
      els.backRoleBtn.addEventListener('click', () => {
        const proceed=()=>{resetBuildOnly();els.playerNameInput.value=state.playerName==='Rookie'?'':state.playerName;updatePlayerNamePreview();showScreen('name');};
        if(Object.keys(state.locked).length>0){if(!window.__OWL_CONFIRM?.({icon:'🧹',kicker:'BUILD RESET · 建角进度',title:'返回角色命名？',body:'<p>当前已锁定的属性会被清空。</p>',confirmText:'清空并返回命名',cancelText:'继续编辑',tone:'warning',onConfirm:proceed}))return;return;}
        proceed();
      });
      els.resetBtn.addEventListener('click', () => {
        const proceed=()=>{resetBuildOnly();els.currentRole.textContent=state.role||'—';renderAll();setStatus('属性已清空，可以重新手动继承或直接 Roll 整套属性。','success');showScreen('builder');};
        if(Object.keys(state.locked).length>0){if(!window.__OWL_CONFIRM?.({icon:'🧹',kicker:'BUILD RESET · 建角进度',title:'清空当前建角进度？',body:'<p>位置与名字会保留，已锁定的属性会被清空。</p>',confirmText:'清空属性',cancelText:'继续编辑',tone:'warning',onConfirm:proceed}))return;return;}
        proceed();
      });
      els.rollTeamBtn.addEventListener('click', beginRoll);
      els.rollAttrsBtn.addEventListener('click', rollAllAttributes);
      els.quickMatchBtn.addEventListener('click', enterMatchDemo);
      els.backBuilderFromRevealBtn.addEventListener('click', () => showScreen('builder'));
      els.randomCareerTeamBtn.addEventListener('click', randomizeCareerTeamChoice);
      els.manualCareerTeamBtn.addEventListener('click', toggleManualCareerTeam);
      els.confirmCareerTeamBtn.addEventListener('click', confirmCareerTeamChoice);
      els.backBuilderBtn.addEventListener('click', returnFromMatch);
      els.newMatchBtn.addEventListener('click', () => setupMatch(true));
      els.backBuilderFromTeamBtn.addEventListener('click', () => showScreen('builder'));
      els.rerollCareerTeamBtn.addEventListener('click', () => setupCareerTeam(true));
      els.startSeasonBtn.addEventListener('click', enterSeasonHub);
      els.backTeamFromSeasonBtn.addEventListener('click', () => showScreen('team'));
      els.resetSeasonBtn.addEventListener('click', handleSeasonRestartClick);
      els.playNextSeasonMatchBtn.addEventListener('click', () => openNextSeasonMatch());
      els.fastSimSeasonBtn.addEventListener('click', () => toggleFastSeasonSimulation());
      document.getElementById('testSeasonEventBtn')?.addEventListener('click', () => openRandomSeasonEvent(true));
      document.getElementById('testInjuryEventBtn')?.addEventListener('click', () => openInjuryInquiry('regular',true));
      els.backSeasonFromAwardsBtn.addEventListener('click', () => { renderSeason(); showScreen('season'); });
      els.awardsSummaryBtn.addEventListener('click', showSeasonSummary);
      els.awardsContinueBtn.addEventListener('click', () => continueAfterRegularAwards());
      els.backSeasonFromPlayoffBtn.addEventListener('click', () => { renderSeason(); showScreen('season'); });
      els.playNextPlayoffMatchBtn.addEventListener('click', () => openNextPlayoffMatch('quick'));
      els.playDetailedMatchBtn.addEventListener('click', () => openNextPlayoffMatch('detail'));
      els.backFromSummaryBtn.addEventListener('click', backFromSummary);
      els.restartFromSummaryBtn.addEventListener('click', handleSeasonRestartFromSummary);
      els.summaryOffseasonBtn.addEventListener('click', () => enterOffseasonStub());
      els.backSummaryFromCareerBtn.addEventListener('click', backFromCareerHub);
      document.getElementById('careerTabs').addEventListener('click', (event) => { const btn=event.target.closest('[data-career-tab]'); if(btn) setCareerTab(btn.dataset.careerTab); });
      els.themeToggle.addEventListener('click', toggleTheme);
      els.settingsToggle.addEventListener('click', openSettings);
      els.settingsCloseBtn.addEventListener('click', closeSettings);
      els.settingsOverlay.addEventListener('click', (event) => { if(event.target===els.settingsOverlay) closeSettings(); });
      els.matchDetailsToggle.addEventListener('click', toggleMatchDetails);
      els.developerModeToggle.addEventListener('click', toggleDeveloperMode);
      if(els.autoSeasonEventsToggle) els.autoSeasonEventsToggle.addEventListener('click', toggleAutoSeasonEvents);
      if(els.appearanceModeToggle) els.appearanceModeToggle.addEventListener('click', () => toggleTheme());
      els.restartCareerBtn.addEventListener('click', hardReset);
      els.viewRetiredCareerBtn.addEventListener('click', openRetiredCareerResume);
      els.backRetirementDecisionBtn.addEventListener('click', () => { renderRetirementScreen(); showScreen('retirement'); });
      els.backSummaryFromOffseasonBtn.addEventListener('click', () => openCareerHub('offseason',true));
      document.addEventListener('click', (event) => {
        const summaryButton = event.target.closest('[data-open-season-summary]');
        if (!summaryButton) return;
        event.preventDefault();
        showSeasonSummary();
      });
    }

    function renderRoleCards() {
      els.roleGrid.innerHTML = ROLES.map(role => `
        <button class="role-card ${state.role === role.name ? 'selected' : ''}"
          data-role="${role.name}"
          style="--role-gradient:${role.gradient};--role-shadow:${role.shadow};--role-color:${role.color};--role-glow:${role.glow}">
          <div class="role-icon">${role.icon}</div>
          <h3>${role.name}</h3>
          <p>${role.desc}</p>
          <div class="role-trait">${role.trait}</div>
        </button>
      `).join('');

      els.roleGrid.querySelectorAll('[data-role]').forEach(btn => {
        btn.addEventListener('click', () => {
          state.role = btn.dataset.role;
          const role = ROLES.find(r => r.name === state.role);
          els.selectedRoleCopy.innerHTML = `已选择：<strong>${state.role}</strong> · ${role.trait.replace('核心倾向：','')}`;
          els.confirmRoleBtn.disabled = false;
          renderRoleCards();
          enterNameScreen();
        });
      });
    }

    function enterNameScreen() {
      if(!state.role) return;
      els.playerNameInput.value=state.playerName==='Rookie'?'':state.playerName;
      if(els.playerCountrySelect) els.playerCountrySelect.value=state.playerCountry||'cn';
      if(els.playerAgeSelect) els.playerAgeSelect.value=String(normalizePlayerStartAge(state.playerStartAge));
      updatePlayerNamePreview();
      updatePlayerCountryPreview();
      updatePlayerAgePreview();
      showScreen('name');
      setTimeout(()=>els.playerNameInput.focus(),120);
    }

    function normalizePlayerName(value) {
      return String(value||'').replace(/[<>`]/g,'').trim().slice(0,16) || 'Rookie';
    }

    function updatePlayerNamePreview() {
      const value=normalizePlayerName(els.playerNameInput.value);
      els.playerNamePreview.textContent=value;
    }

    function updatePlayerCountryPreview() {
      const code=(els.playerCountrySelect?.value||state.playerCountry||'cn').toLowerCase();
      state.playerCountry=V52_PLAYER_COUNTRIES[code]?code:'cn';
      if(els.playerCountrySelect&&els.playerCountrySelect.value!==state.playerCountry)els.playerCountrySelect.value=state.playerCountry;
      const flag=`<span class="player-flag" title="${V52_PLAYER_COUNTRIES[state.playerCountry]||state.playerCountry.toUpperCase()}"><img src="${v51SvgData(v51FlagSvg(state.playerCountry))}" alt="${state.playerCountry.toUpperCase()}"></span>`;
      if(els.playerCountryFlagPreview)els.playerCountryFlagPreview.innerHTML=`<img src="${v51SvgData(v51FlagSvg(state.playerCountry))}" alt="${state.playerCountry.toUpperCase()}">`;
      if(els.playerCountryPreview)els.playerCountryPreview.innerHTML=flag;
    }

    function normalizePlayerStartAge(value) {
      return Math.max(16,Math.min(26,Math.round(Number(value)||16)));
    }

    function getPlayerAgeHint(age=normalizePlayerStartAge(state.playerStartAge)) {
      if(age<=17) return `${age}岁 · 成长窗口最长，但2019世界杯年龄不足`;
      if(age<=20) return `${age}岁 · 年轻新秀，成长与即战力比较均衡`;
      if(age<=23) return `${age}岁 · 接近或处于巅峰期，成长空间开始收窄`;
      return `${age}岁 · 成熟即战力开局，距离30岁退役更近`;
    }

    function updatePlayerAgePreview() {
      const age=normalizePlayerStartAge(els.playerAgeSelect?.value||state.playerStartAge||16);
      state.playerStartAge=age;
      if(els.playerAgeSelect&&els.playerAgeSelect.value!==String(age))els.playerAgeSelect.value=String(age);
      if(els.playerAgeBadgePreview)els.playerAgeBadgePreview.textContent=String(age);
      if(els.playerAgePreview)els.playerAgePreview.textContent=`· ${age}岁`;
      if(els.playerAgeHint)els.playerAgeHint.textContent=getPlayerAgeHint(age);
    }

    function confirmPlayerName(skip=false) {
      state.playerName=skip?'Rookie':normalizePlayerName(els.playerNameInput.value);
      state.playerCountry=els.playerCountrySelect?.value||state.playerCountry||'cn';
      state.playerStartAge=normalizePlayerStartAge(els.playerAgeSelect?.value||state.playerStartAge||16);
      enterBuilder();
    }

    function enterBuilder() {
      if (!state.role) return;
      resetBuildOnly();
      els.currentRole.textContent = state.role;
      showScreen('builder');
      renderAll();
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    function showScreen(name) {
      els.coverScreen.classList.toggle('active', name === 'cover');
      els.roleScreen.classList.toggle('active', name === 'role');
      els.nameScreen.classList.toggle('active', name === 'name');
      els.builderScreen.classList.toggle('active', name === 'builder');
      els.revealScreen.classList.toggle('active', name === 'reveal');
      els.teamScreen.classList.toggle('active', name === 'team');
      els.seasonScreen.classList.toggle('active', name === 'season');
      els.awardsScreen.classList.toggle('active', name === 'awards');
      els.playoffScreen.classList.toggle('active', name === 'playoff');
      els.summaryScreen.classList.toggle('active', name === 'summary');
      els.careerScreen.classList.toggle('active', name === 'career');
      els.offseasonScreen.classList.toggle('active', name === 'offseason');
      els.retirementScreen.classList.toggle('active', name === 'retirement');
      els.retiredCareerScreen.classList.toggle('active', name === 'retiredCareer');
      els.matchScreen.classList.toggle('active', name === 'match');
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    function hardReset() {
      state.role = null;
      state.playerName = 'Rookie';
      state.playerCountry = 'cn';
      state.playerStartAge = 16;
      if(els.playerNameInput) els.playerNameInput.value='';
      if(els.playerCountrySelect) els.playerCountrySelect.value='cn';
      if(els.playerAgeSelect) els.playerAgeSelect.value='16';
      updatePlayerAgePreview();
      resetBuildOnly();
      els.selectedRoleCopy.textContent = '请选择一个位置';
      els.confirmRoleBtn.disabled = true;
      renderRoleCards();
      showScreen('role');
      window.scrollTo({ top: 0, behavior: 'instant' });
    }


