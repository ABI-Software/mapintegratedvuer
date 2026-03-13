<template>
  <div class="viewer-container">
    <MapUtilitiesConnectivityGraph
      :entry="graphEntry"
      :mapServer="mapServer"
      :sckanVersion="sckanVersion"
      :connectivityFromMap="connectivityFromMap"
      :connectivityError="connectivityError"
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
    mapServer() {
      return this.entry.mapServer || null;
    },
    sckanVersion() {
      return this.entry.sckanVersion || null;
    },
  },
  methods: {
    onTapNode: function (data) {
      const name = data.map(t => t.label).join(', ');
      this.onConnectivityHovered(name);

      // Hover outside of node area
      if (!name) {
        EventBus.emit('show-connectivity', {
          featureIds: [this.entry.resource]
        });
      }

    },
    onConnectivityHovered: function (label) {
      const payload = {
        connectivityInfo: this.graphEntry,
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
