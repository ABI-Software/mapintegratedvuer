<template>
  <SimulationVuer
    v-if="isCrossOriginIsolated"
    :apiLocation="apiLocation"
    :id="id"
    ref="simulation"
  />
  <div v-else class="simulation-unsupported">
    Simulations require a cross-origin isolated page (for SharedArrayBuffer support). This browser
    or host is not configured for it.
  </div>
</template>

<script>
import ContentMixin from '../../mixins/ContentMixin';
import { SimulationVuer } from '@abi-software/simulationvuer';
import '@abi-software/simulationvuer/dist/style.css';

export default {
  name: 'Simulation',
  mixins: [ContentMixin],
  components: {
    SimulationVuer,
  },
  data: function () {
    return {
      // libOpenCOR (wasm) uses threads, which need SharedArrayBuffer and therefore COOP/COEP headers.
      // Without them it aborts on Safari.
      isCrossOriginIsolated: window.crossOriginIsolated === true,
    };
  },
  computed: {
    id: function () {
      //resource field is only available for simulation omex file and it will run locally.
      //discoverId field is used for simulations running on O2SPARC.
      return this.entry.resource ? this.entry.resource : this.entry.discoverId;
    },
  },
};
</script>

<style scoped lang="scss">
.simulation-unsupported {
  padding: 1rem;
}
</style>
