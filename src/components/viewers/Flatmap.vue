<template>
  <div class="viewer-container" ref="container">
    <FlatmapVuer
      :state="entry.state"
      :entry="entry.resource"
      :mapManager="mapManager"
      @resource-selected="flatmapResourceSelected(entry.type, $event)"
      @pan-zoom-callback="flatmapPanZoomCallback"
      :name="entry.resource"
      style="height: 100%; width: 100%"
      :minZoom="entry.minZoom"
      :helpMode="helpMode"
      :helpModeActiveItem="helpModeActiveItem"
      :helpModeInitialIndex="-1"
      :helpModeDialog="useHelpModeDialog"
      @help-mode-last-item="onHelpModeLastItem"
      @shown-tooltip="onTooltipShown"
      @shown-map-tooltip="onMapTooltipShown"
      @annotation-open="onAnnotationOpen"
      @annotation-close="onAnnotationClose"
      @update-offline-annotation-enabled="updateOfflineAnnotationEnabled"
      :annotationSidebar="annotationSidebar"
      @connectivity-info-open="onConnectivityInfoOpen"
      @connectivity-error="onConnectivityError"
      @connectivity-info-close="onConnectivityInfoClose"
      @neuron-connection-feature-click="onNeuronConnectionFeatureClick"
      :connectivityInfoSidebar="connectivityInfoSidebar"
      :pathControls="true"
      ref="flatmap"
      @context-restored="contextRestored"
      @ready="flatmapReadyCall"
      :displayMinimap="displayMinimap"
      :displayWarning="true"
      :enableOpenMapUI="true"
      :flatmapAPI="flatmapAPI"
      :render="visible"
      :sparcAPI="apiLocation"
      :showLocalSettings="showLocalSettings"
      :showOpenMapButton="showOpenMapButton"
      @open-map="openMap"
      @pathway-selection-changed="onPathwaySelectionChanged"
      @mapmanager-loaded="onMapmanagerLoaded"
      :showPathwayFilter="false"
      @trackEvent="trackEvent"
      @open-simulation="onSimulationOpen"
    />

    <HelpModeDialog
      v-if="helpMode && useHelpModeDialog"
      ref="flatmapHelp"
      :flatmapRef="flatmapRef"
      :lastItem="helpModeLastItem"
      @show-next="onHelpModeShowNext"
      @finish-help-mode="onFinishHelpMode"
    />
    <FloatingWindow
      v-for="win in plotWindows"
      :key="win.id"
      :windowData="win"
      @closeWindow="handleClosePlotWindow"
      @mouseDown="bringToFront"
    >
      <PlotComponent :data="win.data" />
    </FloatingWindow>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useMouseInElement } from '@vueuse/core'

/* eslint-disable no-alert, no-console */
import Tagging from '../../services/tagging.js'
import EventBus from '../EventBus'
import ContentMixin from '../../mixins/ContentMixin'
import DynamicMarkerMixin from '../../mixins/DynamicMarkerMixin'

import { FlatmapVuer } from '@abi-software/flatmapvuer'
import '@abi-software/flatmapvuer/dist/style.css'
import { HelpModeDialog } from '@abi-software/map-utilities'
import '@abi-software/map-utilities/dist/style.css'

import PlotComponent from '../PlotComponent.vue'
import FloatingWindow from '../FloatingWindow.vue'
import { useMappingStore } from '../../stores/mapping'

const BASE_Z_INDEX = 100

