<template>
  <SimulationVuer
    :apiLocation="apiLocation"
    :id="id"
  />
</template>

<script>
/* eslint-disable no-alert, no-console */
import ContentMixin from "../../mixins/ContentMixin";
import { SimulationVuer } from "@abi-software/simulationvuer";
import "@abi-software/simulationvuer/dist/style.css";

export default {
  name: "Simulation",
  data: function() {
    return {
      id: undefined,
    };
  },
  mixins: [ ContentMixin ],
  components: {
    SimulationVuer,
  },
  created: function() {
    if (this.entry) {
      if (this.entry.discoverId) {
        this.id = this.entry.discoverId;
      } else if (this.entry.resource) {
        if (this.settingsStore.pmrHost) {
          this.id = this.entry.resource.replace(this.settingsStore.pmrHost, '');
        } else {
          this.id = this.entry.resource;
        }
      }
    }
  }
};
</script>
