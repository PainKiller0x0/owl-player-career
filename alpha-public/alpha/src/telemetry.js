(function (root) {
  'use strict';

  var KEY = 'owl_alpha_visitor_v1';
  var ALLOWED = { alpha_demo_open: true, alpha_demo_start: true, alpha_season_complete: true, alpha_auto_complete: true, alpha_batch_complete: true };

  function visitorId() {
    try {
      var value = root.localStorage && root.localStorage.getItem(KEY);
      if (value) return value;
      var bytes = new Uint8Array(8);
      if (root.crypto && root.crypto.getRandomValues) root.crypto.getRandomValues(bytes);
      value = 'a-' + Array.from(bytes).map(function (byte) { return byte.toString(16).padStart(2, '0'); }).join('') + Date.now().toString(36);
      if (root.localStorage) root.localStorage.setItem(KEY, value);
      return value;
    } catch (error) {
      return 'ephemeral';
    }
  }

  function send(eventName, data) {
    if (!ALLOWED[eventName] || !root.fetch) return;
    var payload = { event: eventName, visitor: visitorId(), mode: data && data.mode || 'manual', device: root.innerWidth <= 700 ? 'mobile' : 'desktop', viewport: String(root.innerWidth || 0) + 'x' + String(root.innerHeight || 0), durationMs: data && data.durationMs || undefined };
    root.fetch('/alpha/__owl/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), keepalive: true }).catch(function () {});
  }

  root.OWL_ALPHA_TELEMETRY = { send: send };
})(typeof globalThis === 'undefined' ? this : globalThis);
