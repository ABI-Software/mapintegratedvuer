<template>
  <div class="content-container">
    <DatasetHeader v-if="entry.datasetTitle" class="dataset-header" :entry="entry"></DatasetHeader>
    <template v-if="entry.type === 'MultiFlatmap' && (activeSpecies === 'Rat' || activeSpecies === 'Human')">
      <el-button class="open-scaffold" @click="openScaffold()">Open 3D map</el-button>
    </template>
    <div :style="mainStyle">
      <MultiFlatmapVuer v-if="entry.type === 'MultiFlatmap'" :availableSpecies="entry.availableSpecies"
        @flatmapChanged="flatmapChanged" @ready="updateMarkers" :state="entry.state"
        @resource-selected="resourceSelected(entry.type, $event)"  :name="entry.resource"
        style="height:100%;width:100%;" :initial="entry.resource" :helpMode="helpMode"
        ref="multiflatmap" :displayMinimap=true :flatmapAPI="flatmapAPI"/>
      <FlatmapVuer v-else-if="entry.type === 'Flatmap'" :state="entry.state" :entry="entry.resource"
        @resource-selected="resourceSelected(entry.type, $event)" :name="entry.resource"
        style="height:100%;width:100%;" :minZoom="entry.minZoom" :helpMode="helpMode"
        :pathControls="entry.pathControls" ref="flatmap" @ready="updateMarkers" :displayMinimap=true
        :flatmapAPI="flatmapAPI" />
      <ScaffoldVuer v-else-if="entry.type === 'Scaffold'" :state="entry.state" :url="entry.resource"
        @scaffold-selected="resourceSelected(entry.type, $event)" ref="scaffold"
        :backgroundToggle=true :traditional=true :helpMode="helpMode"
        :render="visible" :displayMinimap=false :displayMarkers=false />
      <PlotVuer v-else-if="entry.type === 'Plot'" :url="entry.resource"
        :plotType="entry.plotType" :helpMode="helpMode" style="overflow: hidden"></PlotVuer>
      <SimulationVuer v-else-if="entry.type === 'Simulation'"
        :apiLocation="apiLocation" :entry="entry" />
      <IframeVuer v-else-if="entry.type === 'Iframe'" :url="entry.resource" />
    </div>
  </div>
</template>

<script>
/* eslint-disable no-alert, no-console */
import Vue from "vue";
import { Button } from "element-ui";
import EventBus from './EventBus';
import DatasetHeader from './DatasetHeader';
import IframeVuer from './Iframe';
import {getAvailableTermsForSpecies} from './SimulatedData.js';
import { FlatmapVuer, MultiFlatmapVuer } from '@abi-software/flatmapvuer/src/components/index.js';
import { ScaffoldVuer } from '@abi-software/scaffoldvuer/src/components/index.js';
import { PlotVuer } from '@abi-software/plotvuer';
import '@abi-software/plotvuer/dist/plotvuer.css';
import { getInteractiveAction } from './SimulatedData.js';
import { SimulationVuer } from '@abi-software/simulationvuer';
import '@abi-software/simulationvuer/dist/simulationvuer.css';
import store from '../store';
import lang from "element-ui/lib/locale/lang/en";
import locale from "element-ui/lib/locale";

locale.use(lang);
Vue.use(Button);

