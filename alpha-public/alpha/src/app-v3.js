(function (root) {
  'use strict';

  var V3 = root.OWL_ALPHA_V3;
  var UI = root.OWL_ALPHA_UI_V3;
  var S = root.OWL_ALPHA_STORAGE_V3;
  var T = root.OWL_ALPHA_TELEMETRY;
  var state = null;
  var batchWorker = null;
  var batchResult = null;

  function byId(id) { return document.getElementById(id); }

  function save() {
    if (!state) return;
    var result = S.save(state);
    byId('storageStatus').textContent = result.message;
  }

  function render() {
    if (state) UI.render(state);
    else UI.renderHome(!!S.load(), S.hasLegacy());
  }

  function seed() {
    return Number(byId('seed').value) || Math.floor(Date.now() % 100000000);
  }

  function newSeed(previous) {
    var nextSeed = Math.floor(Date.now() % 100000000);
    if (nextSeed === previous) nextSeed = (nextSeed + 1) % 100000000;
    byId('seed').value = nextSeed;
    return nextSeed;
  }

  function start(useSeed) {
    state = V3.makeState({ seed: useSeed == null ? seed() : useSeed });
    save();
    T.send('alpha_v3_stage_start', { mode: 'v3', scenarioId: state.v3.scenarioId, round: state.v3.round });
    render();
  }

  function continueSaved() {
    state = S.load();
    if (!state || !state.v3) return start();
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
    UI.stopMontage();
    byId('homeScreen').classList.add('hidden');
    byId('seasonScreen').classList.add('hidden');
    byId('batchScreen').classList.remove('hidden');
  }

  function startBatch(options) {
    options = typeof options === 'boolean' ? { matrix: options } : (options || {});
    if (batchWorker) batchWorker.terminate();
    batchWorker = new Worker('src/batch-worker.js');
    var count = options.long ? Math.max(1, Math.min(Number(byId('batchCount').value) || 10, 100000)) : Math.max(1, Number(byId('batchCount').value) || 10);
    byId('batchProgressBar').style.width = '0%';
    byId('batchProgressText').textContent = options.long ? '正在运行 12 年长期抽样……' : options.matrix ? '正在运行 45 组矩阵……' : '正在运行……';
    byId('batchOutput').textContent = '批量模拟在后台运行，页面仍可操作。';
    batchWorker.onmessage = function (event) {
      var data = event.data;
      if (data.type === 'progress') {
        byId('batchProgressBar').style.width = Math.round(data.done / data.total * 100) + '%';
        byId('batchProgressText').textContent = data.done + ' / ' + data.total;
      } else if (data.type === 'complete') {
        batchResult = data.result;
        byId('batchProgressBar').style.width = '100%';
        byId('batchProgressText').textContent = '完成';
        byId('batchOutput').textContent = JSON.stringify(data.result, null, 2);
        byId('exportBatchButton').classList.remove('hidden');
        T.send('alpha_batch_complete', { mode: 'qa' });
        batchWorker.terminate();
        batchWorker = null;
      } else if (data.type === 'error') {
        byId('batchProgressText').textContent = '失败';
        byId('batchOutput').textContent = data.message;
        batchWorker.terminate();
        batchWorker = null;
      }
    };
    batchWorker.postMessage({ count: count, seed: 20260902, playerPreset: byId('batchPlayer').value, teamPreset: byId('batchTeam').value, plan: 'balanced', matrix: !!options.matrix, long: !!options.long });
  }

  document.addEventListener('click', function (event) {
    var target = event.target.closest ? event.target.closest('[data-v3-begin],[data-v3-choice],[data-v3-skip],[data-v3-montage-continue],[data-v3-round-continue],[data-v3-details],[data-v3-close-details],[data-v3-replay-same],[data-v3-new-seed]') : null;
    if (target && state) {
      try {
        if (target.dataset.v3Begin !== undefined) V3.begin(state);
        else if (target.dataset.v3Choice) {
          var choiceResult = V3.choose(state, target.dataset.v3Choice);
          T.send('alpha_v3_choice', { mode: 'v3', scenarioId: state.v3.scenarioId, round: state.v3.round, choiceId: choiceResult.choiceId, route: choiceResult.route });
        }
        else if (target.dataset.v3Skip !== undefined || target.dataset.v3MontageContinue !== undefined) {
          if (target.dataset.v3Skip !== undefined) T.send('alpha_v3_match_montage_skip', { mode: 'v3' });
          V3.finishMontage(state);
        } else if (target.dataset.v3RoundContinue !== undefined) {
          var completedRound = state.v3.round;
          V3.continue(state);
          T.send('alpha_v3_round_complete', { mode: 'v3', scenarioId: state.v3.scenarioId, round: completedRound });
        }
        else if (target.dataset.v3Details !== undefined) { UI.openDetails(state); T.send('alpha_v3_details_open', { mode: 'v3', scenarioId: state.v3.scenarioId, round: state.v3.round }); return; }
        else if (target.dataset.v3CloseDetails !== undefined) { document.getElementById('detailsDrawer').classList.add('hidden'); return; }
        else if (target.dataset.v3ReplaySame !== undefined) { T.send('alpha_v3_replay_same_seed', { mode: 'v3', scenarioId: state.v3.scenarioId, round: state.v3.round }); return start(state.seed); }
        else if (target.dataset.v3NewSeed !== undefined) { T.send('alpha_v3_new_seed', { mode: 'v3', scenarioId: state.v3.scenarioId, round: state.v3.round }); return start(newSeed(state.seed)); }
        save();
        render();
        if (state.pending.type === 'stage_result') T.send('alpha_v3_stage_complete', { mode: 'v3', scenarioId: state.v3.scenarioId, round: state.v3.round });
      } catch (error) {
        byId('storageStatus').textContent = error.message;
      }
      return;
    }
    if (event.target.id === 'startStageButton') return start();
    if (event.target.id === 'continueStageButton') return continueSaved();
    if (event.target.id === 'clearDataButton') { S.clear(); state = null; render(); return; }
    if (event.target.id === 'saveButton') { save(); return; }
    if (event.target.id === 'exportStageButton' && state) return download('owl_alpha_v3_stage_' + state.seed + '.json', S.exportState(state));
    if (event.target.id === 'backHomeButton') { UI.stopMontage(); state = null; render(); return; }
    if (event.target.id === 'openBatchButton') return showBatch();
    if (event.target.id === 'closeBatchButton') { if (state) render(); else { byId('batchScreen').classList.add('hidden'); byId('homeScreen').classList.remove('hidden'); } return; }
    if (event.target.id === 'runBatchButton') return startBatch({ matrix: false });
    if (event.target.id === 'runMatrixButton') return startBatch({ matrix: true });
    if (event.target.id === 'runLongButton') return startBatch({ long: true });
    if (event.target.id === 'exportBatchButton' && batchResult) return download('owl_alpha_batch_result.json', JSON.stringify(batchResult, null, 2));
  });

  T.send('alpha_v3_open', { mode: 'v3' });
  render();
})(typeof globalThis === 'undefined' ? this : globalThis);
