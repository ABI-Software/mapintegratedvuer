<template>
  <div class="content-container">
    <DatasetHeader v-if="entry.datasetTitle" class="dataset-header" :entry="entry"></DatasetHeader>
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
      if (type == "MultiFlatmap" || type == "Flatmap") {
        if (resource.eventType == "click") {
          if (resource.feature.type == "marker") {
            returnedAction = {};
            returnedAction.type = "Facet";
            returnedAction.label = this.idNamePair[resource.feature.models];  
          }
          else if (resource.feature.type == "feature") {
            action = "scaffold";
          } 
        }
      } else if (type == "Scaffold"){
        action = "search";
      }
      const result = {paneIndex: this.index, type: type, resource: resource};
      if (returnedAction === undefined)
        returnedAction = getInteractiveAction(result, action);
      if (returnedAction) {
        EventBus.$emit("PopoverActionClick", returnedAction);
        this.$emit("resource-selected", result);
      }
    },
    resourceHasAction(resource){
      return (resource.type === 'URL' || resource.type === 'Search' || resource.type === 'Neuron Search')
    },
    flatmapChanged: function() {
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
        console.log('calling: ', `${this.apiLocation}get-organ-curies?${params.join('&')}`)
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
    }
  },
  data: function() {
    return {
      apiLocation: process.env.VUE_APP_API_LOCATION,
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
    if (store.state.settings.sparcApi)
      this.apiLocation = store.state.settings.sparcApi;
  },
  computed: {
    facetSpecies() {
      return store.state.settings.facets.species;
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

</style>

<style src="@/../assets/mapicon-species-style.css">
</style>
