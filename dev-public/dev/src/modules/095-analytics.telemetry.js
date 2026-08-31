(function () {
  'use strict';

  const EVENT_NAMES = new Set(['game_open', 'career_created', 'career_resumed']);
  const VISITOR_KEY = 'owl_analytics_visitor_v1';
  const OPEN_DAY_KEY = 'owl_analytics_open_day_v1';
  const endpoint = location.pathname.startsWith('/dev') ? '/dev/__owl/analytics' : '/__owl/analytics';
  let memoryVisitorId = null;

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

  function track(event) {
    if (!EVENT_NAMES.has(event)) return false;
    send({
      event,
      visitorId: visitorId(),
      path: location.pathname,
      release: window.__OWL_PUBLIC_BETA?.version || 'unknown',
    });
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

  document.addEventListener('click', event => {
    const target = event.target?.closest?.('#startSeasonBtn');
    const beforeStart = target ? diagnostic() : null;
    if (target && document.querySelector('.screen.active')?.id === 'teamScreen' && !seasonState.active && Number(beforeStart?.careerYears) === 1) {
      window.setTimeout(() => {
        if (isStartedCareer()) track('career_created');
      }, 0);
      return;
    }

    const loadButton = event.target?.closest?.('#v800ContinueLatest, [data-load-slot]');
    if (!loadButton) return;
    window.setTimeout(() => {
      if (document.querySelector('.screen.active')?.id !== 'coverScreen' && isStartedCareer()) track('career_resumed');
    }, 0);
  }, true);

  window.__OWL_ANALYTICS = {
    endpoint,
    visitorId,
    track,
  };
  trackDailyOpen();
})();
