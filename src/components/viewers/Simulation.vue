<template>
  <SimulationVuer
    :apiLocation="apiLocation"
    :id="entry.discoverId"
  />
</template>

<script>
/* eslint-disable no-alert, no-console */
import ContentMixin from "../../mixins/ContentMixin";
import { SimulationVuer } from "@abi-software/simulationvuer";
import "@abi-software/simulationvuer/dist/style.css";

export default {
  name: "Simulation",
  mixins: [ ContentMixin ],
  components: {
    SimulationVuer,
  },
};
</script>
