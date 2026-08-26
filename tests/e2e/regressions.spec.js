const { test, expect } = require('@playwright/test');
const { freshApp, loadQaScenario } = require('./helpers/app');
const { expectCleanRuntime, expectScreen } = require('./helpers/assertions');

test('regression: Hero Ban is only active in the real 2025 experiment season', async ({ page }) => {
  const monitor = await freshApp(page);
  await loadQaScenario(page, '2025-stage2');
  const result = await page.evaluate(() => {
    const check = year => {
      careerState.seasonYear = year;
      seasonState.active = false;
      setupSeason(false);
      seasonState.played = 0;
      return { year, strategicDraft: v71HasStrategicDraft(), format: window.getSeasonFormat(year) };
    };
    return {
      2025: check(2025),
      2026: check(2026),
      2033: check(2033),
    };
  });
  expect(result[2025]).toMatchObject({ strategicDraft: true, format: { heroBan: true, mapVoting: true } });
  expect(result[2026]).toMatchObject({ strategicDraft: false, format: { heroBan: false, mapVoting: false } });
  expect(result[2033]).toMatchObject({ strategicDraft: false, format: { heroBan: false, mapVoting: false } });
  expectCleanRuntime(monitor);
});

test('regression: 2023 Seoul Infernal keeps a visible offline logo after rebrand', async ({ page }) => {
  const monitor = await freshApp(page);
  await loadQaScenario(page, '2023-pre-playoffs');
  const result = await page.evaluate(() => {
    const team = TEAMS.find(item => item.name === '首尔烈火');
    const holder = document.createElement('div');
    holder.innerHTML = teamLogoMarkup(team);
    const image = holder.querySelector('img');
    return { short: team?.short, displayShort: team?.displayShort, logo: team?.logo || '', src: image?.getAttribute('src') || '' };
  });
  expect(result).toMatchObject({ short: 'PHI', displayShort: 'INF' });
  expect(result.logo).toMatch(/^data:image\/png;base64,iVBORw0KGgo/);
  expect(result.src).toMatch(/^data:image\/png;base64,iVBORw0KGgo/);
  expectCleanRuntime(monitor);
});

test('regression: Guangzhou Charge uses its own offline logo instead of the short-code fallback', async ({ page }) => {
  const monitor = await freshApp(page);
  const result = await page.evaluate(() => {
    const team = TEAMS.find(item => item.short === 'GZC');
    const holder = document.createElement('div');
    holder.innerHTML = teamLogoMarkup(team);
    const image = holder.querySelector('img');
    return { src: image?.getAttribute('src') || '', fallback: holder.querySelector('.team-logo-fallback')?.textContent || '' };
  });
  expect(result.src).toMatch(/^data:image\/png;base64,iVBORw0KGgo/);
  expect(result.src).not.toContain('%3Crect%20x%3D%224%22%20y%3D%224%22%20width%3D%2288%22');
  expect(result.fallback).toBe('GZC');
  expectCleanRuntime(monitor);
});

test('regression: every real OWL team and historical rebrand uses an offline logo', async ({ page }) => {
  const monitor = await freshApp(page);
  const result = await page.evaluate(() => {
    const teams = TEAMS.map(team => ({ short: team.short, displayShort: team.displayShort || '', name: team.name }));
    teams.push({ short: 'PAR', displayShort: 'VEG', name: 'Vegas Eternal' });
    teams.push({ short: 'PHI', displayShort: 'INF', name: 'Seoul Infernal' });
    return teams.map(team => {
      const holder = document.createElement('div');
      holder.innerHTML = teamLogoMarkup(team);
      return { ...team, src: holder.querySelector('img')?.getAttribute('src') || '' };
    });
  });
  expect(result).toHaveLength(22);
  for (const team of result) {
    expect(team.src, `${team.short}/${team.displayShort}`).toMatch(/^data:image\/(?:svg\+xml|png);base64,/);
  }
  expectCleanRuntime(monitor);
});

test('regression: World Cup rejection training blocks whole-season resume until resolved', async ({ page }) => {
  const monitor = await freshApp(page);
  await loadQaScenario(page, '2019-season-start');
  const before = await page.evaluate(() => {
    const year = careerState.seasonYear;
    const record = careerState.worldCup.seasons[year];
    Object.assign(record, { phase: 'not-selected', pendingStage: null, standbyPending: false, completed: true, result: '国家队落选' });
    seasonState.played = seasonState.total;
    seasonState.stageProcessed = [];
    seasonState.eventDue = true;
    seasonState.v13ResumeWholeAfterWorldCup = true;
    seasonState.simulating = false;
    window.__OWL_WORLD_CUP.close();
    return { eventDue: seasonState.eventDue, simulating: seasonState.simulating, resumeAfterWorldCup: seasonState.v13ResumeWholeAfterWorldCup };
  });
  await expect(page.locator('#seasonEventOverlay')).not.toHaveClass(/hidden/);
  await expect(page.locator('#seasonEventContent')).toContainText('落选之后');
  expect(before).toMatchObject({ eventDue: true, simulating: false, resumeAfterWorldCup: false });
  await page.locator('#v14SkipSpecial').click();
  await expect(page.locator('#seasonEventOverlay')).toHaveClass(/hidden/);
  const after = await page.evaluate(() => ({ pending: !!seasonState.v14SpecialTrainingPending, deferred: !!seasonState.v14SpecialTrainingDeferred, resume: !!seasonState.v14ResumeWholeAfterSpecialTraining, simulating: !!seasonState.simulating }));
  expect(after).toEqual({ pending: false, deferred: false, resume: false, simulating: false });
  expectCleanRuntime(monitor);
});

