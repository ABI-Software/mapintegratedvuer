<template>
  <div class="tab-container" ref="tabContainer">
    <splitpanes
      class="default-theme"
      :horizontal="horizontal"
      :dbl-click-splitter="false"
      @resized="resized('first', $event)"
      @resize="resize"
    >
      <pane min-size="20" :size="splitter1">
        <splitpanes
          class="default-theme"
          :horizontal="true"
          :dbl-click-splitter="false"
          @resized="resized('second', $event)"
          @resize="resize"
        >
          <pane key="one" min-size="20" :size="splitter2" ref="pane-1">
            <resize-sensor :initial="true" @resize="calculateStyles(1)"></resize-sensor>
          </pane>
          <pane v-if="isSlotActive('fourth')" :size="100 - splitter2" key="four" min-size="20" ref="pane-4">
            <resize-sensor :initial="true" @resize="calculateStyles(4)"></resize-sensor>
          </pane>
        </splitpanes>
      </pane>
      <pane v-if="isSlotActive('second')" min-size="20" :size="100 - splitter1">
        <splitpanes
          class="default-theme"
          :horizontal="true"
          :dbl-click-splitter="false"
          @resized="resized('third', $event)"
          @resize="resize"
        >
          <pane key="two" min-size="20" :size="splitter3" ref="pane-2">
            <resize-sensor :initial="true" @resize="calculateStyles(2)"></resize-sensor>
          </pane>
          <pane v-if="isSlotActive('third')" key="three" min-size="20" :size="100 - splitter3" ref="pane-3">
            <resize-sensor :initial="true" @resize="calculateStyles(3)"></resize-sensor>
          </pane>
        </splitpanes>
      </pane>
    </splitpanes>
    <div
      v-for="entry in entries"
      :key="entry.id"
      :style="getStyle(entry.id)"
      :class="[getClass(entry.id), 'contentvuer']"
    >
      <ContentVuer
        :key="entry.id"
        :entry="entry"
        ref="content"
        @resource-selected="resourceSelected"
        :visible="isIdVisible(entry.id)"
      />
    </div>
  </div>
</template>


<script>
/* eslint-disable no-alert, no-console */
import ContentVuer from "./ContentVuer";
import ResizeSensor from "vue-resize-sensor";
//import SplitpanesBar from "./SplitpanesBar";
import { Splitpanes, Pane } from "splitpanes";
import store from "../store";
import Vue from "vue";
import "splitpanes/dist/splitpanes.css";
import {
  Input,
  Option,
  Popover,
  Select
} from "element-ui";
Vue.use(Input);
Vue.use(Option);
Vue.use(Popover);
Vue.use(Select);

