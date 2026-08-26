const { test, expect } = require('@playwright/test');
const { freshApp } = require('./helpers/app');
const { SCENARIOS, loadAndVerifyScenario, scenarioDiagnostic } = require('./helpers/scenarios');
const { expectCleanRuntime } = require('./helpers/assertions');

test('snapshots: every first-batch scenario builds and verifies through the shared API', async ({ page }) => {
  const monitor = await freshApp(page);
  for (const id of SCENARIOS) {
    const health = await loadAndVerifyScenario(page, id);
    expect(health.ok, id).toBe(true);
    const current = await scenarioDiagnostic(page);
    expect(current.qa).toBe(id);
    expect(current.diagnostic.team).toBeTruthy();
  }
  expectCleanRuntime(monitor);
});

test('snapshots: snapshotCurrent and restorePrevious are usable', async ({ page }) => {
  const monitor = await freshApp(page);
  const before = await page.evaluate(() => window.__OWL_PUBLIC_BETA.diagnostic());
  await loadAndVerifyScenario(page, 'worldcup-knockout');
  const snapshot = await page.evaluate(() => window.__OWL_QA.snapshotCurrent());
  expect(snapshot.qaVersion).toBe('096');
  expect(snapshot.scenario).toBe('worldcup-knockout');
  expect(snapshot.save).toBeTruthy();
  const restored = await page.evaluate(() => window.__OWL_QA.restorePrevious());
  expect(restored.ok).toBe(true);
  expect(restored.diagnostic.screen).toBe(before.screen);
  expect(await page.evaluate(() => window.__OWL_QA.currentScenario())).toBeNull();
  expectCleanRuntime(monitor);
});
