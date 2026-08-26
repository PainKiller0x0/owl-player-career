const { test, expect } = require('@playwright/test');
const { freshApp, createCareer } = require('./helpers/app');
const { loadAndVerifyScenario } = require('./helpers/scenarios');
const { expectCleanRuntime, expectScreen } = require('./helpers/assertions');

test('career: contract expiry has offers and signing advances one season', async ({ page }) => {
  const monitor = await freshApp(page);
  await loadAndVerifyScenario(page, 'contract-expiry');
  const beforeYear = await page.evaluate(() => Number(careerState.seasonYear));
  await page.locator('[data-offer-id]').first().click();
  await expect(page.locator('#signOfferBtn')).toBeEnabled();
  await page.locator('#signOfferBtn').click();
  const after = await page.evaluate(() => ({ year: Number(careerState.seasonYear), phase: offseasonState.phase, team: careerState.team?.name, contract: careerState.contract }));
  expect(after.year).toBe(beforeYear + 1);
  expect(after.phase).toBe('signed');
  expect(after.team).toBeTruthy();
  expect(after.contract.remaining).toBeGreaterThan(0);
  expectCleanRuntime(monitor);
});

test('career: age 29 scenario has archive and can reach mandatory retirement', async ({ page }) => {
  const monitor = await freshApp(page);
  await loadAndVerifyScenario(page, 'retirement-age29');
  const first = await page.evaluate(() => window.__OWL_PUBLIC_BETA.qaMacroAdvanceSeason());
  expect(first.ok, JSON.stringify(first)).toBe(true);
  const afterAge = await page.evaluate(() => ({ age: careerState.age, retired: careerState.retired, archive: careerState.careerArchive.length }));
  expect(afterAge.age).toBe(30);
  expect(afterAge.archive).toBeGreaterThanOrEqual(5);
  if (!afterAge.retired) {
    const second = await page.evaluate(() => window.__OWL_PUBLIC_BETA.qaMacroAdvanceSeason());
    expect(second.ok, JSON.stringify(second)).toBe(true);
  }
  await expectScreen(page, 'retirement');
  await expect(page.locator('#retirementTimeline')).not.toBeEmpty();
  expectCleanRuntime(monitor);
});

test('career: long QA macro run reaches 2030 without save-flow errors', async ({ page }) => {
  const monitor = await freshApp(page);
  await page.evaluate(() => {
    state.role = '弹道输出';
    state.playerName = 'E2E_LONG';
    state.playerCountry = 'cn';
    state.locked = Object.fromEntries(ATTRS.map(attr => [attr.key, { value: 82, player: 'E2E', role: state.role, team: 'E2E' }]));
    careerState.simulationMode = 'fantasy';
    careerState.startYear = 2023;
    careerState.seasonYear = 2023;
    careerState.startAge = 18;
    careerState.age = 18;
    careerState.careerYears = 1;
    v50ApplySeasonWorld(2023);
    setupCareerTeam(false, TEAMS.find(team => team.active !== false));
    setupSeason(false);
    renderSeason();
    showScreen('season');
  });
  for (const targetYear of [2024, 2025, 2026, 2027, 2028, 2029, 2030]) {
    const result = await page.evaluate(() => window.__OWL_PUBLIC_BETA.qaMacroAdvanceSeason());
    expect(result.ok, `target ${targetYear}: ${JSON.stringify(result)}`).toBe(true);
    if (result.retired) break;
    expect(await page.evaluate(() => Number(careerState.seasonYear))).toBe(targetYear);
  }
  expect(await page.evaluate(() => Number(careerState.seasonYear))).toBeGreaterThanOrEqual(2030);
  expectCleanRuntime(monitor);
});

test('career: withdrawing from a 2027+ All-Star opens the comeback training or rest event', async ({ page }) => {
  const monitor = await freshApp(page);
  await createCareer(page, { year: 2023, playerName: 'E2E_WITHDRAW', age: 20 });
  await page.evaluate(() => {
    careerState.seasonYear = 2027;
    seasonState.active = false;
    setupSeason(false);
    seasonState.eventSchedule = [];
    seasonState.v71AllStar = {
      year: 2027, selected: true, starter: false, allStarMvp: false, risingEligible: false, risingMvp: false,
      sniperEntered: false, sniperWin: false, allRoundEntered: false, allRoundWin: false, breadth: 4, widow: 80,
      winner: 'East', side: '东部', opponent: '西部', global: false, participation: null, popApplied: false, popGain: 4,
    };
    seasonState.v71AllStarPending = false;
    careerState.v14SpecialHeroTraining = [];
    renderSeason();
    showScreen('season');
    window.__OWL_V34_FUTURE.allStar(false);
  });
  await page.locator('#v34WithdrawAllStar').click();
  await expect(page.locator('#v34CloseAllStar')).toBeVisible();
  await page.locator('#v34CloseAllStar').click();
  await expect(page.locator('#seasonEventContent')).toContainText('主动退出全明星');
  await expect(page.locator('#v14ApplySpecial, #v14SkipSpecial')).toHaveCount(2);
  expectCleanRuntime(monitor);
});

