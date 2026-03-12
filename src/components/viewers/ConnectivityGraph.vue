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
      return this.entry.graphPayload || null;
    },
    mapServer() {
      return this.entry.mapServer || null;
    },
    sckanVersion() {
      return this.entry.sckanVersion || null;
    },
  },
  methods: {
    onTapNode: function () {
      return;
    },
  },
};
</script>

<style scoped lang="scss">
.viewer-container {
  width: 100%;
  height: 100%;
  padding: 1rem;
  box-sizing: border-box;
}
</style>
