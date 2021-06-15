<template>
  <el-container style="height:100%;background:white;">
    <el-header ref="header" style="text-align: left; font-size: 14px;padding:0" height="40px" class="dialog-header">
      <DialogToolbarContent :activeId="activeDockedId" :dialogTitles="dockedArray"
        :topLevelControls="entries[findIndexOfId(activeDockedId)].mode!=='normal'"
        :showIcons="entries[findIndexOfId(activeDockedId)].mode!=='main'"
        @maximise="dockedMaximise" @minimise="dockedMinimise" @close="dockedClose"
        @titleClicked="dockedTitleClicked" @onFullscreen="onFullscreen"
        :showHelpIcon="true"/>
    </el-header>
    <el-main class="dialog-main">
      <div style="width:100%;height:100%;position:relative;overflow:hidden;">
        <FloatingDialog v-for="item in entries" :entry="item" :index="item.id" ref="dialogs"
          :key="item.id" v-on:mousedown.native="dialogClicked(item.id)"
          @maximise="dialogMaximise(item.id)" @minimise="dialogMinimise(item.id)"
          @close="dialogClose(item.id)"
          @resource-selected="resourceSelected"
          @flatmapChanged="flatmapChanged"/>
          <SideBar ref="sideBar" class="side-bar" :apiLocation="apiLocation" 
            :visible="sideBarVisibility" @actionClick="actionClick"></SideBar>
      </div>
    </el-main>
  </el-container>
</template>

<script>
/* eslint-disable no-alert, no-console */
import DialogToolbarContent from './DialogToolbarContent';
import EventBus from "./EventBus"
import FloatingDialog from './FloatingDialog';
import { SideBar } from '@abi-software/map-side-bar';
import '@abi-software/map-side-bar/dist/map-side-bar.css';
import store from '../store';
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
        state: undefined
      }
    ],
    sideBarVisibility: false,
    search: ''
  }
}

/**
 * Component of the floating dialogs.
 */
export default {
  name: "FloatingFlow",
  components: {
    DialogToolbarContent,
    FloatingDialog,
    SideBar
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
          if (action.nervePath){
            this.$refs.sideBar.openSearch(action.label, [action.filter] )
          } else {
            this.$refs.sideBar.openSearch(action.label, [{facet: "All Species", term:'species'}] )
          }
          
        } else if (action.type == "URL"){
          window.open(action.resource, '_blank')
        } 
        else {
          let newId = this.createNewEntry(action);
          this.bringDialogToFront(newId);
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
      this.entries.push(newEntry);
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
    findIndexOfDockedArray: function(id) {
      for (let i = 0; i < this.dockedArray.length; i++) {
        if (this.dockedArray[i].id == id) {
          return i;
        }
      }
      return -1;
    },
    bringDialogToFront: function(id) {
      /*About the z-index: Active background index = 1;
        Inactive background index = 0;
        Floating dialog z-index > 1;
      */
      let index = this.findIndexOfId(id);
      if ((index > -1) && (this.entries[index].mode === "normal")) {
        if (this.zIndex !== this.entries[index].zIndex) {
          this.zIndex++;
          this.entries[index].zIndex = this.zIndex;
        }
      }
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
    maximiseDialog: function(id) {
      let index = this.findIndexOfId(id);
      if (index > -1) {
        this.minimiseDialog(this.activeDockedId);
        if (this.entries[index].mode !== "main")
          this.entries[index].mode = "maximised";
        this.activeDockedId = id;
        this.entries[index].zIndex = 1;
      }
    },
    minimiseDialog: function(id) {
      let index = this.findIndexOfId(id);
      if (index > -1) {
        if (this.entries[index].mode !== "main")
          this.entries[index].mode = "minimised";
        this.entries[index].zIndex = 0;
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
    dialogMaximise: function(id) {
      this.maximiseDialog(id);
      this.dockDialog(id);
    },
    dialogMinimise: function(id) {
      this.minimiseDialog(id);
      this.dockDialog(id);
    },
    dialogClose: function(id) {
      this.destroyDialog(id);
    },
    dockedTitleClicked: function(id) {
      this.maximiseDialog(id);
    },
    dockedMaximise: function() {
      let index = this.findIndexOfId(this.activeDockedId);
      if (index > -1 && (this.entries[index].mode !== "main")) {
        this.entries[index].mode = "normal";
      }
      this.undockDialog(this.activeDockedId);
      this.activeDockedId = this.entries[0].id;
    },
    dockedMinimise: function() {
      this.minimiseDialog(this.activeDockedId);
      this.activeDockedId = this.entries[0].id;
    },
    dockedClose: function() {
      this.undockDialog(this.activeDockedId);
      this.destroyDialog(this.activeDockedId);
      this.activeDockedId = this.entries[0].id;
    },
    dialogClicked: function(id) {
      this.bringDialogToFront(id);
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
    },
    getState: function() {
      let state = JSON.parse(JSON.stringify(this.$data));
      let dialogs = this.$refs["dialogs"];
      if (state.entries.length === dialogs.length) {
        for (let i = 0; i < dialogs.length; i++) {
          //we dont need the contextcard information yet 
          if (state.entries[i].contextCard)
            delete state.entries[i]["contextCard"];
          state.entries[i].state = dialogs[i].getState();
        }
      }
      return state;
    },
    resourceSelected: function(result) {
      this.$emit("resource-selected", result);
    },
    flatmapChanged: function(){
      this.$emit("flatmapChanged");
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

.heart-invis {
  position: absolute;
  right:40%;
  top:75%;
  height: 0px;
  width: 0px;
}

.icn-invis {
  position: absolute;
  right:50%;
  top:45%;
  height: 0px;
  width: 0px;
}

</style>
