import { shallowMount } from '@vue/test-utils'
import MapContent from '../../src/components/MapContent.vue';
import FloatingFlow from '../../src/components/FloatingFlow';

const div = document.createElement('div');
document.body.appendChild(div);
const wrapper = shallowMount(MapContent, {
  attachTo: div
});


describe('MapContent.vue', () => {
  it('FloatingFlow', () => {
    expect(wrapper.findComponent(FloatingFlow).exists()).to.be.true;
  })
})
