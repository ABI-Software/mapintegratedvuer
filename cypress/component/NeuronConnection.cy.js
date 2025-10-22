/* eslint-disable no-alert, no-console */
import { MapContent } from '../../src/components/index.js';

const neuronConnectionSettings = {
  'Destination': 'Heart',
  'Origin': "Barrington's nucleus",
  'Via': 'C4 segment of cervical spinal cord',
  'All': 'Tongue'
};

describe('MapContent', () => {

  before(() => {
    cy.fixture('stubResponse.json').as('stub');
  })

  Cypress.on('uncaught:exception', (err) => {
    // returning false here prevents Cypress from
    // failing the test
    if (err.message.includes("this.$refs.sideBar.closeConnectivity is not a function"))
      return false
    if (err.message.includes("Cannot read properties of undefined (reading 'left')"))
      return false
    if (err.message.includes("Failed to fetch"))
      return false
    if (err.message.includes('Source "mapbox-gl-draw-cold" already exists.'))
      return false
    if (err.message.includes('Source "markers" already exists.'))
      return false
    if (err.message.includes("Cannot read properties of undefined (reading 'onResize')"))
      return false
    if (err.message.includes("knowledge/query/")) {
      return false
    }
    if (err.message.includes("Cannot read properties of null (reading 'id')")) {
      return false
    }
    if (err.message.includes("$el.css is not a function")) {
      return false
    }
    return true
  })

  Cypress.Commands.add('checkNeuronConnectionMode', (mode, searchTerm) => {
    cy.get('.viewing-mode-selector .el-dropdown').as('viewingModes').trigger('mouseenter'); // open
    cy.get('@viewingModes').contains(mode).click();
    cy.get('.search-box.el-autocomplete > .el-input > .el-input__wrapper > .el-input__inner').should('exist').type(searchTerm);
    cy.get('.search-container > .map-icon > use').should('exist').click();
    cy.wait(2000);
    const tagTerm = `${mode[0]}:${searchTerm}`
    cy.get('.sidebar-container .filters').should('exist').contains(tagTerm);
    cy.get('.connectivity-card-container > .connectivity-card').should('have.length.greaterThan', 0);
    cy.get('.sidebar-container .el-card:visible .header .is-link > span').contains('Reset').click({ multiple: true })
    cy.get('.search-box.el-autocomplete > .el-input > .el-input__wrapper > .el-input__inner').should('exist').clear();
  })

  it('Neuron connection mode testing', () => {

    //Intercept any initial response with preloaded fixture
    cy.get('@stub').then((stub) => {

      cy.intercept('/sparc-api/dataset_info/using_multiple_dois/*', {statusCode: 200, body: stub.noResponse});

      cy.intercept('/sparc-api/dataset_info/using_multiple_dois/?dois=*', {statusCode: 200, body: stub.resultResponse}).as("mouseDataset");

      cy.intercept('/sparc-api/get-organ-curies', {statusCode: 200, body: stub.curiesResponse}).as("curieResponse");

      cy.intercept('/sparc-api/get_featured_datasets_identifiers', {statusCode: 200, body: stub.featuredDatasetResponse}).as("featuredDatasetResponse");

      const anatomy_dataset = {
        "result": [stub.datasetResult]
      };

      cy.intercept('/sparc-api/dataset_info/anatomy?identifier=130', {statusCode: 200, body: anatomy_dataset}).as("anatomyResponse");
    })

    cy.mount(MapContent, {
      props: {
        options: {
          sparcApi: "https://mock-test/sparc-api/",
          flatmapAPI: "https://mapcore-demo.org/current/flatmap/v3/",
          algoliaKey: Cypress.env('ALGOLIA_KEY'),
          algoliaId: Cypress.env('ALGOLIA_ID'),
        },
      },
      global: {
        stubs: {
          transition: false,
        }
      },
    });

    cy.get('.mapcontent').invoke('attr', 'style', 'height: 880px').should('have.attr', 'style', 'height: 880px');
    cy.get('.header').should('be.visible');
    cy.get('.toolbar-title').should('exist');

    // Sidebar should not be visbile
    cy.get('.el-drawer.rtl.my-drawer').should('not.be.visible');

    cy.get('#maplibre-minimap > .maplibregl-canvas-container > .maplibregl-canvas', {timeout: 60000}).should('be.visible');

    // Open the sidebar
    cy.get('.side-bar > .open-tab').should('exist').click();

    // connectivity explorer
    cy.get('.tabs-container > :nth-child(2)').click();
    cy.get('[style=""] > .el-card__header > .header > .el-input > .el-input__wrapper > .el-input__inner').clear();
    cy.get('[style=""] > .el-card__header > .header > .el-input > .el-input__wrapper > .el-input__inner').type("heart");
    cy.get('[style=""] > .el-card__header > .header > .el-button--primary').click();
    cy.get('.connectivity-card-container > .connectivity-card').should('have.length.greaterThan', 0);

    // Test Neuron connection mode, competency not yet ready for production, disable for now.
    for (const [key, value] of Object.entries(neuronConnectionSettings)) {
      cy.checkNeuronConnectionMode(key, value);
    }

  })
})
