/* ===== Public Beta 1.9 RC22 · Tournament path first / full bracket on demand ===== */
(function(){
  'use strict';
  const VER='Public Beta 1.9 RC22';
  const FULL='Public Beta 1.9 RC22 · Tournament Path UX';

  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const me=()=>careerState.team?.name||'';

  function tournamentLabel(h){
    if(!h)return '阶段赛事';
    if(h.v34Type==='ewc'||/^EWC\b/i.test(String(h.result||'')))return 'EWC';
    const major=String(h.result||'').match(/Major\s*(\d+)/i);
    if(major)return `Major ${major[1]}`;
    const id=String(h.competitionId||'');
    const fromId=id.match(/MAJOR[_\s-]?(\d+)/i);if(fromId)return `Major ${fromId[1]}`;
    return h.stage?`Stage ${h.stage} 阶段赛事`:'阶段赛事';
  }

  function normalizedPlayerPath(h){
    if(Array.isArray(h?.rounds)&&h.rounds.length)return h.rounds.map((r,index)=>({
      index,
      round:r.round||r.roundLabel||`第 ${index+1} 轮`,
      opponent:r.opponent||'待定',
      won:!!r.won,
      score:r.score||'',
      target:Number(r.target||0),
      bracket:r.bracket||''
    }));
    const team=me(),series=Array.isArray(h?.bracketSeries)?h.bracketSeries:[];
    if(!team)return [];
    return series.filter(s=>s.teamA===team||s.teamB===team).map((s,index)=>{
      const left=s.teamA===team;
      return {index,round:s.round||`第 ${index+1} 轮`,opponent:left?s.teamB:s.teamA,won:s.winner===team,score:`${left?s.scoreA:s.scoreB}:${left?s.scoreB:s.scoreA}`,target:Number(s.target||0),bracket:s.bracket||''};
    });
  }

  function pathHtml(h){
    const path=normalizedPlayerPath(h),label=tournamentLabel(h);
    if(!path.length){
      const result=String(h?.result||'未晋级');
      return `<section class="v20-tournament-path"><div class="v20-tournament-head"><div><span>YOUR RUN</span><strong>我的${esc(label)}路径</strong></div><em>${esc(result)}</em></div><div class="v20-path-empty">本届没有你的淘汰赛对局。没晋级就是没晋级，页面也没必要硬塞一整棵树给你看。</div></section>`;
    }
    return `<section class="v20-tournament-path"><div class="v20-tournament-head"><div><span>YOUR RUN</span><strong>我的${esc(label)}路径</strong></div><em>${path.length} 场</em></div><div class="v20-path-list">${path.map((r,index)=>`<div class="v20-path-row ${r.won?'win':'loss'} ${index===path.length-1?'latest':''}"><span class="v20-path-mark">${r.won?'✓':'✕'}</span><div><strong>${esc(r.round)}</strong><small>vs ${esc(r.opponent)}</small></div><b>${esc(r.score|| (r.won?'胜':'负'))}</b></div>`).join('')}</div></section>`;
  }

  function bracketGroupKey(s){
    return `${s.bracket||'main'}|${s.roundKey||''}|${s.round||'阶段'}`;
  }
  function bracketName(bracket){
    return bracket==='upper'?'胜者组':bracket==='lower'?'败者组':bracket==='final'?'总决赛':bracket==='single'?'单败淘汰':bracket==='ladder'?'挑战赛':'赛事对阵';
  }
  function fullBracketHtml(h){
    const series=Array.isArray(h?.bracketSeries)?h.bracketSeries:[];
    if(!series.length)return '';
    const groups=[];const map=new Map();
    series.forEach(s=>{const k=bracketGroupKey(s);if(!map.has(k)){const g={key:k,bracket:s.bracket||'main',round:s.round||'阶段',series:[]};map.set(k,g);groups.push(g);}map.get(k).series.push(s);});
    const team=me();
    const cards=groups.map(g=>`<section class="v20-bracket-round"><div class="v20-bracket-round-head"><span>${esc(bracketName(g.bracket))}</span><strong>${esc(g.round)}</strong></div>${g.series.map(s=>{
      const aWin=s.winner===s.teamA,bWin=s.winner===s.teamB;
      const aMe=team&&s.teamA===team,bMe=team&&s.teamB===team;
      return `<div class="v20-bracket-match"><div class="${aWin?'winner':''} ${aMe?'me':''}"><span>${esc(s.teamA||'待定')}</span><b>${Number(s.scoreA||0)}</b></div><div class="${bWin?'winner':''} ${bMe?'me':''}"><span>${esc(s.teamB||'待定')}</span><b>${Number(s.scoreB||0)}</b></div></div>`;
    }).join('')}</section>`).join('');
    return `<details class="v20-bracket-details"><summary><span>完整 Bracket</span><small>${series.length} 场 · 展开查看全部对阵</small></summary><div class="v20-bracket-grid">${cards}</div></details>`;
  }

  function inject(card,h){
    if(!card||!h||card.querySelector('.v20-tournament-progressive'))return false;
    const box=document.createElement('div');box.className='v20-tournament-progressive';
    box.innerHTML=pathHtml(h)+fullBracketHtml(h);
    const button=card.querySelector(':scope > button.primary-btn,:scope > div > button.primary-btn');
    if(button&&button.parentNode===card)card.insertBefore(box,button);else card.appendChild(box);
    card.classList.add('v20-tournament-card');
    return true;
  }

  function currentHistoryForHistoricalCard(){
    const stage=Number(seasonState.v769TournamentResultPending||0);
    if(stage)return (seasonState.stagePlayoffHistory||[]).find(h=>Number(h.stage)===stage)||null;
    return null;
  }

  function normalizeModernCards(h){
    const cards=[...document.querySelectorAll('#seasonScreen .v71-major-result')];
    if(!cards.length)return [];
    // Older 2024+ UI always reconstructs v71LastMajorSummary as a Major card first.
    // From 2030 onward Stage 3 may actually be EWC; the future-league layer then adds
    // the correct EWC card afterwards, leaving two visible milestone cards. Keep only
    // the competition that is actually being resolved.
    if(h?.v34Type==='ewc'){
      const preferred=cards.find(card=>card.parentElement?.id==='seasonCompleteArea')||cards.find(card=>/EWC|Esports World Cup/i.test(card.querySelector('.offseason-kicker,h3')?.textContent||''))||cards.at(-1);
      cards.forEach(card=>{if(card!==preferred)card.remove();});
      const inline=document.getElementById('v741SeasonInlineMilestone');
      if(inline&&!inline.querySelector('.stage-break-card,.season-complete-banner'))inline.classList.remove('show');
      return preferred?[preferred]:[];
    }
    return cards.slice(0,1);
  }

  function decorateTournamentCards(){
    const modern=seasonState.v71LastMajorSummary||null;
    if(modern)normalizeModernCards(modern).forEach(card=>inject(card,modern));
    const historical=currentHistoryForHistoricalCard();
    if(historical){
      document.querySelectorAll('#seasonScreen .v769-historical-result').forEach(card=>inject(card,historical));
    }
  }

  const baseRender=renderSeason;
  renderSeason=function(){const out=baseRender.apply(this,arguments);decorateTournamentCards();return out;};

  decorateTournamentCards();
  window.__OWL_V20_TOURNAMENT_UX=Object.freeze({version:VER,decorate:decorateTournamentCards,playerPath:normalizedPlayerPath});
})();
