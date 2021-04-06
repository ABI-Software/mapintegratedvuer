<template>
  <div class="content-container">
    <DatasetHeader v-if="entry.datasetTitle" class="dataset-header" :entry="entry"></DatasetHeader>
    <div :style="mainStyle">
      <MultiFlatmapVuer v-if="entry.type === 'MultiFlatmap'" :availableSpecies="entry.availableSpecies"
        @flatmapChanged="flatmapChanged" @ready="flatmapReady" :state="entry.state"
        @resource-selected="resourceSelected(entry.type, $event)"  :name="entry.resource"
        style="height:100%;width:100%;" :initial="entry.resource" :helpMode="helpMode"
        ref="multiflatmap" :displayMinimap=true :flatmapAPI="flatmapAPI"/>
      <FlatmapVuer v-else-if="entry.type === 'Flatmap'" :state="entry.state" :entry="entry.resource"
        @resource-selected="resourceSelected(entry.type, $event)" :name="entry.resource"
        style="height:100%;width:100%;" :minZoom="entry.minZoom" :helpMode="helpMode"
        :pathControls="entry.pathControls" ref="flatmap" @ready="flatmapReady" :displayMinimap=true
        :flatmapAPI="flatmapAPI" />
      <ScaffoldVuer v-else-if="entry.type === 'Scaffold'" :state="entry.state" :url="entry.resource"
        @scaffold-selected="resourceSelected(entry.type, $event)" ref="scaffold"
        :backgroundToggle=true :traditional=true :helpMode="helpMode"
        :render="entry.mode !== 'minimised'" :displayMinimap=false :displayMarkers=false />
      <PlotVuer v-else-if="entry.type === 'Plot'" :url="entry.resource"
      :plotType="entry.plotType" :helpMode="helpMode" style="overflow: hidden"></PlotVuer>
      <IframeVuer v-else-if="entry.type === 'Iframe'" :url="entry.resource" />
    </div>
  </div>
</template>

<script>
/* eslint-disable no-alert, no-console */
import EventBus from './EventBus';
import DatasetHeader from './DatasetHeader';
import IframeVuer from './Iframe';
import {getAvailableTermsForSpecies} from './SimulatedData.js';
import { FlatmapVuer, MultiFlatmapVuer } from '@abi-software/flatmapvuer';
import '@abi-software/flatmapvuer/dist/flatmapvuer.css';
import { ScaffoldVuer } from '@abi-software/scaffoldvuer';
import '@abi-software/scaffoldvuer/dist/scaffoldvuer.css';
import { PlotVuer } from '@abi-software/plotvuer';
import '@abi-software/plotvuer/dist/plotvuer.css';
import { getInteractiveAction } from './SimulatedData.js';
import store from '../store';

export default {
  name: "ContentVuer",
  props: {
    /**
     * Object containing information for
     * the required viewing.
     */
    entry: Object,
  },
  components: {
    DatasetHeader,
    IframeVuer,
    FlatmapVuer,
    MultiFlatmapVuer,
    ScaffoldVuer,
    PlotVuer,
  },
  methods: {
    onResize: function () {
      if (this.entry.type === 'Scaffold')
        this.scaffoldCamera.onResize();
    },
    getState: function() {
      if (this.entry.type === 'Scaffold') {
        return this.$refs.scaffold.getState();
      } else if (this.entry.type === 'MultiFlatmap'){
        return this.$refs.multiflatmap.getState();
      } else if (this.entry.type === 'Flatmap'){
        return this.$refs.flatmap.getState();
      }
      return undefined;
    },
    /**
     * Callback when the vuers emit a selected event.
     */
    resourceSelected: function(type, resource) {
      let action = "none";
      if (type == "MultiFlatmap" || type == "Flatmap") {
        if (resource.eventType == "click") {
          if (resource.feature.type == "marker")
            action = "search";
          else if (resource.feature.type == "feature")
            action = "scaffold";
        }
      } else if (type == "Scaffold"){
        action = "search";
      }
      const result = {paneIndex: this.index, type: type, resource: resource};
      let returnedAction = getInteractiveAction(result, action);
      EventBus.$emit("PopoverActionClick", returnedAction);
      this.$emit("resource-selected", result);
    },
    flatmapChanged: function() {
      this.$emit("flatmapChanged");
    },
    flatmapReady: function(component) {
      let map = component.mapImp;
      let terms = getAvailableTermsForSpecies(map.describes);
      for (let i = 0; i < terms.length; i++) {
        map.addMarker(terms[i].id, terms[i].type);
      }
    },
    startHelp: function(id){
      if (this.entry.id === id && this.isInHelp === undefined){
        this.helpMode = true;
        window.addEventListener("mousedown", this.endHelp)
        this.isInHelp = true;
      }
    },
    endHelp: function(){
      window.removeEventListener("mousedown", this.endHelp)
      this.helpMode = false;
      setTimeout(()=>{this.isInHelp = undefined}, 200);
    }
  },
  data: function() {
    return {
      scaffoldCamera: undefined,
      mainStyle: {
        height: this.entry.datasetTitle ? "calc(100% - 30px)" : "100%",
        width: "100%",
        bottom: "0px",
      },
      helpMode: false
    }
  },
  created: function() {
    this.flatmapAPI = undefined;
    if (store.state.settings.flatmapAPI)
      this.flatmapAPI = store.state.settings.flatmapAPI;
  },
  mounted: function() {
    if (this.entry.type === 'Scaffold') {
      this.scaffoldCamera = this.$refs.scaffold.$module.scene.getZincCameraControls();
      this.tooltipCoords = this.$refs.scaffold.getDynamicSelectedCoordinates();
      document.querySelectorAll('.el-checkbox-group')[0].id = 'scaffold-checkbox-group-' + this.entry.id;
    }
    EventBus.$on("startHelp", (id) => {
      this.startHelp(id);
    })
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

.dataset-header {
  height: 23px;
}

.content-container {
  height: 100%;
  width: 100%;
}

>>>.flatmapvuer-popover .mapboxgl-popup-content {
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0,0,0,.1);
  padding: 3em 1em 3em 1em;
  pointer-events: auto;
  width: 25em;
  background: #fff;
}

</style>
