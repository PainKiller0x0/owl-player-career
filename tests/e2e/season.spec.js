const { test, expect } = require('@playwright/test');
const { freshApp, createCareer } = require('./helpers/app');
const { expectCleanRuntime, expectNoSimulationDeadlock, expectScreen } = require('./helpers/assertions');

test('season: whole-season simulation advances beyond one match', async ({ page }) => {
  const monitor = await freshApp(page);
  await createCareer(page, { year: 2019, playerName: 'E2E_WHOLE', age: 17 });
  await page.evaluate(() => { seasonState.eventSchedule = []; seasonState.eventTriggeredAt = []; seasonState.eventDue = false; seasonState.currentEvent = null; renderSeason(); });
  const before = await page.evaluate(() => Number(seasonState.played || 0));
  await page.locator('#fullSimSeasonBtn').click();
  await page.waitForFunction(start => Number(seasonState?.played || 0) >= start + 3, before, { timeout: 12_000 });
  expect(await page.evaluate(() => seasonState.played)).toBeGreaterThanOrEqual(before + 3);
  await page.evaluate(() => window.__OWL_RUNTIME?.simulation?.stopWhole?.('E2E scheduler checkpoint'));
  await expectNoSimulationDeadlock(page);
  expectCleanRuntime(monitor);
});

test('season: completed regular season keeps stage processing and annual playoffs separate', async ({ page }) => {
  const monitor = await freshApp(page);
  await createCareer(page, { year: 2023, playerName: 'E2E_COMPLETE', age: 18 });
  const result = await page.evaluate(() => {
    careerState.seasonYear = 2025;
    careerState.v13RuleIntroSeen2025 = true;
    seasonState.active = false;
    setupSeason(false);
    seasonState.eventSchedule = [];
    seasonState.played = seasonState.total = 56;
    seasonState.wins = 42;
    seasonState.losses = 14;
    seasonState.results = Array.from({ length: 56 }, (_, i) => i < 42 ? 'win' : 'loss');
    seasonState.userRatings = Array.from({ length: 56 }, () => 7.5);
    seasonState.stageProcessed = [1, 2, 3];
    seasonState.stageBreakPending = null;
    seasonState.awardsViewed = true;
    playoffState.active = false;
    playoffState.matches = [];
    playoffState.round = 'active';
    renderSeason();
    document.getElementById('seasonEventOverlay')?.classList.add('hidden');
    showScreen('season');
    return { played: seasonState.played, total: seasonState.total, stageProcessed: seasonState.stageProcessed, playoffActive: playoffState.active, rank: estimateSeasonRank() };
  });
  expect(result.played).toBe(result.total);
  expect(result.stageProcessed).toEqual([1, 2, 3]);
  expect(result.playoffActive).toBe(false);
  expect(result.rank).toBeLessThanOrEqual(8);
  await expectScreen(page, 'season');
  await expect(page.locator('#enterPlayoffsBtn')).toBeVisible();
  await page.locator('#enterPlayoffsBtn').click();
  await expectScreen(page, 'playoff');
  await page.waitForFunction(() => !!playoffState?.active && !!currentPlayoffMatch());
  expectCleanRuntime(monitor);
});

test('season: whole-season simulation pauses at the All-Star checkpoint instead of skipping it', async ({ page }) => {
  const monitor = await freshApp(page);
  await createCareer(page, { year: 2023, playerName: 'E2E_ALLSTAR_SIM', age: 17 });
  await page.evaluate(() => {
    careerState.seasonYear = 2025;
    careerState.v13RuleIntroSeen2025 = true;
    seasonState.active = false;
    setupSeason(false);
    seasonState.eventSchedule = [];
    seasonState.played = 18;
    seasonState.wins = 9;
    seasonState.losses = 9;
    seasonState.results = Array.from({ length: 56 }, (_, i) => i < 18 ? (i % 2 ? 'loss' : 'win') : null);
    seasonState.stageProcessed = [1];
    seasonState.stageBreakPending = null;
    seasonState.v71AllStar = null;
    seasonState.v71AllStarPending = false;
    renderSeason();
    showScreen('season');
    window.__OWL_V18_FULL_SEASON();
  });
  await page.waitForFunction(() => {
    const overlay = document.getElementById('seasonEventOverlay');
    return !!seasonState?.v71AllStarPending && !!overlay && !overlay.classList.contains('hidden');
  }, null, { timeout: 12_000 });
  await expect(page.locator('#seasonEventContent')).toContainText('全明星');
  const attend = page.locator('#v71AttendAllStar, #v34AttendAllStar').first();
  const withdraw = page.locator('#v71WithdrawAllStar, #v34WithdrawAllStar').first();
  if (await attend.isVisible().catch(() => false)) await attend.click();
  else if (await withdraw.isVisible().catch(() => false)) await withdraw.click();
  const close = page.locator('#v71CloseAllStar, #v34CloseAllStar').first();
  if (await close.isVisible().catch(() => false)) await close.click();
  await page.waitForFunction(() => Number(seasonState?.played || 0) > 19, null, { timeout: 12_000 });
  expectCleanRuntime(monitor);
});
