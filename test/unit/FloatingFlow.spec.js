import { shallowMount } from '@vue/test-utils'
import FloatingFlow from '../../src/components/FloatingFlow';
import DialogToolbarContent from '../../src/components/DialogToolbarContent';
import FloatingDialog from '../../src/components/FloatingDialog';

const div = document.createElement('div');
document.body.appendChild(div);
const wrapper = shallowMount(FloatingFlow, {
  attachTo: div});

const data = [
  {
    title: "View 3D scaffold",
    label: "Colon",
    resource: "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/Generic+Scaffold/Colon/human/humanColon_metadata.json",
    type: "Scaffold"
  },
  {
    title: "View control diagram",
    label: "Kember",
    resource: "ABI:1000001",
    type: "Flatmap",
    minZoom: 5,
    pathControls: false,
    datasetTitle: "Kember control diagram",
    datasetUrl: "https://pubmed.ncbi.nlm.nih.gov/28692680/?from_term=Kember+G%5Bau%5D&from_pos=2"
  },
  {
    title: "View plot",
    label: "ICN",
    resource: "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/ISAN/csv-data/use-case-4/RNA_Seq.csv",
    type: "Plot",
    plotType: "heatmap",
    datasetTitle: "Molecular Phenotype Distribution of Single Rat Intracardiac Neurons",
    datasetDescription: "Images collected from serial cryostat sectioning of a cryopreserved heart was used to reconstruct the 3D context. Transcriptional profiles taken from isolated single neurons and mapped back into the previously generated 3D context.",
    datasetUrl: "https://discover.blackfynn.com/datasets/29",
    datasetImage: "https://assets.discover.blackfynn.com/dataset-assets/29/6/revisions/1/banner.jpg"
  },
];

describe('FloatingFlow.vue', () => {
  it('DialogToolbarContent', () => {
    expect(wrapper.findComponent(DialogToolbarContent).exists()).to.be.true;
  }),
  it('dialog-header', () => {
    expect(wrapper.find(".dialog-header").exists()).to.be.true;
  }),
  it('FloatingDialog', () => {
    expect(wrapper.findComponent(FloatingDialog).exists()).to.be.true;
  }),
  it('dialog-main', () => {
    expect(wrapper.find(".dialog-main").exists()).to.be.true;
  }),
  it('createNewEntry', () => {
    expect(wrapper.vm.createNewEntry(data[0])).to.equal(2);
    expect(wrapper.vm.createNewEntry(data[1])).to.equal(3);
    expect(wrapper.vm.createNewEntry(data[2])).to.equal(4);
  }),
  it('actionClick', () => {
    expect(wrapper.vm.actionClick(data[0])).to.be.an('undefined');
  }),
  it('allDialogs', () => {
    expect(wrapper.findAllComponents(FloatingDialog)).to.have.lengthOf(5);
  }),
  it('dialogMaximise', () => {
    expect(wrapper.vm.dialogMaximise(2)).to.be.an('undefined');
    expect(wrapper.vm.dockedArray).to.have.lengthOf(2);
  }),
  it('dockedMaximise', () => {
    expect(wrapper.vm.dockedMaximise()).to.be.an('undefined');
    expect(wrapper.vm.dockedArray).to.have.lengthOf(1);
  }),
  it('dialogMaximise', () => {
    expect(wrapper.vm.dialogMaximise(3)).to.be.an('undefined');
    expect(wrapper.vm.dockedArray).to.have.lengthOf(2);
  }),
  it('dockedMinimise', () => {
    expect(wrapper.vm.dockedMinimise()).to.be.an('undefined');
  }),
  it('dockedTitleClicked', () => {
    expect(wrapper.vm.dockedTitleClicked(3)).to.be.an('undefined');
  }),
  it('dockedClose', () => {
    expect(wrapper.vm.dockedClose()).to.be.an('undefined');
    expect(wrapper.vm.dockedArray).to.have.lengthOf(1);
    expect(wrapper.vm.activeDockedId).to.equal(1);
  }),
  it('dialogClicked', () => {
    expect(wrapper.vm.dialogClicked()).to.be.an('undefined');
  })
})
