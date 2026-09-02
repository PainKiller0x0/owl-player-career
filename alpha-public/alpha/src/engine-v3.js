(function (root) {
  'use strict';

  var E = root.OWL_ALPHA_ENGINE;
  var I = root.OWL_ALPHA_IMPACT;
  var S = root.OWL_ALPHA_V3_SCENARIO;

  function copy(value) {
    return E.copy(value);
  }

  function clamp(value, min, max) {
    return E.clamp(value, min, max);
  }

  function makeState(options) {
    options = options || {};
    var state = E.makeState({
      seed: Number(options.seed) || 20260902,
      playerPreset: 'rookie',
      teamPreset: 'mid',
      plan: 'balanced',
      year: 2026,
      mode: 'v3'
    });
    state.node = 4;
    state.pending = { type: 'stage_intro' };
    state.event = null;
    state.resources.coachTrust = S.initialCoachTrust;
    state.v3 = {
      version: 3,
      scenarioId: S.id,
      stage: 1,
      round: 1,
      routeScores: { carry: 0, meta: 0, team: 0, stable: 0 },
      preparationTags: [],
      completedDecisionIds: [],
      lastChoice: null,
      lastReport: null,
      lastSummary: null,
      stageOutcome: null
    };
    return state;
  }

  function begin(state) {
    if (state.pending.type !== 'stage_intro') throw new Error('当前不能开始 Stage');
    state.pending = { type: 'decision', round: 1 };
    return state;
  }

  function currentDecision(state) {
    if (!state.v3) throw new Error('不是 V3 存档');
    if (state.v3.round === 1) return copy(S.rounds[1]);
    if (state.v3.round === 2) {
      var report = state.v3.lastReport;
      var good = report && report.wins >= report.losses && report.averageRating >= 6.6;
      return copy({ id: S.rounds[2].id, title: good ? S.rounds[2].good.title : S.rounds[2].hard.title, body: good ? S.rounds[2].good.body : S.rounds[2].hard.body, choices: good ? S.rounds[2].good.choices : S.rounds[2].hard.choices });
    }
    if (state.v3.round === 3) return copy(S.rounds[3]);
    return finaleDecision(state);
  }

  function finaleDecision(state) {
    var scores = state.v3.routeScores;
    var ranked = ['carry', 'meta', 'team'].sort(function (a, b) { return scores[b] - scores[a] || a.localeCompare(b); });
    var choices = [S.finalePlans.stable];
    var lockedChoices = [];
    var availablePlanIds = I.availablePlans(state.resources.coachTrust).map(function (plan) { return plan.id; });
    ranked.slice(0, 2).forEach(function (route) {
      var finale = S.finalePlans[route];
      if (scores[route] <= 0 || !finale) return;
      if (availablePlanIds.indexOf(finale.planId) >= 0) {
        choices.push(finale);
      } else {
        lockedChoices.push({
          id: finale.id,
          label: finale.label,
          body: finale.body,
          route: finale.route,
          locked: true,
          lockReason: finale.planId === 'highRisk' ? '需要教练信任度达到 60' : '需要教练信任度达到 40'
        });
      }
    });
    return { id: 'stage-finale', title: '选择收官战方案', body: '你已经为收官战准备了不同方向。现在要决定，最后一场把什么交给比赛。', choices: copy(choices), lockedChoices: copy(lockedChoices) };
  }

  function addTag(state, tagId) {
    if (!tagId || !S.tags[tagId]) return;
    var tag = S.tags[tagId];
    var existing = state.v3.preparationTags.find(function (item) { return item.id === tag.id; });
    if (existing) {
      existing.level = clamp((existing.level || 1) + 1, 1, 2);
    } else {
      state.v3.preparationTags.push({ id: tag.id, name: tag.name, icon: tag.icon, route: tag.route, level: 1 });
    }
  }

  function setInternalActionState(state, block) {
    state.node = 4 + block;
    state.pending = { type: 'action' };
    state.event = null;
  }

  function resolveActionBlock(state, choice) {
    var block = state.v3.round - 1;
    setInternalActionState(state, block);
    E.applyAction(state, choice.actionId);
    E.continueActionResult(state);
    if (state.pending.type !== 'block_report') throw new Error('V3 比赛块未生成');
    E.acknowledgeBlockReport(state, { noSchedule: true });
    var report = copy(state.blockContext.report);
    state.v3.lastReport = report;
    state.v3.lastChoice = copy(choice);
    state.v3.completedDecisionIds.push(choice.id);
    state.v3.routeScores[choice.route] += 1;
    addTag(state, choice.tag);
    state.v3.lastSummary = {
      title: block === 0 ? '开局反馈' : '本轮反馈',
      result: report.wins + ' 胜 ' + report.losses + ' 负',
      rating: report.averageRating,
      appearances: report.appearances,
      coach: report.coachFeedback,
      team: report.teamFeedback,
      tag: choice.tag ? S.tags[choice.tag].name : null
    };
    state.pending = { type: 'match_montage', round: state.v3.round, stage: 1, block: block, matches: copy(report.matches || []) };
    return { choiceId: choice.id, actionId: choice.actionId, route: choice.route, tag: choice.tag || null, report: report };
  }

  function resolveFinale(state, choice) {
    if (!choice || !S.finalePlans[choice.id]) throw new Error('未知收官方案');
    var block = 3;
    var actionMap = { carry: 'mechanics', meta: 'heroPool', team: 'teamwork', stable: 'rest' };
    var actionId = actionMap[choice.route] || 'rest';
    state.node = 7;
    state.pending = { type: 'match_plan', kind: 'regular', stage: 1, block: 3 };
    state.actionResult = { action: actionId, name: choice.label, temporaryEffect: I.actionEffect(actionId, false), block: { stage: 1, block: 3 } };
    E.chooseMatchPlan(state, choice.planId);
    if (state.pending.type !== 'block_report') throw new Error('V3 收官战未生成');
    E.acknowledgeBlockReport(state, { noSchedule: true });
    var report = copy(state.blockContext.report);
    state.v3.lastReport = report;
    state.v3.lastChoice = copy(choice);
    state.v3.completedDecisionIds.push(choice.id);
    state.v3.lastSummary = {
      title: '收官战反馈',
      result: report.wins + ' 胜 ' + report.losses + ' 负',
      rating: report.averageRating,
      appearances: report.appearances,
      coach: report.coachFeedback,
      team: report.teamFeedback,
      tag: null
    };
    state.pending = { type: 'match_montage', round: 4, stage: 1, block: block, finale: true, matches: copy(report.matches || []) };
    return { choiceId: choice.id, planId: choice.planId, route: choice.route, report: report };
  }

  function choose(state, choiceId) {
    if (!state.v3) throw new Error('不是 V3 存档');
    var decision = currentDecision(state);
    var choice = decision.choices.find(function (item) { return item.id === choiceId; });
    if (!choice) throw new Error('当前情境没有这个选项');
    if (state.pending.type === 'decision') return resolveActionBlock(state, choice);
    if (state.pending.type === 'finale_decision') return resolveFinale(state, choice);
    throw new Error('当前不能作出抉择');
  }

  function finishMontage(state) {
    if (state.pending.type !== 'match_montage') throw new Error('当前没有比赛演出');
    if (state.v3.round === 4) {
      state.v3.stageOutcome = stageOutcome(state);
      state.pending = { type: 'stage_result' };
    } else {
      state.pending = { type: 'round_summary', round: state.v3.round };
    }
    return state.v3.lastSummary;
  }

  function continueFlow(state) {
    if (state.pending.type === 'round_summary') {
      state.v3.round += 1;
      state.pending = state.v3.round === 4 ? { type: 'finale_decision', round: 4 } : { type: 'decision', round: state.v3.round };
      return state;
    }
    throw new Error('当前没有可继续的 V3 结算');
  }

  function stageOutcome(state) {
    var profile = I.roleProfile(state.resources.roleStatus);
    var opening = state.resources.roleStatus - 50;
    var outcome = opening >= 10 ? 'achieved' : (opening > 0 ? 'close' : 'missed');
    return {
      id: outcome,
      roleBefore: '轮换',
      roleAfter: profile.label,
      roleStatus: state.resources.roleStatus,
      record: state.wins + ' 胜 ' + state.losses + ' 负',
      averageRating: state.matches.filter(function (match) { return match.appeared !== false; }).reduce(function (sum, match) { return sum + match.rating; }, 0) / Math.max(1, state.matches.filter(function (match) { return match.appeared !== false; }).length),
      route: Object.keys(state.v3.routeScores).sort(function (a, b) { return state.v3.routeScores[b] - state.v3.routeScores[a]; })[0]
    };
  }

  root.OWL_ALPHA_V3 = {
    makeState: makeState,
    begin: begin,
    currentDecision: currentDecision,
    choose: choose,
    finishMontage: finishMontage,
    continue: continueFlow,
    stageOutcome: stageOutcome
  };
})(typeof globalThis === 'undefined' ? this : globalThis);
