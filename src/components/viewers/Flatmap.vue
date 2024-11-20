<template>
  <div class="viewer-container">
    <FlatmapVuer
      :state="entry.state"
      :entry="entry.resource"
      @resource-selected="flatmaprResourceSelected(entry.type, $event)"
      @pan-zoom-callback="flatmapPanZoomCallback"
      :name="entry.resource"
      style="height: 100%; width: 100%"
      :minZoom="entry.minZoom"
      :helpMode="helpMode"
      :helpModeActiveItem="helpModeActiveItem"
      :helpModeInitialIndex="-1"
      :helpModeDialog="useHelpModeDialog"
      @help-mode-last-item="onHelpModeLastItem"
      @shown-tooltip="onTooltipShown"
      @shown-map-tooltip="onMapTooltipShown"
      @connectivity-info-open="onConnectivityInfoOpen"
      @connectivity-info-close="onConnectivityInfoClose"
      :connectivityInfoSidebar="connectivityInfoSidebar"
      :pathControls="true"
      ref="flatmap"
      @ready="flatmapReadyCall"
      :displayMinimap="false"
      :displayWarning="true"
      :enableOpenMapUI="true"
      :flatmapAPI="flatmapAPI"
      :sparcAPI="apiLocation"
      @open-map="openMap"
      @pathway-selection-changed="onPathwaySelectionChanged"
    />

    <HelpModeDialog
      v-if="helpMode && useHelpModeDialog"
      ref="flatmapHelp"
      :flatmapRef="flatmapRef"
      :lastItem="helpModeLastItem"
      @show-next="onHelpModeShowNext"
      @finish-help-mode="onFinishHelpMode"
    />
  </div>
</template>

<script>
/* eslint-disable no-alert, no-console */
import Tagging from '../../services/tagging.js';
import EventBus from "../EventBus";
import ContentMixin from "../../mixins/ContentMixin";
import DynamicMarkerMixin from "../../mixins/DynamicMarkerMixin";
import { transformObjToString } from '../scripts/utilities';

import { FlatmapVuer } from "@abi-software/flatmapvuer";
import "@abi-software/flatmapvuer/dist/style.css";
import { HelpModeDialog } from '@abi-software/map-utilities'
import '@abi-software/map-utilities/dist/style.css'

export default {
  name: "Flatmap",
  mixins: [ ContentMixin, DynamicMarkerMixin ],
  components: {
    FlatmapVuer,
    HelpModeDialog,
  },
  methods: {
    getState: function () {
      return this.$refs.flatmap.getState();
    },
    /**
     * Perform a local search on this contentvuer
     */
    search: function (term) {
      return this.$refs.flatmap.searchAndShowResult(term);
    },
    getFlatmapImp() {
      return this.$refs.flatmap?.mapImp;
    },
    flatmaprResourceSelected: function (type, resource) {
      this.resourceSelected(type, resource);

      if (resource.eventType === 'click' && resource.feature.type === 'feature') {
        const eventData = {
          label: resource.label || '',
          id: resource.feature.id || '',
          featureId: resource.feature.featureId || '',
          taxonomy: resource.taxonomy || '',
          resources: resource.resource.join(', ')
        };
        const paramString = transformObjToString(eventData);
        // `transformStringToObj` function can be used to change it back to object
        Tagging.sendEvent({
          'event': 'interaction_event',
          'event_name': 'portal_maps_connectivity',
          'category': paramString,
          "location": type + ' ' + this.$refs.flatmap.viewingMode
        });
      }
    },
    flatmapReadyCall: function (flatmap) {
      let provClone = {id: this.entry.id, prov: this.getFlatmapImp().provenance}; //create clone of provenance and add id
      EventBus.emit("mapImpProv", provClone); // send clone to context card
      this.$emit("flatmap-provenance-ready", provClone);
      this.flatmapReadyForMarkerUpdates(flatmap);
      EventBus.emit("mapLoaded", flatmap);
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
    highlightFeatures: function(info) {
      let name = info.name;
      const flatmap = this.$refs.flatmap.mapImp;
      if (name) {
        const results = flatmap.search(name);
        if (results.featureIds[0]) {
          flatmap.highlightFeatures([
            flatmap.modelForFeature(results.featureIds[0]),
          ]);
        }
      }
    },
    /**
     * Append the list of suggested terms to suggestions
     */
    searchSuggestions: function (term, suggestions) {
      if (term && this.$refs.flatmap.mapImp) {
        const results = this.$refs.flatmap.mapImp.search(term);
        results.__featureIds.forEach(id => {
          const annotation = this.$refs.flatmap.mapImp.annotation(id);
          if (annotation && annotation.label)
            suggestions.push(annotation.label);
        });
      }
    },
    zoomToFeatures: function(info, forceSelect) {
      let name = info.name;
      const flatmap = this.$refs.flatmap.mapImp;
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
    changeViewingMode: function (modeName) {
      this.$refs.flatmap.changeViewingMode(modeName);
    },
  },
  computed: {
    facetSpecies() {
      return this.settingsStore.facets.species;
    },
  },
  mounted: function() {
    EventBus.on("markerUpdate", () => {
      this.flatmapMarkerUpdate(undefined);
    });
    EventBus.on("hoverUpdate", () => {
      this.mapHoverHighlight(this.$refs.flatmap.mapImp);
    });
    EventBus.on('show-connectivity', (payload) => {
      const { featureIds, offset } = payload;
      const currentFlatmap = this.$refs.flatmap;
      if (currentFlatmap) {
        currentFlatmap.moveMap(featureIds, {
          offsetX: offset ? -150 : 0,
          zoom: 4,
        });
      }
    });
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

:deep(.flatmapvuer-popover) {
  .maplibregl-popup-content {
    border-radius: 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    pointer-events: auto;
    width: 25em;
    background: #fff;
  }
}

:deep(.maplibregl-marker) {
  &.standard-marker {
    z-index: 2;
  }
  &.highlight-marker {
    z-index: 1;
  }
}
</style>
