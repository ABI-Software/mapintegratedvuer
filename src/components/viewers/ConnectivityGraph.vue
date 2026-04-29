<template>
  <div class="viewer-container" @mouseenter="onViewerMouseEnter">
    <MapUtilitiesConnectivityGraph
      :entry="graphEntry"
      :mapServer="mapServer"
      :sckanVersion="sckanVersion"
      :connectivityFromMap="connectivityFromMap"
      :connectivityError="connectivityError"
      :origins="origins"
      :components="components"
      :destinations="destinations"
      :originsWithDatasets="originsWithDatasets"
      :componentsWithDatasets="componentsWithDatasets"
      :destinationsWithDatasets="destinationsWithDatasets"
      :hasSingleConnectivityList="hasSingleConnectivityList"
      :originsCombinations="originsCombinations"
      :componentsCombinations="componentsCombinations"
      :destinationsCombinations="destinationsCombinations"
      @tap-node="onTapNode"
    />
  </div>
</template>

<script>
/* eslint-disable no-alert, no-console */
import {
  ConnectivityGraph as MapUtilitiesConnectivityGraph,
} from '@abi-software/map-utilities';
import ContentMixin from "../../mixins/ContentMixin";
import EventBus from '../EventBus';

export default {
  name: "ConnectivityGraph",
  mixins: [ ContentMixin ],
  components: {
    MapUtilitiesConnectivityGraph,
  },
  computed: {
    graphEntry() {
      return this.entry.resource;
    },
    connectivityError() {
      return {};
    },
    connectivityFromMap() {
      return this.entry.graphPayload?.connectivityFromMap || null;
    },
    origins() {
      return this.entry.graphPayload?.origins || [];
    },
    components() {
      return this.entry.graphPayload?.components || [];
    },
    destinations() {
      return this.entry.graphPayload?.destinations || [];
    },
    originsWithDatasets() {
      return this.entry.graphPayload?.originsWithDatasets || [];
    },
    componentsWithDatasets() {
      return this.entry.graphPayload?.componentsWithDatasets || [];
    },
    destinationsWithDatasets() {
      return this.entry.graphPayload?.destinationsWithDatasets || [];
    },
    hasSingleConnectivityList() {
      return this.entry.graphPayload?.hasSingleConnectivityList || false;
    },
    originsCombinations() {
      return this.entry.graphPayload?.originsCombinations || [];
    },
    componentsCombinations() {
      return this.entry.graphPayload?.componentsCombinations || [];
    },
    destinationsCombinations() {
      return this.entry.graphPayload?.destinationsCombinations || [];
    },
    mapServer() {
      return this.entry.mapServer || null;
    },
    sckanVersion() {
      return this.entry.sckanVersion || null;
    },
  },
  methods: {
    highlightConnectivity: function () {
      let hoverAnatomies = [], hoverOrgans = [], hoverDOI = '', hoverConnectivity = [];
      hoverConnectivity = [this.graphEntry];
      this.settingsStore.updateHoverFeatures(hoverAnatomies, hoverOrgans, hoverDOI, hoverConnectivity);
      EventBus.emit("hoverUpdate", { connectivityProcessed: false });
    },
    onViewerMouseEnter: function () {
      this.highlightConnectivity();
    },
    onTapNode: function (data) {
      const name = data.map(t => t.label).join(', ');
      if (name) {
        this.onConnectivityHovered(name);
      } else {
        this.highlightConnectivity();
      }
    },
    onConnectivityHovered: function (label) {
      const payload = {
        connectivityInfo: this.entry.connectivityInfo,
        label: label,
        data: label ? this.getConnectivityDatasets(label) : [],
      };
      EventBus.emit('connectivity-hovered', payload);
    },
    getConnectivityDatasets: function (label) {
      const allWithDatasets = this.entry.graphPayload?.allWithDatasets || [];
      const names = label.split(',');
      let data = [];
      names.forEach((n) => {
        const foundData = allWithDatasets.find((a) =>
          a.name.toLowerCase().trim() === n.toLowerCase().trim()
        );
        if (foundData) {
          data.push({
            id: foundData.id,
            label: foundData.name
          });
        }
      });
      return data
    },
  },
};
</script>

<style scoped lang="scss">
.viewer-container {
  width: 100%;
  height: 100%;
  box-sizing: border-box;

  .connectivity-graph {
    width: 100%;
    height: 100%;
    box-shadow: none;
    border: none;
    border-radius: 0;

    :deep(.graph-canvas) {
      width: 100%;
      height: 100%;
    }
  }
}
</style>
