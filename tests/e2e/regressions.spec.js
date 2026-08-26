const { test, expect } = require('@playwright/test');
const { freshApp, loadQaScenario } = require('./helpers/app');
const { expectCleanRuntime, expectScreen } = require('./helpers/assertions');

test('regression: 2033 leaves the Hero Ban era and keeps the three-Stage boundaries', async ({ page }) => {
  const monitor = await freshApp(page);
  await loadQaScenario(page, '2025-stage2');
  const result = await page.evaluate(() => {
    careerState.seasonYear = 2033;
    seasonState.active = false;
    setupSeason(false);
    const format = v71SeasonFormat();
    const stages = [19, 20, 37, 38, 56].map(played => {
      seasonState.played = played;
      return [played, v71StageNo()];
    });
    return {
      strategicDraft: v71HasStrategicDraft(),
      total: format.total,
      stages,
      heroBanRule: window.getSeasonFormat(2033).heroBan,
    };
  });
  expect(result).toMatchObject({ strategicDraft: false, total: 56, heroBanRule: false });
  expect(result.stages).toEqual([[19, 2], [20, 2], [37, 3], [38, 3], [56, 3]]);
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
