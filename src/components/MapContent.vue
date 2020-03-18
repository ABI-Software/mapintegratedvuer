<template>
    <div style="height: 100%;width:100%">
      <el-container style="height:100%;background:white;">
        <el-header style="text-align: left; font-size: 14px;padding:0" height="40px" class="dialog-header">
          <DialogToolbarContent :activeId="activeDockedId" :dialogTitles="dockedArray"
            :showIcons="entries[findIndexOfId(activeDockedId)].mode!=='main'" @maximise="dockedMaximise"
            @minimise="dockedMinimise" @close="dockedClose" @titleClicked="dockedTitleClicked"/>         
        </el-header>
        <el-main class="dialog-main">
          <div style="width:100%;height:100%;position:relative;overflow:hidden;">
            <FloatingDialog v-for="item in entries" :entry="item" :index="item.id"
              :key="item.id" v-on:mousedown.native="dialogClicked(item.id)"
              @maximise="dialogMaximise(item.id)" @minimise="dialogMinimise(item.id)" 
              @close="dialogClose(item.id)"/>
          </div>
        </el-main>
      </el-container>
    </div>
</template>

<script>
/* eslint-disable no-alert, no-console */
import DialogToolbarContent from './DialogToolbarContent';
import FloatingDialog from './FloatingDialog';
import Vue from "vue";
import {
  Container,
  Header,
  Main
} from "element-ui";
Vue.use(Container);
Vue.use(Header);
Vue.use(Main);

export default {
  name: "MapContent",
  components: {
    DialogToolbarContent,
    FloatingDialog
  },
  methods: {
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
    distroyDialog: function(id) {
      let index = this.findIndexOfId(id);
      if (index > -1) {
        this.entries.splice(index, 1);
      }
    },
    dockDialog: function(id) {
      let index = this.findIndexOfId(id);
      if ((index > -1) && (this.findIndexOfDockedArray(id) == -1)) {
        this.dockedArray.push({title: this.entries[index].type, id:this.entries[index].id});
        this.entries[index].zIndex = 1;
      }
    },
    maximiseDialog: function(id) {
      let index = this.findIndexOfId(id);
      if (index > -1) {
        this.minimiseDialog(this.activeDockedId);
        if (this.entries[index].mode !== "main")
          this.entries[index].mode = "maximised";
        this.activeDockedId = id;
      }
    },
    minimiseDialog: function(id) {
      let index = this.findIndexOfId(id);
      if (index > -1 && (this.entries[index].mode !== "main")) {
        this.entries[index].mode = "minimised";
      }
    },
    undockDialog: function(id) {
      let dockedIndex = this.findIndexOfDockedArray(id);
      if (dockedIndex > -1) {
        this.dockedArray.splice(dockedIndex, 1);
        this.bringDialogToFront(id);
      }
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
      this.distroyDialog(id);
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
      this.distroyDialog(this.activeDockedId);
      this.activeDockedId = this.entries[0].id;
    },
    dialogClicked: function(id) {
      this.bringDialogToFront(id);
    }
    /** ,
    resourceSelected: function(tabName, result) {
      if (result.type == "Flatmap") {
        let resource = result.resource;
        let newResource = undefined;
        let viewerType = "Scaffold";
        switch (resource.resource[0]) {
          case "UBERON:0000945": //stomach
            newResource = "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/ISAN/scaffold/stomach_lines/stomach_metadata.json";
            break;
          case "UBERON:0000948": //heart
            newResource = "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/ISAN/scaffold/use_case4/rat_heart_metadata.json";
            break;
          case "UBERON:0001155": //colon
            newResource = "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/ISAN/scaffold/colon/colonLines_metadata.json";
            break;
          case "UBERON:0002048": //lungs
            newResource = "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/ISAN/scaffold/lungs/lungs_metadata.json";
            break;
          case "UBERON:0002440":
          case "FMA:6474": //stellate
            newResource = "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/ISAN/csv-data/use-case-2/Sample_1_18907001_channel_1.csv";
            viewerType = "Plot";
            //newResource = "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/ISAN/scaffold/stellate/stellate_metadata.json";
            break;
          default:
            break;
        }
        //this.addPaneToTab(tabName, viewerType, newResource);
      }
    }
    */
  },
  data: function() {
    return {
      mainTabName: "Flatmap",
      zIndex: 3,
      showDialogIcons: false,
      dockedArray: [{title: "Flatmap", id:1}],
      activeDockedId: 1,
      currentCount: 3,
      entries: [
        { resource: "NCBITaxon:9606", availableSpecies : {"Human":{taxo: "NCBITaxon:9606",
            iconClass:"icon-mapicon_human"}, "Rat":{taxo: "NCBITaxon:10114", iconClass:"icon-mapicon_rat"} },
          type: "Flatmap", zIndex:1, mode: "main", id: 1},
        {resource: "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/ISAN/scaffold/use_case4/rat_heart_metadata.json",
          type: "Scaffold", zIndex:2, mode: "normal", id: 2},
        {resource: "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/ISAN/csv-data/use-case-4/RNA_Seq.csv",
          plotType:"heatmap", type: "Plot", zIndex:3, mode: "normal", id: 3}]
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
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


</style>
