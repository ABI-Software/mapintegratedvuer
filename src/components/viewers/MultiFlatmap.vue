<template>
  <MultiFlatmapVuer
    :availableSpecies="availableSpecies"
    @flatmapChanged="flatmapChanged"
    @ready="multiFlatmapReady"
    :state="entry.state"
    @resource-selected="resourceSelected(entry.type, $event)"
    style="height: 100%; width: 100%"
    :initial="entry.resource"
    :helpMode="helpMode"
    ref="multiflatmap"
    :displayMinimap="false"
    :flatmapAPI="flatmapAPI"
    @pan-zoom-callback="flatmapPanZoomCallback"
  />
</template>

<script>
/* eslint-disable no-alert, no-console */
import { availableSpecies } from "../scripts/utilities.js";
import { MultiFlatmapVuer } from "@abi-software/flatmapvuer/src/components/index.js";
import ContentMixin from "../../mixins/ContentMixin";
import EventBus from "../EventBus";
import store from "../../store";
import markerZoomLevels from "../markerZoomLevels";
import { getBodyScaffold } from "../scripts/utilities";

import YellowStar from "../../icons/yellowstar";

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
            flatmapImp.addMarker(id);
          }
          break;
        }
      }
      // Did not match, add it regardless so we do not lose any
      // markers.
      if (!foundInArray) flatmapImp.addMarker(id);
    });
  }
};

