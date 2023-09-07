<template>
  <el-container style="height: 100%; background: white">
    <el-header
      ref="header"
      style="text-align: left; font-size: 14px; padding: 0"
      height="32px"
      class="dialog-header"
    >
      <DialogToolbarContent
        :activeId="activeDockedId"
        :numberOfEntries="entries.length"
        :showIcons="entries[findIndexOfId(activeDockedId)].mode !== 'main'"
        @onFullscreen="onFullscreen"
        :showHelpIcon="true"
        @local-search="onDisplaySearch"
        @fetch-suggestions="fetchSuggestions"
        ref="dialogToolbar"
      />
    </el-header>
    <el-main class="dialog-main">
      <div
        style="width: 100%; height: 100%; position: relative; overflow: hidden"
      >
        <SplitDialog
          :entries="entries"
          ref="splitdialog"
          @close="dialogClose(id)"
          @resource-selected="resourceSelected"
        />
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
      </div>
    </el-main>
  </el-container>
</template>

<script>
/* eslint-disable no-alert, no-console */
import DialogToolbarContent from "./DialogToolbarContent";
import EventBus from "./EventBus";
import SplitDialog from "./SplitDialog";
// import contextCards from './context-cards'
import { SideBar } from "@abi-software/map-side-bar/src/components/index.js";
import { capitalise, getNewMapEntry, initialDefaultState } from "./scripts/utilities.js";
import store from "../store";
import Vue from "vue";
import { Container, Header, Main } from "element-ui";
Vue.use(Container);
Vue.use(Header);
Vue.use(Main);

/**
 * Component of the floating dialogs.
 */
