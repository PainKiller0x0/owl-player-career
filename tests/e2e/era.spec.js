const { test, expect } = require('@playwright/test');
const { freshApp, createCareer } = require('./helpers/app');
const { expectCleanRuntime } = require('./helpers/assertions');

test('era: 2019/2021/2022/2023/2024/2025/2026 use the expected season formats', async ({ page }) => {
  const monitor = await freshApp(page);
  await createCareer(page, { year: 2019, playerName: 'E2E_ERA', age: 18 });
  const formats = await page.evaluate(() => {
    const out = {};
    for (const year of [2019, 2021, 2022, 2023]) {
      const d = window.__OWL_V762_TEST_FORMAT(year, careerState.team.short, 20);
      out[year] = { total: Number(d.total), stageGames: d.stageGames || [], stageNames: d.stageNames || [] };
    }
    for (const year of [2024, 2025, 2026]) {
      careerState.simulationMode = 'history';
      careerState.startYear = 2019;
      careerState.seasonYear = year;
      careerState.v13RuleIntroSeen2025 = true;
      seasonState.active = false;
      setupSeason(false);
      renderSeason();
      document.getElementById('seasonEventOverlay')?.classList.add('hidden');
      const format = window.getSeasonFormat(year);
      out[year] = { total: Number(seasonState.total), stageGames: format.stageGames, stageNames: format.stageNames };
    }
    return out;
  });
  expect(formats[2019].total).toBe(28);
  expect(formats[2021].total).toBe(16);
  expect(formats[2022].total).toBe(24);
  expect(formats[2023].stageGames.length).toBe(2);
  for (const year of [2024, 2025, 2026]) {
    expect(formats[year].stageGames.length).toBe(3);
    expect(formats[year].stageNames.join(' ')).not.toContain('Stage 4');
  }
  expectCleanRuntime(monitor);
});

test('era: a 2023 career macro advances through the 2024/2025/2026 three-Stage seasons', async ({ page }) => {
  const monitor = await freshApp(page);
  await createCareer(page, { year: 2023, playerName: 'E2E_FUTURE', age: 18 });

  for (const targetYear of [2024, 2025, 2026]) {
    const result = await page.evaluate(() => window.__OWL_PUBLIC_BETA.qaMacroAdvanceSeason());
    expect(result.ok, `qaMacroAdvanceSeason failed: ${JSON.stringify(result)}`).toBe(true);
    const structure = await page.evaluate(() => {
      if (!seasonState.active) setupSeason(false);
      renderSeason();
      showScreen('season');
      return {
        year: Number(careerState.seasonYear),
        groups: document.querySelectorAll('#seasonDots .stage-dot-group').length,
        dotsText: document.getElementById('seasonDots')?.textContent || '',
        total: Number(seasonState.total || 0),
      };
    });
    expect(structure.year).toBe(targetYear);
    expect(structure.total).toBeGreaterThan(0);
    expect(structure.groups).toBe(3);
    expect(structure.dotsText).not.toContain('Stage 4');
  }
  expectCleanRuntime(monitor);
});
