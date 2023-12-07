<template>
  <div class="tab-container" ref="tabContainer">
    <custom-splitter
      index="split-1"
      key="split-1"
    />
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
import CustomSplitter from "./CustomSplitter";
import EventBus from './EventBus';
//import SplitpanesBar from "./SplitpanesBar";
import store from "../store";
import Vue from "vue";
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
    CustomSplitter,
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
      styles: { }
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
      const refName = store.getters["splitFlow/getPaneNameById"](id);
      if (refName) {
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
      if (refName && refName in this.styles && this.styles[refName]) {
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
    isIdVisible: function(id) {
      const refName = store.getters["splitFlow/getPaneNameById"](id);
      return refName !== undefined;
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
      if (this.$refs) {
        const refName = `pane-${index}`;
        if (refName in this.$refs && this.$refs[refName] && this.$refs[refName].$el) {
          const el = this.$refs[refName].$el;
          const rect = el.getBoundingClientRect();
          this.setStyles(refName, rect);
        }
      }
    },
    setStyles: function(refName, rect) {
      if (this.$refs && ('tabContainer' in this.$refs)) {
        const bound = this.$refs['tabContainer'].getBoundingClientRect();
        const style = {};
        style["width"] = `${rect.width}px`;
        style["left"] = `${rect.left - bound.left}px`;
        style["height"] = `${rect.height}px`;
        style["top"] = `${rect.top - bound.top}px`;
        console.log(refName, JSON.stringify(style));
        Vue.set(this.styles, refName, style);
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
    activeView: function() {
      return store.state.splitFlow.activeView;
    },
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
  },
  mounted: function () {
    EventBus.$on("PaneResize", payload => {
      this.setStyles(payload.refName, payload.rect);
    });
  },
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
