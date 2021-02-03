import { shallowMount } from '@vue/test-utils'
import FloatingDialog from '../../src/components/FloatingDialog';
import ContentVuer from '../../src/components/ContentVuer';

const div = document.createElement('div');
document.body.appendChild(div);
const wrapper = shallowMount(FloatingDialog, {
  attachTo: div,
  propsData: {
    entry: {
      "id":2,"label":"Heart","mode":"normal",
      "resource":"https://mapcore-bucket1.s3-us-west-2.amazonaws.com/Generic+Scaffold/Heart/rat/ratHeart_metadata.json","state":{"url":"https://mapcore-bucket1.s3-us-west-2.amazonaws.com/Generic+Scaffold/Heart/rat/ratHeart_metadata.json",
      "viewport":{"eyePosition":[-28.577901783471873,10.67032586821228,19.394740246822778],"farPlane":95.21289155481732,"nearPlane":1.9384671731808958,"targetPosition":[0.0422978401184082,-1.384324312210083,-3.813697338104248],
      "upVector":[0.5931745372554665,-0.12336185636170381,0.7955664962363339]}},
      "title":"View 3D scaffold","type":"Scaffold","zIndex":4
    },
  },
  showHeader: true,
  index: 1
});


describe('FloatingDialog', () => {
  it('ContentVuer', () => {
    expect(wrapper.findComponent(ContentVuer).exists()).to.be.true;
  })
})
