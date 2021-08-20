<template>
  <el-container style="height:100%;background:white;">
    <el-header ref="header" style="text-align: left; font-size: 14px;padding:0" height="32px" class="dialog-header">
      <DialogToolbarContent :activeId="activeDockedId" :dialogTitles="dockedArray"
        :topLevelControls=true
        :showIcons="entries[findIndexOfId(activeDockedId)].mode!=='main'"
        @close="dockedClose"
        @titleClicked="dockedTitleClicked" @onFullscreen="onFullscreen"
        :showHelpIcon="true"/>
    </el-header>
    <el-main class="dialog-main">
      <div style="width:100%;height:100%;position:relative;overflow:hidden;">
        <SplitDialog :entries="entries" ref="splitdialog"
          @close="dialogClose(id)"
          @resource-selected="resourceSelected"
          @flatmapChanged="flatmapChanged"
        />
        <SideBar ref="sideBar"
          :apiLocation="apiLocation" 
          :visible="sideBarVisibility"
          :class="['side-bar', {'start-up': startUp }]"
          :activeId="activeDockedId"
          :open-at-start="startUp"
          @actionClick="actionClick"
          @tabClicked="tabClicked"
        > 
        </SideBar>
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
    dockedArray: [{title: "Flatmap", id:1}, ],
    activeDockedId: 1,
    currentCount: 1,
    entries: [
      {
        resource: "Rat",
        availableSpecies : {
          "Human":{taxo: "NCBITaxon:9606", iconClass:"icon-mapicon_human", displayWarning: true},
          "Rat":{taxo: "NCBITaxon:10114", iconClass:"icon-mapicon_rat", displayWarning: false},
          "Mouse":{taxo: "NCBITaxon:10090", iconClass:"icon-mapicon_mouse", displayWarning: true},
          "Pig":{taxo: "NCBITaxon:9823", iconClass:"icon-mapicon_pig", displayWarning: true},
          "Cat":{taxo: "NCBITaxon:9685", iconClass:"icon-mapicon_cat", displayWarning: true},
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
          // Line below filters by flatmap species (unused until more data is available)
          // this.$refs.sideBar.openSearch(action.label, [{facet: speciesMap[this.entries[0].resource], term:'species'}] )
          this.$refs.sideBar.openSearch(action.label, [{facet: "All Species", term:'species'}] )
        } else if (action.type == "Facet") {
          // Line below filters by flatmap species (unused until more data is available)
          // this.$refs.sideBar.openSearch(action.label, [{facet: speciesMap[this.entries[0].resource], term:'species'}] )
          this.$refs.sideBar.openSearch('', [{facet: "All Species", term:'species'}, 
          {facet: action.label, term:'organ'}] )
        } else {
          this.createNewEntry(action);
        }
      }
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
      this.entries.push(newEntry);
      store.commit("splitFlow/setIdToPrimarySlot", newEntry.id);
      let title = newEntry.label ? newEntry.label + " ": '';
      title += newEntry.type;
      if (newEntry.datasetId) {
        title += " (" + newEntry.datasetId + ")";
      }
      this.dockedArray.push({title: title, id:newEntry.id, contextCard:newEntry.contextCard});
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
    dockDialog: function(id) {
      let index = this.findIndexOfId(id);
      if ((index > -1) && (this.findIndexOfDockedArray(id) == -1)) {
        let title = this.entries[index].type;
        if (this.entries[index].label)
          title = this.entries[index].label + " " +this.entries[index].type;
        this.dockedArray.push({title: title, id:this.entries[index].id});
      }
    },
    undockDialog: function(id) {
      let dockedIndex = this.findIndexOfDockedArray(id);
      if (dockedIndex > -1) {
        this.dockedArray.splice(dockedIndex, 1);
        this.bringDialogToFront(id);
      }
    },
    onFullscreen: function(val) {
      this.$emit("onFullscreen", val);
    },
    dialogClose: function(id) {
      this.destroyDialog(id);
    },
    dockedTitleClicked: function(id) {
      this.maximiseDialog(id);
    },
    dockedClose: function() {
      this.undockDialog(this.activeDockedId);
      this.destroyDialog(this.activeDockedId);
      this.activeDockedId = this.entries[0].id;
    },
    resetApp: function(){
      this.setState(initialState());
    },
    setState: function(state){
      this.mainTabName = state.mainTabName;
      this.zIndex = state.zIndex;
      this.showDialogIcons = state.showDialogIcons;
      this.dockedArray = [];
      Object.assign(this.dockedArray, state.dockedArray);
      this.activeDockedId = state.activeDockedId;
      this.currentCount = state.currentCount;
      this.entries = [];
      Object.assign(this.entries, state.entries);
      store.commit("splitFlow/setState", state.splitFlow);  
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
    resourceSelected: function(result) {
      this.$emit("resource-selected", result);
    },
    flatmapChanged: function(){
      this.$emit("flatmapChanged");
    },
    entryStateUpdated: function(id, state) {
      console.log(id, state)
      let index = this.findIndexOfId(id);
      if (index > -1)
        this.entries[index].state = state;
    },
    tabClicked: function(id){
      this.activeDockedId = id
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
    EventBus.$on("PopoverActionClick", (payLoad) => {
      this.actionClick(payLoad);
    })
    this.$nextTick(() => {
      this.$refs.sideBar.close();
      setTimeout(() => {
        this.startUp = false;
      }, 2500);
    })
  },
  computed: {
    apiLocation: function() {
      return store.state.settings.api;
    }
  }
};
</script>

<style scoped>

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

.start-up >>> .el-drawer__open .el-drawer.rtl {
  animation: unset;
}

.start-up >>> .el-drawer.rtl {
  animation: rtl-drawer-out 2.5s linear;
}

.start-up >>> .el-drawer__wrapper.side-bar {
  display:block!important;
}

</style>