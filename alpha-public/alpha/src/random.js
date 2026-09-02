(function (root) {
  'use strict';

  function create(seed) {
    var value = (Number(seed) >>> 0) || 1;
    return {
      state: value,
      next: function () {
        var t = (value += 0x6D2B79F5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        value = t >>> 0;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      },
      int: function (min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
      },
      noise: function (min, max) {
        return min + this.next() * (max - min);
      }
    };
  }

  root.OWL_ALPHA_RANDOM = { create: create };
})(typeof globalThis === 'undefined' ? this : globalThis);
