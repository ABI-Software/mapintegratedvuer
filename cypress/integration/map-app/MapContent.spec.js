import { mount } from '@cypress/vue';
import { MapContent } from '../../../src/components/index.js';
import { StubResponses } from './StubResponse.js';

describe('MapContent', () => {
  it('test something', () => {
    mount(MapContent, {
      propsData: {
        api: "https://mock-test/sparc-api/"
      }
    });

    cy.get('.mapcontent').invoke('attr', 'style', 'height: 880px').should(
      'have.attr', 'style', 'height: 880px');

    cy.intercept('GET', '/flatmaps/flatmap/**');

    cy.get('.multi-container > .el-loading-parent--relative > .el-loading-mask').should('be.visible');

    cy.get('.header').should('be.visible');

    cy.get('.icon-group').children().should('have.length', 8);

    cy.get('.open-tab > .el-icon-arrow-left').should('exist');

    cy.get('.multi-container > .el-loading-parent--relative > .el-loading-mask', {timeout:20000}).should('not.exist');
 
    cy.intercept('/sparc-api/filter-search/?', {statusCode: 200, body: StubResponses.noResponse});

    cy.intercept('/sparc-api/get-facets/species', {statusCode: 200, body: StubResponses.speciesResponse});

    cy.intercept('/sparc-api/get-facets/gender', {statusCode: 200, body: StubResponses.genderResponse});

    cy.intercept( '/sparc-api/get-facets/genotype', {statusCode: 200, body: StubResponses.genotypeResponse});

    cy.intercept('/sparc-api/filter-search/Heart/?facet=All+Species&term=species', {statusCode: 200, body: StubResponses.resultResponse});

    cy.intercept('/discover/datasets/doi/1111/11111', {statusCode: 200, body: StubResponses.datasetResult}).as("finalResponse");

    cy.get('[style="transform: translate(-50%, -50%) translate(716px, 595px) rotateX(0deg) rotateZ(0deg);"] > .flatmap-marker > svg > [fill-rule="nonzero"] > [transform="translate(3.0, 29.0)"] > [rx="4.5"]').should('be.visible').click({force: true});

    cy.get('.search-input > .el-input__inner').should('have.value', 'Heart');

    cy.get('.close-tab ').should('exist');

    cy.wait('@finalResponse');

    cy.get('.el-card__body > .content').find('.card').should('have.length', 1);
  })
})
