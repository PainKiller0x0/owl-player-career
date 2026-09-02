(function (root) {
  'use strict';

  var C = root.OWL_ALPHA_CONSTANTS;
  var I = root.OWL_ALPHA_IMPACT;
  var K = root.OWL_ALPHA_CAREER;
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function round(value, digits) {
    var factor = Math.pow(10, digits || 0);
    return Math.round(value * factor) / factor;
  }

  function copy(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function next(state) {
    var t = (state.rngState += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function int(state, min, max) {
    return Math.floor(next(state) * (max - min + 1)) + min;
  }

  function noise(state, min, max) {
    return min + next(state) * (max - min);
  }

  function ageBand(age) {
    if (age <= 20) return 'rookie';
    if (age <= 25) return 'peak';
    return 'veteran';
  }

  function ageFactor(age, target) {
    var factors = {
      rookie: { mechanics: 1.25, heroPool: 1.20, gameSense: 0.95, teamwork: 1, mental: 1 },
      peak: { mechanics: 1, heroPool: 1, gameSense: 1.05, teamwork: 1.05, mental: 1 },
      veteran: { mechanics: 0.65, heroPool: 0.80, gameSense: 1.20, teamwork: 1.20, mental: 1.15 }
    };
    return factors[ageBand(age)][target];
  }

  function playerOvr(attributes) {
    return Math.round(
      attributes.mechanics * 0.30 +
      attributes.heroPool * 0.22 +
      attributes.gameSense * 0.20 +
      attributes.teamwork * 0.14 +
      attributes.mental * 0.14
    );
  }

  function playerMatchPower(state) {
    var a = state.player.attributes;
    var value = a.mechanics * 0.35 + a.heroPool * 0.25 + a.gameSense * 0.20 + a.teamwork * 0.10 + a.mental * 0.10;
    return clamp(value + state.resources.form * 2 - state.resources.stress * 0.03, 0, 100);
  }

  function potentialFactor(state) {
    return clamp(0.85 + (state.player.potential - state.player.ovr) / 40, 0.85, 1.20);
  }

  function diminishing(attribute) {
    return clamp(1.15 - Math.max(0, attribute - 60) * 0.015, 0.55, 1.15);
  }

  function stateFactor(state) {
    return (1 + state.resources.form * 0.05) * (1 - state.resources.stress / 500);
  }

  function failRate(state) {
    if (state.resources.energy >= 60) return 0.01 + extraRisk(state);
    if (state.resources.energy >= 40) return 0.05 + extraRisk(state);
    if (state.resources.energy >= 20) return 0.15 + extraRisk(state);
    return 0.30 + extraRisk(state);
  }

  function extraRisk(state) {
    return state.resources.stress > 70 ? (state.resources.stress - 70) * 0.003 : 0;
  }

  function tierPower(state, tier) {
    var data = C.TEAM_PRESETS[tier];
    return {
      teamBase: data.teamBase,
      coachPower: data.coachPower,
      synergy: data.synergy,
      metaFit: clamp(70 + data.teamBase * 0.20 + noise(state, -3, 3), 60, 95),
      decisionValue: clamp(50 + data.coachPower * 0.30 + noise(state, -3, 3), 50, 95)
    };
  }

  function createTeams(state, teamPreset) {
    var names = ['首尔烈火', '伦敦喷火战斗机', '休斯顿神枪手', '纽约九霄天擎', '巴黎永生', '亚特兰大君临', '成都猎人', '达拉斯燃料', '佛罗里达狂欢', '费城融合', '上海龙之队', '杭州闪电', '波士顿崛起', '温哥华泰坦', '洛杉矶角斗士', '多伦多捍卫者', '华盛顿正义', '旧金山震动', '广州冲锋', '东京弧光'];
    var tiers = ['contender', 'contender', 'contender', 'contender', 'mid', 'mid', 'mid', 'mid', 'mid', 'mid', 'mid', 'mid', 'mid', 'mid', 'rebuild', 'rebuild', 'rebuild', 'rebuild', 'rebuild'];
    var opponents = [];
    var used = 0;
    for (var i = 0; i < names.length; i += 1) {
      var tier = tiers[used % tiers.length];
      var isPlayer = i === 0;
      if (isPlayer) {
        opponents.push({ id: 'you', name: '你的队伍', tier: teamPreset.id, isPlayer: true, power: null });
      } else {
        var values = tierPower(state, tier);
        opponents.push({
          id: 'team-' + i,
          name: names[i],
          tier: tier,
          isPlayer: false,
          teamBase: clamp(values.teamBase + int(state, -2, 2), 0, 100),
          coachPower: values.coachPower,
          synergy: values.synergy,
          metaFit: values.metaFit,
          decisionValue: values.decisionValue,
          rolePower: clamp(values.teamBase + noise(state, -5, 5), 55, 98),
          power: null
        });
        used += 1;
      }
    }
    state.teams = opponents;
  }

  function opponentPower(team) {
    return team.teamBase * 0.50 + team.metaFit * 0.20 + team.coachPower * 0.15 + team.synergy * 0.10 + team.decisionValue * 0.05;
  }

  function playerTeamPower(state) {
    var team = C.TEAM_PRESETS[state.teamPreset];
    var p = playerMatchPower(state);
    var teamBase = team.teamBase;
    var rosterPower = (teamBase * 4 + p) / 5;
    var metaFit = clamp(70 + state.player.attributes.heroPool * 0.20 + state.stageMetaRoll, 60, 95);
    var synergy = clamp(team.synergy + (state.player.attributes.teamwork - 70) * 0.10 + relationshipBonus(state), 0, 100);
    var decisionValue = clamp(50 + state.resources.coachTrust * 0.25 + state.player.attributes.gameSense * 0.25, 50, 95);
    return rosterPower * 0.50 + metaFit * 0.20 + team.coachPower * 0.15 + synergy * 0.10 + decisionValue * 0.05;
  }

  function relationshipBonus(state) {
    var count = 0;
    Object.keys(state.relationships).forEach(function (key) {
      if (state.relationships[key] >= 75) count += 1;
    });
    return Math.min(5, count * 1.5);
  }

  function teamPower(state, team) {
    return team.isPlayer ? playerTeamPower(state) : opponentPower(team);
  }

  function logistic(delta) {
    return clamp(1 / (1 + Math.pow(10, -delta / 35)), 0.15, 0.85);
  }

  function relationshipSeed() {
    return { coach: 35, partner: 25, rival: 20, mentor: 30, nemesis: 15 };
  }

  function makeState(options) {
    options = options || {};
    var seed = Number(options.seed) || 20260902;
    var player = C.PLAYER_PRESETS[options.playerPreset || 'rookie'];
    var team = C.TEAM_PRESETS[options.teamPreset || 'mid'];
    var plan = C.PLANS[options.plan || 'balanced'];
    var state = {
      version: C.VERSION,
      seed: seed,
      rngState: seed >>> 0 || 1,
      mode: options.mode || 'manual',
      year: Number(options.year) || 2026,
      node: 1,
      playerPreset: player.id,
      teamPreset: team.id,
      plan: plan.id,
      player: { age: player.age, ovr: player.ovr, potential: player.potential, attributes: copy(player.attributes), progress: { mechanics: 0, heroPool: 0, gameSense: 0, teamwork: 0, mental: 0 } },
      resources: { energy: 100, form: 0, stress: 10, coachTrust: 50, roleStatus: 50 },
      relationships: relationshipSeed(),
      relationNotices: {},
      mentorBoosts: {},
      career: K.initial(player.id),
      careerImpact: null,
      stage: 1,
      stageMetaRoll: noise({ rngState: seed >>> 0 || 1 }, -6, 6),
      matchCursor: 0,
      wins: 0,
      losses: 0,
      matches: [],
      stageRecords: [],
      teams: [],
      standings: [],
      decisions: [],
      eventsSeen: [],
      awards: { mvpRanking: [], roleStarRanking: [], fmvp: null },
      playoff: { qualified: false, status: 'pending', results: [] },
      actionResult: null,
      temporaryEffect: null,
      blockContext: null,
      blockReports: [],
      lastLeagueRank: null,
      event: null,
      pending: { type: 'action' },
      completed: false,
      log: []
    };
    createTeams(state, team);
    state.nemesisTeamId = state.teams[1] ? state.teams[1].id : null;
    state.careerImpact = state.career;
    state.log.push('赛季开始：' + player.name + '，加入' + team.name + '。');
    return state;
  }

  function nodeLabel(state) {
    return C.NODE_LABELS[state.node] || '赛季总结';
  }

  function setPending(state) {
    if (state.node === 2 || state.node === 8 || state.node === 13) {
      state.pending = { type: 'event' };
      state.event = fixedEvent(state, state.node);
      return;
    }
    if (state.node === 18) {
      state.pending = { type: 'report' };
      finalizeRegularSeason(state);
      return;
    }
    if (state.node >= 19 && state.node <= 21) {
      var hasRoundResult = state.playoff.results.some(function (result) { return result.node === state.node; });
      if (state.playoff.qualified && state.playoff.status !== 'eliminated' && !hasRoundResult) state.pending = { type: 'match_plan', kind: 'playoff', stage: 4, block: state.node - 19 };
      else state.pending = { type: 'playoff' };
      return;
    }
    if (state.node >= 22) {
      if (state.career && state.career.handoffApplied) {
        state.pending = { type: 'summary' };
        state.completed = true;
      } else {
        state.pending = { type: 'career_handoff' };
        state.completed = false;
      }
      return;
    }
    if (state.node === 9 || state.node === 14) {
      state.stage = state.node === 9 ? 2 : 3;
      state.stageMetaRoll = noise(state, -6, 6);
    }
    state.pending = { type: 'action' };
  }

  function fixedEvent(state, node) {
    if (node === 2) {
      return { id: 'coach-position', title: '教练定位', body: '教练要为这个赛季确定你的发展方向。', choices: [
        { id: 'aggressive', label: '主动争首发', text: '信任 +8，压力 +8，队内地位 +6。' },
        { id: 'team', label: '先融入体系', text: '团队关系 +10，磨合更稳定。' },
        { id: 'stable', label: '稳步成长', text: '体力 +10，压力 -8。' }
      ] };
    }
    if (node === 8) {
      return { id: 'stage-break', title: 'Stage 1 结算', body: '第一阶段结束，接下来要在恢复和复盘之间做选择。', choices: [
        { id: 'recover', label: '恢复状态', text: '体力 +25，压力 -10。' },
        { id: 'review', label: '深入复盘', text: '意识进度 +5，教练信任 +5，压力 +5。' }
      ] };
    }
    return { id: 'mid-season', title: '赛季中点事件', body: '媒体和队内都开始关注你的赛季走势。', choices: [
      { id: 'all-in', label: '全力冲击', text: '状态 +1，压力 +12。' },
      { id: 'rest', label: '保护状态', text: '体力 +20，压力 -12。' },
      { id: 'meta', label: '研究版本', text: '英雄池进度 +5，教练信任 +4。' }
    ] };
  }

  function randomEvent(state) {
    var events = [
      { id: 'version-shift', title: '版本英雄变化', body: '版本更新让训练方向出现了新的机会。', choices: [{ id: 'study', label: '研究新版本', text: '英雄池进度 +4，体力 -6。' }, { id: 'keep', label: '保持熟悉体系', text: '压力 -5，团队关系 +4。' }] },
      { id: 'streak-pressure', title: '连胜压力', body: '连胜带来了期待，队内训练气氛变得紧绷。', choices: [{ id: 'accept', label: '扛住压力', text: '状态 +1，压力 +10。' }, { id: 'breathe', label: '先调整心态', text: '心态进度 +3，压力 -10。' }] },
      { id: 'mentor', title: '老将指导', body: '队内导师分享了一套赛季管理方法。', choices: [{ id: 'listen', label: '认真听取', text: '意识进度 +4，关系 +6。' }, { id: 'practice', label: '马上实践', text: '团队进度 +3，体力 -5。' }] }
    ];
    return copy(events[int(state, 0, events.length - 1)]);
  }

  function addProgress(state, target, amount) {
    if (!target || !amount) return;
    state.player.progress[target] += amount;
    var points = Math.floor(state.player.progress[target] / 10);
    if (points > 0) {
      state.player.attributes[target] = clamp(state.player.attributes[target] + points, 0, 100);
      state.player.progress[target] -= points * 10;
    }
  }

  function applyAgeLoss(state) {
    var budget = { 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 1, 27: 2, 28: 3, 29: 4 }[state.player.age] || 0;
    for (var i = 0; i < budget; i += 1) {
      var target = next(state) < 0.70 ? 'mechanics' : 'heroPool';
      state.player.attributes[target] = clamp(state.player.attributes[target] - 1, 50, 100);
    }
  }

  function actionBlock(actionNode) {
    if (actionNode >= 4 && actionNode <= 7) return { stage: 1, block: actionNode - 4 };
    if (actionNode >= 9 && actionNode <= 12) return { stage: 2, block: actionNode - 9 };
    if (actionNode >= 14 && actionNode <= 17) return { stage: 3, block: actionNode - 14 };
    return null;
  }

  function isKeyBlock(block) {
    return block && block.block === 3;
  }

  function scheduleNextNode(state) {
    if ([2, 8, 13, 18].indexOf(state.node) < 0 && next(state) < 0.16) {
      state.event = randomEvent(state);
      state.pending = { type: 'event', random: true };
    } else {
      setPending(state);
    }
  }

  function applyAction(state, actionId) {
    if (state.pending.type !== 'action') throw new Error('当前节点不接受训练行动');
    var action = C.ACTIONS.find(function (item) { return item.id === actionId; });
    if (!action) throw new Error('未知行动：' + actionId);

    var actionNode = state.node;
    var energyBefore = state.resources.energy;
    var stressBefore = state.resources.stress;
    var formBefore = state.resources.form;
    var relationshipBefore = copy(state.relationships);
    var attributesBefore = copy(state.player.attributes);
    var result = { action: action.id, name: action.name, failed: false, progress: 0, target: action.target };
    if (action.id === 'rest') {
      state.resources.energy = clamp(state.resources.energy + action.energy, 0, 100);
      state.resources.stress = clamp(state.resources.stress + action.stress, 0, 100);
      if (next(state) < 0.35) state.resources.form = clamp(state.resources.form + 1, -2, 2);
    } else {
      var risk = failRate(state);
      var failed = next(state) < risk;
      var support = Object.keys(state.relationships).filter(function (key) { return state.relationships[key] >= 75; }).length >= 2 ? 1.35 : (Object.keys(state.relationships).some(function (key) { return state.relationships[key] >= 75; }) ? 1.25 : 1);
      var factor = Math.min(1.8, ageFactor(state.player.age, action.target) * potentialFactor(state) * stateFactor(state) * diminishing(state.player.attributes[action.target]) * support);
      if ((action.id === 'gameSense' || action.id === 'mental') && state.relationships.mentor >= 75 && !state.mentorBoosts[state.stage]) {
        factor = Math.min(1.8, factor * 1.25);
        state.mentorBoosts[state.stage] = true;
        result.mentorBoost = true;
      }
      var amount = Math.max(1, Math.round(action.base * factor));
      if (failed) {
        amount = Math.max(1, Math.round(amount * 0.25));
        state.resources.form = clamp(state.resources.form - 1, -2, 2);
        state.resources.stress = clamp(state.resources.stress + 8, 0, 100);
      }
      addProgress(state, action.target, amount);
      state.resources.energy = clamp(state.resources.energy + action.energy, 0, 100);
      state.resources.stress = clamp(state.resources.stress + action.stress, 0, 100);
      if (action.id === 'teamwork') state.relationships.partner = clamp(state.relationships.partner + 8, 0, 100);
      if (action.id === 'heroPool') state.resources.coachTrust = clamp(state.resources.coachTrust + 2, 0, 100);
      if (action.id === 'mental' && next(state) < 0.20) state.resources.form = clamp(state.resources.form + 1, -2, 2);
      result.failed = failed;
      result.progress = amount;
      result.risk = round(risk * 100, 1);
    }
    result.temporaryEffect = I.actionEffect(action.id, result.failed);
    result.block = actionBlock(actionNode);
    result.resourceChanges = { energy: round(state.resources.energy - energyBefore, 1), stress: round(state.resources.stress - stressBefore, 1), form: round(state.resources.form - formBefore, 1) };
    result.relationshipChanges = Object.keys(state.relationships).filter(function (key) { return state.relationships[key] !== relationshipBefore[key]; }).map(function (key) { return { key: key, delta: state.relationships[key] - relationshipBefore[key] }; });
    result.attributeChanges = Object.keys(state.player.attributes).filter(function (key) { return state.player.attributes[key] !== attributesBefore[key]; }).map(function (key) { return { key: key, delta: state.player.attributes[key] - attributesBefore[key] }; });
    state.player.ovr = playerOvr(state.player.attributes);
    state.decisions.push(result);
    state.log.push(action.name + (result.failed ? '训练失误，收益降低。' : '完成。'));
    state.node = actionNode + 1;
    state.actionResult = result;
    state.pending = { type: 'action_result', actionId: result.action, block: result.block };
    return result;
  }

  function baselineTeamPower(state) {
    var team = C.TEAM_PRESETS[state.teamPreset];
    var rosterPower = (team.teamBase * 4 + 70) / 5;
    var metaFit = clamp(70 + state.stageMetaRoll, 60, 95);
    var decisionValue = 50 + 50 * 0.25 + 70 * 0.25;
    return rosterPower * 0.50 + metaFit * 0.20 + team.coachPower * 0.15 + team.synergy * 0.10 + decisionValue * 0.05;
  }

  function buildImpactLedger(state, opponent, appeared, effect, plan) {
    var attributes = state.player.attributes;
    var role = I.roleProfile(state.resources.roleStatus);
    var relation = I.relationEffects(state, state.blockContext && state.blockContext.actionId);
    var nemesisActive = state.relationships.nemesis >= 60 && opponent.id === state.nemesisTeamId;
    var effectMultiplier = plan.effectMultiplier || 1;
    var baseProbability = logistic(baselineTeamPower(state) - opponentPower(opponent)) * 100;
    var playerAbilityRawPP = appeared ? clamp((playerMatchPower(state) - 70) * 0.22, -6, 6) : 0;
    var actionRawPP = appeared ? effect.personalWinPP * effectMultiplier : 0;
    var personalCap = Math.min(8, role.personalCap);
    var metaPP = clamp((attributes.heroPool - 70) * 0.10 + effect.metaPP * effectMultiplier, -8, 8);
    var synergyPP = clamp((attributes.teamwork - 70) * 0.10 + relation.synergyPP + effect.synergyPP * effectMultiplier, -8, 8);
    var planDecisionPP = (plan.winPP || 0) * (state.resources.coachTrust >= 80 && plan.id === 'focus' ? 1.2 : 1);
    var decisionPP = clamp((attributes.gameSense - 70) * 0.10 + (state.resources.coachTrust - 50) * 0.04 + relation.decisionPP + effect.decisionPP * effectMultiplier + planDecisionPP, -8, 8);
    var baseStateRawPP = appeared ? state.resources.form - Math.max(0, state.resources.stress - 30) * 0.03 : 0;
    var stateRawPP = appeared ? clamp(baseStateRawPP + effect.statePP * effectMultiplier, -8, 8) : 0;
    var personalRawTotal = playerAbilityRawPP + stateRawPP + actionRawPP;
    var personalTotal = clamp(personalRawTotal, -personalCap, personalCap);
    var personalScale = personalRawTotal ? personalTotal / personalRawTotal : 1;
    var playerAbilityPP = round(playerAbilityRawPP * personalScale, 2);
    var statePP = round(stateRawPP * personalScale, 2);
    var actionPP = round(personalTotal - playerAbilityPP - statePP, 2);
    if (!actionRawPP && actionPP < 0) {
      statePP = round(personalTotal - playerAbilityPP, 2);
      actionPP = 0;
    }
    var variancePP = noise(state, -4, 4) * (plan.ratingNoiseMultiplier || 1);
    var displayBase = round(baseProbability, 2);
    var displayPlayer = round(playerAbilityPP, 2);
    var displayMeta = round(metaPP, 2);
    var displaySynergy = round(synergyPP, 2);
    var displayDecision = round(decisionPP, 2);
    var displayAction = round(actionPP, 2);
    var displayState = round(statePP, 2);
    var displayVariance = round(variancePP, 2);
    var finalSum = round(displayBase + displayPlayer + displayMeta + displaySynergy + displayDecision + displayAction + displayState + displayVariance, 2);
    var finalProbability = clamp(finalSum, 15, 85);
    var probabilityBoundPP = round(finalProbability - finalSum, 2);
    var counterfactualRawTotal = playerAbilityRawPP + baseStateRawPP;
    var counterfactualTotal = clamp(counterfactualRawTotal, -personalCap, personalCap);
    var counterfactualScale = counterfactualRawTotal ? counterfactualTotal / counterfactualRawTotal : 1;
    var counterfactualPlayer = round(playerAbilityRawPP * counterfactualScale, 2);
    var counterfactualState = round(counterfactualTotal - counterfactualPlayer, 2);
    var counterfactualProbability = clamp(round(displayBase + counterfactualPlayer + round((attributes.heroPool - 70) * 0.10, 2) + round((attributes.teamwork - 70) * 0.10 + relation.synergyPP - effect.synergyPP * effectMultiplier, 2) + round((attributes.gameSense - 70) * 0.10 + (state.resources.coachTrust - 50) * 0.04 + relation.decisionPP + planDecisionPP - effect.decisionPP * effectMultiplier, 2) + counterfactualState + displayVariance, 2), 15, 85);
    return {
      baseProbability: displayBase,
      playerAbilityPP: displayPlayer,
      metaPP: displayMeta,
      synergyPP: displaySynergy,
      decisionPP: displayDecision,
      actionPP: displayAction,
      statePP: displayState,
      variancePP: displayVariance,
      probabilityBoundPP: probabilityBoundPP,
      effectMultiplier: effectMultiplier,
      finalProbability: finalProbability,
      counterfactualProbability: counterfactualProbability,
      trainingImpactPP: round(finalProbability - counterfactualProbability, 2),
      personalContributionPP: round(displayPlayer + displayState + displayAction, 2),
      appeared: appeared,
      reasons: [
        '基础队伍强度',
        appeared ? '你的出场贡献' : '本场未出场，个人贡献为 0',
        effect.label,
        plan.name,
        nemesisActive ? '宿敌对位阈值' : (relation.thresholds.length ? relation.thresholds[0] : '关系暂无额外加成')
      ],
      thresholdReasons: relation.thresholds.concat(nemesisActive ? ['宿敌对位阈值'] : []),
      nemesisActive: nemesisActive
    };
  }

  function blockReport(state, stage, block, matches, key, plan) {
    var appearances = matches.filter(function (match) { return match.appeared; }).length;
    var wins = matches.filter(function (match) { return match.won; }).length;
    var playerMatches = matches.filter(function (match) { return match.appeared; });
    var averageRating = playerMatches.reduce(function (sum, match) { return sum + match.rating; }, 0) / Math.max(1, playerMatches.length);
    var averageProbability = matches.reduce(function (sum, match) { return sum + match.probability; }, 0) / Math.max(1, matches.length);
    var impact = matches.reduce(function (sum, match) {
      var ledger = match.impactLedger || {};
      ['playerAbilityPP', 'metaPP', 'synergyPP', 'decisionPP', 'actionPP', 'statePP', 'trainingImpactPP'].forEach(function (key) { sum[key] += ledger[key] || 0; });
      return sum;
    }, { playerAbilityPP: 0, metaPP: 0, synergyPP: 0, decisionPP: 0, actionPP: 0, statePP: 0, trainingImpactPP: 0 });
    Object.keys(impact).forEach(function (key) { impact[key] = round(impact[key] / Math.max(1, matches.length), 2); });
    var leagueRank = estimateLeagueRank(state);
    var previousRank = state.lastLeagueRank;
    state.lastLeagueRank = leagueRank;
    return {
      stage: stage,
      block: block + 1,
      key: !!key,
      games: matches.length,
      wins: wins,
      losses: matches.length - wins,
      appearances: appearances,
      ratingCount: playerMatches.length,
      averageRating: round(averageRating, 2),
      score: round(averageRating * 10, 1),
      averageProbability: round(averageProbability * 100, 1),
      playerContributionPP: round(impact.playerAbilityPP + impact.statePP + impact.actionPP, 2),
      trainingImpactPP: impact.trainingImpactPP,
      metaPP: impact.metaPP,
      synergyPP: impact.synergyPP,
      decisionPP: impact.decisionPP,
      actionPP: impact.actionPP,
      statePP: impact.statePP,
      leagueRank: leagueRank,
      leagueRankChange: previousRank == null ? 0 : previousRank - leagueRank,
      plan: plan.name,
      roleBefore: state.resources.roleStatus,
      roleAfter: state.resources.roleStatus,
      coachFeedback: wins > matches.length - wins ? '教练认为你的执行开始兑现训练方向。' : '教练要求下一节点提高稳定性，再决定是否扩大你的职责。',
      supportFeedback: '主要搭档和竞争关系会在确认后更新。',
      teamFeedback: wins > matches.length - wins ? '队伍认可本区块的执行，确认后会更新你的队内地位。' : '队伍对本区块仍有疑问，确认后会反映到你的队内地位。',
      matches: copy(matches)
    };
  }

  function estimateLeagueRank(state) {
    var played = state.wins + state.losses;
    var playerProjected = played ? state.wins / played * 56 : 28;
    var projections = state.teams.filter(function (team) { return !team.isPlayer; }).map(function (team) {
      return 56 * logistic(opponentPower(team) - 82);
    });
    return 1 + projections.filter(function (wins) { return wins > playerProjected; }).length;
  }

  function beginBlock(state, block, planId) {
    var plan = I.matchPlan(planId || 'focus');
    var effect = state.actionResult ? state.actionResult.temporaryEffect : I.actionEffect('rest', false);
    state.temporaryEffect = copy(effect);
    state.blockContext = {
      kind: 'regular', stage: block.stage, block: block.block, games: C.STAGE_BLOCKS[block.stage][block.block],
      actionId: state.actionResult && state.actionResult.action, trainingResult: copy(state.actionResult), temporaryEffect: copy(effect),
      matchPlan: plan, beforeSnapshot: { wins: state.wins, losses: state.losses, attributes: copy(state.player.attributes), energy: state.resources.energy, form: state.resources.form, stress: state.resources.stress, coachTrust: state.resources.coachTrust, roleStatus: state.resources.roleStatus, relationships: copy(state.relationships), teamBasePower: baselineTeamPower(state) },
      impactLedger: [], matches: [], report: null, acknowledged: false, key: isKeyBlock(block)
    };
    simulateBlock(state, block.stage, block.block);
    state.blockContext.report.actionId = state.blockContext.actionId || 'rest';
    state.blockContext.report.projectedRoleChange = roleDeltaForReport(state, state.blockContext.report, state.blockContext);
    state.blockContext.report.projectedRoleAfter = clamp(state.resources.roleStatus + state.blockContext.report.projectedRoleChange, 0, 100);
    state.blockContext.report.projectedRelationTriggers = I.relationEffects(state, state.blockContext.actionId).thresholds;
    state.pending = { type: 'block_report', stage: block.stage, block: block.block, key: isKeyBlock(block) };
  }

  function simulateBlock(state, stage, block) {
    var count = C.STAGE_BLOCKS[stage][block];
    var stageRecord = state.stageRecords.find(function (item) { return item.stage === stage; });
    if (!stageRecord) {
      stageRecord = { stage: stage, games: 0, wins: 0, losses: 0 };
      state.stageRecords.push(stageRecord);
    }
    var context = state.blockContext;
    var effect = context && context.temporaryEffect ? context.temporaryEffect : I.actionEffect('rest', false);
    var plan = context && context.matchPlan ? context.matchPlan : I.matchPlan('focus');
    var matches = [];
    for (var i = 0; i < count; i += 1) {
      var opponents = state.teams.filter(function (team) { return !team.isPlayer; });
      var opponent = opponents[state.matchCursor % opponents.length];
      state.matchCursor += 1;
      var role = I.roleProfile(state.resources.roleStatus);
      var appearanceChance = clamp(role.appearance + (effect.roleChanceDelta || 0) * 0.01 + (plan.roleDelta || 0) * 0.01, 0.25, 1);
      var appeared = next(state) < appearanceChance;
      var ledger = buildImpactLedger(state, opponent, appeared, effect, plan);
      var won = next(state) < ledger.finalProbability / 100;
      var ratingNoise = noise(state, -0.40, 0.40) * (plan.ratingNoiseMultiplier || 1) * (effect.ratingNoiseMultiplier || 1);
      var rating = appeared ? clamp(6.5 + (playerMatchPower(state) - opponent.rolePower) * 0.05 + (won ? 0.35 : -0.15) + ratingNoise + effect.ratingDelta * (plan.effectMultiplier || 1) + (ledger.nemesisActive ? 0.20 : 0), 5, 10) : clamp(5.9 + noise(state, -0.25, 0.25), 5, 8);
      var match = { stage: stage, block: block + 1, opponent: opponent.name, appeared: appeared, appearanceChance: round(appearanceChance, 2), won: won, probability: round(ledger.finalProbability / 100, 3), rating: round(rating, 2), impactLedger: ledger };
      state.matches.push(match);
      matches.push(match);
      if (context) context.impactLedger.push(ledger);
      if (context && ledger.nemesisActive) context.nemesisEncounter = true;
      stageRecord.games += 1;
      if (won) { state.wins += 1; stageRecord.wins += 1; } else { state.losses += 1; stageRecord.losses += 1; }
    }
    if (context) {
      context.matches = copy(matches);
      context.report = blockReport(state, stage, block, matches, context.key, plan);
    }
    if (context && context.nemesisEncounter) state.resources.stress = clamp(state.resources.stress + 8, 0, 100);
    state.resources.energy = clamp(state.resources.energy + 6, 0, 100);
    state.resources.stress = clamp(state.resources.stress + (state.wins > state.losses ? 1 : 3), 0, 100);
  }

  function continueActionResult(state) {
    if (state.pending.type !== 'action_result' || !state.actionResult) throw new Error('当前没有训练结果');
    var result = state.actionResult;
    if (result.block) {
      if (isKeyBlock(result.block)) state.pending = { type: 'match_plan', kind: 'regular', stage: result.block.stage, block: result.block.block };
      else beginBlock(state, result.block, 'focus');
    } else {
      state.actionResult = null;
      scheduleNextNode(state);
    }
    return result;
  }

  function chooseMatchPlan(state, planId) {
    if (state.pending.type !== 'match_plan') throw new Error('当前没有可选择的比赛方案');
    var available = I.availablePlans(state.resources.coachTrust);
    var selected = available.find(function (plan) { return plan.id === planId || (planId === 'balanced' && plan.id === 'focus'); });
    if (!selected) throw new Error('当前教练信任度暂不能使用这个比赛方案');
    if (state.pending.kind === 'playoff') simulatePlayoffRound(state, selected.id);
    else beginBlock(state, { stage: state.pending.stage, block: state.pending.block }, selected.id);
    return selected;
  }

  function applyBlockFeedback(state) {
    var context = state.blockContext;
    var report = context.report;
    var profile = I.roleProfile(state.resources.roleStatus);
    var roleBefore = state.resources.roleStatus;
    var delta = roleDeltaForReport(state, report, context);
    state.resources.roleStatus = clamp(state.resources.roleStatus + delta, 0, 100);
    state.resources.coachTrust = clamp(state.resources.coachTrust + (report.wins >= report.losses ? 2 : -1) + (state.relationships.coach >= 60 ? 1 : 0), 0, 100);
    report.roleBefore = roleBefore;
    report.roleAfter = state.resources.roleStatus;
    report.roleChange = state.resources.roleStatus - roleBefore;
    var relationEffects = I.relationEffects(state, context.actionId);
    report.relationTriggers = relationEffects.thresholds.filter(function (label) {
      if (state.relationNotices[label]) return false;
      state.relationNotices[label] = true;
      return true;
    });
    report.teamFeedback = report.wins > report.losses ? '队伍认可本区块的执行，下一节点会更愿意让你承担责任。' : '队伍会保留疑问，下一节点需要用更稳定的表现换回信任。';
    report.coachFeedback = state.resources.coachTrust >= 60 ? '教练信任已达到可承担更大职责的区间。' : '教练会继续观察你的稳定性和比赛阅读。';
    report.supportFeedback = report.relationTriggers.length ? '支援关系产生了实际效果：' + report.relationTriggers.join('、') + '。' : '本区块没有新的关系阈值触发。';
    report.roleLabelBefore = profile.label;
    report.roleLabelAfter = I.roleProfile(state.resources.roleStatus).label;
    state.blockReports.push(copy(report));
    state.log.push('Stage ' + context.stage + ' 区块完成：' + report.wins + ' 胜 ' + report.losses + ' 负，队内地位 ' + roleBefore + ' → ' + state.resources.roleStatus + '。');
    context.report = report;
    context.acknowledged = true;
    state.temporaryEffect = null;
    state.actionResult = null;
  }

  function roleDeltaForReport(state, report, context) {
    if (!report.appearances) return 0;
    var expectedRating = 6.6 + (state.resources.roleStatus - 50) * 0.005;
    var performanceGap = report.averageRating - expectedRating;
    var delta = performanceGap >= 0.50 ? 3 : (performanceGap >= 0.20 ? 1 : (performanceGap <= -0.50 ? -3 : (performanceGap <= -0.20 ? -1 : 0)));
    if (report.wins > report.losses) delta += 1;
    if (context.matchPlan.id === 'highRisk' && report.wins < report.losses) delta -= 1;
    if (state.relationships.rival >= 60 && report.averageRating >= 8) delta += 1;
    return clamp(delta, -5, 5);
  }

  function acknowledgeBlockReport(state) {
    if (state.pending.type !== 'block_report' || !state.blockContext || !state.blockContext.report) throw new Error('当前没有比赛区块结算');
    var context = state.blockContext;
    if (context.acknowledged) return state;
    if (context.kind === 'playoff') {
      var result = context.playoffResult;
      state.playoff.results.push(result);
      if (!result.won) state.playoff.status = 'eliminated';
      if (result.won && state.node === 21) {
        state.playoff.status = 'champion';
        state.awards.fmvp = context.matches[0].rating >= 7.6 ? { name: '你', team: '你的队伍' } : { name: result.opponent + '代表', team: result.opponent };
      }
      context.report.teamFeedback = result.won ? '季后赛执行成功，队伍继续相信你的临场价值。' : '季后赛止步，队伍会把问题带入下一赛季评估。';
      context.acknowledged = true;
      state.node += 1;
      setPending(state);
      return state;
    }
    applyBlockFeedback(state);
    scheduleNextNode(state);
    return state;
  }

  function resolveEvent(state, choiceId) {
    if (state.pending.type !== 'event' || !state.event) throw new Error('当前没有待处理事件');
    var event = state.event;
    var choice = event.choices.find(function (item) { return item.id === choiceId; }) || event.choices[0];
    if (event.id === 'coach-position') {
      if (choice.id === 'aggressive') { state.resources.coachTrust = clamp(state.resources.coachTrust + 8, 0, 100); state.resources.stress = clamp(state.resources.stress + 8, 0, 100); state.resources.roleStatus = clamp(state.resources.roleStatus + 6, 0, 100); }
      if (choice.id === 'team') { state.relationships.partner = clamp(state.relationships.partner + 10, 0, 100); state.resources.roleStatus = clamp(state.resources.roleStatus + 3, 0, 100); }
      if (choice.id === 'stable') { state.resources.energy = clamp(state.resources.energy + 10, 0, 100); state.resources.stress = clamp(state.resources.stress - 8, 0, 100); }
    } else if (event.id === 'stage-break') {
      if (choice.id === 'recover') { state.resources.energy = clamp(state.resources.energy + 25, 0, 100); state.resources.stress = clamp(state.resources.stress - 10, 0, 100); }
      if (choice.id === 'review') { addProgress(state, 'gameSense', 5); state.resources.coachTrust = clamp(state.resources.coachTrust + 5, 0, 100); state.resources.stress = clamp(state.resources.stress + 5, 0, 100); }
    } else if (event.id === 'mid-season') {
      if (choice.id === 'all-in') { state.resources.form = clamp(state.resources.form + 1, -2, 2); state.resources.stress = clamp(state.resources.stress + 12, 0, 100); }
      if (choice.id === 'rest') { state.resources.energy = clamp(state.resources.energy + 20, 0, 100); state.resources.stress = clamp(state.resources.stress - 12, 0, 100); }
      if (choice.id === 'meta') { addProgress(state, 'heroPool', 5); state.resources.coachTrust = clamp(state.resources.coachTrust + 4, 0, 100); }
    } else if (event.id === 'version-shift') {
      if (choice.id === 'study') { addProgress(state, 'heroPool', 4); state.resources.energy = clamp(state.resources.energy - 6, 0, 100); }
      else { state.resources.stress = clamp(state.resources.stress - 5, 0, 100); state.relationships.partner = clamp(state.relationships.partner + 4, 0, 100); }
    } else if (event.id === 'streak-pressure') {
      if (choice.id === 'accept') { state.resources.form = clamp(state.resources.form + 1, -2, 2); state.resources.stress = clamp(state.resources.stress + 10, 0, 100); }
      else { addProgress(state, 'mental', 3); state.resources.stress = clamp(state.resources.stress - 10, 0, 100); }
    } else if (event.id === 'mentor') {
      if (choice.id === 'listen') { addProgress(state, 'gameSense', 4); state.relationships.mentor = clamp(state.relationships.mentor + 6, 0, 100); }
      else { addProgress(state, 'teamwork', 3); state.resources.energy = clamp(state.resources.energy - 5, 0, 100); }
    }
    state.eventsSeen.push(event.id);
    state.log.push(event.title + '：' + choice.label + '。');
    state.event = null;
    if (event.id === 'coach-position' || event.id === 'stage-break' || event.id === 'mid-season') state.node += 1;
    setPending(state);
    return choice;
  }

  function candidateFor(state, team, row) {
    var isPlayer = team.isPlayer;
    var rating = isPlayer ? state.matches.reduce(function (sum, item) { return sum + item.rating; }, 0) / Math.max(1, state.matches.length) : clamp(6.8 + (team.power - 80) * 0.05 + noise(state, -0.45, 0.45), 5, 9.6);
    var role = isPlayer ? clamp(playerMatchPower(state) / 10, 0, 10) : clamp((team.rolePower || 75) / 10 + noise(state, -0.3, 0.3), 0, 10);
    var key = clamp(rating + noise(state, -0.25, 0.25), 0, 10);
    var impression = clamp(5 + (row.wins - 28) * 0.06 + noise(state, -0.6, 0.6), 0, 10);
    var score = rating * 0.55 + (row.wins / 56 * 10) * 0.15 + key * 0.15 + role * 0.10 + impression * 0.05;
    return { id: team.id, name: isPlayer ? '你' : team.name + '代表', team: team.name, averageRating: round(rating, 2), roleValue: round(role, 2), score: round(score, 2), wins: row.wins };
  }

  function finalizeRegularSeason(state) {
    if (state.standings.length) return;
    applyAgeLoss(state);
    state.player.ovr = playerOvr(state.player.attributes);
    state.teams.forEach(function (team) { team.power = teamPower(state, team); });
    var rows = state.teams.map(function (team) {
      var wins = team.isPlayer ? state.wins : clamp(Math.round(56 * logistic(team.power - 82) + noise(state, -4, 4)), 0, 56);
      return { teamId: team.id, team: team.name, tier: team.tier, wins: wins, losses: 56 - wins, lp: wins, isPlayer: team.isPlayer };
    });
    rows.sort(function (a, b) { return b.wins - a.wins || b.lp - a.lp || a.team.localeCompare(b.team); });
    state.standings = rows.map(function (row, index) { row.rank = index + 1; return row; });
    var playerRow = state.standings.find(function (row) { return row.isPlayer; });
    state.playoff.qualified = playerRow.rank <= 8;
    var candidates = state.teams.map(function (team) {
      var row = state.standings.find(function (item) { return item.teamId === team.id; });
      return candidateFor(state, team, row);
    });
    state.awards.mvpRanking = candidates.slice().sort(function (a, b) { return b.score - a.score; });
    state.awards.roleStarRanking = candidates.slice().sort(function (a, b) { return b.roleValue - a.roleValue || b.score - a.score; });
    state.awards.mvp = state.awards.mvpRanking[0];
    state.awards.roleStar = state.awards.roleStarRanking[0];
    state.log.push('常规赛结束：' + state.wins + ' 胜 ' + state.losses + ' 负，联盟第 ' + playerRow.rank + '。');
  }

  function continueReport(state) {
    if (state.pending.type !== 'report') throw new Error('当前没有常规赛结算');
    state.node = 19;
    setPending(state);
  }

  function simulatePlayoffRound(state, planId) {
    var roundNames = { 19: '八强', 20: '四强', 21: '决赛' };
    var playerRow = state.standings.find(function (row) { return row.isPlayer; });
    var opponentRow = state.standings.find(function (row) { return !row.isPlayer && row.rank !== playerRow.rank && row.rank <= 8; });
    var opponent = state.teams.find(function (team) { return team.id === opponentRow.teamId; });
    var plan = I.matchPlan(planId || 'focus');
    state.blockContext = {
      kind: 'playoff', stage: 4, block: state.node - 19, games: 1, actionId: 'playoff', trainingResult: null,
      temporaryEffect: I.actionEffect('rest', false), matchPlan: plan, beforeSnapshot: { round: roundNames[state.node], attributes: copy(state.player.attributes), energy: state.resources.energy, form: state.resources.form, stress: state.resources.stress, coachTrust: state.resources.coachTrust, roleStatus: state.resources.roleStatus, relationships: copy(state.relationships), teamBasePower: baselineTeamPower(state) },
      impactLedger: [], matches: [], report: null, acknowledged: false, key: true
    };
    var ledger = buildImpactLedger(state, opponent, true, state.blockContext.temporaryEffect, plan);
    var won = next(state) < ledger.finalProbability / 100;
    var rating = clamp(6.8 + (playerMatchPower(state) - opponent.rolePower) * 0.05 + (won ? 0.45 : -0.25) + noise(state, -0.3, 0.3) + (plan.id === 'highRisk' ? 0.15 : 0) + state.blockContext.temporaryEffect.ratingDelta * (plan.effectMultiplier || 1), 5, 10);
    var match = { stage: 4, block: state.node - 18, opponent: opponent.name, appeared: true, appearanceChance: 1, won: won, probability: round(ledger.finalProbability / 100, 3), rating: round(rating, 2), impactLedger: ledger };
    state.blockContext.impactLedger.push(ledger);
    state.blockContext.matches = [match];
    state.blockContext.report = blockReport(state, 4, state.node - 19, [match], true, plan);
    state.blockContext.playoffResult = { node: state.node, round: roundNames[state.node], status: won ? '晋级' : '出局', won: won, opponent: opponent.name, probability: match.probability, rating: match.rating };
    state.pending = { type: 'block_report', kind: 'playoff', stage: 4, block: state.node - 19, key: true };
  }

  function resolvePlayoff(state) {
    if (state.pending.type !== 'playoff') throw new Error('当前没有季后赛节点');
    var roundNames = { 19: '八强', 20: '四强', 21: '决赛' };
    if (!state.playoff.qualified) {
      state.playoff.results.push({ round: roundNames[state.node], status: '未晋级' });
      state.playoff.status = 'missed';
    } else if (state.playoff.status === 'eliminated') {
      state.playoff.results.push({ round: roundNames[state.node], status: '已出局' });
    } else {
      var playerRow = state.standings.find(function (row) { return row.isPlayer; });
      var opponentRow = state.standings.find(function (row) { return !row.isPlayer && row.rank !== playerRow.rank && row.rank <= 8; });
      var opponent = state.teams.find(function (team) { return team.id === opponentRow.teamId; });
      var probability = logistic(playerTeamPower(state) - opponentPower(opponent) + noise(state, -4, 4));
      var won = next(state) < probability;
      state.playoff.results.push({ node: state.node, round: roundNames[state.node], status: won ? '晋级' : '出局', opponent: opponent.name, probability: round(probability, 3) });
      if (!won) state.playoff.status = 'eliminated';
      if (won && state.node === 21) {
        state.playoff.status = 'champion';
        state.awards.fmvp = state.matches.length && state.matches[state.matches.length - 1].rating >= 7.6 ? { name: '你', team: '你的队伍' } : { name: opponent.name + '代表', team: opponent.name };
      }
    }
    state.node += 1;
    setPending(state);
  }

  function acknowledgeCareerHandoff(state) {
    if (state.pending.type === 'summary') return state;
    if (state.pending.type !== 'career_handoff') throw new Error('当前没有生涯交接结算');
    K.apply(state);
    state.log.push('生涯交接：本赛季评级 ' + state.career.seasonGrade + '，生涯声望 ' + state.career.reputation + '。');
    state.pending = { type: 'summary' };
    state.completed = true;
    return state;
  }

  function completeSummary(state) {
    if (state.pending.type === 'summary') return state;
    state.node = 22;
    setPending(state);
    return state;
  }

  function seasonReport(state) {
    var row = state.standings.find(function (item) { return item.isPlayer; });
    return {
      year: state.year,
      playerOvr: state.player.ovr,
      playerAge: state.player.age,
      wins: state.wins,
      losses: state.losses,
      rank: row ? row.rank : null,
      qualified: state.playoff.qualified,
      playoff: state.playoff,
      mvp: state.awards.mvp,
      roleStar: state.awards.roleStar,
      fmvp: state.awards.fmvp,
      career: copy(state.career),
      careerImpact: copy(state.careerImpact || state.career),
      blockReports: copy(state.blockReports),
      attributes: copy(state.player.attributes),
      decisions: state.decisions.length
    };
  }

  function startNextSeason(state, tier) {
    var nextAge = state.player.age + 1;
    var nextTeamPreset = tier || state.teamPreset;
    var changedTeam = nextTeamPreset !== state.teamPreset;
    var nextState = makeState({ seed: state.seed + nextAge * 997, playerPreset: nextAge <= 20 ? 'rookie' : (nextAge <= 25 ? 'star' : 'veteran'), teamPreset: nextTeamPreset, plan: state.plan, year: state.year + 1, mode: state.mode });
    nextState.player.age = nextAge;
    nextState.player.attributes = copy(state.player.attributes);
    nextState.player.potential = state.player.potential;
    nextState.player.ovr = playerOvr(nextState.player.attributes);
    nextState.career = K.nextSeason(state.career);
    nextState.career.reputation = state.career.reputation;
    nextState.career.history = copy(state.career.history || []);
    nextState.careerImpact = nextState.career;
    nextState.resources.coachTrust = changedTeam ? 50 : clamp(Math.round(state.resources.coachTrust * 0.60), 0, 100);
    nextState.resources.roleStatus = changedTeam ? 50 : clamp(Math.round(state.resources.roleStatus * 0.75 + 12.5), 0, 100);
    Object.keys(nextState.relationships).forEach(function (key) {
      if (!changedTeam || key === 'mentor' || key === 'nemesis') nextState.relationships[key] = clamp(Math.round(state.relationships[key] * 0.50), 0, 100);
    });
    return nextState;
  }

  root.OWL_ALPHA_ENGINE = {
    clamp: clamp,
    copy: copy,
    ageBand: ageBand,
    playerOvr: playerOvr,
    playerMatchPower: playerMatchPower,
    failRate: failRate,
    logistic: logistic,
    nodeLabel: nodeLabel,
    makeState: makeState,
    setPending: setPending,
    applyAction: applyAction,
    continueActionResult: continueActionResult,
    chooseMatchPlan: chooseMatchPlan,
    acknowledgeBlockReport: acknowledgeBlockReport,
    resolveEvent: resolveEvent,
    continueReport: continueReport,
    resolvePlayoff: resolvePlayoff,
    acknowledgeCareerHandoff: acknowledgeCareerHandoff,
    completeSummary: completeSummary,
    seasonReport: seasonReport,
    startNextSeason: startNextSeason,
    getNodeCount: function () { return 22; },
    getAction: function (id) { return C.ACTIONS.find(function (item) { return item.id === id; }); },
    getActions: function () { return C.ACTIONS.slice(); },
    getConstants: function () { return C; }
  };
})(typeof globalThis === 'undefined' ? this : globalThis);
