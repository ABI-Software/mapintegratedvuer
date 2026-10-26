<template>
  <div style="height: 100%; width: 100%; position: absolute" ref="display" />
</template>

<script>
export default {
  name: 'ResizeSensor',
  methods: {
    activate: function () {
      if (!this._observer && this.$refs.display) {
        this._observer = new ResizeObserver(() => this.displayResize());
        this._observer.observe(this.$refs.display);
        this.displayResize();
      }
    },
    deactivate: function () {
      if (this._observer) {
        this._observer.disconnect();
        this._observer = undefined;
        this.displayResize();
      }
    },
    displayResize: function () {
      this.$emit('resize');
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
  },
};
</script>
