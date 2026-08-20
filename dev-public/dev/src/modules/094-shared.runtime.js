/* OWL Alpha1 · shared runtime seams
 *
 * Era patches own rules and presentation details. This module owns the small
 * pieces of lifecycle that must stay identical across those adapters.
 */
(() => {
  'use strict';

  const root=window.__OWL_RUNTIME||{};
  const render=root.render||{};
  const simulation=root.simulation||{};
  const hooks=new Map(),wrapped=new Map();
  const WHOLE_FLAGS=['v13WholeSimActive','v17WholeActive','v18WholeActive','b2WholeActive','v34WholeActive'];
  const STABLE_TITLE='OWL 选手之路 · 2.0 Alpha 1';
  const RELEASE='2.0 Alpha 1 · Living World Foundation';
  const VERSION='2.0 Alpha 1';

  function syncReleaseMeta(){
    document.title=STABLE_TITLE;
    document.querySelectorAll('.cover-version b').forEach(x=>{x.textContent='OWL 2.0 · ALPHA 1';});
    document.querySelectorAll('.setting-row').forEach(row=>{
      if(row.querySelector('.setting-copy strong')?.textContent==='当前版本'&&row.lastElementChild)row.lastElementChild.textContent=RELEASE;
    });
    if(window.OWLCore){window.OWLCore.version=VERSION;window.OWLCore.release=RELEASE;}
    if(window.__OWL_PUBLIC_BETA){window.__OWL_PUBLIC_BETA.version=VERSION;window.__OWL_PUBLIC_BETA.release=RELEASE;}
    if(window.__OWL_WORLD_CUP)window.__OWL_WORLD_CUP.version=VERSION;
  }

  function installStableTitle(){
    if(window.__OWL_STABLE_TITLE_LOCKED)return;
    const descriptor=Object.getOwnPropertyDescriptor(Document.prototype,'title');
    if(descriptor?.get&&descriptor?.set){
      try{
        Object.defineProperty(document,'title',{configurable:true,enumerable:false,get:()=>descriptor.get.call(document),set:()=>descriptor.set.call(document,STABLE_TITLE)});
        window.__OWL_STABLE_TITLE_LOCKED=true;
      }catch(_){/* Older browsers may not allow an instance title override. */}
    }
  }

  function register(name,key,fn){
    if(typeof fn!=='function')return false;
    let group=hooks.get(name);if(!group){group=new Map();hooks.set(name,group)}group.set(key,fn);
    if(wrapped.has(name))return true;
    const base=globalThis[name];if(typeof base!=='function')return false;
    globalThis[name]=function(){const out=base.apply(this,arguments);for(const hook of group.values())hook.apply(this,arguments);return out;};
    wrapped.set(name,globalThis[name]);return true;
  }

  function clearTimer(){if(seasonState?.timer){clearTimeout(seasonState.timer);seasonState.timer=null;}}
  function pauseWhole(){
    const active=WHOLE_FLAGS.some(key=>!!seasonState?.[key]);
    if(!active)return false;
    WHOLE_FLAGS.forEach(key=>{if(seasonState)seasonState[key]=false;});
    if(seasonState)seasonState.simulating=false;
    clearTimer();
    window.__OWL_B2_FAST_BATCH=false;window.__OWL_V16_SEASON_BATCHING=false;
    return true;
  }
  function stopWhole(message=''){
    pauseWhole();
    if(seasonState)seasonState.simulating=false;
    window.__OWL_B2_FAST_BATCH=false;window.__OWL_V16_SEASON_BATCHING=false;
    if(message){const note=document.getElementById('seasonSimNote');if(note)note.textContent=message;}
    if(typeof renderSeason==='function')renderSeason();
  }
  function resumeWhole(delay=160){
    const runner=globalThis.v35SimulateWholeSeason||globalThis.__OWL_V18_FULL_SEASON;
    if(!seasonState||seasonState.played>=seasonState.total||typeof runner!=='function')return false;
    setTimeout(()=>{if(!seasonState.simulating&&seasonState.played<seasonState.total)runner();},delay);
    return true;
  }
  function pauseFast(){
    const was=!!seasonState?.simulating;
    if(seasonState)seasonState.simulating=false;
    clearTimer();
    if(was&&seasonState)seasonState.resumeFastAfterEvent=true;
    return was;
  }
  function resumeFastAfterEvent({message='事件处理完成，继续模拟剩余常规赛。',delay=450}={}){
    if(!seasonState?.resumeFastAfterEvent||seasonState.played>=seasonState.total)return false;
    const runner=globalThis.fastSeasonStep;if(typeof runner!=='function')return false;
    seasonState.resumeFastAfterEvent=false;seasonState.simulating=true;
    const note=document.getElementById('seasonSimNote');if(note)note.textContent=message;
    if(typeof renderSeason==='function')renderSeason();
    seasonState.timer=setTimeout(runner,delay);return true;
  }
  function resumeAfterEvent(options={}){
    if(seasonState?.resumeWholeAfterEvent){seasonState.resumeWholeAfterEvent=false;return resumeWhole(options.wholeDelay??180);}
    return resumeFastAfterEvent(options);
  }

  Object.assign(render,{register,syncReleaseMeta});
  Object.assign(simulation,{wholeFlags:WHOLE_FLAGS,captureWhole:()=>WHOLE_FLAGS.some(key=>!!seasonState?.[key]),pauseWhole,stopWhole,resumeWhole,pauseFast,resumeFastAfterEvent,resumeAfterEvent,clearTimer});
  root.render=render;root.simulation=simulation;window.__OWL_RUNTIME=root;
  installStableTitle();syncReleaseMeta();
})();
