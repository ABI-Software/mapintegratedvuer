<template>
  <ScaffoldVuer
    :state="entry.state"
    :url="entry.resource"
    :region="entry.region"
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
</template>

<script>
/* eslint-disable no-alert, no-console */
import EventBus from "../EventBus";
import { capitalise} from '../scripts/utilities.js';
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
      let capitalised = capitalise(term);
      const objects = this.$refs.scaffold.findObjectsWithGroupName(capitalised);
      if (objects.length > 0) {
        this.$refs.scaffold.changeActiveByName(capitalised, "", false);
        this.$refs.scaffold.viewRegion(capitalised);
        return true
      }
      return false;
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
    /**
     * Check if this viewer is currently visible
     */
    isVisible: function() {
      let slot = store.getters["splitFlow/getSlotById"](this.entry.id);
      if (slot) return store.getters["splitFlow/isSlotActive"](slot);
      return false;
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
