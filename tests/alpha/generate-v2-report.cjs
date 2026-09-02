const fs = require('fs');
const path = require('path');

require('../../alpha-public/alpha/src/random.js');
require('../../alpha-public/alpha/src/constants.js');
require('../../alpha-public/alpha/src/impact.js');
require('../../alpha-public/alpha/src/career.js');
require('../../alpha-public/alpha/src/engine.js');
require('../../alpha-public/alpha/src/auto.js');

const A = globalThis.OWL_ALPHA_AUTO;
const E = globalThis.OWL_ALPHA_ENGINE;
const C = globalThis.OWL_ALPHA_CONSTANTS;
const I = globalThis.OWL_ALPHA_IMPACT;
const outputDir = path.resolve(__dirname, '../../alpha-artifacts');
const actions = ['mechanics', 'heroPool', 'gameSense', 'teamwork', 'mental', 'rest'];
const players = ['rookie', 'star', 'veteran'];
const teams = ['contender', 'mid', 'rebuild'];

function firstBlock(actionId) {
  const state = E.makeState({ seed: 20260902, playerPreset: 'star', teamPreset: 'mid', plan: 'balanced' });
  E.applyAction(state, 'mechanics'); E.continueActionResult(state);
  E.resolveEvent(state, state.event.choices[0].id);
  E.applyAction(state, actionId); E.continueActionResult(state);
  E.applyAction(state, actionId); E.continueActionResult(state);
  const report = state.blockContext.report;
  const ledger = state.blockContext.impactLedger;
  return {
    action: actionId,
    temporaryEffect: state.blockContext.temporaryEffect,
    averageRating: report.averageRating,
    averageWinImpactPP: Number((ledger.reduce((sum, item) => sum + item.trainingImpactPP, 0) / ledger.length).toFixed(3)),
    averagePersonalContributionPP: Number((ledger.reduce((sum, item) => sum + item.personalContributionPP, 0) / ledger.length).toFixed(3)),
    roleBefore: report.roleBefore,
    projectedRoleChange: report.projectedRoleChange,
    appearances: report.appearances,
    games: report.games
  };
}

function runGroup(playerPreset, teamPreset, plan, count) {
  const result = { playerPreset, teamPreset, plan, samples: count, avgOvrGrowth: 0, championshipRate: 0, playoffRate: 0, mvpRate: 0, fmvpRate: 0, positiveContributionLossRate: 0, negativeContributionWinRate: 0, avgRoleChange: 0, avgCoachTrustChange: 0, avgReputationChange: 0, roleDistribution: { substitute: 0, rotation: 0, starter: 0, core: 0 }, gradeDistribution: { S: 0, A: 0, B: 0, C: 0, D: 0 }, tagDistribution: {}, actionImpact: {} };
  actions.forEach((action) => { result.actionImpact[action] = { samples: 0, avgWinImpactPP: 0, avgRating: 0, avgPersonalContributionPP: 0 }; });
  for (let index = 0; index < count; index += 1) {
    const state = A.simulate({ seed: 20260902 + index + playerPreset.length * 10000 + teamPreset.length * 100, playerPreset, teamPreset, plan });
    result.avgOvrGrowth += state.player.ovr - C.PLAYER_PRESETS[playerPreset].ovr;
    result.championshipRate += state.playoff.status === 'champion' ? 1 : 0;
    result.playoffRate += state.playoff.qualified ? 1 : 0;
    result.mvpRate += state.awards.mvp && state.awards.mvp.id === 'you' ? 1 : 0;
    result.fmvpRate += state.awards.fmvp && state.awards.fmvp.name === '你' ? 1 : 0;
    let contribution = 0;
    state.blockReports.forEach((report) => {
      const metric = result.actionImpact[report.actionId];
      if (!metric) return;
      const ledgers = report.matches.map((match) => match.impactLedger);
      metric.samples += 1;
      metric.avgWinImpactPP += ledgers.reduce((sum, item) => sum + item.trainingImpactPP, 0) / ledgers.length;
      metric.avgRating += report.averageRating;
      metric.avgPersonalContributionPP += ledgers.reduce((sum, item) => sum + item.personalContributionPP, 0) / ledgers.length;
      contribution += ledgers.reduce((sum, item) => sum + item.trainingImpactPP, 0) / ledgers.length;
    });
    result.positiveContributionLossRate += contribution > 0 && state.wins < state.losses ? 1 : 0;
    result.negativeContributionWinRate += contribution < 0 && state.wins > state.losses ? 1 : 0;
    result.avgRoleChange += state.resources.roleStatus - 50;
    result.avgCoachTrustChange += state.resources.coachTrust - 50;
    result.roleDistribution[I.roleProfile(state.resources.roleStatus).id] += 1;
    if (state.career && state.career.seasonGrade) {
      result.gradeDistribution[state.career.seasonGrade] += 1;
      result.avgReputationChange += state.career.reputation - C.PLAYER_PRESETS[playerPreset].reputation;
      (state.career.careerTags || []).forEach((tag) => { result.tagDistribution[tag] = (result.tagDistribution[tag] || 0) + 1; });
    }
  }
  result.avgOvrGrowth /= count;
  result.championshipRate /= count;
  result.playoffRate /= count;
  result.mvpRate /= count;
  result.fmvpRate /= count;
  result.positiveContributionLossRate /= count;
  result.negativeContributionWinRate /= count;
  result.avgRoleChange /= count;
  result.avgCoachTrustChange /= count;
  result.avgReputationChange /= count;
  Object.keys(result.actionImpact).forEach((action) => {
    const metric = result.actionImpact[action];
    if (!metric.samples) return;
    metric.avgWinImpactPP /= metric.samples;
    metric.avgRating /= metric.samples;
    metric.avgPersonalContributionPP /= metric.samples;
  });
  return result;
}

