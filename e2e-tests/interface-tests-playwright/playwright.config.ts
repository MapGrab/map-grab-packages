import { workspaceRoot } from '@nx/devkit';
import { nxE2EPreset } from '@nx/playwright/preset';
import { defineConfig, devices } from '@playwright/test';

// For CI, you may want to set BASE_URL to the deployed application.
const baseURL = process.env['BASE_URL'] || 'http://localhost:4200';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */

export type TestOptions = {
  isMapLibre: boolean;
  isMapbox: boolean;
};

export default defineConfig<TestOptions>({
  ...nxE2EPreset(__filename, { testDir: './src' }),
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    deviceScaleFactor: 1,
    baseURL: `${baseURL}/maplibre/`,
    // video: 'retain-on-failure',
  },
  workers: process.env.CI ? 1 : 5,
  retries: process.env.CI ? 0 : 0,
  timeout: 30000,
  // snapshotPathTemplate: '../screenshots/{testFileName}/{arg}-{projectName}-{platform}{ext}',
  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npx nx serve interface-tests',
    url: 'http://localhost:4200/maplibre/',
    cwd: workspaceRoot,
    timeout: 10 * 1000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'chromium-maplibre',
      use: {
        channel: 'chromium',
        baseURL: `${baseURL}/maplibre/`,
        isMapLibre: true,
        launchOptions: {
          args: ['--no-sandbox', '--use-angle=gl', '--ignore-gpu-blocklist'],
        },
      },
    },
    {
      name: 'firefox-maplibre',
      use: { ...devices['firefox'], baseURL: `${baseURL}/maplibre/`, isMapLibre: true },
    },
    ...(!process.env.CI || process.env.CI_MAC_OS
      ? [
          {
            name: 'webkit-maplibre',
            use: {
              ...devices['webkit'],
              baseURL: `${baseURL}/maplibre/`,
              isMapLibre: true,
              launchOptions: {
                args: ['--no-sandbox', '--use-angle=gl'],
              },
            },
          },
        ]
      : []),

    // Mapbox
    {
      name: 'chromium-mapbox',
      use: {
        channel: 'chromium',
        baseURL: `${baseURL}/mapbox/`,
        isMapbox: true,
        launchOptions: {
          args: ['--no-sandbox', '--use-angle=gl'],
        },
      },
    },
    {
      name: 'firefox-mapbox',
      use: { ...devices['firefox'], baseURL: `${baseURL}/mapbox/`, isMapbox: true },
    },
    ...(!process.env.CI || process.env.CI_MAC_OS
      ? [
          {
            name: 'webkit-mapbox',
            use: {
              ...devices['webkit'],
              baseURL: `${baseURL}/mapbox/`,
              isMapbox: true,
              launchOptions: {
                args: ['--no-sandbox', '--use-angle=gl'],
              },
            },
          },
        ]
      : []),
  ],
});
