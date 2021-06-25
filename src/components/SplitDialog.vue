<template>
  <div class="tab-container" ref="container">
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
          <pane key="one" min-size="20" :size="splitter2"></pane>
          <pane v-if="isSlotActive('fourth')" :size="100 - splitter2" key="four" min-size="20"></pane>
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
          <pane key="two" min-size="20" :size="splitter3"></pane>
          <pane v-if="isSlotActive('third')" key="three" min-size="20" :size="100 - splitter3"></pane>
        </splitpanes>
      </pane>
    </splitpanes>
    <div
      v-for="slot in slotInfo"
      :key="slot.name"
      :style="getToolbarStyle(slot)"
      :class="[getToolbarClass(slot), 'toolbar']"
    >
      <el-select
        :popper-append-to-body="false"
        :value="slot.id"
        placeholder="Select"
        class="select-box"
        popper-class="viewer_dropdown"
        @change="viewerChanged(slot , $event)"
      >
        <el-option
          v-for="entry in entries"
          :key="entry.id"
          :label="getEntryTitle(entry)"
          :value="entry.id"
        />
      </el-select>
    </div>
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
        @flatmapChanged="flatmapChanged"
        :visible="isVisible(entry.id)"
      />
    </div>
  </div>
</template>


<script>
/* eslint-disable no-alert, no-console */
import ContentVuer from "./ContentVuer";
import { Splitpanes, Pane } from "splitpanes";
import store from "../store";
import Vue from "vue";
import "splitpanes/dist/splitpanes.css";

