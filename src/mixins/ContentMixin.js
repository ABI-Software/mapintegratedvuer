import { markRaw } from "vue";
import {
  getNerveNames,
  getParentsRegion,
} from "../components/SimulatedData.js";
import EventBus from "../components/EventBus";
import { mapStores } from 'pinia';
import { useEntriesStore } from '../stores/entries';
import { useSettingsStore } from '../stores/settings';
import { useSplitFlowStore } from '../stores/splitFlow';
import { useConnectivitiesStore } from '../stores/connectivities';
import Tagging from '../services/tagging.js';

import {
  getFlatmapFilterOptions,
} from '@abi-software/map-utilities'
import { FlatmapQueries } from "@abi-software/flatmapvuer/src/services/flatmapQueries.js";
import { getKnowledgeSource, loadAndStoreKnowledge } from "@abi-software/flatmapvuer/src/services/flatmapKnowledge.js";
import { getTermNerveMaps, getFilterOptions as getScaffoldFilterOptions } from "@abi-software/scaffoldvuer/src/scripts/MappedNerves.js";
import { defaultSpecies } from "../components/scripts/utilities.js";

function capitalise(text) {
  return text[0].toUpperCase() + text.substring(1)
}

/* eslint-disable no-alert, no-console */
export default {
  emits: [ "flatmap-provenance-ready", "resource-selected", "species-changed"],
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
    mouseHovered: {
      type: Boolean,
      default: false,
    },
  },
  inject: ['showGlobalSettings', 'showOpenMapButton'],
  computed: {
    ...mapStores(useEntriesStore, useSettingsStore, useSplitFlowStore, useConnectivitiesStore),
    idNamePair() {
      return this.splitFlowStore.idNamePair;
    },
    useHelpModeDialog() {
      return this.settingsStore.useHelpModeDialog;
    },
    connectivityInfoSidebar() {
      return this.settingsStore.connectivityInfoSidebar;
    },
    annotationSidebar() {
      return this.settingsStore.annotationSidebar;
    },
    // Hide local settings if global settings are shown
    showLocalSettings() {
      return !this.showGlobalSettings;
    },
  },
  beforeUnmount: function() {
    this.alive = false;
  },
  mounted: function () {
    this.multiflatmapRef = this.$refs.multiflatmap;
    this.flatmapRef = this.$refs.flatmap;
    this.scaffoldRef = this.$refs.scaffold;
    this.iframeRef = this.$refs.iframe;
    this.plotRef = this.$refs.plot;
    this.simulationRef = this.$refs.simulation;
    // load connectivity with mock human male flatmap
    if (this.scaffoldRef || this.iframeRef || this.plotRef || this.simulationRef) {
      this.loadExplorerConfig();
    }
    this.connectivityKnowledge = this.connectivitiesStore.globalConnectivities;
    this.connectivityFilterOptions = this.connectivitiesStore.filterOptions;
    this.connectivityFilterSources = this.connectivitiesStore.filterSources;
  },
  methods: {
    toggleMinimap: function (option, prevState) {
      if (this.multiflatmapRef) {
        const currentFlatmap = this.multiflatmapRef.getCurrentFlatmap();
        const mapImp = currentFlatmap?.mapImp;
        if (mapImp) {
          if (option === true) {
            // Only create minimap when it is not created before or destroyed
            if (prevState === false) {
              const minimapOptions = mapImp.options?.minimap || { position: 'top-right' };
              mapImp.createMinimap(minimapOptions);
              currentFlatmap.addResizeButtonToMinimap();
              currentFlatmap.minimapSmall = false;
            }
          } else {
            mapImp.closeMinimap();
          }
        }
      }
    },
    onConnectivityItemClose() {
      if (this?.alive) {
        if (this.multiflatmapRef) {
          const currentFlatmap = this.multiflatmapRef.getCurrentFlatmap();
          if (currentFlatmap) {
            currentFlatmap.closeTooltip();
          }
        }
        if (this.flatmapRef) {
          this.flatmapRef.closeTooltip();
        }
      }
    },
    getState: function () {
      return undefined;
    },
    openMap: function (type) {
      EventBus.emit("OpenNewMap", type);
      this.trackOpenMap(`open_new_${type}_map`);
    },
    onMapmanagerLoaded: function (mapManager) {
      this.settingsStore.updateMapManager(mapManager);
    },
    trackOpenMap: function (category) {
      // GA Tagging
      // Open map tracking
      Tagging.sendEvent({
        'event': 'interaction_event',
        'event_name': 'portal_maps_open_map',
        'category': category,
        'location': 'open_new_map'
      });
    },
    updateEntryLabel: function(label) {
      if (label) {
        this.entriesStore.updateLabelForEntry(this.entry, label);
      }
    },
    updateEntryTitle: function(title) {
      if (title) {
        this.entriesStore.updateTitleForEntry(this.entry, title);
      }
    },
    updateWithViewUrl: function() {
      return;
    },
    /**
     * Perform a local search on this contentvuer
     */
    search: function () {
      return false;
    },
    /**
     * Get a list of search suggestions on this contentvuer
     */
    searchSuggestions: function () {
      return;
    },
    /**
     * Callback when the vuers emit a selected event.
     */
    resourceSelected: function (type, resources) {
      const resource = resources[0]
      // Skip processing if resources already has actions
      if (this.resourceHasAction(resource)) {
        EventBus.emit("PopoverActionClick", resource);
        return;
      }

      let returnedAction = undefined;
      let action = "none";
      let fireResourceSelected = false;
      const result = {
        paneIndex: this.entry.id,
        type: type,
        resource: resources,
        internalName: undefined,
        eventType: undefined,
      };

      if (type == "MultiFlatmap" || type == "Flatmap") {
        result.internalName = resource?.feature?.label ?
          resource.feature.label : this.idNamePair[resource.feature.models];
        if (resource.eventType == "click") {
          result.eventType = "selected";
          if (resource.feature.type == "marker") {
            let label = result.internalName;
            // `resource.feature.id` is the marker identifier (not featureId or models)
            if (this.settingsStore.isFeaturedMarkerIdentifier(resource.feature.id)) {
              // It is a featured dataset search for DOI.
              returnedAction = {
                type: "Search",
                term: this.settingsStore.featuredMarkerDoi(resource.feature.id),
                featuredDataset: true,
              };
            } else {
              // Facet search on anatomy if it is not a keyword search
              returnedAction = {
                type: "Facet",
                facets: [label],
              };
              let labels = new Set();
              // 'marker-terms' changed to 'dataset-terms' in flatmap-viewer@4.3.5
              resource.feature['dataset-terms'].forEach((term) => {
                labels.add(term.label ? term.label : term.term);
              });
              if (labels.size === 0) {
                labels.add(label);
              }
              returnedAction.facets = [...labels];
              // The number of current level labels will reduce as zoom in flatmap
              if (
                this.settingsStore.hasAppliedFacets(labels) &&
                this.settingsStore.appliedFacets.length <= labels.size
              ) {
                return;
              }
              /* Add to the filter list as and if there is selected facets */
              if (this.settingsStore.appliedFacets.length) {
                if (!this.settingsStore.hasAppliedFacets(labels)) {
                  const newFacets = [...new Set([
                    ...this.settingsStore.appliedFacets,
                    ...labels
                  ])];
                  this.settingsStore.updateAppliedFacets(newFacets);
                }
              } else {
                if (labels.size > 1) {
                  returnedAction.type = "Facets";
                }
                this.settingsStore.updateAppliedFacets(returnedAction.facets);
              }
            }
            fireResourceSelected = true;
            if (type == "MultiFlatmap") {
              const flatmap = this.$refs.multiflatmap.getCurrentFlatmap().mapImp;
              flatmap.clearSearchResults();
            }
          }
        } else if (resource.eventType == "mouseenter") {
          result.eventType = "highlighted";
          fireResourceSelected = true;
        }
      } else if (type == "Scaffold") {
        if (resource) {
          if (resource.data?.id === undefined || resource.data?.id === "") {
            resource.data.id = resource.data?.group;
          }
          result.internalName = resource.data.id;
          // Facet search if marker is clicked
          if (resource.data.lastActionOnMarker === true) {
            returnedAction = {
              type: "Facet",
              facets: [capitalise(resource.data.id)],
            };
          }
        }
        result.eventType = "selected";
        fireResourceSelected = true;
        action = "search";
      }
      if (returnedAction) EventBus.emit("PopoverActionClick", returnedAction);
      if (fireResourceSelected) this.$emit("resource-selected", result);
    },
    resourceHasAction: function (resource) {
      return (
        resource && (
          resource.type === "URL" ||
          resource.type === "Search" ||
          resource.type === "Neuron Search" ||
          resource.type == "Facet" ||
          resource.type == "Facets"
        )
      );
    },
    /**
     * Get the term to zoom/highlight in a synchronisation event,
     * if it cannot be found in the map, it will perform several
     * calls to try to ge a valid name/id.
     */
    getNameAndIdFromSyncData: async function (data) {
      let name = data.internalName;
      if (name === undefined && data.resource) {
        name = data.resource.label;
      }
      let id = undefined;
      if (data.resource && data.resource.resource) {
        id = data.resource.resource[0];
      }
      if (this.entry.type === "Scaffold") {
        const objects = this.$refs.scaffold.findObjectsWithGroupName(name);
        // If a region is not found use a hardcoded list to determine
        // its parents region first
        if (objects.length === 0) {
          //Use nerve mapping
          if (data.resource && data.resource.feature) {
            const matched = getNerveNames(data.resource.feature.models);
            if (matched.length > 0) return matched;
          }
          let matched = getParentsRegion(name);
          if (matched) {
            return matched;
          }
          // Hardcoded list failed - use an endpoint to find its parents
          if (id && data.eventType === "selected") {
            return fetch(`${this.apiLocation}get-related-terms/${id}`)
              .then(response => response.json())
              .then(data => {
                if (data.uberon?.array.length > 0) {
                  name =
                    data.uberon.array[0].name.charAt(0).toUpperCase() +
                    data.uberon.array[0].name.slice(1);
                  id = data.uberon.array[0].id.toUpperCase();
                  return { id, name };
                }
              });
          }
        }
      } else if (this.entry.type === "MultiFlatmap") {
        if (name === "Bladder") {
          name = "Urinary Bladder";
        } else {
          const matched = getNerveNames(name);
          if (matched.length > 0) name = matched[0];
        }
      }
      return { id, name };
    },
    // Get the species and andaotmy info for the featured datasets
    getDatasetAnatomyInfo: function (identifier) {
      fetch(`${this.apiLocation}dataset_info/anatomy?identifier=${identifier}`)
        .then(response => response.json())
        .then(data => {
          const resultPayload = data.result[0];
          let markerCurie;
          try {
            markerCurie = resultPayload.anatomy.organ[0].curie;
          } catch (error) {
            markerCurie = undefined;
          }
          let markerDoi;
          try {
            markerDoi = resultPayload.item.curie;
          } catch (error) {
            markerDoi = undefined;
          }
          let markerSpecies;
          try {
            let index = 0;
            let found = false;
            while (!found && index < resultPayload.organisms.subject.length) {
              const entry = resultPayload.organisms.subject[index];
              if (entry.species) {
                markerSpecies = entry.species.name;
                found = true;
              }
              index += 1;
            }
          } catch (error) {
            markerSpecies = undefined;
          }
          // can test the featured marker by uncommenting the line below:
          // markerSpecies = "Rat"
          this.settingsStore.updateFeaturedMarker({
            identifier,
            marker: markerCurie,
            doi: markerDoi,
            species: markerSpecies,
          });
        });
    },
    // Check if the old featured dataset api has any info
    oldFeaturedDatasetApiHasInfo: async function () {
      let response = await fetch(`${this.apiLocation}get_featured_datasets_identifiers`)
      let data = await response.json()
      if (!data.identifiers || data.identifiers.length == 0) {
        return false;
      } else {
        return data.identifiers;
      }
    },
    // Check if the new featured dataset api has any info
    newFeaturedDatasetApiHasInfo: async function () {
      let response = await fetch(`${this.apiLocation}get_featured_dataset`)
      let data = await response.json()
      if (!data.datasets || data.datasets.length == 0) {
        return false;
      } else {
        return data.datasets.map(d => d.id);
      }
    },
    flatmapResourceSelected: function (type, resources) {
      this.resourceSelected(type, resources);

      const firstResource = resources[0];
      const { eventType, feature } = firstResource;
      const { viewingMode } = this.settingsStore.globalSettings;

      if (eventType === 'click' && feature.type === 'feature' && feature.models?.startsWith('ilxtr:')) {
        // Use only models data for GA tagging
        // There is character limit (100 characters) for event parameter value in GA
        const categories = [];
        resources.forEach(resource => {
          const { models } = resource.feature;
          categories.push(models);
        });

        Tagging.sendEvent({
          'event': 'interaction_event',
          'event_name': 'portal_maps_connectivity',
          'category': categories.join(', '),
          "location": type + ' ' + viewingMode
        });
      }
    },
    /**
     * Get a list of featured datasets to display.
     */
    getFeaturedDatasets: async function () {
      let datasetIds = [];

      // Check the two api endpoints for featured datasets, old one first
      let oldInfo = await this.oldFeaturedDatasetApiHasInfo();
      if (oldInfo) datasetIds = oldInfo;
      else {
        let newInfo = await this.newFeaturedDatasetApiHasInfo();
        if (newInfo) datasetIds = newInfo;
      }
      // Update the store with the new list of featured datasets
      this.settingsStore.updateFeatured(datasetIds);
      datasetIds.forEach(element => {
        this.getDatasetAnatomyInfo(element)
      });
    },
    flatmapMarkerUpdate() {
      return;
    },
    onResize: function () {
      return;
    },
    updateViewerSettings: function() {
      return;
    },
    startHelp: function () {
      if (this?.alive) {
        if (this.isInHelp === false) {
          this.helpMode = true;
          window.addEventListener("mousedown", this.checkEndHelpMouseDown);
          this.isInHelp = true;
        }
      }
    },
    endHelp: function () {
      window.removeEventListener("mousedown", this.checkEndHelpMouseDown);
      this.helpMode = false;
      setTimeout(() => {
        this.isInHelp = false;
      }, 200);
    },
    onHelpModeShowNext: function () {
      this.helpModeActiveItem += 1;
    },
    onHelpModeLastItem: function (isLastItem) {
      if (isLastItem) {
        this.helpModeLastItem = true;
      }
    },
    onFinishHelpMode: function () {
      this.helpMode = false;
      // reset help mode to default values
      this.helpModeActiveItem = 0;
      this.helpModeLastItem = false;
    },
    onTooltipShown: function () {
      if (this.$refs.multiflatmap && this.$refs.multiflatmapHelp) {
        this.$refs.multiflatmapHelp.toggleTooltipHighlight();
      }

      if (this.$refs.flatmap && this.$refs.flatmapHelp) {
        this.$refs.flatmapHelp.toggleTooltipHighlight();
      }

      if (this.$refs.scaffold && this.$refs.scaffoldHelp) {
        this.$refs.scaffoldHelp.toggleTooltipHighlight();
      }
    },
    onMapTooltipShown: function () {
      if (this.$refs.multiflatmap && this.$refs.multiflatmapHelp) {
        this.$refs.multiflatmapHelp.toggleTooltipPinHighlight();
      }

      if (this.$refs.flatmap && this.$refs.flatmapHelp) {
        this.$refs.flatmapHelp.toggleTooltipPinHighlight();
      }

      if (this.$refs.scaffold && this.$refs.scaffoldHelp) {
        this.$refs.scaffoldHelp.toggleTooltipPinHighlight();
      }
    },
    /**
     * End help-mode only if user clicks outside of help mode dialog.
     */
    checkEndHelpMouseDown: function (e) {
      const el = e.target;
      if (!el.closest('.help-mode-dialog')) {
        this.endHelp();
      }
    },
    flatmapHighlight: async function (flatmap, hoverAnatomies, hoverDOI, hoverConnectivity) {
      let toHighlight = [...hoverAnatomies, ...hoverConnectivity];
      const globalSettings = this.settingsStore.globalSettings;

      // to highlight connected paths
      if (globalSettings.highlightConnectedPaths) {
        const hoverEntry = hoverAnatomies.length ? hoverAnatomies :
          hoverConnectivity.length ? hoverConnectivity :
            []
        const connectedPaths = await flatmap.retrieveConnectedPaths(hoverEntry);
        if (connectedPaths) {
          toHighlight.push(...connectedPaths);
        }
      }

      // to highlight related paths from reference DOI
      if (globalSettings.highlightDOIPaths) {
        const connectionsFromDOI = await flatmap.searchConnectivitiesByReference(hoverDOI);
        if (connectionsFromDOI) {
          toHighlight.push(...connectionsFromDOI);
        }
      }
      toHighlight = [...new Set(toHighlight)];
      return toHighlight;
    },
    sidebarHoverHighlight: function (payload) {
      if (this.visible && (
        ((this.flatmapRef || this.multiflatmapRef) && this.flatmapReady) ||
        (this.scaffoldRef && this.scaffoldLoaded))
      ) {
        const hoverAnatomies = this.settingsStore.hoverAnatomies;
        const hoverOrgans = this.settingsStore.hoverOrgans;
        const hoverDOI = this.settingsStore.hoverDOI;
        const hoverConnectivity = this.settingsStore.hoverConnectivity;

        let flatmap = null;
        let scaffold = null;
        if (this.flatmapRef) flatmap = this.flatmapRef;
        if (this.multiflatmapRef) flatmap = this.multiflatmapRef.getCurrentFlatmap();
        if (this.scaffoldRef) scaffold = this.scaffoldRef;

        // reset
        clearTimeout(this.highlightDelay);
        if (!hoverAnatomies.length && !hoverOrgans.length && !hoverDOI && !hoverConnectivity.length) {
          if ((this.multiflatmapRef || this.flatmapRef) && flatmap) {
            if (flatmap.mapImp && !flatmap.mapImp.contextLost) {
              flatmap.mapImp?.clearSearchResults();
              if (payload.connectivityProcessed) {
                // grey out all connectivity if no search results
                flatmap.mapImp?.setPaint({ dimmed: true })
              }
            }
          } else if (this.scaffoldRef && scaffold) {
            scaffold.changeHighlightedByName(hoverOrgans, "", false);
          }
        }

        this.highlightDelay = setTimeout(() => {
          if (hoverAnatomies.length || hoverOrgans.length || hoverDOI || hoverConnectivity.length) {
            if ((this.multiflatmapRef || this.flatmapRef) && flatmap) {
              this.flatmapHighlight(flatmap, hoverAnatomies, hoverDOI, hoverConnectivity).then((paths) => {
                try {
                  flatmap.showConnectivityTooltips({
                    connectivityInfo: { featureId: paths },
                    data: []
                  });
                } catch (error) {
                  console.log(error)
                  // only for connectivity hover highlight
                  if (hoverConnectivity.length && flatmap.mapImp) {
                    const uuid = flatmap.mapImp.uuid;
                    const found = paths.every((path) =>
                      this.connectivityKnowledge[uuid].some((connectivity) =>
                        connectivity.id === path
                      )
                    );
                    if (!found) {
                      if (flatmap.mapImp && !flatmap.mapImp.contextLost) {
                        flatmap.mapImp.clearSearchResults();
                      }
                    }
                  }
                }
              });
            } else if (this.scaffoldRef && scaffold) {
              scaffold.changeHighlightedByName(hoverOrgans, "", false);
            }
          }
        }, 100);
      }
    },
    onAnnotationOpen: function (payload) {
      EventBus.emit('annotation-open', payload);
    },
    onAnnotationClose: function () {
      EventBus.emit('sidebar-annotation-close');
    },
    updateOfflineAnnotationEnabled: function (payload) {
      EventBus.emit('update-offline-annotation-enabled', payload);
    },
    onConnectivityInfoOpen: function (connectivityInfoData) {
      EventBus.emit('connectivity-info-open', connectivityInfoData);
    },
    onConnectivityError: function (errorInfo) {
      EventBus.emit('connectivity-error', errorInfo);
    },
    onConnectivityInfoClose: function () {
      EventBus.emit('connectivity-info-close');
    },
    onSidebarAnnotationClose: function() {
      return;
    },
    onNeuronConnectionFeatureClick: function (payload) {
      EventBus.emit('neuron-connection-feature-click', payload);
    },
    showConnectivity: function() {
      return;
    },
    showConnectivityTooltips: function () {
      return;
    },
    setVisibilityFilter: function() {
      return;
    },
    loadExplorerConfig: async function () {
      this.flatmapService = await this.mockUpFlatmapService();
      this.loadConnectivityExplorerConfig(this.flatmapService);
    },
    mockUpFlatmapService: async function() {
      const flatmapResponse = await fetch(this.flatmapAPI);
      const flatmapJson = await flatmapResponse.json();
      const latestFlatmap = flatmapJson
        .filter(f => f.id === 'human-flatmap_male')
        .sort((a, b) => b.created.localeCompare(a.created))[0];
      const flatmapUuid = latestFlatmap.uuid;
      const flatmapSource = latestFlatmap.sckan['knowledge-source'];
      const pathwaysResponse = await fetch(`${this.flatmapAPI}/flatmap/${flatmapUuid}/pathways`);
      const pathwaysJson = await pathwaysResponse.json();

      this.flatmapQueries = markRaw(new FlatmapQueries());
      this.flatmapQueries.initialise(this.flatmapAPI);

      const mapImp = {
        'mapMetadata': {
          'uuid': flatmapUuid,
          'connectivity': {
            ...latestFlatmap.sckan,
          },
        },
        'pathways': pathwaysJson,
        'resource': this.entry.resource,
        knowledgeSource: flatmapSource,
        queryKnowledge : async (keastId) => {
          const sql = 'select knowledge from knowledge where (source=? or source is null) and entity=? order by source desc';
          const params = [flatmapSource, keastId];
          const response = await this.flatmapQueries.queryKnowledge(sql, params);
          return JSON.parse(response);
        },
        queryLabels : async (entities) => {
          const sql = `select source, entity, knowledge from knowledge where (source=? or source is null) and entity in (?${', ?'.repeat(entities.length-1)}) order by entity, source desc`;
          const params = [flatmapSource, ...entities];
          const response = await this.flatmapQueries.queryKnowledge(sql, params);
          const entityLabels = [];
          let last_entity;
          for (const row of response) {
              if (row[1] !== last_entity) {
                  const knowledge = JSON.parse(row[2]);
                  entityLabels.push({
                      entity: row[1],
                      label: knowledge['label'] || row[1]
                  })
                  last_entity = row[1];
              }
          }
          return entityLabels;
        },
      };

      const scaffoldFilterOptions = getScaffoldFilterOptions();
      const combinedFilterOptions = async (flatmapImp, providedKnowledge) => {
        const providedPathways = undefined;
        const flatmapFilterOptions = await getFlatmapFilterOptions(this.flatmapAPI, flatmapImp, providedKnowledge, providedPathways);
        return [...scaffoldFilterOptions, ...flatmapFilterOptions];
      };

      return {
        'mockup': true,
        getFilterOptions: combinedFilterOptions,
        getTermNerveMaps: getTermNerveMaps,
        'mapImp': mapImp,
      }
    },
    loadConnectivityExplorerConfig: async function (flatmap) {
      const flatmapImp = flatmap.mapImp;
      const sckanVersion = getKnowledgeSource(flatmapImp);
      const uuid = flatmap.mockup ? flatmapImp.resource : flatmapImp.uuid;
      let validNerves = [];

      if (!this.connectivityKnowledge[sckanVersion]) {
        this.flatmapQueries = markRaw(new FlatmapQueries());
        this.flatmapQueries.initialise(this.flatmapAPI);
        const knowledge = await loadAndStoreKnowledge(flatmapImp, this.flatmapQueries);
        this.connectivityKnowledge[sckanVersion] = knowledge
          .filter(item => item.connectivity?.length)
          .sort((a, b) => a.label.localeCompare(b.label));
      }
      if (!this.connectivityKnowledge[uuid]) {
        const pathways = flatmapImp.pathways?.paths || {};
        this.connectivityKnowledge[uuid] = this.connectivityKnowledge[sckanVersion]
          .filter(item => item.id in pathways);
      }
      if (!this.connectivityFilterOptions[uuid] && !flatmap.mockup) {
        this.connectivityFilterOptions[uuid] = await flatmap.getFilterOptions(flatmapImp , this.connectivityKnowledge[uuid]);
      }
      if (flatmap.mockup) {
        const nerveMaps = flatmap.getTermNerveMaps() || {};
        // deep copy the connectivity knowledge
        // to avoid modifying the original data
        const deepCopyConnectivityKnowledge = JSON.parse(JSON.stringify(this.connectivityKnowledge[uuid]));
        this.connectivityKnowledge[uuid] = deepCopyConnectivityKnowledge
          .map((item) => {
            let payload = item;
            if (item.nerves?.length) {
              const terms = item.nerves.flat(Infinity);
              const nerveLabels = terms.reduce((acc, term) => {
                if (term in nerveMaps) {
                  acc.push(nerveMaps[term]);
                }
                return acc;
              }, []);
              if (nerveLabels?.length) {
                validNerves.push(...nerveLabels);
                payload["nerve-label"] = nerveLabels.sort((a, b) => a.nerve.localeCompare(b.nerve));
              }
            }
            return payload;
          })
          .filter((item) => item["nerve-label"]);

        if (!this.connectivityFilterOptions[uuid]) {
          this.connectivityFilterOptions[uuid] = await flatmap.getFilterOptions(flatmapImp , this.connectivityKnowledge[uuid]);
        }

        validNerves = validNerves.map(nerve => nerve.nerve.toLowerCase());
        const deepCopyFilterOption = JSON.parse(JSON.stringify(this.connectivityFilterOptions[uuid]));
        this.connectivityFilterOptions[uuid] = deepCopyFilterOption
          .map((option) => {
            if (option.key === 'scaffold.connectivity.nerve') {
              const newChildren = option.children.filter((child) => validNerves.includes(child.label.toLowerCase()));
              return { ...option, children: newChildren };
            } else {
              return option;
            }
          })
      } else {
        if (!this.connectivityFilterSources[uuid]) {
          this.connectivityFilterSources[uuid] = flatmap.getFilterSources();
        }
        this.connectivitiesStore.updateFilterSources(this.connectivityFilterSources);
      }
      this.connectivitiesStore.updateFilterOptions(this.connectivityFilterOptions);
      this.connectivitiesStore.updateGlobalConnectivities(this.connectivityKnowledge);
      EventBus.emit('species-layout-connectivity-update');
    },
    knowledgeTooltipQuery: async function (data) {
      await this.flatmapQueries.retrieveFlatmapKnowledgeForEvent(this.flatmapService.mapImp, { resource: [data.id] });
      let tooltip = await this.flatmapQueries.createTooltipData(this.flatmapService.mapImp, {
        resource: [data.id],
        label: data.label,
        provenanceTaxonomy: data.taxons,
        feature: []
      })
      tooltip['knowledgeSource'] = getKnowledgeSource(this.flatmapService.mapImp);
      tooltip['mapId'] = this.flatmapService.mapImp.mapMetadata.id;
      tooltip['mapuuid'] = this.flatmapService.mapImp.mapMetadata.uuid;
      tooltip['nerve-label'] = data['nerve-label'];
      tooltip['ready'] = true;
      return tooltip;
    },
    getKnowledgeTooltip: async function (payload) {
      this.tooltipEntry = [];
      payload.data.forEach(d => this.tooltipEntry.push({ title: d.label, featureId: [d.id], ready: false }));
      EventBus.emit('connectivity-info-open', this.tooltipEntry);

      let prom1 = [];
      // While having placeholders displayed, get details for all paths and then replace.
      for (let index = 0; index < payload.data.length; index++) {
        prom1.push(await this.knowledgeTooltipQuery(payload.data[index]));
      }
      this.tooltipEntry = await Promise.all(prom1);
      const featureIds = this.tooltipEntry.map(tooltip => tooltip.featureId[0]);
      if (featureIds.length > 0) {
        EventBus.emit('connectivity-info-open', this.tooltipEntry);
      }
    },
    changeConnectivitySource: async function (payload, ongoingSource) {
      const { entry, connectivitySource } = payload;
      const flatmapUUID = this?.flatmapService?.mapImp?.mapMetadata.uuid;
      if (!ongoingSource.includes(flatmapUUID)) {
        ongoingSource.push(flatmapUUID);
        await this.flatmapQueries.queryForConnectivityNew(this.flatmapService.mapImp, entry.featureId[0], connectivitySource);
        this.tooltipEntry = this.tooltipEntry.map((tooltip) => {
          if (tooltip.featureId[0] === entry.featureId[0]) {
            return this.flatmapQueries.updateTooltipData(tooltip);
          }
          return tooltip;
        })
        EventBus.emit('connectivity-info-open', this.tooltipEntry);
      }
    },
    trackEvent: function (data) {
      Tagging.sendEvent(data);
    },
  },
  data: function () {
    return {
      apiLocation: undefined,
      activeSpecies: defaultSpecies,
      scaffoldCamera: undefined,
      mainStyle: {
        height: this.entry.datasetTitle ? "calc(100% - 30px)" : "100%",
        width: "100%",
        bottom: "0px",
      },
      helpMode: false,
      helpModeActiveItem: 0,
      helpModeLastItem: false,
      multiflatmapRef: null,
      flatmapRef: null,
      scaffoldRef: null,
      scaffoldLoaded: false,
      isInHelp: false,
      mapManager: undefined,
      connectivityKnowledge: {},
      connectivityFilterOptions: {},
      connectivityFilterSources: {},
      highlightDelay: undefined,
      alive: true,
      flatmapService: undefined,
      flatmapQueries: undefined,
      tooltipEntry: [],
    };
  },
  created: function () {
    this.flatmapAPI = undefined;
    this.apiLocation = undefined;
    if (this.settingsStore.flatmapAPI)
      this.flatmapAPI = this.settingsStore.flatmapAPI;
    if (this.settingsStore.sparcApi)
      this.apiLocation = this.settingsStore.sparcApi;
    if (this.settingsStore.mapManager) {
      this.mapManager = this.settingsStore.mapManager;
    }
  },
  watch: {
    helpMode: function (newVal) {
      if (!newVal) {
        this.helpModeActiveItem = 0;
      }
    }
  },
};
