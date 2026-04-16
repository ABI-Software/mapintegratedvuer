<template>
  <SimulationVuer
    :apiLocation="apiLocation"
    :id="id" ref="simulation"
    @data-notification="handleDataNotification"
    @externalData="handleExternalEvent"
    @file="handleFileEvent"

  />
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
      return this.entry.resource ? this.entry.resource : this.entry.discoverId
    },
  },
  data: function () {
    return {
      columns: undefined,
      csv: undefined,
      fileOpened: false,
    }
  },
  methods: {
    handleDataNotification: function (update) {
      EventBus.emit('simulation-response', update)
    },
    handleDataRequest(payload) {
      this.processRequest(payload);
    },
    handleExternalEvent(payload) {
      console.log("handleExternalEvent", payload)
    },
    handleFileEvent(payload) {
      if (payload?.type === "opened") {
        this.$nextTick(() => {
          this.fileOpened = true
          if (this.entry.csv_file || this.csv_file) {
            this.addExternalData(
              {
                targetEntryId: this.entry.id,
                action: this.entry
              }
            )
          }
        })
      }
    },
    handleWindowClosed(payload) {
      this.$refs.simulation?.removeDataSubscription(payload.id);
    },
    processRequest: function (req) {
      // strict check against the literal type
      if (req.id !== 'nz.ac.auckland.simulation-data-request') return

      const requestMajorVersion = parseInt(req.version.split('.')[0])
      if (requestMajorVersion !== 0) {
        console.warn('Unsupported simulation request version:', req.version)
        return
      }

      if (req.payload.protocol?.resource !== this.id) {
        return
      }

      this.$refs.simulation?.addDataSubscription({
        id: req.id,
        version: req.version,
        payload: {
          windowId: req.payload.windowId,
          ownerId: req.payload.ownerId,
          component: req.payload.component,
          variable: req.payload.variable,
          withVOI: true,
        },
      })
    },
    addExternalData: function(payload) {
      console.log("addExternalData", payload)
      if (this.entry.id === payload.targetEntryId) {
        const data = payload.action
        if (data.csv_file) {
          this.csv_file = data.csv_file
          this.columns = data.columns
        }
        if (this.csv_file && this.fileOpened) {
          const parameters = []
          const voiExpression = undefined
          if (this.columns) {
            this.columns.forEach((col) => {
              if (col.cellml_variable && col.cellml_variable !== "main/t") {
                parameters.push(col.cellml_variable)
              }
            })
          }
          console.log("Sent", this.csv_file, undefined, parameters)
          this.$refs.simulation.addExternalData(this.csv_file, undefined, parameters)
        }
      }
    }
  },
  mounted: function () {
    EventBus.on('simulation-external-data', this.addExternalData)
    EventBus.on('simulation-data-request', this.handleDataRequest)
    EventBus.on('plot-window-closed', this.handleWindowClosed)

    EventBus.emit('simulation-ready', {
      resourceId: this.id,
      entryId: this.entry.id,
      ready: true,
    })
    console.log(this.entry)
  },
  beforeUnmount: function () {
    EventBus.emit('simulation-ready', {
      resourceId: this.id,
      entryId: this.entry.id,
      ready: false,
    })
    EventBus.off('simulation-data-request', this.handleDataRequest)
    EventBus.off('plot-window-closed', this.handleWindowClosed)
  },
}
</script>
