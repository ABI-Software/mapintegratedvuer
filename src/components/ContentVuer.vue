<template>
  <div
    class="content-container"
    ref="container"
    @mouseover="mouseHovered = true"
    @mouseleave="mouseHovered = false"
  >
    <DatasetHeader
      v-if="entry.datasetTitle"
      class="dataset-header"
      :entry="entry"
    ></DatasetHeader>
    <template
      v-if="
        entry.type === 'MultiFlatmap' &&
        (activeSpecies === 'Rat' || activeSpecies === 'Human')
      "
    >
      <el-button
        type="primary"
        plain
        class="open-scaffold"
        @click="toggleSyncMode()"
        >{{ syncModeText }}</el-button
      >
    </template>
    <div :style="mainStyle">
      <MultiFlatmapVuer
        v-if="entry.type === 'MultiFlatmap'"
        :availableSpecies="entry.availableSpecies"
        @flatmapChanged="flatmapChanged"
        @ready="multiFlatmapReady"
        :state="entry.state"
        @resource-selected="resourceSelected(entry.type, $event)"
        :name="entry.resource"
        style="height: 100%; width: 100%"
        :initial="entry.resource"
        :helpMode="helpMode"
        ref="multiflatmap"
        :displayMinimap="true"
        :flatmapAPI="flatmapAPI"
        @pan-zoom-callback="flatmapPanZoomCallback"
      />
      <FlatmapVuer
        v-else-if="entry.type === 'Flatmap'"
        :state="entry.state"
        :entry="entry.resource"
        @resource-selected="resourceSelected(entry.type, $event)"
        :name="entry.resource"
        style="height: 100%; width: 100%"
        :minZoom="entry.minZoom"
        :helpMode="helpMode"
        :pathControls="entry.pathControls"
        ref="flatmap"
        @ready="updateMarkers"
        :displayMinimap="true"
        :flatmapAPI="flatmapAPI"
      />
      <ScaffoldVuer
        v-else-if="entry.type === 'Scaffold'"
        :state="entry.state"
        :url="entry.resource"
        @scaffold-selected="resourceSelected(entry.type, $event)"
        @scaffold-highlighted="scaffoldHighlighted(entry.type, $event)"
        @scaffold-navigated="scaffoldNavigated(entry.type, $event)"
        @on-ready="scaffoldIsReady"
        ref="scaffold"
        :backgroundToggle="true"
        :traditional="true"
        :helpMode="helpMode"
        :render="visible"
        :displayMinimap="false"
        :displayMarkers="false"
        :view-u-r-l="entry.viewUrl"
      />
      <PlotVuer
        v-else-if="entry.type === 'Plot'"
        :url="entry.resource"
        :plotType="entry.plotType"
        :helpMode="helpMode"
        style="overflow: hidden"
      ></PlotVuer>
      <SimulationVuer
        v-else-if="entry.type === 'Simulation'"
        :apiLocation="apiLocation"
        :entry="entry"
      />
      <IframeVuer v-else-if="isIframe()" :url="entry.resource.share_link" />
    </div>
  </div>
</template>

