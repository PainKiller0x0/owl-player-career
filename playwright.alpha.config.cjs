const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/alpha',
  timeout: 30000,
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:4175', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: { command: 'node tests/alpha/server.cjs', url: 'http://127.0.0.1:4175/alpha/', reuseExistingServer: true, timeout: 10000 },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } } },
    { name: 'mobile', use: { ...devices['Pixel 5'], viewport: { width: 390, height: 844 } } }
  ]
});
