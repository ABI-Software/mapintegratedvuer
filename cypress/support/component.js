// ***********************************************************
// This example support/component.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'
import { createPinia } from 'pinia';
import { mount } from 'cypress/vue'
import { addCompareSnapshotCommand } from 'cypress-visual-regression/dist/command';


addCompareSnapshotCommand({
  capture: 'fullPage', // cypress screenshot option
  errorThreshold: 1, // plugin threshold option
  pixelmatchOptions: {
    threshold: 0.1 // pixelmatch threshold option
  }
})

Cypress.Commands.add('mount', (component, options = {}) => {

  const pinia = createPinia();

  const installPinia = (app) => {
    app.use(pinia);
  }

  // To support global overrides in mount options
  options.global = options.global || {};
  options.global.plugins = options.global.plugins || [];
  options.global.plugins.push(installPinia);

  return mount(component, options);
});

Cypress.on('uncaught:exception', (err, runnable) => {
  // we expect a flatmap-viewer error with message ''Graph.addNode'
  // and don't want to fail the test so we return false
  if (err.message.includes('Graph.addNode')) {
    return false
  }
  // we still want to ensure there are no other unexpected
  // errors, so we let them fail the test
})
