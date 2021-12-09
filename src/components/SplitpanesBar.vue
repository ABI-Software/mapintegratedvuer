<template>
  <div>
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
  </div>
</template>


<script>
/* eslint-disable no-alert, no-console */
import Vue from "vue";
import store from "../store";
import { Option, Select } from "element-ui";
import lang from "element-ui/lib/locale/lang/en";
import locale from "element-ui/lib/locale";

locale.use(lang);
Vue.use(Option);
Vue.use(Select);

export default {
  name: "SplitpanesBar",
  components: {},
  props: {
    entries: {
      type: Array,
      default: function() {
        return [];
      }
    },
    splitter1: {
      type: Number,
      default: 50
    },
    splitter2: {
      type: Number,
      default: 50
    },
    splitter3: {
      type: Number,
      default: 50
    },
  },
  computed: {
    // This computed property populates filter data's entry object with $data from this sidebar
    slotInfo: function() {
      return store.state.splitFlow.slotInfo;
    },
  },
  methods: {
    getEntryTitle: function(entry) {
      if (entry) {
        let title = entry.label ? entry.label + " ": '';
        title += entry.type;
        if (entry.datasetId)
          title += " (" + entry.datasetId + ")";
        else if (entry.discoverId)
          title += " (" + entry.discoverId + ")";
        return title;
      }
      return "Viewer";
    },
    getSlotTitle: function(slot) {
      let entry = this.entries.find(entry => entry.id === slot.id);
      return this.getEntryTitle(entry);
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
    viewerChanged: function(slot, value) {
      if (slot.id && slot.id != value) {
        store.commit("splitFlow/assignOrSwapIdToSlot", {
          slot: slot,
          id: value
        });
        Vue.nextTick(() => {
          setTimeout(() => {
            this.$emit("chooser-changed");
          }, 1200);
        });
      }
    },
  }
};
</script>


<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import "~element-ui/packages/theme-chalk/src/option";
@import "~element-ui/packages/theme-chalk/src/select";

.toolbar {
  background-color: #f5f7fa !important;
  position: absolute;
  transition: all 1s ease;
  height: 29px;
  border-bottom: 1px solid rgb(220, 223, 230);
  z-index: 5;

  &.singlepanel-1 {
    left: 0px;
    top: 0px;
    width: 100%;
  }

  &.twohorpanel-2 {
    width: 100%;
    left: 0px;
    top: 50%;
    border-top: 1px solid rgb(220, 223, 230);
  }

  &.twovertpanel-1 {
    left: 0px;
    top: 0px;
    width: calc(50% - 1px);
  }

  &.twovertpanel-2 {
    width: calc(50% - 1px);
    left: calc(50% + 2px);
    top: 0px;
    border-left: 1px solid rgb(220, 223, 230);
  }

  &.threepanel-3 {
    width: calc(50% - 1px);
    left: calc(50% + 2px);
    top: calc(50% + 2px);
    border-top: 1px solid rgb(220, 223, 230);
    border-left: 1px solid rgb(220, 223, 230);
  }

  &.fourpanel-4 {
    width: calc(50% - 1px);
    left: 0px;
    top: calc(50% + 2px);
    border-top: 1px solid rgb(220, 223, 230);
  }

  &.inactive {
    display: none;
    left: 0px;
    top: 0px;
  }
}

.toolbar-title {
  width: 107px;
  height: 20px;
  color: $app-primary-color;
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

  ::v-deep .el-input__inner {
    color: $app-primary-color;
    height: 24px;
    padding-left: 8px;
    padding-right: 8px;
  }
  ::v-deep .el-input__icon {
    line-height: 24px;
  }

  ::v-deep .is-focus .el-input__inner {
    border: 1px solid $app-primary-color;
  }
}

i .select-box ::v-deep .el-input__icon {
  color: rgb(48, 49, 51);
  height: 24px;
  padding-left: 8px;
  padding-right: 8px;
}

.viewer_dropdown {
  z-index: 5;
  .el-select-dropdown__item {
    white-space: nowrap;
    text-align: left;
    &.selected {
      color: $app-primary-color;
      font-weight: normal;
    }
  }
}
</style>
