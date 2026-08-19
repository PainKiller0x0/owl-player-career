
/* ===== V7.10.1 · Playoff path persistence + sports-native team killer label ===== */
(function(){
  const VER='V7.10.1';
  function playerPath7101(){
    return (playoffState.results||[]).map((r,idx)=>{
      const m=typeof getBracketMatch==='function'?getBracketMatch(r.matchId):null;
      const mr=m?.result;
      let opp='未知对手';
      if(mr){
        const me=careerState.team?.name;
        opp=mr.teamA?.name===me?mr.teamB?.name:mr.teamA?.name||opp;
      }
      return{...r,opponent:opp,index:idx};
    });
  }
  function renderPath7101(){
    const screen=document.getElementById('playoffScreen'),teamCard=screen?.querySelector('.playoff-team-card');
    if(!teamCard)return;
    teamCard.querySelector('.v7101-playoff-path')?.remove();
    const rows=playerPath7101();if(!rows.length)return;
    const box=document.createElement('div');box.className='v7101-playoff-path';
    box.innerHTML=`<div class="v7101-playoff-path-head"><strong>我的季后赛路径</strong><span>${rows.length}轮已完成 · 默认折叠仍保留自己的战报</span></div><div class="v7101-playoff-path-list">${rows.map((r,i)=>`<span class="v7101-playoff-result ${r.won?'win':'loss'} ${i===rows.length-1?'latest':''}"><b>${r.won?'✓':'✕'} ${r.stage||'季后赛'} · ${r.score||'—'}</b><em>${i===rows.length-1?'上一轮 · ':''}vs ${r.opponent}</em></span>`).join('')}</div>`;
    const mini=teamCard.querySelector('.v772-playoff-mini-status');
    if(mini)teamCard.insertBefore(box,mini);else teamCard.appendChild(box);
  }
  function migrateKiller7101(){
    (careerState.careerMemories||[]).forEach(m=>{
      if(!String(m?.key||'').startsWith('landlord:'))return;
      const team=String(m.key).slice('landlord:'.length);
      m.icon='🎯';m.title=`${team}杀手`;
      if(/房东|收租|房租/.test(String(m.text||'')))m.text=`你曾连续五次击败${team}，这段统治后来被社区固定成“${team}杀手”的标签。`;
    });
  }
  const _renderPlayoffs7101=renderPlayoffs;
  renderPlayoffs=function(){const out=_renderPlayoffs7101();migrateKiller7101();renderPath7101();return out;};
  migrateKiller7101();
  window.__OWL_V7101_QA={
    version:VER,
    path:()=>JSON.parse(JSON.stringify(playerPath7101())),
    migrate:()=>{migrateKiller7101();return JSON.parse(JSON.stringify((careerState.careerMemories||[]).filter(m=>String(m.key||'').startsWith('landlord:'))));}
  };
})();
