/// <reference types="cypress" />

context('Initial', () => {
  beforeEach(() => {
    cy.visit('http://localhost:8081/')
  });
  it('map is present', () => {
    cy.get('.map-app').should('be.visible')
  });
})
