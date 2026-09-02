importScripts('random.js', 'constants.js', 'impact.js', 'career.js', 'engine.js', 'auto.js');

self.onmessage = function (event) {
  var data = event.data || {};
  try {
    var count = Math.max(1, Math.min(Number(data.count) || 10000, 1000000));
    if (data.long) {
      var career = { samples: count, avgChampionships: 0, avgMvps: 0, sevenPlusChampionshipsRate: 0, examples: [] };
      for (var careerIndex = 0; careerIndex < count; careerIndex += 1) {
        var careerResult = OWL_ALPHA_AUTO.longCareer({ seed: (Number(data.seed) || 20260902) + careerIndex, teamPreset: data.teamPreset || 'mid', plan: data.plan || 'balanced' });
        career.avgChampionships += careerResult.championships;
        career.avgMvps += careerResult.mvps;
        career.sevenPlusChampionshipsRate += careerResult.sevenPlusChampionships ? 1 : 0;
        if (careerIndex < 2) career.examples.push(careerResult);
        if (careerIndex % 25 === 0) self.postMessage({ type: 'progress', done: careerIndex, total: count });
      }
      career.avgChampionships /= count;
      career.avgMvps /= count;
      career.sevenPlusChampionshipsRate /= count;
      self.postMessage({ type: 'complete', result: { long: true, result: career } });
      return;
    }
    var players = data.matrix ? ['rookie', 'star', 'veteran'] : [data.playerPreset || 'rookie'];
    var teams = data.matrix ? ['contender', 'mid', 'rebuild'] : [data.teamPreset || 'mid'];
    var plans = data.matrix ? ['balanced', 'mechanics', 'meta', 'team', 'veteran'] : [data.plan || 'balanced'];
    var configs = [];
    players.forEach(function (player) { teams.forEach(function (team) { plans.forEach(function (plan) { configs.push({ playerPreset: player, teamPreset: team, plan: plan }); }); }); });
    var total = count * configs.length;
    var done = 0;
    var groups = configs.map(function (config) { return { config: config, result: runSamples(config, count, Number(data.seed) || 20260902, function () { done += 1; if (done % 250 === 0) self.postMessage({ type: 'progress', done: done, total: total }); }) }; });
    self.postMessage({ type: 'complete', result: { groups: groups, matrix: !!data.matrix, samplesPerGroup: count } });
  } catch (error) {
    self.postMessage({ type: 'error', message: error.message });
  }
};

