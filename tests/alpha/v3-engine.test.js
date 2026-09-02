const test = require('node:test');
const assert = require('node:assert/strict');

globalThis.OWL_ALPHA_RANDOM = undefined;
require('../../alpha-public/alpha/src/random.js');
require('../../alpha-public/alpha/src/constants.js');
require('../../alpha-public/alpha/src/impact.js');
require('../../alpha-public/alpha/src/career.js');
require('../../alpha-public/alpha/src/engine.js');
require('../../alpha-public/alpha/src/scenario-v3.js');
require('../../alpha-public/alpha/src/engine-v3.js');

const V3 = globalThis.OWL_ALPHA_V3;

test('V3 starts the fixed Stage scenario and resolves one choice into a match montage', () => {
  const state = V3.makeState({ seed: 12345 });

  assert.equal(state.playerPreset, 'rookie');
  assert.equal(state.teamPreset, 'mid');
  assert.equal(state.player.age, 18);
  assert.equal(state.resources.roleStatus, 50);
  assert.equal(state.resources.coachTrust, 60);
  assert.equal(state.v3.stage, 1);
  assert.equal(state.v3.round, 1);
  assert.equal(state.pending.type, 'stage_intro');

  V3.begin(state);
  const decision = V3.currentDecision(state);
  assert.equal(state.pending.type, 'decision');
  assert.equal(decision.choices.length, 3);

  const choice = decision.choices[0];
  const outcome = V3.choose(state, choice.id);
  assert.equal(outcome.choiceId, choice.id);
  assert.equal(state.pending.type, 'match_montage');
  assert.equal(state.matches.length, 4);
  assert.equal(state.v3.lastReport.matches.length, 4);
  assert.ok(state.v3.preparationTags.length >= 1);

  V3.finishMontage(state);
  assert.equal(state.pending.type, 'round_summary');
  assert.match(state.v3.lastSummary.title, /本轮|开局/);

  V3.continue(state);
  assert.equal(state.pending.type, 'decision');
  assert.equal(state.v3.round, 2);
});

test('V3 completes four rounds, 18 matches, and a route-aware Stage finale', () => {
  const state = V3.makeState({ seed: 12345 });
  V3.begin(state);

  for (let round = 1; round <= 3; round += 1) {
    const decision = V3.currentDecision(state);
    assert.equal(state.pending.type, 'decision');
    assert.equal(decision.choices.length, 3);
    V3.choose(state, decision.choices[round === 2 ? 1 : 0].id);
    assert.equal(state.pending.type, 'match_montage');
    V3.finishMontage(state);
    assert.equal(state.pending.type, 'round_summary');
    V3.continue(state);
  }

  assert.equal(state.v3.round, 4);
  assert.equal(state.pending.type, 'finale_decision');
  const finale = V3.currentDecision(state);
  assert.ok(finale.choices.length >= 2);
  assert.ok(finale.choices.some((choice) => choice.id !== 'stable'));

  V3.choose(state, finale.choices[1].id);
  assert.equal(state.pending.type, 'match_montage');
  assert.equal(state.matches.length, 18);
  V3.finishMontage(state);

  assert.equal(state.pending.type, 'stage_result');
  assert.ok(['achieved', 'close', 'missed'].includes(state.v3.stageOutcome.id));
  assert.equal(state.stageRecords[0].games, 18);
  assert.ok(state.v3.stageOutcome.roleAfter);
});

test('V3 same-seed route choices change preparation tags and finale options', () => {
  function play(routeIndex) {
    const state = V3.makeState({ seed: 24680 });
    V3.begin(state);
    for (let round = 1; round <= 3; round += 1) {
      const decision = V3.currentDecision(state);
      V3.choose(state, decision.choices[routeIndex].id);
      V3.finishMontage(state);
      V3.continue(state);
    }
    return { state, finale: V3.currentDecision(state) };
  }

  const carry = play(0);
  const team = play(2);
  assert.notDeepEqual(carry.state.v3.routeScores, team.state.v3.routeScores);
  assert.notDeepEqual(carry.state.v3.preparationTags, team.state.v3.preparationTags);
  assert.notDeepEqual(carry.finale.choices.map((choice) => choice.id), team.finale.choices.map((choice) => choice.id));
});

test('V3 keeps locked finale routes visible without making them selectable', () => {
  const state = V3.makeState({ seed: 24680 });
  state.v3.round = 4;
  state.pending = { type: 'finale_decision', round: 4 };
  state.v3.routeScores.carry = 2;
  state.resources.coachTrust = 50;

  const finale = V3.currentDecision(state);
  assert.deepEqual(finale.choices.map((choice) => choice.id), ['stable']);
  assert.equal(finale.lockedChoices.length, 1);
  assert.equal(finale.lockedChoices[0].id, 'carry');
  assert.match(finale.lockedChoices[0].lockReason, /60/);
});

test('V3 Stage outcome can be achieved, close, or missed without changing V2 thresholds', () => {
  function play(seed) {
    const state = V3.makeState({ seed });
    V3.begin(state);
    for (let round = 1; round <= 3; round += 1) {
      V3.choose(state, V3.currentDecision(state).choices[0].id);
      V3.finishMontage(state);
      V3.continue(state);
    }
    const finale = V3.currentDecision(state);
    V3.choose(state, (finale.choices.find((choice) => choice.id === 'carry') || finale.choices[0]).id);
    V3.finishMontage(state);
    return state.v3.stageOutcome.id;
  }

  assert.equal(play(1257), 'achieved');
  assert.equal(play(1), 'close');
  assert.equal(play(51), 'missed');
});