<script>
/* eslint-disable no-alert, no-console */
import Vue from "vue";
import { Button } from "element-ui";
import EventBus from "./EventBus";
import DatasetHeader from "./DatasetHeader";
import IframeVuer from "./Iframe";
import { getAvailableTermsForSpecies, getParentsRegion } from "./SimulatedData.js";
import {
  FlatmapVuer,
  MultiFlatmapVuer,
} from "@abi-software/flatmapvuer/src/components/index.js";
import { ScaffoldVuer } from "@abi-software/scaffoldvuer/src/components/index.js";
import { PlotVuer } from "@abi-software/plotvuer";
import "@abi-software/plotvuer/dist/plotvuer.css";
import { getInteractiveAction } from "./SimulatedData.js";
import { SimulationVuer } from "@abi-software/simulationvuer";
import "@abi-software/simulationvuer/dist/simulationvuer.css";
import store from "../store";
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
      default: true,
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
    toggleSyncMode: function () {
      if (this.syncMode == false) {
        let action = undefined;
        if (this.activeSpecies === "Rat") {
          action = {
            contextCard: undefined,
            discoverId: undefined,
            label: "Rat Map",
            resource:
              "https://mapcore-bucket1.s3.us-west-2.amazonaws.com/WholeBody/31-May-2021/ratBody/ratBody_syncmap_metadata.json",
            title: "View 3D scaffold",
            layout: "2horpanel",
            type: "SyncMap",
          };
        } else if (this.activeSpecies === "Human") {
          action = {
            contextCard: undefined,
            discoverId: undefined,
            label: "Human Map",
            resource:
              "https://mapcore-bucket1.s3.us-west-2.amazonaws.com/WholeBody/31-May-2021/humanBody/humanBody_syncmap_metadata.json",
            title: "View 3D scaffold",
            layout: "2vertpanel",
            type: "SyncMap",
          };
        }
        if (action)
          EventBus.$emit("SyncModeRequest", { flag: true, action: action });
      } else {
        EventBus.$emit("SyncModeRequest", { flag: false });
      }
    },
    onResize: function () {
      if (this.entry.type === "Scaffold") this.scaffoldCamera.onResize();
    },
    getId: function () {
      return this.entry.id;
    },
    getState: function () {
      if (this.entry.type === "Scaffold") {
        return this.$refs.scaffold.getState();
      } else if (this.entry.type === "MultiFlatmap") {
        return this.$refs.multiflatmap.getState();
      } else if (this.entry.type === "Flatmap") {
        return this.$refs.flatmap.getState();
      }
      return undefined;
    },
    isIframe: function () {
      switch (this.entry.type) {
        case "Biolucida":
        case "Iframe":
        case "Segmentation":
          return true;
        default:
          return false;
      }
    },
    flatmapPanZoomCallback: function (payload) {
      const result = {
        paneIndex: this.entry.id,
        eventType: "panZoom",
        payload: payload,
        type: this.entry.type,
      };
      this.$emit("resource-selected", result);
    },
    search: function (term) {
      if (this.entry.type === "Flatmap") {
        this.$refs.flatmap.searchAndShowResult(term);
      } else if (this.entry.type === "MultiFlatmap") {
        this.$refs.multiflatmap.getCurrentFlatmap().searchAndShowResult(term);
      } else if (this.entry.type === "Scaffold") {
        let capitalised = term.charAt(0).toUpperCase() + term.slice(1);
        this.$refs.scaffold.changeActiveByName(capitalised, "", false);
        this.$refs.scaffold.viewRegion(capitalised);
      }
    },
    scaffoldIsReady: function () {
      if (this.entry.type === "Scaffold")
        this.$refs.scaffold.toggleSyncControl(
          store.state.splitFlow.globalCallback
        );
    },
    /**
     * Callback when the vuers emit a selected event.
     */
    resourceSelected: function (type, resource) {
      // Skip processing if resources already has actions
      if (this.resourceHasAction(resource)) {
        EventBus.$emit("PopoverActionClick", resource);
        return;
      }

      let returnedAction = undefined;
      let action = "none";
      let fireResourceSelected = false;
      const result = {
        paneIndex: this.entry.id,
        type: type,
        resource: resource,
        internalName: undefined,
        eventType: undefined,
      };

      if (type == "MultiFlatmap" || type == "Flatmap") {
        result.internalName = this.idNamePair[resource.feature.models];
        if (resource.eventType == "click") {
          result.eventType = "selected";
          if (resource.feature.type == "marker") {
            returnedAction = {};
            returnedAction.type = "Facet";
            returnedAction.label = this.idNamePair[resource.feature.models];
            result.internalName = this.idNamePair[resource.feature.models];
            fireResourceSelected = true;
            if (type == "MultiFlatmap") {
              const flatmap =
                this.$refs.multiflatmap.getCurrentFlatmap().mapImp;
              flatmap.clearSearchResults();
            }
          } else if (resource.feature.type == "feature") {
            // Do no open scaffold in sync map
            if (this.syncMode) {
              fireResourceSelected = true;
            } else {
              action = "scaffold";
            }
          }
        } else if (resource.eventType == "mouseenter") {
          result.eventType = "highlighted";
          fireResourceSelected = true;
        }
      } else if (type == "Scaffold") {
        if (resource && resource[0]) result.internalName = resource[0].data.id;
        result.eventType = "selected";
        fireResourceSelected = true;
        action = "search";
      }
      if (returnedAction === undefined)
        returnedAction = getInteractiveAction(result, action);
      if (returnedAction) EventBus.$emit("PopoverActionClick", returnedAction);
      if (fireResourceSelected) this.$emit("resource-selected", result);
    },
    resourceHasAction: function (resource) {
      return (
        resource.type === "URL" ||
        resource.type === "Search" ||
        resource.type === "Neuron Search"
      );
    },
    handleSyncPanZoomEvent: function (data) {
      //Prevent recursive callback
      if (!this.mouseHovered) {
        if (data.type !== this.entry.type) {
          if (this.entry.type == "Scaffold") {
            const origin = data.payload.origin;
            const size = data.payload.size;
            const center = [origin[0] + size[0] / 2, origin[1] + size[1] / 2];
            const convertedCenter = [
              (center[0] - 0.5) * 2,
              (0.5 - center[1]) * 2,
            ];
            const zoom = 1 / Math.max(size[0], size[1]);
            this.$refs.scaffold.$module.setSyncControlCenterZoom(
              convertedCenter,
              zoom
            );
          } else if (this.entry.type == "MultiFlatmap") {
            const zoom = data.payload.zoom;
            const center = data.payload.target;
            const height = this.$refs.container.clientHeight;
            const width = this.$refs.container.clientWidth;
            const max = Math.max(height, width);
            const sW = width / max / zoom;
            const sH = height / max / zoom;
            const origin = [
              center[0] / 2 + 0.5 - sW / 2,
              0.5 - center[1] / 2 - sH / 2,
            ];
            this.$refs.multiflatmap
              .getCurrentFlatmap()
              .mapImp.panZoomTo(origin, [sW, sH]);
          }
        }
      }
    },
    zoomToFeatures: function(info, forceSelect) {
      let name = info.name;
      if (this.entry.type === "Scaffold") {
        if (forceSelect) {
          this.$refs.scaffold.changeActiveByName(name, "", false);
        }
        this.$refs.scaffold.viewRegion(name);
      } else if (this.entry.type === "MultiFlatmap") {
        const flatmap = this.$refs.multiflatmap.getCurrentFlatmap().mapImp;
        if (name) {
          const results = flatmap.search(name);
          if (results.featureIds.length) {
            let externalId = flatmap.modelForFeature(results.featureIds[0]);
            if (externalId) {
              if (forceSelect) {
                flatmap.selectFeatures(externalId);
              }
              flatmap.zoomToFeatures(externalId);
            } else flatmap.clearSearchResults();
          }
        } else {
          flatmap.clearSearchResults();
        }
      }
    },
    highlightFeatures: function(info) {
      let name = info.name;
      if (this.entry.type === "Scaffold") {
        this.$refs.scaffold.changeHighlightedByName(name, "", false);
      } else if (this.entry.type === "MultiFlatmap") {
        const flatmap = this.$refs.multiflatmap.getCurrentFlatmap().mapImp;
        if (name) {
          const results = flatmap.search(name);
          if (results.featureIds[0]) {
            flatmap.highlightFeatures([
              flatmap.modelForFeature(results.featureIds[0]),
            ]);
          }
        }
      }
    },
    getNameAndIdFromSyncData: async function(data) {
      let name = data.internalName;
      if (name === undefined && data.resource) {
        name = data.resource.label;
      }
      let id = undefined;
      if (data.resource && data.resource.resource) {
        id = data.resource.resource[0];
      }
      if (this.entry.type === "Scaffold") {
        const objects = this.$refs.scaffold.findObjectsWithGroupName(name);
        // If a region is not found use a hardcoded list to determine
        // its parents region first
        if (objects.length === 0) {
          let matched = getParentsRegion(name);
          if (matched) {
            return matched;
          }
          // Hardcoded list failed - use an endpoint to find its parents
          if (id && data.eventType === "selected") {
            return fetch(`${this.apiLocation}get-related-terms/${id}`)
              .then((response) => response.json())
              .then((data) => {
                if (data.uberon.array.length > 0) {
                  name = data.uberon.array[0].name.charAt(0).toUpperCase() + data.uberon.array[0].name.slice(1);
                  id = data.uberon.array[0].id.toUpperCase();
                  return {id, name};
                }
              }
            );
          }
        }
      } else if (this.entry.type === "MultiFlatmap") {
        if (name === "Bladder") {
          name = "Urinary Bladder";
        }
      }

      return {id, name};
    },
    handleSyncMouseEvent: async function (data) {
      let info = await this.getNameAndIdFromSyncData(data);
      if (data.eventType === "highlighted") {
        this.highlightFeatures(info);
      } else if (data.eventType === "selected") {
        this.zoomToFeatures(info, true);
      }
    },
    receiveSynchronisedEvent: async function (data) {
      if (data.paneIndex !== this.entry.id) {
        if (data.eventType == "panZoom") {
          this.handleSyncPanZoomEvent(data);
        } else {
          this.handleSyncMouseEvent(data);
        }
      } else {
        if (data.eventType == "selected") {
          let info = await this.getNameAndIdFromSyncData(data);
          this.zoomToFeatures(info, false);
        }
      }
    },
    toggleSynchronisedEvent: function (flag) {
      if (this.entry.type === "Scaffold") {
        this.$refs.scaffold.toggleSyncControl(flag);
        window.scaffold = this.$refs.scaffold;
      }
    },
    /**
     * Callback when the vuers emit a selected event.
     */
    scaffoldHighlighted: function (type, resource) {
      const result = {
        paneIndex: this.entry.id,
        type: type,
        resource: resource,
        internalName: undefined,
      };
      if (type == "Scaffold") {
        if (resource && resource[0]) {
          result.internalName = resource[0].data.id;
          result.eventType = "highlighted";
        }
        this.$emit("resource-selected", result);
      }
    },
    /**
     * Callback when the vuers emit a selected event.
     */
    scaffoldNavigated: function (type, resource) {
      const result = {
        paneIndex: this.entry.id,
        eventType: "panZoom",
        payload: resource,
        type: type,
      };
      this.$emit("resource-selected", result);
    },
    flatmapChanged: function (activeSpecies) {
      this.activeSpecies = activeSpecies;
      if (this.syncMode == true)
        this.toggleSyncMode();
      this.$emit("flatmapChanged");
    },
    multiFlatmapReady: function (component) {
      this.updateMarkers(component);
      //component.addPanZoomEvent();
    },
    updateMarkers: function (component) {
      let map = component.mapImp;
      map.clearMarkers();
      let params = [];
      if (this.apiLocation) {
        store.state.settings.facets.species.forEach((e) => {
          params.push(
            encodeURIComponent("species") + "=" + encodeURIComponent(e)
          );
        });
        if (this._controller) this._controller.abort();
        this._controller = new AbortController();
        let signal = this._controller.signal;
        fetch(`${this.apiLocation}get-organ-curies?${params.join("&")}`, {
          signal,
        })
          .then((response) => response.json())
          .then((data) => {
            this._controller = undefined;
            data.uberon.array.forEach((pair) => {
              this.idNamePair[pair.id.toUpperCase()] =
                pair.name.charAt(0).toUpperCase() + pair.name.slice(1);
              map.addMarker(pair.id.toUpperCase(), "simulation");
            });
            return;
          }
        );
      }
      //Previous attempt fails, use the hardcoded list
      let terms = getAvailableTermsForSpecies();
      for (let i = 0; i < terms.length; i++) {
        map.addMarker(terms[i].id, terms[i].type);
        this.idNamePair[terms[i].id] = terms[i].name;
      }
    },
    startHelp: function (id) {
      if (this.entry.id === id && this.isInHelp === undefined) {
        this.helpMode = true;
        window.addEventListener("mousedown", this.endHelp);
        this.isInHelp = true;
      }
    },
    endHelp: function () {
      window.removeEventListener("mousedown", this.endHelp);
      this.helpMode = false;
      setTimeout(() => {
        this.isInHelp = undefined;
      }, 200);
    },
  },
  data: function () {
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
      idNamePair: {},
      mouseHovered: false,
    };
  },
  created: function () {
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
    activeView() {
      return store.state.splitFlow.activeView;
    },
    syncMode() {
      return store.state.splitFlow.syncMode;
    },
    syncModeText() {
      if (this.syncMode) return "Close 3D Map";
      else return "Open 3D Map";
    },
  },
  watch: {
    facetSpecies: function () {
      if (this.entry.type === "Flatmap") {
        this.updateMarkers(this.$refs.flatmap);
      } else if (this.entry.type === "MultiFlatmap") {
        this.updateMarkers(this.$refs.multiflatmap.getCurrentFlatmap());
      }
    },
    syncMode: function (val) {
      if (this.entry.type === "MultiFlatmap")
        this.$refs.multiflatmap.getCurrentFlatmap().enablePanZoomEvents(val);
    },
  },
  mounted: function () {
    if (this.entry.type === "Scaffold") {
      this.scaffoldCamera =
        this.$refs.scaffold.$module.scene.getZincCameraControls();
      document.querySelectorAll(".el-checkbox-group")[0].id =
        "scaffold-checkbox-group-" + this.entry.id;
    }
    EventBus.$on("startHelp", (id) => {
      this.startHelp(id);
    });
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
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
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
  font-size: 16px;
  padding-top: 9px;
  padding-bottom: 9px;
  &.el-button--primary.is-plain {
    &:hover,
    &:active,
    &:focus {
      color: #8300bf;
      background: #f3e6f9;
      border-color: #cd99e5;
    }
    &:hover {
      box-shadow: -3px 2px 4px rgba(0, 0, 0, 0.2);
    }
  }
}
</style>

<style src="@/../assets/mapicon-species-style.css">
</style>