export default {
  name: "MultiFlatmap",
  mixins: [ContentMixin],
  components: {
    MultiFlatmapVuer,
  },
  data: function () {
    return {
      zoomLevel: 6,
      flatmapReady: false,
      availableSpecies: availableSpecies(),
      scaffoldResource: { },
    }
  },
  methods: {
    /**
     * Toggle sync mode on/off depending on species and current state
     */
    toggleSyncMode: async function () {
      if (this.syncMode == false) {
        let action = undefined;
        if (this.activeSpecies === "Rat") {
          action = {
            contextCard: undefined,
            discoverId: undefined,
            label: "Rat Body",
            resource: "https://mapcore-bucket1.s3.us-west-2.amazonaws.com/WholeBody/31-May-2021/ratBody/ratBody_syncmap_metadata.json",
            title: "View 3D scaffold",
            layout: "2horpanel",
            type: "SyncMap",
          };
        } else if ((this.activeSpecies === "Human Male") || (this.activeSpecies === "Human Female")) {
          //Dynamically construct the whole body scaffold for human and store it
          if (!("human" in this.scaffoldResource)) {
            this.scaffoldResource["human"] = await getBodyScaffold(store.state.settings.sparcApi, "human");
          }
          action = {
            contextCard: undefined,
            discoverId: undefined,
            label: "Human Body",
            resource: this.scaffoldResource["human"],
            title: "View 3D scaffold",
            layout: "2vertpanel",
            type: "SyncMap",
            isBodyScaffold: true,
          };
        }
        if (action)
          EventBus.$emit("SyncModeRequest", { flag: true, action: action });
      } else {
        EventBus.$emit("SyncModeRequest", { flag: false });
      }
    },
    getState: function () {
      if (this.flatmapReady) return this.$refs.multiflatmap.getState();
      else return undefined;
    },
    flatmapPanZoomCallback: function (payload) {
      if (this.mouseHovered) {
        const result = {
          paneIndex: this.entry.id,
          eventType: "panZoom",
          payload: payload,
          type: this.entry.type,
        };
        this.flatmapMarkerZoomUpdate(false);
        this.$emit("resource-selected", result);
      }
    },
    /**
     * Perform a local search on this contentvuer
     */
    search: function (term) {
      const flatmap = this.$refs.multiflatmap.getCurrentFlatmap();
      //First search and show the result
      return flatmap.searchAndShowResult(term, true);
    },
    /**
     * Append the list of suggested terms to suggestions
     */
    searchSuggestions: function (term, suggestions) {
      const flatmap = this.$refs.multiflatmap.getCurrentFlatmap();
      if (term && flatmap.mapImp) {
        const results = flatmap.mapImp.search(term);
        results.__featureIds.forEach(id => {
          const annotation = flatmap.mapImp.annotation(id);
          if (annotation && annotation.label)
            suggestions.push(annotation.label);
        });
      }
    },
    /**
     * Handle sync pan zoom event
     */
    handleSyncPanZoomEvent: function (data) {
      //Prevent recursive callback
      if (!this.mouseHovered) {
        if (data.type !== this.entry.type) {
          const zoom = data.payload.zoom;
          const center = data.payload.target;
          const height = this.$el.clientHeight;
          const width = this.$el.clientWidth;
          const max = Math.max(width, height);
          let sW = width / max / zoom;
          const sH = height / max / zoom;
          const origin = [
            center[0] / 2 + 0.5 - sW / 2,
            0.5 - center[1] / 2 - sH / 2,
          ];
          this.$refs.multiflatmap
            .getCurrentFlatmap()
            .mapImp.panZoomTo(origin, [sW, sH]);
          this.flatmapMarkerZoomUpdate(false);
        }
      }
    },
    displayTooltip: function (info) {
      if (info) {
        let name = info.name;
        if (name) {
          this.search(name);
        } else {
          const flatmap = this.$refs.multiflatmap.getCurrentFlatmap();
          flatmap.mapImp.clearSearchResults();
        }
      }
    },
    zoomToFeatures: function (info, forceSelect) {
      let name = info.name;
      const flatmap = this.$refs.multiflatmap.getCurrentFlatmap().mapImp;
      if (name) {
        const results = flatmap.search(name);
        if (results.featureIds.length) {
          let externalId = flatmap.modelForFeature(results.featureIds[0]);
          if (externalId) {
            if (forceSelect) {
              flatmap.selectFeatures(externalId);
            }
            flatmap.zoomToFeatures(externalId);
          } else flatmap.clearSearchResults();
        }
      } else {
        flatmap.clearSearchResults();
      }
    },
    highlightFeatures: function (info) {
      let name = info.name;
      const flatmap = this.$refs.multiflatmap.getCurrentFlatmap().mapImp;
      if (name) {
        const results = flatmap.search(name);
        if (results.featureIds[0]) {
          flatmap.highlightFeatures([
            flatmap.modelForFeature(results.featureIds[0]),
          ]);
        }
      }
    },
    flatmapChanged: async function (activeSpecies) {
      this.activeSpecies = activeSpecies;
      this.$emit("species-changed", activeSpecies);
      if (!(this.entry.state && (this.entry.state.species === this.activeSpecies))) {
        if (this.syncMode == true)
          await this.toggleSyncMode();
      }
    },
    multiFlatmapReady: function () {
      this.$refs.multiflatmap.getCurrentFlatmap().enablePanZoomEvents(true); // Use zoom events for dynamic markers
      this.flatmapReady = true;
      this.flatmapMarkerZoomUpdate(true);
    },
    /**
     * Function used for updating the flatmap markers.
     * It will only update the markers if zoom level has changed or
     * the force flag is true.
     */
    flatmapMarkerZoomUpdate(force) {
      if (!this.flatmapReady) return;
      let flatmapImp = this.getFlatmapImp();
      let currentZoom = flatmapImp.getZoom()["zoom"];
      if (force || this.zoomLevel !== currentZoom) {
        this.zoomLevel = currentZoom;
        flatmapImp.clearMarkers();
        let markers = store.state.settings.markers;
        checkMarkersAtZoomLevel(flatmapImp, markers, this.zoomLevel);
        this.restoreFeaturedMarkers();
      }
    },
    getFlatmapImp: function () {
      if (this.entry.type === "Flatmap") {
        return this.$refs.flatmap.mapImp;
      } else if (this.entry.type === "MultiFlatmap") {
        return this.$refs.multiflatmap.getCurrentFlatmap()["mapImp"];
      } else {
        return undefined;
      }
    },
    flatmapAreaSearch() {
      this.flatmapImp = this.getFlatmapImp();
      let shownMarkers = this.flatmapImp.visibleMarkerAnatomicalIds();
      let returnedAction = {
        type: "Facets",
        label: "Unused",
        val: shownMarkers.map(marker => this.idNamePair[marker]),
      };
      EventBus.$emit("PopoverActionClick", returnedAction);
    },
    restoreFeaturedMarkers: function () {
      store.commit("settings/resetFeaturedMarkerIdentifier");
      const markers = store.state.settings.featuredMarkers;
      this.updateFeatureMarkers(markers);
    },
    updateFeatureMarkers: function (markers) {
      for (let index = 0; index < markers.length; ++index) {
        if (markers[index]) {
          const markerIdentifier =
            store.state.settings.featuredMarkerIdentifiers[index];
          if (!markerIdentifier) {
            this.addFeaturedMarker(markers[index], index);
          }
        }
      }
    },
    addFeaturedMarker: function (marker, index) {
      const markerSpecies =
        store.getters["settings/featuredMarkerSpecies"](index);
      if (markerSpecies && !this.activeSpecies.startsWith(markerSpecies)) {
        return;
      }

      const flatmapImp = this.getFlatmapImp();

      let wrapperElement = document.createElement("div");
      wrapperElement.innerHTML = YellowStar;

      const markerIdentifier = flatmapImp.addMarker(marker, {
        element: wrapperElement,
      });
      store.commit("settings/updateFeaturedMarkerIdentifier", {
        index,
        markerIdentifier,
      });
    },
  },
  computed: {
    facetSpecies() {
      return store.state.settings.facets.species;
    },
    featuredMarkers() {
      return store.state.settings.featuredMarkers;
    },
  },
  watch: {
    syncMode: function (val) {
      if (this.$refs.multiflatmap.getCurrentFlatmap())
        this.$refs.multiflatmap.getCurrentFlatmap().enablePanZoomEvents(val);
    },
    featuredMarkers: function (markers) {
      if (!this.flatmapReady) {
        return;
      }

      this.updateFeatureMarkers(markers);
    },
  },
  mounted: function () {
    this.getAvailableTerms();
    this.getFeaturedDatasets();

    EventBus.$on("markerUpdate", () => {
      this.flatmapMarkerZoomUpdate(true);
    });
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import "~element-ui/packages/theme-chalk/src/button";
</style>

<style src="@/../assets/mapicon-species-style.css"></style>
