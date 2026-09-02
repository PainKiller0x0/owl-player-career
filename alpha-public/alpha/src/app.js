(function (root) {
  'use strict';

  var E = root.OWL_ALPHA_ENGINE;
  var S = root.OWL_ALPHA_STORAGE;
  var UI = root.OWL_ALPHA_UI;
  var A = root.OWL_ALPHA_AUTO;
  var T = root.OWL_ALPHA_TELEMETRY;
  var state = null;
  var batchWorker = null;
  var batchResult = null;

  function value(id) { return document.getElementById(id).value; }

  function save() {
    if (!state) return;
    var result = S.save(state);
    document.getElementById('storageStatus').textContent = result.message;
  }

  function render() {
    if (state) UI.render(state);
    else UI.renderHome(!!S.load());
  }

  function start() {
    state = E.makeState({ seed: Number(value('seed')), playerPreset: value('playerPreset'), teamPreset: value('teamPreset'), plan: value('plan'), year: 2026 });
    save();
    T.send('alpha_demo_start', { mode: 'manual' });
    render();
  }

  function continueSaved() {
    state = S.load();
    if (!state) return start();
    if (!state.pending) E.setPending(state);
    render();
  }

  function download(name, content) {
    var blob = new Blob([content], { type: 'application/json;charset=utf-8' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = name;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function showBatch() {
    setHidden('homeScreen', true); setHidden('seasonScreen', true); setHidden('batchScreen', false);
  }

  function setHidden(id, hidden) { document.getElementById(id).classList.toggle('hidden', hidden); }

  function startBatch(matrix) {
    if (batchWorker) batchWorker.terminate();
    batchWorker = new Worker('src/batch-worker.js');
    var count = Math.max(1, Number(value('batchCount')) || 10000);
    document.getElementById('batchProgressBar').style.width = '0%';
    document.getElementById('batchProgressText').textContent = matrix ? '正在运行 45 组矩阵……' : '正在运行……';
    document.getElementById('batchOutput').textContent = '批量模拟在后台运行，页面仍可操作。';
    batchWorker.onmessage = function (event) {
      var data = event.data;
      if (data.type === 'progress') {
        document.getElementById('batchProgressBar').style.width = Math.round(data.done / data.total * 100) + '%';
        document.getElementById('batchProgressText').textContent = data.done + ' / ' + data.total;
      } else if (data.type === 'complete') {
        batchResult = data.result;
        document.getElementById('batchProgressBar').style.width = '100%';
        document.getElementById('batchProgressText').textContent = '完成';
        document.getElementById('batchOutput').textContent = JSON.stringify(data.result, null, 2);
        document.getElementById('exportBatchButton').classList.remove('hidden');
        T.send('alpha_batch_complete', { mode: 'batch' });
        batchWorker.terminate(); batchWorker = null;
      } else if (data.type === 'error') {
        document.getElementById('batchProgressText').textContent = '失败';
        document.getElementById('batchOutput').textContent = data.message;
        batchWorker.terminate(); batchWorker = null;
      }
    };
    batchWorker.postMessage({ count: count, seed: 20260902, playerPreset: value('batchPlayer'), teamPreset: value('batchTeam'), plan: 'balanced', matrix: matrix });
  }

  function startLongBatch() {
    if (batchWorker) batchWorker.terminate();
    batchWorker = new Worker('src/batch-worker.js');
    var count = Math.max(1, Math.min(Number(value('batchCount')) || 10000, 100000));
    document.getElementById('batchProgressBar').style.width = '0%';
    document.getElementById('batchProgressText').textContent = '正在运行 12 年长期抽样……';
    batchWorker.onmessage = function (event) {
      var data = event.data;
      if (data.type === 'progress') {
        document.getElementById('batchProgressBar').style.width = Math.round(data.done / data.total * 100) + '%';
        document.getElementById('batchProgressText').textContent = data.done + ' / ' + data.total;
      } else if (data.type === 'complete') {
        batchResult = data.result;
        document.getElementById('batchProgressBar').style.width = '100%';
        document.getElementById('batchProgressText').textContent = '完成';
        document.getElementById('batchOutput').textContent = JSON.stringify(data.result, null, 2);
        document.getElementById('exportBatchButton').classList.remove('hidden');
        T.send('alpha_batch_complete', { mode: 'batch' });
        batchWorker.terminate(); batchWorker = null;
      } else if (data.type === 'error') {
        document.getElementById('batchProgressText').textContent = '失败';
        document.getElementById('batchOutput').textContent = data.message;
        batchWorker.terminate(); batchWorker = null;
      }
    };
    batchWorker.postMessage({ count: count, seed: 20260902, teamPreset: value('batchTeam'), plan: 'balanced', long: true });
  }

  document.addEventListener('click', function (event) {
    var element = event.target.closest ? event.target.closest('[data-alpha-action],[data-alpha-event],[data-alpha-report],[data-alpha-playoff],[data-alpha-new]') : null;
    if (element && state) {
      try {
        if (element.dataset.alphaAction) E.applyAction(state, element.dataset.alphaAction);
        else if (element.dataset.alphaEvent) E.resolveEvent(state, element.dataset.alphaEvent);
        else if (element.dataset.alphaReport !== undefined) E.continueReport(state);
        else if (element.dataset.alphaPlayoff !== undefined) E.resolvePlayoff(state);
        else if (element.dataset.alphaNew !== undefined) return start();
        save(); render();
        if (state.completed) T.send('alpha_season_complete', { mode: state.mode });
      } catch (error) {
        document.getElementById('storageStatus').textContent = error.message;
      }
      return;
    }
    if (event.target.id === 'startSeasonButton') return start();
    if (event.target.id === 'continueSeasonButton') return continueSaved();
    if (event.target.id === 'clearDataButton') { S.clear(); state = null; render(); return; }
    if (event.target.id === 'saveButton') { save(); return; }
    if (event.target.id === 'exportSeasonButton' && state) return download('owl_alpha_season_' + state.year + '.json', S.exportState(state));
    if (event.target.id === 'autoSeasonButton' && state) { A.run(state); save(); render(); T.send('alpha_auto_complete', { mode: 'auto' }); return; }
    if (event.target.id === 'backHomeButton') { state = null; render(); return; }
    if (event.target.id === 'openBatchButton') return showBatch();
    if (event.target.id === 'closeBatchButton') { if (state) render(); else renderHome(!!S.load()); return; }
    if (event.target.id === 'runBatchButton') return startBatch(false);
    if (event.target.id === 'runMatrixButton') return startBatch(true);
    if (event.target.id === 'runLongButton') return startLongBatch();
    if (event.target.id === 'exportBatchButton' && batchResult) return download('owl_alpha_batch_result.json', JSON.stringify(batchResult, null, 2));
  });

  T.send('alpha_demo_open', { mode: 'manual' });
  render();
})(typeof globalThis === 'undefined' ? this : globalThis);
