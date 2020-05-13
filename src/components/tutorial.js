import chariot from '@tehsurfer/chariot-tooltips/release/chariot'
import'@tehsurfer/chariot-tooltips/release/chariot.css'
import'../tutorial.css'



export default function(){
   var char = new chariot({
    mapcore_tutorial: [
        {
            selectors: 'div#find-me',
            tooltip : {
                position: 'centre',
                arrowLength: 0,
                title: 'Trying to view SPARC data?',
                text: 'This quick tutorial will show you how to navigate and view mapped data from the SPARC project'
            }
        },

      {
        selectors: 'div.mapcore-search-field-container',
        tooltip: {
          position: 'left',
          title: 'Looking for a particular dataset?',
          text: 'Search allows you to find curated SPARC data. Try searching for "heart".'
        }
      },
      {
        selectors: 'div#mapcore_search_results_container',
        tooltip: {
          position: 'right',
          title: "Found what you're looking for?",
          text: "Results from the search are displayed here. Click on a card to see an \
          extended description of the data, or hover over an icon to see how you can visualise the data"
        }
      }
    ]
  })
  char.startTutorial('mapcore_tutorial')
}
