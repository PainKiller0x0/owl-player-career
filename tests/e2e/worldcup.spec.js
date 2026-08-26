const { test, expect } = require('@playwright/test');
const { freshApp } = require('./helpers/app');
const { loadAndVerifyScenario, scenarioDiagnostic } = require('./helpers/scenarios');
const { expectCleanRuntime, expectScreen } = require('./helpers/assertions');

test('worldcup: selection scenario supports direct selection entry', async ({ page }) => {
  const monitor = await freshApp(page);
  await loadAndVerifyScenario(page, 'worldcup-selection');
  await expect(page.locator('#vwcOverlay')).not.toHaveClass(/ui-hidden/);
  await expect(page.locator('#vwcBody [data-vwc-select]')).toHaveCount(3);
  await page.locator('#vwcBody [data-vwc-select]').first().click();
  await page.waitForFunction(() => window.__OWL_WORLD_CUP.snapshot().seasons['2026']?.selected === true);
  const state = await scenarioDiagnostic(page);
  expect(state.diagnostic.seasonYear).toBe(2026);
  expectCleanRuntime(monitor);
});

test('worldcup: knockout scenario advances and finalizes the player country consistently', async ({ page }) => {
  const monitor = await freshApp(page);
  await loadAndVerifyScenario(page, 'worldcup-knockout');
  const initial = await page.evaluate(() => window.__OWL_WORLD_CUP.snapshot().seasons['2026']);
  expect(initial.stageState.opponents).toHaveLength(2);
  await page.locator('#vwcPlayNext').click();
  await page.waitForFunction(() => Number(window.__OWL_WORLD_CUP.snapshot().seasons['2026']?.stageState?.index || 0) >= 1 || !!window.__OWL_WORLD_CUP.snapshot().seasons['2026']?.completed);
  const afterFirst = await page.evaluate(() => window.__OWL_WORLD_CUP.snapshot().seasons['2026']);
  if (!afterFirst.completed) {
    await page.locator('#vwcPlayNext').click();
    await page.waitForFunction(() => !!window.__OWL_WORLD_CUP.snapshot().seasons['2026']?.completed);
  }
  const completed = await page.evaluate(() => window.__OWL_WORLD_CUP.snapshot().seasons['2026']);
  expect(completed.completed).toBe(true);
  expect(completed.worldChampion).toBeTruthy();
  if (completed.result === '世界杯冠军') expect(completed.worldChampion).toBe(completed.representingCountry);
  expect(completed.matches.filter(match => match.stage === 'knockout').length).toBeGreaterThan(0);
  await page.locator('#vwcClose').click();
  await expectScreen(page, 'season');
  expectCleanRuntime(monitor);
});

test('worldcup: 2027 prior champion and runner-up receive direct-to-group routes', async ({ page }) => {
  const monitor = await freshApp(page);
  const routes = await page.evaluate(() => ({
    sa: window.__OWL_WORLD_CUP.qaSet(2027, 'sa', 20).route,
    cn: window.__OWL_WORLD_CUP.qaSet(2027, 'cn', 20).route,
  }));
  expect(routes).toEqual({ sa: 'direct-group', cn: 'direct-group' });
  expectCleanRuntime(monitor);
});

test('worldcup: no extra age gate applies after the 18-year OWL entry threshold', async ({ page }) => {
  const monitor = await freshApp(page);
  await loadAndVerifyScenario(page, 'worldcup-selection');
  const records = await page.evaluate(() => {
    const rookie = window.__OWL_WORLD_CUP.qaSet(2019, 'cn', 18);
    const veteran = window.__OWL_WORLD_CUP.qaSet(2026, 'cn', 40);
    return {
      rookie: { phase: rookie.phase, pendingStage: rookie.pendingStage, completed: rookie.completed, result: rookie.result },
      veteran: { phase: veteran.phase, pendingStage: veteran.pendingStage, completed: veteran.completed, result: veteran.result },
    };
  });
  expect(records.rookie).toMatchObject({ phase: 'selection', pendingStage: 'selection', completed: false, result: null });
  expect(records.veteran).toMatchObject({ phase: 'selection', pendingStage: 'selection', completed: false, result: null });
  expectCleanRuntime(monitor);
});
