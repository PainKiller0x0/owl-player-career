const { test, expect } = require('@playwright/test');
const { freshApp } = require('./helpers/app');
const { loadAndVerifyScenario } = require('./helpers/scenarios');
const { expectCleanRuntime, expectNoSimulationDeadlock } = require('./helpers/assertions');

test('trade: offer can be accepted and regular-season progress is preserved', async ({ page }) => {
  const monitor = await freshApp(page);
  await loadAndVerifyScenario(page, 'trade-offer');
  const before = await page.evaluate(() => ({ played: seasonState.played, from: careerState.team.name }));
  await page.locator('#v800TradeAccept').click();
  await expect(page.locator('#v800TradeOverlay')).toHaveClass(/ui-hidden/);
  const after = await page.evaluate(() => ({ played: seasonState.played, team: careerState.team.name, pending: careerState.v800Trade?.pending, completed: careerState.v800Trade?.completed }));
  expect(after.played).toBe(before.played);
  expect(after.team).not.toBe(before.from);
  expect(after.pending).toBeNull();
  expect(after.completed).toBe(true);
  await expectNoSimulationDeadlock(page);
  expectCleanRuntime(monitor);
});

test('trade: offer can be declined and the player remains on the same team', async ({ page }) => {
  const monitor = await freshApp(page);
  await loadAndVerifyScenario(page, 'trade-offer');
  const before = await page.evaluate(() => careerState.team.name);
  await page.locator('#v800TradeStay').click();
  await expect(page.locator('#v800TradeOverlay')).toHaveClass(/ui-hidden/);
  const after = await page.evaluate(() => ({ team: careerState.team.name, completed: careerState.v800Trade?.completed, pending: careerState.v800Trade?.pending }));
  expect(after.team).toBe(before);
  expect(after.completed).toBe(true);
  expectCleanRuntime(monitor);
});
