const test = require('node:test');
const assert = require('node:assert/strict');

globalThis.OWL_ALPHA_RANDOM = undefined;
require('../../alpha-public/alpha/src/random.js');
require('../../alpha-public/alpha/src/constants.js');
require('../../alpha-public/alpha/src/engine.js');
require('../../alpha-public/alpha/src/auto.js');

const E = globalThis.OWL_ALPHA_ENGINE;
const A = globalThis.OWL_ALPHA_AUTO;

function finishManual(options) {
  const state = E.makeState(options);
  let guard = 0;
  while (state.pending.type !== 'summary' && guard++ < 100) {
    if (state.pending.type === 'action') E.applyAction(state, guard % 5 === 0 ? 'rest' : 'teamwork');
    else if (state.pending.type === 'event') E.resolveEvent(state, state.event.choices[0].id);
    else if (state.pending.type === 'report') E.continueReport(state);
    else if (state.pending.type === 'playoff') E.resolvePlayoff(state);
  }
  assert.equal(state.pending.type, 'summary');
  return state;
}

test('one fixed-seed season completes all 22 nodes and 56 matches', () => {
  const state = finishManual({ seed: 1001, playerPreset: 'rookie', teamPreset: 'mid', plan: 'balanced' });
  assert.equal(state.node, 22);
  assert.equal(state.completed, true);
  assert.equal(state.matches.length, 56);
  assert.deepEqual(state.stageRecords.map((record) => record.games), [18, 19, 19]);
  assert.equal(state.standings.length, 20);
  assert.equal(state.wins + state.losses, 56);
  assert.ok(state.standings.some((row) => row.isPlayer));
});

test('same seed and decisions are reproducible', () => {
  const first = finishManual({ seed: 20260902, playerPreset: 'star', teamPreset: 'contender', plan: 'meta' });
  const second = finishManual({ seed: 20260902, playerPreset: 'star', teamPreset: 'contender', plan: 'meta' });
  assert.deepEqual(first, second);
  const different = finishManual({ seed: 20260903, playerPreset: 'star', teamPreset: 'contender', plan: 'meta' });
  assert.notDeepEqual(first.matches, different.matches);
});

test('automatic mode uses the same engine and does not get stuck', () => {
  const state = A.simulate({ seed: 88, playerPreset: 'veteran', teamPreset: 'rebuild', plan: 'veteran' });
  assert.equal(state.pending.type, 'summary');
  assert.equal(state.matches.length, 56);
  assert.ok(state.decisions.length > 0);
  assert.ok(state.decisions.every((decision) => decision.action));
});

test('long-career harness carries a player through 12 seasons', () => {
  const result = A.longCareer({ seed: 9090, teamPreset: 'mid', plan: 'balanced' });
  assert.equal(result.records.length, 12);
  assert.equal(result.records[0].age, 18);
  assert.equal(result.records[11].age, 29);
  assert.ok(result.championships >= 0 && result.championships <= 12);
});

test('bounds, progression conversion, and age bands are enforced', () => {
  const state = finishManual({ seed: 77, playerPreset: 'veteran', teamPreset: 'mid', plan: 'balanced' });
  assert.ok(state.player.attributes.mechanics >= 50 && state.player.attributes.mechanics <= 100);
  assert.ok(state.player.attributes.heroPool >= 50 && state.player.attributes.heroPool <= 100);
  assert.ok(state.resources.energy >= 0 && state.resources.energy <= 100);
  assert.ok(state.resources.stress >= 0 && state.resources.stress <= 100);
  assert.equal(E.ageBand(18), 'rookie');
  assert.equal(E.ageBand(23), 'peak');
  assert.equal(E.ageBand(27), 'veteran');
  const next = E.startNextSeason(state, 'contender');
  assert.equal(next.player.age, 28);
  assert.equal(next.teamPreset, 'contender');
  assert.deepEqual(next.player.attributes, state.player.attributes);
});

test('playoff failure path still reaches the summary', () => {
  const state = finishManual({ seed: 4, playerPreset: 'rookie', teamPreset: 'rebuild', plan: 'balanced' });
  assert.equal(state.playoff.results.length, 3);
  assert.equal(state.pending.type, 'summary');
});
