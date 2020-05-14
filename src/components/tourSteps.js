export default [
    {
      target: '.el-header.dialog-header',// We're using document.querySelector() under the hood
      header: {
        title: '<strong>Trying to view SPARC data?</strong>',
      },
      content: 'This quick tutorial will show you how to navigate and view mapped data from the SPARC project',

    },
    {
      target: '.el-icon-full-screen',
      content: 'The app works best in <strong>full screen</strong>!',
      params: {
        placement: 'left' 
      }
    },
    {
      target: '.select-box',
      content: 'What <strong>species</strong> are you looking for?',
      params: {
        placement: 'right' 
      }
    },
    {
      target: '#heart',
      content: 'Click the <strong>heart</strong> to see data associated with it',
      params: {
        placement: 'right' 
      }
    },
    {
      target: '.el-main.main',
      content: 'Click the <strong>View 3D scaffold</strong> button to bring up the 3d scaffold of the heart',
      params: {
        placement: 'left' 
      }
    },
    {
      target: '.el-icon-copy-document',
      header: {
        title: 'Window controls',
      },
      content: 'Use these controls to <strong>maximise, hide and close</strong> this window ',
      params: {
        placement: 'left' 
      }
    },
    {
      target: '#scaffold-select-box-2',
      content: 'Select <strong>"ICN"</strong> to show the mapped data',
      params: {
        placement: 'right' 
      }
    },
    {
      target: '#icn',
      content: 'Select the ICN region, shown as <strong>yellow points</strong>, to bring up associated data',
      params: {
        placement: 'right' 
      }
    },
    {
      target: '#rna',
      content: 'This pop up gives details on the data. Click on <strong>View Plot</strong> to explore the data further',
      params: {
        placement: 'right' 
      }
    },
    {
      target: '.plot-container',
      content: 'Explore the data here. Hit finish to reset the app',
      params: {
        placement: 'right' 
      }
    },
]