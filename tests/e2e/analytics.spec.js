const { expect, test } = require('@playwright/test');
const { freshApp, createCareer, waitForGameReady } = require('./helpers/app');

function captureAnalyticsRequests(page) {
  const events = [];
  page.on('request', request => {
    if (request.method() !== 'POST' || !request.url().includes('/__owl/analytics')) return;
    try {
      events.push(JSON.parse(request.postData() || '{}'));
    } catch (_) {}
  });
  return events;
}

async function prepareAnalyticsTest(page) {
  // Playwright does not expose sendBeacon request bodies; test the same fallback
  // payload path so the assertions can inspect the event JSON.
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'sendBeacon', {
      configurable: true,
      value: () => false,
    });
  });
}

test.describe('analytics telemetry', () => {
  test('records a daily open and a real career creation', async ({ page }) => {
    await prepareAnalyticsTest(page);
    const events = captureAnalyticsRequests(page);
    await freshApp(page);
    await expect.poll(() => events.some(event => event.event === 'game_open')).toBe(true);

    await createCareer(page, { year: 2023, playerName: 'E2E_Analytics' });
    await expect.poll(() => events.some(event => event.event === 'career_created')).toBe(true);
    expect(events.filter(event => event.event === 'career_created')).toHaveLength(1);
    const created = events.find(event => event.event === 'career_created');
    expect(created.path).toBe('/dev/');
    expect(created.visitorId).toBeTruthy();
    expect(Object.keys(created).sort()).toEqual(['event', 'path', 'release', 'visitorId'].sort());
  });

  test('records resume only after a saved career reaches a game screen', async ({ page }) => {
    await prepareAnalyticsTest(page);
    const events = captureAnalyticsRequests(page);
    await freshApp(page);
    await createCareer(page, { year: 2023, playerName: 'E2E_Resume' });
    await expect.poll(() => events.some(event => event.event === 'career_created')).toBe(true);

    await page.evaluate(() => window.__OWL_PUBLIC_BETA.saveNow('analytics-resume'));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForGameReady(page);
    await expect(page.locator('#v800ContinueLatest')).toBeVisible();
    await page.locator('#v800ContinueLatest').click();

    await expect.poll(() => events.some(event => event.event === 'career_resumed')).toBe(true);
    const resumed = events.find(event => event.event === 'career_resumed');
    expect(resumed.path).toBe('/dev/');
  });
});
