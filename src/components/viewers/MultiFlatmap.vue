<template>
  <div class="viewer-container">
    <MultiFlatmapVuer
      :availableSpecies="availableSpecies"
      @context-restored="contextRestored"
      @flatmapChanged="flatmapChanged"
      @ready="multiFlatmapReady"
      :state="entry.state"
      :mapManager="mapManager"
      @resource-selected="flatmapResourceSelected(entry.type, $event)"
      style="height: 100%; width: 100%"
      :initial="entry.resource"
      :helpMode="helpMode"
      :helpModeActiveItem="helpModeActiveItem"
      :helpModeDialog="useHelpModeDialog"
      @help-mode-last-item="onHelpModeLastItem"
      @shown-tooltip="onTooltipShown"
      @shown-map-tooltip="onMapTooltipShown"
      @annotation-open="onAnnotationOpen"
      @annotation-close="onAnnotationClose"
      @update-offline-annotation-enabled="updateOfflineAnnotationEnabled"
      :annotationSidebar="annotationSidebar"
      @connectivity-info-open="onConnectivityInfoOpen"
      @connectivity-error="onConnectivityError"
      @connectivity-info-close="onConnectivityInfoClose"
      @neuron-connection-feature-click="onNeuronConnectionFeatureClick"
      :connectivityInfoSidebar="connectivityInfoSidebar"
      ref="multiflatmap"
      :displayMinimap="displayMinimap"
      :showStarInLegend="showStarInLegend"
      :enableOpenMapUI="true"
      :openMapOptions="openMapOptions"
      :flatmapAPI="flatmapAPI"
      :render="visible"
      :sparcAPI="apiLocation"
      :showLocalSettings="showLocalSettings"
      :showOpenMapButton="showOpenMapButton"
      @pan-zoom-callback="flatmapPanZoomCallback"
      @open-map="openMap"
      @finish-help-mode="endHelp"
      @pathway-selection-changed="onPathwaySelectionChanged"
      @open-pubmed-url="onOpenPubmedUrl"
      @mapmanager-loaded="onMapmanagerLoaded"
      :showPathwayFilter="false"
      @trackEvent="trackEvent"
    />

    <HelpModeDialog
      v-if="helpMode && useHelpModeDialog"
      ref="multiflatmapHelp"
      :multiflatmapRef="multiflatmapRef"
      :lastItem="helpModeLastItem"
      @show-next="onHelpModeShowNext"
      @finish-help-mode="onFinishHelpMode"
    />
  </div>
</template>

<script>
/* eslint-disable no-alert, no-console */
import Tagging from '../../services/tagging.js';
import ContentMixin from "../../mixins/ContentMixin";
import EventBus from "../EventBus";
import {
  availableSpecies,
  defaultSpecies,
} from "../scripts/utilities";
import DyncamicMarkerMixin from "../../mixins/DynamicMarkerMixin";

import YellowStar from "../../icons/yellowstar";

import { MultiFlatmapVuer } from "@abi-software/flatmapvuer";
import "@abi-software/flatmapvuer/dist/style.css";
import { HelpModeDialog } from '@abi-software/map-utilities'
import '@abi-software/map-utilities/dist/style.css'

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
  return options;
}

