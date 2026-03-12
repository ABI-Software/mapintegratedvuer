<template>
  <h3>Connectivity Graph</h3>
  <!-- <connectivity-graph /> -->
</template>

<script>
/* eslint-disable no-alert, no-console */
import {
  ConnectivityGraph,
} from '@abi-software/map-utilities';
import ContentMixin from "../../mixins/ContentMixin";

export default {
  name: "ConnectivityGraph",
  mixins: [ ContentMixin ],
  components: {
    ConnectivityGraph,
  }
};
</script>
