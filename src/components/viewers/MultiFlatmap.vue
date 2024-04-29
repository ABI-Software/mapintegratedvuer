<template>
  <MultiFlatmapVuer
    :availableSpecies="availableSpecies"
    @flatmapChanged="flatmapChanged"
    @ready="multiFlatmapReady"
    :state="entry.state"
    @resource-selected="flatmaprResourceSelected(entry.type, $event)"
    style="height: 100%; width: 100%"
    :initial="entry.resource"
    :helpMode="helpMode"
    ref="multiflatmap"
    :displayMinimap="true"
    :showStarInLegend="showStarInLegend"
    :enableOpenMapUI="true"
    :openMapOptions="openMapOptions"
    :flatmapAPI="flatmapAPI"
    :sparcAPI="apiLocation"
    @pan-zoom-callback="flatmapPanZoomCallback"
    @open-map="openMap"
  />
</template>

<script>
/* eslint-disable no-alert, no-console */
import Tagging from '../../services/tagging.js'
import { availableSpecies } from "../scripts/utilities.js";
import { MultiFlatmapVuer } from "@abi-software/flatmapvuer";
import ContentMixin from "../../mixins/ContentMixin";
import EventBus from "../EventBus";
import { getBodyScaffoldInfo } from "../scripts/utilities";
import DyncamicMarkerMixin from "../../mixins/DynamicMarkerMixin";

import "@abi-software/flatmapvuer/dist/style.css";
import YellowStar from "../../icons/yellowstar";

const getOpenMapOptions = (species) => {
  const options = [
    {
      display: "Open AC Map",
      key: "AC"
    },
    {
      display: "Open FC Map",
      key: "FC"
    },
    {
      display: "Open 3D Human Map",
      key: "3D"
    },
  ]
  switch (species) {
    case "Human Male":
    case "Human Female":
    case "Rat":
      options.push({
        display: "Open Sync Map",
        key: "SYNC"
      });
      break;
    default:
      break;
  }
  return options;
}

