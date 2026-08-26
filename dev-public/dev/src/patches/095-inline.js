/* OWL Alpha1 · annual flow recovery, MVP fatigue and award celebrations. */
(() => {
  'use strict';

  function mvpStreak() {
    let streak = 0;
    for (const record of [...(careerState.careerArchive || [])].reverse()) {
      const honors = (record.honors || []).map(h => typeof normalizeHonorName === 'function' ? normalizeHonorName(h) : h);
      const fromHonors = honors.includes('MVP') || honors.includes('常规赛最有价值选手');
      const fromAwards = Number(record.awards?.mvp?.userRank) === 1 || record.awards?.mvp?.winner?.isUser === true;
      if (fromHonors || fromAwards) streak++;
      else break;
    }
    return streak;
  }

  const baseEnsureAwards = ensureRegularSeasonAwards;
  ensureRegularSeasonAwards = function (...args) {
    const awards = baseEnsureAwards.apply(this, args);
    if (!awards || awards.__owlMvpFatigueApplied || (!awards.v71 && Number(careerState.seasonYear || 0) < 2024)) return awards;
    const streak = mvpStreak();
    const penalty = streak >= 2 ? Math.min(18, (streak - 1) * 6) : 0;
    awards.mvpFatigue = { streak, penalty };
    if (penalty && typeof buildRegularAwardLeaguePool === 'function' && typeof rankAwardCandidates === 'function') {
      const pool = buildRegularAwardLeaguePool();
      awards.mvp = rankAwardCandidates(pool, p => p.rating * 10 + p.ovr * .16 + p.wins * .50 - (p.isUser ? penalty : 0));
    }
    Object.defineProperty(awards, '__owlMvpFatigueApplied', { value: true, enumerable: false });
    return awards;
  };

  function playSeasonMvpBurst() {
    document.body.classList.remove('season-mvp-burst');
    void document.body.offsetWidth;
    document.body.classList.add('season-mvp-burst');
    document.querySelector('.season-mvp-confetti')?.remove();
    const layer = document.createElement('div');
    layer.className = 'season-mvp-confetti';
    const colors = ['#ff6438', '#ffd166', '#35c98b', '#62c7ff', '#f08ad8', '#fff4dc'];
    for (let i = 0; i < 32; i += 1) {
      const piece = document.createElement('i');
      piece.style.setProperty('--x', `${Math.round((Math.random() - .5) * Math.min(window.innerWidth * .9, 840))}px`);
      piece.style.setProperty('--y', `${Math.round(window.innerHeight * (.58 + Math.random() * .32))}px`);
      piece.style.setProperty('--r', `${Math.round((Math.random() - .5) * 960)}deg`);
      piece.style.setProperty('--d', `${(Math.random() * .14).toFixed(2)}s`);
      piece.style.setProperty('--c', colors[i % colors.length]);
      layer.appendChild(piece);
    }
    document.body.appendChild(layer);
    setTimeout(() => layer.remove(), 2100);
    setTimeout(() => document.body.classList.remove('season-mvp-burst'), 1700);
  }

  function celebrateMvpIfNeeded() {
    if (Number(seasonState.played||0) < Number(seasonState.total||0)) return false;
    const awards = ensureRegularSeasonAwards();
    if (awards?.mvp?.userRank !== 1) return false;
    careerState.owlMvpBurstYears = Array.isArray(careerState.owlMvpBurstYears) ? careerState.owlMvpBurstYears : [];
    const year = Number(careerState.seasonYear || 0);
    if (careerState.owlMvpBurstYears.includes(year)) return false;
    careerState.owlMvpBurstYears.push(year);
    setTimeout(playSeasonMvpBurst, 60);
    return true;
  }

  const baseRenderAwards = renderRegularSeasonAwards;
  renderRegularSeasonAwards = function (...args) {
    const out = baseRenderAwards.apply(this, args);
    const fatigue = seasonState.awards?.mvpFatigue;
    const host = document.querySelector('#regularAwardsContent .award-card');
    host?.querySelector('.owl-mvp-fatigue-note')?.remove();
    if (host && fatigue?.penalty) {
      const note = document.createElement('div');
      note.className = 'owl-mvp-fatigue-note';
      note.textContent = `连续 ${fatigue.streak} 次 MVP，本季存在 ${fatigue.penalty} 分审美疲劳修正。`;
      host.appendChild(note);
    }
    return out;
  };

  const baseOpenAwards = openRegularSeasonAwards;
  openRegularSeasonAwards = function (...args) {
    const out = baseOpenAwards.apply(this, args);
    celebrateMvpIfNeeded();
    return out;
  };

  const baseRenderSeason = renderSeason;
  renderSeason = function (...args) {
    const out = baseRenderSeason.apply(this, args);
    celebrateMvpIfNeeded();
    return out;
  };

  function needsAnnualPlayoff() {
    return Number(seasonState.played || 0) >= Number(seasonState.total || 0)
      && Number(estimateSeasonRank()) <= 8
      && !['champion', 'runnerup', 'eliminated'].includes(playoffState.round);
  }

  function openRecoveredPlayoffs() {
    if (!needsAnnualPlayoff()) return false;
    const hasReadyMatch = playoffState.active
      && Array.isArray(playoffState.matches)
      && playoffState.matches.length
      && typeof currentPlayoffMatch === 'function'
      && !!currentPlayoffMatch();
    if (!hasReadyMatch) setupPlayoffs();
    if (!playoffState.active) return false;
    renderPlayoffs();
    showScreen('playoff');
    return true;
  }

  // Capture the two public season-end CTAs before legacy listeners can return
  // early on old saves whose playoffState says "active" but is not initialized.
  document.addEventListener('click', event => {
    const directButton = event.target?.closest?.('#enterPlayoffsBtn');
    const awardsButton = event.target?.closest?.('#awardsContinueBtn');
    const summaryButton = event.target?.closest?.('#summaryOffseasonBtn');
    if (directButton && document.getElementById('seasonScreen')?.classList.contains('active')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!openRecoveredPlayoffs()) enterPlayoffs();
      return;
    }
    if (awardsButton && document.getElementById('awardsScreen')?.classList.contains('active') && /进入季后赛|返回季后赛/.test(awardsButton.textContent || '')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!openRecoveredPlayoffs()) showSeasonSummary();
      return;
    }
    if (summaryButton && document.getElementById('summaryScreen')?.classList.contains('active') && needsAnnualPlayoff()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!openRecoveredPlayoffs()) showSeasonSummary();
    }
  }, true);

  window.__OWL_ALPHA1_AWARD_FLOW = Object.freeze({ version: '095', mvpStreak, openRecoveredPlayoffs, celebrateMvpIfNeeded });
})();
