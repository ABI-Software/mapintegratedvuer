/* eslint-disable no-alert, no-console */
import { MapContent } from '../../src/components/index.js';

describe('MapContent', () => {

  //Load in some responses/assets before beginning the test
  //This should prevent any async behaviours.
  before(() => {
    cy.fixture('scaffoldMetadata.json').as('metadata');
    cy.fixture('scaffoldPrimitive.json').as('primitive');
    cy.fixture('stubResponse.json').as('stub');
    cy.fixture('simulation_ui.json').as('simulation_ui');
  })
  
  it('Workflow testing', () => {

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

    //cy.intercept('GET', 'https://mapcore-demo.org/current/flatmap/v2/**');
    
    cy.mount(MapContent, {
      propsData: {
        options: {
          sparcApi: "https://mock-test/sparc-api/",
          flatmapAPI: "https://mapcore-demo.org/current/flatmap/v3/",
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

    cy.get('.singlepanel-1 > .toolbar-flex-container > .title').should('exist');

    //Only three visible button on the toolbar at the start
    cy.get('.icon-group .map-icon:visible ').should('have.length', 3);

    //Sidebar should not be visbile
    cy.get('.el-drawer.rtl.my-drawer').should('not.be.visible');

    //Wait for curie response
    cy.wait('@curieResponse', {timeout: 20000});

    //Wait for curie response
    cy.wait('@featuredDatasetResponse', {timeout: 20000});

    //Wait for curie response
    cy.wait('@anatomyResponse', {timeout: 20000});

    cy.get('.multi-container > .el-loading-parent--relative > .el-loading-mask', {timeout: 30000}).should('not.exist');

    //Search for non existance feature, expect not-found text
    cy.get('.el-autocomplete > .el-input > .el-input__inner').should('exist').type("NON_EXISTANCE");
    cy.get('.search-container > .map-icon > use').should('exist').click();
    cy.get('.not-found-text').should('exist');

    //Search for Vague nerve, expect not-found text to be gone
    cy.get('.el-autocomplete > .el-input > .el-input__inner').should('exist').clear();
    cy.get('.el-autocomplete > .el-input > .el-input__inner').should('exist').type("'Vagus Nerve'");
    cy.get('.search-container > .map-icon > use').should('exist').click();
    cy.get('.not-found-text').should('not.exist');

    //Intercept the request and stub it with preloaded fixture
    cy.get('@metadata').then((metadata) => {
      cy.intercept('/WholeBody/31-May-2021/ratBody/ratBody_syncmap_metadata.json',
        {statusCode: 200, body: metadata});
    })
    
    //Intercept the request and stub it with preloaded fixture
    cy.get('@primitive').then((primitive) => {
      cy.intercept('/WholeBody/31-May-2021/ratBody/cube_2.json',
        {statusCode: 200, body: primitive}).as("scaffoldResponse");
    })
    
    //Click on the Open 3D Scaffold button
    cy.get('.open-scaffold').should('be.visible').click();

    //Check for two content containers
    cy.get('.contentvuer').should('be.visible').should('have.length', 2);

    //Wait for the mouse dataset request
    cy.wait('@mouseDataset', {timeout: 20000});

    //Open the sidebar
    cy.get('.open-tab').should('exist').click();

    //Type in 76 generic
    cy.get('.search-input > .el-input__inner').should('exist').type('76 generic');

    //Search
    cy.get('.header > .el-button').should('exist').click();

    //Check number of dataset card, it should be 1
    cy.get('.dataset-card').should('have.length', 1);

    //Check how many tags in the dataset
    cy.get('.box-card .container button').should('have.length', 6);

    //Intercept the request and stub it with preloaded fixture
    cy.get('@metadata').then((metadata) => {
      cy.intercept('/sparc-api/s3-resource/999/1/files/derivative/sub-54-8/scaffold/54-8_metadata.json',
        {statusCode: 200, body: metadata});
    })
    
    //Intercept the request and stub it with preloaded fixture
    cy.get('@primitive').then((primitive) => {
      cy.intercept('/sparc-api/s3-resource/999/1/files/derivative/sub-54-8/scaffold/cube_2.json',
        {statusCode: 200, body: primitive}).as("scaffoldResponse");
    })

    //Check for scaffolds and open it, should have three items in select now
    cy.get('.box-card .container button').contains('Scaffolds (2)').click();
    cy.get('.gallery-strip').contains('54-8_metadata.json').should("exist");
    cy.get('.box-card :nth-child(1) > .details .el-button').click();
    cy.get('.singlepanel-1.contentvuer').should('have.length', 1);
    cy.get('.singlepanel-1 > .toolbar-flex-container > .el-select > .el-input > .el-input__inner').should('exist').click();
    cy.get('.singlepanel-1 > .toolbar-flex-container > .el-select > transition-stub > .el-select-dropdown > .el-scrollbar > .el-select-dropdown__wrap > .el-scrollbar__view> ').should('have.length', 3);

    //Check for segmentations and open it, should have four items in select now
    cy.get('.box-card .container button').contains('Segmentations (1)').click();
    cy.get('.gallery-strip').contains('M54-8_03_20_20_Final.xml').should("exist");
    cy.get('.box-card .container button').contains('Plots (1)').click();
    cy.get('.gallery-strip').contains('RAGP_4subs_negdct.csv').should("exist");
    cy.get('.box-card :nth-child(1) > .details .el-button').click();
    cy.get('.singlepanel-1 > .toolbar-flex-container > .el-select > .el-input > .el-input__inner').should('exist').click();
    cy.get('.singlepanel-1 > .toolbar-flex-container > .el-select > transition-stub > .el-select-dropdown > .el-scrollbar > .el-select-dropdown__wrap > .el-scrollbar__view> ').should('have.length', 4);

    cy.get('@simulation_ui').then((simulation_ui) => {
      cy.intercept('/sparc-api//sim/dataset/999',
        {statusCode: 200, body: simulation_ui});
    })

    //Check for simulations and open it, should have five items in select now
    cy.get('.box-card .container button').contains('Simulations (1)').click();
    cy.get('.box-card :nth-child(1) > .details .el-button').click();
    cy.get('.singlepanel-1 > .toolbar-flex-container > .el-select > .el-input > .el-input__inner').should('exist').click();
    cy.get('.singlepanel-1 > .toolbar-flex-container > .el-select > transition-stub > .el-select-dropdown > .el-scrollbar > .el-select-dropdown__wrap > .el-scrollbar__view> ').should('have.length', 5);

    //Close the sidebar
    cy.get('.close-tab').should('exist').click();
    cy.get('.sidebar-container').should('not.be.visible');

    //Change from single panel to four panels and check for it
    cy.get('.icon-group > :nth-child(2)').should('exist').click();
    cy.get('.icon-group.el-row .el-popover:visible').should('exist');
    cy.get('.icon-group.el-row .el-popover:visible .el-row').should('have.length', 5);
    cy.get('.icon-group.el-row .el-popover:visible .el-row').contains('Four panes').should('exist').click();
    cy.get('.content-container:visible').should('have.length', 4);
  })
})
