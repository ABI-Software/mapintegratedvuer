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
      target: '#flatmapDisplayArea',
      content: 'What species are you looking for?',
    },
    {
      target: '#middle',
      content: 'select a synapse',
      params: {
        placement: 'right' // Any valid Popper.js placement. See https://popper.js.org/popper-documentation.html#Popper.placements
      }
    },
    {
      target: '[data-v-6e7795b6]',
      header: {
        title: 'Trying viewing the heart in a 3D scaffold',
      },
      content: 'This new window has controls in the header for expanding, docking and closing the window',
      params: {
        placement: 'left' // Any valid Popper.js placement. See https://popper.js.org/popper-documentation.html#Popper.placements
      }
    },
    {
      target: '#middle',
      content: 'Try selecting this point of the heart to view its data',
      params: {
        placement: 'bottom' // Any valid Popper.js placement. See https://popper.js.org/popper-documentation.html#Popper.placements
      }
    },
    
    
    
]