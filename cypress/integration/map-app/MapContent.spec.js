import { mount } from '@cypress/vue';
import { MapContent } from '../../../src/components/index.js';

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
    
    const noResponse = {"numberOfHits": 0, "results": [] };

    cy.intercept('/sparc-api/filter-search/?', {statusCode: 200, body: noResponse});

    const speciesResponse = [{"doc_count":19,"key":"rattus norvegicus"},{"doc_count":9,"key":"sus scrofa domesticus"},{"doc_count":7,"key":"mus musculus"},{"doc_count":6,"key":"homo sapiens"},{"doc_count":2,"key":"sus scrofa"},{"doc_count":1,"key":"canis familiaris"},{"doc_count":1,"key":"felis catus"},{"doc_count":1,"key":"mustela putorius furo"},{"doc_count":9,"key":"rattus norvegicus"},{"doc_count":6,"key":"mus musculus"},{"doc_count":5,"key":"homo sapiens"},{"doc_count":5,"key":"sus scrofa domesticus"},{"doc_count":1,"key":"sus scrofa"}];

    cy.intercept('/sparc-api/get-facets/species', {statusCode: 200, body: speciesResponse});
      
    const genderResponse = [{"doc_count":44,"key":"male"},{"doc_count":25,"key":"female"}];

    cy.intercept('/sparc-api/get-facets/gender', {statusCode: 200, body: genderResponse});

    const genotypeResponse = [{"doc_count":13,"key":"heart"},{"doc_count":12,"key":"vagus nerve"},{"doc_count":10,"key":"stomach"},{"doc_count":7,"key":"colon"},{"doc_count":3,"key":"brown adipose tissue"},{"doc_count":2,"key":"pancreas"},{"doc_count":2,"key":"peripheral nervous system"},{"doc_count":1,"key":"autonomic nervous system"},{"doc_count":1,"key":"brainstem"},{"doc_count":1,"key":"spinal cord"}];

    cy.intercept( '/sparc-api/get-facets/genotype', {statusCode: 200, body: genotypeResponse});

    const resultResponse =  {"numberOfHits": 1, "results": [{"scaffolds": [{"anatomy": {"curie": "UBERON:0000948"}, "file": {"name": "scaffold"}, "dataset": {"id": "dataset:111111111", "path": "derivative/H-4/scaffold"}, "description": "Test dataset", "organism": {"species": {"curie": "NCBITaxon:10090"}}, "remote": {"id": "collection:111111"}, "distributions": {"api": [{"uri": "https://api.blackfynn.io/collections/N:collection:111111"}], "current": [{"uri": "https://app.blackfynn.io/N:organization:111111/datasets/N:dataset:1111111111/files/N:collection:111111111"}]}, "mimetype": "inode/vnd.abi.scaffold+directory"}], "samples": [{"sex": {"value": "male"}, "ageCategory": {"value": "prime adult stage"}}], "name": "Identification of peripheral neural circuits that regulate heart rate using optogenetic and viral vector strategies", "identifier": "N:dataset:1111111", "uri": [{"uri": "https://app.blackfynn.io/N:organization:11111/datasets/N:dataset:9dd7a07b-2037-4ce7-829d-395cc4382518"}], "updated": [{"timestamp": "2021-02-11T18:30:05,612671Z"}], "organs": [{"name": "heart", "matchingStatus": "approved", "curie": "ilx:0732254", "parents": [{"term1_ilx": "ilx:0777104", "term1_label": "crux cordis", "curie": "ilx:0732254", "name": "heart"}]}], "contributors": [{"name": "Tester, Iam", "curie": "ORCID:0000-1234-5678-9012", "uri": "https://orcid.org/0000-1234-5678-9012"}], "doi": "https://doi.org/1111/11111", "csvFiles": []}]};
    
    cy.intercept('/sparc-api/filter-search/Heart/?facet=All+Species&term=species', {statusCode: 200, body: resultResponse});

    cy.intercept('/discover/**', {statusCode: 404, body: '404 Not Found!'});

    cy.get('[style="transform: translate(-50%, -50%) translate(716px, 595px) rotateX(0deg) rotateZ(0deg);"] > .flatmap-marker > svg > [fill-rule="nonzero"] > [transform="translate(3.0, 29.0)"] > [rx="4.5"]').should('be.visible').click({force: true});

    cy.get('.close-tab ').should('exist');
  })
})
