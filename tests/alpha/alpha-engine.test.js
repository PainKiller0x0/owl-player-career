const test = require('node:test');
const assert = require('node:assert/strict');

globalThis.OWL_ALPHA_RANDOM = undefined;
require('../../alpha-public/alpha/src/random.js');
require('../../alpha-public/alpha/src/constants.js');
require('../../alpha-public/alpha/src/impact.js');
require('../../alpha-public/alpha/src/career.js');
require('../../alpha-public/alpha/src/engine.js');
require('../../alpha-public/alpha/src/auto.js');

const E = globalThis.OWL_ALPHA_ENGINE;
const A = globalThis.OWL_ALPHA_AUTO;
const I = globalThis.OWL_ALPHA_IMPACT;

function finishManual(options) {
  const state = E.makeState(options);
  let guard = 0;
  while (state.pending.type !== 'summary' && guard++ < 100) {
    if (state.pending.type === 'action') E.applyAction(state, guard % 5 === 0 ? 'rest' : 'teamwork');
    else if (state.pending.type === 'action_result') E.continueActionResult(state);
    else if (state.pending.type === 'match_plan') E.chooseMatchPlan(state, 'balanced');
    else if (state.pending.type === 'block_report') E.acknowledgeBlockReport(state);
    else if (state.pending.type === 'event') E.resolveEvent(state, state.event.choices[0].id);
    else if (state.pending.type === 'report') E.continueReport(state);
    else if (state.pending.type === 'playoff') E.resolvePlayoff(state);
    else if (state.pending.type === 'career_handoff') E.acknowledgeCareerHandoff(state);
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

test('an action exposes its result before a match block and the block exposes its impact ledger', () => {
  const state = E.makeState({ seed: 123, playerPreset: 'star', teamPreset: 'mid', plan: 'balanced' });
  E.applyAction(state, 'mechanics');
  E.continueActionResult(state);
  E.resolveEvent(state, state.event.choices[0].id);
  E.applyAction(state, 'heroPool');
  assert.equal(state.pending.type, 'action_result');
  assert.equal(state.pending.actionId, 'heroPool');
  E.continueActionResult(state);
  assert.equal(state.pending.type, 'action');
  for (let block = 0; block < 4; block += 1) {
    E.applyAction(state, 'heroPool');
    assert.equal(state.pending.type, 'action_result');
    assert.ok(state.actionResult.temporaryEffect);
    assert.equal(state.actionResult.temporaryEffect.sourceAction, 'heroPool');
    assert.equal(state.actionResult.temporaryEffect.remainingBlocks, 1);
    assert.equal(state.actionResult.temporaryEffect.teamWinPP, 0);
    E.continueActionResult(state);
    if (state.pending.type === 'match_plan') E.chooseMatchPlan(state, 'balanced');
    assert.equal(state.pending.type, 'block_report');
    if (block < 3) E.acknowledgeBlockReport(state);
  }
  assert.equal(state.pending.type, 'block_report');
  assert.equal(state.blockContext.matches.length, 5);
  assert.ok(state.blockContext.impactLedger.length > 0);
  const ledger = state.blockContext.impactLedger[0];
  const sum = ledger.baseProbability + ledger.playerAbilityPP + ledger.metaPP + ledger.synergyPP + ledger.decisionPP + ledger.actionPP + ledger.statePP + ledger.variancePP + (ledger.probabilityBoundPP || 0);
  assert.ok(Math.abs(sum - ledger.finalProbability) < 0.001);
  assert.equal(state.node, 8);
});

test('different actions create different match impact vectors and personal contribution is capped', () => {
  function prepare(actionId) {
    const state = E.makeState({ seed: 456, playerPreset: 'star', teamPreset: 'mid', plan: 'balanced' });
    E.applyAction(state, 'mechanics');
    E.continueActionResult(state);
    E.resolveEvent(state, state.event.choices[0].id);
    E.applyAction(state, actionId);
    E.continueActionResult(state);
    E.applyAction(state, actionId);
    E.continueActionResult(state);
    return state.blockContext.impactLedger[0];
  }
  const mechanics = prepare('mechanics');
  const mental = prepare('mental');
  assert.notEqual(mechanics.actionPP, mental.actionPP);
  assert.ok(mental.actionPP >= 0);
  assert.ok(mental.statePP >= 0);
  assert.ok(Math.abs(mechanics.playerAbilityPP + mechanics.actionPP) <= 8.001);
  assert.ok(Math.abs(mental.playerAbilityPP + mental.actionPP) <= 8.001);
});

test('block feedback must be acknowledged before the next node and career handoff is one-time', () => {
  const state = E.makeState({ seed: 789, playerPreset: 'rookie', teamPreset: 'mid', plan: 'balanced' });
  E.applyAction(state, 'rest');
  E.continueActionResult(state);
  assert.equal(state.pending.type, 'event');
  E.resolveEvent(state, state.event.choices[0].id);
  E.applyAction(state, 'teamwork');
  E.continueActionResult(state);
  for (let block = 0; block < 4; block += 1) {
    if (state.pending.type === 'event') E.resolveEvent(state, state.event.choices[0].id);
    E.applyAction(state, 'teamwork');
    E.continueActionResult(state);
    if (state.pending.type === 'match_plan') E.chooseMatchPlan(state, 'balanced');
    if (block < 3) E.acknowledgeBlockReport(state);
  }
  assert.throws(() => E.applyAction(state, 'rest'), /当前节点不接受/);
  E.acknowledgeBlockReport(state);
  assert.notEqual(state.pending.type, 'block_report');
  const completed = finishManual({ seed: 790, playerPreset: 'star', teamPreset: 'contender', plan: 'balanced' });
  assert.equal(completed.pending.type, 'summary');
  assert.ok(completed.career && completed.career.seasonGrade);
  const reputation = completed.career.reputation;
  E.acknowledgeCareerHandoff(completed);
  assert.equal(completed.career.reputation, reputation);
});

test('action effects fail at 25 percent, role bands control appearance, and no appearance has no personal contribution', () => {
  const normal = I.actionEffect('mechanics', false);
  const failed = I.actionEffect('mechanics', true);
  assert.equal(failed.personalWinPP, normal.personalWinPP * 0.25);
  assert.equal(failed.ratingDelta, normal.ratingDelta * 0.25);
  assert.equal(I.roleProfile(20).id, 'substitute');
  assert.equal(I.roleProfile(50).id, 'rotation');
  assert.equal(I.roleProfile(70).id, 'starter');
  assert.equal(I.roleProfile(90).id, 'core');
  const state = E.makeState({ seed: 99, playerPreset: 'rookie', teamPreset: 'mid', plan: 'balanced' });
  E.applyAction(state, 'mechanics'); E.continueActionResult(state); E.resolveEvent(state, state.event.choices[0].id);
  E.applyAction(state, 'mechanics'); E.continueActionResult(state);
  state.resources.roleStatus = 0;
  E.applyAction(state, 'mechanics'); E.continueActionResult(state);
  const ledgers = state.blockContext.impactLedger;
  assert.ok(ledgers.some((ledger) => ledger.appeared === false));
  ledgers.filter((ledger) => !ledger.appeared).forEach((ledger) => assert.equal(ledger.personalContributionPP, 0));
  ledgers.filter((ledger) => ledger.appeared).forEach((ledger) => assert.ok(Math.abs(ledger.personalContributionPP) <= 3.001));
  ledgers.forEach((ledger) => assert.ok(ledger.finalProbability >= 15 && ledger.finalProbability <= 85));
});

test('V2 storage and next-season preview stay isolated from the V1 prefix', () => {
  globalThis.OWL_ALPHA_STORAGE = undefined;
  require('../../alpha-public/alpha/src/storage.js');
  const storage = globalThis.OWL_ALPHA_STORAGE;
  assert.equal(storage.PREFIX, 'owl_alpha_season_demo_v2:');
  assert.ok(!storage.PREFIX.includes('v1'));
  const state = finishManual({ seed: 812, playerPreset: 'star', teamPreset: 'mid', plan: 'balanced' });
  assert.equal(state.careerImpact.seasonGrade, state.career.seasonGrade);
  const next = E.startNextSeason(state, 'contender');
  assert.equal(next.career.reputation, state.career.reputation);
  assert.deepEqual(next.career.history, state.career.history);
  assert.equal(next.career.handoffApplied, false);
  const sameTeam = E.startNextSeason(state, 'mid');
  assert.equal(sameTeam.resources.coachTrust, Math.round(state.resources.coachTrust * 0.60));
  assert.equal(sameTeam.relationships.coach, Math.round(state.relationships.coach * 0.50));
  assert.equal(sameTeam.resources.roleStatus, Math.round(state.resources.roleStatus * 0.75 + 12.5));
  assert.equal(next.resources.coachTrust, 50);
  assert.equal(next.relationships.partner, 25);
  const previousStorage = globalThis.localStorage;
  const fakeStorage = {
    'owl_alpha_season_demo_v1:current': 'legacy',
    getItem(key) { return this[key] || null; },
    setItem(key, value) { this[key] = value; },
    removeItem(key) { delete this[key]; }
  };
  globalThis.localStorage = fakeStorage;
  assert.equal(storage.hasLegacy(), true);
  storage.clear();
  assert.equal(fakeStorage['owl_alpha_season_demo_v1:current'], 'legacy');
  if (previousStorage === undefined) delete globalThis.localStorage;
  else globalThis.localStorage = previousStorage;
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