export default {
  name: "MultiFlatmap",
  mixins: [ContentMixin, DyncamicMarkerMixin],
  components: {
    MultiFlatmapVuer,
  },
  data: function () {
    return {
      zoomLevel: 6,
      flatmapReady: false,
      availableSpecies: availableSpecies(),
      scaffoldResource: { },
      showStarInLegend: false,
      openMapOptions: getOpenMapOptions("Rat"),
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
            this.scaffoldResource["human"] = await getBodyScaffoldInfo(this.apiLocation, "human");
          }
          action = {
            contextCardUrl: this.scaffoldResource["human"].datasetInfo.contextCardUrl,
            discoverId: this.scaffoldResource["human"].datasetInfo.discoverId,
            s3uri: this.scaffoldResource["human"].datasetInfo.s3uri,
            version: this.scaffoldResource["human"].datasetInfo.version,
            label: "Human Body",
            resource: this.scaffoldResource["human"].url,
            title: "View 3D scaffold",
            layout: "2vertpanel",
            type: "SyncMap",
            isBodyScaffold: true,
          };
        }
        if (action)
          EventBus.emit("SyncModeRequest", { flag: true, action: action });
      } else {
        EventBus.emit("SyncModeRequest", { flag: false });
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
        this.flatmapMarkerZoomUpdate(false, undefined);
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
    flatmaprResourceSelected: function (type, resource) {
      const map = this.$refs.multiflatmap.getCurrentFlatmap();
      this.resourceSelected(type, resource, (map.viewingMode === "Exploration"));
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
          this.flatmapMarkerZoomUpdate(false, undefined);
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
        if (results.featureIds.length > 0) {
          if (forceSelect) {
            flatmap.selectFeatures(results.featureIds);
          }
          flatmap.zoomToFeatures(results.featureIds);
        } else {
          flatmap.clearSearchResults();
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
        if (results.featureIds.length > 0) {
          flatmap.zoomToFeatures(results.featureIds, { noZoomIn: true });
          /*
          flatmap.highlightFeatures([
            flatmap.modelForFeature(results.featureIds[0]),
          ]);
          */
        }
      }
    },
    updateProvCard: function() {
      const imp = this.getFlatmapImp();
      if (imp) {
        let provClone = {id: this.entry.id, prov: imp.provenance};
        this.$emit("flatmap-provenance-ready", provClone);
      }
    },
    flatmapChanged: async function (activeSpecies) {
      this.activeSpecies = activeSpecies;
      this.openMapOptions = getOpenMapOptions(activeSpecies);
      this.$emit("species-changed", activeSpecies);
      if (!(this.entry.state && (this.entry.state.species === this.activeSpecies))) {
        if (this.syncMode == true)
          await this.toggleSyncMode();
      }
      this.updateProvCard();

      // GA Tagging
      // Event tracking for maps' species change
      Tagging.sendEvent({
        'event': 'interaction_event',
        'event_name': 'portal_maps_species_change',
        'category': this.activeSpecies
      });
    },
    multiFlatmapReady: function (flatmap) {
      if (flatmap) {
        flatmap.enablePanZoomEvents(true); // Use zoom events for dynamic markers
        this.flatmapReady = true;
        const flatmapImp = flatmap.mapImp;
        this.flatmapMarkerZoomUpdate(true, flatmapImp);
        this.updateProvCard();
      }
    },
    getFlatmapImp: function () {
      if (this.entry.type === "MultiFlatmap" && this.flatmapReady) {
        return this.$refs.multiflatmap.getCurrentFlatmap()["mapImp"];
      } else {
        return undefined;
      }
    },
    flatmapAreaSearch() {
      const flatmapImp = this.getFlatmapImp();
      let shownMarkers = flatmapImp.visibleMarkerAnatomicalIds();
      let returnedAction = {
        type: "Facets",
        label: "Unused",
        val: shownMarkers.map(marker => this.idNamePair[marker]),
      };
      EventBus.emit("PopoverActionClick", returnedAction);
    },
    restoreFeaturedMarkers: function (flatmap) {
      this.settingsStore.resetFeaturedMarkerIdentifier();
      const markers = this.settingsStore.featuredMarkers;
      this.updateFeatureMarkers(markers, flatmap);
    },
    updateFeatureMarkers: function (markers, flatmap) {
      this.showStarInLegend = false; // will show if we have a featured marker
      for (let index = 0; index < markers.length; ++index) {
        if (markers[index]) {
          const markerIdentifier =
            this.settingsStore.featuredMarkerIdentifiers[index];
          if (!markerIdentifier) {
            // Add the featured marker to the legend if we have a featured marker
            const markerExists = this.addFeaturedMarker(markers[index], index, flatmap);
            if (markerExists) {
              this.showStarInLegend = true;
            }
          }
        }
      }
    },
    addFeaturedMarker: function (marker, index, flatmap) {
      const markerSpecies =
        this.settingsStore.featuredMarkerSpecies[index];
      if (markerSpecies && !this.activeSpecies.startsWith(markerSpecies)) {
        return false;
      }
      let flatmapImp = flatmap;
      if (!flatmapImp) {
        flatmapImp = this.getFlatmapImp();
      }

      if (flatmapImp) {
        // create the star marker
        let wrapperElement = document.createElement("div");
        wrapperElement.innerHTML = YellowStar;

        // add it to the flatmap
        const markerIdentifier = flatmapImp.addMarker(marker, {
          element: wrapperElement,
          className: "highlight-marker"
        });

        // update the store with the marker identifier
        this.settingsStore.updateFeaturedMarkerIdentifier({
          index,
          markerIdentifier,
        });
        return true;
      }
      return false;
    },
  },
  computed: {
    facetSpecies() {
      return this.settingsStore.facets.species;
    },
    featuredMarkers() {
      return this.settingsStore.featuredMarkers;
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

      this.updateFeatureMarkers(markers, undefined);
    },
  },
  mounted: function () {
    this.getAvailableTerms();
    this.getFeaturedDatasets();

    EventBus.on("markerUpdate", () => {
      this.flatmapMarkerZoomUpdate(true, undefined);
    });
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">

:deep(.maplibregl-popup) {
  z-index: 3;
}

:deep(.maplibregl-marker) {
  &.standard-marker {
    cursor: pointer !important;
    z-index: 2;
  }
  &.highlight-marker {
    visibility: visible !important;
    cursor: pointer !important;
    z-index: 1;
    div {
      scale: 0.5;
      transform: translate(45px, -7px);
    }
  }
}

</style>

<style src="../../assets/mapicon-species-style.css"></style>