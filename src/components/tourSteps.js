export default [
    {
      target: '.el-header.dialog-header',// We're using document.querySelector() under the hood
      header: {
        title: 'Trying to view SPARC data?',
      },
      content: 'This quick tutorial will show you how to navigate and view mapped data from the SPARC project',

    },
    {
      target: '.el-icon-full-screen',
      content: 'The app works best in full screen!',
      params: {
        placement: 'left' 
      }
    },
    {
      target: '.select-box',
      content: 'What species are you looking for?',
      params: {
        placement: 'right' 
      }
    },
    {
      target: '#heart',
      content: 'Click the heart to see data associated with it',
      params: {
        placement: 'right' 
      }
    },
    {
      target: '.el-main.main',
      header: {
        title: 'View the 3D heart scaffold',
      },
      content: 'Click the "View 3d scaffold" button to bring up the 3d scaffold of the heart',
      params: {
        placement: 'left' 
      }
    },
    {
      target: '.el-icon-copy-document',
      header: {
        title: 'Window controls',
      },
      content: 'Use these controls to maximise, hide and close this window ',
      params: {
        placement: 'left' 
      }
    },
    {
      target: '[data-v-4b50b8b3]',
      content: 'Select "ICN" to show the mapped data',
      params: {
        placement: 'right' 
      }
    },
    {
      target: '#icn',
      content: 'Select one of the yellow points to bring up associated data',
      params: {
        placement: 'right' 
      }
    },
    {
      target: '#el-popover-470',
      content: 'Click here to bring up a heatmap of the data',
      params: {
        placement: 'left' 
      }
    },
]