test('career: repeated MVPs apply fatigue and trigger the season MVP celebration', async ({ page }) => {
  const monitor = await freshApp(page, { viewport: { width: 1280, height: 720 } });
  await createCareer(page, { year: 2023, playerName: 'E2E_MVP', age: 20 });
  const result = await page.evaluate(() => {
    careerState.seasonYear = 2025;
    careerState.v13RuleIntroSeen2025 = true;
    seasonState.active = false;
    setupSeason(false);
    seasonState.eventSchedule = [];
    seasonState.played = seasonState.total = 56;
    seasonState.wins = 46;
    seasonState.losses = 10;
    seasonState.results = Array.from({ length: 56 }, (_, i) => i < 46 ? 'win' : 'loss');
    seasonState.userRatings = Array.from({ length: 56 }, () => 8.4);
    careerState.careerArchive = [
      { year: 2023, awards: { mvp: { userRank: 1 } } },
      { year: 2024, awards: { mvp: { winner: { isUser: true } } } },
    ];
    seasonState.awards = null;
    const awards = ensureRegularSeasonAwards();
    awards.mvp.userRank = 1;
    renderRegularSeasonAwards();
    openRegularSeasonAwards();
    return { fatigue: awards.mvpFatigue, bodyFont: getComputedStyle(document.body).fontSize };
  });
  expect(result.fatigue).toEqual({ streak: 2, penalty: 6 });
  expect(result.bodyFont).toBe('17px');
  await page.waitForFunction(() => document.body.classList.contains('season-mvp-burst'));
  await expect(page.locator('.season-mvp-confetti i')).toHaveCount(32);
  expectCleanRuntime(monitor);
});

test('career: playoff dominance needs a ten-point gap and FMVP needs standout performance', async ({ page }) => {
  const monitor = await freshApp(page);
  await createCareer(page, { year: 2023, playerName: 'E2E_BALANCE', age: 20 });
  const result = await page.evaluate(() => {
    careerState.careerArchive = [
      { honors: ['总冠军', 'MVP', '总决赛MVP'] },
      { honors: ['总冠军', 'MVP', '总决赛MVP'] },
    ];
    const fmvp = window.__OWL_BALANCE.rankFinalsMvpCandidates([
      { name: 'Rookie', rating: 8.25, isUser: true, overall: 87 },
      { name: '队友A', rating: 8.3, isUser: false, overall: 95 },
      { name: '队友B', rating: 7.0, isUser: false, overall: 82 },
    ]);
    const noStandout = window.__OWL_BALANCE.rankFinalsMvpCandidates([
      { name: 'Rookie', rating: 7.9, isUser: true, overall: 87 },
      { name: '队友A', rating: 8.1, isUser: false, overall: 95 },
      { name: '队友B', rating: 7.7, isUser: false, overall: 82 },
    ]);
    playoffState.results = [{ rating: 8.3 }];
    playoffState.round = 'champion';
    seasonState.wins = 42;
    seasonState.losses = 14;
    seasonState.total = 56;
    const training = getTrainingPointBreakdown(21);
    return {
      mapNine: window.__OWL_BALANCE.mapFightWinProbability(9),
      mapTen: window.__OWL_BALANCE.mapFightWinProbability(10),
      mapTwenty: window.__OWL_BALANCE.mapFightWinProbability(20),
      fmvp: fmvp.winner.name,
      impression: fmvp.winner.impression,
      noStandout: noStandout.winner.name,
      playoffTrainingBonus: training.playoffPerformanceBonus,
    };
  });
  expect(result.mapNine).toBeLessThan(0.66);
  expect(result.mapTen).toBeGreaterThan(result.mapNine);
  expect(result.mapTwenty).toBeGreaterThan(0.85);
  expect(result.fmvp).toBe('Rookie');
  expect(result.impression).toBeGreaterThan(0);
  expect(result.noStandout).toBe('队友A');
  expect(result.playoffTrainingBonus).toBeGreaterThan(0);
  expectCleanRuntime(monitor);
});