export default {
  name: "ContentVuer",
  props: {
    /**
     * Object containing information for
     * the required viewing.
     */
    entry: Object,
    visible: {
      type: Boolean,
      default: true
    },
  },
  components: {
    DatasetHeader,
    IframeVuer,
    FlatmapVuer,
    MultiFlatmapVuer,
    ScaffoldVuer,
    PlotVuer,
    SimulationVuer,
  },
  methods: {
    openScaffold:function() {
      if (this.activeSpecies === "Rat") {
        let action = {
          contextCard: undefined,
          discoverId: undefined,
          label: "Rat Map",
          resource: "https://mapcore-bucket1.s3.us-west-2.amazonaws.com/WholeBody/31-May-2021/ratBody/ratBody_syncmap_metadata.json",
          title: "View 3D scaffold",
          layout: "2horpanel",
          type: "SyncMap"
        }
        EventBus.$emit("PopoverActionClick", action);
      } else if (this.activeSpecies === "Human") {
        let action = {
          contextCard: undefined,
          discoverId: undefined,
          label: "Human Map",
          resource: "https://mapcore-bucket1.s3.us-west-2.amazonaws.com/WholeBody/31-May-2021/humanBody/humanBody_syncmap_metadata.json",
          title: "View 3D scaffold",
          layout: "2vertpanel",
          type: "SyncMap"
        }
        EventBus.$emit("PopoverActionClick", action);
      }
    },
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
      // Skip processing if resources already has actions
      if (this.resourceHasAction(resource) ){
        EventBus.$emit("PopoverActionClick", resource);
        return;
      }

      let returnedAction = undefined;
      let action = "none";
      let fireResourceSelected = false;
      const result = {paneIndex: this.entry.id, type: type, resource: resource, internalName: undefined};

      if (type == "MultiFlatmap" || type == "Flatmap") {
        result.internalName = this.idNamePair[resource.feature.models];
        if (resource.eventType == "click") {
          if (resource.feature.type == "marker") {
            returnedAction = {};
            returnedAction.type = "Facet";
            returnedAction.label = this.idNamePair[resource.feature.models];
            result.internalName = this.idNamePair[resource.feature.models];
            fireResourceSelected = true;
            if (type == "MultiFlatmap") {
              const flatmap = this.$refs.multiflatmap.getCurrentFlatmap().mapImp;
              flatmap.clearSearchResults();
            }
          }
          else if (resource.feature.type == "feature") {
            action = "scaffold";
          }
        } else if (resource.eventType == "mouseenter"){
          fireResourceSelected = true;
        }
      } else if (type == "Scaffold"){
        if (resource && resource[0])
          result.internalName = resource[0].data.id;
        fireResourceSelected = true;
        action = "search";
      }
      if (returnedAction === undefined)
        returnedAction = getInteractiveAction(result, action);
      if (returnedAction)
        EventBus.$emit("PopoverActionClick", returnedAction);
      if (fireResourceSelected)
        this.$emit("resource-selected", result);
    },
    resourceHasAction(resource){
      return (resource.type === 'URL' || resource.type === 'Search' || resource.type === 'Neuron Search')
    },
    receiveEvent(data) {
      if (data.paneIndex !== this.entry.id) {
        let name = data.internalName;
        if (name === undefined && data.resource) 
          name = data.resource.label;
        if (this.entry.type === 'Scaffold') {
          if (data.resource.eventType === "mouseenter") {
            this.$refs.scaffold.changeHighlightedByName(name, false);
          }
          if (data.resource.eventType === "click") {
            this.$refs.scaffold.changeActiveByName(name, false);
          }
        }
        else if (this.entry.type === 'MultiFlatmap') {
          const flatmap = this.$refs.multiflatmap.getCurrentFlatmap().mapImp;
          const results = flatmap.search(name);
          flatmap.showSearchResults(results);
        }
      }
    },
    flatmapChanged: function(activeSpecies) {
      this.activeSpecies = activeSpecies;
      this.$emit("flatmapChanged");
    },
    updateMarkers: function(component) {
      let map = component.mapImp;
      map.clearMarkers();
      let params = [];
      if (this.apiLocation) {
        store.state.settings.facets.species.forEach(e => {
          params.push(encodeURIComponent('species') + '=' + encodeURIComponent(e));
        });
        if (this._controller) 
          this._controller.abort();
        this._controller = new AbortController();
        let signal = this._controller.signal;
        fetch(`${this.apiLocation}get-organ-curies?${params.join('&')}`, {signal})
        .then((response) => response.json())
        .then((data) => {
          this._controller = undefined;
          data.uberon.array.forEach((pair) => {
            this.idNamePair[pair.id.toUpperCase()] = 
              pair.name.charAt(0).toUpperCase() + pair.name.slice(1);
            map.addMarker(pair.id.toUpperCase(), "simulation");
          });
        })
        .catch(err=> {
          if (err.name !== 'AbortError') {
            let terms = getAvailableTermsForSpecies(map.describes);
            for (let i = 0; i < terms.length; i++) {
              map.addMarker(terms[i].id, terms[i].type);
            }
          }
        });
      } else {
        let terms = getAvailableTermsForSpecies(map.describes);
        for (let i = 0; i < terms.length; i++) {
          map.addMarker(terms[i].id, terms[i].type);
        }
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
    },

  },
  data: function() {
    return {
      apiLocation: process.env.VUE_APP_API_LOCATION,
      activeSpecies: "Rat",
      scaffoldCamera: undefined,
      mainStyle: {
        height: this.entry.datasetTitle ? "calc(100% - 30px)" : "100%",
        width: "100%",
        bottom: "0px",
      },
      helpMode: false,
      idNamePair: {}
    }
  },
  created: function() {
    this.flatmapAPI = undefined;
    this.apiLocation = undefined;
    if (store.state.settings.flatmapAPI)
      this.flatmapAPI = store.state.settings.flatmapAPI;
    if (store.state.settings.api)
      this.apiLocation = store.state.settings.api;
  },
  computed: {
    facetSpecies() {
      return store.state.settings.facets.species;
    },
    activeView() {
      return store.state.splitFlow.activeView;
    },
  },
  watch: {
    facetSpecies: function() {
      if (this.entry.type === 'Flatmap') {
        this.updateMarkers(this.$refs.flatmap);
      } else if (this.entry.type === 'MultiFlatmap') {
        this.updateMarkers(this.$refs.multiflatmap.getCurrentFlatmap());
      }
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
  deactivated: function() {
    let state = this.getState();
    this.$emit("stateUpdated", this.entry.id, state);
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import "~element-ui/packages/theme-chalk/src/button";
.dataset-header {
  height: 23px;
}

.content-container {
  height: 100%;
  width: 100%;
}

::v-deep .flatmapvuer-popover {
  .mapboxgl-popup-content {
    border-radius: 4px;
    box-shadow: 0 1px 2px rgba(0,0,0,.1);
    padding: 3em 1em 3em 1em;
    pointer-events: auto;
    width: 25em;
    background: #fff;
  }
}

.open-scaffold {
  position: absolute;
  left: calc(50% - 64px);
  z-index: 2;
  top: 8px;
}

</style>

<style src="@/../assets/mapicon-species-style.css">
</style>
