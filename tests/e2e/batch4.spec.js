const { test, expect } = require('@playwright/test');
const { freshApp, loadQaScenario } = require('./helpers/app');
const { expectCleanRuntime } = require('./helpers/assertions');

test('batch4: 2019-2021 keeps 6v6 while 2022+ uses 5v5 and migrates old 303 tactics', async ({ page }) => {
  const monitor = await freshApp(page);
  await loadQaScenario(page, '2019-season-start');
  const result = await page.evaluate(() => {
    const before = window.__OWL_V97_QA.seasonFormat(2019).format;
    const middle = window.__OWL_V97_QA.seasonFormat(2021).format;
    const after = window.__OWL_V97_QA.seasonFormat(2022).format;
    careerState.seasonYear = 2022;
    careerState.tactic = '阵地';
    careerState.tacticProfile = { version: 2, year: 2019, primary: { major: '阵地', styleId: 'goats' }, secondary: { major: '突进', styleId: 'classic_dive' } };
    const migrated = window.__OWL_V97_QA.migrateCurrentTactics();
    return { before, middle, after, migrated, style: careerState.tacticProfile.primary.styleId };
  });
  expect(result).toEqual({ before: '6v6', middle: '6v6', after: '5v5', migrated: true, style: expect.not.stringMatching(/^goats$/) });
  expectCleanRuntime(monitor);
});

test('batch4: World Cup selection builds 2 tanks, 2 damage, 2 supports and one flex', async ({ page }) => {
  const monitor = await freshApp(page);
  await loadQaScenario(page, 'worldcup-selection');
  const result = await page.evaluate(() => {
    const record = window.__OWL_WORLD_CUP.resolveSelection('system');
    const core = record.roster.filter(player => !player.flex);
    return {
      roster: record.roster.length,
      flex: record.roster.filter(player => player.flex).length,
      groups: Object.fromEntries(['tank', 'damage', 'support'].map(group => [group, core.filter(player => {
        if (group === 'tank') return player.role === '坦克';
        if (group === 'support') return player.role.includes('支援');
        return player.role.includes('输出') && !player.role.includes('支援');
      }).length])),
      strength: { china: window.__OWL_WORLD_CUP.power('cn'), korea: window.__OWL_WORLD_CUP.power('kr') },
    };
  });
  expect(result).toMatchObject({ roster: 7, flex: 1, groups: { tank: 2, damage: 2, support: 2 }, strength: { china: 96, korea: 97 } });
  const migrated = await page.evaluate(() => {
    const record = window.__OWL_WORLD_CUP.ensure(2023);
    record.roster = record.roster.slice(0, 3);
    const restored = window.__OWL_WORLD_CUP.ensure(2023);
    const core = restored.roster.filter(player => !player.flex);
    return {
      roster: restored.roster.length,
      flex: restored.roster.filter(player => player.flex).length,
      groups: Object.fromEntries(['tank', 'damage', 'support'].map(group => [group, core.filter(player => {
        if (group === 'tank') return player.role === '坦克';
        if (group === 'support') return player.role.includes('支援');
        return player.role.includes('输出') && !player.role.includes('支援');
      }).length])),
    };
  });
  expect(migrated).toEqual({ roster: 7, flex: 1, groups: { tank: 2, damage: 2, support: 2 } });
  expectCleanRuntime(monitor);
});

test('batch4: special training auto-selects the two weakest heroes and scales with age', async ({ page }) => {
  const monitor = await freshApp(page);
  await loadQaScenario(page, '2025-stage2');
  const scaling = await page.evaluate(() => {
    const hero = window.__OWL_V800_HERO_IO.pool(careerState.seasonYear)[0];
    window.__OWL_V800_HERO_IO.qaSet(hero.name, 60, careerState.seasonYear);
    window.__OWL_POTENTIAL.qaForce('prodigy');
    careerState.age = 20;
    const young = window.__OWL_V800_HERO_IO.boost(hero.name, 3, 'qa-young');
    window.__OWL_V800_HERO_IO.qaSet(hero.name, 60, careerState.seasonYear);
    careerState.age = 29;
    const veteran = window.__OWL_V800_HERO_IO.boost(hero.name, 3, 'qa-veteran');
    return { young: young.delta, veteran: veteran.delta };
  });
  expect(scaling.young).toBeGreaterThan(scaling.veteran);

  await page.evaluate(() => window.__OWL_V14.openSpecialTraining('qa-auto', 'QA 自动选择', '测试自动选择', 3));
  await expect(page.locator('#v14AutoSpecial')).toBeVisible();
  await page.locator('#v14AutoSpecial').click();
  await expect(page.locator('.v14-special-hero.selected')).toHaveCount(2);
  expectCleanRuntime(monitor);
});

