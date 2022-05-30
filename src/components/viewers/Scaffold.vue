<template>
  <ScaffoldVuer
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
      let capitalised = term.charAt(0).toUpperCase() + term.slice(1);
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
      let name = info.name;
      if (forceSelect) {
        this.$refs.scaffold.changeActiveByName(name, "", false);
      }
      this.$refs.scaffold.viewRegion(name);
    },
    highlightFeatures: function(info) {
      let name = info.name;
      this.$refs.scaffold.changeHighlightedByName(name, "", false);
    },
    scaffoldIsReady: function () {
      this.scaffoldLoaded = true;
      if (this.isVisible())
        this.$refs.scaffold.toggleSyncControl(store.state.splitFlow.globalCallback);
    },
    requestSynchronisedEvent: function (flag) {
      if (this.scaffoldLoaded) {
        this.$refs.scaffold.toggleSyncControl(flag);
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
      const result = {
        paneIndex: this.entry.id,
        eventType: "panZoom",
        payload: resource,
        type: type,
      };
      this.$emit("resource-selected", result);
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
    document.querySelectorAll(".el-checkbox-group")[0].id =
      "scaffold-checkbox-group-" + this.entry.id;
    EventBus.$on("startHelp", (id) => {
      this.startHelp(id);
    });
  },
};
</script>
