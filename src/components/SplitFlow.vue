<template>
  <el-container style="height:100%;background:white;">
    <el-header ref="header" style="text-align: left; font-size: 14px;padding:0" height="32px" class="dialog-header">
      <DialogToolbarContent :activeId="activeDockedId" :numberOfEntries="entries.length"
        :topLevelControls=true
        :showIcons="entries[findIndexOfId(activeDockedId)].mode!=='main'"
        @onFullscreen="onFullscreen"
        :showHelpIcon="true"
      />
    </el-header>
    <el-main class="dialog-main">
      <div style="width:100%;height:100%;position:relative;overflow:hidden;">
        <SplitDialog :entries="entries" ref="splitdialog"
          @close="dialogClose(id)"
          @resource-selected="resourceSelected"
        />
        <SideBar ref="sideBar"
          :envVars="envVars"
          :visible="sideBarVisibility"
          :class="['side-bar', {'start-up': startUp }]"
          :activeId="activeDockedId"
          :open-at-start="startUp"
          @actionClick="actionClick"
          @tabClicked="tabClicked"
          @search-changed="searchChanged($event)"
        /> 
      </div>
    </el-main>
  </el-container>
</template>

<script>
/* eslint-disable no-alert, no-console */
import DialogToolbarContent from './DialogToolbarContent';
import EventBus from './EventBus';
import SplitDialog from './SplitDialog';
// import contextCards from './context-cards'
import { SideBar } from '@abi-software/map-side-bar';
import '@abi-software/map-side-bar/dist/map-side-bar.css';
import store from "../store";
import Vue from "vue";
import {
  Container,
  Header,
  Main
} from "element-ui";
Vue.use(Container);
Vue.use(Header);
Vue.use(Main);

var initialState = function() {
  return {
    mainTabName: "Flatmap",
    zIndex: 1,
    showDialogIcons: false, 
    activeDockedId: 1,
    currentCount: 1,
    entries: [
      {
        resource: "Rat",
        availableSpecies : {
          "Human Female":{id: "human-flatmap_female", iconClass:"mapicon-icon_human", displayWarning:true},
          "Human Male":{id: "human-flatmap_male", taxo: "NCBITaxon:9606", iconClass:"mapicon-icon_human", displayWarning:true},
          "Rat":{taxo: "NCBITaxon:10114", iconClass:"mapicon-icon_rat", displayLatestChanges: true},
          "Mouse":{taxo: "NCBITaxon:10090", iconClass:"mapicon-icon_mouse", displayWarning: true},
          "Pig":{taxo: "NCBITaxon:9823", iconClass:"mapicon-icon_pig", displayWarning: true},
          "Cat":{taxo: "NCBITaxon:9685", iconClass:"mapicon-icon_cat", displayWarning: true},
        },
        type: "MultiFlatmap",
        zIndex:1,
        mode: "main",
        id: 1,
        state: undefined,
        label: "",
        discoverId: undefined
      }
    ],
    sideBarVisibility: true,
    search: '',
    startUp: true
  }
}

