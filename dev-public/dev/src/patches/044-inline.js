
/* ======================================================================
   OWL选手之路 · Public Beta 1.5 RC1
   P0: saves / migration / recovery / diagnostics / soak surface
   P1: onboarding / offseason hero training / in-season trade / career card
   ====================================================================== */
(function(){
  const GAME_VERSION='2.0 Alpha 1 · Living World Foundation';
  const INTERNAL_VERSION='V10.0.0';
  const SAVE_VERSION=1;
  const SLOT_COUNT=3;
  const KEY_PREFIX='owl_player_path_public_save_';
  const CURRENT_SLOT_KEY='owl_player_path_current_slot_v1';
  const RECOVERY_KEY='owl_player_path_recovery_v1';
  const RECOVERY_SLOT_KEY='owl_player_path_recovery_slot_v1';
  const ONBOARD_KEY='owl_player_path_onboarding_seen_v1';
  let autosaveTimer=null,restoring=false,saveManagerMode='manage',importTargetSlot=null,lastSaveFailureAt=0,saveFailureNotified=false;
  const deletedSlots=new Set();
  careerState.v800Trade=careerState.v800Trade||null;
  careerState.tradeHistory=careerState.tradeHistory||[];

  const $=s=>document.querySelector(s);
  const clone=v=>JSON.parse(JSON.stringify(v,(k,x)=>{
    if(typeof x==='function')return undefined;
    if(k==='timer'||k==='resetArmTimer')return null;
    return x;
  }));
  const nowIso=()=>new Date().toISOString();
  function toast(msg){const n=$('#v800Toast');if(!n)return;n.textContent=msg;n.classList.add('show');clearTimeout(n._t);n._t=setTimeout(()=>n.classList.remove('show'),1700);}
  function getCurrentSlot(){const n=Number(localStorage.getItem(CURRENT_SLOT_KEY)||1);return n>=1&&n<=SLOT_COUNT?n:1}
  function setCurrentSlot(n){n=Math.max(1,Math.min(SLOT_COUNT,Number(n)||1));localStorage.setItem(CURRENT_SLOT_KEY,String(n));renderSaveIndicator();return n}
  function slotKey(n){return`${KEY_PREFIX}${n}`}
  function backupKey(n){return`${KEY_PREFIX}${n}_backup`}
  function activeScreen(){return document.querySelector('.screen.active')?.id?.replace(/Screen$/,'')||'cover'}
  function safeScreen(){
    const s=activeScreen();
    if(s==='match')return matchState.context==='playoff'?'playoff':'season';
    return s;
  }
  function teamMetaSnapshot(){
    return TEAMS.map(t=>({short:t.short,name:t.name,active:t.active!==false,strength:Number(t.strength||80),division:t.division||null,conference:t.conference||null}));
  }
  function captureSave(reason='auto'){
    if(restoring||!isResumablePayload({state,careerState,seasonState}))return null;
    return{
      saveVersion:SAVE_VERSION,gameVersion:GAME_VERSION,internalVersion:INTERNAL_VERSION,savedAt:nowIso(),reason,screen:safeScreen(),
      state:clone(state),careerState:clone(careerState),seasonState:clone(seasonState),playoffState:clone(playoffState),offseasonState:clone(offseasonState),
      injuryState:clone(injuryState),careerViewState:clone(careerViewState),gameSettings:clone(gameSettings),
      teamMeta:teamMetaSnapshot(),fantasyWorld:window.__OWL_V800_WORLD_IO?.export?.()||null
    };
  }
  function summaryFromPayload(p){
    const c=p?.careerState||{},s=p?.state||{};
    return{
      name:s.playerName||'Rookie',role:s.role||'未选位置',team:c.team?.name||c.contract?.teamName||'尚未签约',
      year:Number(c.seasonYear||p?.fantasyWorld?.selection?.startYear||2019),age:Number(c.age||16),careerYears:Number(c.careerYears||1),
      mode:c.simulationMode==='history'?'历史模拟':'梦幻模拟',savedAt:p?.savedAt||null,retired:!!c.retired,screen:p?.screen||'cover'
    };
  }
  function isResumablePayload(p){
    const s=p?.state||{},c=p?.careerState||{},season=p?.seasonState||{};
    return !!(
      s.role||c.team||c.contract||c.retired||
      Object.keys(s.locked||{}).length||
      (Array.isArray(c.careerArchive)&&c.careerArchive.length)||
      (Array.isArray(c.roleHistory)&&c.roleHistory.length)||
      season.active||Number(season.played)>0||
      Number(c.careerYears)>1||Number(c.peakOvr)>0||
      (s.playerName&&s.playerName!=='Rookie')
    );
  }
  function migrateSave(raw){
    if(typeof raw==='string'){try{raw=JSON.parse(raw)}catch(_){throw new Error('存档JSON无法解析')}}
    // 兼容早期测试脚本/手工备份可能多包一层 payload/save/data。
    if(raw&&typeof raw==='object'&&!raw.careerState){
      const nested=raw.payload||raw.save||raw.data;
      if(nested&&typeof nested==='object'&&nested.careerState)raw=nested;
    }
    if(!raw||typeof raw!=='object')throw new Error('存档不是有效对象');
    let p=clone(raw),v=Number(p.saveVersion||0);
    if(v===0){
      // Earliest beta imports: tolerate missing metadata if the core state exists.
      if(!p.careerState||!p.state)throw new Error('无法识别的旧存档格式');
      p.saveVersion=1;p.gameVersion=p.gameVersion||'Legacy Import';p.savedAt=p.savedAt||nowIso();v=1;
    }
    if(v>SAVE_VERSION)throw new Error(`该存档版本(${v})高于当前游戏支持版本(${SAVE_VERSION})`);
    p.state=p.state||{};p.careerState=p.careerState||{};p.seasonState=p.seasonState||{};p.playoffState=p.playoffState||{};p.offseasonState=p.offseasonState||{};
    p.injuryState=p.injuryState||{};p.careerViewState=p.careerViewState||{tab:'overview'};p.gameSettings=p.gameSettings||{};
    // 1.1 RC2：旧档没有“开局年龄”字段时，从首季档案/当前年龄与生涯年数反推；历史旧档默认仍保持16岁起步。
    const firstArchiveAge=Number(p.careerState.careerArchive?.[0]?.age);
    const inferredStartAge=Number.isFinite(firstArchiveAge)&&firstArchiveAge>0?firstArchiveAge:Number(p.careerState.age||16)-Math.max(0,Number(p.careerState.careerYears||1)-1);
    const startAge=Math.max(16,Math.min(26,Math.round(Number(p.state.playerStartAge||p.careerState.startAge||inferredStartAge)||16)));
    p.state.playerStartAge=startAge;p.careerState.startAge=startAge;
    if(!Number.isFinite(Number(p.careerState.birthYear))){const inferredStartYear=Number(p.careerState.startYear||(Number(p.careerState.seasonYear||2019)-Math.max(0,Number(p.careerState.careerYears||1)-1))||2019);p.careerState.birthYear=inferredStartYear-startAge;}
    p.careerState.tradeHistory=p.careerState.tradeHistory||[];
    // match页不直接恢复：比赛中的计时器/临时DOM不是持久状态，回到赛季/季后赛最安全。
    if(p.screen==='match')p.screen=p.matchState?.context==='playoff'?'playoff':'season';
    if(!['cover','mode','builder','role','reveal','team','season','playoff','summary','career','offseason','retirement','retiredCareer'].includes(p.screen))p.screen=p.careerState?.team?'season':'builder';
    p.saveVersion=SAVE_VERSION;
    return p;
  }
  function parseStored(key){
    const raw=localStorage.getItem(key);if(!raw)return null;
    return migrateSave(JSON.parse(raw));
  }
  function readSlot(n,allowBackup=true){
    let primaryError=null,backupError=null;
    try{const p=parseStored(slotKey(n));if(p)return{payload:p,backup:false,recovery:false,error:null};}
    catch(err){primaryError=String(err.message||err);}
    if(allowBackup){
      try{const b=parseStored(backupKey(n));if(b)return{payload:b,backup:true,recovery:false,error:primaryError};}
      catch(err){backupError=String(err.message||err);}
      try{
        const recoverySlot=Number(localStorage.getItem(RECOVERY_SLOT_KEY)||getCurrentSlot());
        if(recoverySlot===Number(n)){const r=parseStored(RECOVERY_KEY);if(r)return{payload:r,backup:false,recovery:true,error:primaryError||backupError};}
      }catch(err){backupError=backupError||String(err.message||err);}
    }
    return{payload:null,backup:false,recovery:false,error:primaryError||backupError};
  }
  function writeSlot(n,payload,reason='auto'){
    n=Number(n);
    const explicitWrite=['manual','import','new-career'].includes(reason);
    if(deletedSlots.has(n)&&!explicitWrite)return false;
    if(explicitWrite)deletedSlots.delete(n);
    const key=slotKey(n),serialized=JSON.stringify(payload);
    const commit=()=>{localStorage.setItem(key,serialized);localStorage.setItem(RECOVERY_KEY,serialized);localStorage.setItem(RECOVERY_SLOT_KEY,String(n));setCurrentSlot(n);const ind=$('#v800SaveIndicator');if(ind)ind.textContent=`💾 槽位${n} · ${reason==='auto'?'已自动保存':'已保存'}`;if(reason!=='auto'||activeScreen()!=='cover')refreshCoverSavePanel();return true;};
    try{
      const old=localStorage.getItem(key);
      if(old)localStorage.setItem(backupKey(n),old);
      return commit();
    }catch(err){
      const quota=err?.name==='QuotaExceededError'||Number(err?.code)===22||/quota|exceed/i.test(`${err?.name||''} ${err?.message||''}`);
      if(quota){try{localStorage.removeItem(backupKey(n));localStorage.removeItem(RECOVERY_KEY);localStorage.removeItem(RECOVERY_SLOT_KEY);return commit();}catch(retryErr){err=retryErr;}}
      console.error('[save]',err);
      const ind=$('#v800SaveIndicator');if(ind){ind.textContent='⚠️ 本地存储暂不可用';ind.title=String(err?.message||err||'浏览器存储不可用');}
      // 自动保存、切后台和关页失败时不再反复飘字。只在明确手动保存/导入/新建时提示，
      // 后台失败最多每60秒记录一次被动状态，避免把正常试玩变成错误提示弹幕。
      const now=Date.now(),interactive=['manual','import','new-career'].includes(reason);
      if(interactive||(!saveFailureNotified&&now-lastSaveFailureAt>60000)){
        lastSaveFailureAt=now;saveFailureNotified=true;
        if(interactive)toast('⚠️ 本地存储不可用，本次未保存');
      }
      return false
    }
  }
  function autosave(reason='auto',delay=100){
    if(restoring||!isResumablePayload({state,careerState,seasonState}))return;
    // 先在触发点抓快照，再延迟写盘。否则玩家从赛季页切回封面后，
    // 上一个页面排队中的 autosave 会把 screen 错写成 cover，导致“继续生涯”看似无效。
    const payload=captureSave(reason);if(!payload)return;
    clearTimeout(autosaveTimer);
    const slot=getCurrentSlot();
    autosaveTimer=setTimeout(()=>writeSlot(slot,payload,'auto'),delay);
  }
  function saveNow(reason='manual'){const p=captureSave(reason);if(!p)return false;const ok=writeSlot(getCurrentSlot(),p,reason);if(ok&&reason!=='auto')toast(`✓ 已保存到槽位 ${getCurrentSlot()}`);return ok}
  function isOwlSaveStorageKey(key){
    const k=String(key||'');
    if(!/^owl(?:_|-)/i.test(k))return false;
    // 明确保留主题与玩法设置；这里只清“存档数据”，不把用户偏好一起扬了。
    if(k==='owl-career-theme'||Object.values(typeof SETTINGS_KEYS==='object'?SETTINGS_KEYS:{}).includes(k))return false;
    if(k===CURRENT_SLOT_KEY||k===RECOVERY_KEY||k===RECOVERY_SLOT_KEY)return true;
    if(k.startsWith(KEY_PREFIX))return true;
    // 兼容更早测试版可能使用过的 save / slot / recovery / career 存档命名。
    return /(?:^|[_-])(save|saves|slot|slots|recovery|autosave|career)(?:[_-]|$)/i.test(k);
  }
  function localSaveKeys(){
    try{
      const keys=[];
      for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&isOwlSaveStorageKey(k))keys.push(k)}
      return [...new Set(keys)];
    }catch(_){return[]}
  }
  function deleteSlot(n){
    n=Number(n);clearTimeout(autosaveTimer);autosaveTimer=null;deletedSlots.add(n);
    localStorage.removeItem(slotKey(n));localStorage.removeItem(backupKey(n));
    // recovery 是按槽位共用的一份紧急恢复点；删对应槽位时必须一起删，否则存档会“复活”。
    const recoverySlot=Number(localStorage.getItem(RECOVERY_SLOT_KEY)||0);
    if(recoverySlot===n){localStorage.removeItem(RECOVERY_KEY);localStorage.removeItem(RECOVERY_SLOT_KEY)}
    refreshCoverSavePanel();renderSaveManager();
  }
  function clearAllLocalSaves(){
    clearTimeout(autosaveTimer);autosaveTimer=null;
    const keys=localSaveKeys();
    for(let n=1;n<=SLOT_COUNT;n++)deletedSlots.add(n);
    keys.forEach(k=>{try{localStorage.removeItem(k)}catch(_){}});
    // 上面的扫描已经覆盖当前键；这里再显式清一次，防止极端浏览器枚举异常。
    [CURRENT_SLOT_KEY,RECOVERY_KEY,RECOVERY_SLOT_KEY].forEach(k=>{try{localStorage.removeItem(k)}catch(_){}});
    for(let n=1;n<=SLOT_COUNT;n++){try{localStorage.removeItem(slotKey(n));localStorage.removeItem(backupKey(n))}catch(_){}}
    refreshCoverSavePanel();renderSaveManager();renderSaveIndicator();
    toast(`✓ 已清空本文件可见的 ${keys.length||'全部'} 项OWL存档数据`);
    return keys;
  }
  function latestSlot(){
    const rows=[];for(let i=1;i<=SLOT_COUNT;i++){const r=readSlot(i);if(r.payload&&isResumablePayload(r.payload))rows.push({slot:i,p:r.payload})}
    return rows.sort((a,b)=>String(b.p.savedAt||'').localeCompare(String(a.p.savedAt||'')))[0]||null;
  }
  function downloadText(name,text,type='application/json'){
    const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);
  }
  function exportSlot(n=getCurrentSlot()){
    const r=readSlot(n);if(!r.payload){toast('这个槽位还没有存档');return}
    const s=summaryFromPayload(r.payload),name=`owl_career_${String(s.name).replace(/[^\w\u4e00-\u9fff-]+/g,'_')}_${s.year}_slot${n}.json`;
    downloadText(name,JSON.stringify(r.payload,null,2));toast(`✓ 已导出槽位 ${n}`);
  }

  function resolveTeam(v){
    if(!v)return v;
    const short=typeof v==='object'?v.short:null,name=typeof v==='object'?v.name:String(v);
    return TEAMS.find(t=>(short&&t.short===short)||t.name===name)||v;
  }
  function reviveRefs(v,key=''){
    if(Array.isArray(v))return v.map(x=>reviveRefs(x,key));
    if(!v||typeof v!=='object')return v;
    if(['team','opponent','homeTeam','awayTeam','winner','runnerUp','champion','teamA','teamB'].includes(key)&&(v.short||v.name))return resolveTeam(v);
    const out={};
    Object.entries(v).forEach(([k,x])=>out[k]=reviveRefs(x,k));
    return out;
  }
  function assignRoot(target,src){
    Object.keys(target).forEach(k=>{if(!(k in src)&&['timer','resetArmTimer'].includes(k))target[k]=null});
    Object.assign(target,clone(src||{}));
  }
  function applyTeamMeta(meta=[]){
    meta.forEach(m=>{const t=TEAMS.find(x=>x.short===m.short||x.name===m.name);if(t){t.active=m.active!==false;t.strength=Number(m.strength||t.strength||80);if(m.division!=null)t.division=m.division;if(m.conference!=null)t.conference=m.conference}})
  }
  function renderRestoredScreen(screen){
    try{
      renderLockedAttrs();renderBuildSummary();renderCareerTeam();
      if(screen==='role')renderRoleCards();
      else if(screen==='reveal')renderRevealScreen();
      else if(screen==='team')renderCareerTeam();
      else if(screen==='season')renderSeason();
      else if(screen==='playoff')renderPlayoffs();
      else if(screen==='summary')renderSeasonSummary();
      else if(screen==='career')renderCareerHub();
      else if(screen==='offseason')renderOffseason();
      else if(screen==='retirement')renderRetirementScreen();
      else if(screen==='retiredCareer')renderRetiredCareerResume();
    }catch(err){console.warn('[restore render fallback]',err);screen=careerState.team?'season':'builder'}
    showScreen(screen||'season');
  }
  function restorePayload(raw,slot=null){
    const p=migrateSave(raw);restoring=true;let ok=false;
    try{
      if(seasonState.timer){clearTimeout(seasonState.timer);seasonState.timer=null}
      window.__OWL_V800_WORLD_IO?.import?.(p.fantasyWorld||{selection:{mode:p.careerState?.simulationMode||'fantasy',startYear:p.careerState?.startYear||2019}});
      applyTeamMeta(p.teamMeta||[]);
      assignRoot(state,p.state);assignRoot(careerState,reviveRefs(p.careerState));assignRoot(seasonState,reviveRefs(p.seasonState));
      assignRoot(playoffState,reviveRefs(p.playoffState));assignRoot(offseasonState,reviveRefs(p.offseasonState));assignRoot(injuryState,p.injuryState);assignRoot(careerViewState,p.careerViewState);
      Object.assign(gameSettings,p.gameSettings||{});
      state.team=resolveTeam(state.team);careerState.team=resolveTeam(careerState.team);
      seasonState.opponents=(seasonState.opponents||[]).map(resolveTeam);seasonState.timer=null;seasonState.resetArmTimer=null;seasonState.simulating=false;
      if(playoffState.teams)playoffState.teams=playoffState.teams.map(resolveTeam);
      (offseasonState.offers||[]).forEach(o=>o.team=resolveTeam(o.team));
      if(offseasonState.signedOffer?.team)offseasonState.signedOffer.team=resolveTeam(offseasonState.signedOffer.team);
      matchState.simulating=false;matchState.finished=false;
      if(slot)setCurrentSlot(slot);
      // Any restored save represents an already-created career. This migration makes the next newly-created character
      // eligible for role training even when the restored first career has not retired yet.
      markCareerStartedOnce();
      renderGameSettings();renderRestoredScreen(p.screen==='cover'?(careerState.team?'season':state.role?'builder':'role'):(p.screen||'season'));
      refreshCoverSavePanel();ok=true;
    }finally{restoring=false}
    // 必须在 restoring=false 后重新抓取，否则 captureSave 会返回 null 并把槽位写坏。
    if(ok&&slot){const clean=captureSave('restore-clean');if(clean)writeSlot(slot,clean,'restore-clean')}
    if(ok)toast(`✓ 生涯已恢复${slot?` · 槽位${slot}`:''}`);
    return ok;
  }
  function loadSlot(n){
    const r=readSlot(n);
    if(!r.payload){toast(r.error?'存档损坏且没有可用备份':'这个槽位还没有存档');return false}
    if(!isResumablePayload(r.payload)){toast('这个槽位还没有开始生涯，不能继续');return false}
    try{
      const ok=restorePayload(r.payload,n);closeSaveManager();
      if(r.backup)toast('⚠️ 主存档不可用，已恢复上一份备份');
      else if(r.recovery)toast('⚠️ 主档与备份不可用，已从紧急恢复点恢复');
      return ok;
    }catch(err){console.error('[load]',err);toast(`恢复失败：${err.message||err}`);return false}
  }

  function renderSaveIndicator(){const i=$('#v800SaveIndicator');if(i)i.textContent=`💾 当前槽位 ${getCurrentSlot()}`}
  function refreshCoverSavePanel(){
    const host=$('#coverScreen .cover-actions')?.parentElement;if(!host)return;
    let box=$('#v800CoverSaves');if(!box){box=document.createElement('div');box.id='v800CoverSaves';box.className='v800-cover-saves';host.querySelector('.cover-actions')?.insertAdjacentElement('afterend',box)}
    const latest=latestSlot(),fileMode=location.protocol==='file:';
    let saveBody='';
    if(latest){
      const s=summaryFromPayload(latest.p),d=s.savedAt?new Date(s.savedAt).toLocaleString():'—';
      saveBody=`<div class="v800-latest-save"><div><b>${s.retired?'🏁 ':''}${s.name} · ${s.role}</b><span>${s.year} · ${s.team} · ${s.age}岁 · 第${s.careerYears}赛季 · ${s.mode}</span><small>槽位${latest.slot} · ${d}</small></div><div class="actions"><button class="primary-btn" id="v800ContinueLatest" type="button">继续生涯 →</button></div></div>`;
    }else{
      saveBody=`<div class="v800-save-empty">还没有读取到当前文件对应的本机存档。${fileMode?'如有旧版JSON备份，可直接点“导入旧档JSON”。':''}</div>`;
    }
    const fileWarning=fileMode?'<div style="margin-top:8px;font-size:9px;line-height:1.55;color:var(--muted)">⚠ 本地HTML请始终使用固定文件名 <b>OWL选手之路.html</b>，升级时直接覆盖。长档建议额外导出JSON。</div>':'';
    box.innerHTML=`<div class="v800-cover-save-head"><strong>💾 本机生涯存档</strong><div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end"><button class="secondary-btn" id="v802CoverImport" type="button">导入旧档JSON</button><button class="secondary-btn" id="v800ManageSaves" type="button">管理3个档位</button></div></div>${saveBody}${fileWarning}`;
    $('#v800ManageSaves')?.addEventListener('click',()=>openSaveManager('manage'));
    $('#v800ContinueLatest')?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();const btn=e.currentTarget;if(btn.dataset.loading)return;btn.dataset.loading='1';btn.disabled=true;try{latest&&loadSlot(latest.slot)}finally{setTimeout(()=>{btn.disabled=false;delete btn.dataset.loading},120)}});
    $('#v802CoverImport')?.addEventListener('click',()=>{importTargetSlot=getCurrentSlot();$('#v800ImportInput')?.click()});
  }
  // 兜底：封面/存档管理器会反复重绘，使用事件委托确保“继续”永远不会因为DOM重建丢失点击事件。
  document.addEventListener('click',e=>{
    const slotBtn=e.target?.closest?.('[data-load-slot]');
    if(slotBtn){e.preventDefault();loadSlot(Number(slotBtn.dataset.loadSlot));}
  });

  function renderSaveManager(){
    const grid=$('#v800SaveGrid');if(!grid)return;const current=getCurrentSlot();
    grid.innerHTML=Array.from({length:SLOT_COUNT},(_,i)=>{
      const n=i+1,r=readSlot(n),p=r.payload;
       if(!p||!isResumablePayload(p))return`<div class="v800-save-card ${current===n?'active':''}"><div class="slot">SLOT ${n}</div><div class="v800-save-empty"><div>空档位<br><small>${p?'尚未开始生涯，可直接覆盖':r.error?'检测到损坏数据，可覆盖':'可以开始一段新生涯'}</small></div></div><div class="v800-save-actions"><button class="primary-btn" data-new-slot="${n}">新生涯</button><button class="secondary-btn" data-import-slot="${n}">导入</button></div></div>`;
      const s=summaryFromPayload(p),time=s.savedAt?new Date(s.savedAt).toLocaleString():'—';
      return`<div class="v800-save-card ${current===n?'active':''}"><div class="slot">SLOT ${n}${r.backup?' · BACKUP RECOVERED':r.recovery?' · RECOVERY POINT':''}</div><h3>${s.retired?'🏁 ':''}${s.name}</h3><p>${s.year} · ${s.team}<br>${s.role} · ${s.age}岁 · 第${s.careerYears}赛季<br>${s.mode} · ${time}</p><div class="v800-save-actions"><button class="primary-btn" data-load-slot="${n}">继续</button><button class="secondary-btn" data-export-slot="${n}">导出</button><button class="secondary-btn" data-new-slot="${n}">覆盖新建</button><button class="secondary-btn" data-delete-slot="${n}">删除</button></div></div>`;
    }).join('');
    grid.querySelectorAll('[data-load-slot]').forEach(b=>b.onclick=()=>loadSlot(Number(b.dataset.loadSlot)));
    grid.querySelectorAll('[data-export-slot]').forEach(b=>b.onclick=()=>exportSlot(Number(b.dataset.exportSlot)));
    grid.querySelectorAll('[data-delete-slot]').forEach(b=>b.onclick=()=>{const n=Number(b.dataset.deleteSlot);if(confirm(`删除槽位 ${n}？该操作只删除本机浏览器里的这份存档。`))deleteSlot(n)});
    grid.querySelectorAll('[data-import-slot]').forEach(b=>b.onclick=()=>{importTargetSlot=Number(b.dataset.importSlot);$('#v800ImportInput').click()});
    grid.querySelectorAll('[data-new-slot]').forEach(b=>b.onclick=()=>{
      const n=Number(b.dataset.newSlot),has=isResumablePayload(readSlot(n).payload);
      if(has&&!confirm(`槽位 ${n} 已有生涯。确定覆盖并开始新生涯？`))return;
      deleteSlot(n);deletedSlots.delete(n);setCurrentSlot(n);closeSaveManager();showScreen('mode');toast(`新生涯将使用槽位 ${n}`);
    });
  }
  function openSaveManager(mode='manage'){saveManagerMode=mode;renderSaveManager();$('#v800SaveOverlay').classList.remove('ui-hidden')}
  function closeSaveManager(){$('#v800SaveOverlay').classList.add('ui-hidden')}
  $('#v800SaveClose').onclick=closeSaveManager;
  $('#v800ImportBtn').onclick=()=>{importTargetSlot=getCurrentSlot();$('#v800ImportInput').click()};
  $('#v800ClearAllSaves').onclick=()=>{if(confirm('彻底清空本文件可见的所有OWL生涯存档？\n\n会删除3个槽位、备份、紧急恢复点，以及可识别的旧版本存档残留；主题和玩法设置会保留。此操作不可撤销。'))clearAllLocalSaves()};
  $('#v800ImportInput').onchange=async e=>{
    const f=e.target.files?.[0];e.target.value='';if(!f)return;
    try{
      const p=migrateSave(JSON.parse(await f.text())),slot=importTargetSlot||getCurrentSlot();
      deletedSlots.delete(Number(slot));writeSlot(slot,p,'import');renderSaveManager();toast(`✓ 已导入到槽位 ${slot}`);
    }catch(err){toast(`导入失败：${err.message||err}`)}
  };

  // -------------------------------------------------------------------
  // Onboarding
  // -------------------------------------------------------------------
  const onboarding=[
    {icon:'🎮',title:'你只负责自己的职业生涯',copy:'你只控制自己的选手；队伍与联盟会自行运转。'},
    {icon:'⚡',title:'快速模拟',copy:'模拟单场、本赛段或完整赛季，不会跳过关键生涯节点。'},
    {icon:'💾',title:'自动存档',copy:'关键节点自动保存到3个本地档位；支持导出 / 导入 JSON。'}
  ];
  let onboardPage=0;
  function renderOnboard(){
    const x=onboarding[onboardPage];$('#v800OnboardBody').innerHTML=`<div class="v800-onboard-icon">${x.icon}</div><h2>${x.title}</h2><p>${x.copy}</p>`;
    $('#v800OnboardDots').innerHTML=onboarding.map((_,i)=>`<i class="${i===onboardPage?'on':''}"></i>`).join('');
    $('#v800OnboardNext').textContent=onboardPage===onboarding.length-1?'开始我的生涯 →':'下一页 →';
  }
  function finishOnboard(){localStorage.setItem(ONBOARD_KEY,'1');$('#v800Onboarding').classList.add('ui-hidden');showScreen('mode')}
  function openOnboard(){onboardPage=0;renderOnboard();$('#v800Onboarding').classList.remove('ui-hidden')}
  $('#v800OnboardNext').onclick=()=>{if(onboardPage<onboarding.length-1){onboardPage++;renderOnboard()}else finishOnboard()};
  $('#v800OnboardSkip').onclick=finishOnboard;

  // Intercept only when necessary. Existing V7.6 cover handler still owns normal new-career routing.
  document.addEventListener('click',e=>{
    if(!e.target?.closest?.('#coverStartBtn'))return;
    const empty=Array.from({length:SLOT_COUNT},(_,i)=>i+1).find(n=>!isResumablePayload(readSlot(n).payload));
    if(empty){deletedSlots.delete(empty);setCurrentSlot(empty);}
    else{
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openSaveManager('new');toast('3个档位都已有生涯，请选择要覆盖的槽位');return;
    }
    if(!localStorage.getItem(ONBOARD_KEY)){
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openOnboard();
    }
  },true);

  function addContextTip(host,key,html){
    if(!host||localStorage.getItem(`owl_public_tip_${key}`))return null;
    const existing=[...document.querySelectorAll('.v800-context-tip[data-v800-tip]')].filter(n=>n.dataset.v800Tip===key);
    if(existing.length){existing.slice(1).forEach(n=>n.remove());return existing[0]}
    const n=document.createElement('div');n.className='v800-context-tip';n.dataset.v800Tip=key;n.title='点击关闭此提示';n.innerHTML=`${html}<span style="float:right;opacity:.55;margin-left:8px">点击关闭 ×</span>`;
    n.addEventListener('click',()=>{localStorage.setItem(`owl_public_tip_${key}`,'1');document.querySelectorAll(`.v800-context-tip[data-v800-tip="${key}"]`).forEach(x=>x.remove())});
    host.prepend(n);return n;
  }

  // -------------------------------------------------------------------
  // Diagnostics / feedback surface
  // -------------------------------------------------------------------
  function diagnosticObject(){
    let major=null;try{major=seasonState.v71LastMajorSummary?.stage||null}catch(_){}
    return{
      gameVersion:GAME_VERSION,internalVersion:INTERNAL_VERSION,saveVersion:SAVE_VERSION,currentSlot:getCurrentSlot(),screen:activeScreen(),
      mode:careerState.simulationMode||'—',startYear:careerState.startYear||null,seasonYear:careerState.seasonYear||null,team:careerState.team?.name||null,
      player:state.playerName||'Rookie',role:state.role||null,age:careerState.age||null,careerYears:careerState.careerYears||null,
      regular:{played:seasonState.played,total:seasonState.total,wins:seasonState.wins,losses:seasonState.losses,stageBreak:seasonState.stageBreakPending||null,stageProcessed:seasonState.stageProcessed||[]},
      postseason:{round:playoffState.round||null,active:!!playoffState.active,majorSummary:major,allStarPending:!!seasonState.v71AllStarPending},
      contract:careerState.contract||null,trade:careerState.v800Trade||null,memories:(careerState.careerMemories||[]).length,
      world:window.__OWL_V800_WORLD_IO?.health?.(careerState.seasonYear)||null,userAgent:navigator.userAgent,ts:nowIso()
    };
  }
  function diagnosticText(){return JSON.stringify(diagnosticObject(),null,2)}
  async function copyText(t){try{await navigator.clipboard.writeText(t);return true}catch(_){const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();const ok=document.execCommand('copy');ta.remove();return ok}}
  function ensureDiagnostics(){
    const body=$('#settingsOverlay .settings-body');if(!body||$('#v800DiagnosticBox'))return;
    const box=document.createElement('div');box.id='v800DiagnosticBox';box.className='v800-diagnostic-box';
    box.innerHTML=`<strong style="font-size:11px">🐞 试玩反馈 / 诊断</strong><div style="font-size:9px;color:var(--muted);margin-top:3px">卡流程或数据不对时，复制诊断信息 + 导出当前存档，比只发截图更容易定位。</div><div class="v800-diagnostic-actions"><button class="primary-btn" id="v800ManualSave">立即保存</button><button class="secondary-btn" id="v800CopyDiag">复制诊断信息</button><button class="secondary-btn" id="v800ExportCurrent">导出当前存档</button><button class="secondary-btn" id="v800OpenSavesSetting">管理存档</button></div>`;
    body.appendChild(box);
    $('#v800ManualSave').onclick=()=>saveNow('manual');
    $('#v800CopyDiag').onclick=async()=>toast(await copyText(diagnosticText())?'✓ 诊断信息已复制':'复制失败');
    $('#v800ExportCurrent').onclick=()=>{saveNow('manual');exportSlot(getCurrentSlot())};
    $('#v800OpenSavesSetting').onclick=()=>openSaveManager('manage');
  }

  // -------------------------------------------------------------------
  // Offseason hero specialization: choose up to two heroes, once per offseason.
  // -------------------------------------------------------------------
  function heroTrainingYear(){return Number(careerState.seasonYear||2024)}
  function ensureHeroTrainingState(){
    offseasonState.v800HeroTraining=offseasonState.v800HeroTraining||{year:heroTrainingYear(),selected:[],done:false,results:[]};
    if(offseasonState.v800HeroTraining.year!==heroTrainingYear())offseasonState.v800HeroTraining={year:heroTrainingYear(),selected:[],done:false,results:[]};
    return offseasonState.v800HeroTraining;
  }
  function v826HeroBand(value){
    const v=Number(value||0);
    if(v>=95)return{label:'绝活',key:'master'};
    if(v>=90)return{label:'精通',key:'elite'};
    if(v>=82)return{label:'熟练',key:'skilled'};
    if(v>=72)return{label:'常用',key:'regular'};
    return{label:'待提升',key:'develop'};
  }
  function renderHeroSpecialization(wrap){
    if(Number(careerState.seasonYear)<2024||!window.__OWL_V800_HERO_IO)return;
    const h=ensureHeroTrainingState(),nextYear=Number(careerState.seasonYear)+1,pool=window.__OWL_V800_HERO_IO.pool(nextYear).slice(0,16);
    wrap.querySelector('.v800-hero-training')?.remove();
    const resultMap=new Map((h.results||[]).map(x=>[x.name,x]));
    const block=document.createElement('div');block.className='v800-hero-training';
    const cards=pool.map(x=>{
      const idx=h.selected.indexOf(x.name),r=resultMap.get(x.name),role=idx===0?'主练':idx===1?'副练':'';
      const roleTag=role?`<em class="v800-hero-role-tag ${idx===0?'primary':'secondary'}">${role}</em>`:'';
      const band=v826HeroBand(x.value),bandTag=`<em class="v826-hero-band ${band.key}">${band.label}</em>`;
      const gain=r?`<span class="v800-hero-gain">${Number(r.before).toFixed(1)} → <b>${Number(r.after).toFixed(1)}</b> <i>+${Number(r.delta).toFixed(2)}</i></span>`:'';
      return`<button class="v800-hero-pick ${idx>=0?'selected':''} ${r?'trained':''}" data-v800-hero="${x.name}" ${h.done?'disabled':''}><span class="v800-hero-pick-top"><strong>${x.name} · ${x.value.toFixed(1)} ${bandTag}</strong>${roleTag}</span><small>${x.label}${Number(x.proYear)===nextYear?' · 🆕 新赛季英雄':''}</small>${gain}</button>`;
    }).join('');
    const resultSummary=h.done&&h.results.length?`<div class="v800-hero-result-summary"><b>本次专项结果</b>${h.results.map(x=>`<span><em>${x.primary?'主练':'副练'}</em>${x.name}：${Number(x.before).toFixed(1)} → ${Number(x.after).toFixed(1)} <strong>+${Number(x.delta).toFixed(2)}</strong></span>`).join('')}</div>`:'';
    block.innerHTML=`<div class="offseason-kicker">OFFSEASON HERO LAB · 英雄专项</div><h4>最多训练2个英雄</h4><p>主练成长更高，副练较低；高熟练度成长更慢。</p>
      <div class="v800-hero-picks">${cards}</div>${resultSummary}
      <div class="v800-hero-training-foot"><span>${h.done?(h.results.length?'专项训练已完成，涨幅已标在对应英雄卡上。':'本休赛期未做英雄专项'):`已选 ${h.selected.length}/2${h.selected.length?' · 卡片右上角标明主练/副练':''}`}</span><div>${h.done?'':`<button class="secondary-btn v800-auto-hero-btn" id="v800AutoHeroTrain">⚡ 自动选择</button> <button class="secondary-btn" id="v800SkipHeroTrain">跳过专项</button> <button class="primary-btn" id="v800ApplyHeroTrain" ${h.selected.length?'':'disabled'}>完成英雄专项</button>`}</div></div>`;
    const actions=wrap.querySelector('.training-actions');if(actions)wrap.insertBefore(block,actions);else wrap.appendChild(block);
    block.querySelectorAll('[data-v800-hero]').forEach(b=>b.onclick=()=>{
      if(h.done)return;const n=b.dataset.v800Hero,i=h.selected.indexOf(n);
      if(i>=0)h.selected.splice(i,1);else if(h.selected.length<2)h.selected.push(n);else{h.selected.shift();h.selected.push(n)}
      renderOffseason();
    });
    $('#v800AutoHeroTrain')?.addEventListener('click',()=>{
      const below=[...pool].filter(x=>Number(x.value)<90).sort((a,b)=>Number(b.value)-Number(a.value)||String(a.name).localeCompare(String(b.name),'zh-CN'));
      h.selected=(below.length>=2?below:[...below,...pool.filter(x=>Number(x.value)>=90).sort((a,b)=>Number(a.value)-Number(b.value))]).slice(0,2).map(x=>x.name);
      renderOffseason();
    });
    $('#v800SkipHeroTrain')?.addEventListener('click',()=>{h.done=true;h.results=[];renderOffseason();autosave('hero-training-skip')});
    $('#v800ApplyHeroTrain')?.addEventListener('click',()=>{h.results=window.__OWL_V800_HERO_IO.train(h.selected,nextYear);h.done=true;renderOffseason();autosave('hero-training')});
  }

  // -------------------------------------------------------------------
  // In-season player trades V1 · 2024+ before the Major 2 deadline.
  // -------------------------------------------------------------------
  function tradeRoot(){
    if(!careerState.v800Trade||careerState.v800Trade.year!==careerState.seasonYear){
      careerState.v800Trade={year:careerState.seasonYear,checkpoints:[],completed:false,pending:null,requested:false};
    }
    return careerState.v800Trade;
  }
  function tradeEligible(){
    return Number(careerState.seasonYear)>=2024&&seasonState.active&&!careerState.retired&&Number(seasonState.played)>=8&&Number(seasonState.played)<37&&!tradeRoot().completed;
  }
  function tradeMarketScore(team){
    const pow=Number(careerLikeTeamPower(team)||team.strength||80);
    const fit=roleTacticFit(state.role,careerState.tactic||'消耗');
    const sameConf=(team.conference||team.division)===(careerState.team?.conference||careerState.team?.division);
    return pow*.72+fit*.12+(sameConf?-1:1)+Math.random()*5;
  }
  function tradeProjection(candidate){
    const team=candidate?.team;if(!team)return null;const ovr=Number(getMyOvr()==='--'?78:getMyOvr());
    let roster={score:70,best:Number(team.strength||80),count:1,label:'存在竞争机会'},fit=70;
    try{const x=typeof v37SystemFit==='function'?v37SystemFit(team,careerState.tactic||'消耗',state.role):null;if(x){roster=x.roster||roster;fit=x.total||fit;}}catch(e){}
    const gap=ovr-Number(roster.best||team.strength||80);let role='深度轮换',key='bench';
    if(Number(roster.count||0)===0||gap>=6){role='核心首发';key='starter'}else if(gap>=2){role='稳定首发';key='starter'}else if(gap>=-3){role='首发竞争';key='competition'}else if(gap>=-8){role='主要轮换';key='bench'}
    const competition=Number(roster.count||0)===0||gap>=4?'较低':gap>=-3?'中等':gap>=-8?'激烈':'非常激烈';
    return{ovr,fit,roster,gap,role,key,competition};
  }
  function tradeCandidates(count=3){
    return TEAMS.filter(t=>t.active!==false&&t.name!==careerState.team?.name).map(t=>{const c={team:t,score:tradeMarketScore(t),power:Number(careerLikeTeamPower(t)||t.strength||80)};c.projection=tradeProjection(c);return c}).sort((a,b)=>b.score-a.score).slice(0,count);
  }
  function avgRating(){return seasonState.userRatings.length?seasonState.userRatings.reduce((a,b)=>a+b,0)/seasonState.userRatings.length:6.7}
  function applyMidseasonTrade(newTeam,reason='交易',projection=null){
    if(!newTeam||newTeam.name===careerState.team?.name)return false;
    const old=careerState.team,rec=tradeRoot();
    if(window.__OWL_V790_MEMORY_QA?.markFormer)window.__OWL_V790_MEMORY_QA.markFormer(old.name);
    careerState.tradeHistory=careerState.tradeHistory||[];
    careerState.tradeHistory.push({year:careerState.seasonYear,afterGame:seasonState.played,from:old.name,to:newTeam.name,reason,contract:clone(careerState.contract)});
    careerState.team=newTeam;matchState.homeTeam=newTeam;
    if(careerState.contract)careerState.contract.teamName=newTeam.name;
    careerState.starters=createRoster(newTeam,true);careerState.bench=createBenchForTeam(newTeam);
    const proj=projection||tradeProjection({team:newTeam});if(proj){careerState.userLineupStatus={key:proj.key,label:proj.role,gap:Number(proj.gap.toFixed(1)),incumbent:Number(proj.roster?.best||0)};if(careerState.contract)careerState.contract.rolePromise=proj.role;}
    // Preserve player-season progress. Any remaining scheduled games versus the new team become games versus the old team.
    seasonState.opponents=(seasonState.opponents||[]).map((t,i)=>i>=seasonState.played&&t?.name===newTeam.name?old:t);
    rec.completed=true;rec.pending=null;rec.to=newTeam.name;rec.from=old.name;rec.afterGame=seasonState.played;rec.reason=reason;
    seasonState.eventHistory=seasonState.eventHistory||[];
    seasonState.eventHistory.push({id:`trade-${careerState.seasonYear}-${seasonState.played}`,icon:'🔄',title:'赛季中交易',choice:`${old.name} → ${newTeam.name}`,summary:`合同剩余年限与薪资整体转移 · ${reason}`,afterMatch:seasonState.played});
    renderCareerTeam();renderSeason();autosave('midseason-trade',0);toast(`🔄 交易完成：${old.name} → ${newTeam.name}`);return true;
  }
  function resumeAfterTradeDecision(){
    const root=tradeRoot(),resume=!!root.resumeWhole;root.resumeWhole=false;
    if(resume)setTimeout(()=>{if(typeof v35SimulateWholeSeason==='function'&&!seasonState.simulating&&seasonState.played<seasonState.total)v35SimulateWholeSeason()},160);
  }
  function closeTrade(){
    const root=tradeRoot();$('#v800TradeOverlay').classList.add('ui-hidden');
    if(root.pending){root.completed=true;root.pending=null;autosave('trade-declined',0)}
    renderSeason();resumeAfterTradeDecision();
  }
  function v826RoleRank(label){return {'深度轮换':0,'轮换选手':1,'主要轮换':1,'首发竞争':2,'稳定首发':3,'核心首发':4}[String(label||'')]??1;}
  function v826RoleKey(label){return /核心首发|稳定首发/.test(String(label||''))?'starter':/首发竞争/.test(String(label||''))?'competition':'bench';}
  function showTradeOffer(type,candidate=null,forced=false){
    const root=tradeRoot(),c=candidate||tradeCandidates(1)[0];if(!c)return;
    root.pending={type,team:c.team.name,power:c.power,forced,afterGame:seasonState.played};
    root.resumeWhole=!!(seasonState.v13WholeSimActive||seasonState.v17WholeActive||seasonState.v18WholeActive||seasonState.b2WholeActive||seasonState.v34WholeActive);
    seasonState.simulating=false;if(seasonState.timer){clearTimeout(seasonState.timer);seasonState.timer=null}
    const avg=avgRating(),content=$('#v800TradeContent'),poor=type==='team',request=type==='request',proj=c.projection||tradeProjection(c);
    if(type==='poach'&&proj&&careerState.contract?.rolePromise&&v826RoleRank(proj.role)<v826RoleRank(careerState.contract.rolePromise)){
      proj.role=careerState.contract.rolePromise;proj.key=v826RoleKey(proj.role);proj.competition='战队承诺维持当前地位';
    }
    const heading=request?'你向管理层提交了交易申请':poor?'管理层正在考虑换个环境':'争冠队向你发来交易邀请';
    const copy=request?`${c.team.name} 对你有明确兴趣。交易不会重签合同；剩余年限与薪资整体转移，新的队内定位以对方给出的承诺为准。`
      :poor?`你本季平均评分 ${avg.toFixed(1)}，教练信任 ${careerState.coachTrust}。${careerState.team.name} 已经和 ${c.team.name} 谈到实质阶段。`
      :`你本季平均评分 ${avg.toFixed(1)}。${c.team.name} 希望在交易截止日前把你带进争冠窗口。剩余合同年限与薪资原样转移，并承诺至少维持你当前的队内定位。`;
    content.innerHTML=`<div class="v800-modal-head"><div><h2>🔄 ${heading}</h2><p>赛季中交易V1 · ${seasonState.played}/${seasonState.total}场 · Major 2 后截止队伍间交易</p></div><button class="v800-close" id="v800TradeClose">×</button></div><p style="color:var(--muted);font-size:11px;line-height:1.7">${copy}</p><div class="v800-trade-team"><div class="v800-trade-logo" style="background:${c.team.color}">${c.team.short}</div><div><strong>${c.team.name}</strong><span>队伍实力 ${Math.round(c.power)} · 你的合同剩余 ${careerState.contract?.remaining??'—'} 年 · 年薪 ${careerState.contract?.salary??'—'} 万</span></div></div>${proj?`<div class="v16-trade-projection"><div><small>你的 OVR</small><strong>${proj.ovr}</strong></div><div><small>预计身份</small><strong>${proj.role}</strong></div><div><small>同位置竞争</small><strong>${proj.competition}</strong></div><div><small>最强竞争者</small><strong>${proj.roster?.best||'—'}</strong></div><p>${proj.roster?.label||'阵容竞争'} · 同职责 ${proj.roster?.count||0} 人 · 体系适配 ${proj.fit}</p></div>`:''}<div class="v800-trade-actions">${poor?`<button class="primary-btn" id="v800TradeAccept">接受交易，去 ${c.team.name}</button><button class="secondary-btn" id="v800TradeStay">向管理层争取留下</button>`:`<button class="primary-btn" id="v800TradeAccept">${request?'确认申请并接受方案':'接受新挑战'}</button><button class="secondary-btn" id="v800TradeStay">${request?'取消申请':'明确留队'}</button>`}</div>`;
    $('#v800TradeOverlay').classList.remove('ui-hidden');
    $('#v800TradeClose').onclick=()=>{if(!forced)closeTrade()};
    $('#v800TradeAccept').onclick=()=>{applyMidseasonTrade(c.team,request?'主动申请交易':poor?'队伍调整阵容':'强队挖角',proj);$('#v800TradeOverlay').classList.add('ui-hidden');resumeAfterTradeDecision()};
    $('#v800TradeStay').onclick=()=>{
      if(poor){
        const chance=clamp(.25+careerState.coachTrust*.006+Math.max(0,avg-6.2)*.12,.28,.78);
        if(Math.random()<chance){careerState.coachTrust=clamp(careerState.coachTrust+4,0,100);root.completed=true;toast('管理层接受了你的留队请求');}
        else{applyMidseasonTrade(c.team,'留队沟通失败，队伍完成交易',proj);}
      }else{root.completed=true;careerState.popularity=clamp(careerState.popularity+2,0,100);toast(request?'已撤回交易申请':'你选择继续留队')}
      $('#v800TradeOverlay').classList.add('ui-hidden');autosave('trade-decision');renderSeason();resumeAfterTradeDecision();
    };
  }
  function maybeAutoTrade(){
    if(!tradeEligible())return;const root=tradeRoot(),played=Number(seasonState.played);
    const cp=played>=28?28:played>=14?14:null;if(!cp||root.checkpoints.includes(cp))return;root.checkpoints.push(cp);
    const avg=avgRating();let type=null,chance=0;
    if(avg<6.35||careerState.coachTrust<43){type='team';chance=cp===28?.62:.42}
    else if(avg>=8.0||careerState.popularity>=68){type='poach';chance=cp===28?.43:.28}
    if(!type||Math.random()>=chance){autosave('trade-check');return}
    const candidates=tradeCandidates(type==='poach'?6:1);
    const currentRank=v826RoleRank(careerState.contract?.rolePromise);
    const c=type==='poach'?(candidates.find(x=>v826RoleRank(x.projection?.role)>=currentRank)||null):candidates[0];if(!c){autosave('trade-check');return;}
    // 交易是重大生涯事件：即便开启“自动处理普通事件”也必须暂停并明确告知玩家。
    // 否则整季模拟里队伍会在一帧之间换掉，玩家只能靠队徽侦破人口买卖案。
    if(type==='poach'&&c.power<=Number(careerLikeTeamPower(careerState.team)||80)+1){root.completed=true;autosave('trade-check');return;}
    showTradeOffer(type,c,type==='team');
  }
  function requestTrade(){
    if(!tradeEligible()){toast('当前不在可申请队伍间交易的窗口');return}
    const root=tradeRoot();root.requested=true;const list=tradeCandidates(3);if(!list.length){toast('暂时没有队伍给出明确兴趣');return}
    // Let the player choose from three interested teams.
    const content=$('#v800TradeContent');
    content.innerHTML=`<div class="v800-modal-head"><div><h2>📨 主动申请交易</h2><p>选择一支有兴趣接手你现有合同的队伍。申请不是自由市场，合同不会重新谈。</p></div><button class="v800-close" id="v800TradeClose">×</button></div><div style="display:grid;gap:8px">${list.map((x,i)=>`<button class="offer-card" data-v800-request="${i}"><div class="offer-team"><div class="offer-logo" style="background:${x.team.color}">${x.team.short}</div><div><strong>${x.team.name}</strong><span>队伍实力 ${Math.round(x.power)} · ${x.projection?.role||'轮换竞争'} · 竞争${x.projection?.competition||'中等'}</span></div></div></button>`).join('')}</div>`;
    $('#v800TradeOverlay').classList.remove('ui-hidden');$('#v800TradeClose').onclick=closeTrade;
    content.querySelectorAll('[data-v800-request]').forEach(b=>b.onclick=()=>showTradeOffer('request',list[Number(b.dataset.v800Request)],false));
  }
  function injectTradeButton(){
    const host=$('#seasonScreen .career-status-card');if(!host)return;host.querySelector('.v800-trade-request')?.remove();
    if(!tradeEligible())return;const d=document.createElement('div');d.className='v800-trade-request';d.innerHTML='<button class="secondary-btn" id="v800RequestTradeBtn">🔄 申请交易</button>';host.appendChild(d);$('#v800RequestTradeBtn').onclick=requestTrade;
  }

  // -------------------------------------------------------------------
  // Career passport / shareable archive header.
  // -------------------------------------------------------------------
  function careerPassportData(){
    const archive=careerState.careerArchive||[],honors=getHonorCounts(),last=archive.at(-1),heroPool=(last?.heroPool||[]).slice(0,3);
    const memories=[...(careerState.careerMemories||[])].sort((a,b)=>Number(b.heat||0)-Number(a.heat||0)).slice(0,3);
    return{
      name:state.playerName||'Rookie',role:state.role||'—',age:careerState.age,team:careerState.team?.name||last?.team||'—',seasons:archive.length,
      championships:Number(honors['总冠军']||0),mvp:Number(honors['MVP']||0),allstar:Number(honors['全明星']||0),peak:careerState.peakOvr||getMyOvr(),
      heroPool,memories
    };
  }
  function passportText(){
    const d=careerPassportData(),stories=d.memories.map(m=>`${m.icon||'📌'}${m.title}`).join(' / ');
    return `${d.name} · ${d.role}\n${d.team} · ${d.age}岁 · ${d.seasons}个完整赛季\n${d.championships}×总冠军 · ${d.mvp}×MVP · ${d.allstar}×全明星 · 最高OVR ${d.peak}${d.heroPool.length?`\n招牌英雄：${d.heroPool.map(h=>`${h.name} ${Number(h.value).toFixed(0)}`).join(' / ')}`:''}${stories?`\n代表故事：${stories}`:''}\n—— OWL选手之路 ${GAME_VERSION}`;
  }
  function passportHtml(){
    const d=careerPassportData();
    return`<div class="v800-passport-head"><div><h2>${d.name} · ${d.role}</h2><p>${d.team} · ${d.age}岁 · ${d.seasons}个完整赛季</p></div><div class="season-chip">CAREER CARD</div></div><div class="v800-passport-stats"><div class="v800-passport-stat"><strong>${d.championships}</strong><span>总冠军</span></div><div class="v800-passport-stat"><strong>${d.mvp}</strong><span>MVP</span></div><div class="v800-passport-stat"><strong>${d.allstar}</strong><span>全明星</span></div><div class="v800-passport-stat"><strong>${d.peak}</strong><span>最高OVR</span></div><div class="v800-passport-stat"><strong>${d.seasons}</strong><span>完整赛季</span></div></div>${d.heroPool.length?`<div class="v800-passport-stories">${d.heroPool.map(h=>`<span>🎮 ${h.name} ${Number(h.value).toFixed(0)}</span>`).join('')}${d.memories.map(m=>`<span>${m.icon||'📌'} ${m.title}</span>`).join('')}</div>`:''}<div class="v800-passport-actions"><button class="secondary-btn" id="v800CopyPassport">复制生涯名片</button></div>`;
  }
  function injectPassport(){
    const host=els?.careerTabContent;if(!host)return;host.querySelector('.v800-career-passport')?.remove();
    const card=document.createElement('section');card.className='v800-career-passport';card.innerHTML=passportHtml();host.prepend(card);
    $('#v800CopyPassport').onclick=async()=>toast(await copyText(passportText())?'✓ 生涯名片已复制':'复制失败');
  }
  function enhanceHonorWall(){
    const host=els?.careerTabContent;if(!host)return;const counts=getHonorCounts(),total=Object.values(counts).reduce((a,b)=>a+b,0);
    const block=host.querySelector('.career-block');if(block&&!block.querySelector('.v800-honor-summary'))block.querySelector('h3')?.insertAdjacentHTML('afterend',`<div class="v800-honor-summary" style="margin:8px 0 12px;color:var(--muted);font-size:10px">核心荣誉：🏆 ${counts['总冠军']||0}冠 · 👑 ${counts['MVP']||0}MVP · ⭐ ${counts['全明星']||0}全明星 · 共${total}项荣誉</div>`);
  }

  // -------------------------------------------------------------------
  // Autosave + UI hooks. These wrap the FINAL functions in the page.
  // -------------------------------------------------------------------
  const _showScreen=showScreen;
  showScreen=function(name){
    const out=_showScreen(name);
    if(!['cover','mode','match'].includes(name))autosave(`screen:${name}`,180);
    return out;
  };
  const _lockAttribute=lockAttribute;
  lockAttribute=function(...args){const out=_lockAttribute(...args);autosave('builder-attribute');return out};
  const _renderGameSettings=renderGameSettings;
  renderGameSettings=function(...args){const out=_renderGameSettings(...args);ensureDiagnostics();return out};
  const _renderSeason=renderSeason;
  renderSeason=function(...args){
    const out=_renderSeason(...args);injectTradeButton();
    if(Number(careerState.seasonYear)>=2025)addContextTip($('#v74HeroDevelopmentPanel')||$('#seasonScreen .season-track-card'),'hero-ban','<b>2025+：</b>地图 → 上场阵容 → Hero Ban / Plan B。');
    if(seasonState.stageBreakPending&&Number(careerState.seasonYear)>=2024){
      addContextTip($('#v768SeasonPrimaryAction')||$('#seasonScreen .season-track-card'),'major','<b>Major不是年度季后赛：</b>它是Stage阶段赛事；Major表现给联赛积分，年度季后赛最终按整个赛季的League Points决定。');
    }else{
      document.querySelectorAll('.v800-context-tip[data-v800-tip="major"]').forEach(n=>n.remove());
    }
    if(!seasonState.simulating)autosave('season-state',260);
    return out;
  };
  const _renderContractMarket=renderContractMarket;
  renderContractMarket=function(wrap){
    const out=_renderContractMarket(wrap);
    addContextTip(wrap,'market','<b>适配度 ≠ 能力值。</b>它表示你的职责、英雄池和这支队当前体系到底有多合适；强队也可能不是最适合你的队。');
    return out;
  };
  const _renderTrainingCamp=renderTrainingCamp;
  renderTrainingCamp=function(wrap){const out=_renderTrainingCamp(wrap);renderHeroSpecialization(wrap);return out};
  const _renderCareerOverview=renderCareerOverview;
  renderCareerOverview=function(){const out=_renderCareerOverview();injectPassport();return out};
  const _renderHonorWall=renderHonorWall;
  renderHonorWall=function(){const out=_renderHonorWall();injectPassport();enhanceHonorWall();return out};

  // Match settlement hooks: autosave + trade check.
  const _v32Silent=v32SilentRegularGame;
  v32SilentRegularGame=function(...args){const before=seasonState.played,out=_v32Silent(...args);if(seasonState.played>before){maybeAutoTrade();autosave('regular-match',0)}return out};
  const _recordManual=recordManualSeasonMatch;
  recordManualSeasonMatch=function(...args){const before=seasonState.played,out=_recordManual(...args);if(seasonState.played>before){maybeAutoTrade();autosave('manual-match',0)}return out};
  const _setBracket=setPlayerBracketResult;
  setPlayerBracketResult=function(...args){const out=_setBracket(...args);autosave('playoff-series',0);return out};
  const _resolveEvent=resolveSeasonEvent;
  resolveSeasonEvent=function(...args){const out=_resolveEvent(...args);autosave('career-event',0);return out};
  const _confirmTraining=confirmTrainingCamp;
  confirmTrainingCamp=function(...args){const out=_confirmTraining(...args);autosave('training-confirm',0);return out};
  const _roleDecision=applyRoleDecision;
  applyRoleDecision=function(...args){const out=_roleDecision(...args);autosave('role-plan',0);return out};
  const _signOffer=signSelectedOffer;
  signSelectedOffer=function(...args){const out=_signOffer(...args);autosave('contract-sign',0);return out};
  const _continueContract=continueExistingContract;
  continueExistingContract=function(...args){const out=_continueContract(...args);autosave('contract-continue',0);return out};
  const _retire=retireCareer;
  retireCareer=function(...args){const out=_retire(...args);autosave('retirement',0);return out};
  const _recordSeason=recordCompletedCareerSeason;
  recordCompletedCareerSeason=function(...args){const before=careerState.careerArchive?.length||0,out=_recordSeason(...args);if((careerState.careerArchive?.length||0)>before)autosave('season-archive',0);return out};

  window.addEventListener('pagehide',()=>{if(activeScreen()!=='match')saveNow('pagehide')});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&activeScreen()!=='match')saveNow('visibility')});

  // Ensure settings, saves, and initial cover are correct after all legacy initialization.
  refreshCoverSavePanel();renderSaveIndicator();ensureDiagnostics();

  function qaMacroAdvanceSeason(){
    if(careerState.retired)return{ok:true,retired:true,year:careerState.seasonYear,age:careerState.age};
    try{
      if(!seasonState.active)setupSeason(false);
      const year=Number(careerState.seasonYear),total=Number(seasonState.total||28),ovr=Number(getMyOvr()==='--'?78:getMyOvr());
      const teamPower=Number(careerLikeTeamPower(careerState.team)||careerState.team?.strength||80);
      const rate=clamp(.48+(teamPower-80)*.014+(ovr-80)*.006+randomCentered(.045),.27,.78);
      const wins=clamp(Math.round(total*rate),2,total-2),losses=total-wins;
      seasonState.played=total;seasonState.wins=wins;seasonState.losses=losses;
      seasonState.results=Array.from({length:total},(_,i)=>i<wins?'win':'loss');shuffle(seasonState.results);
      const rating=clamp(6.55+(ovr-80)*.045+(rate-.5)*1.6+randomCentered(.28),5.6,9.25);
      seasonState.userRatings=Array.from({length:total},()=>clamp(rating+randomCentered(.22),4.8,9.7));
      seasonState.decisionTotal=Math.max(1,Math.round(total*.35));seasonState.decisionSuccess=Math.round(seasonState.decisionTotal*clamp(.52+(ovr-80)*.008,.38,.82));
      seasonState.simulating=false;seasonState.stageBreakPending=null;seasonState.v71LastMajorSummary=null;seasonState.v71AllStarPending=false;
      seasonState.stageProcessed=Number(year)>=2024?[1,2,3]:year===2023?[1,2]:[1,2,3,4];
      playoffState.active=false;playoffState.results=[];
      playoffState.round=rate>=.69?'champion':rate>=.62?'runnerup':rate>=.48?'eliminated':null;
      offseasonState.active=false;setupOffseason();
      if(careerState.age>=30){retireCareer('30岁强制退役');return{ok:true,from:year,to:year,retired:true,age:careerState.age};}
      offseasonState.showRetirement=false;offseasonState.roleOpportunity=false;
      prepareTrainingCamp(careerState.age+1);
      let guard=0;
      while(offseasonState.trainingRemaining>0&&canSpendTrainingPoint()&&guard++<140){
        const weights=ROLE_WEIGHTS[state.role]||{};
        const candidates=ATTRS.map(a=>{const value=Number(state.locked[a.key]?.value||75),count=Number(offseasonState.trainingAllocations[a.key]||0),cost=trainingPointCost(value);return{a,value,count,cost,score:(weights[a.key]||0)*90+(99-value)*.1-cost*.7+(a.key==='pool'?4:0)}})
          .filter(x=>x.value<99&&x.count<4&&x.cost<=offseasonState.trainingRemaining).sort((a,b)=>b.score-a.score);
        const x=candidates[0];if(!x)break;offseasonState.trainingRemaining-=x.cost;offseasonState.trainingAllocations[x.a.key]=x.count+1;offseasonState.trainingHistory[x.a.key]=offseasonState.trainingHistory[x.a.key]||[];offseasonState.trainingHistory[x.a.key].push(x.cost);setCareerAttributeValue(x.a.key,x.value+1);
      }
      offseasonState.trainingConfirmed=true;careerState.peakOvr=Math.max(Number(careerState.peakOvr||0),Number(getMyOvr()==='--'?0:getMyOvr()));
      if(offseasonState.contractExpired){
        generateContractOffers();const offers=[...(offseasonState.offers||[])].sort((a,b)=>(b.fit||0)+(b.teamPower||0)*.5+(b.years||1)*2-((a.fit||0)+(a.teamPower||0)*.5+(a.years||1)*2));
        const offer=offers[0];if(!offer)return{ok:false,error:'no-contract-offer',year};offseasonState.selectedOfferId=offer.id;offseasonState.signedOffer=offer;applyTeamFromOffer(offer);
      }else continueExistingContract();
      offseasonState.active=false;offseasonState.phase='signed';
      return{ok:true,from:year,to:careerState.seasonYear,retired:careerState.retired,age:careerState.age,wins,losses,rating:Number(rating.toFixed(2))};
    }catch(err){return{ok:false,error:String(err?.message||err),year:careerState.seasonYear,age:careerState.age};}
  }

  window.__OWL_PUBLIC_BETA={
    version:GAME_VERSION,internalVersion:INTERNAL_VERSION,saveVersion:SAVE_VERSION,
    saveNow,loadSlot,readSlot,exportSlot,deleteSlot,clearAllLocalSaves,localSaveKeys,restorePayload,captureSave,diagnostic:diagnosticObject,
    compatibility:()=>({protocol:location.protocol,fileName:location.pathname.split('/').pop(),stableFileName:'OWL选手之路.html',saveKeyPrefix:KEY_PREFIX,currentSlot:getCurrentSlot(),deletedSlots:[...deletedSlots]}),
    openSaveManager,requestTrade,forceTrade:(teamShort,type='poach')=>{const c={team:TEAMS.find(t=>t.short===teamShort),power:Number(careerLikeTeamPower(TEAMS.find(t=>t.short===teamShort))||80)};if(c.team)showTradeOffer(type,c,false)},
    heroState:()=>clone(ensureHeroTrainingState()),passport:()=>({data:careerPassportData(),text:passportText()}),
    worldHealth:(year=careerState.seasonYear)=>window.__OWL_V800_WORLD_IO?.health?.(year),
    qaMacroAdvanceSeason,
    autosave:()=>autosave('qa',0),
    resetTips:()=>{Object.keys(localStorage).filter(k=>k.startsWith('owl_public_tip_')).forEach(k=>localStorage.removeItem(k));localStorage.removeItem(ONBOARD_KEY)}
  };
})();
