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

const opts = {
  deviceScaleFactor: 1,
  launchOptions: {
    args: [
      // https://peter.sh/experiments/chromium-command-line-switches/
      '--force-device-scale-factor=1', // Overrides the device scale factor for the browser UI and the contents.
      '--force-color-profile=srgb', // Force all monitors to be treated as though they have the specified color profile.
      '--use-angle',
      '--enable-webgl',
      '--enable-gpu',
      '--enable-webgl-image-chromium',
      '--ignore-gpu-blocklist',
    ],
  },
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
  workers: process.env.CI ? 3 : 5,
  retries: process.env.CI ? 0 : 0,
  timeout: 6000,
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
        ...opts,
      },
    },
    {
      name: 'firefox-maplibre',
      use: { ...devices['firefox'], baseURL: `${baseURL}/maplibre/`, isMapLibre: true, ...opts, },
    },
    ...(!process.env.CI || process.env.CI_MAC_OS
      ? [
          {
            name: 'webkit-maplibre',
            use: {
              ...devices['webkit'],
              baseURL: `${baseURL}/maplibre/`,
              isMapLibre: true,
              ...opts,
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
        ...opts,
      },
    },
    {
      name: 'firefox-mapbox',
      use: { ...devices['firefox'], baseURL: `${baseURL}/mapbox/`, isMapbox: true, ...opts, },
    },
    ...(!process.env.CI || process.env.CI_MAC_OS
      ? [
          {
            name: 'webkit-mapbox',
            use: {
              ...devices['webkit'],
              baseURL: `${baseURL}/mapbox/`,
              isMapbox: true,
              ...opts,
            },
          },
        ]
      : []),
  ],
});
