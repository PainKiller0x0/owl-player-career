const { expect } = require('@playwright/test');

async function waitForGameReady(page) {
  await page.waitForFunction(() => !!window.__OWL_PUBLIC_BETA && !!window.__OWL_RUNTIME && !!window.__OWL_QA);
  await expect(page.locator('#coverScreen')).toHaveClass(/active/);
}

async function freshApp(page, { viewport = null } = {}) {
  if (viewport) await page.setViewportSize(viewport);
  const runtimeErrors = [];
  const dialogs = [];
  page.on('pageerror', error => runtimeErrors.push(String(error?.message || error)));
  page.on('dialog', async dialog => {
    dialogs.push(`${dialog.type()}: ${dialog.message()}`);
    await dialog.dismiss();
  });
  await page.goto('/dev/?qa=1', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('owl_player_path_onboarding_seen_v1', '1');
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForGameReady(page);
  return { runtimeErrors, dialogs };
}

async function chooseTimeline(page, year, mode = 'fantasy') {
  await page.locator('#coverStartBtn').click();
  await page.waitForFunction(() => ['modeScreen', 'roleScreen'].includes(document.querySelector('.screen.active')?.id));
  if (!(await page.locator('#modeScreen').evaluate(el => el.classList.contains('active')))) return;
  if (mode === 'history') {
    await page.locator('#historyModeCard').click();
  } else {
    await page.locator('#fantasyModeCard').click();
    await expect(page.locator(`[data-start-year="${year}"]`)).toBeVisible();
    await page.locator(`[data-start-year="${year}"]`).click();
  }
  await page.locator('#modeConfirmBtn').click();
}

async function createCareer(page, { year = 2019, mode = 'fantasy', playerName = 'E2E_Rookie', age = 18 } = {}) {
  await chooseTimeline(page, year, mode);
  await expect(page.locator('#roleScreen')).toHaveClass(/active/);
  await page.locator('#roleGrid [data-role]').first().click();
  await expect(page.locator('#nameScreen')).toHaveClass(/active/);
  await page.locator('#playerNameInput').fill(playerName);
  await page.locator('#playerCountrySelect').selectOption('cn');
  await page.locator('#playerAgeSelect').selectOption(String(age));
  await page.locator('#confirmPlayerNameBtn').click();
  await expect(page.locator('#builderScreen')).toHaveClass(/active/);
  await page.locator('#rollAttrsBtn').click();
  await expect(page.locator('#enterTeamBtn')).toBeVisible({ timeout: 5_000 });
  await page.locator('#enterTeamBtn').click();
  await expect(page.locator('#revealScreen')).toHaveClass(/active/);
  await page.locator('#startCareerFlowBtn').click();
  await expect(page.locator('#teamScreen')).toHaveClass(/active/);
  await page.locator('#confirmCareerTeamBtn').click();
  await expect(page.locator('#startSeasonBtn')).toBeVisible();
  await page.locator('#startSeasonBtn').click();
  await expect(page.locator('#seasonScreen')).toHaveClass(/active/);
  const diag = await getDiagnostic(page);
  expect(diag.player).toBe(playerName);
  expect(Number(diag.seasonYear)).toBe(year);
  expect(diag.regular.total).toBeGreaterThan(0);
  return diag;
}

async function getDiagnostic(page) {
  return page.evaluate(() => window.__OWL_PUBLIC_BETA.diagnostic());
}

async function openQa(page) {
  await page.locator('#owlQaFab').click();
  await expect(page.locator('#owlQaPanel')).not.toHaveClass(/ui-hidden/);
}

async function loadQaScenario(page, id) {
  const result = await page.evaluate(async scenarioId => window.__OWL_QA.loadScenario(scenarioId), id);
  expect(result.ok, `QA scenario failed: ${JSON.stringify(result)}`).toBe(true);
  const health = await page.evaluate(scenarioId => window.__OWL_QA.verifyScenario(scenarioId), id);
  expect(health.ok, `QA verification failed: ${JSON.stringify(health)}`).toBe(true);
  return health;
}

module.exports = { freshApp, chooseTimeline, createCareer, waitForGameReady, getDiagnostic, openQa, loadQaScenario };
