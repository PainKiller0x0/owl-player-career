const { test, expect } = require('@playwright/test');

async function freshApp(page, { viewport = null } = {}) {
  if (viewport) await page.setViewportSize(viewport);

  const runtimeErrors = [];
  const dialogs = [];

  page.on('pageerror', (error) => runtimeErrors.push(String(error?.message || error)));
  page.on('dialog', async (dialog) => {
    dialogs.push(`${dialog.type()}: ${dialog.message()}`);
    await dialog.dismiss();
  });

  // First load gives us the same-origin storage area. Then wipe it and reload cleanly.
  await page.goto('/dev/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('owl_player_path_onboarding_seen_v1', '1');
  });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.__OWL_PUBLIC_BETA && !!window.__OWL_RUNTIME);
  await expect(page.locator('#coverScreen')).toHaveClass(/active/);

  return { runtimeErrors, dialogs };
}

async function chooseTimeline(page, year) {
  await page.locator('#coverStartBtn').click();

  await page.waitForFunction(() => {
    const active = document.querySelector('.screen.active')?.id;
    return active === 'modeScreen' || active === 'roleScreen';
  });

  const modeActive = await page.locator('#modeScreen').evaluate((el) => el.classList.contains('active'));
  if (!modeActive) return;

  await page.locator('#fantasyModeCard').click();
  const yearButton = page.locator(`[data-start-year="${year}"]`);
  await expect(yearButton).toBeVisible();
  await yearButton.click();
  await page.locator('#modeConfirmBtn').click();
}

async function createCareer(page, { year = 2019, playerName = 'E2E_Rookie', age = 18 } = {}) {
  await chooseTimeline(page, year);

  await expect(page.locator('#roleScreen')).toHaveClass(/active/);
  await page.locator('#roleGrid [data-role]').first().click();

  await expect(page.locator('#nameScreen')).toHaveClass(/active/);
  await page.locator('#playerNameInput').fill(playerName);
  await page.locator('#playerCountrySelect').selectOption('cn');
  await page.locator('#playerAgeSelect').selectOption(String(age));
  await page.locator('#confirmPlayerNameBtn').click();

  await expect(page.locator('#builderScreen')).toHaveClass(/active/);
  await page.locator('#rollAttrsBtn').click();
  const enterTeamBtn = page.locator('#enterTeamBtn');
  await expect(enterTeamBtn).toBeVisible({ timeout: 5_000 });
  await enterTeamBtn.click();

  await expect(page.locator('#revealScreen')).toHaveClass(/active/);
  await page.locator('#startCareerFlowBtn').click();

  await expect(page.locator('#teamScreen')).toHaveClass(/active/);
  await expect(page.locator('#confirmCareerTeamBtn')).toBeVisible();
  await page.locator('#confirmCareerTeamBtn').click();

  await expect(page.locator('#careerContractCard')).not.toHaveClass(/ui-hidden/);
  await expect(page.locator('#startSeasonBtn')).toBeVisible();
  await page.locator('#startSeasonBtn').click();

  await expect(page.locator('#seasonScreen')).toHaveClass(/active/);

  const diag = await page.evaluate(() => window.__OWL_PUBLIC_BETA.diagnostic());
  expect(diag.player).toBe(playerName);
  expect(Number(diag.seasonYear)).toBe(year);
  expect(diag.regular.total).toBeGreaterThan(0);

  return diag;
}

function expectCleanRuntime(runtimeErrors, dialogs) {
  expect(runtimeErrors, `Uncaught page errors:\n${runtimeErrors.join('\n')}`).toEqual([]);
  expect(dialogs, `Native browser dialogs leaked into E2E:\n${dialogs.join('\n')}`).toEqual([]);
}

for (const year of [2019, 2023]) {
  test(`new career ${year}: creation -> team -> season keeps the selected year`, async ({ page }) => {
    const monitor = await freshApp(page);
    const diag = await createCareer(page, {
      year,
      playerName: `E2E_${year}`,
      age: 18,
    });

    expect(diag.screen).toBe('season');
    expect(Number(diag.seasonYear)).toBe(year);
    expectCleanRuntime(monitor.runtimeErrors, monitor.dialogs);
  });
}

