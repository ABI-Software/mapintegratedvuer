<template>
  <div class="viewer-container">
    <ScaffoldVuer
      :state="entry.state"
      :url="entry.resource"
      :region="entry.region"
      @scaffold-selected="scaffoldResourceSelected(entry.type, $event)"
      @scaffold-highlighted="scaffoldHighlighted(entry.type, $event)"
      @scaffold-navigated="scaffoldNavigated(entry.type, $event)"
      @on-ready="scaffoldIsReady"
      @open-map="openMap"
      ref="scaffold"
      :background-toggle="true"
      :traditional="true"
      :helpMode="helpMode"
      :helpModeActiveItem="helpModeActiveItem"
      :helpModeDialog="useHelpModeDialog"
      @annotation-open="onAnnotationOpen"
      @annotation-close="onAnnotationClose"
      @update-offline-annotation-enabled="updateOfflineAnnotationEnabled"
      :annotationSidebar="annotationSidebar"
      @help-mode-last-item="onHelpModeLastItem"
      @shown-tooltip="onTooltipShown"
      @shown-map-tooltip="onMapTooltipShown"
      :render="visible"
      :display-latest-message="true"
      :warning-message="warningMessage"
      :display-minimap="false"
      :display-markers="false"
      :enableOpenMapUI="true"
      :view-u-r-l="entry.viewUrl"
      :markerCluster="true"
      :markerLabels="markerLabels"
      :flatmapAPI="flatmapAPI"
      :showLocalSettings="showLocalSettings"
      :showOpenMapButton="showOpenMapButton"
      :usageConfig="{
        showTubeLinesControls: false,
        tubeLines: (entry.discoverId === '307')
      }"
    />

    <HelpModeDialog
      v-if="helpMode && useHelpModeDialog"
      ref="scaffoldHelp"
      :scaffoldRef="scaffoldRef"
      :lastItem="helpModeLastItem"
      @show-next="onHelpModeShowNext"
      @finish-help-mode="onFinishHelpMode"
    />
  </div>
</template>

<script>
/* eslint-disable no-alert, no-console */
import EventBus from "../EventBus";
import ContentMixin from "../../mixins/ContentMixin";

import { ScaffoldVuer } from "@abi-software/scaffoldvuer";
import "@abi-software/scaffoldvuer/dist/style.css";
import { HelpModeDialog } from '@abi-software/map-utilities'
import '@abi-software/map-utilities/dist/style.css'
import { getReferenceConnectivitiesFromStorage, getReferenceConnectivitiesByAPI } from "@abi-software/flatmapvuer/src/services/flatmapKnowledge.js";

