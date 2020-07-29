<template>
  <el-container style="height:100%;background:white;">
    <el-header ref="header" style="text-align: left; font-size: 14px;padding:0" height="40px" class="dialog-header">
      <DialogToolbarContent :activeId="activeDockedId" :dialogTitles="dockedArray"
        :showFullscreenIcon="entries[findIndexOfId(activeDockedId)].mode!=='normal'" 
        :showIcons="entries[findIndexOfId(activeDockedId)].mode!=='main'" 
        @maximise="dockedMaximise" @minimise="dockedMinimise" @close="dockedClose" 
        @titleClicked="dockedTitleClicked" @onFullscreen="onFullscreen"
        :showHelpIcon="true" @startHelp="startHelp"/>       
    </el-header>
    <el-main class="dialog-main">
      <div style="width:100%;height:100%;position:relative;overflow:hidden;">
        <FloatingDialog v-for="item in entries" :entry="item" :index="item.id" ref="dialogs"
          :key="item.id" v-on:mousedown.native="dialogClicked(item.id)"
          @maximise="dialogMaximise(item.id)" @minimise="dialogMinimise(item.id)" 
          @close="dialogClose(item.id)"
          @resource-selected="resourceSelected"
          @flatmapChanged="flatmapChanged"/>
      </div>
    </el-main>
    <SideBar ref="sideBar" :visible="sideBarVisibility" :search="search"></SideBar>
  </el-container>
</template>

<script>
/* eslint-disable no-alert, no-console */
import DialogToolbarContent from './DialogToolbarContent';
import FloatingDialog from './FloatingDialog';
import SideBar from './SideBar';
import EventBus from './EventBus';
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
          "Human":{taxo: "NCBITaxon:9606", iconClass:"icon-mapicon_human"},
          "Rat":{taxo: "NCBITaxon:10114", iconClass:"icon-mapicon_rat"},
          "Mouse":{taxo: "NCBITaxon:10090", iconClass:"icon-mapicon_mouse"},
          "Pig":{taxo: "NCBITaxon:9823", iconClass:"icon-mapicon_pig"},
          "Cat":{taxo: "NCBITaxon:9685", iconClass:"icon-mapicon_cat"},
        },
        type: "MultiFlatmap",
        zIndex:1,
        mode: "main",
        id: 1
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
  methods: {
    onFlowChange: function(action) {
       EventBus.$emit("FlowChange", action);
    },
    /**
     * Callback when an action is performed (open new dialogs).
     */
    actionClick:function(action) {
      if (action) {
        if (action.type == "URL") {
          console.log('in url clobk', action)
          this.search = action.label
          this.$refs.sideBar.open()
        } else {
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
      this.entries.push(newEntry);
      this.onFlowChange('createNewEntry');
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
      this.onFlowChange('dialogMaximise');
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
    resourceSelected: function(resource) {
      console.log(resource);
      this.onFlowChange('resourceSelected');
    },
    flatmapChanged: function (){
      this.onFlowChange('flatmapChanged');
    },
    startHelp: function(){
      this.onFlowChange('startTutorial');
    },
    
    resetApp: function(){
      Object.assign(this.$data, initialState());
      var closeItems = document.querySelectorAll('.mapboxgl-popup-close-button');
      closeItems.forEach( (item) => { item.click() });
    }
  },
  data: function() {
    return initialState();
  },
  mounted: function() {
    EventBus.$on("PopoverActionClick", (payLoad) => {
      this.actionClick(payLoad);
    });
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
