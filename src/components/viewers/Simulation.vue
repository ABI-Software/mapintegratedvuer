<template>
  <SimulationVuer :apiLocation="apiLocation" :id="id" ref="simulation" />
</template>

<script>
/* eslint-disable no-alert, no-console */
import EventBus from '../EventBus'
import ContentMixin from '../../mixins/ContentMixin'
import { SimulationVuer } from '@abi-software/simulationvuer'
import '@abi-software/simulationvuer/dist/style.css'

export default {
  name: 'Simulation',
  mixins: [ContentMixin],
  components: {
    SimulationVuer,
  },
  computed: {
    id: function () {
      //resource field is only available for simulation omex file and it will run locally.
      //discoverId field is used for simulations running on O2SPARC.
      console.log('Simulation entry: ', this.entry)
      console.log(this.apiLocation)
      console.log(
        'Simulation id: ',
        this.entry.resource ? this.entry.resource : this.entry.discoverId
      )
      return this.entry.resource ? this.entry.resource : this.entry.discoverId
    },
  },
  methods: {
    processRequest: function (req) {
      // strict check against the literal type
      if (req.id !== 'nz.ac.auckland.simulation-data-request') return

      const requestMajorVersion = parseInt(req.version.split('.')[0])
      if (requestMajorVersion !== 0) {
        console.warn('Unsupported simulation request version:', req.version)
        return
      }

      if (req.protocol?.resource !== this.id) {
        return
      }

      console.log('Processing simulation request:', req)
      // TypeScript knows 'req' has the correct shape for the service
      const result = this.$refs.simulation.getData([
        req,
        {
          ...req,
          variable: 'VOI',
        },
      ])
      
      const RESPONSE_ID = 'nz.ac.auckland.simulation-data-response'
      const RESPONSE_VERSION = '0.1.0'

      const simulationResponse = {
        id: RESPONSE_ID,
        version: RESPONSE_VERSION,
        title: `${req.component}/${req.variable}`,
        data: result['data'],
        target: req.source,
        position: req.position,
      }

      console.log('Simulation data response:', simulationResponse)
      EventBus.emit('simulation-response', simulationResponse)
    },
  },
  mounted: function () {
    EventBus.on('simulation-request', (payload) => {
      this.processRequest(payload)
    })
  },
}
</script>
