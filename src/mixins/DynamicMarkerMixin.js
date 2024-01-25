
import markerZoomLevels from "../components/markerZoomLevelsHardCoded.js";
import { mapStores } from 'pinia';
import { useSettingsStore } from '../stores/settings';


/*
* Function to check markers visibility at the given zoom level.
* I have modified it to make sure the marker is displayed
* if the uberon is not present in the hardcoded zoom-level list.
*/
const checkMarkersAtZoomLevel = (flatmapImp, markers, zoomLevel) => {
  if (markers) {
    markers.forEach(id => {
      let foundInArray = false;
      // First check if uberon is in the list, check for zoom level
      // if true. Note: markerZoomLevels is imported.
      for (let i = 0; i < markerZoomLevels.length; i++) {
        if (markerZoomLevels[i].id === id) {
          foundInArray = true;
          if (zoomLevel >= markerZoomLevels[i].showAtZoom) {
            flatmapImp.addMarker(id, {className: "standard-marker"});
          }
          break;
        }
      }
      // Did not match, add it regardless so we do not lose any
      // markers.
      if (!foundInArray) {
        flatmapImp.addMarker(id, {className: "standard-marker"});
      }
    });
  }
};
  
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
        this.flatmapMarkerZoomUpdate(false, undefined);
        this.$emit("resource-selected", result);
      }
    },
        /**
     * Function used for updating the flatmap markers.
     * It will only update the markers if zoom level has changed or
     * the force flag is true.
     */
    flatmapMarkerZoomUpdate(force, flatmap) {
      if (!this.flatmapReady) return;

      let flatmapImp = flatmap;
      if (!flatmapImp)
        flatmapImp = this.getFlatmapImp();

      if (flatmapImp) {
        let currentZoom = flatmapImp.getZoom()["zoom"];
        if (force || this.zoomLevel !== currentZoom) {
          this.zoomLevel = currentZoom;
          flatmapImp.clearMarkers();
          let markers = this.settingsStore.markers;
          checkMarkersAtZoomLevel(flatmapImp, markers, this.zoomLevel);
          if (this.entry.type === "MultiFlatmap") {
            this.restoreFeaturedMarkers(flatmapImp);
          }
        }
      }
    },
    flatmapReadyForMarkerUpdates: function (flatmap) {
      if (flatmap) {
        flatmap.enablePanZoomEvents(true); // Use zoom events for dynamic markers
        this.flatmapReady = true;
        const flatmapImp = flatmap.mapImp;
        this.flatmapMarkerZoomUpdate(true, flatmapImp);
      }
    },
  }
}
