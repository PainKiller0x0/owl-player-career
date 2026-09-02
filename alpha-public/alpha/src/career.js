(function (root) {
  'use strict';

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

  function initial(preset) {
    var reputations = { rookie: 20, star: 70, veteran: 65 };
    return {
      reputation: reputations[preset] == null ? 20 : reputations[preset],
      seasonGrade: null,
      seasonScore: 0,
      careerTags: [],
      nextSeasonRole: '继续争取队内位置',
      currentTeamOutlook: '等待本赛季结果',
      marketOutlook: '尚未形成市场报价',
      teamMemory: [],
      reasons: [],
      history: [],
      handoffApplied: false
    };
  }

  function grade(score) {
    if (score >= 88) return 'S';
    if (score >= 78) return 'A';
    if (score >= 65) return 'B';
    if (score >= 50) return 'C';
    return 'D';
  }

  function averageRating(state) {
    var matches = (state.matches || []).filter(function (match) { return match.appeared !== false; });
    if (!matches.length) return 5;
    return matches.reduce(function (sum, match) { return sum + match.rating; }, 0) / matches.length;
  }

  function actionStats(state) {
    var stats = {};
    (state.decisions || []).forEach(function (decision) {
      if (!decision.action) return;
      stats[decision.action] = (stats[decision.action] || 0) + 1;
    });
    return stats;
  }

  function average(values, fallback) {
    return values.length ? values.reduce(function (sum, value) { return sum + value; }, 0) / values.length : fallback;
  }

  function routeTags(state, regularAverage) {
    var stats = actionStats(state);
    var reports = state.blockReports || [];
    var tags = [];
    var mechanicsReports = reports.filter(function (report) { return report.actionId === 'mechanics'; });
    var heroReports = reports.filter(function (report) { return report.actionId === 'heroPool'; });
    var senseReports = reports.filter(function (report) { return report.actionId === 'gameSense'; });
    var teamReports = reports.filter(function (report) { return report.actionId === 'teamwork'; });
    var keyReports = reports.filter(function (report) { return report.key; });
    var playoffRatings = (state.playoff.results || []).map(function (result) { return result.rating; }).filter(function (rating) { return typeof rating === 'number'; });
    var bigStageRatings = keyReports.map(function (report) { return report.averageRating; }).concat(playoffRatings);

    if ((stats.mechanics || 0) >= 2 && average(mechanicsReports.map(function (report) { return report.averageRating; }), 0) >= regularAverage + 0.15) tags.push('机械核心');
    if ((stats.heroPool || 0) >= 2 && average(heroReports.map(function (report) { return report.metaPP || 0; }), 0) > 0) tags.push('版本专家');
    if ((stats.gameSense || 0) >= 2 && keyReports.length && average(senseReports.map(function (report) { return report.averageRating; }), 0) >= regularAverage - 0.05) tags.push('战术大脑');
    if ((stats.teamwork || 0) >= 2 && teamReports.some(function (report) { return (report.synergyPP || 0) > 0 || (report.relationTriggers || []).some(function (item) { return item.indexOf('搭档') >= 0; }); })) tags.push('体系枢纽');
    if (bigStageRatings.length && Math.max.apply(Math, bigStageRatings) >= regularAverage + 0.35) tags.push('大场面选手');
    if (state.player.age >= 26 && (stats.mental || 0) + (stats.rest || 0) >= 3 && averageRating(state) >= regularAverage / 10 - 0.15) tags.push('生涯管理者');
    return tags;
  }

  function agePenalty(age) {
    return ({ 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 1, 27: 2, 28: 4, 29: 6 })[age] || 0;
  }

  function marketDirection(score) {
    if (score >= 85) return '争冠队首发 / 中游队核心';
    if (score >= 75) return '争冠队轮换 / 中游队首发';
    if (score >= 60) return '中游队轮换 / 重建队核心';
    if (score >= 45) return '重建队首发或轮换';
    return '市场兴趣有限';
  }

  function build(state) {
    var regularAverage = averageRating(state) * 10;
    var playerRow = (state.standings || []).find(function (row) { return row.isPlayer; });
    var teamGoalCompleted = state.playoff.status === 'champion' || (state.playoff.qualified && (state.teamPreset !== 'contender' || (playerRow && playerRow.rank <= 4)));
    var teamGoal = teamGoalCompleted ? 100 : (state.playoff.qualified ? 74 : 42);
    var roleChange = clamp(50 + (state.resources.roleStatus - 50) * 0.8, 0, 100);
    var keyMatches = (state.blockReports || []).filter(function (report) { return report.key; });
    var keyScore = keyMatches.length ? keyMatches.reduce(function (sum, report) { return sum + (report.score == null ? report.averageRating * 10 : report.score); }, 0) / keyMatches.length : regularAverage;
    var awards = (state.awards.mvp && state.awards.mvp.id === 'you' ? 80 : 0) + (state.awards.fmvp && state.awards.fmvp.name === '你' ? 100 : 0);
    awards = Math.min(100, awards);
    var score = regularAverage * 0.45 + teamGoal * 0.20 + roleChange * 0.15 + keyScore * 0.10 + awards * 0.10;
    var letter = grade(score);
    var reputationDelta = letter === 'S' ? 8 : (letter === 'A' ? 5 : (letter === 'B' ? 2 : (letter === 'C' ? 0 : -3)));
    var tags = routeTags(state, regularAverage);
    if (state.playoff.status === 'champion') tags.push('赛季冠军');
    if (state.awards.mvp && state.awards.mvp.id === 'you') tags.push('常规赛 MVP');
    if (state.awards.fmvp && state.awards.fmvp.name === '你') tags.push('FMVP');
    if (state.resources.roleStatus >= 80) tags.push('战术核心');
    tags = tags.slice(0, 2);
    if (!tags.length) tags.push('稳定成长');
    var previousReputation = state.career && state.career.reputation == null ? 20 : (state.career && state.career.reputation != null ? state.career.reputation : 20);
    var marketScore = clamp(previousReputation * 0.45 + state.player.ovr * 0.35 + score * 0.20 - agePenalty(state.player.age), 0, 100);
    var currentTeamOutlook = letter === 'S' || letter === 'A' || (teamGoalCompleted && state.resources.roleStatus >= 60) ? '希望续留' : (letter === 'B' ? '保持开放' : (state.resources.roleStatus < 60 ? '考虑升级该位置' : '继续观察')); 
    var reasons = [
      '个人表现 ' + round(regularAverage, 1),
      '队伍目标 ' + round(teamGoal, 1),
      '位置兑现 ' + round(roleChange, 1),
      '市场评分 ' + round(marketScore, 1)
    ]; 
    if (keyMatches.length) reasons.push('关键比赛 ' + round(keyScore, 1));
    if (awards) reasons.push('赛季荣誉加成');
    return {
      reputation: clamp(previousReputation + reputationDelta, 0, 100),
      reputationDelta: reputationDelta,
      seasonGrade: letter,
      seasonScore: round(score, 1),
      careerTags: tags,
      nextSeasonRole: state.resources.roleStatus >= 80 ? '围绕你构建战术核心' : (state.resources.roleStatus >= 60 ? '稳定首发竞争者' : '继续竞争轮换位置'),
      currentTeamOutlook: currentTeamOutlook,
      marketScore: round(marketScore, 1),
      marketOutlook: marketDirection(marketScore),
      teamGoalCompleted: teamGoalCompleted,
      teamMemory: reasons.slice(),
      reasons: reasons,
      handoffApplied: false
    };
  }

  function apply(state) {
    if (state.career && state.career.handoffApplied) return state.career;
    var previous = state.career || initial(state.playerPreset);
    var result = build(state);
    result.history = (previous.history || []).concat([{ year: state.year, grade: result.seasonGrade, score: result.seasonScore, tags: result.careerTags.slice() }]);
    result.handoffApplied = true;
    state.career = result;
    state.careerImpact = state.career;
    return result;
  }

  function nextSeason(career) {
    var next = copy(career || initial('rookie'));
    next.seasonGrade = null;
    next.seasonScore = 0;
    next.careerTags = [];
    next.nextSeasonRole = '继续争取队内位置';
    next.currentTeamOutlook = '等待本赛季结果';
    next.marketOutlook = '沿用上赛季市场印象';
    next.reasons = [];
    next.teamMemory = [];
    next.handoffApplied = false;
    return next;
  }

  root.OWL_ALPHA_CAREER = { initial: initial, build: build, apply: apply, nextSeason: nextSeason, grade: grade };
})(typeof globalThis === 'undefined' ? this : globalThis);
