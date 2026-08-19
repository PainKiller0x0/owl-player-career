/* ============================================================================
   OWL Core Module Registry
   Stable module/API boundary shared by Player Career and future Manager mode.
   ========================================================================== */
(function(global){
  'use strict';
  const records=new Map();
  const clone=value=>{try{return structuredClone(value);}catch(_){try{return JSON.parse(JSON.stringify(value));}catch(__){return value;}}};
  function register(name,api,meta={}){
    if(!name||typeof name!=='string')throw new TypeError('OWLCore.register requires a module name');
    if(records.has(name))throw new Error(`OWLCore module already registered: ${name}`);
    const value=typeof api==='function'?api(core):api;
    records.set(name,{api:value||{},meta:Object.freeze({...meta,name})});
    return value;
  }
  function get(name){const rec=records.get(name);if(!rec)throw new Error(`OWLCore module not registered: ${name}`);return rec.api;}
  function optional(name){return records.get(name)?.api||null;}
  function list(){return [...records.values()].map(r=>({...r.meta,keys:Object.keys(r.api||{})}));}
  const core={contractVersion:1,register,get,optional,has:name=>records.has(name),list,clone};
  global.OWLCore=core;
})(window);
