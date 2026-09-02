(function (root) {
  'use strict';

  var C = root.OWL_ALPHA_CONSTANTS;
  var E = root.OWL_ALPHA_ENGINE;
  var I = root.OWL_ALPHA_IMPACT;

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
    });
  }

  function pct(value) {
    return Math.round(value * 10) / 10 + '%';
  }

  function impactValue(value) {
    var number = Number(value || 0);
    return '<b class="' + (number < 0 ? 'impact-negative' : 'impact-positive') + '">' + (number >= 0 ? '+' : '') + number.toFixed(1) + 'pp</b>';
  }

  function setHidden(id, hidden) {
    var element = document.getElementById(id);
    if (element) element.classList.toggle('hidden', hidden);
  }

  function renderHome(saved, legacy) {
    setHidden('homeScreen', false);
    setHidden('seasonScreen', true);
    setHidden('batchScreen', true);
    var continueButton = document.getElementById('continueSeasonButton');
    continueButton.classList.toggle('hidden', !saved);
    document.getElementById('storageStatus').textContent = saved ? '发现未完成 Alpha V2 Demo，可以继续。' : (legacy ? '检测到旧版验证档，Alpha V2 不会读取或删除它。' : '当前没有未完成 Demo。');
  }

  function render(state) {
    setHidden('homeScreen', true);
    setHidden('seasonScreen', false);
    setHidden('batchScreen', true);
    document.getElementById('seasonYear').textContent = state.year;
    document.getElementById('seasonTitle').textContent = C.PLAYER_PRESETS[state.playerPreset].name + ' · ' + C.TEAM_PRESETS[state.teamPreset].name;
    document.getElementById('nodeLabel').textContent = '当前节点：' + E.nodeLabel(state) + ' · ' + state.pending.type;
    document.getElementById('nodeCount').textContent = Math.min(state.node, 22) + ' / 22';
    document.getElementById('playerOvr').textContent = state.player.ovr;
    document.getElementById('playerMeta').textContent = state.player.age + ' 岁 · 潜力 ' + state.player.potential;
    document.getElementById('energy').textContent = state.resources.energy;
    document.getElementById('energyBar').style.width = state.resources.energy + '%';
    document.getElementById('formStress').textContent = '状态 ' + (state.resources.form > 0 ? '+' : '') + state.resources.form + ' / 压力 ' + state.resources.stress;
    document.getElementById('record').textContent = state.wins + ' - ' + state.losses;
    document.getElementById('roleStatus').textContent = I.roleProfile(state.resources.roleStatus).label + ' · ' + state.resources.roleStatus;
    document.getElementById('careerReputation').textContent = state.career ? state.career.reputation : '—';
    var appearedMatches = state.matches.filter(function (match) { return match.appeared !== false; });
    var averageRating = appearedMatches.length ? appearedMatches.reduce(function (sum, match) { return sum + match.rating; }, 0) / appearedMatches.length : 0;
    document.getElementById('seasonUsage').textContent = (appearedMatches.length ? averageRating.toFixed(2) : '—') + ' / ' + appearedMatches.length + '/' + state.matches.length;
    document.getElementById('attributeList').innerHTML = ['mechanics', 'heroPool', 'gameSense', 'teamwork', 'mental'].map(function (key) {
      return '<div class="stat-line"><span>' + ({ mechanics: '机械', heroPool: '英雄池', gameSense: '意识', teamwork: '团队', mental: '心态' })[key] + '</span><b>' + state.player.attributes[key] + ' <small>+' + state.player.progress[key] + '/10</small></b></div>';
    }).join('');
    document.getElementById('supportList').innerHTML = '<h4>支援角色关系</h4>' + Object.keys(state.relationships).map(function (key) {
      return '<div class="support-line"><span>' + ({ coach: '主教练', partner: '主要搭档', rival: '位置竞争者', mentor: '老将导师', nemesis: '宿敌' })[key] + '</span><b>' + state.relationships[key] + '</b></div>';
    }).join('');
    document.getElementById('timeline').innerHTML = Array.from({ length: 22 }, function (_, index) {
      var node = index + 1;
      return '<i class="timeline-dot ' + (node < state.node ? 'done' : '') + ' ' + (node === state.node ? 'current' : '') + '" title="' + esc(C.NODE_LABELS[node]) + '"></i>';
    }).join('');
    renderPending(state);
    document.getElementById('logList').innerHTML = state.log.slice(-7).reverse().map(function (line) {
      return '<div>· ' + esc(line) + '</div>';
    }).join('');
  }

  function renderPending(state) {
    var type = state.pending.type;
    ['actionArea', 'actionResultArea', 'matchPlanArea', 'blockReportArea', 'eventArea', 'reportArea', 'playoffArea', 'careerHandoffArea', 'summaryArea'].forEach(function (id) {
      setHidden(id, id !== ({ action: 'actionArea', action_result: 'actionResultArea', match_plan: 'matchPlanArea', block_report: 'blockReportArea', event: 'eventArea', report: 'reportArea', playoff: 'playoffArea', career_handoff: 'careerHandoffArea', summary: 'summaryArea' })[type]);
    });
    if (type === 'action') renderAction(state);
    else if (type === 'action_result') renderActionResult(state);
    else if (type === 'match_plan') renderMatchPlan(state);
    else if (type === 'block_report') renderBlockReport(state);
    else if (type === 'event') renderEvent(state);
    else if (type === 'report') renderReport(state);
    else if (type === 'playoff') renderPlayoff(state);
    else if (type === 'career_handoff') renderCareerHandoff(state);
    else renderSummary(state);
  }

  function renderAction(state) {
    var actions = E.getActions();
    var cards = actions.map(function (action) {
      var risk = action.id === 'rest' ? '无失败风险' : '失败率约 ' + pct(E.failRate(state));
      var effect = I.actionEffect(action.id, false);
      var effectText = effect.personalWinPP ? '个人胜率 +' + effect.personalWinPP + 'pp' : (effect.metaPP ? '版本适应 +' + effect.metaPP + 'pp' : (effect.synergyPP ? '团队磨合 +' + effect.synergyPP + 'pp' : (effect.decisionPP ? '队伍决策 +' + effect.decisionPP + 'pp' : '降低比赛波动')));
      return '<button class="button action-card" data-alpha-action="' + esc(action.id) + '"><span>' + action.icon + '</span><strong>' + esc(action.name) + '</strong><small>' + esc(action.description) + '</small><small class="effect-preview">下一比赛块：' + esc(effectText) + '</small><small class="cost">体力 ' + (action.energy > 0 ? '+' : '') + action.energy + ' · ' + risk + '</small></button>';
    }).join('');
    document.getElementById('actionArea').innerHTML = '<div class="section-title"><h3>选择本节点行动</h3><span>先看训练结果，再看比赛兑现</span></div><div class="action-grid">' + cards + '</div>';
  }

  function renderActionResult(state) {
    var result = state.actionResult;
    var effect = result.temporaryEffect || {};
    var resource = result.resourceChanges || { energy: 0, stress: 0, form: 0 };
    var relationChanges = (result.relationshipChanges || []).map(function (change) { return change.key + (change.delta >= 0 ? ' +' : ' ') + change.delta; }).join(' · ') || '无关系变化';
    var attributeChanges = (result.attributeChanges || []).map(function (change) { return change.key + (change.delta >= 0 ? ' +' : ' ') + change.delta; }).join(' · ') || '无属性即时变化';
    var next = result.block ? '下一步进入 Stage ' + result.block.stage + ' 第 ' + (result.block.block + 1) + ' 个比赛区块。' : '下一步回到赛季时间线。';
    var buttonLabel = result.block ? '进入比赛区块 →' : '继续 →';
    document.getElementById('actionResultArea').innerHTML = '<div class="action-result-card"><p class="eyebrow">ACTION RESULT · 训练反馈</p><h3>' + esc(result.name) + (result.failed ? ' · 效果降低' : ' · 完成') + '</h3><div class="impact-summary"><span>训练进度</span><b>' + (result.progress ? '+' + result.progress : '恢复状态') + '</b><span>比赛作用</span><b>' + esc(effect.label || '状态调整') + '</b><span>评分影响</span><b>' + (effect.ratingDelta >= 0 ? '+' : '') + Number(effect.ratingDelta || 0).toFixed(2) + '</b></div><div class="result-details"><p>属性变化：' + esc(attributeChanges) + '</p><p>资源变化：体力 ' + (resource.energy >= 0 ? '+' : '') + resource.energy + ' · 压力 ' + (resource.stress >= 0 ? '+' : '') + resource.stress + ' · 状态 ' + (resource.form >= 0 ? '+' : '') + resource.form + '</p><p>关系变化：' + esc(relationChanges) + '</p></div><p>' + esc(next) + '</p><button class="button primary" data-alpha-action-result>' + buttonLabel + '</button></div>';
  }

  function renderMatchPlan(state) {
    var plans = I.availablePlans(state.resources.coachTrust);
    var cards = plans.map(function (plan) {
      return '<button class="button plan-card" data-alpha-match-plan="' + esc(plan.id) + '"><strong>' + esc(plan.name) + '</strong><small>' + esc(plan.description) + '</small></button>';
    }).join('');
    document.getElementById('matchPlanArea').innerHTML = '<div class="match-plan-card"><p class="eyebrow">MATCH PLAN · 比赛策略</p><h3>选择本区块的执行方式</h3><p class="muted">训练选择会通过下方比赛账本影响个人发挥、队伍强度与队内地位。</p><div class="plan-grid">' + cards + '</div></div>';
  }

  function renderBlockReport(state) {
    var block = state.blockContext;
    var report = block.report;
    var stage = state.stageRecords.find(function (item) { return item.stage === report.stage; }) || { wins: 0, losses: 0 };
    var ledger = block.impactLedger || [];
    var totals = ledger.reduce(function (sum, item) {
      ['playerAbilityPP', 'metaPP', 'synergyPP', 'decisionPP', 'actionPP', 'statePP'].forEach(function (key) { sum[key] += item[key] || 0; });
      return sum;
    }, { playerAbilityPP: 0, metaPP: 0, synergyPP: 0, decisionPP: 0, actionPP: 0, statePP: 0 });
    var rows = block.matches.map(function (match, index) {
      var reason = match.impactLedger && match.impactLedger.reasons ? match.impactLedger.reasons[2] : '体系执行';
      return '<div class="match-row"><span>第 ' + (index + 1) + ' 场 · ' + esc(match.opponent) + '</span><b class="' + (match.won ? 'win' : 'loss') + '">' + (match.won ? '胜' : '负') + '</b><em>' + (match.appeared ? '出场' : '未出场') + ' · ' + Number(match.rating).toFixed(2) + '分 · 胜率 ' + pct(match.probability) + ' · ' + esc(reason) + '</em></div>';
    }).join('');
    var first = ledger[0] || { baseProbability: 0, counterfactualProbability: 0, finalProbability: 0 };
    var boundary = first.probabilityBoundPP ? ' · 边界保护 ' + impactValue(first.probabilityBoundPP) : '';
    var triggers = report.projectedRelationTriggers && report.projectedRelationTriggers.length ? '<p>本区块触发：' + esc(report.projectedRelationTriggers.join('、')) + '</p>' : '';
    var html = '<div class="block-report-card ' + (report.key ? 'key-report' : '') + '"><p class="eyebrow">BLOCK REPORT · ' + report.stage + '-' + report.block + (report.key ? ' · 关键比赛' : '') + '</p><h3>' + report.wins + ' 胜 ' + report.losses + ' 负 · 平均评分 ' + Number(report.averageRating).toFixed(2) + '</h3><p class="muted">Stage 累计 ' + stage.wins + ' 胜 ' + stage.losses + ' 负 · 出场 ' + report.appearances + '/' + report.games + ' · 当前身份：' + esc(I.roleProfile(report.roleBefore).label) + ' · 预计：' + esc(I.roleProfile(report.projectedRoleAfter).label) + ' (' + (report.projectedRoleChange >= 0 ? '+' : '') + report.projectedRoleChange + ')</p><div class="impact-ledger"><strong>比赛影响账本（单位：百分点）</strong><div>队伍基础胜率 <b>' + Number(first.baseProbability).toFixed(1) + '%</b> · 无本轮备战 <b>' + Number(first.counterfactualProbability).toFixed(1) + '%</b> · 最终赛前胜率 <b>' + Number(first.finalProbability).toFixed(1) + '%</b></div><div>个人长期能力 ' + impactValue(first.playerAbilityPP) + ' · 版本适应 ' + impactValue(first.metaPP) + ' · 团队磨合 ' + impactValue(first.synergyPP) + '</div><div>比赛阅读 ' + impactValue(first.decisionPP) + ' · 本轮训练 ' + impactValue(first.actionPP) + ' · 当前状态 ' + impactValue(first.statePP) + ' · 随机波动 ' + impactValue(first.variancePP) + boundary + '</div><div>本区块个人出场贡献合计 ' + impactValue(totals.playerAbilityPP + totals.statePP + totals.actionPP) + ' · 训练直接作用合计 ' + impactValue(totals.actionPP) + '</div></div><div class="match-list">' + rows + '</div><div class="feedback-card"><strong>队伍反馈</strong><p>' + esc(report.teamFeedback || '确认比赛结果后生成队伍反馈。') + '</p>' + triggers + '</div><button class="button primary" data-alpha-block-report>确认区块结算 →</button></div>';
    var rankChange = report.leagueRankChange ? ' (' + (report.leagueRankChange >= 0 ? '+' : '') + report.leagueRankChange + ')' : '';
    html = html.replace('Stage 累计 ', '联盟预估第 ' + report.leagueRank + rankChange + ' · Stage 累计 ');
    html = html.replace('<strong>队伍反馈</strong>', '<strong>队伍反馈</strong><p>教练评价：' + esc(report.coachFeedback || '教练会继续观察你的表现。') + '</p><p>支援反馈：' + esc(report.supportFeedback || '支援关系暂无新的反馈。') + '</p>');
    document.getElementById('blockReportArea').innerHTML = html;
  }

  function renderEvent(state) {
    var event = state.event;
    document.getElementById('eventArea').innerHTML = '<div class="event-card"><p class="eyebrow">EVENT · ' + esc(event.id) + '</p><h3>' + esc(event.title) + '</h3><p>' + esc(event.body) + '</p><div class="choice-grid">' + event.choices.map(function (choice) {
      return '<button class="button" data-alpha-event="' + esc(choice.id) + '"><strong>' + esc(choice.label) + '</strong><small>' + esc(choice.text) + '</small></button>';
    }).join('') + '</div></div>';
  }

  function renderReport(state) {
    var report = E.seasonReport(state);
    document.getElementById('reportArea').innerHTML = '<div class="report-card"><p class="eyebrow">REGULAR SEASON COMPLETE</p><h3>' + report.wins + ' 胜 ' + report.losses + ' 负 · 联盟第 ' + report.rank + '</h3><div class="result-grid"><div class="result-chip"><span>MVP</span><b>' + esc(report.mvp && report.mvp.name) + '</b></div><div class="result-chip"><span>职责之星</span><b>' + esc(report.roleStar && report.roleStar.name) + '</b></div><div class="result-chip"><span>季后赛</span><b>' + (report.qualified ? '已晋级' : '未进入八强') + '</b></div></div><button class="button primary" data-alpha-report>进入季后赛 →</button></div>';
  }

  function renderPlayoff(state) {
    var roundName = ({ 19: '八强', 20: '四强', 21: '决赛' })[state.node] || '季后赛';
    var last = state.playoff.results[state.playoff.results.length - 1];
    var status = last ? last.status + (last.opponent ? ' · 对手：' + last.opponent : '') : (state.playoff.qualified ? '常规赛排名已锁定，准备开始系列赛。' : '本赛季未进入八强，接下来完成赛季收尾。');
    document.getElementById('playoffArea').innerHTML = '<div class="playoff-card ' + (state.playoff.status === 'champion' ? 'celebrate' : '') + '"><p class="eyebrow">PLAYOFF · NODE ' + state.node + '</p><h3>' + roundName + '</h3><p>' + esc(status) + '</p><button class="button primary" data-alpha-playoff>继续 →</button></div>';
  }

  function renderCareerHandoff(state) {
    var career = state.career && state.career.seasonGrade ? state.career : root.OWL_ALPHA_CAREER.build(state);
    document.getElementById('careerHandoffArea').innerHTML = '<div class="career-handoff-card"><p class="eyebrow">CAREER HANDOFF · 生涯影响</p><h3>本赛季评级：' + esc(career.seasonGrade) + ' · 赛季分 ' + career.seasonScore + '</h3><div class="career-grid"><div><span>生涯声望</span><b>' + career.reputation + ' <small>(' + (career.reputationDelta >= 0 ? '+' : '') + career.reputationDelta + ')</small></b></div><div><span>下赛季定位</span><b>' + esc(career.nextSeasonRole) + '</b></div><div><span>队伍判断</span><b>' + esc(career.currentTeamOutlook) + '</b></div><div><span>市场预期</span><b>' + esc(career.marketOutlook) + '</b></div></div><p class="muted">' + career.reasons.map(esc).join(' · ') + '</p><button class="button primary" data-alpha-career>确认生涯结算 →</button></div>';
  }

  function renderSummary(state) {
    var summary = E.seasonReport(state);
    document.getElementById('summaryArea').innerHTML = '<div class="summary-card ' + (state.playoff.status === 'champion' ? 'celebrate' : '') + '"><p class="eyebrow">SEASON SUMMARY · ' + summary.year + '</p><h3>' + (state.playoff.status === 'champion' ? '🏆 赛季冠军' : '赛季完成') + '</h3><p>' + summary.wins + ' 胜 ' + summary.losses + ' 负 · 最终 OVR ' + summary.playerOvr + ' · ' + (summary.mvp && summary.mvp.id === 'you' ? '获得常规赛 MVP。' : '常规赛 MVP：' + esc(summary.mvp && summary.mvp.name)) + '</p><p>职业评级：' + esc(summary.career && summary.career.seasonGrade) + ' · 生涯声望：' + (summary.career && summary.career.reputation) + '</p><button class="button primary" data-alpha-new>开始下一次验证</button></div>';
  }

  root.OWL_ALPHA_UI = { renderHome: renderHome, render: render };
})(typeof globalThis === 'undefined' ? this : globalThis);