export default {
  name: "SplitDialog",
  components: {
    ContentVuer,
    Splitpanes,
//    SplitpanesBar,
    Pane,
    ResizeSensor
  },
  props: {
    entries: {
      type: Array,
      default: function() {
        return [];
      }
    }
  },
  data: function() {
    return {
      splitter1: 50,
      splitter2: 50,
      splitter3: 50,
      searchText: [],
      isFlatmap: {
        first: true,
        second: false,
        third: false,
        fourth: false
      },
      styles: { 

      }
    }
  },
  methods: {
    /**
     * Callback when the vuers emit a selected event.
     */
    resourceSelected: function(result) {
      this.$emit("resource-selected", result);
    },
    getClass: function(id) {
      if (this.isIdVisible(id)) {
        return this.getRefsName(id);
      } else {
        return "inactive";
      }
    },
    getRefsName: function(id) {
      let slot = store.getters["splitFlow/getSlotById"](id);
      let index = 0;
      if (slot) {
        if (slot.name == "first") {
          index = 1;
        } else if (slot.name == "second") {
          index = 2;
        } else if (slot.name == "third") {
          index = 3;
        } else if (slot.name == "fourth") {
          index = 4;
        }
      }
      const refName = `pane-${index}`;
      if (index !== 0) {
        if (!(refName in this.styles)) {
           Vue.set(this.styles, refName, {});
        }
      } 

      return refName;
    },
    getStyle: function(id) {
      /* 
        Set the style based on the position of the spltters 
        Header is 30px in height and the splitter is 1px in
        height/width. The width, height and positon of the 
        viewer should take that into account.
      */
      const refName = this.getRefsName(id);
      if (refName in this.styles && this.styles[refName]) {
        return this.styles[refName];
      }
      return {};
    },
    getActiveContents: function() {
      const activeContents = [];
      const vuers = this.$refs['content'];
      if (vuers) {
        vuers.forEach(vuer => {
          if (vuer.isVisible())
            activeContents.push(vuer);
        });
      }
      return activeContents;
    },
    isSlotActive: function(name) {
      let slot = store.getters["splitFlow/getSlotByName"](name);
      if (slot) return store.getters["splitFlow/isSlotActive"](slot);
      return false;
    },
    isIdVisible: function(id) {
      let slot = store.getters["splitFlow/getSlotById"](id);
      if (slot) return store.getters["splitFlow/isSlotActive"](slot);
      return false;
    },
    sendSynchronisedEvent: function(resource) {
      const activeContents = this.getActiveContents();
      activeContents.forEach(content => {
        content.receiveSynchronisedEvent(resource);
      });
    },
    getContentsWithId: function(id) {
      let contents = this.$refs["content"];
      for (let i = 0; i < contents.length; i++) {
        if (contents[i].getId() == id) {
          return contents[i];
        }
      }
      return undefined;
    },
    getContentsState: function() {
      let states = [];
      let contents = this.$refs["content"];
      for (let i = 0; i < contents.length; i++) {
        states.push(contents[i].getState());
      }
      return states;
    },
    calculateStyles: function(index) {
      if (this.$refs && ('tabContainer' in this.$refs)) {
        const bound = this.$refs['tabContainer'].getBoundingClientRect();
        const refName = `pane-${index}`;
        if (refName in this.$refs && this.$refs[refName] && this.$refs[refName].$el) {
          const el = this.$refs[refName].$el;
          const {top, left, width, height} = el.getBoundingClientRect();
          const style = {};
          style["width"] = `${width}px`;
          style["left"] = `${left - bound.left}px`;
          style["height"] = `${height}px`;
          style["top"] = `${top - bound.top}px`;
          Vue.set(this.styles, refName, style);
        }
      }
    },
    updateStyles: function(index) {
      //Need to wait for the pane to be resized first
      if (index !== -1) {
        this.calculateStyles(index);
      } else {
        for (let i = 1; i <= 4; i++) {
          this.calculateStyles(i);
        }
      }
    },
    resize: function() {
      this.__userResize__ = true;
    },
    resized: function(splitterName, event) {
      if (this.__userResize__) {
        store.commit("splitFlow/setSplitter", {
          name: splitterName,
          value: event[0].size
        });
      }
      this.__userResize__ = false;
    }
  },
  computed: {
    horizontal() {
      if (store.state.splitFlow.activeView === "2horpanel") {
        return true;
      }
      return false;
    },
    splitters() {
      return store.state.splitFlow.splitters;
    },
    globalCallback() {
      return store.state.splitFlow.globalCallback;
    },
  },
  watch: {
    splitters: {
      handler: function() {
        this.splitter1 = store.state.splitFlow.splitters.first;
        this.splitter2 = store.state.splitFlow.splitters.second;
        this.splitter3 = store.state.splitFlow.splitters.third;
      },
      immediate: true,
      deep: true
    },
    globalCallback: {
      handler: function(val) {
        //Only activate for active
        if (val) {
          const contents = this.getActiveContents();
          if (contents) {
            contents.forEach(content => {
              content.requestSynchronisedEvent(val);
            });
          }
        } else {
          //Turn sync off, this can be requested for all contents
          const contents = this.$refs['content'];
          if (contents) {
            contents.forEach(content => {
              content.requestSynchronisedEvent(false);
            });
          }
        }
      },
      immediate: true,
      deep: true
    },
  }
};
</script>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import "~element-ui/packages/theme-chalk/src/input";
@import "~element-ui/packages/theme-chalk/src/option";
@import "~element-ui/packages/theme-chalk/src/popover";
@import "~element-ui/packages/theme-chalk/src/select";

::v-deep .splitpanes.default-theme .splitpanes__pane {
  background-color: #ccc !important;
  position: relative;
}

::v-deep .splitpanes__splitter {
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

::v-deep .splitpanes--horizontal > .splitpanes__splitter,
::v-deep .splitpanes--vertical > .splitpanes__splitter {
  background-color: #ccc !important;
  border-left: unset;
}

::v-deep .splitpanes--horizontal > .splitpanes__splitter {
  height: 1px;
  &::before {
    top: -2px;
    height: 10px;
    width: 100%;
  }
}

::v-deep .splitpanes--vertical > .splitpanes__splitter {
  width: 1px;
  &::before {
    left: -3px;
    width: 11px;
    height: 100%;
  }
}

.tab-container {
  position: absolute;
  width: 100% !important;
  height: 100% !important;
  left: 0px !important;
  top: 0px !important;
}

.button-group {
  position: absolute;
  top: 1%;
  right: 1%;
}

.contentvuer {
  position: absolute;
  transition: all 1s ease;
  background: rgba(255, 255, 255, 1);

  &.inactive {
    display: none;
    width: 0%;
    height: 0%;
    left: 0px;
    top: 30px;
  }
}
</style>
