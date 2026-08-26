const { expect } = require('@playwright/test');
const { loadQaScenario } = require('./app');

const SCENARIOS = [
  '2019-season-start', '2023-pre-playoffs', '2025-stage2', '2025-pre-finals',
  'worldcup-selection', 'worldcup-knockout', 'trade-offer', 'contract-expiry', 'retirement-age29'
];

async function loadAndVerifyScenario(page, id) {
  expect(SCENARIOS).toContain(id);
  return loadQaScenario(page, id);
}

async function scenarioDiagnostic(page) {
  return page.evaluate(() => ({
    qa: window.__OWL_QA.currentScenario(),
    diagnostic: window.__OWL_QA.diagnostic(),
  }));
}

module.exports = { SCENARIOS, loadAndVerifyScenario, scenarioDiagnostic };
