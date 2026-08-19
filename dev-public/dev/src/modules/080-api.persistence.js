(function(){
  'use strict';
  OWLCore.register('persistence',{
    capture:reason=>OWLCore.clone(window.__OWL_PUBLIC_BETA?.captureSave?.(reason)||null),
    restore:payload=>window.__OWL_PUBLIC_BETA?.restorePayload?.(payload),
    saveNow:reason=>window.__OWL_PUBLIC_BETA?.saveNow?.(reason),
    loadSlot:slot=>window.__OWL_PUBLIC_BETA?.loadSlot?.(slot),
    readSlot:slot=>OWLCore.clone(window.__OWL_PUBLIC_BETA?.readSlot?.(slot)||null),
    exportWorld:()=>OWLCore.clone(window.__OWL_V800_WORLD_IO?.export?.()||null),
    importWorld:payload=>window.__OWL_V800_WORLD_IO?.import?.(payload)
  },{domain:'persistence',managerReady:true,stability:'stable'});
})();
