<template>
  <FlatmapVuer
    :state="entry.state"
    :entry="entry.resource"
    @resource-selected="flatmaprResourceSelected(entry.type, $event)"
    @pan-zoom-callback="flatmapPanZoomCallback"
    :name="entry.resource"
    style="height: 100%; width: 100%"
    :minZoom="entry.minZoom"
    :helpMode="helpMode"
    :pathControls="true"
    ref="flatmap"
    @ready="flatmapReadyCall"
    :displayMinimap="false"
    :displayWarning="true"
    :enableOpenMapUI="true"
    :flatmapAPI="flatmapAPI"
    :sparcAPI="apiLocation"
    @open-map="openMap"
  />
</template>

<script>
/* eslint-disable no-alert, no-console */
import { FlatmapVuer } from "@abi-software/flatmapvuer";
import EventBus from "../EventBus";
import ContentMixin from "../../mixins/ContentMixin";
import DynamicMarkerMixin from "../../mixins/DynamicMarkerMixin";
import "@abi-software/flatmapvuer/dist/style.css";

export default {
  name: "Flatmap",
  mixins: [ ContentMixin, DynamicMarkerMixin ],
  components: {
    FlatmapVuer,
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
      return this.$refs.flatmap.mapImp;
    },
    flatmaprResourceSelected: function (type, resource) {
      this.$refs.flatmap.resourceSelected(
        type, resource, (this.$refs.map.viewingMode === "Exploration"));
    },
    flatmapReadyCall: function (flatmap) {
      let provClone = {id: this.entry.id, prov: this.getFlatmapImp().provenance}; //create clone of provenance and add id
      EventBus.emit("mapImpProv", provClone); // send clone to context card
      this.$emit("flatmap-provenance-ready", provClone);
      this.getAvailableTerms();
      if (this.entry.resource === "FunctionalConnectivity"){
        this.flatmapReadyForMarkerUpdates(flatmap);
      }
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
  },
  computed: {
    facetSpecies() {
      return this.settingsStore.facets.species;
    },
  },
  mounted: function() {
    this.getAvailableTerms();
    EventBus.on("markerUpdate", () => {
      this.flatmapMarkerUpdate(true, undefined);
    });
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
:deep(.maplibregl-popup) {
  z-index: 3;
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