export default {
  name: "MultiFlatmap",
  mixins: [ContentMixin, DyncamicMarkerMixin],
  components: {
    MultiFlatmapVuer,
    HelpModeDialog,
  },
  data: function () {
    return {
      availableSpecies: availableSpecies(),
      flatmapReady: false,
      scaffoldResource: { },
      showStarInLegend: false,
      speciesHasChanged: false,
      openMapOptions: getOpenMapOptions(defaultSpecies),
      zoomLevel: 6,
    }
  },
  methods: {
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
        this.$emit("resource-selected", result);
      }
    },
    /**
     * Perform a local search on this contentvuer
     */
    search: function (term) {
      const flatmap = this.$refs.multiflatmap.getCurrentFlatmap();
      //First search and show the result
      return flatmap.searchAndShowResult(term, true, true);
    },
    /**
     * Append the list of suggested terms to suggestions
     */
    searchSuggestions: function (term, suggestions) {
      const flatmap = this.$refs.multiflatmap.getCurrentFlatmap();
      if (term && flatmap.mapImp) {
        const results = flatmap.mapImp.search(term);
        const featureIds = results.__featureIds || results.featureIds;
        featureIds.forEach(id => {
          const annotation = flatmap.mapImp.annotation(id);
          if (annotation && annotation.label)
            suggestions.push(annotation.label);
        });
      }
    },
    onPathwaySelectionChanged: function (data) {
      const { label, property, checked, selectionsTitle } = data;
      // GA Tagging
      // Event tracking for maps' pathway selection change
      Tagging.sendEvent({
        'event': 'interaction_event',
        'event_name': 'portal_maps_pathway_change',
        'category': label + ' [' + property + '] ' + checked,
        'location': selectionsTitle
      });
    },
    onSidebarAnnotationClose: function() {
      if (this.flatmapReady) {
        const currentFlatmap = this.$refs.multiflatmap.getCurrentFlatmap();
        currentFlatmap.annotationEventCallback({}, { type: 'aborted' })
      }
    },
    onOpenPubmedUrl: function (url) {
      // GA Tagging
      // Event tracking for open pubmed url from popup
      Tagging.sendEvent({
        'event': 'interaction_event',
        'event_name': 'portal_maps_pubmed_url',
        'file_path': url,
        'location': 'map_popup_button',
      });
    },
    zoomToFeatures: function (info, forceSelect) {
      let name = info.name;
      const flatmap = this.getFlatmapImp();
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
    updateProvCard: function() {
      const imp = this.getFlatmapImp();
      if (imp) {
        let provClone = {id: this.entry.id, prov: imp.mapMetadata};
        EventBus.emit("mapImpProv", provClone);
        this.$emit("flatmap-provenance-ready", provClone);
      }
    },
    contextRestored: function(flatmap) {
      if (flatmap) {
        this.flatmapMarkerUpdate(flatmap.mapImp);
        this.updateViewerSettings();
        if (this.speciesHasChanged) {
          this.speciesHasChanged = false;
          this.$emit("species-changed", this.activeSpecies);
        }
      }
    },
    flatmapChanged: async function (activeSpecies) {
      this.activeSpecies = activeSpecies;
      this.openMapOptions = getOpenMapOptions(activeSpecies);
      const flatmapImp = this.getFlatmapImp();
      this.updateProvCard();
      //If the viewer is loading a new map, flatmapImp is not defined here yet.
      //The following will be handled by multiFlatmapReady instead
      if (flatmapImp) {
        if (!flatmapImp.contextLost) {
          this.flatmapMarkerUpdate(flatmapImp);
          this.updateViewerSettings();
          this.speciesHasChanged = false;
          this.$emit("species-changed", activeSpecies);
        } else {
          this.speciesHasChanged = true;
        }
      }



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
        this.flatmapMarkerUpdate(flatmapImp);
        this.updateProvCard();
        this.updateViewerSettings();
        // Wait for flatmap's connectivity to load before emitting mapLoaded
        this.loadConnectivityExplorerConfig(flatmap).then(() => {
          EventBus.emit("mapLoaded", flatmap);
        });
      }
    },
    getFlatmapImp: function () {
      if (this.entry.type === "MultiFlatmap" && this.flatmapReady && this.$refs.multiflatmap) {
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
      this.updateFeaturedMarkers(markers, flatmap);
    },
    // updateFeaturedMarkers will step through the featured markers and add them to the map
    updateFeaturedMarkers: function (markers, flatmap) {
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
    // addFeaturedMarker: add a featured marker to the map at the specified uberon location
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
          className: "highlight-marker",
          cluster: false
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
    /**
     * Change the view mode of the current flatmap
     */
    changeViewingMode: function (modeName) {
      const flatmap = this.$refs.multiflatmap.getCurrentFlatmap();
      flatmap.changeViewingMode(modeName);
    },
    showConnectivity: function (payload) {
      if (this?.alive && this.flatmapReady && this.$refs.multiflatmap) {
        const { featureIds, offset } = payload;
        const currentFlatmap = this.$refs.multiflatmap.getCurrentFlatmap();
        if (currentFlatmap) {
          currentFlatmap.moveMap(featureIds, {
            offsetX: offset ? -150 : 0,
            zoom: 4,
          });
        }
      }
    },
    showConnectivityTooltips: function (payload) {
      if (this?.alive && this.flatmapReady) {
        const flatmap = this.$refs.multiflatmap.getCurrentFlatmap();
        flatmap.showConnectivityTooltips(payload);
      }
    },
    showConnectivitiesByReference: function (payload) {
      if (this?.alive && this.flatmapReady && this.$refs.multiflatmap) {
        const currentFlatmap = this.$refs.multiflatmap.getCurrentFlatmap();
        if (currentFlatmap) {
          currentFlatmap.showConnectivitiesByReference(payload);
        }
      }
    },
    changeConnectivitySource: function (payload, ongoingSource) {
      if (this?.alive && this.flatmapReady) {
        const flatmap = this.$refs.multiflatmap.getCurrentFlatmap();
        const flatmapUUID = flatmap.mapImp.mapMetadata.uuid;
        if (!ongoingSource.includes(flatmapUUID)) {
          ongoingSource.push(flatmapUUID);
          flatmap.changeConnectivitySource(payload);
        }
      }
    },
    updateViewerSettings: function () {
      const {
        backgroundDisplay,
        viewingMode,
        flightPathDisplay,
        organsDisplay,
        outlinesDisplay,
        connectionType,
      } = this.settingsStore.globalSettings;

      if (this.flatmapReady) {
        const currentFlatmap = this.$refs.multiflatmap.getCurrentFlatmap();

        currentFlatmap.changeViewingMode(viewingMode);
        currentFlatmap.setFlightPath3D(flightPathDisplay);
        currentFlatmap.setColour(organsDisplay);
        currentFlatmap.setOutlines(outlinesDisplay);
        currentFlatmap.backgroundChangeCallback(backgroundDisplay);
        currentFlatmap.setConnectionType(connectionType);
      }
    },
    setVisibilityFilter: function (payload) {
      if (this?.alive && this.flatmapReady && this.$refs.multiflatmap) {
        const currentFlatmap = this.$refs.multiflatmap.getCurrentFlatmap();
        if (currentFlatmap) {
          currentFlatmap.setVisibilityFilter(payload);
        }
      }
    },
    getKnowledgeTooltip: async function (payload) {
      if (this?.alive && this.flatmapReady) {
        // This is for expanding connectivity card
        // The length of payload.data should always be 1
        const data = payload.data[0];
        const flatmap = this.$refs.multiflatmap.getCurrentFlatmap();
        flatmap.searchAndShowResult(data.id, true, false);
      }
    },
  },
  computed: {
    facetSpecies() {
      return this.settingsStore.facets.species;
    },
    featuredMarkers() {
      return this.settingsStore.featuredMarkers;
    },
    displayMinimap() {
      return this.settingsStore.displayMinimap;
    },
  },
  watch: {
    featuredMarkers: function (markers) {
      if (!this.flatmapReady) {
        return;
      }

      this.updateFeaturedMarkers(markers, undefined);
    },
  },
  mounted: function () {
    this.getFeaturedDatasets();
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">

.viewer-container {
  width: 100%;
  height: 100%;
}

:deep(.maplibregl-popup) {
  z-index: 11;
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
      width: 0;
    }
  }
}

</style>

<style src="../../assets/mapicon-species-style.css"></style>