test('regression: total standings show the same colored East/West badges as team selection', async ({ page }) => {
  const monitor = await freshApp(page);
  await loadQaScenario(page, '2023-pre-playoffs');
  await page.locator('#seasonYearChip').click();
  const overlayStyle = await page.locator('#b2StandingsOverlay').evaluate(el => {
    const style = getComputedStyle(el);
    return { position: style.position, top: style.top, left: style.left, zIndex: style.zIndex };
  });
  expect(overlayStyle).toMatchObject({ position: 'fixed', top: '0px', left: '0px' });
  await expect(page.locator('#b2StandingsBody')).toContainText('东部');
  await expect(page.locator('#b2StandingsBody')).toContainText('西部');
  expect(await page.locator('#b2StandingsBody .b2-region-badge.east').count()).toBeGreaterThan(0);
  expect(await page.locator('#b2StandingsBody .b2-region-badge.west').count()).toBeGreaterThan(0);
  expectCleanRuntime(monitor);
});

test('regression: 2019 team selection maps Pacific to East and Atlantic to West', async ({ page }) => {
  const monitor = await freshApp(page);
  const groups = await page.evaluate(() => {
    careerState.startYear = 2019;
    careerState.seasonYear = 2019;
    careerState.teamSelectManual = true;
    v50ApplySeasonWorld(2019);
    renderTeamChoiceWheel();
    return window.__OWL_V771_TEAM_QA();
  });
  const east = groups.find(group => group.region === 'East');
  const west = groups.find(group => group.region === 'West');
  expect(east).toMatchObject({ label: '太平洋赛区', teams: expect.arrayContaining(['GZC', 'CDH']) });
  expect(west).toMatchObject({ label: '大西洋赛区', teams: expect.arrayContaining(['ATL', 'BOS']) });
  expectCleanRuntime(monitor);
});

test('regression: career season chip opens the total standings for historical seasons', async ({ page }) => {
  const monitor = await freshApp(page);
  await loadQaScenario(page, '2023-pre-playoffs');
  await page.evaluate(() => {
    renderCareerTeam();
    showScreen('team');
  });
  await expect(page.locator('#teamScreen')).toHaveClass(/active/);
  await page.locator('#careerSeasonChip').click();
  await expect(page.locator('#b2StandingsOverlay')).not.toHaveClass(/ui-hidden/);
  await expect(page.locator('#b2StandingsTitle')).toContainText('2023');
  await expect(page.locator('#b2StandingsBody')).toContainText('首尔烈火');
  expectCleanRuntime(monitor);
});

test('regression: regular-season MVP celebration fires during season-end render', async ({ page }) => {
  const monitor = await freshApp(page);
  await loadQaScenario(page, '2025-pre-finals');
  await page.evaluate(() => {
    seasonState.played = seasonState.total;
    seasonState.awards = null;
    const awards = ensureRegularSeasonAwards();
    awards.mvp.userRank = 1;
    careerState.owlMvpBurstYears = [];
    renderSeason();
  });
  await page.waitForFunction(() => document.body.classList.contains('season-mvp-burst'));
  await expect(page.locator('.season-mvp-confetti i')).toHaveCount(32);
  expectCleanRuntime(monitor);
});

test('regression: training-point decay keeps a three-point floor', async ({ page }) => {
  const monitor = await freshApp(page);
  await loadQaScenario(page, 'retirement-age29');
  const result = await page.evaluate(() => getTrainingPointBreakdown(99));
  expect(result.base).toBe(0);
  expect(result.total).toBe(3);
  expectCleanRuntime(monitor);
});

test('regression: formal role transfer keeps its adaptation penalty in effective OVR', async ({ page }) => {
  const monitor = await freshApp(page);
  await loadQaScenario(page, '2025-stage2');
  const result = await page.evaluate(() => {
    careerState.roleAdaptation = 100;
    const adapted = (() => {
      careerState.roleAdaptation = 70;
      return Number(getMyOvr());
    })();
    const settled = (() => {
      careerState.roleAdaptation = 100;
      return Number(getMyOvr());
    })();
    return { adapted, settled, gap: settled - adapted };
  });
  expect(result.adapted).toBeLessThan(result.settled);
  expect(result.gap).toBeGreaterThanOrEqual(2);
  expectCleanRuntime(monitor);
});

