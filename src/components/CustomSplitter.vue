<template>
  <div style="height: 100%; width: 100%">
    <resize-sensor
      @resize="calculateStyles(index)">
    </resize-sensor>
    <splitpanes
      class="default-theme"
      :horizontal="isHorizontal"
      :dbl-click-splitter="false"
    >
      <template v-for="(child) in children" :key="child">
        <pane :ref="child" @vue:beforeUnmount="childUnmounted(child)">
          <resize-sensor
            v-if="customLayout[child].content"
            @resize="calculateStyles(child)">
          </resize-sensor>
          <custom-splitter 
            v-else
            :key="child"
            :index="child"
          />
        </pane>
      </template>
    </splitpanes>
  </div>
</template>


<script>
/* eslint-disable no-alert, no-console */
import EventBus from './EventBus';
import ResizeSensor from "./ResizeSensor.vue";
import { Splitpanes, Pane } from "splitpanes";
import "splitpanes/dist/splitpanes.css";
import { mapStores } from 'pinia';
import { useSplitFlowStore } from '../stores/splitFlow';

export default {
  name: "CustomSplitter",
  components: {
    Splitpanes,
    Pane,
    ResizeSensor
  },
  props: {
    index: {
      type: String,
      default: function() {
        return "split-1";
      }
    }
  },
  methods: {
    requestStylesUpdate: function(refName) {
      if (this.$refs) {
        if (refName in this.$refs && this.$refs[refName] && 
        this.$refs[refName][0] && this.$refs[refName][0].$el) {
          const el = this.$refs[refName][0].$el;
          const rect = el.getBoundingClientRect();
          EventBus.emit("PaneResize", {refName, rect});

        }
      }
    },
    /**
     * Callback when the vuers emit a selected event.
     */
    calculateStyles: function(refName) {
      if (this.$refs) {
        if (refName.startsWith("pane")) {
          this.requestStylesUpdate(refName);
        } else if (refName.startsWith("split")) {
          this.customLayout[refName].children.forEach((childName) => {
            if (childName.startsWith("pane")) {
               this.requestStylesUpdate(childName);
            }
          });
        }
      }
    },
    childUnmounted: function(refName) {
      EventBus.emit("PaneUnmounted", {refName});
    }
  },
  computed: {
    ...mapStores(useSplitFlowStore),
    children() {
      return this.customLayout[this.index].children;
    },
    customLayout() {
      return this.splitFlowStore.customLayout;
    },
    isHorizontal() {
      return this.customLayout[this.index].horizontal;
    },
  },
};
</script>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">

:deep() {
  .splitpanes.default-theme .splitpanes__pane {
    background-color: #ccc !important;
    position: relative;
  }
}

:deep(.splitpanes__splitter) {
  margin: 0px 0px 0px 0px !important;
  z-index: 6 !important;
  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    transition: opacity 0.4s;
    background-color: rgba(131, 0, 191, 0.3) !important;
    opacity: 0;
    z-index: 7 !important;
    &:hover {
      opacity: 1;
    }
  }
}

:deep(.splitpanes--horizontal > .splitpanes__splitter),
:deep(.splitpanes--vertical > .splitpanes__splitter) {
  background-color: #ccc !important;
  border-left: unset;
}

:deep(.splitpanes--horizontal > .splitpanes__splitter) {
  height: 1px;
  &::before {
    top: -2px;
    height: 10px;
    width: 100%;
  }
}

:deep(.splitpanes--vertical > .splitpanes__splitter) {
  width: 1px;
  &::before {
    left: -3px;
    width: 11px;
    height: 100%;
  }
}

</style>
