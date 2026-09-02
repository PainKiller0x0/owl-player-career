const fs = require('fs');
const path = require('path');

require('../../alpha-public/alpha/src/random.js');
require('../../alpha-public/alpha/src/constants.js');
require('../../alpha-public/alpha/src/impact.js');
require('../../alpha-public/alpha/src/career.js');
require('../../alpha-public/alpha/src/engine.js');
require('../../alpha-public/alpha/src/auto.js');

const A = globalThis.OWL_ALPHA_AUTO;
const C = globalThis.OWL_ALPHA_CONSTANTS;
const players = ['rookie', 'star', 'veteran'];
const teams = ['contender', 'mid', 'rebuild'];
const plans = ['balanced', 'mechanics', 'meta', 'team', 'veteran'];
const outputDir = path.resolve(__dirname, '../../alpha-artifacts');
fs.mkdirSync(outputDir, { recursive: true });

function runGroup(playerPreset, teamPreset, plan, count) {
  let sum = 0; let championships = 0; let playoff = 0; let mvp = 0; let fmvp = 0; const growth = [];
  for (let i = 0; i < count; i += 1) {
    const state = A.simulate({ seed: 20260902 + i + playerPreset.length * 10000 + teamPreset.length * 100, playerPreset, teamPreset, plan });
    const delta = state.player.ovr - C.PLAYER_PRESETS[playerPreset].ovr;
    growth.push(delta); sum += delta;
    championships += state.playoff.status === 'champion' ? 1 : 0;
    playoff += state.playoff.qualified ? 1 : 0;
    mvp += state.awards.mvp && state.awards.mvp.id === 'you' ? 1 : 0;
    fmvp += state.awards.fmvp && state.awards.fmvp.name === '你' ? 1 : 0;
  }
  growth.sort((a, b) => a - b);
  return {
    playerPreset, teamPreset, plan, samples: count,
    avgOvrGrowth: Number((sum / count).toFixed(4)), medianOvrGrowth: growth[Math.floor(count / 2)],
    playoffRate: Number((playoff / count).toFixed(6)), championshipRate: Number((championships / count).toFixed(6)),
    mvpRate: Number((mvp / count).toFixed(6)), fmvpRate: Number((fmvp / count).toFixed(6))
  };
}

const matrix = [];
for (const player of players) for (const team of teams) for (const plan of plans) matrix.push(runGroup(player, team, plan, 10000));
fs.writeFileSync(path.join(outputDir, 'batch-45-groups.json'), JSON.stringify({ generatedFromSeed: 20260902, groups: matrix.length, samples: matrix.length * 10000, results: matrix }, null, 2));

const long = { generatedFromSeed: 20260902, samples: 100000, initialTeamDistribution: {}, avgChampionships: 0, avgMvps: 0, sevenPlusChampionshipsRate: 0 };
let totalChampionships = 0; let totalMvps = 0; let totalSevenPlus = 0;
for (const team of teams) long.initialTeamDistribution[team] = { samples: 0, avgChampionships: 0, avgMvps: 0, sevenPlusChampionshipsRate: 0 };
for (let i = 0; i < 100000; i += 1) {
  const team = teams[i % teams.length]; const result = A.longCareer({ seed: 20260902 + i, teamPreset: team, plan: 'balanced' }); const group = long.initialTeamDistribution[team];
  group.samples += 1; group.avgChampionships += result.championships; group.avgMvps += result.mvps; group.sevenPlusChampionshipsRate += result.sevenPlusChampionships ? 1 : 0;
  totalChampionships += result.championships; totalMvps += result.mvps; totalSevenPlus += result.sevenPlusChampionships ? 1 : 0;
}
long.avgChampionships = Number((totalChampionships / long.samples).toFixed(4));
long.avgMvps = Number((totalMvps / long.samples).toFixed(4));
long.sevenPlusChampionshipsRate = Number((totalSevenPlus / long.samples).toFixed(6));
for (const team of teams) { const group = long.initialTeamDistribution[team]; group.avgChampionships = Number((group.avgChampionships / group.samples).toFixed(4)); group.avgMvps = Number((group.avgMvps / group.samples).toFixed(4)); group.sevenPlusChampionshipsRate = Number((group.sevenPlusChampionshipsRate / group.samples).toFixed(6)); }
fs.writeFileSync(path.join(outputDir, 'long-career-100k.json'), JSON.stringify(long, null, 2));
console.log(JSON.stringify({ matrix: matrix.length, matrixSamples: matrix.length * 10000, longSamples: long.samples, outputDir }, null, 2));
