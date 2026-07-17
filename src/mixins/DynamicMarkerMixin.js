
import { mapStores } from 'pinia';
import { useSettingsStore } from '../stores/settings';
import { retrieveProtocolData } from '../services/testData.js';
import { markRaw } from 'vue'

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
  data: function () {
    return {
      protocolData: undefined,
      markerToUberonID: {},
    }
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
      if (!this.protocolData) {
        let flatmapImp = flatmap;
        if (!flatmapImp)
          flatmapImp = this.getFlatmapImp();

        if (flatmapImp) {
          // Set the dataset markers
          let markers = this.settingsStore.globalSettings.displayMarkers ? this.settingsStore.markers : [];
          markers = removeDuplicates(markers);
          flatmapImp.clearMarkers();
          flatmapImp.clearClusteredAnatomicalMarkers();
          flatmapImp.addClusteredAnatomicalMarkers(markers);

          // Set the featured markers
          if (this.entry.type === "MultiFlatmap") {
            this.restoreFeaturedMarkers(flatmapImp);
          }
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
    flatmapReadyForMarkerUpdates: async function (flatmap) {
      if (flatmap) {
        flatmap.enablePanZoomEvents(true); // Use zoom events for dynamic markers
        this.flatmapReady = true;
        const flatmapImp = flatmap.mapImp;
        if (flatmapImp) {
          const flatmapUUID = flatmapImp.mapMetadata.uuid;
          this.protocolData = markRaw(await retrieveProtocolData(this.settingsStore.testDataLocation, flatmapUUID));
          if (!this.protocolData) {
            this.flatmapMarkerUpdate(flatmapImp);
          }
        }
      }
    },
  }
}
