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
      <Component
        :is="viewerType"
        :entry="entry"
        :mouseHovered="mouseHovered"
        :visible="visible"
        ref="viewer"
        @resource-selected="resourceSelected"
        @species-changed="speciesChanged"
      />
    </div>
  </div>
</template>

<script>
/* eslint-disable no-alert, no-console */
import Vue from "vue";
import { Button } from "element-ui";
import DatasetHeader from "./DatasetHeader";
import Flatmap from "./viewers/Flatmap";
import Iframe from "./viewers/Iframe";
import MultiFlatmap from "./viewers/MultiFlatmap";
import Plot from "./viewers/Plot";
import Scaffold from "./viewers/Scaffold";
import Simulation from "./viewers/Simulation";
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
    Flatmap,
    Iframe,
    MultiFlatmap,
    Plot,
    Scaffold,
    Simulation,
  },
  methods: {
    /**
     * Toggle sync mode on/off depending on species and current state
     */
    toggleSyncMode: function () {
      this.$refs.viewer.toggleSyncMode();
    },
    getId: function () {
      return this.entry.id;
    },
    getState: function () {
      return this.$refs.viewer.getState();
    },       
    resourceSelected: function (payload) {
      this.$emit("resource-selected", payload);
    },
    speciesChanged: function (species) {
      this.activeSpecies = species;
    },
    /**
     * Perform a local search on this contentvuer
     */
    search: function (term) {
      return this.$refs.viewer.search(term);
    },
    /**
     * Push the suggested terms into the suggestions array
     */
    searchSuggestions: function(term, suggestions) {
      this.$refs.viewer.searchSuggestions(term, suggestions);
    },
    receiveSynchronisedEvent: async function (data) {
      this.$refs.viewer.receiveSynchronisedEvent(data);
    },
    requestSynchronisedEvent: function (flag) {
      this.$refs.viewer.requestSynchronisedEvent(flag);
    },
    /**
     * Check if this viewer is currently visible
     */
    isVisible: function() {
      let slot = store.getters["splitFlow/getSlotById"](this.entry.id);
      if (slot) return store.getters["splitFlow/isSlotActive"](slot);
      return false;
    },
    onResize: function () {
      this.$refs.viewer.onResize();
    },
  },
  data: function () {
    return {
      mainStyle: {
        height: this.entry.datasetTitle ? "calc(100% - 30px)" : "100%",
        width: "100%",
        bottom: "0px",
      },
      mouseHovered: false,
      activeSpecies: "Rat",
    };
  },
  computed: {
    syncMode() {
      return store.state.splitFlow.syncMode;
    },
    syncModeText() {
      if (this.syncMode) return "Close 3D Map";
      else return "Open 3D Map";
    },
    viewerType() {
      switch (this.entry.type) {
        case "Biolucida":
        case "Iframe":
        case "Segmentation":
          return 'Iframe';
        default:
          return this.entry.type;
      }
    },
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
