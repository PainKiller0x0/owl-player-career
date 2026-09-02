(function (root) {
  'use strict';

  var E = root.OWL_ALPHA_ENGINE;
  var V3 = root.OWL_ALPHA_V3;
  var S = root.OWL_ALPHA_V3_SCENARIO;
  var I = root.OWL_ALPHA_IMPACT;
  var montageTimer = null;

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
    });
  }

  function setHidden(id, hidden) {
    var element = document.getElementById(id);
    if (element) element.classList.toggle('hidden', hidden);
  }

  function roleLabel(state) {
    return I.roleProfile(state.resources.roleStatus).label;
  }

  function condition(state) {
    var energy = state.resources.energy;
    var stress = state.resources.stress;
    if (energy < 25 || stress >= 75) return { label: '状态吃紧', tone: 'danger' };
    if (energy >= 70 && stress <= 35) return { label: '状态不错', tone: 'good' };
    return { label: '状态正常', tone: 'normal' };
  }

  function reportRating(state) {
    var matches = state.matches.filter(function (match) { return match.appeared !== false; });
    return matches.length ? (matches.reduce(function (sum, match) { return sum + match.rating; }, 0) / matches.length).toFixed(2) : '—';
  }

  function tagHtml(state) {
    if (!state.v3.preparationTags.length) return '<span class="empty-tag">还没有形成备战成果</span>';
    return state.v3.preparationTags.map(function (tag) {
      return '<span class="prep-tag"><span>' + esc(tag.icon) + '</span>' + esc(tag.name) + (tag.level > 1 ? ' II' : '') + '</span>';
    }).join('');
  }

  function renderHome(saved, legacy) {
    stopMontage();
    setHidden('homeScreen', false);
    setHidden('seasonScreen', true);
    setHidden('batchScreen', true);
    var continueButton = document.getElementById('continueStageButton');
    continueButton.classList.toggle('hidden', !saved);
    document.getElementById('storageStatus').textContent = saved ? '发现未完成的 V3 Stage，可以继续。' : (legacy ? '检测到 V1/V2 验证档，V3 不会读取或删除它。' : '当前没有未完成的 V3 Stage。');
  }

  function render(state) {
    stopMontage();
    setHidden('homeScreen', true);
    setHidden('seasonScreen', false);
    setHidden('batchScreen', true);
    document.getElementById('stageTitle').textContent = S.title;
    document.getElementById('stageRound').textContent = state.v3.round + ' / 4';
    document.getElementById('stageRecord').textContent = state.wins + ' - ' + state.losses;
    document.getElementById('stageRole').textContent = roleLabel(state);
    document.getElementById('stageGoal').textContent = S.goal;
    document.getElementById('condition').textContent = condition(state).label;
    document.getElementById('condition').className = 'pill ' + condition(state).tone;
    document.getElementById('energyValue').textContent = state.resources.energy;
    document.getElementById('energyBar').style.width = state.resources.energy + '%';
    document.getElementById('stressValue').textContent = state.resources.stress;
    document.getElementById('stressBar').style.width = state.resources.stress + '%';
    document.getElementById('roleStatusValue').textContent = state.resources.roleStatus;
    document.getElementById('ratingValue').textContent = reportRating(state);
    document.getElementById('prepTags').innerHTML = tagHtml(state);
    document.getElementById('stageSchedule').innerHTML = [1, 2, 3, 4].map(function (round) {
      var done = round < state.v3.round || state.pending.type === 'stage_result' && round <= 4;
      var current = round === state.v3.round && state.pending.type !== 'stage_result';
      var label = round === 4 ? '收官战' : ['开局考察', '状态调整', '首发竞争'][round - 1];
      var games = S.matches[round - 1];
      return '<div class="schedule-item ' + (done ? 'done' : '') + ' ' + (current ? 'current' : '') + '"><span class="schedule-dot"></span><div><b>' + label + '</b><small>' + games + ' 场 · ' + (done ? '已完成' : current ? '进行中' : '待解锁') + '</small></div></div>';
    }).join('');
    ['stageIntroArea', 'decisionArea', 'montageArea', 'roundSummaryArea', 'finaleDecisionArea', 'stageResultArea'].forEach(function (id) { setHidden(id, true); });
    setHidden('detailsDrawer', true);
    if (state.pending.type === 'stage_intro') renderIntro();
    else if (state.pending.type === 'decision') renderDecision(state, false);
    else if (state.pending.type === 'match_montage') renderMontage(state);
    else if (state.pending.type === 'round_summary') renderSummary(state, false);
    else if (state.pending.type === 'finale_decision') renderDecision(state, true);
    else if (state.pending.type === 'stage_result') renderStageResult(state);
    document.getElementById('logList').innerHTML = (state.log || []).slice(-5).reverse().map(function (item) { return '<div>· ' + esc(item) + '</div>'; }).join('');
  }

  function renderIntro() {
    document.getElementById('stageIntroArea').innerHTML = '<div class="intro-card"><p class="eyebrow">STAGE 1 · 开始备战</p><h2>你要争的不是一个数字，是首发位置。</h2><p>教练给了你轮换机会。接下来三轮准备和一场收官战，会决定你能不能把机会变成身份。</p><div class="intro-goal"><span>本 Stage 目标</span><strong>从轮换选手争取稳定首发</strong></div><button class="button primary" data-v3-begin>开始备战 →</button></div>';
    setHidden('stageIntroArea', false);
  }

  function decisionCard(choice) {
    return '<button class="choice-card" data-v3-choice="' + esc(choice.id) + '"><span class="choice-route">' + esc(choice.benefit) + '</span><h3>' + esc(choice.label) + '</h3><p>' + esc(choice.body) + '</p><div class="choice-tradeoff"><span>收益：' + esc(choice.benefit) + '</span><span>代价：' + esc(choice.cost) + '</span></div></button>';
  }

  function renderDecision(state, finale) {
    var decision = V3.currentDecision(state);
    var tags = state.v3.preparationTags.map(function (tag) { return tag.name; }).join('、') || '暂无';
    var locked = finale && decision.lockedChoices && decision.lockedChoices.length ? '<div class="locked-choice-list"><p class="eyebrow">路线预览 · 继续备战后解锁</p>' + decision.lockedChoices.map(function (choice) { return '<div class="locked-choice"><div><strong>' + esc(choice.label) + '</strong><p>' + esc(choice.body) + '</p></div><span>🔒 ' + esc(choice.lockReason) + '</span></div>'; }).join('') + '</div>' : '';
    var html = '<div class="decision-card ' + (finale ? 'finale-choice' : '') + '"><p class="eyebrow">' + (finale ? 'STAGE FINALE · 收官战' : 'DECISION · 第 ' + state.v3.round + ' 回合') + '</p><h2>' + esc(decision.title) + '</h2><p class="decision-body">' + esc(decision.body) + '</p><div class="decision-context"><span>当前备战成果</span><strong>' + esc(tags) + '</strong></div><div class="choice-grid-v3">' + decision.choices.map(decisionCard).join('') + '</div>' + locked + '</div>';
    document.getElementById(finale ? 'finaleDecisionArea' : 'decisionArea').innerHTML = html;
    setHidden(finale ? 'finaleDecisionArea' : 'decisionArea', false);
  }

  function matchRow(match, index) {
    var reason = match.impactLedger && match.impactLedger.reasons ? match.impactLedger.reasons[0] : '体系执行';
    return '<div class="v3-match-row" data-match-index="' + index + '"><span class="match-number">' + (index + 1) + '</span><div class="match-main"><strong>' + esc(match.opponent) + '</strong><small>' + (match.appeared ? '你出场' : '未出场') + ' · 个人评分 ' + Number(match.rating).toFixed(2) + '</small></div><b class="' + (match.won ? 'win' : 'loss') + '">' + (match.won ? '胜' : '负') + '</b><em>' + esc(reason) + '</em></div>';
  }

  function renderMontage(state) {
    var report = state.v3.lastReport;
    var matches = state.pending.matches || report.matches || [];
    var html = '<div class="montage-card"><p class="eyebrow">' + (state.pending.finale ? 'STAGE FINALE · 比赛兑现' : 'MATCH MONTAGE · 选择开始兑现') + '</p><h2>' + (state.pending.finale ? '收官战开始了' : '你的准备进入比赛') + '</h2><p class="muted">看你的备战成果在哪些回合生效。普通比赛可以跳过，结果不会改变。</p><div class="match-strip">' + matches.map(matchRow).join('') + '</div><div class="montage-actions"><button class="button secondary" data-v3-skip>跳过演出</button><button class="button primary" data-v3-montage-continue>继续 →</button></div></div>';
    document.getElementById('montageArea').innerHTML = html;
    setHidden('montageArea', false);
    revealMontage(matches.length);
  }

  function revealMontage(count) {
    var index = 0;
    function reveal() {
      var row = document.querySelector('.v3-match-row[data-match-index="' + index + '"]');
      if (row) row.classList.add('revealed');
      index += 1;
      if (index < count) montageTimer = window.setTimeout(reveal, 280);
    }
    reveal();
  }

  function stopMontage() {
    if (montageTimer) window.clearTimeout(montageTimer);
    montageTimer = null;
  }

  function renderSummary(state, finale) {
    var summary = state.v3.lastSummary;
    var html = '<div class="round-summary-card"><p class="eyebrow">' + (finale ? 'FINAL FEEDBACK · 收官战结果' : 'ROUND FEEDBACK · 本轮比赛结果') + '</p><h2>' + esc(summary.result) + '</h2><div class="summary-facts"><div><span>个人评分</span><strong>' + Number(summary.rating).toFixed(2) + '</strong></div><div><span>出场</span><strong>' + summary.appearances + '</strong></div><div><span>身份趋势</span><strong>' + esc(roleLabel(state)) + '</strong></div></div><p class="feedback-line">' + esc(summary.coach || '') + '</p>' + (summary.tag ? '<p class="tag-feedback">✦ “' + esc(summary.tag) + '”在比赛中留下了痕迹。</p>' : '') + '<div class="summary-actions"><button class="button secondary" data-v3-details>查看为什么</button><button class="button primary" data-v3-round-continue>继续 →</button></div></div>';
    document.getElementById('roundSummaryArea').innerHTML = html;
    setHidden('roundSummaryArea', false);
  }

  function renderStageResult(state) {
    var outcome = state.v3.stageOutcome;
    var title = outcome.id === 'achieved' ? '你赢得了稳定首发位置' : (outcome.id === 'close' ? '你进入了首发竞争的最后阶段' : '首发位置仍未拿下');
    var tone = outcome.id === 'achieved' ? 'result-good' : outcome.id === 'close' ? 'result-close' : 'result-missed';
    var tags = state.v3.preparationTags.map(function (tag) { return tag.name; }).join('、') || '暂无';
    document.getElementById('stageResultArea').innerHTML = '<div class="stage-result-card ' + tone + '"><p class="eyebrow">STAGE RESULT · 教练决定</p><h2>' + title + '</h2><p class="result-lead">你用四轮准备和18场比赛，把一次轮换机会变成了一个真实的职业结果。</p><div class="result-grid-v3"><div><span>Stage 战绩</span><strong>' + esc(outcome.record) + '</strong></div><div><span>个人平均评分</span><strong>' + Number(outcome.averageRating).toFixed(2) + '</strong></div><div><span>最终身份</span><strong>' + esc(outcome.roleAfter) + '</strong></div></div><div class="career-consequence"><span>留下的比赛印象</span><strong>' + esc(tags) + '</strong><p>' + (outcome.id === 'achieved' ? '教练下一阶段会围绕你的首发位置安排阵容。' : outcome.id === 'close' ? '你已经进入教练的首发候选，但还需要在关键比赛稳定兑现。' : '下一阶段需要先解决稳定性，竞争者会获得更多机会。') + '</p></div><p class="v3-finish-note">V3 P0 到此结束。接下来可以换一条路线重玩同一赛程。</p><div class="summary-actions"><button class="button secondary" data-v3-replay-same>重玩同一赛程</button><button class="button primary" data-v3-new-seed>开始新赛程</button></div></div>';
    setHidden('stageResultArea', false);
  }

  function openDetails(state) {
    var report = state.v3.lastReport || {};
    var first = report.matches && report.matches[0] && report.matches[0].impactLedger;
    var ledger = first ? '<div class="detail-ledger"><p>队伍基础胜率 <b>' + Number(first.baseProbability).toFixed(1) + '%</b></p><p>玩家能力 ' + signed(first.playerAbilityPP) + ' · 版本适应 ' + signed(first.metaPP) + ' · 团队磨合 ' + signed(first.synergyPP) + '</p><p>本轮准备 ' + signed(first.actionPP) + ' · 当前状态 ' + signed(first.statePP) + ' · 随机波动 ' + signed(first.variancePP) + '</p><p>最终赛前胜率 <b>' + Number(first.finalProbability).toFixed(1) + '%</b></p></div>' : '<p class="muted">本轮没有可展开的比赛账本。</p>';
    document.getElementById('detailsDrawer').innerHTML = '<div class="details-card"><div class="details-heading"><div><p class="eyebrow">QA DETAIL · 可选解释</p><h3>这轮为什么这样表现？</h3></div><button class="button secondary" data-v3-close-details>关闭</button></div>' + ledger + '<p class="muted">这里是 V2 Engine 的详细裁判记录。它用于理解和QA，不参与默认游玩流程。</p></div>';
    setHidden('detailsDrawer', false);
  }

  function signed(value) {
    var number = Number(value || 0);
    return '<b class="' + (number < 0 ? 'negative' : 'positive') + '">' + (number >= 0 ? '+' : '') + number.toFixed(1) + 'pp</b>';
  }

  root.OWL_ALPHA_UI_V3 = {
    renderHome: renderHome,
    render: render,
    openDetails: openDetails,
    stopMontage: stopMontage
  };
})(typeof globalThis === 'undefined' ? this : globalThis);
