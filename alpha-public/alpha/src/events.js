(function (root) {
  'use strict';

  root.OWL_ALPHA_EVENTS = {
    describe: function (state) {
      return state.event ? state.event : null;
    },
    hasPending: function (state) {
      return state.pending && state.pending.type === 'event';
    }
  };
})(typeof globalThis === 'undefined' ? this : globalThis);
