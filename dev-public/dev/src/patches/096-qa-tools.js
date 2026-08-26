/* OWL QA infrastructure only. Loaded by dev/index.html after 095-inline.js. */
(() => {
  'use strict';

  function isQaEnvironment() {
    const host = (location.hostname || '').toLowerCase();
    const local = host === 'localhost' || host === '127.0.0.1' || host === '::1';
    const devPath = location.pathname.startsWith('/dev/');
    const requested = new URLSearchParams(location.search).get('qa') === '1';
    return local || (devPath && requested);
  }

  const enabled = isQaEnvironment();
  const previousKey = 'owl_qa_previous_snapshot_v1';
  const scenarioKey = 'owl_qa_current_scenario_v1';
  const scenarioList = [
    { id:'2019-season-start', label:'2019 · 常规赛开局', group:'赛季', description:'新秀首季已签约，常规赛 0 / 28。' },
    { id:'2023-pre-playoffs', label:'2023 · 年终季后赛前', group:'赛季', description:'常规赛已完成，季后赛尚未初始化。' },
    { id:'2025-stage2', label:'2025 · Stage 2 中段', group:'赛季', description:'Stage 2 已有赛果，可继续推进。' },
    { id:'2025-pre-finals', label:'2025 · 年度季后赛前', group:'赛季', description:'常规赛与 Stage 已完成，Final 季后赛未处理。' },
    { id:'worldcup-selection', label:'世界杯 · 国家队选拔', group:'世界杯', description:'直接进入国家队选拔节点。' },
    { id:'worldcup-knockout', label:'世界杯 · 淘汰赛', group:'世界杯', description:'直接进入最多两场的半决赛 / 决赛抽检节点。' },
    { id:'trade-offer', label:'赛季中 · 交易报价', group:'职业', description:'赛季中已有正式交易报价。' },
    { id:'contract-expiry', label:'休赛期 · 合同到期', group:'职业', description:'合同到期并已生成合法报价。' },
    { id:'retirement-age29', label:'29 岁 · 退役前', group:'职业', description:'29 岁且已有生涯档案，可推进至 30 岁退役流程。' }
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function currentScreen() {
    return typeof activeScreen === 'function' ? activeScreen() : document.querySelector('.screen.active')?.id?.replace('Screen', '') || null;
  }

  function qaToast(message, tone = 'success') {
    if (typeof toast === 'function') {
      toast(message);
      return;
    }
    const node = document.getElementById('owlQaToast') || document.body.appendChild(document.createElement('div'));
    node.id = 'owlQaToast';
    node.className = `owl-qa-toast ${tone}`;
    node.textContent = message;
    clearTimeout(node._owlQaTimer);
    node._owlQaTimer = setTimeout(() => node.remove(), 2600);
  }

  function qaAttributes(value = 82) {
    return Object.fromEntries(ATTRS.map(attr => [attr.key, {
      value,
      rawValue: value,
      efficiency: 1,
      pickOrder: ATTRS.indexOf(attr) + 1,
      player: 'QA Scenario',
      team: 'QA Fixture',
      role: state.role
    }]));
  }

  function qaArchive(count, startYear, startAge, teamName) {
    return Array.from({ length: count }, (_, index) => ({
      year: Number(startYear) + index,
      age: Number(startAge) + index,
      team: teamName,
      role: state.role,
      ovr: 82,
      wins: 18,
      losses: 10,
      rating: 7.2,
      playoffRating: 7.1,
      regularRank: 7,
      result: '季后赛八强',
      honors: [],
      stats: { appearances: 28, eliminations: 210, deaths: 120, assists: 180, firstPicks: 32 },
      awards: {}
    }));
  }

  function qaBase({ year = 2019, startYear = year, age = 20, teamShort = 'GZC' } = {}) {
    // Scenario injection is isolated here because there is no production entry
    // point that can create a signed career without replaying character creation.
    // Reset through the stable 2019 path first; rebuilding a high-year fantasy
    // world during a same-page scenario switch is neither needed nor reliable.
    careerState.simulationMode = 'history';
    careerState.startYear = 2019;
    careerState.seasonYear = 2019;
    resetBuildOnly();
    state.role = '弹道输出';
    state.playerName = 'QA Player';
    state.playerCountry = 'cn';
    state.playerStartAge = Math.max(16, Number(age) - (Number(year) - Number(startYear)));
    state.locked = qaAttributes(82);
    // Keep node fixtures on the historical roster path. The scenario contract
    // tests lifecycle/UI state, not fantasy-world generation.
    careerState.simulationMode = 'history';
    careerState.startYear = Number(startYear);
    careerState.seasonYear = Number(year);
    careerState.startAge = state.playerStartAge;
    careerState.age = Number(age);
    careerState.birthYear = Number(startYear) - state.playerStartAge;
    careerState.careerYears = Math.max(1, Number(year) - Number(startYear) + 1);
    careerState.careerArchive = qaArchive(Math.max(0, careerState.careerYears - 1), startYear, state.playerStartAge, 'QA Fixture');
    careerState.peakOvr = 82;
    careerState.retired = false;
    careerState.retirementReason = null;
    v50ApplySeasonWorld(Number(year));
    const team = TEAMS.find(item => item.short === teamShort && item.active !== false) || v50ActiveTeams()[0] || TEAMS[0];
    setupCareerTeam(false, team);
    // The legacy team setup preserves the real 2019 rookie entry year in
    // history mode. Re-apply the requested fixture year before setupSeason so
    // the correct historical/OWL 2.0 format is selected.
    careerState.startYear = Number(startYear);
    careerState.seasonYear = Number(year);
    careerState.contract = { years: 2, remaining: 2, salary: 42, rolePromise: '核心首发', teamName: careerState.team.name };
    careerState.contractTickYear = null;
    setupSeason(false);
    // 2025 正式流程会延迟展示一次规则介绍；QA 场景已经明确进入节点，
    // 关闭这个教学弹窗，避免它遮挡后续场景动作。
    careerState.v13RuleIntroSeen2025 = true;
    document.getElementById('seasonEventOverlay')?.classList.add('hidden');
    careerState.careerArchive = qaArchive(Math.max(0, careerState.careerYears - 1), startYear, state.playerStartAge, careerState.team.name);
    careerState.peakOvr = Math.max(82, Number(getMyOvr() || 82));
    showScreen('season');
    return careerState.team;
  }

  function qaSetRegularProgress(played, wins, { stageProcessed = [], awardsViewed = false } = {}) {
    const total = Number(seasonState.total || 28);
    const done = Math.max(0, Math.min(total, Number(played)));
    const winCount = Math.max(0, Math.min(done, Number(wins)));
    seasonState.active = true;
    seasonState.played = done;
    seasonState.wins = winCount;
    seasonState.losses = done - winCount;
    seasonState.results = Array.from({ length: total }, (_, index) => index < done ? (index < winCount ? 'win' : 'loss') : null);
    seasonState.userRatings = Array.from({ length: done }, () => 7.2);
    seasonState.simulating = false;
    seasonState.stageBreakPending = null;
    seasonState.stageProcessed = [...stageProcessed];
    seasonState.eventDue = false;
    seasonState.currentEvent = null;
    seasonState.awardsViewed = awardsViewed;
    playoffState.active = false;
    playoffState.matches = [];
    playoffState.results = [];
    playoffState.round = 'active';
    renderSeason();
    showScreen('season');
  }

  function build2019Start() {
    qaBase({ year: 2019, startYear: 2019, age: 16 });
    qaSetRegularProgress(0, 0);
  }

  function build2023PrePlayoffs() {
    qaBase({ year: 2023, startYear: 2023, age: 18 });
    if (typeof window.__OWL_V762_TEST_FORMAT === 'function') window.__OWL_V762_TEST_FORMAT(2023, careerState.team.short, 14);
    qaSetRegularProgress(seasonState.total, Math.ceil(seasonState.total * .78), { stageProcessed: [1, 2], awardsViewed: true });
  }

  function build2025Stage2() {
    qaBase({ year: 2025, startYear: 2025, age: 20 });
    const stageGames = [19, 18, 19];
    const stage2Played = Number(stageGames[0] || 19) + Math.max(1, Math.floor(Number(stageGames[1] || 18) / 2));
    qaSetRegularProgress(stage2Played, Math.ceil(stage2Played * .58), { stageProcessed: [1] });
  }

  function build2025PreFinals() {
    qaBase({ year: 2025, startYear: 2025, age: 20 });
    qaSetRegularProgress(seasonState.total, Math.ceil(seasonState.total * .76), { stageProcessed: [1, 2, 3], awardsViewed: true });
  }

  function buildWorldCupSelection() {
    qaBase({ year: 2026, startYear: 2026, age: 20 });
    const record = window.__OWL_WORLD_CUP.qaSet(2026, 'cn', 20);
    window.__OWL_WORLD_CUP.open();
    return record;
  }

  function buildWorldCupKnockout() {
    qaBase({ year: 2026, startYear: 2026, age: 20 });
    const record = window.__OWL_WORLD_CUP.qaSet(2026, 'cn', 20);
    record.selected = true;
    record.starter = true;
    record.phase = 'knockout';
    record.nextStage = 'knockout';
    record.pendingStage = null;
    record.eventCount = 3;
    record.nationalCohesion = 100;
    record.roster = [
      { name: state.playerName, role: state.role, ovr: 99, club: careerState.team.name, isUser: true },
      { name: 'QA Tank', role: '坦克', ovr: 95, club: 'QA Fixture' },
      { name: 'QA Hitscan', role: '长枪输出', ovr: 95, club: 'QA Fixture' },
      { name: 'QA Projectile', role: '弹道输出', ovr: 95, club: 'QA Fixture' },
      { name: 'QA Flex', role: '输出支援', ovr: 95, club: 'QA Fixture' },
      { name: 'QA Caller', role: '战术支援', ovr: 95, club: 'QA Fixture' },
      { name: 'QA Reserve', role: '输出支援', ovr: 94, club: 'QA Fixture' }
    ];
    // The official bracket builder creates three knockout rounds. This QA-only
    // adapter starts at semifinal/final so the manual smoke path stays under 5 minutes.
    record.stageState = { stage: 'knockout', opponents: ['nz', 'be'], matches: [], index: 0, elim: true, done: false, wins: 0, losses: 0 };
    window.__OWL_WORLD_CUP.open();
    return record;
  }

  function buildTradeOffer() {
    qaBase({ year: 2025, startYear: 2025, age: 20 });
    qaSetRegularProgress(14, 9);
    const target = TEAMS.find(item => item.short !== careerState.team.short && item.active !== false);
    window.__OWL_PUBLIC_BETA.forceTrade(target.short, 'poach');
  }

  function buildContractExpiry() {
    qaBase({ year: 2025, startYear: 2025, age: 20 });
    qaSetRegularProgress(seasonState.total, Math.ceil(seasonState.total * .72), { stageProcessed: [1, 2, 3], awardsViewed: true });
    playoffState.round = 'eliminated';
    careerState.contract = { years: 1, remaining: 0, salary: 42, rolePromise: '核心首发', teamName: careerState.team.name };
    offseasonState.active = false;
    setupOffseason();
    offseasonState.phase = 'market';
    generateContractOffers();
    renderOffseason();
    showScreen('offseason');
  }

  function buildRetirementAge29() {
    qaBase({ year: 2025, startYear: 2021, age: 29 });
    careerState.careerYears = 5;
    careerState.careerArchive = qaArchive(4, 2021, 25, careerState.team.name);
    careerState.peakOvr = 84;
    careerState.contract = { years: 2, remaining: 1, salary: 52, rolePromise: '核心首发', teamName: careerState.team.name };
    setupSeason(false);
    qaSetRegularProgress(0, 0);
  }

  const builders = {
    '2019-season-start': build2019Start,
    '2023-pre-playoffs': build2023PrePlayoffs,
    '2025-stage2': build2025Stage2,
    '2025-pre-finals': build2025PreFinals,
    'worldcup-selection': buildWorldCupSelection,
    'worldcup-knockout': buildWorldCupKnockout,
    'trade-offer': buildTradeOffer,
    'contract-expiry': buildContractExpiry,
    'retirement-age29': buildRetirementAge29
  };

  function scenarioRecord(id) {
    return scenarioList.find(item => item.id === id) || null;
  }

  function verifyScenario(id) {
    const meta = scenarioRecord(id);
    if (!meta) return { ok: false, id, error: `未知 QA 场景：${id}` };
    const diagnostic = window.__OWL_PUBLIC_BETA.diagnostic();
    const checks = [];
    const check = (name, pass, detail) => checks.push({ name, pass: !!pass, detail });
    const screen = currentScreen();
    const worldCupRecord = () => window.__OWL_WORLD_CUP?.snapshot?.().seasons?.[diagnostic.seasonYear] || null;
    check('career-ready', !!diagnostic.team && !!diagnostic.role, `${diagnostic.player} · ${diagnostic.team || '未签约'}`);

    if (id === '2019-season-start') {
      check('year', diagnostic.seasonYear === 2019, diagnostic.seasonYear);
      check('season-screen', screen === 'season', screen);
      check('season-active', !!seasonState.active, seasonState.active);
      check('regular-start', seasonState.played === 0 && seasonState.total === 28, `${seasonState.played}/${seasonState.total}`);
    } else if (id === '2023-pre-playoffs' || id === '2025-pre-finals') {
      const year = id === '2023-pre-playoffs' ? 2023 : 2025;
      check('year', diagnostic.seasonYear === year, diagnostic.seasonYear);
      check('regular-complete', seasonState.played === seasonState.total, `${seasonState.played}/${seasonState.total}`);
      check('season-screen', screen === 'season', screen);
      check('playoff-not-initialized', !playoffState.active && playoffState.matches.length === 0 && playoffState.round === 'active', JSON.stringify({ active: playoffState.active, matches: playoffState.matches.length, round: playoffState.round }));
      check('playoff-qualified', Number(estimateSeasonRank()) <= 8, estimateSeasonRank());
    } else if (id === '2025-stage2') {
      const format = diagnostic.seasonYear <= 2023 ? (window.__OWL_V762_DIAGNOSTICS?.() || {}) : { stageGames: [19, 18, 19] };
      check('year', diagnostic.seasonYear === 2025, diagnostic.seasonYear);
      check('stage-format', Number(format.stageGames?.length || 0) === 3, format.stageGames);
      check('stage2-active', seasonState.played > Number(format.stageGames?.[0] || 19) && seasonState.played < Number(format.stageGames?.[0] || 19) + Number(format.stageGames?.[1] || 18), seasonState.played);
      check('season-screen', screen === 'season', screen);
    } else if (id === 'worldcup-selection') {
      const record = worldCupRecord();
      check('worldcup-selection', record?.phase === 'selection' && record?.pendingStage === 'selection', record?.phase);
      check('overlay-visible', !document.getElementById('vwcOverlay')?.classList.contains('ui-hidden'), 'vwcOverlay');
      check('selection-action', !!document.querySelector('#vwcBody [data-vwc-select]'), 'data-vwc-select');
    } else if (id === 'worldcup-knockout') {
      const record = worldCupRecord();
      check('worldcup-knockout', record?.stageState?.stage === 'knockout', record?.stageState?.stage);
      check('knockout-short-path', record?.stageState?.opponents?.length === 2, record?.stageState?.opponents?.length);
      check('overlay-visible', !document.getElementById('vwcOverlay')?.classList.contains('ui-hidden'), 'vwcOverlay');
      check('knockout-action', !!document.querySelector('#vwcBody #vwcPlayNext'), 'vwcPlayNext');
    } else if (id === 'trade-offer') {
      check('trade-pending', !!careerState.v800Trade?.pending, careerState.v800Trade?.pending?.team);
      check('trade-overlay', !document.getElementById('v800TradeOverlay')?.classList.contains('ui-hidden'), 'v800TradeOverlay');
      check('trade-actions', !!document.querySelector('#v800TradeAccept, #v800TradeStay'), 'trade actions');
    } else if (id === 'contract-expiry') {
      check('offseason-screen', screen === 'offseason', screen);
      check('contract-expired', !!offseasonState.contractExpired && careerState.contract?.remaining === 0, careerState.contract?.remaining);
      check('offers', Array.isArray(offseasonState.offers) && offseasonState.offers.length > 0, offseasonState.offers?.length);
      check('market-actions', !!document.querySelector('#signOfferBtn'), 'signOfferBtn');
    } else if (id === 'retirement-age29') {
      check('age', diagnostic.age === 29, diagnostic.age);
      check('archive', Array.isArray(careerState.careerArchive) && careerState.careerArchive.length >= 4, careerState.careerArchive?.length);
      check('season-active', !!seasonState.active, seasonState.active);
      check('not-retired', !careerState.retired, careerState.retired);
      check('season-screen', screen === 'season', screen);
    }

    return { ok: checks.every(item => item.pass), id, label: meta.label, screen, checks, diagnostic };
  }

  function captureBeforeScenario() {
    const payload = currentScreen() === 'cover' ? null : window.__OWL_PUBLIC_BETA.captureSave('qa-before-scenario');
    sessionStorage.setItem(previousKey, JSON.stringify(payload));
    return payload;
  }

  function loadScenario(id) {
    if (!enabled) throw new Error('QA 工具未启用，请使用 /dev/?qa=1 或 localhost。');
    if (!builders[id]) throw new Error(`未知 QA 场景：${id}`);
    captureBeforeScenario();
    try {
      builders[id]();
      const health = verifyScenario(id);
      if (!health.ok) throw new Error(health.checks.filter(item => !item.pass).map(item => `${item.name}: ${item.detail}`).join('；'));
      sessionStorage.setItem(scenarioKey, id);
      renderQaPanel();
      qaToast(`✓ QA 场景已加载：${scenarioRecord(id).label}`);
      return { ok: true, scenario: id, health };
    } catch (error) {
      qaToast(`QA 场景加载失败：${error.message || error}`, 'error');
      throw error;
    }
  }

  function currentScenario() {
    return sessionStorage.getItem(scenarioKey) || null;
  }

  function restorePrevious() {
    const raw = sessionStorage.getItem(previousKey);
    if (!raw) throw new Error('没有可恢复的场景前状态。');
    const payload = JSON.parse(raw);
    if (payload) {
      const restored = window.__OWL_PUBLIC_BETA.restorePayload(payload);
      if (restored === false) throw new Error('恢复场景前状态失败。');
    } else {
      // 初始状态没有可导出的存档。用一个最小的 cover payload 恢复，
      // 避免调用正式 resetBuildOnly 时重建高年份梦幻世界。
      window.__OWL_PUBLIC_BETA.restorePayload({
        saveVersion: 1,
        screen: 'cover',
        state: { role: null, playerName: 'Rookie', playerCountry: 'cn', playerStartAge: 16, locked: {} },
        careerState: { team: null, starters: [], bench: [], contract: null, simulationMode: 'fantasy', startYear: 2019, seasonYear: 2019, startAge: 16, birthYear: 2003, age: 16, careerYears: 1, careerArchive: [], roleHistory: [], retired: false, peakOvr: 0 },
        seasonState: { active: false, total: 28, played: 0, wins: 0, losses: 0, results: [], opponents: [], userRatings: [], eventSchedule: [], eventTriggeredAt: [], eventHistory: [], eventDue: false, currentEvent: null, simulating: false },
        playoffState: { active: false, teams: [], matches: [], round: 'active', results: [] },
        offseasonState: { active: false, phase: 'review', offers: [] },
        injuryState: {},
        careerViewState: { tab: 'overview' },
        gameSettings: { matchDetailsEnabled: false },
        fantasyWorld: { selection: { mode: 'fantasy', startYear: 2019 } }
      });
      showScreen('cover');
    }
    sessionStorage.removeItem(scenarioKey);
    renderQaPanel();
    qaToast('✓ 已恢复进入场景前状态');
    return { ok: true, diagnostic: window.__OWL_PUBLIC_BETA.diagnostic() };
  }

  function snapshotCurrent() {
    const scenario = currentScenario() || 'manual';
    const payload = {
      qaVersion: '096',
      scenario,
      diagnostic: window.__OWL_PUBLIC_BETA.diagnostic(),
      save: window.__OWL_PUBLIC_BETA.captureSave('qa-snapshot'),
      capturedAt: new Date().toISOString()
    };
    const stamp = payload.capturedAt.replace(/[-:TZ.]/g, '').slice(0, 14);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `owl-qa-${scenario}-${stamp}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 0);
    qaToast('✓ QA 快照已导出');
    return payload;
  }

  function diagnostic() {
    return window.__OWL_PUBLIC_BETA.diagnostic();
  }

  function qaPanelMarkup() {
    const grouped = scenarioList.reduce((map, item) => {
      (map[item.group] ||= []).push(item);
      return map;
    }, {});
    const current = currentScenario();
    return `<button class="owl-qa-fab" id="owlQaFab" aria-label="打开 QA 场景面板">QA</button>
      <aside class="owl-qa-panel ui-hidden" id="owlQaPanel" aria-label="QA 场景面板">
        <header><div><small>QA SCENARIOS · 096</small><strong>可重复测试入口</strong></div><button id="owlQaClose" aria-label="关闭 QA 面板">×</button></header>
        <div class="owl-qa-current">当前场景：<b>${current || '手动 / 未指定'}</b></div>
        <div class="owl-qa-groups">${Object.entries(grouped).map(([group, items]) => `<section><h3>${group}</h3>${items.map(item => `<button class="owl-qa-scenario ${current === item.id ? 'active' : ''}" data-qa-scenario="${item.id}"><b>${item.label}</b><span>${item.description}</span></button>`).join('')}</section>`).join('')}</div>
        <div class="owl-qa-tools"><button id="owlQaCopyDiagnostic">复制诊断</button><button id="owlQaSnapshot">导出 QA 快照</button><button id="owlQaRestore">恢复进入场景前状态</button></div>
      </aside>`;
  }

  function renderQaPanel() {
    if (!enabled) return;
    document.getElementById('owlQaPanel')?.remove();
    document.getElementById('owlQaFab')?.remove();
    document.body.insertAdjacentHTML('beforeend', qaPanelMarkup());
    const panel = document.getElementById('owlQaPanel');
    document.getElementById('owlQaFab').onclick = () => panel.classList.toggle('ui-hidden');
    document.getElementById('owlQaClose').onclick = () => panel.classList.add('ui-hidden');
    panel.querySelectorAll('[data-qa-scenario]').forEach(button => {
      button.onclick = () => loadScenario(button.dataset.qaScenario);
    });
    document.getElementById('owlQaCopyDiagnostic').onclick = async () => {
      const copy = navigator.clipboard?.writeText(JSON.stringify(diagnostic(), null, 2));
      const ok = copy ? await copy.then(() => true).catch(() => false) : false;
      qaToast(ok ? '✓ 诊断已复制' : '复制失败，请使用导出快照');
    };
    document.getElementById('owlQaSnapshot').onclick = snapshotCurrent;
    document.getElementById('owlQaRestore').onclick = restorePrevious;
  }

  window.__OWL_QA = Object.freeze({
    version: '096',
    enabled,
    listScenarios: () => clone(scenarioList),
    loadScenario,
    verifyScenario,
    currentScenario,
    restorePrevious,
    snapshotCurrent,
    diagnostic
  });

  if (enabled) renderQaPanel();
})();