test('regression: expansion teams have names, distinct marks, correct Stage progress and standings rows', async ({ page }) => {
  const monitor = await freshApp(page);
  await loadQaScenario(page, '2025-stage2');
  const result = await page.evaluate(() => {
    careerState.seasonYear = 2035;
    careerState.v13RuleIntroSeen2025 = true;
    v50ApplySeasonWorld(2035);
    seasonState.active = false;
    setupSeason(false);
    const expansion = TEAMS.filter(team => team.expansion).map(team => ({
      name: team.name,
      short: team.short,
      logo: team.logo,
    }));
    const format = v71SeasonFormat();
    const progressAt = played => {
      seasonState.played = played;
      seasonState.results = Array(format.total).fill(null);
      renderSeason();
      return {
        stage: v71StageNo(),
        text: document.getElementById('seasonProgressCopy')?.textContent || '',
      };
    };
    const stage2 = progressAt(24);
    const stage3 = progressAt(46);
    seasonState.played = format.total;
    seasonState.wins = 34;
    seasonState.losses = format.total - seasonState.wins;
    seasonState.results = Array.from({ length: format.total }, (_, index) => index < seasonState.wins ? 'win' : 'loss');
    seasonState.eventDue = false;
    seasonState.currentEvent = null;
    document.getElementById('seasonEventOverlay')?.classList.add('hidden');
    seasonState.finalStandingsCache = null;
    renderSeason();
    offseasonState.contractExpired = true;
    offseasonState.selectedOfferId = null;
    careerState.contract = { years: 1, remaining: 0, salary: 42, rolePromise: '核心首发', teamName: careerState.team.name };
    offseasonState.offers = [{
      id: 'expansion-test', renewal: false, team: TEAMS.find(team => team.expansion),
      tactic: careerState.tactic, fit: 88, years: 2, salary: 50,
      rolePromise: '核心首发', teamPower: 82, note: '扩军测试报价',
      fitBreakdown: { personal: 88, natural: 88, rosterNeed: 88, roster: { label: '扩军阵容缺口', count: 0, best: 0 } },
    }];
    renderContractMarket(document.getElementById('offseasonContent'));
    return { format, expansion, stage2, stage3, expansionBadge: document.querySelector('.expansion-offer .offer-badge')?.textContent || '' };
  });
  expect(result.format).toMatchObject({ total: 68, lens: [23, 22, 23] });
  expect(result.expansion).toHaveLength(4);
  expect(result.expansion.map(team => team.name)).not.toContain('—');
  expect(new Set(result.expansion.map(team => team.logo)).size).toBe(4);
  expect(result.stage2).toMatchObject({ stage: 2 });
  expect(result.stage2.text).toContain('Stage 2');
  expect(result.stage2.text).not.toContain('Stage 3');
  expect(result.stage3).toMatchObject({ stage: 3 });
  expect(result.stage3.text).toContain('Stage 3');
  expect(result.expansionBadge).toBe('扩军新军');
  await page.evaluate(() => {
    seasonState.eventDue = false;
    seasonState.currentEvent = null;
    document.getElementById('seasonEventOverlay')?.classList.add('hidden');
  });
  await page.locator('#seasonYearChip').click({ force: true });
  await expect(page.locator('#b2StandingsBody')).toContainText('东京弧光');
  await expect(page.locator('#b2StandingsBody')).toContainText('大阪风暴');
  await expect(page.locator('#b2StandingsBody')).toContainText('柏林先锋');
  await expect(page.locator('#b2StandingsBody')).toContainText('利雅得日蚀');
  expectCleanRuntime(monitor);
});

test('regression: retirement archive normalizes object-valued team names', async ({ page }) => {
  const monitor = await freshApp(page);
  await loadQaScenario(page, 'retirement-age29');
  await page.evaluate(() => {
    careerState.retired = true;
    careerState.careerArchive = [{
      year: 2028,
      age: 26,
      team: { name: '广州冲锋', short: 'GZC' },
      role: state.role,
      ovr: 87,
      rating: 8.1,
      result: '总冠军',
      honors: ['总冠军'],
      stats: { appearances: 56, eliminations: 100, deaths: 50, assists: 80, firstPicks: 10 },
      awards: {},
    }];
    renderRetirementScreen();
    showScreen('retirement');
  });
  await expectScreen(page, 'retirement');
  await expect(page.locator('#retirementTimeline')).toContainText('广州冲锋');
  await expect(page.locator('body')).not.toContainText('[object Object]');
  expectCleanRuntime(monitor);
});
