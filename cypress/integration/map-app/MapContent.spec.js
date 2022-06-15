/* eslint-disable no-alert, no-console */
import { mount } from '@cypress/vue';
import { MapContent } from '../../../src/components/index.js';

describe('MapContent', () => {

  //Load in some responses/assets before beginning the test
  //This should prevent any async behaviours.
  before(() => {
    cy.fixture('scaffoldMetadata.json').as('metadata');
    cy.fixture('scaffoldPrimitive.json').as('primitive');
    cy.fixture('stubResponse.json').as('stub');
  })
  
  it('Workflow testing', () => {

    //Intercept any initial response with preloaded fixture
    cy.get('@stub').then((stub) => {

      //cy.intercept('/sparc-api/get-facets/species', {statusCode: 200, body: stub.speciesResponse});

      //cy.intercept('/sparc-api/get-facets/gender', {statusCode: 200, body: stub.genderResponse});

      //cy.intercept( '/sparc-api/get-facets/organ', {statusCode: 200, body: stub.organResponse});

      //cy.intercept('/sparc-api/filter-search/*', {statusCode: 200, body: stub.noResponse});

      cy.intercept('/sparc-api/dataset_info/using_multiple_dois/*', {statusCode: 200, body: stub.noResponse});

      cy.intercept('/sparc-api/dataset_info/using_multiple_dois/?dois=*', {statusCode: 200, body: stub.resultResponse}).as("mouseScaffold");
    
      cy.intercept('/sparc-api/get-organ-curies?', {statusCode: 200, body: stub.curiesResponse}).as("curieResponse");
    })

    //cy.intercept('GET', 'https://mapcore-demo.org/current/flatmap/v2/**');
    
    mount(MapContent, {
      propsData: {
        options: {
          sparcApi: "https://mock-test/sparc-api/",
          flatmapAPI: "https://mapcore-demo.org/current/flatmap/v2/",
          algoliaKey: Cypress.env('ALGOLIA_KEY'),
          algoliaId: Cypress.env('ALGOLIA_ID'),
        }
      }
    });

    Cypress.on('uncaught:exception', (err) => {
      // returning false here prevents Cypress from
      // failing the test
      if (err.message.includes("this.facets.at is not a function"))
        return false
      return true
    })

    //Wait for the curie response before continuing
   // cy.wait('@categoryResponse');

    //Check if mapcontent is mounted correctly
    cy.get('.mapcontent').invoke('attr', 'style', 'height: 880px').should(
      'have.attr', 'style', 'height: 880px');

    //Loading mask should exist at the beginning
    cy.get('.multi-container > .el-loading-parent--relative > .el-loading-mask', {timeout: 20000}).should('exist');

    cy.get('.header').should('be.visible');

    //Only three visible button on the toolbar at the start
    cy.get('.icon-group .map-icon:visible ').should('have.length', 3);

    //Sidebar should not be visbile
    cy.get('.el-drawer.rtl.my-drawer').should('not.be.visible');

    //cy.get('.multi-container > .el-loading-parent--relative > .el-loading-mask', {timeout: 30000}).should('have.length', 0);

    //Check for open button for sidebar


    cy.wait('@curieResponse', {timeout: 20000});

    cy.get('.content-container > .el-button').should('be.visible').click({force: true});

    cy.get('.open-tab > .el-icon-arrow-left').should('exist').click();

    cy.get('.search-input > .el-input__inner').should('exist').type('76 generic');

    cy.get('.header > .el-button').should('exist').click();

    cy.get('.content-container').should('have.length', 2);

    cy.wait('@mouseScaffold', {timeout: 20000});

    cy.get('.box-card .container button').should('have.length', 3);

    cy.get('.box-card .container button').contains('Scaffolds (3)').click();

    cy.get('.gallery-strip').contains('54-8_metadata.json').should("exist");

    cy.get('.box-card :nth-child(1) > .details .el-button').click();

    cy.get('.singlepanel-1.contentvuer').should('have.length', 1);

    cy.get('.singlepanel-1 .el-input__inner').should('exist').click();

    cy.get('.singlepanel-1 .el-scrollbar__view >').should('have.length', 3);
  })
})
