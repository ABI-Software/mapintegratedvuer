<template>
  <el-container style="height: 100%; background: white">
    <el-header
      ref="header"
      style="text-align: left; font-size: 14px; padding: 0"
      height="32px"
      class="dialog-header"
    >
      <DialogToolbarContent
        :numberOfEntries="entries.length"
        @onFullscreen="onFullscreen"
        @local-search="onDisplaySearch"
        @fetch-suggestions="fetchSuggestions"
        ref="dialogToolbar"
      />
    </el-header>
    <el-main class="dialog-main">
      <div
        style="width: 100%; height: 100%; position: relative; overflow: hidden"
      >
        <SideBar
          ref="sideBar"
          :envVars="envVars"
          :visible="sideBarVisibility"
          :class="['side-bar', { 'start-up': startUp }]"
          :activeTabId="activeDockedId"
          :open-at-start="startUp"
          :annotationEntry="annotationEntry"
          :createData="createData"
          :connectivityInfo="connectivityInfo"
          @tab-close="onSidebarTabClose"
          @actionClick="actionClick"
          @tabClicked="tabClicked"
          @search-changed="searchChanged($event)"
          @anatomy-in-datasets="updateMarkers($event)"
          @annotation-submitted="onAnnotationSubmitted"
          @confirm-create="onConfirmCreate"
          @cancel-create="onCancelCreate"
          @confirm-delete="onConfirmDelete"
          @number-of-datasets-for-anatomies="updateScaffoldMarkers($event)"
          @hover-changed="hoverChanged($event)"
          @contextUpdate="contextUpdate($event)"
          @datalink-clicked="datalinkClicked($event)"
          @show-connectivity="onShowConnectivity"
          @connectivity-component-click="onConnectivityComponentClick"
        />
        <SplitDialog
          :entries="entries"
          ref="splitdialog"
          @resource-selected="resourceSelected"
          @species-changed="speciesChanged"
        />
      </div>
    </el-main>
  </el-container>
</template>

<script>
/* eslint-disable no-alert, no-console */
import { provide, markRaw } from 'vue'
import Tagging from '../services/tagging.js';
import DialogToolbarContent from "./DialogToolbarContent.vue";
import EventBus from "./EventBus";
import SplitDialog from "./SplitDialog.vue";
// import contextCards from './context-cards'
import { SideBar } from "@abi-software/map-side-bar";
import {
  capitalise,
  getNewMapEntry,
  initialDefaultState,
  intersectArrays,
} from "./scripts/utilities.js";
import { AnnotationService } from '@abi-software/sparc-annotation'
import { mapStores } from 'pinia';
import { useEntriesStore } from '../stores/entries';
import { useMainStore } from '../stores/index'
import { useSettingsStore } from '../stores/settings';
import { useSplitFlowStore } from '../stores/splitFlow';
import {
  ElContainer as Container,
  ElHeader as Header,
  ElMain as Main,
} from "element-plus";

import "@abi-software/map-side-bar/dist/style.css";

/**
 * Component of the floating dialogs.
 */
