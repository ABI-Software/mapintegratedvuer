<template>
  <ScaffoldVuer
    :state="entry.state"
    :url="entry.resource"
    :region="entry.region"
    @scaffold-selected="resourceSelected(entry.type, $event)"
    @scaffold-highlighted="scaffoldHighlighted(entry.type, $event)"
    @scaffold-navigated="scaffoldNavigated(entry.type, $event)"
    @on-ready="scaffoldIsReady"
    @open-map="openMap"
    ref="scaffold"
    :background-toggle="true"
    :traditional="true"
    :help-mode="helpMode"
    :render="visible"
    :display-latest-message="true"
    :warning-message="warningMessage"
    :display-minimap="false"
    :display-markers="false"
    :enableOpenMapUI="true"
    :view-u-r-l="entry.viewUrl"
    :markerLabels="markerLabels"
  />
</template>

<script>
/* eslint-disable no-alert, no-console */
import EventBus from "../EventBus";
import { ScaffoldVuer } from "@abi-software/scaffoldvuer/src/components/index.js";
import ContentMixin from "../../mixins/ContentMixin";
import store from "../../store";

export default {
  name: "Scaffold",
  mixins: [ ContentMixin ],
  components: {
    ScaffoldVuer,
  },
  methods: {
    onResize: function () {
      this.scaffoldCamera.onResize();
    },
    getState: function () {
      return this.$refs.scaffold.getState();
    },
    /**
     * Perform a local search on this contentvuer
     */
    search: function (term) {
      //Remove first and last letter if they are double quote
      const parsed = term.replace(/(^"|"$)/g, '');
      return this.$refs.scaffold.search(parsed, true);
    },
    searchSuggestions: function(term, suggestions){
      if (term === "" || !this.$refs.scaffold) {
        return suggestions;
      }
      const items = this.$refs.scaffold.fetchSuggestions(term);
      items.forEach(item => {
        if (item.suggestion) suggestions.push(item.suggestion);
      });
    },
    /**
     * Handle sync pan zoom event
     */
    handleSyncPanZoomEvent: function (data) {
      //Prevent recursive callback
      if (!this.mouseHovered) {
        if (data.type !== this.entry.type) {
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
        }
      }
    },
    displayTooltip: function(info) {
      let name = undefined;
      if (info) {
        name = info.name;
      }
      if (name) {
        this.$refs.scaffold.search(name, true);
      } else {
        this.$refs.scaffold.hideRegionTooltip();
      }
    },
    zoomToFeatures: function(info, forceSelect) {
      let names = undefined;
      if (Array.isArray(info)) names = info;
      else names = [ info.name ];
      if (forceSelect) {
        this.$refs.scaffold.changeActiveByName(names, "", false);
      }
      this.$refs.scaffold.viewRegion(names);
    },
    highlightFeatures: function(info) {
      let names = undefined;
      if (Array.isArray(info)) names = info;
      else names = [ info.name ];
      this.$refs.scaffold.changeHighlightedByName(names, "", false);
    },
    scaffoldIsReady: function () {
      this.scaffoldLoaded = true;
      this.$refs.scaffold.$module.graphicsHighlight.highlightColour = [1, 0, 1];
      if (this.isVisible()) {
        let rotation = "free";
        if (this.entry.rotation) rotation = this.entry.rotation;
        this.$refs.scaffold.toggleSyncControl(store.state.splitFlow.globalCallback, rotation);
        if (store.state.splitFlow.syncMode) this.$refs.scaffold.fitWindow();
      }
    },
    requestSynchronisedEvent: function (flag) {
      if (this.scaffoldLoaded) {
        let rotation = "free";
        if (this.entry.rotation) rotation = this.entry.rotation;
        this.$refs.scaffold.toggleSyncControl(flag, rotation);
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
      if (resource && resource[0]) {
        result.internalName = resource[0].data.id;
        result.eventType = "highlighted";
      }
      this.$emit("resource-selected", result);
    },
    /**
     * Callback when the vuers emit a selected event.
     */
    scaffoldNavigated: function (type, resource) {
      if (this.mouseHovered) {
        const result = {
          paneIndex: this.entry.id,
          eventType: "panZoom",
          payload: resource,
          type: type,
        };
        this.$emit("resource-selected", result);
      }
    },
    updateWithViewUrl: function(viewUrl) {
      this.$refs.scaffold.updateViewURL(viewUrl);
    },
  },
  computed: {
    warningMessage: function() {
      if (this.entry.isBodyScaffold) {
        return "This map displays the anatomical location and connectivity of nerves, through which the neuron populations from the ApiNATOMY models available in SCKAN can be routed.";
      } else {
        return "Under active development";
      }
    },
    markerLabels: function () {
      return store.state.settings.facetLabels;
    },
  },
  data: function () {
    return {
      apiLocation: process.env.VUE_APP_API_LOCATION,
      scaffoldCamera: undefined,
      scaffoldLoaded: false,
    };
  },
  mounted: function () {
    this.scaffoldCamera =
      this.$refs.scaffold.$module.scene.getZincCameraControls();
    EventBus.$on("startHelp", () => {
      this.startHelp();
    });
  },
};
</script>

<style scoped lang="scss">
::v-deep .message-popper {
  white-space: unset;
  max-width: 200px;
}
</style>
