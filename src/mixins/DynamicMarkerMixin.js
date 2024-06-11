
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
        flatmapImp.clearMarkers();
        flatmapImp.clearDatasetMarkers();
        flatmapImp.addDatasetMarkers(markers);
      
        // Set the hovered markers
        let hoveredMarkers = this.settingsStore.hoveredMarkers
        let previousHoveredMarkers = this.settingsStore.previousHoveredMarkers
        hoveredMarkers.forEach(id => {
          let markerClass = "standard-marker" + " hovered" // Space-separated CSS class names
          let markerCluster = false // Disable cluster when related dataset is hovered
          flatmapImp.addMarker(id, { className: markerClass, cluster: markerCluster })
        })
        if (previousHoveredMarkers !== null && previousHoveredMarkers.length >= 0) {
          previousHoveredMarkers.forEach(id => {
            let markerClass = "standard-marker"
            let markerCluster = true
            flatmapImp.addMarker(id, { className: markerClass, cluster: markerCluster })
          })
        } 

        // Set the featured markers
        if (this.entry.type === "MultiFlatmap") {
          this.restoreFeaturedMarkers(flatmapImp);
        }
      }
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
