import { markRaw } from "vue";
import {
  getNerveNames,
  getParentsRegion,
} from "../components/SimulatedData.js";
import EventBus from "../components/EventBus";
import markerZoomLevels from "../components/markerZoomLevelsHardCoded.js";
import { mapStores } from 'pinia';
import { useSettingsStore } from '../stores/settings';
import { useSplitFlowStore } from '../stores/splitFlow';
import Tagging from '../services/tagging.js';

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
  computed: {
    ...mapStores(useSettingsStore, useSplitFlowStore),
    idNamePair() {
      return this.splitFlowStore.idNamePair;
    },
    syncMode() {
      return this.splitFlowStore.syncMode;
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
  },
  mounted: function () {
    EventBus.on("startHelp", () => {
      this.startHelp();
    });

    this.multiflatmapRef = this.$refs.multiflatmap;
    this.flatmapRef = this.$refs.flatmap;
    this.scaffoldRef = this.$refs.scaffold;
  },
  methods: {
    toggleSyncMode: function () {
      return;
    },
    getState: function () {
      return undefined;
    },
    openMap: function (type) {
      if (type === "SYNC") {
        this.toggleSyncMode();
        this.trackOpenMap('toggle_map_sync_mode');
      } else {
        EventBus.emit("OpenNewMap", type);
        this.trackOpenMap(`open_new_${type}_map`);
      }

      this.onConnectivityInfoClose();
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
    resourceSelected: function (type, resource) {
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
        resource: resource,
        internalName: undefined,
        eventType: undefined,
      };

      if (type == "MultiFlatmap" || type == "Flatmap") {
        result.internalName = this.idNamePair[resource.feature.models];
        if (resource.eventType == "click") {
          result.eventType = "selected";
          if (resource.feature.type == "marker") {
            let label = this.idNamePair[resource.feature.models];
            let hardcodedAnnotation = markerZoomLevels.filter(
              mz => mz.id === resource.feature.models
            );

            if (
              this.settingsStore.isFeaturedMarkerIdentifier(
                resource.feature.id
              )
            ) {
              // It is a featured dataset search for DOI.
              returnedAction = {
                type: "Search",
                term: this.settingsStore.featuredMarkerDoi(
                  resource.feature.id
                ),
                featuredDataset: true,
              };
            } else if (hardcodedAnnotation.filter(h => h.keyword).length > 0) {
              // if it matches our stored keywords, it is a keyword search
              // Keyword searches do not contain labels, so switch to keyword search if no label exists
              returnedAction = {
                type: "Search",
                term:
                  "http://purl.obolibrary.org/obo/" +
                  resource.feature.models.replace(":", "_"),
              };
            } else {
              // Facet search on anatomy if it is not a keyword search
              returnedAction = {
                type: "Facet",
                facet: label,
                facetPropPath: "anatomy.organ.category.name",
                term: "Anatomical structure",
              };
            }

            fireResourceSelected = true;
            if (type == "MultiFlatmap") {
              const flatmap =
                this.$refs.multiflatmap.getCurrentFlatmap().mapImp;
              flatmap.clearSearchResults();
            }
          } else if (resource.feature.type == "feature") {
            // Do no open scaffold in sync map
            if (this.syncMode) {
              fireResourceSelected = true;
            } else {
              action = "scaffold";
            }
          }
        } else if (resource.eventType == "mouseenter") {
          result.eventType = "highlighted";
          fireResourceSelected = true;
        }
      } else if (type == "Scaffold") {
        if (resource && resource[0]) {
          if (resource[0].data?.id === undefined || resource[0].data?.id === "") {
            resource[0].data.id = resource[0].data?.group;
          }
          result.internalName = resource[0].data.id;
          // Facet search if marker is clicked
          if (resource[0].data.lastActionOnMarker === true) {
            returnedAction = {
              type: "Facet",
              facet: capitalise(resource[0].data.id),
              facetPropPath: "anatomy.organ.category.name",
              term: "Anatomical structure",
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
        resource.type === "URL" ||
        resource.type === "Search" ||
        resource.type === "Neuron Search" ||
        resource.type == "Facet" ||
        resource.type == "Facets"
      );
    },
    /**
     * Check if this viewer is currently visible
     */
     isVisible: function() {
      const paneName = this.splitFlowStore.getPaneNameById(this.entry.id);
      return paneName !== undefined;
    },
    displayTooltip: function() {
      return;
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
                if (data.uberon.array.length > 0) {
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
    zoomToFeatures: function () {
      return;
    },
    handleSyncMouseEvent: async function (data) {
      let info = await this.getNameAndIdFromSyncData(data);
      if (data.eventType === "highlighted") {
        this.highlightFeatures(info);
      } else if (data.eventType === "selected") {
        this.displayTooltip(info);
        //this.zoomToFeatures(info, true);
      }
    },
    /**
     * Handle sync pan zoom event
     */
    handleSyncPanZoomEvent: function () {
      return;
    },
    highlightFeatures: function () {
      return;
    },
    receiveSynchronisedEvent: async function (data) {
      if (data.paneIndex !== this.entry.id) {
        if (data.eventType == "panZoom") {
          //this.handleSyncPanZoomEvent(data);
        } else {
          this.handleSyncMouseEvent(data);
        }
      } else {
        if (data.eventType == "selected") {
          let info = await this.getNameAndIdFromSyncData(data);
          this.zoomToFeatures(info, false);
        }
      }
    },
    requestSynchronisedEvent: function () {
      return;
    },
    flatmapMarkerUpdate() {
      return;
    },
    onResize: function () {
      return;
    },
    startHelp: function () {
      if (this.isInHelp === false) {
        this.helpMode = true;
        window.addEventListener("mousedown", this.checkEndHelpMouseDown);
        this.isInHelp = true;
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
    mapHoverHighlight: function (mapImp) {
      if (this.visible) {
        const hoverAnatomies = this.settingsStore.hoverAnatomies;
        const hoverOrgans = this.settingsStore.hoverOrgans;
        if (hoverAnatomies.length || hoverOrgans.length) {
          clearTimeout(this.hoverDelay);
          if (this.multiflatmapRef || this.flatmapRef) {
            mapImp?.zoomToFeatures(hoverAnatomies, { noZoomIn: true });
          } else if (this.scaffoldRef) {
            mapImp?.changeHighlightedByName(hoverOrgans, "", false);
          }
        } else {
          this.hoverDelay = setTimeout(() => {
            if (this.multiflatmapRef || this.flatmapRef) {
              mapImp?.clearSearchResults();
            } else if (this.scaffoldRef) {
              mapImp?.changeHighlightedByName(hoverOrgans, "", false);
            }
          }, 500);
        }
      }
    },
    onAnnotationOpen: function (payload) {
      EventBus.emit('annotation-open', payload);
    },
    onAnnotationClose: function () {
      EventBus.emit('annotation-close');
    },
    onConnectivityInfoOpen: function (connectivityInfoData) {
      EventBus.emit('connectivity-info-open', connectivityInfoData);
    },
    onConnectivityInfoClose: function () {
      EventBus.emit('connectivity-info-close');
    },
  },
  data: function () {
    return {
      apiLocation: undefined,
      activeSpecies: "Human Male",
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
      hoverDelay: undefined,
    };
  },
  created: function () {
    this.flatmapAPI = undefined;
    this.apiLocation = undefined;
    if (this.settingsStore.flatmapAPI)
      this.flatmapAPI = this.settingsStore.flatmapAPI;
    if (this.settingsStore.sparcApi)
      this.apiLocation = this.settingsStore.sparcApi;
  },
  watch: {
    helpMode: function (newVal) {
      if (!newVal) {
        this.helpModeActiveItem = 0;
      }
    }
  },
};
