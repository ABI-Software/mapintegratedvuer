<template>
  <div>
    <div
      v-for="slot in slotInfo"
      :key="slot.name"
      :style="getToolbarStyle(slot)"
      :class="[getToolbarClass(slot), 'toolbar']"
    >
      <div class="toolbar-flex-container">
        <el-select
          v-if="entries.length > 1"
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
        <div v-else class="text title">
          {{ getEntryTitle(entries[0]) }}
        </div>
      </div>
      <el-row class="icon-group">
        <el-popover class="tooltip" content="Close and remove" placement="bottom-end" :open-delay="helpDelay"
          :appendToBody=false trigger="hover" popper-class="header-popper" >
          <map-svg-icon icon="close" slot="reference" class="header-icon"
            v-if="(activeView !== 'singlepanel') && (isSearchable[slot.name] == false)"
            @click.native="closeAndRemove(slot)"/>
        </el-popover>

        
        <div v-show="contextCardVisible[slot.name]" class="hide" @click="contextCardVisible[slot.name] = false">
          Hide information
          <i class="el-icon-arrow-up"></i>
        </div>
        <div v-show="!contextCardVisible[slot.name]" class="hide" @click="contextCardVisible[slot.name] = true">
          Show information
          <i class="el-icon-arrow-down"></i>
        </div>
        <el-popover
          v-if="container != undefined"
          placement="bottom"
          :appendToBody="false"
          trigger="manual"
          width="450"
          offset=0
          class="context-card-popover"
          :popper-options="popperOptions"
          v-model="contextCardVisible[slot.name]"
        >
          <template v-for="(contextCardEntry, i) in contextCardEntries">
            <context-card :key="'contextCard'+i" v-if="contextCardEntry.id === slot.id" :entry="contextCardEntry" :envVars="envVars" class="context-card"></context-card>
          </template>
          <div class="el-icon-info info-icon"
              slot="reference"
              @click="contextCardVisible[slot.name] = !contextCardVisible[slot.name]">
          </div>
        </el-popover>
      </el-row>
    </div>    
  </div>
</template>


<script>
/* eslint-disable no-alert, no-console */
import Vue from "vue";
import EventBus from './EventBus';
import store from "../store";
import ContextCard from "./ContextCard";
import { Input, Option, Popover, Row, Select } from "element-ui";
import lang from "element-ui/lib/locale/lang/en";
import locale from "element-ui/lib/locale";

locale.use(lang);
Vue.use(Input);
Vue.use(Option);
Vue.use(Select);
Vue.use(Popover);
Vue.use(Row);

