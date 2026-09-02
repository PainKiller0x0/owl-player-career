const { test, expect } = require('@playwright/test');

async function startStage(page, seed = '20260902') {
  await page.goto('/alpha/');
  await expect(page.locator('#startStageButton')).toBeVisible();
  await page.locator('#seed').fill(seed);
  await page.locator('#startStageButton').click();
  await expect(page.locator('#seasonScreen')).toBeVisible();
}

async function finishMontage(page) {
  await expect(page.locator('[data-v3-montage-continue]:visible')).toBeVisible();
  await page.locator('[data-v3-montage-continue]:visible').click();
}

async function finishRound(page) {
  await finishMontage(page);
  await expect(page.locator('[data-v3-round-continue]:visible')).toBeVisible();
  await page.locator('[data-v3-round-continue]:visible').click();
}

async function finishStage(page) {
  await startStage(page, '10101');
  await page.locator('[data-v3-begin]:visible').click();
  for (let round = 1; round <= 3; round += 1) {
    await expect(page.locator('[data-v3-choice]:visible')).toHaveCount(3);
    await page.locator('[data-v3-choice]:visible').first().click();
    await finishRound(page);
  }
  const finaleChoiceCount = await page.locator('[data-v3-choice]:visible').count();
  expect(finaleChoiceCount).toBeGreaterThanOrEqual(1);
  expect(finaleChoiceCount).toBeLessThanOrEqual(3);
  await page.locator('[data-v3-choice]:visible').first().click();
  await finishMontage(page);
  await expect(page.locator('#stageResultArea')).toBeVisible();
}

test('V3 fixed scenario starts with a goal and three contextual choices', async ({ page }) => {
  await startStage(page);
  await expect(page.locator('#playerPreset')).toHaveCount(0);
  await expect(page.locator('#teamPreset')).toHaveCount(0);
  await page.locator('[data-v3-begin]:visible').click();
  await expect(page.locator('#decisionArea')).toContainText('争取机会');
  await expect(page.locator('[data-v3-choice]:visible')).toHaveCount(3);
  await expect(page.locator('#stageGoal')).toContainText('稳定首发');
});

test('V3 choice flows into an animated four-match montage and concise feedback', async ({ page }) => {
  await startStage(page, '11111');
  await page.locator('[data-v3-begin]:visible').click();
  await page.locator('[data-v3-choice]:visible').first().click();
  await expect(page.locator('#montageArea')).toBeVisible();
  await expect(page.locator('.v3-match-row')).toHaveCount(4);
  await expect(page.locator('.v3-match-row.revealed')).toHaveCount(4, { timeout: 5000 });
  await finishMontage(page);
  await expect(page.locator('#roundSummaryArea')).toContainText('本轮');
  await expect(page.locator('#roundSummaryArea')).toContainText('个人评分');
});

test('V3 completes four rounds and ends with a coach identity decision', async ({ page }) => {
  await finishStage(page);
  await expect(page.locator('#stageResultArea')).toContainText('V3 P0 到此结束');
  await expect(page.locator('#stageResultArea')).toContainText(/稳定首发|首发竞争|首发位置/);
  await expect(page.locator('#stageRecord')).toHaveText(/\d+ - \d+/);
});

test('V3 route choices expose preparation tags and different finale options', async ({ page }) => {
  await startStage(page, '24680');
  await page.locator('[data-v3-begin]:visible').click();
  for (let round = 1; round <= 3; round += 1) {
    await page.locator('[data-v3-choice]:visible').nth(2).click();
    await finishRound(page);
  }
  await expect(page.locator('#prepTags')).toContainText('双辅默契');
  const teamFinale = await page.locator('[data-v3-choice]:visible').allTextContents();

  await page.goto('/alpha/');
  await page.locator('#clearDataButton').click();
  await page.locator('#seed').fill('24680');
  await page.locator('#startStageButton').click();
  await page.locator('[data-v3-begin]:visible').click();
  for (let round = 1; round <= 3; round += 1) {
    await page.locator('[data-v3-choice]:visible').first().click();
    await finishRound(page);
  }
  await expect(page.locator('#prepTags')).toContainText('枪感火热');
  const carryFinale = await page.locator('[data-v3-choice]:visible').allTextContents();
  expect(carryFinale.join('|')).not.toBe(teamFinale.join('|'));
  await expect(page.locator('.locked-choice')).toBeVisible();
});

test('V3 telemetry records the gameplay path without private save data', async ({ page }) => {
  const events = [];
  await page.route('**/alpha/__owl/analytics', async (route) => {
    events.push(JSON.parse(route.request().postData() || '{}'));
    await route.fulfill({ status: 204, body: '' });
  });
  await startStage(page, '13579');
  await page.locator('[data-v3-begin]:visible').click();
  await page.locator('[data-v3-choice]:visible').first().click();
  await page.locator('[data-v3-skip]:visible').click();
  await page.locator('[data-v3-details]:visible').click();
  await expect.poll(() => events.length).toBeGreaterThanOrEqual(4);
  expect(events.map((event) => event.event)).toEqual(expect.arrayContaining([
    'alpha_v3_open',
    'alpha_v3_stage_start',
    'alpha_v3_choice',
    'alpha_v3_match_montage_skip',
    'alpha_v3_details_open'
  ]));
  const choice = events.find((event) => event.event === 'alpha_v3_choice');
  expect(choice).toMatchObject({ scenarioId: 'stage1-rookie-mid', round: 1, route: 'carry' });
  expect(choice).not.toHaveProperty('player');
  expect(choice).not.toHaveProperty('attributes');
  expect(choice).not.toHaveProperty('ledger');
});

