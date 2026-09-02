(function (root) {
  'use strict';

  var C = root.OWL_ALPHA_CONSTANTS;
  var E = root.OWL_ALPHA_ENGINE;

  function chooseAction(state) {
    if (state.resources.energy < 24 || (state.resources.stress > 82 && state.resources.energy < 60)) return 'rest';
    var plan = C.PLANS[state.plan] || C.PLANS.balanced;
    var best = null;
    C.ACTIONS.filter(function (action) { return action.id !== 'rest'; }).forEach(function (action) {
      var gap = 100 - state.player.attributes[action.target];
      var support = Object.keys(state.relationships).filter(function (key) { return state.relationships[key] >= 75; }).length;
      var risk = E.failRate(state) * 100;
      var score = gap * plan.weights[action.target] + support * (action.id === 'teamwork' ? 4 : 0) - risk * 0.25 - Math.max(0, -action.energy - state.resources.energy) * 0.15;
      if (!best || score > best.score) best = { id: action.id, score: score };
    });
    return best ? best.id : 'rest';
  }

  function chooseEvent(state) {
    var event = state.event;
    if (!event || !event.choices.length) return null;
    if (event.id === 'stage-break') return state.resources.energy < 55 ? 'recover' : 'review';
    if (event.id === 'mid-season') return state.resources.stress > 65 ? 'rest' : 'meta';
    if (event.id === 'streak-pressure') return state.resources.stress > 70 ? 'breathe' : 'accept';
    if (event.id === 'version-shift') return 'study';
    if (event.id === 'mentor') return 'listen';
    return event.choices[0].id;
  }

  function run(state, limit) {
    var steps = 0;
    var max = limit || 100;
    state.mode = 'auto';
    while (state.pending.type !== 'summary' && steps < max) {
      steps += 1;
      if (state.pending.type === 'action') E.applyAction(state, chooseAction(state));
      else if (state.pending.type === 'action_result') E.continueActionResult(state);
      else if (state.pending.type === 'match_plan') E.chooseMatchPlan(state, state.resources.coachTrust >= 60 ? 'highRisk' : (state.resources.coachTrust >= 40 ? 'focus' : 'stable'));
      else if (state.pending.type === 'block_report') E.acknowledgeBlockReport(state);
      else if (state.pending.type === 'event') E.resolveEvent(state, chooseEvent(state));
      else if (state.pending.type === 'report') E.continueReport(state);
      else if (state.pending.type === 'playoff') E.resolvePlayoff(state);
      else if (state.pending.type === 'career_handoff') E.acknowledgeCareerHandoff(state);
      else break;
    }
    if (state.pending.type !== 'summary') throw new Error('自动模式未能在限制步数内完成');
    return state;
  }

  function simulate(options) {
    return run(E.makeState(Object.assign({}, options, { mode: 'auto' })));
  }

  function nextTier(state) {
    var roll = Math.abs(state.rngState) % 100;
    if (state.teamPreset === 'contender') return roll < 70 ? 'contender' : (roll < 95 ? 'mid' : 'rebuild');
    if (state.teamPreset === 'rebuild') return roll < 5 ? 'contender' : (roll < 35 ? 'mid' : 'rebuild');
    return roll < 15 ? 'contender' : (roll < 85 ? 'mid' : 'rebuild');
  }

  function longCareer(options) {
    options = options || {};
    var tier = options.teamPreset || 'mid';
    var state = E.makeState({ seed: options.seed, playerPreset: 'rookie', teamPreset: tier, plan: options.plan || 'balanced', year: 2026, mode: 'auto' });
    var championships = 0;
    var mvps = 0;
    var records = [];
    for (var season = 0; season < 12; season += 1) {
      run(state);
      var report = E.seasonReport(state);
      if (state.playoff.status === 'champion') championships += 1;
      if (state.awards.mvp && state.awards.mvp.id === 'you') mvps += 1;
      records.push({ year: report.year, age: report.playerAge, teamPreset: state.teamPreset, champion: state.playoff.status === 'champion', mvp: state.awards.mvp && state.awards.mvp.id === 'you', ovr: report.playerOvr });
      if (season < 11) { tier = nextTier(state); state = E.startNextSeason(state, tier); }
    }
    return { championships: championships, mvps: mvps, sevenPlusChampionships: championships >= 7, records: records };
  }

  root.OWL_ALPHA_AUTO = { chooseAction: chooseAction, chooseEvent: chooseEvent, run: run, simulate: simulate, longCareer: longCareer };
})(typeof globalThis === 'undefined' ? this : globalThis);