export default {
  name: "SplitpanesBar",
  components: {
    ContextCard
  },
  props: {
    entries: {
      type: Array,
      default: function() {
        return [];
      }
    },
    container: {
      type: HTMLElement,
      default: undefined
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
  data: function() {
    return {
      contextCardVisible: {
        first: false,
        second: false,
        third: false,
        fourth: false, 
      },
      showDetails: true,
      contextCardEntries: [],
      isSearchable: {
        first: true,
        second: false,
        third: false,
        fourth: false,
      },
    }
  },
  computed: {
    // This computed property populates filter data's entry object with $data from this sidebar
    slotInfo: function() {
      return store.state.splitFlow.slotInfo;
    },
    helpDelay() {
      return store.state.settings.helpDelay;
    },
    activeView: function() {
      return store.state.splitFlow.activeView;
    },
    envVars: function () {
      return {
        API_LOCATION: store.state.settings.sparcApi,
        ALGOLIA_INDEX: store.state.settings.algoliaIndex,
        ALGOLIA_KEY: store.state.settings.algoliaKey,
        ALGOLIA_ID: store.state.settings.algoliaId,
        PENNSIEVE_API_LOCATION: store.state.settings.pennsieveApi,
        NL_LINK_PREFIX: store.state.settings.nlLinkPrefix,
        ROOT_URL: store.state.settings.rootUrl,
      };
    },
    boundary: function () {
      let b = document.querySelector(".tab-container")
      console.log("boundary", b);
      return b;
    },
    popperOptions: function() { 
      return { 
        preventOverflow: {
          enabled: true,
          boundariesElement: this.boundary,
        }
      }
    }
  },
  methods: {
    closeAndRemove: function(slot) {
      let id = slot.id;
      store.commit("splitFlow/closeSlot", 
        { slotName: slot.name , id: id, entries: this.entries});
      EventBus.$emit("RemoveEntryRequest", id);
    },
    getEntryTitle: function(entry) {
      if (entry) {
        let title = entry.label ? entry.label + " ": '';
        let type = entry.type;
        if (type == "Scaffold")
          type = "3D Scaffold";
        title += type;
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
        switch (this.activeView) {
          case "singlepanel":
          case "2horpanel":
            return "singlepanel-1";
          case "2vertpanel":
          case "3panel":
          case "4panel":
            return "twovertpanel-1";
        }
      } else if (slot.name == "second") {
        switch (this.activeView) {
          case "2horpanel":
            return "twohorpanel-2";
          case "2vertpanel":
          case "3panel":
          case "4panel":
            return "twovertpanel-2";
        }
      } else if (slot.name == "third") {
        switch (this.activeView) {
          case "3panel":
          case "4panel":
            return "threepanel-3";
        }
      } else if (slot.name == "fourth") {
        switch (this.activeView) {
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
          switch (this.activeView) {
            case "2vertpanel":
            case "3panel":
            case "4panel":
              style["width"] = "calc(" + this.splitter1.toString() + "% - 1px)";
              break;
          }
        } else if (slot.name == "second") {
          switch (this.activeView) {
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
          switch (this.activeView) {
            case "3panel":
            case "4panel":
              style["width"] =
                "calc(" + (100 - this.splitter1).toString() + "% - 1px)";
              style["left"] = "calc(" + this.splitter1.toString() + "% + 2px)";
              style["top"] = "calc( " + this.splitter3.toString() + "% + 2px)";
              break;
          }
        } else if (slot.name == "fourth") {
          switch (this.activeView) {
            case "4panel":
              style["width"] = "calc(" + this.splitter1.toString() + "% - 1px)";
              style["top"] = "calc(" + this.splitter2.toString() + "% + 2px)";
              break;
          }
        }
      }
      return style;
    },
    updateisSearchableSlot: function(slot) {
      let entry = this.entries.find(entry => entry.id === slot.id);
      if (entry) {
        if (entry.type == "Flatmap" || entry.type == "MultiFlatmap" || entry.type == "Scaffold") {
          this.isSearchable[slot.name] = true;
        } else {
          this.isSearchable[slot.name] = false;
        }
      }
    },
    updateisSearchable: function() {
      this.slotInfo.forEach( slot => this.updateisSearchableSlot(slot));
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
    }
  },
  watch: {
    slotInfo: {
      handler: function() {
        this.updateisSearchable();
      },
      deep: true
    },
  },
  mounted: function() {
    EventBus.$on("contextUpdate", entry => {
      console.log(this.entries)
      let contextEntry = entry;
      let id = this.entries[this.entries.length-1].id; // we always open card on a new pane
      contextEntry.id = id;
      this.contextCardEntries.push(contextEntry);
      this.contextCardVisible.first = true;
    });
  }
};
</script>


<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import "~element-ui/packages/theme-chalk/src/input";
@import "~element-ui/packages/theme-chalk/src/option";
@import "~element-ui/packages/theme-chalk/src/select";
@import "../assets/header-icon.scss";

.toolbar {
  background-color: #f5f7fa !important;
  position: absolute;
  transition: all 1s ease;
  height: 32px;
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

.toolbar-flex-container {
  display:flex;
  flex-direction: row;
  .select-box {
    width: 200px;
    border-radius: 4px;
    border: 1px solid rgb(144, 147, 153);
    background-color: $background;
    font-weight: 500;
    color: rgb(48, 49, 51);
    margin-left: 8px;
    margin-top: 3px;
    margin-bottom: 2px;
    ::v-deep .el-input__inner {
      width:177px;
      color: $app-primary-color;
      height: 24px;
      padding-left: 4px;
      padding-right: 8px;
      background-color: $background;
      border-style: none;
    }
    
    ::v-deep .el-input__icon {
      line-height: 24px;
      color: $lightGrey;
    }
  }
  i .select-box ::v-deep .el-input__icon {
    color: rgb(48, 49, 51);
    height: 24px;
    padding-left: 8px;
    padding-right: 8px;
  }
  .text {
    margin-left: 8px;
    margin-top: 7px;
    font-weight: 500;
    -moz-user-select: none;
    -webkit-user-select: none;
    -ms-user-select: none;
    user-select: none;
    line-height:18px;
  }
  .title {
    width: 140px;
    color: $app-primary-color;
  }
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

.hide{
  color: $app-primary-color;
  cursor: pointer;
  margin-right: 6px;
  margin-top: 3px;
}

.icon-group {
  font-size: 12px;
}

.info-icon {
  margin-right: 8px;
  font-size: 28px;
  color: $app-primary-color;
  cursor: pointer;
}

.context-card {
  width: 440px;
}

.context-card-popover ::v-deep .el-popover{
  max-width: calc(100vw - 100px);
  padding-right: 0px;
}
</style>
