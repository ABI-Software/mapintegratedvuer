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

      cy.intercept('/sparc-api/dataset_info/using_multiple_dois/?dois=*', {statusCode: 200, body: stub.noResponse});
    
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

    //cy.waitUntil(function() {
    //  return cy.get('.multi-container > .el-loading-parent--relative > .el-loading-mask').should('not.exist');
    //})


    //Wait for the curie response before continuing

    /*
    //Stub more responses with preloaded fixture
    cy.get('@stub').then((stub) => {
      cy.intercept('/sparc-api/filter-search/?', {statusCode: 200, body: stub.noResponse});

      cy.intercept('/sparc-api/get-facets/species', {statusCode: 200, body: stub.speciesResponse});

      cy.intercept('/sparc-api/get-facets/gender', {statusCode: 200, body: stub.genderResponse});

      cy.intercept( '/sparc-api/get-facets/organ', {statusCode: 200, body: stub.organResponse});

      cy.intercept('/sparc-api/filter-search/?term=organ&facet=heart*', {statusCode: 200, body: stub.resultResponse});

      cy.intercept('/discover/datasets/doi/1111/11111', {statusCode: 200, body: stub.datasetResult}).as("finalResponse");
    });

    //Two markers should be visible at this stage, click on the first one (heart)
    cy.get('.flatmap-marker:visible').should('have.length', 2).first().click({force: true});

    //Sidebar should be visbile now
    cy.get('.el-drawer.rtl.my-drawer').should('be.visible');

    //Close tab button should exist now
    cy.get('.close-tab ').should('exist');

    //Check the toggled tag on the sidebar is heart
    cy.get('.el-tag > span').contains('Heart');

    //Wait for the final stub response
    cy.wait('@finalResponse');

    //Only one card on the sidebar
    cy.get('.el-card__body > .content').find('.card').should('have.length', 1);

    //Intercept the request and stub it with preloaded fixture
    cy.get('@metadata').then((metadata) => {
      cy.intercept('/sparc-api/s3-resource/32/3/files/derivative/H-4/scaffold/metadata.json', {statusCode: 200, body: metadata});
    })

    //Intercept the request and stub it with preloaded fixture
    cy.get('@primitive').then((primitive) => {
      cy.intercept('/sparc-api/s3-resource/32/3/files/derivative/H-4/scaffold/cube_2.json', {statusCode: 200, body: primitive}).as("scaffoldResponse");
    })
    
    //Click on the View scaffold button
    cy.get('.el-button').contains('View scaffold').should('be.visible').click({force: true});

    //Scaffold container should be visible now
    cy.get('.scaffold-container').should('be.visible');

    //Wait for the scaffold response to finish
    cy.wait('@scaffoldResponse');

    //Check if cube is loaded in
    cy.get('.traditional-container > .el-checkbox-group > .checkbox-group-inner > .el-row > .checkbox-container > .el-checkbox > .el-checkbox__label').contains('cube');

    //Close the sidebar
    cy.get('.close-tab > .el-icon-arrow-right').should('be.visible').click({force: true});

    //Sidebar should not be visbile
    cy.get('.el-drawer.rtl.my-drawer').should('not.be.visible');

    //Click on the content chooser
    cy.get('.singlepanel-1.toolbar > .el-select > .el-input > .el-input__inner').should('be.visible').click({force: true});

    //There should be two items in the drop down menu, one fo them should be MultiFlatmap and click on it
    cy.get('.singlepanel-1.toolbar .el-select-dropdown__item').should('have.length', 2).contains('MultiFlatmap').should('be.visible').click({force: true});

    //This should click on the split screen button
    cy.get('.icon-group .tooltip').contains('Split screen').parent().parent().find('.icon').should('be.visible').click({force: true});

    //There should be five items in the drop down list, one fo them should be Vertical split and click on it
    cy.get('.view-text').should('have.length', 5).contains('Vertical split').should('be.visible').click({force: true});
    
    //There should two active tab toolbar
    cy.get('.tab-container').find('.toolbar').not('.inactive').should('have.length', 2);

    //There should two active tab toolbar
    cy.get('.contentvuer').should('have.length', 2);

    */
  })
})
