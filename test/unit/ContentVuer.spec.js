import { shallowMount } from '@vue/test-utils'
import ContentBar from '../../src/components/ContentBar';
import ContentVuer from '../../src/components/ContentVuer';
import Flatmap from "../../src/components/viewers/Flatmap";
import MultiFlatmap from "../../src/components/viewers/MultiFlatmap";
import Scaffold from "../../src/components/viewers/Scaffold";
import { SideBar } from '@abi-software/map-side-bar';

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
  },
  stubs: {'ContentBar': ContentBar}
});


describe('ContentVuer', () => {
  it('MultiFlatmapVuer', () => {
    expect(wrapper.findComponent(MultiFlatmap).exists()).to.be.true;
  }),
  it('FlatmapVuer', () => {
    expect(wrapper.findComponent(Flatmap).exists()).to.be.false;
  }),
  it('ScaffoldVuer', () => {
    expect(wrapper.findComponent(Scaffold).exists()).to.be.false;
  }),
  it('SideBar', () => {
    expect(wrapper.findComponent(SideBar).exists()).to.be.false;
  })
})