export default {
  name: "SplitDialog",
  components: {
    ContentVuer,
    Splitpanes,
    Pane
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
    }
  },
  methods: {
    flatmapChanged: function() {
      this.$emit("flatmapChanged");
    },
    /**
     * Callback when the vuers emit a selected event.
     */
    resourceSelected: function(result) {
      this.$emit("resource-selected", result);
    },
    getClass: function(id) {
      let slot = store.getters["splitFlow/getSlotById"](id);
      if (slot) {
        if (slot.name == "first") {
          switch (store.state.splitFlow.activeView) {
            case "singlepanel":
              return "singlepanel-1";
            case "2horpanel":
              return "twohorpanel-1";
            case "2vertpanel":
            case "3panel":
              return "twovertpanel-1";
            case "4panel":
              return "fourpanel-1";
          }
        } else if (slot.name == "second") {
          switch (store.state.splitFlow.activeView) {
            case "2horpanel":
              return "twohorpanel-2";
            case "2vertpanel":
              return "twovertpanel-2";
            case "3panel":
            case "4panel":
              return "threepanel-2";
          }
        } else if (slot.name == "third") {
          switch (store.state.splitFlow.activeView) {
            case "3panel":
            case "4panel":
              return "threepanel-3";
          }
        } else if (slot.name == "fourth") {
          switch (store.state.splitFlow.activeView) {
            case "4panel":
              return "fourpanel-4";
          }
        }
      }
      return "inactive";
    },
    getStyle: function(id) {
      /* 
        Set the style based on the position of the spltters 
        Header is 30px in height and the splitter is 1px in
        height/width. The width, height and positon of the 
        viewer should take that into account.
      */
      let style = {};
      let slot = store.getters["splitFlow/getSlotById"](id);
      if (slot) {
        if (slot.name == "first") {
          switch (store.state.splitFlow.activeView) {
            case "2horpanel":
              style["height"] = "calc(" + this.splitter1.toString() + "% - 31px)";
              break;
            case "2vertpanel":
            case "3panel":
              style["width"] = "calc(" + this.splitter1.toString() + "% - 1px)";
              break;
            case "4panel":
              style["width"] = "calc(" + this.splitter1.toString() + "% - 1px)";
              style["height"] = "calc(" + this.splitter2.toString() + "% - 31px)";
              break;
          }
        } else if (slot.name == "second") {
          switch (store.state.splitFlow.activeView) {
            case "2horpanel":
              style["height"] =
                "calc(" + (100 - this.splitter1).toString() + "% - 31px)";
              style["top"] = "calc(" + this.splitter1.toString() + "% + 32px)";
              break;
            case "2vertpanel":
              style["width"] =
                "calc(" + (100 - this.splitter1).toString() + "% - 1px)";
              style["left"] = "calc(" + this.splitter1.toString() + "% + 2px)";
              break;
            case "3panel":
            case "4panel":
              style["width"] =
                "calc(" + (100 - this.splitter1).toString() + "% - 1px)";
              style["left"] = "calc(" + this.splitter1.toString() + "% + 2px)";
              style["height"] = "calc(" + this.splitter3.toString() + "% - 31px)";
              break;
          }
        } else if (slot.name == "third") {
          switch (store.state.splitFlow.activeView) {
            case "3panel":
            case "4panel":
              style["width"] =
                "calc(" + (100 - this.splitter1).toString() + "% - 1px)";
              style["left"] = "calc(" + this.splitter1.toString() + "% + 2px)";
              style["height"] =
                "calc(" + (100 - this.splitter3).toString() + "% - 31px)";
              style["top"] = "calc(" + this.splitter3.toString() + "% + 32px)";
              break;
          }
        } else if (slot.name == "fourth") {
          switch (store.state.splitFlow.activeView) {
            case "4panel":
              style["width"] = "calc(" + this.splitter1.toString() + "% - 1px)";
              style["height"] =
                "calc(" + (100 - this.splitter2).toString() + "% - 31px)";
              style["top"] = "calc(" + this.splitter2.toString() + "% + 32px)";
              break;
          }
        }
      }
      return style;
    },
    isSlotActive: function(name) {
      let slot = store.getters["splitFlow/getSlotByName"](name);
      if (slot) return store.getters["splitFlow/isSlotActive"](slot);
      return false;
    },
    isVisible: function(id) {
      let slot = store.getters["splitFlow/getSlotById"](id);
      if (slot) return store.getters["splitFlow/isSlotActive"](slot);
      return false;
    },
    getContentsState: function() {
      let states = [];
      let contents = this.$refs["content"];
      for (let i = 0; i < contents.length; i++) {
        states.push(contents[i].getState());
      }
      return states;
    },
    getToolbarClass: function(slot) {
      if (slot.name == "first") {
        switch (store.state.splitFlow.activeView) {
          case "singlepanel":
          case "2horpanel":
            return "singlepanel-1";
          case "2vertpanel":
          case "3panel":
          case "4panel":
            return "twovertpanel-1";
        }
      } else if (slot.name == "second") {
        switch (store.state.splitFlow.activeView) {
          case "2horpanel":
            return "twohorpanel-2";
          case "2vertpanel":
          case "3panel":
          case "4panel":
            return "twovertpanel-2";
        }
      } else if (slot.name == "third") {
        switch (store.state.splitFlow.activeView) {
          case "3panel":
          case "4panel":
            return "threepanel-3";
        }
      } else if (slot.name == "fourth") {
        switch (store.state.splitFlow.activeView) {
          case "4panel":
            return "fourpanel-4";
        }
      }
      return "inactive";
    },
    getToolbarStyle: function(slot) {
      /* 
        Set the toolbar style based on the position of the spltters 
        The splitter is 1px in height/width. 
        The width and position of the toolbar should
        take that into account.
      */
      let style = {};
      if (slot) {
        if (slot.name == "first") {
          switch (store.state.splitFlow.activeView) {
            case "2vertpanel":
            case "3panel":
            case "4panel":
              style["width"] = "calc(" + this.splitter1.toString() + "% - 1px)";
              break;
          }
        } else if (slot.name == "second") {
          switch (store.state.splitFlow.activeView) {
            case "2horpanel":
              style["top"] = "calc(" + this.splitter1.toString() + "% + 2px)";
              break;
            case "2vertpanel":
            case "3panel":
            case "4panel":
              style["width"] =
                "calc(" + (100 - this.splitter1).toString() + "% - 1px)";
              style["left"] = "calc(" + this.splitter1.toString() + "% + 2px)";
              break;
          }
        } else if (slot.name == "third") {
          switch (store.state.splitFlow.activeView) {
            case "3panel":
            case "4panel":
              style["width"] =
                "calc(" + (100 - this.splitter1).toString() + "% - 1px)";
              style["left"] = "calc(" + this.splitter1.toString() + "% + 2px)";
              style["top"] = "calc( " + this.splitter3.toString() + "% + 2px)";
              break;
          }
        } else if (slot.name == "fourth") {
          switch (store.state.splitFlow.activeView) {
            case "4panel":
              style["width"] = "calc(" + this.splitter1.toString() + "% - 1px)";
              style["top"] = "calc(" + this.splitter2.toString() + "% + 2px)";
              break;
          }
        }
      }
      return style;
    },
    getEntryTitle: function(entry) {
      if (entry) {
        let title = entry.label + " " + entry.type;
        if (entry.discoverId) title = title + " dataset " + entry.discoverId;
        return title;
      }
      return "Viewer";
    },
    getSlotTitle: function(slot) {
      let entry = this.entries.find(entry => entry.id === slot.id);
      return this.getEntryTitle(entry);
    },
    viewerChanged: function(slot, value) {
      if (slot.id && slot.id != value) {
        store.commit("splitFlow/assignOrSwapIdToSlot", {
          slot: slot,
          id: value
        });
        Vue.nextTick(() => {
          setTimeout(() => {
            for (let i = 0; i < this.$refs.content.length; i++) {
              this.$refs.content[i].onResize();
            }
          }, 1200);
        });
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
    // This computed property populates filter data's entry object with $data from this sidebar
    slotInfo: function() {
      return store.state.splitFlow.slotInfo;
    },
    horizontal() {
      if (store.state.splitFlow.activeView === "2horpanel") {
        return true;
      }
      return false;
    },
    splitters() {
      return store.state.splitFlow.splitters;
    }
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
  } 
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
>>> .splitpanes.default-theme .splitpanes__pane {
  background-color: #ccc !important;
  position: relative;
}

>>> .splitpanes__splitter {
  margin: 0px 0px 0px 0px !important;
  z-index: 6 !important;
}

>>> .splitpanes--vertical > .splitpanes__splitter {
  background-color: #ccc !important;
  width: 1px;
  border-left: unset;
}

>>> .splitpanes--horizontal > .splitpanes__splitter {
  background-color: #ccc !important;
  height: 1px;
  border-top: unset;
}

>>> .splitpanes__splitter:before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  transition: opacity 0.4s;
  background-color: rgba(131, 0, 191, 0.3) !important;
  opacity: 0;
  z-index: 6 !important;
}

>>> .splitpanes__splitter:hover:before {
  opacity: 1;
}

>>> .splitpanes--vertical > .splitpanes__splitter:before {
  left: -3px;
  width: 11px;
  height: 100%;
}

>>> .splitpanes--horizontal > .splitpanes__splitter:before {
  top: -2px;
  height: 10px;
  width: 100%;
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
}

.contentvuer.singlepanel-1 {
  width: 100%;
  height: calc(100% - 30px);
  left: 0px;
  top: 30px;
  z-index: 2;
}

.contentvuer.twohorpanel-1 {
  width: 100%;
  height: calc(50% - 31px);
  left: 0px;
  top: 30px;
  z-index: 2;
}

.contentvuer.twohorpanel-2 {
  width: 100%;
  height: calc(50% - 31px);
  left: 0px;
  top: calc(50% + 32px);
  z-index: 2;
}

.contentvuer.twovertpanel-1 {
  width: calc(50% - 1px);
  height: calc(100% - 30px);
  left: 0px;
  top: 30px;
  z-index: 2;
}

.contentvuer.twovertpanel-2 {
  width: calc(50% - 1px);
  height: calc(100% - 30px);
  left: calc(50% + 2px);
  top: 30px;
  z-index: 2;
}

.contentvuer.threepanel-2 {
  width: calc(50% - 1px);
  height: calc(50% - 32px);
  left: calc(50% + 2px);
  top: 30px;
  z-index: 2;
}

.contentvuer.threepanel-3 {
  width: calc(50% - 1px);
  height: calc(50% - 31px);
  left: calc(50% + 2px);
  top: calc(50% + 32px);
  z-index: 1;
}

.contentvuer.fourpanel-1 {
  width: calc(50% - 1px);
  height: calc(50% - 31px);
  left: 0px;
  top: 30px;
  z-index: 4;
}

.contentvuer.fourpanel-4 {
  width: calc(50% - 1px);
  height: calc(50% - 31px);
  left: 0px;
  top: calc(50% + 32px);
  z-index: 3;
}

.contentvuer.inactive {
  display: none;
  width: 0%;
  height: 0%;
  left: 0px;
  top: 30px;
}

.toolbar {
  background-color: white !important;
  position: absolute;
  transition: all 1s ease;
  height: 29px;
  border-bottom: 1px solid rgb(220, 223, 230);
  z-index: 5;
}

.toolbar.singlepanel-1 {
  left: 0px;
  top: 0px;
  width: 100%;
}

.toolbar.twohorpanel-2 {
  width: 100%;
  left: 0px;
  top: 50%;
  border-top: 1px solid rgb(220, 223, 230);
}

.toolbar.twovertpanel-1 {
  left: 0px;
  top: 0px;
  width: calc(50% - 1px);
}

.toolbar.twovertpanel-2 {
  width: calc(50% - 1px);
  left: calc(50% + 2px);
  top: 0px;
  border-left: 1px solid rgb(220, 223, 230);
}

.toolbar.threepanel-3 {
  width: calc(50% - 1px);
  left: calc(50% + 2px);
  top: calc(50% + 2px);
  border-top: 1px solid rgb(220, 223, 230);
  border-left: 1px solid rgb(220, 223, 230);
}

.toolbar.fourpanel-4 {
  width: calc(50% - 1px);
  left: 0px;
  top: calc(50% + 2px);
  border-top: 1px solid rgb(220, 223, 230);
}

.toolbar.inactive {
  display: none;
  left: 0px;
  top: 0px;
}

.toolbar-title {
  width: 107px;
  height: 20px;
  color: rgb(131, 0, 191);
  font-size: 14px;
  font-weight: normal;
  line-height: 20px;
  margin-left: 11px;
  margin-top: 4px;
}

.select-box {
  width: 180px;
  border-radius: 4px;
  border: 1px solid rgb(144, 147, 153);
  background-color: var(--white);
  font-weight: 500;
  color: rgb(48, 49, 51);
  margin-left: 8px;
  margin-top: 2px;
}

.select-box >>> .el-input__inner {
  color: rgb(131, 0, 191);
  height: 24px;
  padding-left: 8px;
  padding-right: 8px;
}
i .select-box >>> .el-input__icon {
  color: rgb(48, 49, 51);
  height: 24px;
  padding-left: 8px;
  padding-right: 8px;
}

.select-box >>> .el-input__icon {
  line-height: 24px;
}

.select-box >>> .is-focus .el-input__inner {
  border: 1px solid #8300bf;
}

.viewer_dropdown {
  z-index: 5;
}

.viewer_dropdown .el-select-dropdown__item {
  white-space: nowrap;
  text-align: left;
}

.viewer_dropdown .el-select-dropdown__item.selected {
  color: #8300bf;
  font-weight: normal;
}
</style>