test('whole-season button keeps scheduling beyond a single match', async ({ page }) => {
  // Keep this case focused on continuous regular-season progression.
  const monitor = await freshApp(page);
  // An under-18 QA player is ineligible for the World Cup node, so the test
  // can isolate the club scheduler without opening a national-team follow-up.
  await createCareer(page, { year: 2019, playerName: 'E2E_WHOLE', age: 17 });

  // This test isolates the continuous scheduler from random interruptions.
  await page.evaluate(() => {
    seasonState.eventSchedule = [];
    seasonState.eventTriggeredAt = [];
    seasonState.eventDue = false;
    seasonState.currentEvent = null;
    renderSeason();
  });

  const before = await page.evaluate(() => Number(seasonState?.played || 0));
  await page.locator('#fullSimSeasonBtn').click();

  await page.waitForFunction(
    (start) => Number(seasonState?.played || 0) >= start + 3,
    before,
    { timeout: 12_000 }
  );

  const after = await page.evaluate(() => Number(seasonState?.played || 0));
  expect(after).toBeGreaterThanOrEqual(before + 3);

  await page.evaluate(() => {
    window.__OWL_RUNTIME?.simulation?.stopWhole?.('E2E scheduler checkpoint');
  });

  expectCleanRuntime(monitor.runtimeErrors, monitor.dialogs);
});

test('manual save -> reload -> load slot restores the active career', async ({ page }) => {
  const monitor = await freshApp(page);
  await createCareer(page, { year: 2019, playerName: 'E2E_SAVE', age: 19 });

  const saveResult = await page.evaluate(() => {
    const ok = window.__OWL_PUBLIC_BETA.saveNow('manual');
    return {
      ok,
      slot: localStorage.getItem('owl_player_path_current_slot_v1'),
      hasPrimary: !!localStorage.getItem('owl_player_path_public_save_1'),
    };
  });

  expect(saveResult.ok).toBe(true);
  expect(saveResult.slot).toBe('1');
  expect(saveResult.hasPrimary).toBe(true);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.__OWL_PUBLIC_BETA);
  await page.evaluate(() => window.__OWL_PUBLIC_BETA.loadSlot(1));

  await expect(page.locator('#seasonScreen')).toHaveClass(/active/);
  const restored = await page.evaluate(() => window.__OWL_PUBLIC_BETA.diagnostic());
  expect(restored.player).toBe('E2E_SAVE');
  expect(Number(restored.seasonYear)).toBe(2019);
  expect(restored.screen).toBe('season');

  expectCleanRuntime(monitor.runtimeErrors, monitor.dialogs);
});

test('save payload removes rebuildable caches and restores compact team refs', async ({ page }) => {
  const monitor = await freshApp(page);
  await createCareer(page, { year: 2023, playerName: 'E2E_COMPACT_SAVE', age: 19 });

  const result = await page.evaluate(() => {
    seasonState.stageTables = { qa: [{ team: careerState.team }] };
    seasonState.finalStandingsCache = [{ team: careerState.team }];
    seasonState.v762FinalStandingsCache = [{ team: careerState.team }];
    const payload = window.__OWL_PUBLIC_BETA.captureSave('manual');
    const compact = JSON.stringify(payload);
    const restored = window.__OWL_PUBLIC_BETA.restorePayload(payload);
    return {
      format: payload.saveFormat,
      bytes: new TextEncoder().encode(compact).length,
      cacheKeys: ['stageTables', 'finalStandingsCache', 'v741FinalStandingsCache', 'v762FinalStandingsCache', 'v34StageTables']
        .filter((key) => Object.prototype.hasOwnProperty.call(payload.seasonState, key)),
      opponentRef: payload.seasonState.opponents[0],
      careerTeamRef: payload.careerState.team,
      restored,
      restoredOpponent: seasonState.opponents[0]?.short,
      restoredTeam: careerState.team?.short,
      restoredStageTables: Object.prototype.hasOwnProperty.call(seasonState, 'stageTables'),
    };
  });

  expect(result.format).toBe('compact-v1');
  expect(result.bytes).toBeLessThan(3_500_000);
  expect(result.cacheKeys).toEqual([]);
  expect(typeof result.opponentRef).toBe('string');
  expect(typeof result.careerTeamRef).toBe('string');
  expect(result.restored).toBe(true);
  expect(result.restoredOpponent).toBeTruthy();
  expect(result.restoredTeam).toBeTruthy();
  expect(result.restoredStageTables).toBe(false);
  expectCleanRuntime(monitor.runtimeErrors, monitor.dialogs);
});

