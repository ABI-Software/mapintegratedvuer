<template>
  <div class="content-container">
    <DatasetHeader v-if="entry.datasetTitle" class="dataset-header" :entry="entry"></DatasetHeader>
    <div :style="mainStyle">
      <MultiFlatmapVuer v-if="entry.type === 'MultiFlatmap'" :availableSpecies="entry.availableSpecies"
        @flatmapChanged="flatmapChanged" @ready="flatmapReady"
        @resource-selected="resourceSelected(entry.type, $event)"  :name="entry.resource"
        style="height:100%;width:100%;" :initial="entry.resource" :helpMode="helpMode"
        ref="multiflatmap"/>
      <FlatmapVuer v-else-if="entry.type === 'Flatmap'" :entry="entry.resource"
        @resource-selected="resourceSelected(entry.type, $event)" :name="entry.resource"
        style="height:100%;width:100%;" :minZoom="entry.minZoom" :helpMode="helpMode"
        :pathControls="entry.pathControls" ref="flatmap" @ready="flatmapReady"/>
      <ScaffoldVuer v-else-if="entry.type === 'Scaffold'" :url="entry.resource"
        @scaffold-selected="resourceSelected(entry.type, $event)" ref="scaffold"
        :backgroundToggle=true :traditional=true :helpMode="helpMode"
        :displayMinimap=false :displayMarkers=false />
      <PlotVuer v-else-if="entry.type === 'Plot'" :url="entry.resource"
      :plotType="entry.plotType" :helpMode="helpMode" style="height: 200px"></PlotVuer>
      <IframeVuer v-else-if="entry.type === 'Iframe'" :url="entry.resource" />
      <MapPopover v-if="(entry.type === ('Flatmap')) || (entry.type === ('MultiFlatmap')) ||
        (entry.type === ('Scaffold'))"
        :selectedResource="selectedResource" :placement="tPlacement"
        :tooltipCoords="tooltipCoords" :visible="tVisible"
        @onClose="onTooltipClose"
        :displayCloseButton="entry.type === 'Scaffold'"
        ref="popover"/>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-alert, no-console */
import EventBus from './EventBus';
import MapPopover from './MapPopover';
import DatasetHeader from './DatasetHeader';
import IframeVuer from './Iframe';
import {getAvailableTermsForSpecies} from './SimulatedData.js';
import { FlatmapVuer, MultiFlatmapVuer } from '@abi-software/flatmapvuer';
import '@abi-software/flatmapvuer/dist/flatmapvuer.css';
import { ScaffoldVuer } from '@abi-software/scaffoldvuer';
import '@abi-software/scaffoldvuer/dist/scaffoldvuer.css';
import { PlotVuer } from '@abi-software/plotvuer';
import '@abi-software/plotvuer/dist/plotvuer.css';

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
    MapPopover,
    FlatmapVuer,
    MultiFlatmapVuer,
    ScaffoldVuer,
    PlotVuer,
  },
  methods: {
    /**
     * Callback when popover close button is clicked.
     */
    onTooltipClose: function() {
      this.tVisible = false;
    },
    onResize: function () {
      if (this.entry.type === 'Scaffold')
        this.scaffoldCamera.onResize();
    },
    /**
     * Display and set the position of the popover.
     * Popover will handle the content.
     */
    showTooltip: function(result) {
      if (this.entry.type === 'Scaffold') {
        if (result.resource && result.resource.length > 0) {
          this.tVisible = true;
        } else {
          this.tVisible = false;
        }
      } else if (this.entry.type === 'MultiFlatmap'){
        /* Use flatmap MapBoxGL for displaying the popover */
        const elm = this.$refs.popover.getTooltipContentElm();
        this.$refs.multiflatmap.showMarkerPopup(result.resource.feature.id, elm,
          {anchor: "bottom"});
      } else if (this.entry.type === 'Flatmap'){
        /* Use flatmap MapBoxGL for displaying the popover */
        const elm = this.$refs.popover.getTooltipContentElm();
        this.$refs.flatmap.showMarkerPopup(result.resource.feature.id, elm,
          {anchor: "bottom"});
      } else {
        this.tooltipCoords.x = 0;
        this.tooltipCoords.y = 300;
        this.tVisible = true;
      }
    },
    setTooltipCoords(x, y){
      this.tooltipCoords.x = x;
      this.tooltipCoords.y = y;
      this.tVisible = true;
    },
    /**
     * Callback when the vuers emit a selected event.
     */
    resourceSelected: function(type, resource) {
      const result = {paneIndex: this.index, type: type, resource: resource};
      this.selectedResource = result;
      this.showTooltip(result);
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
      selectedResource: undefined,
      tooltipCoords: {x: 0, y: 0},
      tPlacement: "bottom",
      tVisible: false,
      mainStyle: {
        height: this.entry.datasetTitle ? "calc(100% - 30px)" : "100%",
        width: "100%",
        bottom: "0px",
      },
      helpMode: false
    }
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