function runSamples(config, count, seed, onSample) {
  var results = [];
  var aggregate = { samples: count, avgOvrGrowth: 0, medianOvrGrowth: 0, championships: 0, playoffRate: 0, mvpRate: 0, fmvpRate: 0, failureRate: 0, restRate: 0, positiveContributionLossRate: 0, negativeContributionWinRate: 0, avgRoleChange: 0, avgCoachTrustChange: 0, avgReputationChange: 0, roleDistribution: { substitute: 0, rotation: 0, starter: 0, core: 0 }, gradeDistribution: { S: 0, A: 0, B: 0, C: 0, D: 0 }, tagDistribution: {}, actionImpact: {} };
  ['mechanics', 'heroPool', 'gameSense', 'teamwork', 'mental', 'rest'].forEach(function (action) { aggregate.actionImpact[action] = { samples: 0, avgWinImpactPP: 0, avgRating: 0, avgPersonalContributionPP: 0 }; });
  var growth = [];
  for (var i = 0; i < count; i += 1) {
    var state = OWL_ALPHA_AUTO.simulate({ seed: seed + i + config.playerPreset.length * 10000 + config.teamPreset.length * 100, playerPreset: config.playerPreset, teamPreset: config.teamPreset, plan: config.plan });
    var report = OWL_ALPHA_ENGINE.seasonReport(state);
    var failures = state.decisions.filter(function (decision) { return decision.failed; }).length;
    var rests = state.decisions.filter(function (decision) { return decision.action === 'rest'; }).length;
    var delta = report.playerOvr - OWL_ALPHA_CONSTANTS.PLAYER_PRESETS[config.playerPreset].ovr;
    growth.push(delta);
    aggregate.avgOvrGrowth += delta;
    aggregate.championships += state.playoff.status === 'champion' ? 1 : 0;
    aggregate.playoffRate += report.qualified ? 1 : 0;
    aggregate.mvpRate += state.awards.mvp && state.awards.mvp.id === 'you' ? 1 : 0;
    aggregate.fmvpRate += state.awards.fmvp && state.awards.fmvp.name === '你' ? 1 : 0;
    var actionContribution = 0;
    state.blockReports.forEach(function (report) {
      var action = aggregate.actionImpact[report.actionId];
      if (!action) return;
      action.samples += 1;
      var ledger = (report.matches || []).map(function (match) { return match.impactLedger; });
      var winImpact = ledger.reduce(function (sum, item) { return sum + (item.trainingImpactPP || 0); }, 0) / Math.max(1, ledger.length);
      var personal = ledger.reduce(function (sum, item) { return sum + (item.personalContributionPP || 0); }, 0) / Math.max(1, ledger.length);
      action.avgWinImpactPP += winImpact;
      action.avgRating += report.averageRating;
      action.avgPersonalContributionPP += personal;
      actionContribution += winImpact;
    });
    var finalRole = OWL_ALPHA_IMPACT.roleProfile(state.resources.roleStatus).id;
    if (aggregate.roleDistribution[finalRole] != null) aggregate.roleDistribution[finalRole] += 1;
    aggregate.positiveContributionLossRate += actionContribution > 0 && state.wins < state.losses ? 1 : 0;
    aggregate.negativeContributionWinRate += actionContribution < 0 && state.wins > state.losses ? 1 : 0;
    aggregate.avgRoleChange += state.resources.roleStatus - 50;
    aggregate.avgCoachTrustChange += state.resources.coachTrust - 50;
    var grade = state.career && state.career.seasonGrade;
    if (grade && aggregate.gradeDistribution[grade] != null) {
      aggregate.gradeDistribution[grade] += 1;
      aggregate.avgReputationChange += state.career.reputation - OWL_ALPHA_CONSTANTS.PLAYER_PRESETS[config.playerPreset].reputation;
      (state.career.careerTags || []).forEach(function (tag) { aggregate.tagDistribution[tag] = (aggregate.tagDistribution[tag] || 0) + 1; });
    }
    aggregate.failureRate += failures;
    aggregate.restRate += rests;
    if (i < 3) results.push(report);
    onSample();
  }
  growth.sort(function (a, b) { return a - b; });
  aggregate.avgOvrGrowth = aggregate.avgOvrGrowth / count;
  aggregate.medianOvrGrowth = growth[Math.floor(growth.length / 2)];
  aggregate.championshipRate = aggregate.championships / count;
  aggregate.playoffRate = aggregate.playoffRate / count;
  aggregate.mvpRate = aggregate.mvpRate / count;
  aggregate.fmvpRate = aggregate.fmvpRate / count;
  aggregate.avgFailures = aggregate.failureRate / count;
  aggregate.avgRests = aggregate.restRate / count;
  aggregate.positiveContributionLossRate = aggregate.positiveContributionLossRate / count;
  aggregate.negativeContributionWinRate = aggregate.negativeContributionWinRate / count;
  aggregate.avgRoleChange = aggregate.avgRoleChange / count;
  aggregate.avgCoachTrustChange = aggregate.avgCoachTrustChange / count;
  aggregate.avgReputationChange = aggregate.avgReputationChange / count;
  Object.keys(aggregate.actionImpact).forEach(function (action) {
    var metric = aggregate.actionImpact[action];
    if (!metric.samples) return;
    metric.avgWinImpactPP /= metric.samples;
    metric.avgRating /= metric.samples;
    metric.avgPersonalContributionPP /= metric.samples;
  });
  delete aggregate.failureRate;
  delete aggregate.restRate;
  return { aggregate: aggregate, samples: results };
}
