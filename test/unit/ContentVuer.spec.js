import { shallowMount } from '@vue/test-utils'
import ContentVuer from '../../src/components/ContentVuer';
import SideBar from '../../src/components/SideBar';
import { FlatmapVuer, MultiFlatmapVuer } from '@abi-software/flatmapvuer';
import { ScaffoldVuer } from '@abi-software/scaffoldvuer';

const div = document.createElement('div');
document.body.appendChild(div);
const wrapper = shallowMount(ContentVuer, {
  attachTo: div,
  propsData: {
    entry: {
      "availableSpecies":{"Cat":{"displayWarning":true,"iconClass":"icon-mapicon_cat","taxo":"NCBITaxon:9685"},
      "Human":{"displayWarning":true,"iconClass":"icon-mapicon_human","taxo":"NCBITaxon:9606"},
      "Mouse":{"displayWarning":true,"iconClass":"icon-mapicon_mouse","taxo":"NCBITaxon:10090"},
      "Pig":{"displayWarning":true,"iconClass":"icon-mapicon_pig","taxo":"NCBITaxon:9823"},
      "Rat":{"displayWarning":false,"iconClass":"icon-mapicon_rat","taxo":"NCBITaxon:10114"}},
      "id":1,"mode":"main",
      "resource":"Rat",
      "state":{
        "species":"Rat","state":{
        "entry":"NCBITaxon:10114",
        "viewport":{"center":[-1.588289745831446,-4.569422936609342],"layers":[],"zoom":5.306304273218617}}},
      "type":"MultiFlatmap","zIndex":0
    }
  }
});


describe('ContentVuer', () => {
  it('MultiFlatmapVuer', () => {
    expect(wrapper.findComponent(MultiFlatmapVuer).exists()).to.be.true;
  }),
  it('FlatmapVuer', () => {
    expect(wrapper.findComponent(FlatmapVuer).exists()).to.be.false;
  }),
  it('ScaffoldVuer', () => {
    expect(wrapper.findComponent(ScaffoldVuer).exists()).to.be.false;
  }),
  it('SideBar', () => {
    expect(wrapper.findComponent(SideBar).exists()).to.be.false;
  })
})
