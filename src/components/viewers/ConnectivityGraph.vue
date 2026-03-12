<template>
  <div class="viewer-container">
    <MapUtilitiesConnectivityGraph
      :entry="graphEntry"
      :knowledgeData="sampleKnowledge"
      :connectivityError="{}"
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

const SAMPLE_KNOWLEDGE = {
  dendrites: [
    ['UBERON:0002107', ['ILX:sample-origin']],
  ],
  somas: [
    ['UBERON:0000955', ['ILX:sample-component']],
  ],
  axons: [
    ['UBERON:0004535', ['ILX:sample-destination']],
  ],
  connectivity: [
    [
      ['UBERON:0002107', ['ILX:sample-origin']],
      ['UBERON:0000955', ['ILX:sample-component']],
    ],
    [
      ['UBERON:0000955', ['ILX:sample-component']],
      ['UBERON:0004535', ['ILX:sample-destination']],
    ],
  ],
};

export default {
  name: "ConnectivityGraph",
  mixins: [ ContentMixin ],
  components: {
    MapUtilitiesConnectivityGraph,
  },
  computed: {
    graphEntry: function () {
      return this.entry?.resource || 'sample:connectivity-graph';
    },
    sampleKnowledge: function () {
      return SAMPLE_KNOWLEDGE;
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