export default {
  name: "SplitFlow",
  components: {
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
    return initialDefaultState();
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
          this.$refs.sideBar.addFilter(action);
        } else if (action.type == "Facets") {
          const facets = [];
          store.state.settings.facets.species.forEach(e => {
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
              facetPropPath: "anatomy.organ.name",
            }))
          );
          this.$refs.sideBar.openSearch(facets, "");
        } else if (action.type == "Scaffold View") {
          this.updateEntry(action);
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
      }
      if (data && data.type == "filter-update") {
        store.commit("settings/updateFacets", data.value);
      }
      if (data && data.type == "keyword-update") {
        store.commit("settings/updateMarkers", data.value);
        EventBus.$emit("markerUpdate");
      }
      if (data && data.type == "filter-label-update") {
        store.commit("settings/updateFacetLabels", data.value);
      }
    },
    // updateEntry: Updates entry a scaffold entry with a viewUrl
    updateEntry(data) {
      // 'Scaffold view' is sent in as 'Scaffold' to scaffoldvuer
      data.type = data.type === "Scaffold View" ? "Scaffold" : data.type;

      // Update the scaffold with a view url
      for (let i in this.entries) {
        if (this.entries[i].resource === data.resource) {
          this.entries[i].viewUrl = data.viewUrl;
          Vue.set(this.entries, i, this.entries[i]); // Need this to keep arrays reactive
        }
      }
    },
    /**
     * Activate Synchronised workflow
     */
    activateSyncMap: function (data) {
      let newEntry = {};
      Object.assign(newEntry, data);
      newEntry.mode = "normal";
      newEntry.id = ++this.currentCount;
      newEntry.zIndex = ++this.zIndex;
      newEntry.state = undefined;
      newEntry.type = "Scaffold";
      newEntry.discoverId = data.discoverId;
      newEntry.rotation = "free";
      if (data.layout == "2vertpanel") newEntry.rotation = "horizontal";
      else if (data.layout == "2horpanel") newEntry.rotation = "vertical";
      this.entries.push(newEntry);
      store.commit("splitFlow/setSyncMode", {
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
      newEntry.id = ++this.currentCount;
      newEntry.zIndex = ++this.zIndex;
      newEntry.discoverId = data.discoverId;
      this.entries.push(newEntry);
      this.setIdToPrimarySlot(newEntry.id);
      if (store.state.splitFlow.syncMode) {
        store.commit("splitFlow/setSyncMode", { flag: false });
      }
      return newEntry.id;
    },
    findIndexOfId: function (id) {
      for (let i = 0; i < this.entries.length; i++) {
        if (this.entries[i].id == id) {
          return i;
        }
      }
      return -1;
    },
    destroyDialog: function (id) {
      let index = this.findIndexOfId(id);
      if (index > -1) {
        this.entries.splice(index, 1);
      }
    },
    openNewMap: async function (type) {
      const entry = await getNewMapEntry(type, store.state.settings.sparcApi);
      this.createNewEntry(entry);
    },
    openSearch: function (facets, query) {
      // Keep the species facets currently unused
      // let facets = [{facet: "All species", facetPropPath: 'organisms.primary.species.name', term:'species'}];
      // store.state.settings.facets.species.forEach(e => {
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
    setIdToPrimarySlot: function (id) {
      store.commit("splitFlow/setIdToPrimarySlot", id);
    },
    setState: function (state) {
      this.mainTabName = state.mainTabName;
      this.zIndex = state.zIndex;
      this.showDialogIcons = state.showDialogIcons;
      this.activeDockedId = state.activeDockedId;
      this.entries = [];
      Object.assign(this.entries, state.entries);
      this.currentCount = state.currentCount;
      //Support both old and new permalink.
      if (state.splitFlow) store.commit("splitFlow/setState", state.splitFlow);
      else this.entries.forEach(entry => this.setIdToPrimarySlot(entry.id));
    },
    getState: function () {
      let state = JSON.parse(JSON.stringify(this.$data));
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
      state.splitFlow = store.getters["splitFlow/getState"]();
      return state;
    },
    removeEntry: function (id) {
      if (id !== 1) {
        let index = -1;
        for (let i = 0; this.entries.length && index === -1; i++) {
          if (this.entries[i].id === id) index = i;
        }
        this.entries.splice(index, 1);
      }
    },
    resourceSelected: function (result) {
      this.$emit("resource-selected", result);
      if (store.state.splitFlow.globalCallback) {
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
          if (store.state.splitFlow.syncMode) {
            store.commit("splitFlow/setSyncMode", {
              flag: false,
              entries: this.entries,
            });
          }
        }
      }
    },
    contextUpdate: function (payload) {
      EventBus.$emit("contextUpdate", payload);
    }
  },
  created: function () {
    this._facets = [];
    this._externalStateSet = false;
  },
  mounted: function () {
    EventBus.$on("RemoveEntryRequest", id => {
      this.removeEntry(id);
    });
    EventBus.$on("SyncModeRequest", payload => {
      this.toggleSyncMode(payload);
    });
    EventBus.$on("PopoverActionClick", payload => {
      this.actionClick(payload);
    });
    EventBus.$on("OpenNewMap", type => {
      this.openNewMap(type);
    });
    this.$nextTick(() => {
      if (this.search === "" && this._facets.length === 0) {
        this.$refs.sideBar.close();
        setTimeout(() => {
          this.startUp = false;
        }, 2000);
      } else this.openSearch(this._facets, this.search);
    });
  },
  computed: {
    envVars: function () {
      return {
        API_LOCATION: store.state.settings.sparcApi,
        ALGOLIA_INDEX: store.state.settings.algoliaIndex,
        ALGOLIA_KEY: store.state.settings.algoliaKey,
        ALGOLIA_ID: store.state.settings.algoliaId,
        PENNSIEVE_API_LOCATION: store.state.settings.pennsieveApi,
        NL_LINK_PREFIX: store.state.settings.nlLinkPrefix,
        ROOT_URL: store.state.settings.rootUrl,
      };
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
  ::v-deep .el-drawer__open {
    .el-drawer {
      &.rtl {
        animation: unset;
      }
    }
  }
  ::v-deep .el-drawer-fade-leave-active {
    animation: unset;
  }
  ::v-deep .el-drawer {
    &.rtl {
      animation: rtl-drawer-out 2s linear;
    }
  }

  ::v-deep .el-drawer__wrapper {
    &.side-bar {
      display: block !important;
    }
  }
}
</style>
