<template>
  <SimulationVuer
    :apiLocation="apiLocation"
    :id="id"
    ref="simulation"
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
  computed: {
    id: function() {
      //resource field is only available for simulation omex file and it will run locally.
      //discoverId field is used for simulations running on O2SPARC.
      return this.entry.resource ? this.entry.resource: this.entry.discoverId;
    }
  }
};
</script>
