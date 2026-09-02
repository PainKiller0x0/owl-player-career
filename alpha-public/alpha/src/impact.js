(function (root) {
  'use strict';

  var ACTION_EFFECTS = {
    mechanics: { ledgerCategory: 'personal', label: '操作稳定', ratingDelta: 0.30, personalWinPP: 2, roleChanceDelta: 2, tags: ['操作稳定'] },
    heroPool: { ledgerCategory: 'meta', label: '版本适应', ratingDelta: 0.15, metaPP: 3, roleChanceDelta: 1, tags: ['版本适应'] },
    gameSense: { ledgerCategory: 'decision', label: '比赛阅读', ratingDelta: 0.20, decisionPP: 2.5, roleChanceDelta: 2, tags: ['比赛阅读'] },
    teamwork: { ledgerCategory: 'synergy', label: '团队默契', ratingDelta: 0.10, synergyPP: 3, roleChanceDelta: 1, tags: ['团队默契'] },
    mental: { ledgerCategory: 'state', label: '心态稳定', ratingDelta: 0.05, personalWinPP: 1, statePP: 1, ratingNoiseMultiplier: 0.55, tags: ['心态稳定'] },
    rest: { ledgerCategory: 'state', label: '恢复状态', ratingDelta: 0, statePP: 1, ratingNoiseMultiplier: 0.55, tags: ['恢复状态'] }
  };

  var ROLE_PROFILES = [
    { id: 'substitute', label: '替补', min: 0, max: 34, appearance: 0.50, personalCap: 3, roleDelta: 2 },
    { id: 'rotation', label: '轮换', min: 35, max: 59, appearance: 0.75, personalCap: 5, roleDelta: 3 },
    { id: 'starter', label: '首发', min: 60, max: 79, appearance: 1, personalCap: 7, roleDelta: 4 },
    { id: 'core', label: '战术核心', min: 80, max: 100, appearance: 1, personalCap: 8, roleDelta: 5 }
  ];

  var MATCH_PLANS = {
    stable: { id: 'stable', name: '稳健执行', description: '降低波动，优先把训练成果稳定兑现。', winPP: 0, effectMultiplier: 0.8, ratingNoiseMultiplier: 0.72, roleDelta: 0 },
    focus: { id: 'focus', name: '围绕当前备战方向', description: '让本节点训练方向在比赛中获得更清晰的反馈。', winPP: 1.5, effectMultiplier: 1.2, ratingNoiseMultiplier: 0.9, roleDelta: 1 },
    highRisk: { id: 'highRisk', name: '高风险抢节奏', description: '主动放大临场收益，赢下关键回合，但波动更大。', winPP: 3, effectMultiplier: 1.35, ratingNoiseMultiplier: 1.35, roleDelta: 2 }
  };

  function copy(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function actionEffect(actionId, failed) {
    var base = ACTION_EFFECTS[actionId] || ACTION_EFFECTS.rest;
    var effect = copy(base);
    if (failed) {
      Object.keys(effect).forEach(function (key) {
        if (typeof effect[key] === 'number' && key !== 'ratingNoiseMultiplier') effect[key] = effect[key] * 0.25;
      });
      effect.failed = true;
      effect.label += '（训练失误，效果降低）';
    }
    effect.sourceAction = actionId;
    effect.teamWinPP = 0;
    effect.remainingBlocks = 1;
    effect.personalWinPP = effect.personalWinPP || 0;
    effect.metaPP = effect.metaPP || 0;
    effect.synergyPP = effect.synergyPP || 0;
    effect.decisionPP = effect.decisionPP || 0;
    effect.statePP = effect.statePP || 0;
    effect.ratingDelta = effect.ratingDelta || 0;
    effect.roleChanceDelta = effect.roleChanceDelta || 0;
    return effect;
  }

  function roleProfile(roleStatus) {
    var value = clamp(Number(roleStatus) || 0, 0, 100);
    return ROLE_PROFILES.find(function (profile) { return value >= profile.min && value <= profile.max; }) || ROLE_PROFILES[0];
  }

  function matchPlan(id) {
    var normalized = id === 'balanced' ? 'focus' : id;
    return copy(MATCH_PLANS[normalized] || MATCH_PLANS.focus);
  }

  function availablePlans(coachTrust) {
    var plans = [MATCH_PLANS.stable];
    if (coachTrust >= 40) plans.push(MATCH_PLANS.focus);
    if (coachTrust >= 60) plans.push(MATCH_PLANS.highRisk);
    return plans.map(copy);
  }

  function relationEffects(state, actionId) {
    var relations = state.relationships || {};
    return {
      synergyPP: actionId === 'teamwork' && relations.partner >= 75 ? 2 : 0,
      decisionPP: relations.coach >= 60 ? 1 : 0,
      roleDelta: relations.rival >= 60 ? 1 : 0,
      mentorMultiplier: relations.mentor >= 75 ? 1.25 : 1,
      nemesisRatingDelta: relations.nemesis >= 60 ? 0.20 : 0,
      coachTrustBonus: relations.coach >= 60 ? 1 : 0,
      thresholds: [
        relations.coach >= 60 ? '主教练关系阈值' : '',
        actionId === 'teamwork' && relations.partner >= 75 ? '主要搭档关系阈值' : '',
        relations.rival >= 60 ? '位置竞争阈值' : '',
        (actionId === 'gameSense' || actionId === 'mental') && relations.mentor >= 75 ? '老将导师阈值' : '',
        relations.nemesis >= 60 ? '宿敌对位阈值' : ''
      ].filter(Boolean)
    };
  }

  root.OWL_ALPHA_IMPACT = {
    actionEffect: actionEffect,
    roleProfile: roleProfile,
    matchPlan: matchPlan,
    availablePlans: availablePlans,
    relationEffects: relationEffects,
    getActionEffects: function () { return copy(ACTION_EFFECTS); },
    getRoleProfiles: function () { return copy(ROLE_PROFILES); },
    getMatchPlans: function () { return copy(MATCH_PLANS); }
  };
})(typeof globalThis === 'undefined' ? this : globalThis);
