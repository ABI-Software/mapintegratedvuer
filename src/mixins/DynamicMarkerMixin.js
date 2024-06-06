
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
        let markers = this.settingsStore.markers;
        markers = removeDuplicates(markers);
        flatmapImp.clearMarkers();
        flatmapImp.addDatasetMarkers(markers);
      }

      // commented out until we can add styles to the markers
      // if (flatmapImp) {
      //   let markers = this.settingsStore.markers;
      //   let hoveredMarkers = this.settingsStore.hoveredMarkers
      //   markers = removeDuplicates(markers);
      //   hoveredMarkers = removeDuplicates(hoveredMarkers);
      //   flatmapImp.clearMarkers();
      //   markers.forEach(id => {
      //     let markerClass = "standard-marker"
      //     let markerCluster = true
      //     if (hoveredMarkers.includes(id)) {
      //       markerClass += " hovered" // Space-separated CSS class names
      //       markerCluster = false // Disable cluster when related dataset is hovered
      //     }
      //     flatmapImp.addMarker(id, { className: markerClass, cluster: markerCluster })
      //   })
      //   if (this.entry.type === "MultiFlatmap") {
      //     this.restoreFeaturedMarkers(flatmapImp);
      //   }
      // }
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
