// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

import 'cypress-wait-until';

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

Cypress.Commands.add('checkFlatmapProvenanceCard', (species, prevPublicationLink) => {
  cy.get('#flatmap-select').click({force: true} );
  cy.get('.el-select-dropdown__wrap > .el-scrollbar__view').contains(species).click();
  cy.get('.multi-container > .el-loading-parent--relative > [name="el-loading-fade"] > .el-loading-mask', {timeout: 60000}).should('not.exist');
  cy.get('#maplibre-minimap > .maplibregl-canvas-container > .maplibregl-canvas', {timeout: 60000}).should('be.visible');      cy.get('.el-row > div[style=""]').click()
  cy.get('.flatmap-context-card > .card-right > a').contains('here').should('have.attr', 'href').and('include', species.toLowerCase())
  cy.get('.flatmap-context-card').trigger('mouseover');
  cy.get('.flatmap-context-card').within(() => {
    cy.get('.publication-link').invoke('attr', 'href').as(`${species}_publicationLink`);

    // To verify data change
    if (prevPublicationLink) {
      cy.get('.float-button-container').invoke('css', {
        'opacity': '1',
        'visibility': 'visible'
      });

      cy.get(`@${species}_publicationLink`).then((publicationLink) => {
        const expectedContent = `Flatmap Provenance

SCKAN version: Mock SCKAN version

Published on:
Mock publication date

View publication:
${publicationLink}`;

        cy.window().then((win) => {
          if (win.setMockClipboardText) {
            win.setMockClipboardText(expectedContent);
          }
        });
        cy.get('.float-button-container button').click({ force: true });
        cy.wait(100);

        if (prevPublicationLink) {
          expect(publicationLink).to.not.equal(prevPublicationLink);
        }

        cy.window().then((win) => {
          return win.navigator.clipboard.readText();
        }).then((text) => {
          expect(text).to.include(publicationLink);

          if (prevPublicationLink) {
            expect(text).to.not.include(prevPublicationLink);
          }
        });
      });
    }
  });
})

Cypress.Commands.add('checkGlobalSettings', (compare, setting, index) => {
  cy.wait(1000);
  cy.get('.el-icon.header-icon').as('globalSettings').click(); // open
  cy.get(`.setting-popover-inner > :nth-child(${index}) > .el-radio-group > .el-radio`).as('settingOptions').last().click();
  cy.get('@globalSettings').click(); // close
  cy.get('@globalSettings').trigger('mouseleave');
  cy.wait(1000);
  cy.get('html').compareSnapshot(compare).then(comparisonResults => {
    expect(comparisonResults.percentage, `${setting} should be applied`).to.be.above(0);
  });
  cy.get('@globalSettings').click(); // open
  cy.get('@settingOptions').first().click(); // reset to default
  cy.get('@globalSettings').click(); // close
  cy.get('@globalSettings').trigger('mouseleave');
  cy.wait(1000);
})

Cypress.Commands.add('testSetCurrentEntry', (entry, species) => {
  cy.window().then((win) => {
    if (win.Cypress && win.Cypress.vue) {
      const cypressVue = win.Cypress.vue;
      const mapContentRef = cypressVue.$refs.map;
      if (mapContentRef && mapContentRef.setCurrentEntry) {
        mapContentRef.setCurrentEntry(entry);
      }
    }
  });

  // Wait for the loading to complete
  cy.get('.multi-container > .el-loading-parent--relative > [name="el-loading-fade"] > .el-loading-mask', {timeout: 60000}).should('not.exist');
  cy.get('#maplibre-minimap > .maplibregl-canvas-container > .maplibregl-canvas', {timeout: 60000}).should('be.visible');

  // Verify that the selected species is in the species dropdown
  cy.get('.contentvuer .component-container .el-select.select-box .el-select__selection .el-select__selected-item.el-select__placeholder')
    .should('contain.text', species)

  // Verify that the selected flatmap is loaded by checking the flatmap content
  cy.window().then((win) => {
    if (win.Cypress && win.Cypress.vue) {
      const cypressVue = win.Cypress.vue;
      const mapContentRef = cypressVue.$refs.map;
      if (mapContentRef) {
        const splitdialog = mapContentRef.$refs.flow.$refs.splitdialog;

        if (splitdialog) {
          const activeContents = splitdialog.getActiveContents();
          const multiFlatmapContent = activeContents.find(content =>
            content.viewerType === 'MultiFlatmap'
          );

          if (multiFlatmapContent && multiFlatmapContent.$refs['viewer']) {
            const viewer = multiFlatmapContent.$refs['viewer'];
            expect(viewer.activeSpecies).to.equal(species);
          }
        }
      }
    }
  });
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

Cypress.Commands.add('connectivitySearch', (searchTerm) => {
  cy.get('[style=""] > .el-card__header > .header > .el-input > .el-input__wrapper > .el-input__inner').clear();
  cy.get('[style=""] > .el-card__header > .header > .el-input > .el-input__wrapper > .el-input__inner').type(searchTerm);
  cy.get('[style=""] > .el-card__header > .header > .el-button--primary').click();
  cy.get('.connectivity-card-container > .connectivity-card').should('have.length.greaterThan', 0);
  cy.get('.dataset-results-feedback:visible').should('exist').contains('results');
});

Cypress.Commands.add('compareConnectivitySearchResults', ([searchTerm1, searchTerm2], isSame) => {
  cy.connectivitySearch(searchTerm1);
  cy.wait(1000);
  cy.get('.dataset-results-feedback:visible').invoke('text').then((storedvalue1) => {
    cy.connectivitySearch(searchTerm2);
    cy.wait(1000);
    cy.get('.dataset-results-feedback:visible').invoke('text').then((storedvalue2) => {
      if (isSame) {
        expect(storedvalue1.trim()).to.equal(storedvalue2.trim());
      } else {
        expect(storedvalue1.trim()).to.not.equal(storedvalue2.trim());
      }
    });
  });
})
