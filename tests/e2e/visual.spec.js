const { test, expect } = require('@playwright/test');
const { freshApp } = require('./helpers/app');
const { expectNoHorizontalOverflow, expectCleanRuntime } = require('./helpers/assertions');

test('@visual 390x844 cover keeps QA controls inside viewport', async ({ page }) => {
  const monitor = await freshApp(page, { viewport: { width: 390, height: 844 } });
  await expectNoHorizontalOverflow(page);
  const qa = await page.locator('#owlQaFab').boundingBox();
  expect(qa.width).toBeGreaterThanOrEqual(44);
  expect(qa.height).toBeGreaterThanOrEqual(44);
  expectCleanRuntime(monitor);
});

test('@visual 390x844 season page keeps QA panel within viewport', async ({ page }) => {
  const monitor = await freshApp(page, { viewport: { width: 390, height: 844 } });
  await page.evaluate(() => window.__OWL_QA.loadScenario('2019-season-start'));
  await page.locator('#owlQaFab').click();
  await expectNoHorizontalOverflow(page);
  const panel = await page.locator('#owlQaPanel').boundingBox();
  expect(panel.width).toBeLessThanOrEqual(366);
  expect(panel.height).toBeLessThanOrEqual(633);
  expectCleanRuntime(monitor);
});

test('@visual 1280x720 cover keeps primary CTA visible', async ({ page }) => {
  const monitor = await freshApp(page, { viewport: { width: 1280, height: 720 } });
  const button = await page.evaluate(() => {
    const rect = document.getElementById('coverStartBtn')?.getBoundingClientRect();
    return rect && { top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height };
  });
  expect(button).not.toBeNull();
  expect(button.width).toBeGreaterThan(0);
  expect(button.height).toBeGreaterThan(0);
  expect(button.top).toBeGreaterThanOrEqual(0);
  expect(button.bottom).toBeLessThanOrEqual(721);
  await expectNoHorizontalOverflow(page);
  expectCleanRuntime(monitor);
});
