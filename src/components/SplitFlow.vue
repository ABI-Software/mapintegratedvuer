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
          :activeId="activeDockedId"
          :open-at-start="startUp"
          @actionClick="actionClick"
          @tabClicked="tabClicked"
          @search-changed="searchChanged($event)"
          @contextUpdate="contextUpdate($event)"
        />
        <SplitDialog
          :entries="entries"
          ref="splitdialog"
          @resource-selected="resourceSelected"
        />
      </div>
    </el-main>
  </el-container>
</template>

<script>
/* eslint-disable no-alert, no-console */
import Tagging from '../services/tagging.js'
import DialogToolbarContent from "./DialogToolbarContent.vue";
import EventBus from "./EventBus";
import SplitDialog from "./SplitDialog.vue";
// import contextCards from './context-cards'
import { SideBar } from "@abi-software/map-side-bar";
import { capitalise, getNewMapEntry, initialDefaultState } from "./scripts/utilities.js";
import { mapStores } from 'pinia';
import { useEntriesStore } from '../stores/entries';
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
          }
        } else if (action.type == "URL") {
          window.open(action.resource, "_blank");
        } else if (action.type == "Facet") {
          if (this.$refs.sideBar) {
            this.$refs.sideBar.addFilter(action);
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
            this.$refs.sideBar.openSearch(facets, "");

            // GA Tagging
            // Event tracking for map action search/filter data
            Tagging.sendEvent({
              'event': 'interaction_event',
              'event_name': 'portal_maps_action_filter',
              'category': 'filter',
              'location': 'map_popup_data'
            });
          }
        } else {
          this.createNewEntry(action);
        }
      }
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
      const unique = new Set(suggestions);
      suggestions.length = 0;
      for (const item of unique) {
        suggestions.push({"value": "\"" + item +"\""});
      }
      payload.data.cb(suggestions);
    },
    searchChanged: function (data) {
      if (data && data.type == "query-update") {
        this.search = data.value;
        if (this.search) {
          // GA Tagging
          // Event tracking for map action search/filter data
          Tagging.sendEvent({
            'event': 'interaction_event',
            'event_name': 'portal_maps_action_search',
            'category': this.search,
            'location': 'map_sidebar_search'
          });
        }
      }
      if (data && data.type == "filter-update") {
        this.settingsStore.updateFacets(data.value);
        // GA Tagging
        // Event tracking for map action search/filter data
        Tagging.sendEvent({
          'event': 'interaction_event',
          'event_name': 'portal_maps_action_filter',
          'category': 'filter',
          'location': 'map_sidebar_filter'
        });
      }
      if (data && data.type == "available-facets") {
        this.settingsStore.updateFacetLabels(data.value.labels);
        this.settingsStore.updateMarkers(data.value.uberons);
        EventBus.emit("markerUpdate");
      }
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
        this.$refs.sideBar.openSearch(facets, query);
      }
      this.startUp = false;
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
    tabClicked: function (id) {
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
    }
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
    EventBus.on("OpenNewMap", type => {
      this.openNewMap(type);
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
