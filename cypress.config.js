
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
    setupNodeEvents(on, config) {},
    specPattern: "cypress/component/*.cy.js",
    devServer: {
      framework: "vue",
      bundler: "vite",
    },
  },
  video: true,
  videoCompression: true,
};
