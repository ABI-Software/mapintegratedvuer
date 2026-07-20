<template>
  <div
    class="content-container"
    @mouseover="mouseHovered = true"
    @mouseleave="mouseHovered = false"
  >
    <ContentBar
      class="toolbar"
      :entry="entry"
      ref="contentBar"
      @chooser-changed="onResize"
      @scaffold-view-clicked="scaffoldViewClicked"
      @vue:mounted="setPanesBoundary"
    />
  <!--
    <DatasetHeader
      v-if="entry.datasetTitle"
      class="dataset-header"
      :entry="entry"
    ></DatasetHeader>
  -->
    <div class="component-container" ref="container">
      <div
        class="popover-location simulation top"
        v-if="simulationInfo.length > 0"
        :class="{
          open: simulationDrawerOpen,
          close: !simulationDrawerOpen,
        }"
      >
        <div
          class="simulation-container"
          :class="{
            open: simulationDrawerOpen,
            close: !simulationDrawerOpen,
          }"
          v-popover:simulationPopover
        >
          <h4 style="margin-top: 0; margin-bottom: 10px">
            Available Protocols
          </h4>
          <el-select
            popper-class="flatmap-dropdown"
            v-model="selectedSimulation"
            placeholder="Select a simulation"
            size="default"
            style="width: 100%; margin-bottom: 10px"
            value-key="path"
          >
            <el-option
              v-for="info in simulationInfo"
              :key="info.path"
              :label="getSimulationLabel(info)"
              :value="info"
            />
          </el-select>
          <el-button
            type="primary"
            @click="openSimulation"
            :disabled="!selectedSimulation"
            style="width: 100%"
          >
            Open Simulation
          </el-button>
        </div>
        <div
          @click="simulationDrawerOpen = !simulationDrawerOpen"
          class="drawer-button"
          :class="{
            open: simulationDrawerOpen,
            close: !simulationDrawerOpen,
          }"
          title="Toggle Simulation Panel"
        >
          <!-- Arrow icons for open/close state -->
          <el-icon>
            <el-icon-arrow-left />
          </el-icon>
        </div>
      </div>
      <Suspense>
        <Component
          :is="viewerType"
          :entry="entry"
          :mouseHovered="mouseHovered"
          :selectedSimulation="selectedSimulation"
          :visible="visible"
          :lazy="true"
          ref="viewer"
          @dataset-info-ready="processDataset"
          @flatmap-provenance-ready="flatmapProvenanceReady"
          @resource-selected="resourceSelected"
          @species-changed="speciesChanged"
        />
      </Suspense>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-alert, no-console */
import { defineAsyncComponent, markRaw } from 'vue'
import {
  ArrowLeft as ElIconArrowLeft,
} from '@element-plus/icons-vue'
import {
  ElButton as Button,
  ElIcon as Icon
} from "element-plus";
import ContentBar from "./ContentBar.vue";
import EventBus from './EventBus'
import { mapStores } from 'pinia';
import { useEntriesStore } from '../stores/entries';
import { useSettingsStore } from '../stores/settings'
import { useSplitFlowStore } from '../stores/splitFlow';
import { retrieveProtocolData } from '../services/testData.js';

const Flatmap = defineAsyncComponent(() => import("./viewers/Flatmap.vue"));
const Iframe = defineAsyncComponent(() => import("./viewers/Iframe.vue"));
const MultiFlatmap = defineAsyncComponent(() => import("./viewers/MultiFlatmap.vue"));
const ConnectivityGraph = defineAsyncComponent(() => import("./viewers/ConnectivityGraph.vue"));
const Plot = defineAsyncComponent(() => import("./viewers/Plot.vue"));
const Scaffold = defineAsyncComponent(() => import("./viewers/Scaffold.vue"));
const Simulation = defineAsyncComponent(() => import("./viewers/Simulation.vue"));