export default {
  name: "Scaffold",
  mixins: [ ContentMixin ],
  components: {
    ScaffoldVuer,
    HelpModeDialog,
  },
  methods: {
    showConnectivitiesByReference: async function (resource) {
      const flatmapKnowledge = sessionStorage.getItem('flatmap-knowledge');
      let featureIds = [];
      if (flatmapKnowledge) {
        featureIds = await getReferenceConnectivitiesFromStorage(resource);
      } else {
        featureIds = await getReferenceConnectivitiesByAPI(this.flatmapService.mapImp, resource, this.flatmapService.flatmapQueries);
      }
      const nerveLabels = [];
      for (const id of featureIds) {
        const knowledge = this.nervesKnowledge.find(k => k.id === id);
        if (!knowledge) continue;

        const nerves = knowledge['nerve-label'];
        if (nerves) {          
          const subNerves = nerves.flatMap(n => n.subNerves);
          nerveLabels.push(...subNerves);
        }
      }
      this.$refs.scaffold.changeHighlightedByName(nerveLabels, "", false);
    },
    setNerveGreyScale: function () {
      if (this.nervesKnowledge.length) {
        const nerves = this.nervesKnowledge.reduce((acc, val) => {
          return acc.concat(val['nerve-label'] || []);
        }, []);
        const excludedLabels = nerves.reduce((acc, nerve) => {
          return acc.concat(nerve.subNerves || []);
        }, []);
        this.$refs.scaffold.setGreyScale(true, excludedLabels);
      }
    },
    setVisibilityFilter: function (payload) {
      let names = [];
      const processed = payload ? true : false;
      if (payload) {        
        const ids = payload['OR'][1]['AND'][1].models;
        for (const id of ids) {
          const nerveKnowledge = this.nervesKnowledge.find((knowledge) => knowledge.id === id);
          const nerves = nerveKnowledge['nerve-label'].map(n => n.subNerves).flat(Infinity);
          names.push(...nerves);
        }
      }
      this.$refs.scaffold.zoomToNerves(names, processed);
    },
    scaffoldResourceSelected: function (type, resource) {
      this.resourceSelected(type, resource, true)
      if (resource.length === 1) {
        this.clickedNerve = resource[0].data;
        if (this.clickedNerve.isNerves && this.clickedNerve.anatomicalId) {
          const label = this.clickedNerve.id.toLowerCase();
          if (this.$refs.scaffold.viewingMode === "Neuron Connection") {
            // add nerve label to search input
            EventBus.emit("neuron-connection-feature-click", {
              filters: [{
                facet: label,
                term: 'Nerves',
                facetPropPath: 'scaffold.connectivity.subnerve',
              }],
              search: ''
            })
          } else if (this.$refs.scaffold.viewingMode === "Exploration") {
            const nerveKnowledge = this.nervesKnowledge
              .filter(knowledge => JSON.stringify(knowledge['nerve-label']).includes(label));
            if (nerveKnowledge.length) {
              this.getKnowledgeTooltip({ data: nerveKnowledge, type: this.entry });
            }
          }
        }
      } else if (resource.length > 1) {
        // zoomToNerves will lead multiple resources selected
        // if multiple resources selected is because of directly clicking on a nerve
        // enable picking again
        if (this.clickedNerve) {
          this.$refs.scaffold.$module.setIgnorePicking(false);
        }
      } else {
        this.clickedNerve = undefined;
        EventBus.emit("connectivity-info-close");
      }
    },
    onResize: function () {
      this.scaffoldCamera.onResize();
    },
    getState: function () {
      return this.$refs.scaffold.getState();
    },
    /**
     * Perform a local search on this contentvuer
     */
    search: function (term) {
      return this.$refs.scaffold.search(term, true);
    },
    searchSuggestions: function(term, suggestions){
      if (term === "" || !this.$refs.scaffold) {
        return suggestions;
      }
      const items = this.$refs.scaffold.fetchSuggestions(term);
      items.forEach(item => {
        if (item.suggestion) suggestions.push(item.suggestion);
      });
    },
    showConnectivityTooltips: function (payload) {
      if (payload.label) {
        this.$refs.scaffold.changeHighlightedByName([payload.label], "", false);
        this.$refs.scaffold.showRegionTooltip(payload.label, false, false);
      } else {
        const nerves = payload.connectivityInfo['nerve-label'];
        if (nerves) {
          const nerveLabels = nerves.flatMap(n => n.subNerves);
          this.$refs.scaffold.changeHighlightedByName(nerveLabels, "", false);
        }
        this.$refs.scaffold.hideRegionTooltip();
      }
    },
    zoomToFeatures: function(info, forceSelect) {
      let names = undefined;
      if (Array.isArray(info)) names = info;
      else names = [ info.name ];
      if (forceSelect) {
        this.$refs.scaffold.changeActiveByName(names, "", false);
      }
      this.$refs.scaffold.viewRegion(names);
    },
    scaffoldIsReady: function () {
      this.scaffoldLoaded = true;
      this.$refs.scaffold.$module.graphicsHighlight.highlightColour = [1, 0, 1];
      if (this.isVisible()) {
        let rotation = "free";
        if (this.entry.rotation) rotation = this.entry.rotation;
      }
      this.updateViewerSettings();
      EventBus.emit("mapLoaded", this.$refs.scaffold);
      setTimeout(() => {
        this.setNerveGreyScale();
      }, 500);
    },
    /**
     * Callback when the vuers emit a selected event.
     */
    scaffoldHighlighted: function (type, resource) {
      const result = {
        paneIndex: this.entry.id,
        type: type,
        resource: resource,
        internalName: undefined,
      };
      if (resource && resource[0]) {
        if (resource[0].data?.id === undefined || resource[0].data?.id === "") {
          resource[0].data.id = resource[0].data?.group;
        }
        result.internalName = resource[0].data.id;
        result.eventType = "highlighted";
      }
      this.$emit("resource-selected", result);
    },
    /**
     * Callback when the vuers emit a selected event.
     */
    scaffoldNavigated: function (type, resource) {
      if (this.mouseHovered) {
        const result = {
          paneIndex: this.entry.id,
          eventType: "panZoom",
          payload: resource,
          type: type,
        };
        this.$emit("resource-selected", result);
      }
    },
    updateWithViewUrl: function(viewUrl) {
      this.$refs.scaffold.updateViewURL(viewUrl);
    },
    /**
     * Change the view mode of the current scaffold
     */
    changeViewingMode: function (modeName) {
      this.$refs.scaffold.changeViewingMode(modeName);
    },
    updateViewerSettings: function () {
      const {
        backgroundDisplay,
        organsDisplay,
        outlinesDisplay,
        viewingMode,
      } = this.settingsStore.globalSettings;
      this.$refs.scaffold.backgroundChangeCallback(backgroundDisplay);
      this.$refs.scaffold.changeViewingMode(viewingMode);
      this.$refs.scaffold.setColour(organsDisplay);
      this.$refs.scaffold.setOutlines(outlinesDisplay);
    },
  },
  computed: {
    warningMessage: function() {
      if (this.entry.isBodyScaffold) {
        return "This map displays the anatomical location and connectivity of nerves, through which the neuron populations from the ApiNATOMY models available in SCKAN can be routed.";
      } else {
        return "Under active development";
      }
    },
    markerLabels: function () {
      return this.settingsStore.globalSettings.displayMarkers ? this.settingsStore.numberOfDatasetsForFacets : {};
    },
  },
  watch: {
    connectivityKnowledge: {
      handler(newVal, oldVal) {
        // Store scaffold knowledge locally
        if (this.entry.resource in newVal) {
          const scaffoldKnowledge = newVal[this.entry.resource];
          if (scaffoldKnowledge.length !== this.nervesKnowledge.length) {
            this.nervesKnowledge = scaffoldKnowledge;
          }
        }
      },
      deep: true
    },
  },
  data: function () {
    return {
      apiLocation: process.env.VUE_APP_API_LOCATION,
      scaffoldCamera: undefined,
      scaffoldLoaded: false,
      nervesKnowledge: [],
      clickedNerve: undefined,
    };
  },
  mounted: function () {
    this.scaffoldCamera =
      this.$refs.scaffold.$module.scene.getZincCameraControls();
  },
};
</script>

<style scoped lang="scss">
.viewer-container {
  width: 100%;
  height: 100%;
}

:deep(.message-popper) {
  white-space: unset;
  max-width: 200px;
}
</style>
