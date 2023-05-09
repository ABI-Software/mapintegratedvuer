<template>
    <div class="mapcontent" ref="MapApp">
      <map-svg-sprite-color/>
      <SplitFlow 
        v-if="isReady"
        @onFullscreen="onFullscreen"
        :state="stateToSet"
        ref="flow"
      />
    </div>
</template>

<script>
/* eslint-disable no-alert, no-console */
import SplitFlow from './SplitFlow';
import EventBus from './EventBus';
import store from '../store';
import { findSpeciesKey } from './scripts/utilities.js';
import {MapSvgSpriteColor} from '@abi-software/svg-sprite';
import { initialState } from "./scripts/utilities.js";

/**
 * Content of the app. More work flows will be added here.
 */
export default {
  name: "MapContent",
  components: {
    SplitFlow,
    MapSvgSpriteColor,
  },
  props: {
    shareLink: {
      type: String,
      default: undefined
    },
    state: {
      type: Object,
      default: undefined
    },
    options: {
      type: Object, 
      default: () => {}
    },
    //New option to start the map in AC, FC or WholeBody
    startingMap: {
      type: String,
      default: "AC"
    }
  },
  data: function () {
    return {
      isReady: false,
      initialState: undefined,
    }
  },
  methods: {
    isFullscreen: function(){
      return (document.fullscreenElement || document.webkitFullscreenElement ||
        document.mozFullScreenElement || document.msFullscreenElement )
    },
    onFullscreen: function(fullscreenReq) {
      //If a request is sent, try it
      if (fullscreenReq !== undefined){
        if (fullscreenReq && !this.isFullscreen()){
          this.goFullscreen()
        }
        if(!fullscreenReq && this.isFullscreen()){
          this.leaveFullscreen()
        }
      }
      // Else we toggle fullscreen
      else{
        if(this.isFullscreen()){
          this.leaveFullscreen()
        } else {
          this.goFullscreen()
        }
      }
    },
    leaveFullscreen: function(){
      if (this.isFullscreen()) {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.mozCancelFullScreen) { /* Firefox */
          document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE/Edge */
          document.msExitFullscreen();
        }
      }
    },
    goFullscreen: function(){
      let mapApp = this.$refs.MapApp;
      if (mapApp.requestFullscreen) {
        mapApp.requestFullscreen();
      } else if (mapApp.mozRequestFullScreen) { /* Firefox */
        mapApp.mozRequestFullScreen();
      } else if (mapApp.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
        mapApp.webkitRequestFullscreen();
      } else if (parent.msRequestFullscreen) { /* IE/Edge */
        mapApp.msRequestFullscreen();
      }
    },
    setState: function(state){
      return this.$refs.flow.setState(state);
    },
    getState: function(){
      return this.$refs.flow.getState();
    },
    /**
     * Provide a way to set the current view, this is currently limited
     * to setting view for flatmapm, multiflatmap or scaffold.
     * In the case of the multiflatmap, it will not create a new entry and
     * instead change the current entry by setting the state.
     * 
     */
    setCurrentEntry: function(state, ) {
      if (state && state.type) {
        if (state.type === "Scaffold" && state.url) {
          //State for scaffold containing the following items:
          //  label - Setting the name of the dialog
          //  region - Which region/group currently focusing on
          //  resource - the url to metadata
          //  state - state to restore (viewport)
          //  viewUrl - relative path of the view file to metadata 
          const newView = {
            type: state.type,
            label: state.label,
            region: state.region,
            resource: state.url,
            state: state.state,
            viewUrl: state.viewUrl
          };
          this.$refs.flow.createNewEntry(newView);
        } else if (state.type === "MultiFlatmap") {
          //State for scaffold containing the following items:
          //  label - Setting the name of the dialog
          //  taxo - taxo of species to set
          //  biologicalSex - biological sex to be displayed (PATO)
          //  organ - Target organ, flatmap will conduct a local search 
          //          using this

          //Look for the key in the available species array,
          //it will use the taxo and biologicalSex as hints.
          const key = findSpeciesKey(state);
          if (key) {
            const currentState = this.getState();
            if (currentState && currentState.entries) {
              for (let i = 0; i < currentState.entries.length; i++) {
                const entry =  currentState.entries[i];
                if (entry.type === "MultiFlatmap") {
                  entry.resource = key;
                  entry.state = {species: key};
                  if (state.organ || state.uuid) {
                    entry.state.state = { searchTerm: state.organ, uuid: state.uuid };
                    //if it contains an uuid, use the taxo to help identify if the uuid
                    //is current
                    if (state.uuid) entry.state.state.entry = state.taxo;
                  }
                  currentState.activeDockedId = entry.id;
                  this.$refs.flow.setState(currentState);
                  //Do not create a new entry, instead set the multiflatmap viewer
                  //to the primary slot
                  this.$refs.flow.setIdToPrimarySlot(entry.id);
                  break;
                }
              }
            }
          }
        }
        else if (state.type === "Flatmap") {
          //State for scaffold containing the following items:
          //  label - Setting the name of the dialog
          //  region - Which region/group currently focusing on
          //  resource - the url to metadata
          //  state - state to restore (viewport)
          //  viewUrl - relative path of the view file to metadata 
          const newView = {
            type: state.type,
            resource: state.resource,
            state: state.state,
            label: state.label
          };
          this.$refs.flow.createNewEntry(newView);
        } 
      } 
    },
    /**
     * Open the sidebar with the specified facets and query.
     */
    openSearch: function(facets, query) {
      return this.$refs.flow.openSearch(facets, query);
    }
  },
  computed: {
    stateToSet() {
      return this.state ? this.state : this.initialState;
    },
  },
  watch: {
    "shareLink" : {
      handler: function (newLink) {
        store.commit("settings/updateShareLink", newLink);
      },
      immediate: true,
    },
  },
  beforeMount: function() {
    if (this.options) {
      // Split options prop up to commit to the store
      this.options.sparcApi ? store.commit("settings/updateSparcAPI", this.options.sparcApi) : null
      this.options.algoliaIndex ? store.commit("settings/updateAlgoliaIndex", this.options.algoliaIndex) : null
      this.options.algoliaKey ? store.commit("settings/updateAlgoliaKey", this.options.algoliaKey) : null
      this.options.algoliaId ? store.commit("settings/updateAlgoliaId", this.options.algoliaId) : null
      this.options.pennsieveApi ? store.commit("settings/updatePennsieveApi", this.options.pennsieveApi) : null
      this.options.flatmapAPI ? store.commit("settings/updateFlatmapAPI", this.options.flatmapAPI) : null,
      this.options.nlLinkPrefix ? store.commit("settings/updateNLLinkPrefix", this.options.nlLinkPrefix) : null
      this.options.rootUrl ? store.commit("settings/updateRootUrl", this.options.rootUrl) : null
    }
  },
  mounted: async function() {
    EventBus.$on("updateShareLinkRequested", () => {
      this.$emit("updateShareLinkRequested");
    });
    if (!this.state && this.startingMap !== "AC" ) {
      this.initialState = await initialState(this.startingMap, this.options.sparcApi);
    }
    this.isReady = true;
  }
}

</script>

<style scoped lang="scss">
@import "@/assets/styles";
.map-help-dialog {
  position: fixed;
  z-index: 20;
  bottom: 30px;
  right: 30px;
}

.mapcontent {
  height: 100%;
  width:100%;
  z-index:1;
}

</style>
<style src="@/../assets/styleguide.css">
</style>

