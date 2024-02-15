<template>
  <div
    style="height: 100%; width: 100%; position:absolute"
    ref="display"
  />
</template>

<script>
/* eslint-disable no-alert, no-console */
import ResizeSensor from "css-element-queries/src/ResizeSensor";

export default {
  name: "ResizeSensor",
  methods: {
    activate: function() {
      if (!this._sensor) {
        this._sensor = new ResizeSensor(this.$refs.display, this.displayResize);
        this.displayResize();
      }
    },
    deactivate: function() {
      this._sensor.detach(this.$refs.display, this.displayResize);
      delete this._sensor;
      this._sensor = undefined;
      this.displayResize();
    },
    displayResize: function() {
      this.$emit("resize");
    },
  },
  beforeUnmount() {
    this.deactivate();
  },
  activated() {
    this.activate();
  },
  deactivated() {
    this.deactivate();
  },
  mounted: function () {
    this.activate();
  }
};
</script>