test('V3 can skip a montage and inspect optional QA details', async ({ page }) => {
  await startStage(page);
  await page.locator('[data-v3-begin]:visible').click();
  await page.locator('[data-v3-choice]:visible').first().click();
  await page.locator('[data-v3-skip]:visible').click();
  await expect(page.locator('#roundSummaryArea')).toBeVisible();
  await page.locator('[data-v3-details]:visible').click();
  await expect(page.locator('#detailsDrawer')).toContainText('QA DETAIL');
  await expect(page.locator('#detailsDrawer')).toContainText('最终赛前胜率');
  await page.locator('[data-v3-close-details]:visible').click();
  await expect(page.locator('#detailsDrawer')).toBeHidden();
});

test('V3 replay keeps the seed and a new run changes it', async ({ page }) => {
  await startStage(page, '424242');
  await page.locator('[data-v3-begin]:visible').click();
  await page.locator('[data-v3-choice]:visible').first().click();
  await page.locator('[data-v3-skip]:visible').click();
  await page.locator('[data-v3-round-continue]:visible').click();
  await expect(page.locator('[data-v3-choice]:visible')).toHaveCount(3);
  await page.locator('[data-v3-choice]:visible').first().click();
  await page.locator('[data-v3-skip]:visible').click();
  await page.locator('[data-v3-round-continue]:visible').click();
  await page.locator('[data-v3-choice]:visible').first().click();
  await page.locator('[data-v3-skip]:visible').click();
  await page.locator('[data-v3-round-continue]:visible').click();
  await expect(page.locator('[data-v3-choice]:visible')).toHaveCount(2);
  await page.locator('[data-v3-choice]:visible').first().click();
  await page.locator('[data-v3-skip]:visible').click();
  await expect(page.locator('#stageResultArea')).toBeVisible();
  const originalSeed = await page.locator('#seed').inputValue();
  await page.locator('[data-v3-replay-same]:visible').click();
  await expect(page.locator('#stageIntroArea')).toBeVisible();
  expect(await page.locator('#seed').inputValue()).toBe(originalSeed);
  await page.locator('[data-v3-begin]:visible').click();
  await page.locator('[data-v3-choice]:visible').first().click();
  await page.locator('[data-v3-skip]:visible').click();
  await page.locator('[data-v3-round-continue]:visible').click();
  await page.locator('[data-v3-choice]:visible').first().click();
  await page.locator('[data-v3-skip]:visible').click();
  await page.locator('[data-v3-round-continue]:visible').click();
  await page.locator('[data-v3-choice]:visible').first().click();
  await page.locator('[data-v3-skip]:visible').click();
  await page.locator('[data-v3-round-continue]:visible').click();
  await page.locator('[data-v3-choice]:visible').first().click();
  await page.locator('[data-v3-skip]:visible').click();
  await expect(page.locator('#stageResultArea')).toBeVisible();
  await page.locator('[data-v3-new-seed]:visible').click();
  await expect(page.locator('#stageIntroArea')).toBeVisible();
  expect(await page.locator('#seed').inputValue()).not.toBe(originalSeed);
});

test('V3 refresh resumes the saved montage without replaying the block', async ({ page }) => {
  await startStage(page, '33333');
  await page.locator('[data-v3-begin]:visible').click();
  await page.locator('[data-v3-choice]:visible').first().click();
  const matchCount = await page.locator('.v3-match-row').count();
  await page.reload();
  await expect(page.locator('#continueStageButton')).toBeVisible();
  await page.locator('#continueStageButton').click();
  await expect(page.locator('#montageArea')).toBeVisible();
  await expect(page.locator('.v3-match-row')).toHaveCount(matchCount);
});

test('V3 storage stays isolated from V1 and V2 saves', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('owl_alpha_season_demo_v1:current', JSON.stringify({ version: 1 }));
    localStorage.setItem('owl_alpha_season_demo_v2:current', JSON.stringify({ version: 2 }));
  });
  await page.goto('/alpha/');
  await expect(page.locator('#storageStatus')).toContainText('V1/V2');
  await expect(page.locator('#continueStageButton')).toBeHidden();
});

test('V3 batch lab still runs the existing engine without freezing the page', async ({ page }) => {
  await page.goto('/alpha/');
  await page.locator('#openBatchButton').click();
  await page.locator('#batchCount').fill('10');
  await page.locator('#runBatchButton').click();
  await expect(page.locator('#batchProgressText')).toHaveText('完成', { timeout: 15000 });
  await expect(page.locator('#batchOutput')).toContainText('aggregate');
});

test('V3 QA lab keeps the long-career action wired', async ({ page }) => {
  await page.goto('/alpha/');
  await page.locator('#openBatchButton').click();
  await page.locator('#batchCount').fill('1');
  await page.locator('#runLongButton').click();
  await expect(page.locator('#batchProgressText')).toHaveText('完成', { timeout: 15000 });
  await expect(page.locator('#batchOutput')).toContainText('long');
});

test('V3 responsive layouts do not overflow horizontally', async ({ page }) => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 430, height: 932 }, { width: 900, height: 1800 }, { width: 1366, height: 768 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(viewport);
    await startStage(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }
});

test('V3 start and one choice produce no page or console errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push('pageerror: ' + error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push('console: ' + message.text()); });
  await startStage(page);
  await page.locator('[data-v3-begin]:visible').click();
  await page.locator('[data-v3-choice]:visible').first().click();
  expect(errors).toEqual([]);
});
