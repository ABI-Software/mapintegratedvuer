<template>
  <FlatmapVuer
    :state="entry.state"
    :entry="entry.resource"
    @resource-selected="resourceSelected(entry.type, $event)"
    :name="entry.resource"
    style="height: 100%; width: 100%"
    :minZoom="entry.minZoom"
    :helpMode="helpMode"
    :pathControls="entry.pathControls"
    ref="flatmap"
    @ready="updateMarkers"
    :displayMinimap="true"
    :flatmapAPI="flatmapAPI"
  />
</template>

<script>
/* eslint-disable no-alert, no-console */
import { FlatmapVuer } from "@abi-software/flatmapvuer/src/components/index.js";
import ContentMixin from "../../mixins/ContentMixin";
import store from "../../store";
export default {
  name: "Flatmap",
  mixins: [ ContentMixin ],
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
      return store.state.settings.facets.species;
    },
  },
  watch: {
    facetSpecies: function () {
      this.updateMarkers(this.$refs.flatmap);
    }
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
::v-deep .flatmapvuer-popover {
  .mapboxgl-popup-content {
    border-radius: 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    padding: 3em 1em 3em 1em;
    pointer-events: auto;
    width: 25em;
    background: #fff;
  }
}
</style>