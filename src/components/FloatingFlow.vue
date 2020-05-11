<template>
  <el-container style="height:100%;background:white;">
    <el-header ref="header" style="text-align: left; font-size: 14px;padding:0" height="40px" class="dialog-header">
      <DialogToolbarContent :activeId="activeDockedId" :dialogTitles="dockedArray"
        :showFullscreenIcon="entries[findIndexOfId(activeDockedId)].mode!=='normal'" 
        :showIcons="entries[findIndexOfId(activeDockedId)].mode!=='main'" 
        @maximise="dockedMaximise" @minimise="dockedMinimise" @close="dockedClose" 
        @titleClicked="dockedTitleClicked" @onFullscreen="onFullscreen"
        :showHelpIcon="true" @startTutorial="startTutorial"/>       
    </el-header>
    <el-main class="dialog-main">
      <div style="width:100%;height:100%;position:relative;overflow:hidden;">
        <FloatingDialog v-for="item in entries" :entry="item" :index="item.id" ref="dialogs"
          :key="item.id" v-on:mousedown.native="dialogClicked(item.id)"
          @maximise="dialogMaximise(item.id)" @minimise="dialogMinimise(item.id)" 
          @close="dialogClose(item.id)"
          @resource-selected="resourceSelected(item)"
          @flatmapChanged="flatmapChanged"/>
      </div>
    </el-main>
    <div id='heart' class="heart-invis"></div>
    <div id='icn' class="icn-invis"></div>
    <v-tour name="onboarding-tour" :steps="steps" :callbacks="tourCallbacks"></v-tour>
  </el-container>
</template>

<script>
/* eslint-disable no-alert, no-console */
import DialogToolbarContent from './DialogToolbarContent';
import FloatingDialog from './FloatingDialog';
import EventBus from './EventBus';
import VueTour from '@tehsurfer/vue-tour'
import tourSteps from './tourSteps'
import '@tehsurfer/vue-tour/dist/vue-tour.css'
import Vue from "vue";
import {
  Container,
  Header,
  Main
} from "element-ui";
Vue.use(Container);
Vue.use(Header);
Vue.use(Main);
Vue.use(VueTour)

export default {
  name: "FloatingFlow",
  components: {
    DialogToolbarContent,
    FloatingDialog
  },
  methods: {
    /**
     * Callback when an action is performed (open new dialogs).
     */
    actionClick:function(action) {
      if (action) {
        if (action.type == "URL") {
          window.open(action.resource,'_blank');
        } else {
          let newId = this.createNewEntry(action);
          this.bringDialogToFront(newId);
        }
      }
    },
    createNewEntry: function(data) {
      let newEntry = {};
      newEntry.resource = data.resource;
      newEntry.type = data.type;
      newEntry.mode = "normal";
      if (data.plotType)
        newEntry.plotType = data.plotType;
      newEntry.id = ++this.currentCount;
      newEntry.zIndex = ++this.zIndex;
      this.entries.push(newEntry);
      this.updateStep(3)
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
        this.dockedArray.push({title: this.entries[index].type, id:this.entries[index].id});
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
    onFullscreen: function() {
      this.$emit("onFullscreen");
    },
    dialogMaximise: function(id) {
      this.maximiseDialog(id);
      this.dockDialog(id);
      this.updateStep(4)
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
      if (this.tour.isRunning){
        this.tour.nextStep()
      }
    },
    updateStep: function(stepNumber){
      if (this.tour.isRunning && this.tour.currentStep === stepNumber ){
        this.tour.nextStep()
      }
    },
    flatmapChanged: function (){
      this.updateStep(2)
    },
    checkForFirstTimeVisitor(){
      var hasVisted = localStorage.getItem('hasVisitedMaps')
      if (hasVisted === null || hasVisted === false){
          localStorage.setItem('hasVisitedMaps', true);
          this.startTutorial()
      }
    },
    startTutorial: function(){
      this.tour.start()
    },
    previousStepCallback: function(currentStep){
      console.log(currentStep)
    },
    nextStepCallback: function(currentStep){
      // Hack on step three to show tooltip for the heart
      if (currentStep === 2){
        this.$refs.dialogs[0].showTooltip({'resource':{'feature':{'id':"263-891"}}})
        this.$refs.dialogs[0].$refs.popover.updateFromTerm("UBERON:0000948")
      }
      if (currentStep === 3){
        if(this.entries.length === 1){
          this.actionClick({
            title: "View 3D scaffold",
            resource: "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/others/29_Jan_2020/heartICN_metadata.json",
            type: "Scaffold"

          })
        }
      }
      if (currentStep === 4){
        this.dockDialog(2)
        this.maximiseDialog(2)
      }
      if (currentStep === 5){
        this.$refs.dialogs[1].$refs.scaffold.$refs.selectControl.checkedItems.push('ICN')
        this.$refs.dialogs[1].$refs.scaffold.$refs.selectControl.handleChange([])
      }
      if (currentStep === 6){
        window.diag = this.$refs.dialogs[1].showTooltip({'resource':['unused']})
        this.$refs.dialogs[1].$refs.popover.updateFromTerm("ICN")
        // this.steps[7].target = this.$refs.dialogs[1].$refs.popover.$refs.tooltip.$el.children[0].children[0].children[0].children[1].children[1],
      }
    },
    finishTutorialCallback(){
       if(this.entries.length === 2){
          this.actionClick({
            title: "'Molecular Phenotype Distribution of Single Rat Intracardiac Neurons",
            resource: "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/ISAN/csv-data/use-case-4/RNA_Seq.csv",
            type: "Plot",
            plotType: "heatmap",
          })
       }
    }
  },
  data: function() {
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
            "Rat":{taxo: "NCBITaxon:10114", iconClass:"icon-mapicon_rat"} 
          },
          type: "Flatmap",
          zIndex:1,
          mode: "main",
          id: 1
        }
      ],
      steps: tourSteps,
      tour: this.$tours['onboarding-tour'],
      tourCallbacks: {
        onPreviousStep: this.previousStepCallback,
        onNextStep: this.nextStepCallback,
        onFinish: this.finishTutorialCallback
      }
    }
  },
  mounted: function() {
    EventBus.$on("PopoverActionClick", (payLoad) => {
      this.actionClick(payLoad);
      console.log(payLoad)
    });
    this.tour = this.$tours['onboarding-tour'] 
    this.checkForFirstTimeVisitor()
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
