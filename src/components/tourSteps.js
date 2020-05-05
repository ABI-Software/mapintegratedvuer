export default [
    {
      target: '.content[data-v-461315d4]',// We're using document.querySelector() under the hood
      header: {
        title: 'Trying to view SPARC data?',
      },
      content: 'This quick tutorial will show you how to navigate and view mapped data from the SPARC project',

    },
    {
      target: '.select-box[data-v-b0ad8088]',
      content: 'What species are you looking for?',
      params: {
        placement: 'right' // Any valid Popper.js placement. See https://popper.js.org/popper-documentation.html#Popper.placements
      }
    },
    {
      target: '#heart',
      content: 'Click the heart to see data associated with it',
      params: {
        placement: 'right' // Any valid Popper.js placement. See https://popper.js.org/popper-documentation.html#Popper.placements
      }
    },
    {
      target: '[data-v-6e7795b6]',
      header: {
        title: 'View the 3D heart scaffold',
      },
      content: 'Click the "View 3d scaffold" button to bring up the 3d scaffold of the heart',
      params: {
        placement: 'left' // Any valid Popper.js placement. See https://popper.js.org/popper-documentation.html#Popper.placements
      }
    },
    {
      target: '.el-icon-copy-document',
      header: {
        title: 'Window controls',
      },
      content: 'Use these controls to maximise, hide and close this window ',
      params: {
        placement: 'left' // Any valid Popper.js placement. See https://popper.js.org/popper-documentation.html#Popper.placements
      }
    },
    {
      target: '[data-v-4b50b8b3]',
      content: 'Select "ICN" to show the mapped data',
      params: {
        placement: 'right' // Any valid Popper.js placement. See https://popper.js.org/popper-documentation.html#Popper.placements
      }
    },
    {
      target: '#icn',
      content: 'Select one of the yellow points to bring up associated data',
      params: {
        placement: 'right' // Any valid Popper.js placement. See https://popper.js.org/popper-documentation.html#Popper.placements
      }
    },
    {
      target: '#el-popover-470',
      content: 'Click here to bring up a heatmap of the data',
      params: {
        placement: 'left' // Any valid Popper.js placement. See https://popper.js.org/popper-documentation.html#Popper.placements
      }
    },
]