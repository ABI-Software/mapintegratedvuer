/* eslint-disable no-alert, no-console */
import { MapContent } from '../../src/components/index.js';

const neuronConnectionSettings = {
  'Destination': 'Heart',
  'Origin': "Barrington's nucleus",
  'Via': 'C4 segment of cervical spinal cord',
  'All': 'Tongue'
};
const searchTermPairs = [
  {
    isSame: true,
    terms: ['ilxtr:sparc-nlp/kidney/132', 'kidney/132']
  },
  {
    isSame: false,
    terms: ['tunica', 'to tunica']
  },
  {
    isSame: true,
    terms: ['aacar-11', 'aacar 11']
  },
];

describe('MapContent', () => {

  before(() => {
    cy.fixture('stubResponse.json').as('stub');
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
          transition: false, // Disable transition to avoid el-tag issue - PR #432 for more details
        }
      },
    });

    cy.get('.mapcontent').invoke('attr', 'style', 'height: 880px').should('have.attr', 'style', 'height: 880px');
    cy.get('.header').should('be.visible');
    cy.get('.toolbar-title').should('exist');

    // Sidebar should not be visbile
    cy.get('.el-drawer.rtl.my-drawer').should('not.be.visible');

    cy.get('.maplibregl-canvas-container > .maplibregl-canvas').should('be.visible');
    cy.get('#maplibre-minimap .maplibregl-canvas-container > .maplibregl-canvas', { timeout: 60000 }).should('be.visible');

    // Open the sidebar
    cy.get('.side-bar > .open-tab').should('exist').click();

    // connectivity explorer
    cy.get('.tabs-container > :nth-child(2)').click();
    cy.connectivitySearch('heart');
    cy.connectivitySearch('132');

    // Compare connectivity search results for different search terms
    cy.wrap(searchTermPairs).each(({terms, isSame}) => {
      cy.compareConnectivitySearchResults(terms, isSame);
    });

    // clear search
    cy.get('[style=""] > .el-card__header > .header > .search-input-container > .el-input > .el-input__wrapper > .el-input__inner').clear();

    // Test Neuron connection mode, competency not yet ready for production, disable for now.
    for (const [key, value] of Object.entries(neuronConnectionSettings)) {
      cy.checkNeuronConnectionMode(key, value);
    }

  })
})
