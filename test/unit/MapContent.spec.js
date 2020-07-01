import { shallowMount } from '@vue/test-utils'
import MapContent from '../../src/components/MapContent.vue';
import FloatingFlow from '../../src/components/FloatingFlow';
import Tutorial from '../../src/components/Tutorial'

const div = document.createElement('div');
document.body.appendChild(div);
const wrapper = shallowMount(MapContent, {
  attachTo: div});

describe('MapContent.vue', () => {
  it('FloatingFlow', () => {
    expect(wrapper.findComponent(FloatingFlow).exists()).to.be.true;
  }),
  it('Tutorial', () => {
    expect(wrapper.findComponent(Tutorial).exists()).to.be.true;
  })
})
