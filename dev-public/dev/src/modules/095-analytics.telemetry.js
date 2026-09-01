(function () {
  'use strict';

  const EVENT_NAMES = new Set(['game_open', 'career_created', 'career_resumed', 'perf_page_load', 'perf_simulation']);
  const PERFORMANCE_EVENTS = new Set(['perf_page_load', 'perf_simulation']);
  const VISITOR_KEY = 'owl_analytics_visitor_v1';
  const OPEN_DAY_KEY = 'owl_analytics_open_day_v1';
  const endpoint = location.pathname.startsWith('/dev') ? '/dev/__owl/analytics' : '/__owl/analytics';
  let memoryVisitorId = null;
  let simulationWatch = null;

  function randomId() {
    try {
      if (window.crypto?.randomUUID) return window.crypto.randomUUID();
      if (window.crypto?.getRandomValues) {
        const bytes = new Uint8Array(16);
        window.crypto.getRandomValues(bytes);
        return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
      }
    } catch (_) {}
    return `fallback-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }

  function storageGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (_) {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (_) {}
  }

  function visitorId() {
    if (memoryVisitorId) return memoryVisitorId;
    memoryVisitorId = storageGet(VISITOR_KEY) || randomId();
    storageSet(VISITOR_KEY, memoryVisitorId);
    return memoryVisitorId;
  }

  function send(payload) {
    const body = JSON.stringify(payload);
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }))) return;
    } catch (_) {}
    try {
      window.fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        credentials: 'same-origin',
        keepalive: true,
      }).catch(() => {});
    } catch (_) {}
  }

  function deviceClass() {
    try {
      return window.matchMedia?.('(pointer: coarse)').matches || window.innerWidth <= 768 ? 'mobile' : 'desktop';
    } catch (_) {
      return window.innerWidth <= 768 ? 'mobile' : 'desktop';
    }
  }

  function viewportBucket() {
    const width = Number(window.innerWidth || 0);
    if (width < 600) return 'compact';
    if (width < 1600) return 'standard';
    return 'wide';
  }

  function track(event, details = null) {
    if (!EVENT_NAMES.has(event)) return false;
    const payload = {
      event,
      visitorId: visitorId(),
      path: location.pathname,
      release: window.__OWL_PUBLIC_BETA?.version || 'unknown',
    };
    if (PERFORMANCE_EVENTS.has(event) && details && typeof details === 'object') {
      payload.metric = typeof details.metric === 'string' ? details.metric : '';
      const value = Number(details.value);
      if (Number.isFinite(value)) payload.value = Math.round(value * 10000) / 10000;
      payload.device = typeof details.device === 'string' ? details.device : deviceClass();
      payload.viewport = typeof details.viewport === 'string' ? details.viewport : viewportBucket();
      if (event === 'perf_simulation') {
        payload.mode = typeof details.mode === 'string' ? details.mode : '';
        payload.status = typeof details.status === 'string' ? details.status : '';
      }
    }
    send(payload);
    return true;
  }

  function trackDailyOpen() {
    const day = new Date().toISOString().slice(0, 10);
    if (storageGet(OPEN_DAY_KEY) === day) return;
    storageSet(OPEN_DAY_KEY, day);
    track('game_open');
  }

  function diagnostic() {
    try {
      return window.__OWL_PUBLIC_BETA?.diagnostic?.() || null;
    } catch (_) {
      return null;
    }
  }

  function isStartedCareer() {
    const state = diagnostic();
    return !!state && Number(state.regular?.total || 0) > 0 && Number(state.careerYears || 0) >= 1;
  }

  function seasonSnapshot() {
    try {
      const season = typeof seasonState === 'object' ? seasonState : null;
      const career = typeof careerState === 'object' ? careerState : null;
      if (!season) return null;
      return {
        played: Number(season.played || 0),
        total: Number(season.total || 0),
        simulating: !!season.simulating,
        checkpoint: !!(
          season.eventDue || season.currentEvent || season.stageBreakPending ||
          season.v71AllStarPending || season.v34AllStarPending || season.v71LastMajorSummary ||
          career?.v800Trade?.pending
        ),
      };
    } catch (_) {
      return null;
    }
  }

  function finishSimulation(status) {
    const run = simulationWatch;
    if (!run) return;
    simulationWatch = null;
    track('perf_simulation', {
      metric: 'duration_ms',
      value: performance.now() - run.startedAt,
      mode: run.mode,
      status,
      device: deviceClass(),
      viewport: viewportBucket(),
    });
  }

  function pollSimulation(run) {
    if (simulationWatch !== run) return;
    const state = seasonSnapshot();
    const elapsed = performance.now() - run.startedAt;
    const advanced = !!state && state.played > run.startPlayed;
    if (advanced && (run.mode === 'single' || state.played >= state.total)) {
      finishSimulation('completed');
      return;
    }
    if (advanced && !state.simulating) {
      finishSimulation(state.checkpoint ? 'paused_event' : 'paused_manual');
      return;
    }
    if (elapsed >= 900000) {
      finishSimulation('timeout');
      return;
    }
    window.setTimeout(() => pollSimulation(run), 100);
  }

  function startSimulationWatch(mode) {
    if (simulationWatch) return;
    const state = seasonSnapshot();
    if (!state || state.played >= state.total) return;
    const run = { mode, startPlayed: state.played, startedAt: performance.now() };
    simulationWatch = run;
    window.setTimeout(() => pollSimulation(run), 80);
  }

  function installPagePerformance() {
    if (!window.performance?.now) return;
    const sent = new Set();
    const sendMetric = (metric, value) => {
      const number = Number(value);
      if (sent.has(metric) || !Number.isFinite(number)) return;
      sent.add(metric);
      track('perf_page_load', {
        metric,
        value: number,
        device: deviceClass(),
        viewport: viewportBucket(),
      });
    };

    sendMetric('page_ready_ms', performance.now());
    let lcp = null;
    let cls = 0;
    let clsObserved = false;
    let inp = null;
    if (window.PerformanceObserver) {
      try {
        new PerformanceObserver(list => {
          const entries = list.getEntries();
          const last = entries[entries.length - 1];
          if (last) lcp = last.startTime;
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (_) {}
      try {
        new PerformanceObserver(list => {
          clsObserved = true;
          list.getEntries().forEach(entry => {
            if (!entry.hadRecentInput) cls += entry.value;
          });
        }).observe({ type: 'layout-shift', buffered: true });
      } catch (_) {}
      try {
        new PerformanceObserver(list => {
          list.getEntries().forEach(entry => {
            inp = Math.max(inp || 0, entry.duration);
          });
        }).observe({ type: 'event', buffered: true, durationThreshold: 40 });
      } catch (_) {}
    }
    const flush = () => {
      sendMetric('lcp_ms', lcp);
      if (clsObserved) sendMetric('cls', cls);
      sendMetric('inp_ms', inp);
    };
    window.setTimeout(flush, 8000);
    window.addEventListener('pagehide', flush, { once: true });
  }

  window.addEventListener('click', event => {
    const target = event.target?.closest?.('#startSeasonBtn');
    const beforeStart = target ? diagnostic() : null;
    if (target && document.querySelector('.screen.active')?.id === 'teamScreen' && !seasonState.active && Number(beforeStart?.careerYears) === 1) {
      window.setTimeout(() => {
        if (isStartedCareer()) track('career_created');
      }, 0);
      return;
    }

    const loadButton = event.target?.closest?.('#v800ContinueLatest, [data-load-slot]');
    if (loadButton) {
      window.setTimeout(() => {
        if (document.querySelector('.screen.active')?.id !== 'coverScreen' && isStartedCareer()) track('career_resumed');
      }, 0);
    }

    const simulationButton = event.target?.closest?.('#playNextSeasonMatchBtn, #fastSimSeasonBtn, #fullSimSeasonBtn');
    if (simulationButton) {
      const mode = simulationButton.id === 'playNextSeasonMatchBtn' ? 'single' : simulationButton.id === 'fastSimSeasonBtn' ? 'stage' : 'whole';
      startSimulationWatch(mode);
    }
  }, true);

  window.__OWL_ANALYTICS = {
    endpoint,
    visitorId,
    track,
  };
  trackDailyOpen();
  installPagePerformance();
})();
