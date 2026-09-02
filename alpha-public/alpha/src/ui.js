(function (root) {
  'use strict';

  var C = root.OWL_ALPHA_CONSTANTS;
  var E = root.OWL_ALPHA_ENGINE;

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]; });
  }

  function pct(value) { return Math.round(value * 10) / 10 + '%'; }

  function setHidden(id, hidden) {
    var element = document.getElementById(id);
    if (element) element.classList.toggle('hidden', hidden);
  }

  function renderHome(saved) {
    setHidden('homeScreen', false);
    setHidden('seasonScreen', true);
    setHidden('batchScreen', true);
    var continueButton = document.getElementById('continueSeasonButton');
    continueButton.classList.toggle('hidden', !saved);
    document.getElementById('storageStatus').textContent = saved ? '发现未完成 Alpha Demo，可以继续。' : '当前没有未完成 Demo。';
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
    document.getElementById('roleStatus').textContent = state.resources.roleStatus;
    document.getElementById('attributeList').innerHTML = ['mechanics', 'heroPool', 'gameSense', 'teamwork', 'mental'].map(function (key) { return '<div class="stat-line"><span>' + ({ mechanics: '机械', heroPool: '英雄池', gameSense: '意识', teamwork: '团队', mental: '心态' })[key] + '</span><b>' + state.player.attributes[key] + ' <small>+' + state.player.progress[key] + '/10</small></b></div>'; }).join('');
    document.getElementById('supportList').innerHTML = '<h4>支援角色关系</h4>' + Object.keys(state.relationships).map(function (key) { return '<div class="support-line"><span>' + ({ coach: '主教练', partner: '主要搭档', rival: '位置竞争者', mentor: '老将导师', nemesis: '宿敌' })[key] + '</span><b>' + state.relationships[key] + '</b></div>'; }).join('');
    document.getElementById('timeline').innerHTML = Array.from({ length: 22 }, function (_, index) { var node = index + 1; return '<i class="timeline-dot ' + (node < state.node ? 'done' : '') + ' ' + (node === state.node ? 'current' : '') + '" title="' + esc(C.NODE_LABELS[node]) + '"></i>'; }).join('');
    renderPending(state);
    document.getElementById('logList').innerHTML = state.log.slice(-7).reverse().map(function (line) { return '<div>· ' + esc(line) + '</div>'; }).join('');
  }

  function renderPending(state) {
    var type = state.pending.type;
    setHidden('actionArea', type !== 'action');
    setHidden('eventArea', type !== 'event');
    setHidden('reportArea', type !== 'report');
    setHidden('playoffArea', type !== 'playoff');
    setHidden('summaryArea', type !== 'summary');
    if (type === 'action') {
      var actions = E.getActions();
      document.getElementById('actionArea').innerHTML = '<div class="section-title"><h3>选择本节点行动</h3><span>失败率会提前显示</span></div><div class="action-grid">' + actions.map(function (action) { var risk = action.id === 'rest' ? '无失败风险' : '失败率约 ' + pct(E.failRate(state)); return '<button class="button action-card" data-alpha-action="' + action.id + '"><span>' + action.icon + '</span><strong>' + action.name + '</strong><small>' + action.description + '</small><small class="cost">体力 ' + (action.energy > 0 ? '+' : '') + action.energy + ' · ' + risk + '</small></button>'; }).join('') + '</div>';
    } else if (type === 'event') {
      var event = state.event;
      document.getElementById('eventArea').innerHTML = '<div class="event-card"><p class="eyebrow">EVENT · ' + esc(event.id) + '</p><h3>' + esc(event.title) + '</h3><p>' + esc(event.body) + '</p><div class="choice-grid">' + event.choices.map(function (choice) { return '<button class="button" data-alpha-event="' + esc(choice.id) + '"><strong>' + esc(choice.label) + '</strong><small>' + esc(choice.text) + '</small></button>'; }).join('') + '</div></div>';
    } else if (type === 'report') {
      var report = E.seasonReport(state);
      document.getElementById('reportArea').innerHTML = '<div class="report-card"><p class="eyebrow">REGULAR SEASON COMPLETE</p><h3>' + report.wins + ' 胜 ' + report.losses + ' 负 · 联盟第 ' + report.rank + '</h3><div class="result-grid"><div class="result-chip"><span>MVP</span><b>' + esc(report.mvp && report.mvp.name) + '</b></div><div class="result-chip"><span>职责之星</span><b>' + esc(report.roleStar && report.roleStar.name) + '</b></div><div class="result-chip"><span>季后赛</span><b>' + (report.qualified ? '已晋级' : '未进入八强') + '</b></div></div><button class="button primary" data-alpha-report>进入季后赛 →</button></div>';
    } else if (type === 'playoff') {
      var roundName = ({ 19: '八强', 20: '四强', 21: '决赛' })[state.node] || '季后赛';
      var last = state.playoff.results[state.playoff.results.length - 1];
      document.getElementById('playoffArea').innerHTML = '<div class="playoff-card ' + (state.playoff.status === 'champion' ? 'celebrate' : '') + '"><p class="eyebrow">PLAYOFF · NODE ' + state.node + '</p><h3>' + roundName + '</h3><p>' + (last ? esc(last.status + (last.opponent ? ' · 对手：' + last.opponent : '')) : (state.playoff.qualified ? '常规赛排名已锁定，准备开始系列赛。' : '本赛季未进入八强，接下来完成赛季收尾。')) + '</p><button class="button primary" data-alpha-playoff>' + (state.playoff.qualified && state.playoff.status !== 'eliminated' ? '模拟本轮 →' : '继续 →') + '</button></div>';
    } else {
      var summary = E.seasonReport(state);
      document.getElementById('summaryArea').innerHTML = '<div class="summary-card ' + (state.playoff.status === 'champion' ? 'celebrate' : '') + '"><p class="eyebrow">SEASON SUMMARY · ' + summary.year + '</p><h3>' + (state.playoff.status === 'champion' ? '🏆 赛季冠军' : '赛季完成') + '</h3><p>' + summary.wins + ' 胜 ' + summary.losses + ' 负 · 最终 OVR ' + summary.playerOvr + ' · ' + (summary.mvp && summary.mvp.id === 'you' ? '获得常规赛 MVP。' : '常规赛 MVP：' + esc(summary.mvp && summary.mvp.name)) + '</p><button class="button primary" data-alpha-new>开始下一次验证</button></div>';
    }
  }

  root.OWL_ALPHA_UI = { renderHome: renderHome, render: render };
})(typeof globalThis === 'undefined' ? this : globalThis);
