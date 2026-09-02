const { test, expect } = require('@playwright/test');

async function finishSeason(page) {
  for (let step = 0; step < 140; step += 1) {
    if (await page.locator('[data-alpha-action]:visible').count()) {
      await page.locator('[data-alpha-action]:visible').first().click();
    } else if (await page.locator('[data-alpha-action-result]:visible').count()) {
      await page.locator('[data-alpha-action-result]:visible').click();
    } else if (await page.locator('[data-alpha-match-plan]:visible').count()) {
      await page.locator('[data-alpha-match-plan]:visible').first().click();
    } else if (await page.locator('[data-alpha-block-report]:visible').count()) {
      await page.locator('[data-alpha-block-report]:visible').click();
    } else if (await page.locator('[data-alpha-event]:visible').count()) {
      await page.locator('[data-alpha-event]:visible').first().click();
    } else if (await page.locator('[data-alpha-report]:visible').count()) {
      await page.locator('[data-alpha-report]').click();
    } else if (await page.locator('[data-alpha-playoff]:visible').count()) {
      await page.locator('[data-alpha-playoff]:visible').click();
    } else if (await page.locator('[data-alpha-career]:visible').count()) {
      await page.locator('[data-alpha-career]:visible').click();
    } else {
      break;
    }
    await page.waitForTimeout(5);
  }
}

test('manual season completes and exposes the required milestones', async ({ page }) => {
  await page.goto('/alpha/');
  await expect(page.locator('#startSeasonButton')).toBeVisible();
  await page.locator('#seed').fill('10101');
  await page.locator('#startSeasonButton').click();
  await expect(page.locator('#seasonScreen')).toBeVisible();
  await finishSeason(page);
  await expect(page.locator('#summaryArea')).toContainText('赛季完成');
  await expect(page.locator('#record')).toHaveText(/\d+ - \d+/);
});

test('automatic season uses the same visible result path', async ({ page }) => {
  await page.goto('/alpha/');
  await page.locator('#playerPreset').selectOption('veteran');
  await page.locator('#teamPreset').selectOption('rebuild');
  await page.locator('#startSeasonButton').click();
  await page.locator('#autoSeasonButton').click();
  await expect(page.locator('#summaryArea')).toContainText('赛季完成');
  await expect(page.locator('#timeline .done')).toHaveCount(21);
});

test('refresh can continue an incomplete Alpha season', async ({ page }) => {
  await page.goto('/alpha/');
  await page.locator('#startSeasonButton').click();
  await page.locator('#saveButton').click();
  await page.reload();
  await expect(page.locator('#continueSeasonButton')).toBeVisible();
  await page.locator('#continueSeasonButton').click();
  await expect(page.locator('#seasonScreen')).toBeVisible();
});

test('V1 storage is detected but is not read by Alpha V2', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('owl_alpha_season_demo_v1:current', JSON.stringify({ version: 1 })));
  await page.goto('/alpha/');
  await expect(page.locator('#storageStatus')).toContainText('旧版验证档');
  await expect(page.locator('#continueSeasonButton')).toBeHidden();
});

test('batch worker completes and returns JSON without freezing the page', async ({ page }) => {
  await page.goto('/alpha/');
  await page.locator('#openBatchButton').click();
  await page.locator('#batchCount').fill('10');
  await page.locator('#runBatchButton').click();
  await expect(page.locator('#batchProgressText')).toHaveText('完成', { timeout: 15000 });
  await expect(page.locator('#batchOutput')).toContainText('aggregate');
});

test('long-career batch harness can run and export a result', async ({ page }) => {
  await page.goto('/alpha/');
  await page.locator('#openBatchButton').click();
  await page.locator('#batchCount').fill('2');
  await page.locator('#runLongButton').click();
  await expect(page.locator('#batchProgressText')).toHaveText('完成', { timeout: 15000 });
  await expect(page.locator('#batchOutput')).toContainText('sevenPlusChampionshipsRate');
});

test('mobile and desktop layouts do not overflow horizontally', async ({ page }) => {
  await page.goto('/alpha/');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  await page.locator('#startSeasonButton').click();
  const seasonOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(seasonOverflow).toBe(false);
});

test('alpha page has no page errors or console errors during a season start', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push('pageerror: ' + error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push('console: ' + message.text()); });
  await page.goto('/alpha/');
  await page.locator('#startSeasonButton').click();
  await page.locator('[data-alpha-action]:visible').first().click();
  expect(errors).toEqual([]);
});

test('manual choice exposes a saved block report and refresh does not replay it', async ({ page }) => {
  await page.goto('/alpha/');
  await page.locator('#seed').fill('20260902');
  await page.locator('#startSeasonButton').click();
  await page.locator('[data-alpha-action]:visible').first().click();
  await expect(page.locator('#actionResultArea')).toContainText('训练反馈');
  await page.locator('[data-alpha-action-result]:visible').click();
  await page.locator('[data-alpha-event]:visible').first().click();
  await page.locator('[data-alpha-action]:visible').first().click();
  await page.locator('[data-alpha-action-result]:visible').click();
  await page.locator('[data-alpha-action]:visible').first().click();
  await page.locator('[data-alpha-action-result]:visible').click();
  await expect(page.locator('#blockReportArea')).toContainText('比赛影响账本');
  const matchCount = await page.locator('.match-row').count();
  await page.reload();
  await page.locator('#continueSeasonButton').click();
  await expect(page.locator('#blockReportArea')).toContainText('比赛影响账本');
  await expect(page.locator('.match-row')).toHaveCount(matchCount);
});

test('Alpha V2 responsive viewports do not overflow', async ({ page }) => {
  for (const viewport of [{ width: 430, height: 932 }, { width: 900, height: 1800 }, { width: 1366, height: 768 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/alpha/');
    await page.locator('#startSeasonButton').click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }
});
