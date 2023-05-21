const { defineConfig } = require("cypress");

module.exports = defineConfig({
  viewportWidth: 1440,
  viewportHeight: 900,
  defaultCommandTimeout: 10000,
  reporter: "junit",
  experimentalMemoryManagement: true,
  numTestsKeptInMemory: 0,
  reporter: "cypress-multi-reporters",
  reporterOptions: {
    configFile: "reporter-config.json"
  },
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require("./cypress/plugins/index.js")(on, config);
    },
  },

  component: {
    setupNodeEvents(on, config) {},
    specPattern: "cypress/component/*.cy.js",
  },

  component: {
    devServer: {
      framework: "vue-cli",
      bundler: "webpack",
    },
  },
});
