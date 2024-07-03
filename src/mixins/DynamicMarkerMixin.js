
import markerZoomLevels from "../components/markerZoomLevelsHardCoded.js";
import { mapStores } from 'pinia';
import { useSettingsStore } from '../stores/settings';


// remove duplicates by stringifying the objects
const removeDuplicates = function (arrayOfAnything) {
  if (!arrayOfAnything) return []
  return [...new Set(arrayOfAnything.map((e) => JSON.stringify(e)))].map((e) =>
    JSON.parse(e)
  )
}
  
/* eslint-disable no-alert, no-console */
export default {
  computed: {
    ...mapStores(useSettingsStore),
  },
  methods: {
    flatmapPanZoomCallback: function (payload) {
      if (this.mouseHovered) {
        const result = {
          paneIndex: this.entry.id,
          eventType: "panZoom",
          payload: payload,
          type: this.entry.type,
        };
        this.$emit("resource-selected", result);
      }
    },
        /**
     * Function used for updating the flatmap markers.
     * We set the markers based on what was searched and the flatmap clusters them.
     */
    flatmapMarkerUpdate(flatmap) {
      if (!this.flatmapReady) return;

      let flatmapImp = flatmap;
      if (!flatmapImp)
        flatmapImp = this.getFlatmapImp();

      if (flatmapImp) {
        // Set the dataset markers
        let markers = this.settingsStore.markers;
        markers = removeDuplicates(markers);
        let fmMarkers = this.removeMarkersNotOnFlatmap(flatmapImp, markers);
        flatmapImp.clearMarkers();
        flatmapImp.clearDatasetMarkers();
        flatmapImp.addDatasetMarkers(fmMarkers);

        // Set the featured markers
        if (this.entry.type === "MultiFlatmap") {
          this.restoreFeaturedMarkers(flatmapImp);
        }
      }
    },
    // removeMarkersNotOnFlatmap: rewrites the dataset marker list to only include markers that are on the flatmap
    removeMarkersNotOnFlatmap(flatmapImp, datasets) {

      // dataset markers are in the form [{id: "discoverId", terms: ["term1", "term2"]}, {id:....}]
      let fma = flatmapImp.anatomicalIdentifiers;
      let markersOnFlatmap = []

      // the block below steps through each dataset and checks each term to see if it is in the flatmap
      for (let i = 0; i < datasets.length; i++) {
        let dataset = datasets[i];
        let datasetAdjusted = {id: dataset.id, terms: []};
        for (let j = 0; j < dataset.terms.length; j++) {
          if (fma.includes(dataset.terms[j])) {
            datasetAdjusted.terms.push(dataset.terms[j]);

            
          }
        }
        markersOnFlatmap.push(datasetAdjusted);
      }
      return markersOnFlatmap;
    },
    flatmapReadyForMarkerUpdates: function (flatmap) {
      if (flatmap) {
        flatmap.enablePanZoomEvents(true); // Use zoom events for dynamic markers
        this.flatmapReady = true;
        const flatmapImp = flatmap.mapImp;
        this.flatmapMarkerUpdate(flatmapImp);
      }
    },
  }
}
