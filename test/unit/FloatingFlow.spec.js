import { shallowMount } from '@vue/test-utils'
import FloatingFlow from '../../src/components/FloatingFlow';
import DialogToolbarContent from '../../src/components/DialogToolbarContent';
import FloatingDialog from '../../src/components/FloatingDialog';
import SideBar from '../../src/components/SideBar';

const testState = {
  "activeDockedId":3,
  "currentCount":3,
  "dockedArray":[
    {"id":1,"title":"Flatmap"},
    {"id":3,"title":"Stomach Scaffold"}
  ],
  "entries":[
    {
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
    },
    {
      "id":2,"label":"Heart","mode":"normal",
      "resource":"https://mapcore-bucket1.s3-us-west-2.amazonaws.com/Generic+Scaffold/Heart/rat/ratHeart_metadata.json","state":{"url":"https://mapcore-bucket1.s3-us-west-2.amazonaws.com/Generic+Scaffold/Heart/rat/ratHeart_metadata.json",
      "viewport":{"eyePosition":[-28.577901783471873,10.67032586821228,19.394740246822778],"farPlane":95.21289155481732,"nearPlane":1.9384671731808958,"targetPosition":[0.0422978401184082,-1.384324312210083,-3.813697338104248],
      "upVector":[0.5931745372554665,-0.12336185636170381,0.7955664962363339]}},
      "title":"View 3D scaffold","type":"Scaffold","zIndex":4
    },
    {
      "id":3,"label":"Stomach","mode":"maximised",
      "resource":"https://mapcore-bucket1.s3-us-west-2.amazonaws.com/Generic+Scaffold/Stomach/rat/ratStomach_metadata.json",
      "state":{"url":"https://mapcore-bucket1.s3-us-west-2.amazonaws.com/Generic+Scaffold/Stomach/rat/ratStomach_metadata.json",
      "viewport":{"eyePosition":[-13.488481259165301,-66.35447897586697,18.370723175779926],"farPlane":172.86934980256643,
      "nearPlane":3.5194977735601167,"targetPosition":[0.2898273468017578,0.17322444915771484,-0.040380001068115234],
      "upVector":[0.17240674948127266,0.22939751017853022,0.9579418929403775]}},
      "title":"View 3D scaffold","type":"Scaffold","zIndex":1
    }
  ],
  "mainTabName":"Flatmap","search":"","showDialogIcons":false,"sideBarVisibility":false,"zIndex":4
};

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
  it('SideBar', () => {
    expect(wrapper.findComponent(SideBar).exists()).to.be.true;
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
  }),
  it('setState', () => {
    expect(wrapper.vm.setState(testState)).to.be.an('undefined');
    expect(wrapper.vm.dockedArray).to.have.lengthOf(2);
  })
})
