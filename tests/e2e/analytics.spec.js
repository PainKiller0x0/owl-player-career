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

  test('records page performance without game state', async ({ page }) => {
    await prepareAnalyticsTest(page);
    const events = captureAnalyticsRequests(page);
    await freshApp(page);

    await expect.poll(() => events.some(event => event.event === 'perf_page_load' && event.metric === 'page_ready_ms')).toBe(true);
    const ready = events.find(event => event.event === 'perf_page_load' && event.metric === 'page_ready_ms');
    expect(ready.path).toBe('/dev/');
    expect(typeof ready.value).toBe('number');
    expect(['mobile', 'desktop']).toContain(ready.device);
    expect(['compact', 'standard', 'wide']).toContain(ready.viewport);
    expect(Object.keys(ready).sort()).toEqual(['device', 'event', 'metric', 'path', 'release', 'value', 'viewport', 'visitorId'].sort());
    expect(ready).not.toHaveProperty('seasonState');
  });

  test('records batch simulation duration and outcome', async ({ page }) => {
    await prepareAnalyticsTest(page);
    const events = captureAnalyticsRequests(page);
    await freshApp(page);
    await createCareer(page, { year: 2021, playerName: 'E2E_Performance' });
    await page.evaluate(() => {
      seasonState.eventSchedule = [];
      seasonState.eventTriggeredAt = [];
      seasonState.eventDue = false;
      seasonState.currentEvent = null;
      renderSeason();
    });

    await page.locator('#fullSimSeasonBtn').click();
    await expect.poll(() => events.some(event => event.event === 'perf_simulation'), { timeout: 12_000 }).toBe(true);
    const simulation = events.find(event => event.event === 'perf_simulation');
    expect(simulation.path).toBe('/dev/');
    expect(simulation.metric).toBe('duration_ms');
    expect(simulation.mode).toBe('whole');
    expect(['completed', 'paused_event', 'paused_manual', 'timeout']).toContain(simulation.status);
    expect(simulation.value).toBeGreaterThan(0);
    expect(simulation).not.toHaveProperty('careerState');
  });
});