test('batch4: UI hides internal training calculations and shortens transfer / Hawelka copy', async ({ page }) => {
  const monitor = await freshApp(page);
  await loadQaScenario(page, 'retirement-age29');
  const ui = await page.evaluate(() => {
    prepareTrainingCamp(29);
    renderTrainingCamp(document.getElementById('offseasonContent'));
    const training = document.getElementById('offseasonContent');
    const roleHost = document.createElement('div');
    offseasonState.roleTarget = '坦克';
    renderRolePlanning(roleHost);
    return {
      trainingText: training.textContent,
      roleText: roleHost.textContent,
      calcNodes: training.querySelectorAll('.training-breakdown,.meeting-note,.age-change-list').length,
    };
  });
  expect(ui.trainingText).toContain('最终训练点数');
  expect(ui.trainingText).not.toContain('成长倍率');
  expect(ui.trainingText).not.toContain('年龄自然变化');
  expect(ui.calcNodes).toBe(0);
  expect(ui.roleText).toContain('转位后职责总评');
  expect(ui.roleText).not.toContain('初始适应');
  expect(ui.roleText).not.toContain('有效约');
  expectCleanRuntime(monitor);
});

test('batch4: age 29 contract offers are capped at one year and legacy portrait has historical positioning', async ({ page }) => {
  const monitor = await freshApp(page);
  await loadQaScenario(page, 'contract-expiry');
  const contract = await page.evaluate(() => {
    careerState.age = 29;
    generateContractOffers();
    return { max: Math.max(...offseasonState.offers.map(offer => offer.years)), expected: window.__OWL_V97_QA.contractMaxYears(29) };
  });
  expect(contract).toEqual({ max: 1, expected: 1 });

  await loadQaScenario(page, 'retirement-age29');
  await page.evaluate(() => {
    careerState.retired = true;
    careerState.careerArchive = Array.from({ length: 9 }, (_, index) => ({ year: 2020 + index, age: 20 + index, team: '广州冲锋', role: state.role, ovr: 90, wins: 50, losses: 6, rating: 8.2, playoffRating: 8.3, regularRank: 1, result: '总冠军', honors: ['总冠军', 'MVP', '总决赛MVP'], stats: { appearances: 56, eliminations: 100, deaths: 50, assists: 80, firstPicks: 10 }, awards: {} }));
    careerState.peakOvr = 94;
    renderRetirementScreen();
    showScreen('retirement');
  });
  await expect(page.locator('#v710RetirementPortrait .v97-history-rank')).toContainText('GOAT');
  expectCleanRuntime(monitor);
});

test('batch4: completed season celebrates a role-star award with the lighter burst', async ({ page }) => {
  const monitor = await freshApp(page);
  await loadQaScenario(page, '2025-pre-finals');
  await page.evaluate(() => {
    seasonState.played = seasonState.total;
    seasonState.awards = null;
    const awards = ensureRegularSeasonAwards();
    const group = window.__OWL_ROLE_STAR_RULES.group(state.role);
    awards.roleStars[group].userRank = 1;
    careerState.owlRoleStarBurstYears = [];
    renderSeason();
  });
  await page.waitForFunction(() => document.body.classList.contains('owl-role-star-burst'));
  await expect(page.locator('.owl-role-star-confetti i')).toHaveCount(14);
  expectCleanRuntime(monitor);
});
