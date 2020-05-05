export default [
    {
      target: '.content[data-v-461315d4]',// We're using document.querySelector() under the hood
      header: {
        title: 'Get Started',
      },
      content: `Discover <strong>Vue Tour</strong>!`,

    },
    {
      target: '#find-me-2',
      content: 'An awesome plugin made with Vue.js!'
    },
    {
      target: '.select-box[data-v-b0ad8088]',
      content: 'Try it, you\'ll love it!<br>You can put HTML in the steps and completely customize the DOM to suit your needs.',
      params: {
        placement: 'top' // Any valid Popper.js placement. See https://popper.js.org/popper-documentation.html#Popper.placements
      }
    }
]