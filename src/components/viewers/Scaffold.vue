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
import { markRaw } from "vue";
import EventBus from "../EventBus";
import ContentMixin from "../../mixins/ContentMixin";

import { ScaffoldVuer } from "@abi-software/scaffoldvuer";
import { getNerveMaps, getTermNerveMaps, getFilterOptions } from "@abi-software/scaffoldvuer/src/scripts/MappedNerves.js";
import "@abi-software/scaffoldvuer/dist/style.css";
import { HelpModeDialog } from '@abi-software/map-utilities'
import '@abi-software/map-utilities/dist/style.css'
import { FlatmapQueries } from "@abi-software/flatmapvuer/src/services/flatmapQueries.js";
import { getKnowledgeSource } from "@abi-software/flatmapvuer/src/services/flatmapKnowledge.js";

export default {
  name: "Scaffold",
  mixins: [ ContentMixin ],
  components: {
    ScaffoldVuer,
    HelpModeDialog,
  },
  methods: {
    scaffoldResourceSelected: function (type, resource) {
      this.resourceSelected(type, resource, true)

      if (resource.length) {        
        const connectivity = this.connectivitiesStore.globalConnectivities[this.entry.resource];
        const nerveKnowledge = connectivity
          .filter((knowledge) => {
            const clickedNerve = resource[0].data;
            if (clickedNerve.isNerves && clickedNerve.anatomicalId) {
              const label = clickedNerve.id.toLowerCase();
              return knowledge['nerve-label'].includes(label);
            }
          });
        this.getKnowledgeTooltip({ data: nerveKnowledge, type: this.entry });
      } else {
        EventBus.emit("connectivity-info-close");
      }
    },
    isViewerMatch: function (entry) {
      return JSON.stringify(this.entry) === JSON.stringify(entry);
    },
    changeConnectivitySource: async function (payload) {
      const { entry, connectivitySource } = payload;
      await this.flatmapService.flatmapQueries.queryForConnectivityNew(this.flatmapService.mapImp, entry.featureId[0], connectivitySource);
      this.tooltipEntry = this.tooltipEntry.map((tooltip) => {
        if (tooltip.featureId[0] === entry.featureId[0]) {
          return this.flatmapService.flatmapQueries.updateTooltipData(tooltip);
        }
        return tooltip;
      })
      EventBus.emit('connectivity-info-open', this.tooltipEntry);
    },
    knowledgeTooltipQuery: async function (data) {
      await this.flatmapService.flatmapQueries.retrieveFlatmapKnowledgeForEvent(this.flatmapService.mapImp, { resource: [data.id] });
      let tooltip = await this.flatmapService.flatmapQueries.createTooltipData(this.flatmapService.mapImp, {
        resource: [data.id],
        label: data.label,
        provenanceTaxonomy: data.taxons,
        feature: []
      })
      tooltip['knowledgeSource'] = getKnowledgeSource(this.flatmapService.mapImp);
      tooltip['mapId'] = this.flatmapService.mapImp.provenance.id;
      tooltip['mapuuid'] = this.flatmapService.mapImp.provenance.uuid;
      tooltip['nerve-label'] = data['nerve-label'];
      tooltip['ready'] = true;
      return tooltip;
    },
    getKnowledgeTooltip: async function (payload) {
      if (this.isViewerMatch(payload.type)) {
        this.tooltipEntry = []
        payload.data.forEach(d => this.tooltipEntry.push({ title: d.label, featureId: [d.id], ready: false }));
        EventBus.emit('connectivity-info-open', this.tooltipEntry);

        let prom1 = [];
        // While having placeholders displayed, get details for all paths and then replace.
        for (let index = 0; index < payload.data.length; index++) {
          prom1.push(await this.knowledgeTooltipQuery(payload.data[index]))
        }
        this.tooltipEntry = await Promise.all(prom1)
        const featureIds = this.tooltipEntry.map(tooltip => tooltip.featureId[0])
        if (featureIds.length > 0) {
          EventBus.emit('connectivity-info-open', this.tooltipEntry);
        }
      }
    },
    mockUpFlatmapService: async function(mapType = 'human-flatmap_male') {
      const flatmapResponse = await fetch(this.flatmapAPI);
      const flatmapJson = await flatmapResponse.json();
      const latestHumanFlatmapMale = flatmapJson
        .filter(f => f.id === mapType)
        .sort((a, b) => b.created.localeCompare(a.created))[0];
      const flatmapUuid = latestHumanFlatmapMale.uuid;
      const flatmapSource = latestHumanFlatmapMale.sckan['knowledge-source'];
      const pathwaysResponse = await fetch(`${this.flatmapAPI}/flatmap/${flatmapUuid}/pathways`);
      const pathwaysJson = await pathwaysResponse.json();

      const flatmapQueries = markRaw(new FlatmapQueries());
      flatmapQueries.initialise(this.flatmapAPI);

      return {
        'mockup': true,
        flatmapQueries: flatmapQueries,
        getFilterOptions: getFilterOptions,
        'mapImp': {
          'provenance': {
            'uuid': flatmapUuid,
            'connectivity': {
              ...latestHumanFlatmapMale.sckan,
            },
          },
          'pathways': pathwaysJson,
          'resource': this.entry.resource,
          'nerveMaps': getTermNerveMaps(),
          queryKnowledge : async (keastId) => {
            const sql = 'select knowledge from knowledge where (source=? or source is null) and entity=? order by source desc';
            const params = [flatmapSource, keastId];
            const response = await flatmapQueries.queryKnowledge(sql, params);
            return JSON.parse(response);
          },
          queryLabels : async (entities) => {
            const sql = `select source, entity, knowledge from knowledge where (source=? or source is null) and entity in (?${', ?'.repeat(entities.length-1)}) order by entity, source desc`;
            const params = [flatmapSource, ...entities];
            const response = await flatmapQueries.queryKnowledge(sql, params);
            const entityLabels = [];
            let last_entity;
            for (const row of response) {
                if (row[1] !== last_entity) {
                    const knowledge = JSON.parse(row[2])
                    entityLabels.push({
                        entity: row[1],
                        label: knowledge['label'] || row[1]
                    })
                    last_entity = row[1];
                }
            }
            return entityLabels;
          },
        },
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
        this.$refs.scaffold.changeHighlightedByName(payload.connectivityInfo['nerve-label'], "", false);
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
    scaffoldIsReady: async function () {
      this.scaffoldLoaded = true;
      this.$refs.scaffold.$module.graphicsHighlight.highlightColour = [1, 0, 1];
      if (this.isVisible()) {
        let rotation = "free";
        if (this.entry.rotation) rotation = this.entry.rotation;
        if (this.entry.isBodyScaffold || this.entry.discoverId === "307") {    
          this.flatmapService = await this.mockUpFlatmapService();
          this.loadConnectivityExplorerConfig(this.flatmapService);
        }
      }
      this.updateViewerSettings();
      EventBus.emit("mapLoaded", this.$refs.scaffold);
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
  data: function () {
    return {
      apiLocation: process.env.VUE_APP_API_LOCATION,
      scaffoldCamera: undefined,
      scaffoldLoaded: false,
      flatmapService: undefined,
      tooltipEntry: [],
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
