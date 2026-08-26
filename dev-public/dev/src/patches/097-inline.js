/* OWL Alpha1 Batch 4 · approved rules and presentation pass. */
(() => {
  'use strict';

  const VERSION = '097';
  const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const year = () => number(careerState?.seasonYear || 2019);

  function seasonFormat(y = year()) {
    const format = window.__OWL_FUTURE_RULES_CONFIG?.seasonFormat?.(Number(y)) || window.getSeasonFormat?.(Number(y)) || {};
    return { ...format, format: Number(y) <= 2021 ? '6v6' : '5v5' };
  }

  // ---------------- approved UI information level ----------------
  function compactTraining(wrap) {
    if (!wrap) return;
    const intro = [...wrap.querySelectorAll('p')].find(node => /成长倍率/.test(node.textContent || ''));
    if (intro) intro.textContent = '年轻选手基础训练点更多；赛季评分、常规赛表现和最终成绩共同决定最终训练点数。';
    const summary = [...wrap.querySelectorAll('.training-summary-item')];
    [summary[1], summary[2]].forEach(item => {
      const value = item?.querySelector('strong');
      if (value) value.textContent = value.textContent.split('/')[0].trim();
    });
    wrap.querySelectorAll('.training-breakdown,.meeting-note,.age-change-list').forEach(node => node.remove());
  }

  if (typeof renderTrainingCamp === 'function') {
    const base = renderTrainingCamp;
    renderTrainingCamp = function (...args) {
      const out = base.apply(this, args);
      compactTraining(args[0] || document.getElementById('offseasonContent'));
      return out;
    };
  }

  function compactRolePlan(wrap) {
    const result = wrap?.querySelector('.role-shift-card.proposed em');
    if (result) {
      const raw = result.textContent || '';
      const value = raw.match(/有效(?:约)?\s*(\d+)/)?.[1] || raw.match(/理论职责总评\s*(\d+)/)?.[1];
      if (value) result.textContent = `转位后职责总评 ${value}`;
    }
    const competition = wrap?.querySelector('.role-competition-card p');
    const outcome = wrap?.querySelector('.role-competition-head strong')?.textContent?.trim();
    if (competition && outcome) competition.textContent = `${outcome}。实际出场顺位将在新赛季根据位置适应度与比赛表现决定。`;
  }

  if (typeof renderRolePlanning === 'function') {
    const base = renderRolePlanning;
    renderRolePlanning = function (...args) {
      const out = base.apply(this, args);
      compactRolePlan(args[0]);
      return out;
    };
  }

  function capOfferYears() {
    const age = number(careerState?.age);
    const maxYears = age >= 28 ? Math.max(1, 30 - age) : 3;
    (offseasonState?.offers || []).forEach(offer => {
      offer.years = Math.min(Math.max(1, number(offer.years) || 1), maxYears);
    });
  }

  if (typeof generateContractOffers === 'function') {
    const base = generateContractOffers;
    generateContractOffers = function (...args) {
      const out = base.apply(this, args);
      capOfferYears();
      return out;
    };
  }
  if (typeof renderContractMarket === 'function') {
    const base = renderContractMarket;
    renderContractMarket = function (...args) {
      capOfferYears();
      const out = base.apply(this, args);
      capOfferYears();
      return out;
    };
  }

  // ---------------- 5v5 / 6v6 tactical migration ----------------
  function migrateCurrentTactics() {
    if (year() < 2022 || !careerState?.team) return false;
    const api = window.__OWL_V24_TACTICAL_IDENTITY;
    if (!api?.ensureCurrentProfile) return false;
    const oldStyle = careerState.tacticProfile?.primary?.styleId;
    const profile = api.ensureCurrentProfile();
    return oldStyle === 'goats' && profile?.primary?.styleId !== 'goats';
  }

  function decorateFormat() {
    const head = document.querySelector('#seasonScreen .season-track-head h3 + span');
    if (!head) return;
    let badge = head.querySelector('.v97-format-badge');
    if (!badge) {
      badge = document.createElement('b');
      badge.className = 'v97-format-badge';
      head.appendChild(document.createTextNode(' · '));
      head.appendChild(badge);
    }
    badge.textContent = seasonFormat().format;
  }

  // ---------------- regular-season awards ----------------
  function shortenHawelka() {
    const card = [...document.querySelectorAll('#regularAwardsContent .award-card')]
      .find(node => /Dennis Hawelka/.test(node.querySelector('.award-card-head h3')?.textContent || ''));
    const award = typeof ensureRegularSeasonAwards === 'function' ? ensureRegularSeasonAwards()?.hawelka : null;
    if (!card || !award) return;
    if (!award.userEligible || number(award.userRank) > 5) {
      const rank = card.querySelector('.award-rank-box strong');
      if (rank) rank.textContent = '未进前五';
    }
  }

  function playRoleStarBurst() {
    document.body.classList.remove('owl-role-star-burst');
    void document.body.offsetWidth;
    document.body.classList.add('owl-role-star-burst');
    document.querySelector('.owl-role-star-confetti')?.remove();
    const layer = document.createElement('div');
    layer.className = 'owl-role-star-confetti';
    const colors = ['#ff9a62', '#ffd166', '#65d7b0', '#8fcfff'];
    for (let i = 0; i < 14; i += 1) {
      const piece = document.createElement('i');
      piece.style.setProperty('--x', `${Math.round((Math.random() - .5) * Math.min(window.innerWidth * .75, 680))}px`);
      piece.style.setProperty('--y', `${Math.round(window.innerHeight * (.48 + Math.random() * .28))}px`);
      piece.style.setProperty('--r', `${Math.round((Math.random() - .5) * 720)}deg`);
      piece.style.setProperty('--d', `${(Math.random() * .12).toFixed(2)}s`);
      piece.style.setProperty('--c', colors[i % colors.length]);
      layer.appendChild(piece);
    }
    document.body.appendChild(layer);
    setTimeout(() => layer.remove(), 1700);
    setTimeout(() => document.body.classList.remove('owl-role-star-burst'), 1450);
  }

  function celebrateRoleStarIfNeeded() {
    if (number(seasonState?.played) < number(seasonState?.total) || typeof ensureRegularSeasonAwards !== 'function') return false;
    const award = ensureRegularSeasonAwards();
    const group = window.__OWL_ROLE_STAR_RULES?.group?.(state.role);
    const quota = number(window.__OWL_ROLE_STAR_RULES?.quotas?.(year())?.[group]);
    const rank = number(award?.roleStars?.[group]?.userRank);
    if (!group || !rank || !quota || rank > quota) return false;
    careerState.owlRoleStarBurstYears = Array.isArray(careerState.owlRoleStarBurstYears) ? careerState.owlRoleStarBurstYears : [];
    if (careerState.owlRoleStarBurstYears.includes(year())) return false;
    careerState.owlRoleStarBurstYears.push(year());
    setTimeout(playRoleStarBurst, 160);
    return true;
  }

  if (typeof renderRegularSeasonAwards === 'function') {
    const base = renderRegularSeasonAwards;
    renderRegularSeasonAwards = function (...args) {
      const out = base.apply(this, args);
      shortenHawelka();
      return out;
    };
  }

  if (typeof renderSeason === 'function') {
    const base = renderSeason;
    renderSeason = function (...args) {
      const out = base.apply(this, args);
      migrateCurrentTactics();
      decorateFormat();
      celebrateRoleStarIfNeeded();
      return out;
    };
  }

  // ---------------- in-season special-training auto selection ----------------
  function heroValue(button) {
    return number((button.textContent || '').match(/当前\s*([\d.]+)/)?.[1] || 999);
  }

  function autoSelectSpecialTraining() {
    const root = document.getElementById('seasonEventContent');
    if (!root) return;
    const selectNext = remaining => {
      if (!remaining) return;
      const next = [...root.querySelectorAll('[data-v14-hero]')]
        .filter(button => !button.classList.contains('selected'))
        .sort((a, b) => heroValue(a) - heroValue(b))[0];
      if (!next) return;
      next.click();
      setTimeout(() => selectNext(remaining - 1), 20);
    };
    selectNext(2);
  }

  function installSpecialTrainingAutoButton() {
    const root = document.getElementById('seasonEventContent');
    if (!root || root.dataset.v97AutoSpecialInstalled) return;
    root.dataset.v97AutoSpecialInstalled = '1';
    const add = () => {
      const actions = root.querySelector('.v14-special-actions');
      if (!actions || actions.querySelector('#v14AutoSpecial')) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'secondary-btn';
      button.id = 'v14AutoSpecial';
      button.textContent = '⚙ 自动选择';
      button.addEventListener('click', autoSelectSpecialTraining);
      actions.insertBefore(button, actions.firstChild);
    };
    new MutationObserver(add).observe(root, { childList: true, subtree: true });
    add();
  }
  installSpecialTrainingAutoButton();

  // ---------------- veteran events, one new veteran event per season ----------------
  const VETERAN_EVENTS = [
    {
      id: 'v97-veteran-mentor', icon: '🧭', kicker: 'VETERAN · 经验传承', title: '年轻队友开始向你要一套赢法', minAge: 27, minCareer: 6, eventTags: ['veteran', 'team'], weight: 1.25,
      condition: () => !(seasonState.eventHistory || []).some(row => /^v97-veteran-/.test(String(row.id))),
      text: '你已经见过足够多的版本轮回，队里的年轻人开始在训练后留下来问你：关键局到底该怎么做。你可以把经验变成团队资产，也可以继续把它留在自己的脑子里。',
      choices: [
        { label: '带他们复盘关键局', desc: '提升队友关系和教练信任，但会消耗状态。', effects: { teammateBond: 10, coachTrust: 5, condition: -4 }, outcome: '你没有讲鸡汤，而是把那些真正输过的局一张张拆开。年轻人记住了，教练也看见了。' },
        { label: '只给最关键的一条建议', desc: '保留精力，稳定增加团队价值。', effects: { teammateBond: 5, awarenessAttr: 1, condition: 2 }, outcome: '你没有把经验变成一堂三小时的课，但那一句最重要的话确实留在了他们的训练笔记里。' },
        { label: '让他们自己撞墙', desc: '保持个人状态，但队内关系不会改善。', effects: { condition: 6, coachTrust: -2 }, outcome: '有些东西只能自己输过才学会。你选择暂时不替他们承担这笔学费。' }
      ]
    },
    {
      id: 'v97-veteran-body-budget', icon: '🩹', kicker: 'VETERAN · 身体管理', title: '你的训练计划开始给身体留余量', minAge: 27, minCareer: 6, eventTags: ['veteran', 'health'], weight: 1.2,
      condition: () => !(seasonState.eventHistory || []).some(row => /^v97-veteran-/.test(String(row.id))),
      text: '年轻时可以用一晚硬练解决的问题，现在会在第二天的手腕和反应里收利息。教练问你要不要把训练方式从“堆时长”换成“保质量”。',
      choices: [
        { label: '接受老将训练计划', desc: '恢复状态并保留稳定发挥。', effects: { condition: 12, coachTrust: 4, nextMatchBonus: -0.15 }, outcome: '你少练了一些无效时长，却把真正重要的内容练得更干净。老将的优势有时就是知道什么可以不做。' },
        { label: '维持原来的强度', desc: '短期竞争力更高，但身体负担继续累积。', effects: { condition: -8, nextMatchBonus: 0.8, coachTrust: 2 }, outcome: '你证明自己还可以顶住。只是身体已经开始把这句话记在账本上。' },
        { label: '把训练时间让给新人', desc: '强化传承与队内关系，个人状态小幅恢复。', effects: { teammateBond: 8, coachTrust: 6, condition: 5 }, outcome: '训练室里多了一个人获得成长，少了一个人和你争同一块时间。你开始理解“留下痕迹”不一定要靠击杀数。' }
      ]
    }
  ];
  if (typeof SEASON_EVENTS !== 'undefined') VETERAN_EVENTS.forEach(event => { if (!SEASON_EVENTS.some(item => item.id === event.id)) SEASON_EVENTS.push(event); });

  // ---------------- legacy portrait historical positioning ----------------
  function historyRankLabel(score) {
    const value = number(score);
    if (value >= 900) return 'GOAT';
    if (value >= 720) return '历史前三';
    if (value >= 560) return '历史前五';
    if (value >= 420) return '历史前十';
    if (value >= 300) return '历史前二十五';
    if (value >= 180) return '历史百大';
    return '未进入历史榜单';
  }

  function decorateHistoryRank() {
    if (typeof getRetirementSummaryData !== 'function') return;
    const data = getRetirementSummaryData();
    const label = historyRankLabel(data.historyScore);
    ['v710RetirementPortrait', 'v710RetiredResumePortrait'].forEach(id => {
      const portrait = document.getElementById(id);
      if (!portrait) return;
      portrait.querySelector('.v97-history-rank')?.remove();
      const rank = document.createElement('div');
      rank.className = 'v97-history-rank';
      rank.innerHTML = `<span>历史定位</span><strong>${label}</strong><em>历史分 ${data.historyScore}</em>`;
      portrait.querySelector('.v710-portrait-head')?.after(rank);
    });
    const score = document.getElementById('retiredResumeHistoryScore');
    if (score?.parentElement) {
      score.parentElement.querySelector('.v97-history-rank-label')?.remove();
      const rank = document.createElement('em');
      rank.className = 'v97-history-rank-label';
      rank.textContent = label;
      score.parentElement.appendChild(rank);
    }
  }

  if (typeof renderRetirementScreen === 'function') {
    const base = renderRetirementScreen;
    renderRetirementScreen = function (...args) {
      const out = base.apply(this, args);
      setTimeout(decorateHistoryRank, 0);
      return out;
    };
  }
  if (typeof renderRetiredCareerResume === 'function') {
    const base = renderRetiredCareerResume;
    renderRetiredCareerResume = function (...args) {
      const out = base.apply(this, args);
      setTimeout(decorateHistoryRank, 0);
      return out;
    };
  }

  window.__OWL_V97_QA = Object.freeze({
    version: VERSION,
    seasonFormat: y => seasonFormat(y),
    historyRank: historyRankLabel,
    contractMaxYears: age => number(age) >= 28 ? Math.max(1, 30 - number(age)) : 3,
    veteranEventIds: VETERAN_EVENTS.map(event => event.id),
    migrateCurrentTactics,
    autoSelectSpecialTraining,
  });
})();