export default {
  name: 'Flatmap',
  mixins: [ContentMixin, DynamicMarkerMixin],
  components: {
    FlatmapVuer,
    HelpModeDialog,
  },
  setup() {
    // const flatmap = ref(null)
    const container = ref(null);
    const mappingStore = useMappingStore()
    mappingStore.initializeMapping()
    const { elementX, elementY } = useMouseInElement(container)
    return { container, elementX, elementY, mappingStore }
  },
  data: function () {
    return {
      flatmapReady: false,
      displayMinimap: false,
      plotWindows: [],
      zStack: [],
    }
  },
  methods: {
    getState: function () {
      return this.$refs.flatmap.getState()
    },
    /**
     * Perform a local search on this contentvuer
     * This is similar to directly clicking onthe map
     */
    search: function (term) {
      return this.$refs.flatmap.searchAndShowResult(term, true, true)
    },
    getFlatmapImp() {
      return this.$refs.flatmap?.mapImp
    },
    contextRestored(flatmap) {
      this.flatmapReadyForMarkerUpdates(flatmap)
      this.updateViewerSettings()
    },
    flatmapReadyCall: function (flatmap) {
      this.flatmapReady = true
      const mapImp = this.getFlatmapImp()
      if (mapImp?.mapMetadata?.name) {
        this.updateEntryLabel(mapImp?.mapMetadata?.name)
        this.updateEntryTitle(mapImp?.mapMetadata?.name)
      }
      let provClone = { id: this.entry.id, prov: mapImp.mapMetadata } //create clone of provenance and add id
      EventBus.emit('mapImpProv', provClone) // send clone to context card
      this.$emit('flatmap-provenance-ready', provClone)
      this.flatmapReadyForMarkerUpdates(flatmap)
      this.updateViewerSettings()
      // Wait for flatmap's connectivity to load before emitting mapLoaded
      this.loadConnectivityExplorerConfig(flatmap).then(() => {
        EventBus.emit('mapLoaded', flatmap)
      })
    },
    onPathwaySelectionChanged: function (data) {
      const { label, property, checked, selectionsTitle } = data
      // GA Tagging
      // Event tracking for maps' pathway selection change
      Tagging.sendEvent({
        event: 'interaction_event',
        event_name: 'portal_maps_pathway_change',
        category: label + ' [' + property + '] ' + checked,
        location: selectionsTitle,
      })
    },
    onSidebarAnnotationClose: function () {
      if (this.flatmapReady) {
        const currentFlatmap = this.$refs.flatmap
        if (currentFlatmap) {
          this.$refs.flatmap.annotationEventCallback({}, { type: 'aborted' })
        }
      }
    },
    /**
     * Append the list of suggested terms to suggestions
     */
    searchSuggestions: function (term, suggestions) {
      if (term && this.$refs.flatmap.mapImp) {
        const results = this.$refs.flatmap.mapImp.search(term)
        const featureIds = results.__featureIds || results.featureIds
        featureIds.forEach((id) => {
          const annotation = this.$refs.flatmap.mapImp.annotation(id)
          if (annotation && annotation.label) suggestions.push(annotation.label)
        })
      }
    },
    showConnectivity: function (payload) {
      if (this?.alive) {
        const { featureIds, offset } = payload
        const currentFlatmap = this.$refs.flatmap
        if (currentFlatmap) {
          currentFlatmap.moveMap(featureIds, {
            offsetX: offset ? -150 : 0,
            zoom: 4,
          })
        }
      }
    },
    showConnectivityTooltips: function (payload) {
      if (this?.alive && this.flatmapReady) {
        const flatmap = this.$refs.multiflatmap.getCurrentFlatmap()
        flatmap.showConnectivityTooltips(payload)
      }
    },
    showConnectivitiesByReference: function (payload) {
      if (this?.alive) {
        const currentFlatmap = this.$refs.flatmap
        if (currentFlatmap) {
          currentFlatmap.showConnectivitiesByReference(payload)
        }
      }
    },
    changeConnectivitySource: function (payload, ongoingSource) {
      if (this?.alive && this.flatmapReady) {
        const flatmap = this.$refs.flatmap
        const flatmapUUID = flatmap.mapImp.mapMetadata.uuid
        if (!ongoingSource.includes(flatmapUUID)) {
          ongoingSource.push(flatmapUUID)
          flatmap.changeConnectivitySource(payload)
        }
      }
    },
    zoomToFeatures: function (info, forceSelect) {
      let name = info.name
      const flatmap = this.$refs.flatmap.mapImp
      if (name) {
        const results = flatmap.search(name)
        if (results.featureIds.length) {
          let externalId = flatmap.modelForFeature(results.featureIds[0])
          if (externalId) {
            if (forceSelect) {
              flatmap.selectFeatures(externalId)
            }
            flatmap.zoomToFeatures(externalId)
          } else flatmap.clearSearchResults()
        }
      } else {
        flatmap.clearSearchResults()
      }
    },
    changeViewingMode: function (modeName) {
      this.$refs.flatmap.changeViewingMode(modeName)
    },
    updateViewerSettings: function () {
      const {
        backgroundDisplay,
        viewingMode,
        flightPathDisplay,
        organsDisplay,
        outlinesDisplay,
        connectionType,
      } = this.settingsStore.globalSettings

      const currentFlatmap = this.$refs.flatmap

      currentFlatmap.changeViewingMode(viewingMode)
      currentFlatmap.setFlightPath3D(flightPathDisplay)
      currentFlatmap.setColour(organsDisplay)
      currentFlatmap.setOutlines(outlinesDisplay)
      currentFlatmap.backgroundChangeCallback(backgroundDisplay)
      currentFlatmap.setConnectionType(connectionType)
    },
    setVisibilityFilter: function (payload) {
      if (this?.alive) {
        const currentFlatmap = this.$refs.flatmap
        if (currentFlatmap) {
          currentFlatmap.setVisibilityFilter(payload)
        }
      }
    },
    getKnowledgeTooltip: async function (payload) {
      if (this?.alive) {
        const currentFlatmap = this.$refs.flatmap
        if (currentFlatmap) {
          // This is for expanding connectivity card
          // The length of payload.data should always be 1
          const data = payload.data[0]
          currentFlatmap.searchAndShowResult(data.id, true, false)
        }
      }
    },
    onSimulationOpen: function (simulation) {
      EventBus.emit('PopoverActionClick', simulation)
    },
    handleSimulationResponse: function (payload) {
      console.log('Handling simulation response')
      console.log(payload)
      if (payload.id !== 'nz.ac.auckland.simulation-data-response') return
      if (payload.target !== this.entry.id) return

      const currentFlatmap = this.$refs.flatmap
      if (currentFlatmap) {
        const newId = 'plot-' + Date.now()
        const windowData = {
          id: newId,
          title: payload.title,
          data: payload.data,
          zIndex: BASE_Z_INDEX,
          x: payload.position.x,
          y: payload.position.y,
        }
        this.plotWindows.push(windowData)
        this.zStack.push(newId)

        this.refreshZIndices()
      }
    },
    handleClosePlotWindow: function (windowId) {
      this.plotWindows = this.plotWindows.filter((win) => win.id !== windowId)
      this.zStack = this.zStack.filter((stackId) => stackId !== windowId)
    },
    refreshZIndices: function () {
      this.plotWindows.forEach((win) => {
        // Find where this window sits in the stack
        const stackIndex = this.zStack.indexOf(win.id)

        // If found, assign zIndex. If not (error case), keep it low.
        if (stackIndex !== -1) {
          win.zIndex = BASE_Z_INDEX + stackIndex
        }
      })
    },
    bringToFront: function (windowId) {
      const stackIndex = this.zStack.indexOf(windowId)
      if (stackIndex === -1) return // Should not happen

      this.zStack.splice(stackIndex, 1)

      this.zStack.push(windowId)

      this.refreshZIndices()
    },
  },
  computed: {
    facetSpecies() {
      return this.settingsStore.facets.species
    },
  },
  mounted() {
    EventBus.on('simulation-response', this.handleSimulationResponse)
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.viewer-container {
  width: 100%;
  height: 100%;
}

:deep(.maplibregl-popup) {
  z-index: 11;
}

:deep(.flatmapvuer-popover) {
  .maplibregl-popup-content {
    border-radius: 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    pointer-events: auto;
    width: 25em;
    background: #fff;
  }
}

:deep(.maplibregl-marker) {
  &.standard-marker {
    z-index: 2;
  }
  &.highlight-marker {
    z-index: 1;
  }
}
</style>
