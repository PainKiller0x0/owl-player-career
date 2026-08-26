const { expect } = require('@playwright/test');

async function expectNoHorizontalOverflow(page) {
  const metrics = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  expect(metrics.width, `horizontal overflow: ${JSON.stringify(metrics)}`).toBeLessThanOrEqual(metrics.viewport + 1);
}

function expectCleanRuntime(monitor) {
  expect(monitor.runtimeErrors, `Uncaught page errors:\n${monitor.runtimeErrors.join('\n')}`).toEqual([]);
  expect(monitor.dialogs, `Native browser dialogs leaked into E2E:\n${monitor.dialogs.join('\n')}`).toEqual([]);
}

async function expectScreen(page, screen) {
  await expect(page.locator(`#${screen}Screen`)).toHaveClass(/active/);
}

async function expectHealthyDiagnostic(page) {
  const diagnostic = await page.evaluate(() => window.__OWL_PUBLIC_BETA.diagnostic());
  expect(diagnostic.player).toBeTruthy();
  expect(diagnostic.team).toBeTruthy();
  expect(diagnostic.role).toBeTruthy();
  expect(Number(diagnostic.seasonYear)).toBeGreaterThanOrEqual(2019);
  expect(Number(diagnostic.regular.total)).toBeGreaterThan(0);
  return diagnostic;
}

async function expectNoSimulationDeadlock(page) {
  const state = await page.evaluate(() => {
    const active = !!seasonState?.simulating || !!seasonState?.b2WholeActive || !!seasonState?.v18WholeActive || !!seasonState?.v34WholeActive;
    const pausedAtNode = !!seasonState?.eventDue || !!seasonState?.currentEvent || !!careerState?.v800Trade?.pending || !!seasonState?.v71AllStarPending;
    const hasTimer = !!seasonState?.timer || !!window.__OWL_RUNTIME?.simulation?.captureWhole?.();
    return { active, pausedAtNode, hasTimer };
  });
  if (state.active && !state.pausedAtNode) expect(state.hasTimer).toBe(true);
  return state;
}

module.exports = { expectNoHorizontalOverflow, expectCleanRuntime, expectScreen, expectHealthyDiagnostic, expectNoSimulationDeadlock };
