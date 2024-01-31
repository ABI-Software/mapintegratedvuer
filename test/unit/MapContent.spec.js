import { shallowMount } from '@vue/test-utils'
import MapContent from '../../src/components/MapContent.vue';
import SplitFlow from '../../src/components/SplitFlow';

const div = document.createElement('div');
document.body.appendChild(div);
const wrapper = shallowMount(MapContent, {
  attachTo: div,
  propsData: {
    options: {
      sparcApi: "https://your-api-location/"
    }
  },
});


describe('MapContent.vue', () => {
  it('SplitFlow', () => {
    expect(wrapper.findComponent(SplitFlow).exists()).to.be.true;
  })
})
