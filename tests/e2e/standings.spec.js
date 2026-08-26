const { test, expect } = require('@playwright/test');
const { freshApp, createCareer } = require('./helpers/app');
const { expectCleanRuntime, expectScreen } = require('./helpers/assertions');

test('standings: 2025 final table keeps wins, losses and LP in sync', async ({ page }) => {
  const monitor = await freshApp(page);
  await createCareer(page, { year: 2023, playerName: 'E2E_STANDINGS', age: 20 });
  await page.evaluate(() => {
    careerState.seasonYear = 2025;
    careerState.v13RuleIntroSeen2025 = true;
    seasonState.active = false;
    setupSeason(false);
    seasonState.eventSchedule = [];
    seasonState.played = seasonState.total = 56;
    seasonState.wins = 31;
    seasonState.losses = 25;
    seasonState.majorBonusLP = 3;
    seasonState.results = Array.from({ length: 56 }, (_, i) => i < 31 ? 'win' : 'loss');
    seasonState.userRatings = Array.from({ length: 56 }, () => 7.7);
    seasonState.v741FinalStandingsCache = null;
    seasonState.finalStandingsCache = null;
    renderSeason();
    showScreen('season');
  });
  await page.locator('#seasonYearChip').click();
  const userRow = page.locator('#b2StandingsBody tr.user');
  await expect(userRow).toContainText('31');
  await expect(userRow).toContainText('25');
  await expect(userRow).toContainText('34');
  expectCleanRuntime(monitor);
});

test('standings: 2027+ modal uses the same final standings as qualification', async ({ page }) => {
  const monitor = await freshApp(page);
  await createCareer(page, { year: 2023, playerName: 'E2E_FUTURE', age: 20 });
  const expected = await page.evaluate(() => {
    careerState.seasonYear = 2032;
    seasonState.active = false;
    setupSeason(false);
    seasonState.eventSchedule = [];
    seasonState.played = seasonState.total = 56;
    seasonState.wins = 30;
    seasonState.losses = 26;
    seasonState.majorBonusLP = 2;
    seasonState.results = Array.from({ length: 56 }, (_, i) => i < 30 ? 'win' : 'loss');
    seasonState.userRatings = Array.from({ length: 56 }, () => 7.7);
    seasonState.stageProcessed = [1, 2, 3];
    seasonState.stageBreakPending = null;
    seasonState.finalStandingsCache = null;
    seasonState.v34Postseason = null;
    seasonState.v34PostseasonTeams = [];
    renderSeason();
    showScreen('season');
    return { rank: estimateSeasonRank(), wins: seasonState.wins, losses: seasonState.losses, lp: seasonState.wins + Number(seasonState.majorBonusLP || 0) };
  });
  await page.locator('#seasonYearChip').click();
  const userRow = page.locator('#b2StandingsBody tr.user');
  await expect(userRow).toContainText(String(expected.wins));
  await expect(userRow).toContainText(String(expected.losses));
  await expect(userRow).toContainText(String(expected.lp));
  await expect(userRow.locator('.b2-rank')).toHaveText(String(expected.rank));
  expectCleanRuntime(monitor);
});

test('standings: a healthy player does not receive voluntary retirement at 25', async ({ page }) => {
  const monitor = await freshApp(page);
  await createCareer(page, { year: 2023, playerName: 'E2E_RETIRE', age: 20 });
  const result = await page.evaluate(() => {
    careerState.age = 25;
    careerState.injuryHistory = [];
    seasonState.played = seasonState.total;
    seasonState.wins = 30;
    seasonState.losses = Number(seasonState.total) - 30;
    playoffState.round = 'active';
    return { canConsider: window.__OWL_V23_UX.canConsiderRetirement(), shouldShow: shouldShowRetirementDecision() };
  });
  expect(result).toEqual({ canConsider: false, shouldShow: false });
  expectCleanRuntime(monitor);
});

async function seedCompletedFutureSeason(page, year = 2032) {
  await page.evaluate(targetYear => {
    careerState.seasonYear = targetYear;
    careerState.v13RuleIntroSeen2025 = true;
    seasonState.active = false;
    setupSeason(false);
    seasonState.eventSchedule = [];
    seasonState.played = seasonState.total = 56;
    seasonState.wins = 46;
    seasonState.losses = 10;
    seasonState.results = Array.from({ length: 56 }, (_, i) => i < 46 ? 'win' : 'loss');
    seasonState.userRatings = Array.from({ length: 56 }, () => 8.2);
    seasonState.stageProcessed = [1, 2, 3];
    seasonState.stageBreakPending = null;
    playoffState.active = false;
    playoffState.round = 'active';
    playoffState.matches = [];
    playoffState.results = [];
    renderSeason();
    showScreen('season');
  }, year);
}

test('standings: season page playoff CTA rebuilds a stale future postseason cache', async ({ page }) => {
  const monitor = await freshApp(page);
  await createCareer(page, { year: 2023, playerName: 'E2E_PLAYOFF_CTA', age: 20 });
  await seedCompletedFutureSeason(page, 2032);
  await page.evaluate(() => {
    seasonState.v34Postseason = { year: 2031, resolved: true, userQualified: false, userSeed: null, logs: [] };
    seasonState.v34PostseasonTeams = TEAMS.filter(team => team.name !== careerState.team.name).slice(0, 8);
    renderSeason();
  });
  await expect(page.locator('#enterPlayoffsBtn')).toBeVisible();
  await page.locator('#enterPlayoffsBtn').click();
  await expectScreen(page, 'playoff');
  await page.waitForFunction(() => !!playoffState?.active && !!currentPlayoffMatch());
  expectCleanRuntime(monitor);
});

test('standings: annual awards continue repairs an uninitialized playoff state', async ({ page }) => {
  const monitor = await freshApp(page);
  await createCareer(page, { year: 2023, playerName: 'E2E_AWARDS_FLOW', age: 20 });
  await seedCompletedFutureSeason(page, 2029);
  await page.evaluate(() => openRegularSeasonAwards());
  await expectScreen(page, 'awards');
  await page.locator('#awardsContinueBtn').click();
  await expectScreen(page, 'playoff');
  await page.waitForFunction(() => !!playoffState?.active && !!currentPlayoffMatch());
  expectCleanRuntime(monitor);
});

test('standings: season summary continue repairs the same completed-season playoff state', async ({ page }) => {
  const monitor = await freshApp(page);
  await createCareer(page, { year: 2023, playerName: 'E2E_SUMMARY_FLOW', age: 20 });
  await seedCompletedFutureSeason(page, 2029);
  await page.evaluate(() => {
    seasonState.v34Postseason = { year: 2027, resolved: true, userQualified: false, userSeed: null, logs: [] };
    seasonState.v34PostseasonTeams = TEAMS.filter(team => team.active !== false && team.name !== careerState.team.name).slice(0, 8);
    showSeasonSummary();
  });
  await expectScreen(page, 'summary');
  await expect(page.locator('#summaryOffseasonBtn')).toHaveText(/继续季后赛/);
  await page.locator('#summaryOffseasonBtn').click();
  await expectScreen(page, 'playoff');
  await page.waitForFunction(() => !!playoffState?.active && !!currentPlayoffMatch());
  expectCleanRuntime(monitor);
});