test('2023 career advances into 2024/2025/2026 with three Stage structure', async ({ page }) => {
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

  expectCleanRuntime(monitor.runtimeErrors, monitor.dialogs);
});

test('390x844: save manager stays inside viewport and keeps 10 usable slots', async ({ page }) => {
  const monitor = await freshApp(page, { viewport: { width: 390, height: 844 } });

  await page.evaluate(() => window.__OWL_PUBLIC_BETA.openSaveManager('manage'));
  await expect(page.locator('#v800SaveOverlay')).not.toHaveClass(/ui-hidden/);

  const metrics = await page.evaluate(() => {
    const close = document.getElementById('v800SaveClose')?.getBoundingClientRect();
    const overlay = document.getElementById('v800SaveOverlay')?.getBoundingClientRect();
    return {
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      docWidth: document.documentElement.scrollWidth,
      slotCount: document.querySelectorAll('#v800SaveGrid .v800-save-card').length,
      close: close ? { width: close.width, height: close.height } : null,
      overlay: overlay
        ? { left: overlay.left, top: overlay.top, right: overlay.right, bottom: overlay.bottom }
        : null,
    };
  });

  expect(metrics.docWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  expect(metrics.slotCount).toBe(10);
  expect(metrics.close).not.toBeNull();
  expect(metrics.close.width).toBeGreaterThanOrEqual(40);
  expect(metrics.close.height).toBeGreaterThanOrEqual(40);
  expect(metrics.overlay).not.toBeNull();
  expect(metrics.overlay.left).toBeGreaterThanOrEqual(-1);
  expect(metrics.overlay.right).toBeLessThanOrEqual(metrics.viewportWidth + 1);

  expectCleanRuntime(monitor.runtimeErrors, monitor.dialogs);
});

test('1280x720: cover primary action remains visible without horizontal overflow', async ({ page }) => {
  const monitor = await freshApp(page, { viewport: { width: 1280, height: 720 } });

  const metrics = await page.evaluate(() => {
    const btn = document.getElementById('coverStartBtn')?.getBoundingClientRect();
    return {
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      docWidth: document.documentElement.scrollWidth,
      button: btn ? { top: btn.top, bottom: btn.bottom, left: btn.left, right: btn.right } : null,
    };
  });

  expect(metrics.docWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  expect(metrics.button).not.toBeNull();
  expect(metrics.button.top).toBeGreaterThanOrEqual(0);
  expect(metrics.button.bottom).toBeLessThanOrEqual(metrics.viewportHeight + 1);

  expectCleanRuntime(monitor.runtimeErrors, monitor.dialogs);
});

test('2025 final standings keep the season LP and record in sync', async ({ page }) => {
  const monitor = await freshApp(page);
  await createCareer(page, { year: 2023, playerName: 'E2E_STANDINGS', age: 20 });

  await page.evaluate(() => {
    careerState.seasonYear = 2025;
    careerState.v13RuleIntroSeen2025 = true;
    seasonState.active = false;
    setupSeason(false);
    seasonState.eventSchedule = [];
    seasonState.played = 56;
    seasonState.total = 56;
    seasonState.wins = 31;
    seasonState.losses = 25;
    seasonState.majorBonusLP = 3;
    seasonState.results = Array.from({ length: 56 }, (_, i) => (i < 31 ? 'win' : 'loss'));
    seasonState.userRatings = Array.from({ length: 56 }, () => 7.7);
    seasonState.v741FinalStandingsCache = null;
    seasonState.finalStandingsCache = null;
    renderSeason();
    showScreen('season');
  });

  await page.locator('#seasonYearChip').click();
  const userRow = page.locator('#b2StandingsBody tr.user');
  await expect(userRow).toContainText('31');
  await expect(userRow).toContainText('25');
  await expect(userRow).toContainText('34');
  expectCleanRuntime(monitor.runtimeErrors, monitor.dialogs);
});

test('2027+ standings modal uses the same final standings as season qualification', async ({ page }) => {
  const monitor = await freshApp(page);
  await createCareer(page, { year: 2023, playerName: 'E2E_FUTURE', age: 20 });

  await page.evaluate(() => {
    careerState.seasonYear = 2032;
    seasonState.active = false;
    setupSeason(false);
    seasonState.eventSchedule = [];
    seasonState.played = 56;
    seasonState.total = 56;
    seasonState.wins = 30;
    seasonState.losses = 26;
    seasonState.majorBonusLP = 2;
    seasonState.results = Array.from({ length: 56 }, (_, i) => (i < 30 ? 'win' : 'loss'));
    seasonState.userRatings = Array.from({ length: 56 }, () => 7.7);
    seasonState.stageProcessed = [1, 2, 3];
    seasonState.stageBreakPending = null;
    seasonState.finalStandingsCache = null;
    seasonState.v34Postseason = null;
    seasonState.v34PostseasonTeams = [];
    renderSeason();
    showScreen('season');
  });

  const expected = await page.evaluate(() => ({
    rank: estimateSeasonRank(),
    wins: seasonState.wins,
    losses: seasonState.losses,
    lp: seasonState.wins + Number(seasonState.majorBonusLP || 0),
  }));
  await page.locator('#seasonYearChip').click();
  const userRow = page.locator('#b2StandingsBody tr.user');
  await expect(userRow).toContainText(String(expected.wins));
  await expect(userRow).toContainText(String(expected.losses));
  await expect(userRow).toContainText(String(expected.lp));
  await expect(userRow.locator('.b2-rank')).toHaveText(String(expected.rank));
  expectCleanRuntime(monitor.runtimeErrors, monitor.dialogs);
});

test('healthy players do not receive the voluntary retirement action at 25', async ({ page }) => {
  const monitor = await freshApp(page);
  await createCareer(page, { year: 2023, playerName: 'E2E_RETIRE', age: 20 });

  const result = await page.evaluate(() => {
    careerState.age = 25;
    careerState.injuryHistory = [];
    seasonState.played = seasonState.total;
    seasonState.wins = 30;
    seasonState.losses = Number(seasonState.total) - 30;
    playoffState.round = 'active';
    return {
      canConsider: window.__OWL_V23_UX.canConsiderRetirement(),
      shouldShow: shouldShowRetirementDecision(),
    };
  });

  expect(result).toEqual({ canConsider: false, shouldShow: false });
  expectCleanRuntime(monitor.runtimeErrors, monitor.dialogs);
});

test('season page playoff CTA rebuilds a stale future postseason cache', async ({ page }) => {
  const monitor = await freshApp(page);
  await createCareer(page, { year: 2023, playerName: 'E2E_PLAYOFF_CTA', age: 20 });

  await page.evaluate(() => {
    careerState.seasonYear = 2032;
    seasonState.active = false;
    setupSeason(false);
    seasonState.eventSchedule = [];
    seasonState.played = 56;
    seasonState.total = 56;
    seasonState.wins = 56;
    seasonState.losses = 0;
    seasonState.results = Array.from({ length: 56 }, () => 'win');
    seasonState.userRatings = Array.from({ length: 56 }, () => 8.4);
    seasonState.stageProcessed = [1, 2, 3];
    seasonState.stageBreakPending = null;
    seasonState.finalStandingsCache = null;
    seasonState.v34Postseason = { year: 2031, resolved: true, userQualified: false, userSeed: null, logs: [] };
    seasonState.v34PostseasonTeams = TEAMS.filter(team => team.name !== careerState.team.name).slice(0, 8);
    playoffState.active = false;
    playoffState.round = 'active';
    playoffState.matches = [];
    renderSeason();
    showScreen('season');
  });

  await expect(page.locator('#enterPlayoffsBtn')).toBeVisible();
  await page.locator('#enterPlayoffsBtn').click();
  await expect(page.locator('#playoffScreen')).toHaveClass(/active/);
  await page.waitForFunction(() => !!playoffState?.active && !!currentPlayoffMatch());
  expectCleanRuntime(monitor.runtimeErrors, monitor.dialogs);
});

test('annual awards continue repairs a completed season with an uninitialized playoff state', async ({ page }) => {
  const monitor = await freshApp(page);
  await createCareer(page, { year: 2023, playerName: 'E2E_AWARDS_FLOW', age: 20 });

  await page.evaluate(() => {
    careerState.seasonYear = 2029;
    seasonState.active = false;
    setupSeason(false);
    seasonState.eventSchedule = [];
    seasonState.played = 56;
    seasonState.total = 56;
    seasonState.wins = 46;
    seasonState.losses = 10;
    seasonState.results = Array.from({ length: 56 }, (_, i) => (i < 46 ? 'win' : 'loss'));
    seasonState.userRatings = Array.from({ length: 56 }, () => 8.2);
    seasonState.stageProcessed = [1, 2, 3];
    seasonState.stageBreakPending = null;
    seasonState.awards = null;
    playoffState.active = false;
    playoffState.round = 'active';
    playoffState.matches = [];
    playoffState.results = [];
    renderSeason();
    showScreen('season');
    openRegularSeasonAwards();
  });

  await expect(page.locator('#awardsScreen')).toHaveClass(/active/);
  await page.locator('#awardsContinueBtn').click();
  await expect(page.locator('#playoffScreen')).toHaveClass(/active/);
  await page.waitForFunction(() => !!playoffState?.active && !!currentPlayoffMatch());
  expectCleanRuntime(monitor.runtimeErrors, monitor.dialogs);
});

test('season summary continue repairs the same completed-season playoff state', async ({ page }) => {
  const monitor = await freshApp(page);
  await createCareer(page, { year: 2023, playerName: 'E2E_SUMMARY_FLOW', age: 20 });

  await page.evaluate(() => {
    careerState.seasonYear = 2029;
    seasonState.active = false;
    setupSeason(false);
    seasonState.eventSchedule = [];
    seasonState.played = 56;
    seasonState.total = 56;
    seasonState.wins = 46;
    seasonState.losses = 10;
    seasonState.results = Array.from({ length: 56 }, (_, i) => (i < 46 ? 'win' : 'loss'));
    seasonState.userRatings = Array.from({ length: 56 }, () => 8.2);
    seasonState.stageProcessed = [1, 2, 3];
    playoffState.active = false;
    playoffState.round = 'active';
    playoffState.matches = [];
    playoffState.results = [];
    // Reproduce the supplied save: a 2029 season carrying an eight-team
    // postseason cache that was actually generated for 2027.
    seasonState.v34Postseason = { year: 2027, resolved: true, userQualified: false, userSeed: null, logs: [] };
    seasonState.v34PostseasonTeams = TEAMS.filter(team => team.active !== false && team.name !== careerState.team.name).slice(0, 8);
    showSeasonSummary();
  });

  await expect(page.locator('#summaryScreen')).toHaveClass(/active/);
  await expect(page.locator('#summaryOffseasonBtn')).toHaveText(/继续季后赛/);
  await page.locator('#summaryOffseasonBtn').click();
  await expect(page.locator('#playoffScreen')).toHaveClass(/active/);
  await page.waitForFunction(() => !!playoffState?.active && !!currentPlayoffMatch());
  expectCleanRuntime(monitor.runtimeErrors, monitor.dialogs);
});

test('2027 world cup uses the prior champion and runner-up direct-to-group route', async ({ page }) => {
  const monitor = await freshApp(page);
  await createCareer(page, { year: 2023, playerName: 'E2E_WC_RULES', age: 20 });

  const routes = await page.evaluate(() => ({
    sa: window.__OWL_WORLD_CUP.qaSet(2027, 'sa', 20).route,
    cn: window.__OWL_WORLD_CUP.qaSet(2027, 'cn', 20).route,
  }));
  expect(routes).toEqual({ sa: 'direct-group', cn: 'direct-group' });
  expectCleanRuntime(monitor.runtimeErrors, monitor.dialogs);
});

test('whole-season simulation does not silently discard the All-Star checkpoint', async ({ page }) => {
  const monitor = await freshApp(page);
  await createCareer(page, { year: 2023, playerName: 'E2E_ALLSTAR_SIM', age: 17 });

  await page.evaluate(() => {
    careerState.seasonYear = 2025;
    careerState.v13RuleIntroSeen2025 = true;
    seasonState.active = false;
    setupSeason(false);
    seasonState.eventSchedule = [];
    seasonState.played = 18;
    seasonState.wins = 9;
    seasonState.losses = 9;
    seasonState.results = Array.from({ length: 56 }, (_, i) => (i < 18 ? (i % 2 ? 'loss' : 'win') : null));
    seasonState.stageProcessed = [1];
    seasonState.stageBreakPending = null;
    seasonState.v71AllStar = null;
    seasonState.v71AllStarPending = false;
    renderSeason();
    showScreen('season');
    window.__OWL_V18_FULL_SEASON();
  });

  await page.waitForFunction(() => {
    const overlay = document.getElementById('seasonEventOverlay');
    return !!seasonState?.v71AllStarPending && !!overlay && !overlay.classList.contains('hidden');
  }, null, { timeout: 12_000 });
  await expect(page.locator('#seasonEventContent')).toContainText('全明星');
  const attend = page.locator('#v71AttendAllStar, #v34AttendAllStar').first();
  const withdraw = page.locator('#v71WithdrawAllStar, #v34WithdrawAllStar').first();
  if (await attend.isVisible().catch(() => false)) await attend.click();
  else if (await withdraw.isVisible().catch(() => false)) await withdraw.click();
  const close = page.locator('#v71CloseAllStar, #v34CloseAllStar').first();
  if (await close.isVisible().catch(() => false)) await close.click();
  await page.waitForFunction(() => Number(seasonState?.played || 0) > 19, null, { timeout: 12_000 });
  expectCleanRuntime(monitor.runtimeErrors, monitor.dialogs);
});

test('withdrawing from a 2027+ All-Star opens the comeback training or rest event', async ({ page }) => {
  const monitor = await freshApp(page);
  await createCareer(page, { year: 2023, playerName: 'E2E_WITHDRAW', age: 20 });

  await page.evaluate(() => {
    careerState.seasonYear = 2027;
    seasonState.active = false;
    setupSeason(false);
    seasonState.eventSchedule = [];
    seasonState.v71AllStar = {
      year: 2027,
      selected: true,
      starter: false,
      allStarMvp: false,
      risingEligible: false,
      risingMvp: false,
      sniperEntered: false,
      sniperWin: false,
      allRoundEntered: false,
      allRoundWin: false,
      breadth: 4,
      widow: 80,
      winner: 'East',
      side: '东部',
      opponent: '西部',
      global: false,
      participation: null,
      popApplied: false,
      popGain: 4,
    };
    seasonState.v71AllStarPending = false;
    careerState.v14SpecialHeroTraining = [];
    renderSeason();
    showScreen('season');
    window.__OWL_V34_FUTURE.allStar(false);
  });

  await page.locator('#v34WithdrawAllStar').click();
  await expect(page.locator('#v34CloseAllStar')).toBeVisible();
  await page.locator('#v34CloseAllStar').click();
  await expect(page.locator('#seasonEventContent')).toContainText('主动退出全明星');
  await expect(page.locator('#v14ApplySpecial, #v14SkipSpecial')).toHaveCount(2);
  expectCleanRuntime(monitor.runtimeErrors, monitor.dialogs);
});

test('repeated MVPs apply fatigue and trigger a season MVP celebration', async ({ page }) => {
  const monitor = await freshApp(page, { viewport: { width: 1280, height: 720 } });
  await createCareer(page, { year: 2023, playerName: 'E2E_MVP', age: 20 });

  const result = await page.evaluate(() => {
    careerState.seasonYear = 2025;
    careerState.v13RuleIntroSeen2025 = true;
    seasonState.active = false;
    setupSeason(false);
    seasonState.eventSchedule = [];
    seasonState.played = 56;
    seasonState.total = 56;
    seasonState.wins = 46;
    seasonState.losses = 10;
    seasonState.results = Array.from({ length: 56 }, (_, i) => (i < 46 ? 'win' : 'loss'));
    seasonState.userRatings = Array.from({ length: 56 }, () => 8.4);
    careerState.careerArchive = [
      { year: 2023, awards: { mvp: { userRank: 1 } } },
      { year: 2024, awards: { mvp: { winner: { isUser: true } } } },
    ];
    seasonState.awards = null;
    const awards = ensureRegularSeasonAwards();
    awards.mvp.userRank = 1;
    renderRegularSeasonAwards();
    openRegularSeasonAwards();
    return { fatigue: awards.mvpFatigue, bodyFont: getComputedStyle(document.body).fontSize };
  });

  expect(result.fatigue).toEqual({ streak: 2, penalty: 6 });
  expect(result.bodyFont).toBe('17px');
  await page.waitForFunction(() => document.body.classList.contains('season-mvp-burst'));
  await expect(page.locator('.season-mvp-confetti i')).toHaveCount(32);
  expectCleanRuntime(monitor.runtimeErrors, monitor.dialogs);
});

test('playoff balance needs a ten-point gap for dominance and FMVP needs a standout performance', async ({ page }) => {
  const monitor = await freshApp(page);
  await createCareer(page, { year: 2023, playerName: 'E2E_BALANCE', age: 20 });

  const result = await page.evaluate(() => {
    careerState.careerArchive = [
      { honors: ['总冠军', 'MVP', '总决赛MVP'] },
      { honors: ['总冠军', 'MVP', '总决赛MVP'] },
    ];
    const fmvp = window.__OWL_BALANCE.rankFinalsMvpCandidates([
      { name: 'Rookie', rating: 8.25, isUser: true, overall: 87 },
      { name: '队友A', rating: 8.3, isUser: false, overall: 95 },
      { name: '队友B', rating: 7.0, isUser: false, overall: 82 },
    ]);
    const noStandout = window.__OWL_BALANCE.rankFinalsMvpCandidates([
      { name: 'Rookie', rating: 7.9, isUser: true, overall: 87 },
      { name: '队友A', rating: 8.1, isUser: false, overall: 95 },
      { name: '队友B', rating: 7.7, isUser: false, overall: 82 },
    ]);
    playoffState.results = [{ rating: 8.3 }];
    playoffState.round = 'champion';
    seasonState.wins = 42;
    seasonState.losses = 14;
    seasonState.total = 56;
    const training = getTrainingPointBreakdown(21);
    return {
      mapNine: window.__OWL_BALANCE.mapFightWinProbability(9),
      mapTen: window.__OWL_BALANCE.mapFightWinProbability(10),
      mapTwenty: window.__OWL_BALANCE.mapFightWinProbability(20),
      fmvp: fmvp.winner.name,
      impression: fmvp.winner.impression,
      noStandout: noStandout.winner.name,
      playoffTrainingBonus: training.playoffPerformanceBonus,
    };
  });

  expect(result.mapNine).toBeLessThan(0.66);
  expect(result.mapTen).toBeGreaterThan(result.mapNine);
  expect(result.mapTwenty).toBeGreaterThan(0.85);
  expect(result.fmvp).toBe('Rookie');
  expect(result.impression).toBeGreaterThan(0);
  expect(result.noStandout).toBe('队友A');
  expect(result.playoffTrainingBonus).toBeGreaterThan(0);
  expectCleanRuntime(monitor.runtimeErrors, monitor.dialogs);
});
