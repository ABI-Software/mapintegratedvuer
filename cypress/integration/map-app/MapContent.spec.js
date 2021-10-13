import { mount } from '@cypress/vue';
import { MapContent } from '../../../src/components/index.js';

describe('MapContent', () => {

  before(() => {
    cy.fixture('scaffoldMetadata.json').as('metadata');
    cy.fixture('scaffoldPrimitive.json').as('primitive');
    cy.fixture('stubResponse.json').as('stub');
  })
  
  it('Workflow testing', () => {

    cy.get('@stub').then((stub) => {
      cy.intercept('/sparc-api/get-facets/species', {statusCode: 200, body: stub.speciesResponse});

      cy.intercept('/sparc-api/get-facets/gender', {statusCode: 200, body: stub.genderResponse});

      cy.intercept( '/sparc-api/get-facets/organ', {statusCode: 200, body: stub.organResponse});

      cy.intercept('/sparc-api/filter-search/*', {statusCode: 200, body: stub.noResponse});
    
      cy.intercept('/sparc-api/get-organ-curies?', {statusCode: 200, body: stub.curiesResponse}).as("curieResponse");
    })

    cy.intercept('GET', 'https://mapcore-demo.org/current/flatmap/v2/**');
    
    mount(MapContent, {
      propsData: {
        api: "https://mock-test/sparc-api/",
        flatmapAPI: "https://mapcore-demo.org/current/flatmap/v2/"
      }
    });    

    cy.get('.mapcontent').invoke('attr', 'style', 'height: 880px').should(
      'have.attr', 'style', 'height: 880px');

    cy.get('.multi-container > .el-loading-parent--relative > .el-loading-mask').should('exist');

    cy.get('.header').should('be.visible');

    cy.get('.icon-group').children().should('have.length', 8);

    cy.get('.open-tab > .el-icon-arrow-left').should('exist');

    cy.get('.multi-container > .el-loading-parent--relative > .el-loading-mask', {timeout:20000}).should('not.exist');

    cy.wait('@curieResponse');

    cy.get('@stub').then((stub) => {
      cy.intercept('/sparc-api/filter-search/?', {statusCode: 200, body: stub.noResponse});

      cy.intercept('/sparc-api/get-facets/species', {statusCode: 200, body: stub.speciesResponse});

      cy.intercept('/sparc-api/get-facets/gender', {statusCode: 200, body: stub.genderResponse});

      cy.intercept( '/sparc-api/get-facets/organ', {statusCode: 200, body: stub.organResponse});

      cy.intercept('/sparc-api/filter-search/?term=organ&facet=heart*', {statusCode: 200, body: stub.resultResponse});

      cy.intercept('/discover/datasets/doi/1111/11111', {statusCode: 200, body: stub.datasetResult}).as("finalResponse");
    });

    //This get the heart marker then click on it. It is susceptible to map changes
    cy.get('[style="transform: translate(-50%, -50%) translate(707px, 558px) rotateX(0deg) rotateZ(0deg);"] > .flatmap-marker > svg > [fill-rule="nonzero"] > [transform="translate(3.0, 29.0)"] > [rx="4.5"]').should('be.visible').click({force: true});

    cy.get('.el-tag > span').contains('Heart');

    cy.get('.close-tab ').should('exist');

    cy.wait('@finalResponse');

    cy.get('.el-card__body > .content').find('.card').should('have.length', 1);

    cy.get('@metadata').then((metadata) => {
      cy.intercept('/sparc-api/s3-resource/32/3/files/derivative/H-4/scaffold/metadata.json', {statusCode: 200, body: metadata});
    })

    cy.get('@primitive').then((primitive) => {
      cy.intercept('/sparc-api/s3-resource/32/3/files/derivative/H-4/scaffold/cube_2.json', {statusCode: 200, body: primitive}).as("scaffoldResponse");
    })
    
    cy.get(':nth-child(6) > .el-button').should('be.visible').click({force: true});

    cy.get('.scaffold-container').should('be.visible');

    cy.wait('@scaffoldResponse');

    cy.get('.traditional-container > .el-checkbox-group > .checkbox-group-inner > .el-row > .checkbox-container > .el-checkbox > .el-checkbox__label').contains('cube');

    cy.get('.close-tab > .el-icon-arrow-right').should('be.visible').click({force: true});

    cy.get('.singlepanel-1.toolbar > .el-select > .el-input > .el-input__inner').should('be.visible').click({force: true});

    cy.get('.singlepanel-1.toolbar > .el-select > transition-stub > .el-select-dropdown > .el-scrollbar > .el-select-dropdown__wrap > .el-scrollbar__view > :nth-child(1)').should('be.visible').click({force: true});

    cy.get('.icon-group > :nth-child(2) > .el-popover__reference-wrapper > .icon > use').should('be.visible').click({force: true});

    cy.get(':nth-child(3) > .view-text').should('be.visible').click({force: true});
    
    cy.get('.tab-container').find('.toolbar').not('.inactive').should('have.length', 2);

    cy.get('.contentvuer').should('have.length', 2);
  })
})