export default {
  name: "SplitFlow",
  components: {
    Container,
    Header,
    Main,
    DialogToolbarContent,
    SplitDialog,
    SideBar,
  },
  setup() {
    const mainStore = useMainStore();
    provide('userApiKey', mainStore.userToken);
    const settings = useSettingsStore();
    let annotator = markRaw(new AnnotationService(`${settings.flatmapAPI}annotator`));
    provide('$annotator', annotator)
    return { annotator }
  },
  props: {
    state: {
      type: Object,
      default: undefined,
    }
  },
  data: function () {
    return {
      sideBarVisibility: true,
      startUp: true,
      search: '',
      activeDockedId : 1,
      filterTriggered: false,
      availableFacets: [],
      connectivityInfo: null,
      annotationEntry: {},
      annotationCallback: undefined,
      confirmCreateCallback: undefined,
      cancelCreateCallback: undefined,
      confirmDeleteCallback: undefined,
      createData: {},
    }
  },
  watch: {
    state: {
      handler: function (value) {
        if (value) {
          if (!this._externalStateSet) this.setState(value);
          this._externalStateSet = true;
        }
      },
      immediate: true,
    },
  },
  methods: {
    /**
     * Callback when an action is performed (open new dialogs).
     */
    actionClick: function (action) {
      if (action) {
        if (action.type == "Search") {
          if (action.nervePath) {
            this.openSearch([action.filter], action.label);
          } else {
            this.openSearch([], action.term);
            // GA Tagging
            // Event tracking for map action search/filter data
            const eventName = action.featuredDataset
              ? 'portal_maps_featured_dataset_search'
              : 'portal_maps_action_search';
            Tagging.sendEvent({
              'event': 'interaction_event',
              'event_name': eventName,
              'category': action.term || 'filter',
              'location': 'map_location_pin'
            });
            this.filterTriggered = true;
          }
        } else if (action.type == "URL") {
          window.open(action.resource, "_blank");
        } else if (action.type == "Facet") {
          if (this.$refs.sideBar) {
            this.closeConnectivityInfo();
            this.$refs.sideBar.addFilter(action);
            const { facet } = action;
            // GA Tagging
            // Event tracking for map action search/filter data
            Tagging.sendEvent({
              'event': 'interaction_event',
              'event_name': 'portal_maps_action_filter',
              'category': facet || 'filter',
              'location': 'map_location_pin'
            });
            this.filterTriggered = true;
          }
        } else if (action.type == "Facets") {
          const facets = [];
          this.settingsStore.facets.species.forEach(e => {
            facets.push({
              facet: capitalise(e),
              term: "Species",
              facetPropPath: "organisms.primary.species.name",
            });
          });
          if (facets.length == 0)
            facets.push({
              facet: "Show All",
              term: "Species",
              facetPropPath: "organisms.primary.species.name",
            });
          facets.push(
            ...action.labels.map(val => ({
              facet: capitalise(val),
              term: "Anatomical structure",
              facetPropPath: "anatomy.organ.category.name",
            }))
          );
          if (this.$refs.sideBar) {
            this.closeConnectivityInfo();
            this.$refs.sideBar.openSearch(facets, "");

            const filterValuesArray = intersectArrays(this.availableFacets, action.labels);
            const filterValues = filterValuesArray.join(', ');
            // GA Tagging
            // Event tracking for map action search/filter data
            Tagging.sendEvent({
              'event': 'interaction_event',
              'event_name': 'portal_maps_action_filter',
              'category': filterValues || 'filter',
              'location': 'map_popup_button'
            });
          }
        } else {
          this.trackGalleryClick(action);
          this.createNewEntry(action);
        }
      }
    },
    trackGalleryClick: function (action) {
      const categoryValues = [];
      const { label, type, datasetId, discoverId, resource } = action;
      let filePath = '';
      let id = datasetId ? datasetId : discoverId;
      if (label) categoryValues.push(label);
      if (type) categoryValues.push(type);
      if (datasetId) categoryValues.push('(' + id + ')');
      if (resource) {
        if (type === "Plot") {
          filePath = resource.dataSource.url;
        } else {
          filePath = typeof resource === 'string' ? resource : resource.share_link;
        }
      }

      // GA Tagging
      // Event tracking for map sidebar gallery click
      Tagging.sendEvent({
        'event': 'interaction_event',
        'event_name': 'portal_maps_gallery_click',
        'category': categoryValues.join(' '),
        'location': 'map_sidebar_gallery',
        'dataset_id': id ? id + '' : '', // change to string format
        'file_path': filePath,
      });
    },
    onDisplaySearch: function (payload) {
      let searchFound = false;
      //Search all active viewers when global callback is on
      let splitdialog = this.$refs.splitdialog;
      if (splitdialog) {
        const activeContents = splitdialog.getActiveContents();
        activeContents.forEach(content => {
          if (content.search(payload.term)) {
            searchFound = true;
          }
        });
      }
      this.$refs.dialogToolbar.setFailedSearch(searchFound ? undefined : payload.term);

      // GA Tagging
      // Event tracking for map on display search
      Tagging.sendEvent({
        'event': 'interaction_event',
        'event_name': 'portal_maps_display_search',
        'category': payload.term,
        'location': 'map_toolbar'
      });
    },
    fetchSuggestions: function(payload) {
      const suggestions = [];
      //Search all active viewers when global callback is on
      let splitdialog = this.$refs.splitdialog;
      const activeContents = splitdialog.getActiveContents();
      //Push new suggestions into the pre-existing suggestions array
      activeContents.forEach(content => content.searchSuggestions(payload.data.term, suggestions));
      const parsed = [];
      //Remove double quote as it is used as a speical character
      suggestions.forEach(suggestion => {
        parsed.push(suggestion.replaceAll("\"", ""));
      });
      const unique = new Set(parsed);
      suggestions.length = 0;
      for (const item of unique) {
        suggestions.push({"value": "\"" + item +"\""});
      }
      payload.data.cb(suggestions);
    },
    /**
     * This event is emitted when the show connectivity button in sidebar is clicked.
     * This will move the map to the highlighted connectivity area.
     * @arg featureIds
     */
    onShowConnectivity: function (featureIds) {
      const splitFlowState = this.splitFlowStore.getState();
      const activeView = splitFlowState?.activeView || '';
      // offset sidebar only on singlepanel and 2horpanel views
      EventBus.emit('show-connectivity', {
        featureIds: featureIds,
        offset: activeView === 'singlepanel' || activeView === '2horpanel'
      });
    },
    onConnectivityComponentClick: function (data) {
      EventBus.emit('connectivity-component-click', {
        connectivityInfo: this.connectivityInfo,
        data: data,
      });
    },
    hoverChanged: function (data) {
      const hoverAnatomies = data && data.anatomy ? data.anatomy : [];
      const hoverOrgans = data && data.organs ? data.organs : [];
      this.settingsStore.updateHoverFeatures(hoverAnatomies, hoverOrgans);
      EventBus.emit("hoverUpdate");
    },
    searchChanged: function (data) {
      if (data && data.type == "query-update") {
        this.search = data.value;
        if (this.search && !this.filterTriggered) {
          // GA Tagging
          // Event tracking for map action search/filter data
          Tagging.sendEvent({
            'event': 'interaction_event',
            'event_name': 'portal_maps_action_search',
            'category': this.search,
            'location': 'map_sidebar_search'
          });
        }
        this.filterTriggered = false; // reset for next action
      }
      if (data && data.type == "filter-update") {
        this.settingsStore.updateFacets(data.value);

        // Remove filter event from maps' popup
        if (!this.filterTriggered) {
          const { value } = data;
          const filterValuesArray = value.filter((val) =>
            val.facet && val.facet.toLowerCase() !== 'show all'
          ).map((val) => val.facet);
          const filterValues = filterValuesArray.join(', ');

          // GA Tagging
          // Event tracking for map action search/filter data
          Tagging.sendEvent({
            'event': 'interaction_event',
            'event_name': 'portal_maps_action_filter',
            'category': filterValues || 'filter',
            'location': 'map_sidebar_filter'
          });
        }
        this.filterTriggered = false; // reset for next action
      }
    },
    updateMarkers: function (data) {
      this.settingsStore.updateMarkers(data);
      EventBus.emit("markerUpdate");
    },
    updateScaffoldMarkers: function (data) {
      this.settingsStore.updateNumberOfDatasetsForFacets(data);
    },
    getNewEntryId: function() {
      if (this.entries.length) {
        return (this.entries[this.entries.length - 1]).id + 1;
      }
      return 1;
    },
    /**
     * Activate Synchronised workflow
     */
    activateSyncMap: function (data) {
      let newEntry = {};
      Object.assign(newEntry, data);
      newEntry.mode = "normal";
      newEntry.id = this.getNewEntryId();
      newEntry.state = undefined;
      newEntry.type = "Scaffold";
      newEntry.discoverId = data.discoverId;
      newEntry.rotation = "free";
      if (data.layout == "2vertpanel") newEntry.rotation = "horizontal";
      else if (data.layout == "2horpanel") newEntry.rotation = "vertical";
      this.entriesStore.addNewEntry(newEntry);
      this.splitFlowStore.setSyncMode({
        flag: true,
        newId: newEntry.id,
        layout: data.layout,
      });
      return newEntry.id;
    },
    /**
     * Add new entry which will sequentially create a
     * new dialog.
     */
    createNewEntry: function (data) {
      let newEntry = {};
      newEntry.viewUrl = undefined;
      newEntry.state = undefined;
      Object.assign(newEntry, data);
      newEntry.mode = "normal";
      newEntry.id = this.getNewEntryId();
      newEntry.discoverId = data.discoverId;
      this.entriesStore.addNewEntry(newEntry);
      this.splitFlowStore.setIdToPrimaryPane(newEntry.id);
      if (this.splitFlowStore.syncMode) {
        this.splitFlowStore.setSyncMode({ flag: false });
      }

      //close sidebar on entry creation to see the context card
      if (this.$refs.sideBar) {
        this.$refs.sideBar.setDrawerOpen(false);
      }

      return newEntry.id;
    },
    openNewMap: async function (type) {
      const entry = await getNewMapEntry(type, this.settingsStore.sparcApi);
      this.createNewEntry(entry);
      if (entry.contextCard) {
        EventBus.emit("contextUpdate", entry.contextCard);
      }
    },
    openSearch: function (facets, query) {
      // Keep the species facets currently unused
      // let facets = [{facet: "All species", facetPropPath: 'organisms.primary.species.name', term:'species'}];
      // this.settingsStore.facets.species.forEach(e => {
      //   facets.push({facet: e, facetPropPath: 'organisms.primary.species.name', term:'species'});
      // });
      this.search = query;
      this._facets = facets;
      if (this.$refs && this.$refs.sideBar) {
        this.closeConnectivityInfo();
        this.$refs.sideBar.openSearch(facets, query);
      }
      this.startUp = false;
    },
    closeConnectivityInfo: function() {
      // close all opened popups on DOM
      const containerEl = this.$el;
      containerEl.querySelectorAll('.maplibregl-popup-close-button').forEach((el) => {
        el.click();
      });
    },
    onFullscreen: function (val) {
      this.$emit("onFullscreen", val);
    },
    resetApp: function () {
      this.setState(initialDefaultState());
    },
    setIdToPrimaryPane: function (id) {
      this.splitFlowStore.setIdToPrimaryPane(id);
    },
    setState: function (state) {
      this.entriesStore.setAll(state.entries);
      //Support both old and new permalink.
      if (state.splitFlow) this.splitFlowStore.setState(state.splitFlow);
      else this.entries.forEach(entry => this.splitFlowStore.setIdToPrimaryPane(entry.id));
    },
    getState: function () {
      let state = JSON.parse(JSON.stringify(this.entriesStore.$state));
      let splitdialog = this.$refs.splitdialog;
      let dialogStates = splitdialog.getContentsState();
      if (state.entries.length === dialogStates.length) {
        for (let i = 0; i < dialogStates.length; i++) {
          const entry = state.entries[i];
          entry.state = dialogStates[i];
          //We do not want to serialise the following properties
          if (entry.type === "Scaffold" && "viewUrl" in entry)
            delete entry.viewUrl;
          if (entry.type === "MultiFlatmap" && "uberonId" in entry)
            delete entry.uberonId;
        }
      }
      state.splitFlow = this.splitFlowStore.getState();
      return state;
    },
    removeEntry: function (id) {
      let index = this.entriesStore.findIndexOfId(id);
      this.entriesStore.destroyEntry(index);
    },
    resourceSelected: function (result) {
      this.$emit("resource-selected", result);
      if (this.splitFlowStore.globalCallback) {
        this.$refs.splitdialog.sendSynchronisedEvent(result);
      }
    },
    speciesChanged: function (species) {
      if (this.$refs.sideBar) {
        this.$refs.sideBar.close();
      }
    },
    tabClicked: function ({id, type}) {
      this.activeDockedId = id;
    },
    toggleSyncMode: function (payload) {
      if (payload) {
        if (payload.flag) {
          if (payload.action) {
            this.activateSyncMap(payload.action);
          }
        } else {
          if (this.splitFlowStore.syncMode) {
            this.splitFlowStore.setSyncMode({
              flag: false,
            });
          }
        }
      }
    },
    contextUpdate: function (payload) {
      EventBus.emit("contextUpdate", payload);
    },
    datalinkClicked: function (payload) {
      // payload is dataset URL
      const datasetURL = payload || '';
      const substringA = 'datasets/';
      const substringB = '?type=dataset';
      const datasetId = datasetURL.substring(
        datasetURL.indexOf(substringA) + substringA.length,
        datasetURL.indexOf(substringB)
      );

      // GA Tagging
      // Event tracking for map sidebar gallery dataset click
      Tagging.sendEvent({
        'event': 'interaction_event',
        'event_name': 'portal_maps_gallery_click',
        'category': datasetURL,
        'location': 'map_sidebar_gallery',
        'dataset_id': datasetId || ''
      });
    },
    onAnnotationSubmitted: function(annotation) {
      if (this.annotationCallback) {
        this.annotationCallback(annotation);
      }
    },
    onConfirmCreate: function(payload) {
      if (this.confirmCreateCallback) {
        this.confirmCreateCallback(payload);
      }
    },
    onCancelCreate: function() {
      if (this.cancelCreateCallback) {
        this.cancelCreateCallback();
      }
    },
    onConfirmDelete: function(payload) {
      if (this.confirmDeleteCallback) {
        this.confirmDeleteCallback(payload);
      }
    },
    onSidebarTabClose: function (id) {
      if (id === 2) EventBus.emit('connectivity-info-close');
      if (id === 3) EventBus.emit('annotation-close', { tabClose: true });
    },
    resetActivePathways: function () {
      const containerEl = this.$el;
      const activeCanvas = containerEl.querySelector('.maplibregl-canvas');
      if (activeCanvas) {
        activeCanvas.click();
      }
    },
  },
  created: function () {
    this._facets = [];
    this._externalStateSet = false;
  },
  mounted: function () {
    EventBus.on("RemoveEntryRequest", id => {
      this.removeEntry(id);
    });
    EventBus.on("SyncModeRequest", payload => {
      this.toggleSyncMode(payload);
    });
    EventBus.on("PopoverActionClick", payload => {
      this.actionClick(payload);
    });
    EventBus.on('annotation-open', payload => {
      this.annotationEntry = payload.annotationEntry;
      this.annotationCallback = markRaw(payload.commitCallback);
      if (!payload.createData) {
        this.createData = markRaw({});
      } else {
        this.createData = markRaw(payload.createData);
      }
      this.confirmCreateCallback = markRaw(payload.confirmCreate);
      this.cancelCreateCallback = markRaw(payload.cancelCreate);
      this.confirmDeleteCallback = markRaw(payload.confirmDelete);
      if (this.$refs.sideBar) {
        this.tabClicked({id: 3, type: 'annotation'});
        this.$refs.sideBar.setDrawerOpen(true);
      }
    });
    EventBus.on('annotation-close', payload => {
      this.tabClicked({id:  1, type: 'search'});
      this.annotationEntry = {};
      this.createData = {};
      if (this.$refs.sideBar) {
        this.$refs.sideBar.setDrawerOpen(false);
      }
    });
    EventBus.on('connectivity-info-open', payload => {
      this.connectivityInfo = payload;
      if (this.$refs.sideBar) {
        this.tabClicked({id: 2, type: 'connectivity'});
        this.$refs.sideBar.setDrawerOpen(true);
      }
    });
    EventBus.on('connectivity-info-close', payload => {
      this.tabClicked({id: 1, type: 'search'});
      this.connectivityInfo = null;
      this.resetActivePathways();
    });
    EventBus.on('connectivity-graph-error', payload => {
      if (this.$refs.sideBar) {
        this.$refs.sideBar.updateConnectivityGraphError(payload.data);
      }
    });
    EventBus.on("OpenNewMap", type => {
      this.openNewMap(type);
    });
    EventBus.on("startHelp", () => {
      if (this.$refs.sideBar) {
        this.$refs.sideBar.close();
      }
    });
    this.$nextTick(() => {
      if (this.search === "" && this._facets.length === 0) {
        if (this.$refs.sideBar) {
          this.$refs.sideBar.close();
        }
        setTimeout(() => {
          this.startUp = false;
        }, 2000);
      } else this.openSearch(this._facets, this.search);
    });
  },
  computed: {
    ...mapStores(useEntriesStore, useSettingsStore, useSplitFlowStore),
    envVars: function () {
      return {
        API_LOCATION: this.settingsStore.sparcApi,
        ALGOLIA_INDEX: this.settingsStore.algoliaIndex,
        ALGOLIA_KEY: this.settingsStore.algoliaKey,
        ALGOLIA_ID: this.settingsStore.algoliaId,
        PENNSIEVE_API_LOCATION: this.settingsStore.pennsieveApi,
        NL_LINK_PREFIX: this.settingsStore.nlLinkPrefix,
        ROOT_URL: this.settingsStore.rootUrl,
        FLATMAPAPI_LOCATION: this.settingsStore.flatmapAPI2, // temporary
      };
    },
    entries: function() {
      return this.entriesStore.entries;
    },
  },
};
</script>

<style scoped lang="scss">
.dialog-header {
  color: #333;
  line-height: 20px;
  border-bottom: solid 0.7px #dcdfe6;
  background-color: #f5f7fa;
}

.dialog-main {
  padding: 0px;
  width: 100%;
  height: 100%;
}

.start-up {
  :deep(.el-drawer__open) {
    .el-drawer {
      &.rtl {
        animation: unset;
      }
    }
  }
  :deep(.el-drawer-fade-leave-active) {
    animation: unset;
  }
  :deep(.el-drawer) {
    &.rtl {
      animation: rtl-drawer-out 2s linear;
    }
  }

  :deep(.el-drawer__wrapper) {
    &.side-bar {
      display: block !important;
    }
  }
}

</style>
