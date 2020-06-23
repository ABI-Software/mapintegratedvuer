import { shallowMount } from '@vue/test-utils'
import MapContent from '../../src/components/MapContent.vue';


describe('MapContent.vue', () => {
  it('div', () => {
    const wrapper = shallowMount(MapContent);
    expect(wrapper.find('div').exists()).to.be.true;
  })
})
