<template>
    <div
      ref="MapApp"
      v-loading="!isReady"
      class="mapcontent"
      element-loading-text="Loading..."
      element-loading-background="rgba(0, 0, 0, 0.3)"
    >
      <map-svg-sprite-color/>
      <SplitFlow
        v-if="isReady"
        @onFullscreen="onFullscreen"
        :state="stateToSet"
        ref="flow"
        @vue:mounted="flowMounted"
      />
    </div>
</template>

<script>
/* eslint-disable no-alert, no-console */
import Tagging from '../services/tagging.js';
import SplitFlow from './SplitFlow.vue';
import EventBus from './EventBus';
import { mapStores } from 'pinia';
import { useSettingsStore } from '../stores/settings';
import { useSplitFlowStore } from '../stores/splitFlow';
import { findSpeciesKey } from './scripts/utilities.js';
import { MapSvgSpriteColor} from '@abi-software/svg-sprite';
import { initialState } from "./scripts/utilities.js";
import RetrieveContextCardMixin from "../mixins/RetrieveContextCardMixin.js"
import {
  ElLoading as Loading
} from "element-plus";

/**
 * Content of the app. More work flows will be added here.
 */
export default {
  name: "MapContent",
  components: {
    MapSvgSpriteColor,
    Loading,
    SplitFlow,
  },
  mixins: [RetrieveContextCardMixin],
  props: {
    /**
     * A link (URL) to share.
     */
    shareLink: {
      type: String,
      default: undefined
    },
    /**
     * State containing state of the scaffold.
     */
    state: {
      type: Object,
      default: undefined
    },
    /**
     * The options include APIs and Keys.
     */
    options: {
      type: Object,
      default: () => {},
      required: true
    },
    /**
     * New option to start the map in AC, FC or WholeBody.
     */
    startingMap: {
      type: String,
      default: "AC"
    },
    /**
     * To use help-mode-dialog when user clicks "Help".
     * This option is available on Flatmap, MultiFlatmap, and Scaffold.
     * When this is set to `true`, "Help" tooltips will be shown one by one.
     */
    useHelpModeDialog: {
      type: Boolean,
      default: false,
    },
    /**
     * The option to show connectivity info in sidebar.
     */
    connectivityInfoSidebar: {
      type: Boolean,
      default: false,
    },
  },
  data: function () {
    return {
      isReady: false,
      initialState: undefined,
    }
  },
  methods: {
    /**
     * @vuese
     * Function to check whether it is in fullscreen mode or not.
     *
     */
    isFullscreen: function(){
      return (document.fullscreenElement || document.webkitFullscreenElement ||
        document.mozFullScreenElement || document.msFullscreenElement )
    },
    /**
     * @vuese
     * Function to toggle fullscreen.
     * @arg fullscreenRequest
     */
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
    /**
     * @vuese
     * Function to leave fullscreen mode.
     */
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
    /**
     * @vuese
     * Function to go to fullscreen mode.
     */
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
     * @vuese
     * Provide a way to set the current view, this is currently limited
     * to setting view for flatmapm, multiflatmap or scaffold.
     * In the case of the multiflatmap, it will not create a new entry and
     * instead change the current entry by setting the state.
     * @arg state
     */
    setCurrentEntry: async function(state) {
      if (state && state.type) {
        if (state.type === "Scaffold" && state.url) {
          //State for scaffold containing the following items:
          //  label - Setting the name of the dialog
          //  region - Which region/group currently focusing on
          //  resource - the url to metadata
          //  state - state to restore (viewport)
          //  viewUrl - relative path of the view file to metadata
          let newView = {
            type: state.type,
            label: state.label,
            region: state.region,
            resource: state.url,
            state: state.state,
            viewUrl: state.viewUrl
          };
          // Add content from scicrunch for the context card
          const contextCardInfo = await this.retrieveContextCardFromUrl(state.url);
          newView = {...newView, ...contextCardInfo};
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
                  this.$refs.flow.setState(currentState);
                  //Do not create a new entry, instead set the multiflatmap viewer
                  //to the primary slot
                  this.$refs.flow.setIdToPrimaryPane(entry.id);
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
     * @vuese
     * Open the sidebar with the specified facets and query.
     * @arg facets, query
     */
    openSearch: function(facets, query) {
      return this.$refs.flow.openSearch(facets, query);
    },
    /**
     * @vuese
     * Function to run when the component is mounted.
     */
    flowMounted: function () {
      this._flowMounted = true;
      /**
       * This event emit when the component is mounted.
       */
      this.$emit("isReady");

      // GA Tagging
      // Page view tracking for maps' buttons click on portal
      // category: AC | FC | WholeBody
      Tagging.sendEvent({
        'event': 'interaction_event',
        'event_name': 'portal_maps_page_view',
        'category': this.startingMap
      });
    },
  },
  computed: {
    ...mapStores(useSettingsStore, useSplitFlowStore),
    stateToSet() {
      return this.state ? this.state : this.initialState;
    },
  },
  watch: {
    "shareLink" : {
      handler: function (newLink) {
        this.settingsStore.updateShareLink(newLink);
      },
      immediate: true,
    },
  },
  beforeMount: function() {
    if (this.options) {
      // Split options prop up to commit to the store
      this.options.sparcApi ? this.settingsStore.updateSparcAPI(this.options.sparcApi) : null
      this.options.algoliaIndex ? this.settingsStore.updateAlgoliaIndex(this.options.algoliaIndex) : null
      this.options.algoliaKey ? this.settingsStore.updateAlgoliaKey(this.options.algoliaKey) : null
      this.options.algoliaId ? this.settingsStore.updateAlgoliaId(this.options.algoliaId) : null
      this.options.pennsieveApi ? this.settingsStore.updatePennsieveApi(this.options.pennsieveApi) : null
      this.options.flatmapAPI ? this.settingsStore.updateFlatmapAPI(this.options.flatmapAPI) : null,
      this.options.nlLinkPrefix ? this.settingsStore.updateNLLinkPrefix(this.options.nlLinkPrefix) : null
      this.options.rootUrl ? this.settingsStore.updateRootUrl(this.options.rootUrl) : null
    }
    this.splitFlowStore?.reset();
  },
  mounted: async function() {
    EventBus.on("updateShareLinkRequested", () => {
      /**
       * This event emits when the share link is requested.
       */
      this.$emit("updateShareLinkRequested");
    });
    EventBus.on('trackEvent', (taggingData) => {
      /**
       * This event triggers data tracking for Google Tag Manager (GTM) related to map interactions.
       */
      this.$emit('trackEvent', taggingData);
    });
    if (!this.state) {
      this.initialState = await initialState(this.startingMap, this.options.sparcApi);
    }
    this.isReady = true;
    this.settingsStore.updateUseHelpModeDialog(this.useHelpModeDialog);
    this.settingsStore.updateConnectivityInfoSidebar(this.connectivityInfoSidebar);
  }
}

</script>

<style scoped lang="scss">

:deep(.el-loading-spinner) {
  .path {
    stroke: $app-primary-color;
  }
  .el-loading-text {
    color: $app-primary-color;
  }
}

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

<style lang="scss">

.mapcontent {
  --el-color-primary: #8300BF;
  --el-color-primary-light-7: #dab3ec;
  --el-color-primary-light-8: #e6ccf2;
  --el-color-primary-light-9: #f3e6f9;
}

</style>