export default {
  name: "ContentVuer",
  props: {
    /**
     * Object containing information for
     * the required viewing.
     */
    entry: Object,

    visible: {
      type: Boolean,
      default: true,
    },
  },
  components: {
    //DatasetHeader,
    Button,
    ContentBar,
    ConnectivityGraph,
    ElIconArrowLeft,
    Flatmap,
    Icon,
    Iframe,
    MultiFlatmap,
    Plot,
    Scaffold,
    Simulation,
  },
  methods: {
    flatmapProvenanceReady: function(prov) {
      this.$refs.contentBar?.setupFlatmapContextCard(prov);
      this.entriesStore.updateMapForEntry(this.entry, prov);
    },
    getId: function () {
      return this.entry.id;
    },
    getState: function () {
      return this.$refs.viewer?.getState();
    },
    processDataset: function(data) {
      if (!data || !data.datasetInfo) return
      const { uuid, datasetInfo } = data;
      this.contentUUID = uuid;
      if (datasetInfo.testData) {
        this.simulationInfo = [] // Reset list
        datasetInfo.simulation.forEach((item) => {
          this.simulationInfo.push({
            label: item.name,
            path: item.dataset.path,
            dataset_id: item.datasetId,
            type: 'Simulation',
            resource: item.resource.url,
          })
        })
      } else {
        if (datasetInfo.length !== 0) {
          this.simulationInfo = [] // Reset list
          //FIXME: Currently only process the first dataset entry
          const firstData = datasetInfo[0]
          const apiLocation = this.sparcAPI
          // Base URL for Pennsieve public assets
          const baseUrl = `${apiLocation}/s3-resource/${firstData.dataset_id}/files`
          const bucketName = this.extractBucketNameFromS3Uri(firstData.s3uri)
          firstData.urls.map(async (filePath) => {
            const fullUrl = `${baseUrl}/${filePath}?s3BucketName=${bucketName}`
            // Add to our list of valid files
            this.simulationInfo.push({
              label: firstData.title,
              s3uri: firstData.s3uri,
              dataset_id: firstData.dataset_id,
              version: firstData.version,
              path: filePath,
              type: 'Simulation',
              resource: fullUrl,
            })
          })
        }
      }
    },

    getSimulationLabel: function (info) {
      return info.path.split('/').pop()
    },
    openSimulation: async function () {
      if (this.selectedSimulation) {
        EventBus.emit('simulation-open-clicked', {...this.selectedSimulation, requesterEntryId: this.entry.id,
          contentUUID: this.contentUUID})
        if (!this.protocolData) {
          this.protocolData = markRaw(await retrieveProtocolData(this.settingsStore.testDataLocation, this.contentUUID));
        }
        this.populateProtocolMarkers(this.selectedSimulation);
      }
    },
    populateProtocolMarkers: function(simulation) {
      if (simulation?.path && this.protocolData) {
        const ids = this.protocolData.reduce((results, item) => {
          if (item.protocol.includes(simulation.path)) {
            if (item.columns) {
              item.columns.forEach((column) =>{
                if (column.anatomic_location) {
                  results.push(column.anatomic_location);
                }
              });
            }
          }
          return results;
        }, []);
        this.$refs.viewer?.updateProtocolMarkers(ids);
      }
    },
    resourceSelected: function (payload) {
      this.$emit("resource-selected", payload);
    },
    scaffoldViewClicked: function (viewUrl) {
      if (this.entry.viewUrl !== viewUrl) {
        this.entriesStore.updateViewForEntry({id: this.entry.id, viewUrl});
      } else {
        //Manually set it as it cannot be set with reactivity
        this.$refs.viewer?.updateWithViewUrl(viewUrl);
      }
    },
    /**
     * Perform a local search on this contentvuer
     * @param {string} term - The search term to look for
     */
    search: function (term) {
      return this.$refs.viewer?.search(term);
    },
    /**
     * Push the suggested terms into the suggestions array
     */
    searchSuggestions: function(term, suggestions) {
      this.$refs.viewer?.searchSuggestions(term, suggestions);
    },
    setPanesBoundary: function() {
      this.$refs.contentBar?.setBoundary(this.$refs["container"]);
    },
    speciesChanged: function (species) {
      this.activeSpecies = species;
      this.$emit("species-changed", species);
    },
    onResize: function () {
      this.$refs.viewer?.onResize();
    },
    //The following handle EventBus.on from SplitDialog
    onConnectivityItemClose: function() {
      this.$refs.viewer?.onConnectivityItemClose();
    },
    onConnectivitySourceChange: function(payload, ongoingSource) {
      this.$refs.viewer?.changeConnectivitySource(payload, ongoingSource);
    },
    onFlatmapMarkerUpdate: function() {
      this.$refs.viewer?.flatmapMarkerUpdate();
    },
    onGlobalViewerSettingsUpdate: function() {
      this.$refs.viewer?.updateViewerSettings();
    },
    onHoverUpdate: function(payload) {
      this.$refs.viewer?.sidebarHoverHighlight(payload);
    },
    onShowConnectivity: function(payload) {
      this.$refs.viewer?.showConnectivity(payload);
    },
    onShowConnectivityTooltips: function(payload) {
      this.$refs.viewer?.showConnectivityTooltips(payload);
    },
    onShowReferenceConnectivity: function(payload) {
      this.$refs.viewer?.showConnectivitiesByReference(payload);
    },
    onSidebarAnnotationClose: function() {
      this.$refs.viewer?.onSidebarAnnotationClose();
    },
    onStartHelp: function() {
      this.$refs.viewer?.startHelp();
    },
    onFilterVisibility: function(payload) {
      this.$refs.viewer?.setVisibilityFilter(payload);
    },
    onLoadConnectivityDetail: function(payload) {
      if (this.$refs.viewer?.entry.type !== 'ConnectivityGraph') {
        this.$refs.viewer?.getKnowledgeTooltip(payload);
      }
    },
    toggleMinimap: function(option, prevState) {
      this.$refs.viewer?.toggleMinimap(option, prevState);
    },
  },
  data: function () {
    return {
      contentUUID: undefined,
      protocolData: undefined,
      selectedSimulation: undefined,
      simulationDrawerOpen: false,
      simulationInfo: [],
      mouseHovered: false,
      activeSpecies: "Rat",
    };
  },
  computed: {
    ...mapStores(useEntriesStore, useSettingsStore, useSplitFlowStore),
    viewerType() {
      switch (this.entry.type) {
        case "Iframe":
          return 'Iframe';
        default:
          return this.entry.type;
      }
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.toolbar {
  width: 100%;
  background-color: #f5f7fa !important;
  position: absolute;
  transition: all 1s ease;
  height: 32px;
  border-bottom: 1px solid rgb(220, 223, 230);
  z-index: 7;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.component-container {
  height: calc(100% - 32px);
  width: 100%;
  bottom: 0px;
  position: absolute;
  z-index:6;
  overflow: hidden;
}

.dataset-header {
  height: 23px;
}

.content-container {
  height: 100%;
  width: 100%;
}

.open-scaffold {
  position: absolute;
  left: calc(50% - 64px);
  z-index: 2;
  top: 8px;
  font-size: 16px;
  padding-top: 9px;
  padding-bottom: 9px;
  &.el-button--primary.is-plain {
    &:hover,
    &:active,
    &:focus {
      color: #8300bf;
      background: #f3e6f9;
      border-color: #cd99e5;
    }
    &:hover {
      box-shadow: -3px 2px 4px rgba(0, 0, 0, 0.2);
    }
  }
}


.drawer-button {
  z-index: 8;
  width: 20px;
  height: 40px;
  border: solid 1px $app-primary-color;
  text-align: center;
  vertical-align: middle;
  cursor: pointer;
  pointer-events: auto;
  background-color: #f9f2fc;

  i {
    font-weight: 600;
    margin-top: 12px;
    color: $app-primary-color;
  }
  &.open {
    i {
      transform: rotate(0deg) scaleY(2);
    }
  }
  &.close {
    transform: translateX(22px); // button + border width
    i {
      transform: rotate(180deg) scaleY(2);
    }
  }
}


.simulation-container {
  width: 276px;
  padding-left: 8px;
  padding-right: 8px;
  padding-bottom: 16px;
  border: 1px solid rgb(220, 223, 230);
  border-left: 0;
  border-bottom: 0;
  background: #ffffff;
  &.open {
    opacity: 1;
    position: relative;
    z-index: 2;
  }
  &.close {
    opacity: 0;
  }
}

.popover-location {
  position: absolute;
  left: 0px;
  transform: translateX(0);
  transition: all var(--el-transition-duration);
  z-index: 100;
  display: flex;
  flex-direction: row;
  align-items: center;
  &.simulation {
    .el-button {
      background: $app-primary-color;
    }
  }
  &.open {
    transform: translateX(0);
  }
  &.close {
    transform: translateX(-100%);
  }
  &.top {
    top: 5px;
  }
  &.bottom {
    bottom: 0px;
  }
}
</style>
