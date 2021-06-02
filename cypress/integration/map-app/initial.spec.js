import { mount } from '@cypress/vue'
import { MapContent } from '../../..//src/components/index.js'

describe('MapContent', () => {
  it('renders a message', () => {
    const msg = 'Hello Cypress Component Testing!'
    mount(MapContent, {
      propsData: {
        msg
      }
    })

    cy.get('h1').should('have.text', msg)
  })
})
