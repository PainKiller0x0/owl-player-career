const { test, expect } = require('@playwright/test');
const { freshApp, createCareer, getDiagnostic } = require('./helpers/app');
const { expectCleanRuntime, expectNoHorizontalOverflow, expectScreen } = require('./helpers/assertions');

for (const year of [2019, 2023]) {
  test(`smoke: new career ${year} reaches the selected season`, async ({ page }) => {
    const monitor = await freshApp(page);
    const diag = await createCareer(page, { year, playerName: `E2E_${year}`, age: 18 });
    expect(diag.screen).toBe('season');
    expect(Number(diag.seasonYear)).toBe(year);
    expectCleanRuntime(monitor);
  });
}

test('smoke: save -> reload -> load slot restores active career', async ({ page }) => {
  const monitor = await freshApp(page);
  await createCareer(page, { year: 2019, playerName: 'E2E_SAVE', age: 19 });
  const saved = await page.evaluate(() => ({
    ok: window.__OWL_PUBLIC_BETA.saveNow('manual'),
    slot: localStorage.getItem('owl_player_path_current_slot_v1'),
    hasPrimary: !!localStorage.getItem('owl_player_path_public_save_1'),
  }));
  expect(saved).toEqual({ ok: true, slot: '1', hasPrimary: true });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.__OWL_PUBLIC_BETA);
  await page.evaluate(() => window.__OWL_PUBLIC_BETA.loadSlot(1));
  await expectScreen(page, 'season');
  const restored = await getDiagnostic(page);
  expect(restored.player).toBe('E2E_SAVE');
  expect(Number(restored.seasonYear)).toBe(2019);
  expectCleanRuntime(monitor);
});

test('smoke: 390x844 has no overflow and keeps 10 save slots usable', async ({ page }) => {
  const monitor = await freshApp(page, { viewport: { width: 390, height: 844 } });
  await page.evaluate(() => window.__OWL_PUBLIC_BETA.openSaveManager('manage'));
  await expect(page.locator('#v800SaveOverlay')).not.toHaveClass(/ui-hidden/);
  const metrics = await page.evaluate(() => {
    const close = document.getElementById('v800SaveClose')?.getBoundingClientRect();
    const overlay = document.getElementById('v800SaveOverlay')?.getBoundingClientRect();
    return { width: document.documentElement.scrollWidth, viewport: innerWidth, slots: document.querySelectorAll('#v800SaveGrid .v800-save-card').length, close: close && { width: close.width, height: close.height }, overlay: overlay && { left: overlay.left, right: overlay.right } };
  });
  expect(metrics.width).toBeLessThanOrEqual(metrics.viewport + 1);
  expect(metrics.slots).toBe(10);
  expect(metrics.close.width).toBeGreaterThanOrEqual(40);
  expect(metrics.close.height).toBeGreaterThanOrEqual(40);
  expect(metrics.overlay.left).toBeGreaterThanOrEqual(-1);
  expect(metrics.overlay.right).toBeLessThanOrEqual(metrics.viewport + 1);
  expectCleanRuntime(monitor);
});

test('smoke: 1280x720 keeps the cover CTA in the first viewport', async ({ page }) => {
  const monitor = await freshApp(page, { viewport: { width: 1280, height: 720 } });
  const metrics = await page.evaluate(() => {
    const button = document.getElementById('coverStartBtn')?.getBoundingClientRect();
    return { width: document.documentElement.scrollWidth, viewport: innerWidth, button: button && { top: button.top, bottom: button.bottom } };
  });
  expect(metrics.width).toBeLessThanOrEqual(metrics.viewport + 1);
  expect(metrics.button.top).toBeGreaterThanOrEqual(0);
  expect(metrics.button.bottom).toBeLessThanOrEqual(721);
  expectCleanRuntime(monitor);
});