const sensitivity = actions.map(firstBlock);
const sampleCount = Number(process.env.OWL_ALPHA_V2_SAMPLES) || 1000;
const longSampleCount = Number(process.env.OWL_ALPHA_V2_LONG_SAMPLES) || 1000;
const groups = [];
players.forEach((player) => teams.forEach((team) => groups.push(runGroup(player, team, 'balanced', sampleCount))));
const longCareer = { samples: longSampleCount, byTeam: {}, avgChampionships: 0, avgMvps: 0, sevenPlusChampionshipsRate: 0 };
teams.forEach((team) => { longCareer.byTeam[team] = { samples: 0, avgChampionships: 0, avgMvps: 0, sevenPlusChampionshipsRate: 0 }; });
for (let index = 0; index < longSampleCount; index += 1) {
  const team = teams[index % teams.length];
  const career = A.longCareer({ seed: 20260902 + index, teamPreset: team, plan: 'balanced' });
  const bucket = longCareer.byTeam[team];
  bucket.samples += 1;
  bucket.avgChampionships += career.championships;
  bucket.avgMvps += career.mvps;
  bucket.sevenPlusChampionshipsRate += career.sevenPlusChampionships ? 1 : 0;
  longCareer.avgChampionships += career.championships;
  longCareer.avgMvps += career.mvps;
  longCareer.sevenPlusChampionshipsRate += career.sevenPlusChampionships ? 1 : 0;
}
longCareer.avgChampionships /= longSampleCount;
longCareer.avgMvps /= longSampleCount;
longCareer.sevenPlusChampionshipsRate /= longSampleCount;
teams.forEach((team) => {
  const bucket = longCareer.byTeam[team];
  bucket.avgChampionships /= bucket.samples;
  bucket.avgMvps /= bucket.samples;
  bucket.sevenPlusChampionshipsRate /= bucket.samples;
});
fs.mkdirSync(outputDir, { recursive: true });
const output = { version: 'alpha-v2', generatedFromSeed: 20260902, sensitivity, groups, sampleCount, longCareer, notes: ['同一初始状态、同一道具节点、六个行动的选择敏感度。', '批量样本使用自动模式，但行动结算、比赛报告与生涯承接均来自同一 Engine。', '长生涯为 1000 条首轮抽样，用于发现极端样本，不替代正式玩法定标。'] };
fs.writeFileSync(path.join(outputDir, 'alpha-v2-feedback-report.json'), JSON.stringify(output, null, 2));
console.log(JSON.stringify({ file: path.join(outputDir, 'alpha-v2-feedback-report.json'), sensitivity: sensitivity.length, groups: groups.length, samples: groups.length * sampleCount, longSamples: longSampleCount }, null, 2));
