
import { configureVisualRegression } from 'cypress-visual-regression';

export default {
  defaultCommandTimeout: 10000,
  reporter: "junit",
  experimentalMemoryManagement: true,
  numTestsKeptInMemory: 0,
  reporter: "cypress-multi-reporters",
  reporterOptions: {
    configFile: "reporter-config.json",
  },
  component: {
    viewportWidth: 1440,
    viewportHeight: 900,
    specPattern: "cypress/component/*.cy.js",
    devServer: {
      framework: "vue",
      bundler: "vite",
    },
    env: {
      visualRegressionType: 'regression',
      visualRegressionBaseDirectory: 'cypress/snapshots/MapContent.cy.js/base',
      visualRegressionDiffDirectory: 'cypress/snapshots/diff',
      visualRegressionGenerateDiff: 'always',
      visualRegressionFailSilently: false,
    },
    screenshotsFolder: './cypress/snapshots',
    setupNodeEvents(on, config) {
      on('task', {
        log(message) {
          console.log(message)
          return null
        },
      });
      configureVisualRegression(on);
    },
    trashAssetsBeforeRuns: false,
  },
  video: true,
  videoCompression: true,
};
