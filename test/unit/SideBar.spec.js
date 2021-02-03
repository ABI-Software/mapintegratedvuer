import { shallowMount } from '@vue/test-utils'
import SideBar from '../../src/components/SideBar';
import SearchFilters from '../../src/components/SearchFilters';

const div = document.createElement('div');
document.body.appendChild(div);
const wrapper = shallowMount(SideBar, {
  attachTo: div,
});

describe('SideBar', () => {
  it('SearchFilters', () => {
    expect(wrapper.findComponent(SearchFilters).exists()).to.be.true;
  })
})