const capitalise = term =>  {
  if (term)
    return term.charAt(0).toUpperCase() + term.slice(1);
  return term;
};
  

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
  props:{
    state: {
      type: Object,
      default: undefined
    },
  },
  methods: {
    /**
     * Callback when an action is performed (open new dialogs).
     */
    actionClick:function(action) {
      if (action) {
        if (action.type == "Search") {
          if (action.nervePath){
            this.$refs.sideBar.openSearch([action.filter], action.label);
          } else {
            // Keep the species facets currently unused
            // let facets = [{facet: "All species", facetPropPath: 'organisms.primary.species.name', term:'species'}];
            // store.state.settings.facets.species.forEach(e => {
            //   facets.push({facet: e, facetPropPath: 'organisms.primary.species.name', term:'species'});
            // });
            this.$refs.sideBar.openSearch([], action.term);
          }
        } else if (action.type == "URL"){
          window.open(action.resource, '_blank')
        } else if (action.type == "Facet") {
          this.$refs.sideBar.addFilter(action);
        } else if (action.type == "Facets") {
          const facets = [];
          store.state.settings.facets.species.forEach(e => {
            facets.push({facet: capitalise(e), term:'Species', facetPropPath: 'organisms.primary.species.name'});
          });
          if (facets.length == 0)
            facets.push({facet: "Show All", term:'Species', facetPropPath: 'organisms.primary.species.name'});
          facets.push(...action.labels.map(val =>({facet: capitalise(val), term: 'Anatomical structure', facetPropPath: 'anatomy.organ.name'})))
          this.$refs.sideBar.openSearch(facets, '');
        } else if (action.type == "Scaffold View"){
          this.updateEntry(action);
        }
          else {
          this.createNewEntry(action);
        }
      }
    },
    searchChanged: function(data) {
      if (data && (data.type == "filter-update")) {
        store.commit("settings/updateFacets", data.value);
      }
      if (data && data.type == "keyword-update") {
        store.commit("settings/updateMarkers", data.value);
        EventBus.$emit('markerUpdate');
      }
    },
    // updateEntry: Updates entry a scaffold entry with a viewUrl
    updateEntry(data){
      // 'Scaffold view' is sent in as 'Scaffold' to scaffoldvuer
      data.type = data.type === "Scaffold View" ? "Scaffold" : data.type;

      // Update the scaffold with a view url
      for (let i in this.entries){
        if (this.entries[i].resource === data.resource){
          this.entries[i].viewUrl = data.viewUrl ;
          Vue.set(this.entries, i, this.entries[i]); // Need this to keep arrays reactive
        }
      }
    },
    /**
     * Activate Synchronised workflow
     */
    activateSyncMap: function(data) {
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
      store.commit("splitFlow/setSyncMode", { flag: true, newId: newEntry.id,
        layout: data.layout });
      return newEntry.id;
    },
    /**
     * Add new entry which will sequentially create a
     * new dialog.
     */
    createNewEntry: function(data) {
      let newEntry = {};
      Object.assign(newEntry, data);
      newEntry.mode = "normal";
      newEntry.id = ++this.currentCount;
      newEntry.zIndex = ++this.zIndex; 
      newEntry.state = undefined;
      newEntry.discoverId = data.discoverId;
      newEntry.viewUrl = undefined;
      this.entries.push(newEntry);
      store.commit("splitFlow/setIdToPrimarySlot", newEntry.id);
      if (store.state.splitFlow.syncMode) {
        store.commit("splitFlow/setSyncMode", { flag: false });
      }
      return newEntry.id;
    },
    findIndexOfId: function(id) {
      for (let i = 0; i < this.entries.length; i++) {
        if (this.entries[i].id == id) {
          return i;
        }
      }
      return -1;
    },
    destroyDialog: function(id) {
      let index = this.findIndexOfId(id);
      if (index > -1) {
        this.entries.splice(index, 1);
      }
    },
    onFullscreen: function(val) {
      this.$emit("onFullscreen", val);
    },
    resetApp: function(){
      this.setState(initialState());
    },
    setState: function(state){
      this.mainTabName = state.mainTabName;
      this.zIndex = state.zIndex;
      this.showDialogIcons = state.showDialogIcons;
      this.activeDockedId = state.activeDockedId;
      this.entries = [];
      Object.assign(this.entries, state.entries);
      this.currentCount = state.currentCount;
      //Support both old and new permalink.
      if (state.splitFlow)
        store.commit("splitFlow/setState", state.splitFlow);
      else
        this.entries.forEach(entry => store.commit("splitFlow/setIdToPrimarySlot", entry.id));
    },
    getState: function() {
      let state = JSON.parse(JSON.stringify(this.$data));
      let splitdialog = this.$refs.splitdialog;
      let dialogStates = splitdialog.getContentsState();
      if (state.entries.length === dialogStates.length) {
        for (let i = 0; i < dialogStates.length; i++) {
          state.entries[i].state = dialogStates[i];
        }
      }
      state.splitFlow = store.getters["splitFlow/getState"]();
      return state;
    },
    removeEntry: function(id) {
      if (id !== 1) {
        let index = -1;
        for (let i = 0; this.entries.length && index === -1; i++) {
          if (this.entries[i].id === id)
            index = i;
        }
        this.entries.splice(index, 1);
      }
    },
    resourceSelected: function(result) {
      this.$emit("resource-selected", result);
      if (store.state.splitFlow.globalCallback) {
        this.$refs.splitdialog.sendSynchronisedEvent(result);
      }
    },
    tabClicked: function(id){
      this.activeDockedId = id
    },
    toggleSyncMode: function(payload) {
      if (payload) {
        if (payload.flag) {
          if (payload.action) {
            this.activateSyncMap(payload.action);
          }
        } else {
          if (store.state.splitFlow.syncMode) {
            store.commit("splitFlow/setSyncMode",
              { flag: false, entries: this.entries });
          }
        }
      }
    }
  },
  data: function() {
    return initialState();
  },
  watch: {
    state: {
      handler: function(value) {
        if (value) {
          if (!this.externalStateSet)
            this.setState(value);
          this.externalStateSet = true;
        }
      },
      immediate: true,
    }
  },
  created: function() {
    this.externalStateSet = false;
  },
  mounted: function() {
    EventBus.$on("RemoveEntryRequest", (id) => {
      this.removeEntry(id);
    });
    EventBus.$on("SyncModeRequest", (payload) => {
      this.toggleSyncMode(payload);
    });
    EventBus.$on("PopoverActionClick", (payload) => {
      this.actionClick(payload);
    });
    this.$nextTick(() => {
      this.$refs.sideBar.close();
      setTimeout(() => {
        this.startUp = false;
      }, 2000);
    });
  },
  computed: {
    envVars: function() {
      return {
        API_LOCATION: store.state.settings.sparcApi,
        ALGOLIA_INDEX: store.state.settings.algoliaIndex,
        ALGOLIA_KEY: store.state.settings.algoliaKey,
        ALGOLIA_ID: store.state.settings.algoliaId,
        PENNSIEVE_API_LOCATION: store.state.settings.pennsieveApi,
        NL_LINK_PREFIX: store.state.settings.nlLinkPrefix,
        ROOT_URL: store.state.settings.rootUrl
      }
    }
  }
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
  padding:0px;
  width:100%;
  height:100%;
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
      animation: rtl-drawer-out 2.0s linear;
    }
  }

  ::v-deep .el-drawer__wrapper {
    &.side-bar {
      display:block!important;
    }
  }
}

</style>
