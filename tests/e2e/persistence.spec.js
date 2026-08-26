const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const { freshApp, createCareer } = require('./helpers/app');
const { expectCleanRuntime, expectScreen } = require('./helpers/assertions');

const fixtureDir = path.resolve(__dirname, '../fixtures/saves');

for (const fixture of ['legacy-v1-2019-season.json', 'legacy-v1-2023-preplayoff.json']) {
  test(`persistence: restore ${fixture} and continue from its saved screen`, async ({ page }) => {
    const monitor = await freshApp(page);
    const payload = JSON.parse(fs.readFileSync(path.join(fixtureDir, fixture), 'utf8'));
    const result = await page.evaluate(raw => ({ ok: window.__OWL_PUBLIC_BETA.restorePayload(raw), diagnostic: window.__OWL_PUBLIC_BETA.diagnostic() }), payload);
    expect(result.ok).toBe(true);
    expect(result.diagnostic.player).toBeTruthy();
    expect(result.diagnostic.team).toBeTruthy();
    expect(Number(result.diagnostic.seasonYear)).toBeGreaterThanOrEqual(2019);
    await expectScreen(page, result.diagnostic.screen);
    expectCleanRuntime(monitor);
  });
}

test('persistence: current payload remains compact and strips rebuildable caches', async ({ page }) => {
  const monitor = await freshApp(page);
  await createCareer(page, { year: 2023, playerName: 'E2E_COMPACT_SAVE', age: 19 });
  const result = await page.evaluate(() => {
    seasonState.stageTables = { qa: [{ team: careerState.team }] };
    seasonState.finalStandingsCache = [{ team: careerState.team }];
    seasonState.v762FinalStandingsCache = [{ team: careerState.team }];
    const payload = window.__OWL_PUBLIC_BETA.captureSave('manual');
    return { format: payload.saveFormat, bytes: new TextEncoder().encode(JSON.stringify(payload)).length, hasCaches: Object.keys(payload.seasonState).some(key => ['stageTables', 'finalStandingsCache', 'v762FinalStandingsCache'].includes(key)) };
  });
  expect(result.format).toBe('compact-v1');
  expect(result.bytes).toBeLessThan(3_500_000);
  expect(result.hasCaches).toBe(false);
  expectCleanRuntime(monitor);
});
