/* OWL Alpha1 Batch 2 · stabilize the document title during simulation */
(() => {
  'use strict';

  const STABLE_TITLE='OWL 选手之路 · 2.0 Alpha 1';
  const descriptor=Object.getOwnPropertyDescriptor(Document.prototype,'title');
  if(descriptor?.get&&descriptor?.set){
    try{
      Object.defineProperty(document,'title',{
        configurable:true,
        enumerable:false,
        get:()=>descriptor.get.call(document),
        set:()=>descriptor.set.call(document,STABLE_TITLE)
      });
    }catch(_){/* Older browsers may not allow an instance title override. */}
  }
  document.title=STABLE_TITLE;
})();
