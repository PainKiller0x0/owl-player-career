/* ======================================================================
   Public Beta 1.9 RC10 · Long-Career Flow Polish
   - active-contract offseasons enter the next season without another gate
   - league labels stay inside the OWL / OWL 2.0 setting
   - season roster remains one click away instead of a mandatory stop
   ====================================================================== */
(function(){
  const VER='Public Beta 1.9 RC10';
  function league30(year=careerState.seasonYear){return Number(year)<=2023?'OWL':'OWL 2.0';}
  function syncLeague30(){
    const season=document.getElementById('seasonLeagueText');if(season)season.textContent=`${league30()} · ${careerState.goal||'常规赛'}`;
    const meta=document.getElementById('careerContractMeta');
    if(meta&&careerState.team){const contractCopy=careerState.contract?`${careerState.contract.years} 年合同 · 剩余 ${careerState.contract.remaining} 年 · 年薪 ${careerState.contract.salary} 万 · ${careerState.contract.rolePromise}`:'合同待定';meta.textContent=`${league30()} · ${contractCopy} · 季前排名第 ${careerState.rank}`;}
    const matchLabel=document.querySelector('#matchScreen .match-week span');
    if(matchLabel){matchLabel.textContent=matchState.context==='worldcup'?'OVERWATCH WORLD CUP':`${league30()} · ${matchState.context==='playoff'?'季后赛':'常规赛'}`;}
    const rosterBtn=document.getElementById('backTeamFromSeasonBtn');if(rosterBtn)rosterBtn.textContent='👥 查看阵容';
  }
  // Rebind the player-facing whole-season button once, after all legacy/historical
  // listeners have been installed. Older capture listeners can stop propagation
  // before the final 2024+ state machine sees the click.
  function bindWholeSeason30(){
    const old=document.getElementById('fullSimSeasonBtn');if(!old||old.dataset.v30Bound==='1')return;
    const btn=old.cloneNode(true);btn.dataset.v30Bound='1';old.replaceWith(btn);
    if(typeof els==='object'&&els)els.fullSimSeasonBtn=btn;
    btn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();
      if(typeof window.__OWL_V18_FULL_SEASON==='function')window.__OWL_V18_FULL_SEASON();
      else if(typeof v35SimulateWholeSeason==='function')v35SimulateWholeSeason();
    },true);
  }
  bindWholeSeason30();
  // Document-capture guard runs before any legacy target listeners, including
  // older listeners that call stopImmediatePropagation on the button itself.
  document.addEventListener('click',e=>{const btn=e.target?.closest?.('#fullSimSeasonBtn');if(!btn)return;e.preventDefault();e.stopImmediatePropagation();
    if(btn.disabled)return;
    if(typeof window.__OWL_V18_FULL_SEASON==='function')window.__OWL_V18_FULL_SEASON();
    else if(typeof v35SimulateWholeSeason==='function')v35SimulateWholeSeason();
  },true);

  const _team30=renderCareerTeam;renderCareerTeam=function(){const out=_team30.apply(this,arguments);syncLeague30();return out;};
  const _season30=renderSeason;renderSeason=function(){const out=_season30.apply(this,arguments);syncLeague30();return out;};
  const _match30=renderMatch;renderMatch=function(){const out=_match30.apply(this,arguments);syncLeague30();return out;};
  syncLeague30();
  window.__OWL_V24_UX={version:VER,league:league30};
})();
