
import { mapStores } from 'pinia';
import { useSettingsStore } from '../stores/settings';

// remove duplicates by stringifying the objects
const removeDuplicates = function (arrayOfAnything) {
  if (!arrayOfAnything) return []
  return [...new Set(arrayOfAnything.map((e) => JSON.stringify(e)))].map((e) =>
    JSON.parse(e)
  )
}

const getCellTypeSomaLocations = function (somaLocations) {
  return (Array.isArray(somaLocations) ? somaLocations : [])
    .map((location) => ({
      label: String(location?.label || '').trim(),
      curie: String(location?.curie || '').trim(),
      count: Number(location?.count || 0),
    }))
    .filter((location) => location.curie && location.count > 0)
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

      const flatmapImp = flatmap ?? this.getFlatmapImp();

      if (flatmapImp) {
        const displayMarkers = this.settingsStore.globalSettings.displayMarkers;
        const isCellTypeViewingMode = this.settingsStore.globalSettings.viewingMode === "Cell Type";
        const markers = !displayMarkers || isCellTypeViewingMode
          ? []
          : removeDuplicates(this.settingsStore.markers);
        const somaLocations = !displayMarkers || !isCellTypeViewingMode
          ? []
          : getCellTypeSomaLocations(this.settingsStore.cellCardSomaLocations);

        flatmapImp.clearMarkers();
        flatmapImp.clearDatasetMarkers();
        if (typeof flatmapImp.clearSomaLocationMarkers === "function") {
          flatmapImp.clearSomaLocationMarkers();
        }

        if (isCellTypeViewingMode && typeof flatmapImp.addSomaLocationMarkers === "function") {
          flatmapImp.addSomaLocationMarkers(somaLocations);
        } else {
          flatmapImp.addDatasetMarkers(markers);
        }

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
