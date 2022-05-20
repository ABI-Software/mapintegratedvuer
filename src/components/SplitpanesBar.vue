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
        <template v-if="isFlatmap[slot.name]">
          <div class="text search-text">
            Search within display
          </div>
          <el-input class="search-box" placeholder="Search"
            v-model="searchText[slot.id]"
            @keyup.enter.native="$emit('local-search', {slot: slot, 
              term: searchText[slot.id]})">
          </el-input>
          <map-svg-icon icon="magnifyingGlass" class="magnify"
            @click.native="$emit('local-search', {slot: slot, 
              term: searchText[slot.id]})"/>
          <div v-if="failedSearch[slot.name]" class="text not-found-text">
            '{{failedSearch[slot.name]}}' not found
          </div>
        </template>
      </div>
      <el-row class="icon-group">
        <el-popover class="tooltip" content="Close and remove" placement="bottom-end" :open-delay="helpDelay"
          :appendToBody=false trigger="hover" popper-class="header-popper" >
          <map-svg-icon icon="close" slot="reference" class="header-icon"
            v-if="(activeView !== 'singlepanel') && (slot.name !== 'first') && (isFlatmap[slot.name] == false)"
            @click.native="closeAndRemove(slot)"/>
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
import { MapSvgIcon } from '@abi-software/svg-sprite';
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
    MapSvgIcon,
  },
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
    failedSearch: {
      type: Object,
      default: function() {
        return {
          first: undefined,
          second: undefined,
          third: undefined,
          fourth: undefined,
        };
      }
    }
  },
  data: function() {
    return {
      searchText: [],
      isFlatmap: {
        first: true,
        second: false,
        third: false,
        fourth: false
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
          type = "Scaffold 3D";
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
    updateIsFlatmapSlot: function(slot) {
      let entry = this.entries.find(entry => entry.id === slot.id);
      if (entry) {
        if (entry.type == "Flatmap" || entry.type == "MultiFlatmap") {
          this.isFlatmap[slot.name] = true;
        } else {
          this.isFlatmap[slot.name] = false;
        }
      }
    },
    updateIsFlatmap: function() {
      this.slotInfo.forEach( slot => this.updateIsFlatmapSlot(slot));
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
        this.updateIsFlatmap();
      },
      deep: true
    },
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
  .search-text {
    margin-top: 8px;
    color: $grey;
    font-size: 14px;
    margin-left: 1rem;
  }
  .not-found-text {
    margin-top: 8px;
    color: $warning;
    font-size: 10px;
    margin-left: 0.5rem;
  }
  .search-box {
    margin-top: 2px;
    margin-left:0.5rem;
    height:28px;
    width:137px;
    ::v-deep .el-input__inner {
      background-color: $background;
      height:28px;
      line-height:28px;
      border: 1px solid rgb(144, 147, 153);
      border-radius: 4px;
      &:focus {
        border-color: $app-primary-color;
      }
    }
  }
  .magnify {
    margin-top: 2px;
    margin-left:0.5rem;
    background: #8300bf;
    border-radius: 4px;
    height:28px;
    width:28px;
    color: #fff;
    cursor: pointer;
    &:hover {
      box-shadow: -3px 2px 4px 0 rgba(0,0,0,0.25);
    }
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

.icon-group {
  font-size: 12px;
}
</style>
