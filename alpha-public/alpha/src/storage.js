(function (root) {
  'use strict';

  var PREFIX = 'owl_alpha_season_demo_v2:';
  var memoryState = null;

  function storage() {
    try {
      if (!root.localStorage) return null;
      var key = PREFIX + 'probe';
      root.localStorage.setItem(key, '1');
      root.localStorage.removeItem(key);
      return root.localStorage;
    } catch (error) {
      return null;
    }
  }

  function save(state) {
    var payload = JSON.stringify(state);
    var store = storage();
    if (!store) {
      memoryState = JSON.parse(payload);
      return { ok: true, persistent: false, message: '本次保存在内存中，刷新后可能丢失。' };
    }
    try {
      store.setItem(PREFIX + 'current', payload);
      return { ok: true, persistent: true, message: '已保存' };
    } catch (error) {
      try {
        Object.keys(store).filter(function (key) { return key.indexOf(PREFIX + 'backup:') === 0; }).forEach(function (key) { store.removeItem(key); });
        store.setItem(PREFIX + 'current', payload);
        return { ok: true, persistent: true, message: '已保存（已清理旧恢复点）' };
      } catch (retryError) {
        memoryState = JSON.parse(payload);
        return { ok: true, persistent: false, message: '本地空间不足，本次保存在内存中。' };
      }
    }
  }

  function load() {
    var store = storage();
    if (store) {
      try {
        var value = store.getItem(PREFIX + 'current');
        if (value) return JSON.parse(value);
      } catch (error) {
        return memoryState ? JSON.parse(JSON.stringify(memoryState)) : null;
      }
    }
    return memoryState ? JSON.parse(JSON.stringify(memoryState)) : null;
  }

  function clear() {
    var store = storage();
    if (store) Object.keys(store).filter(function (key) { return key.indexOf(PREFIX) === 0; }).forEach(function (key) { store.removeItem(key); });
    memoryState = null;
  }

  function hasLegacy() {
    var store = storage();
    return !!(store && Object.keys(store).some(function (key) { return key.indexOf('owl_alpha_season_demo_v1:') === 0; }));
  }

  function exportState(state) {
    return JSON.stringify({ saveVersion: 'alpha-v2', exportedAt: new Date().toISOString(), state: state }, null, 2);
  }

  function importState(text) {
    var parsed = JSON.parse(text);
    var state = parsed && parsed.state ? parsed.state : parsed;
    if (!state || !state.version || !state.player || !state.pending) throw new Error('不是有效的 Alpha Demo 存档');
    return state;
  }

  root.OWL_ALPHA_STORAGE = { PREFIX: PREFIX, save: save, load: load, clear: clear, hasLegacy: hasLegacy, exportState: exportState, importState: importState };
})(typeof globalThis === 'undefined' ? this : globalThis);
