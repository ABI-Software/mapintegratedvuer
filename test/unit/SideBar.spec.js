import { shallowMount } from '@vue/test-utils'
import SideBar from '../../src/components/SideBar';
import SearchFilters from '../../src/components/SearchFilters';
import DatasetCard from '../../src/components/DatasetCard';

const div = document.createElement('div');
document.body.appendChild(div);
const wrapper = shallowMount(SideBar, {
  attachTo: div,
});

describe('SideBar', () => {
  it('SearchFilters', () => {
    expect(wrapper.findComponent(SearchFilters).exists()).to.be.true;
  }),
  it('DatasetCard', () => {
    expect(wrapper.findComponent(DatasetCard).exists()).to.be.false;
  })
})
