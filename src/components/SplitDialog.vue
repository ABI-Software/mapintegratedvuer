<template>
  <div class="tab-container" ref="container">
    <div v-for="slot in slotInfo" :key="slot.name" :class="[getToolbarClass(slot.name), 'toolbar']">
      <div v-if=false class="toolbar-title">{{ getSlotTitle(slot)}}</div>
      <el-select
        v-else
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
    <div v-for="entry in entries" :key="entry.id" :class="[getClass(entry.id), 'contentvuer']">
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
import store from "../store";
import Vue from "vue";

export default {
  name: "SplitDialog",
  components: {
    ContentVuer
  },
  props: {
    entries: {
      type: Array,
      default: function() {
        return [];
      }
    }
  },
  methods: {
    flatmapChanged: function(){
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
    isVisible: function(id) {
      let slot = store.getters["splitFlow/getSlotById"](id);
      if (slot)
        return store.getters["splitFlow/isSlotActive"](slot);
      return false;
    },
    getToolbarClass: function(slot) {
      if (slot == "first") {
        switch (store.state.splitFlow.activeView) {
          case "singlepanel":
          case "2horpanel":
            return "singlepanel-1";
          case "2vertpanel":
          case "3panel":
            return "twovertpanel-1";
          case "4panel":
            return "fourpanel-1";
        }
      } else if (slot == "second") {
        switch (store.state.splitFlow.activeView) {
          case "2horpanel":
            return "twohorpanel-2";
          case "2vertpanel":
          case "3panel":
          case "4panel":
            return "twovertpanel-2";
        }
      } else if (slot == "third") {
        switch (store.state.splitFlow.activeView) {
          case "3panel":
          case "4panel":
            return "threepanel-3";
        }
      } else if (slot == "fourth") {
        switch (store.state.splitFlow.activeView) {
          case "4panel":
            return "fourpanel-4";
        }
      }
      return "inactive";
    },
    getEntryTitle: function(entry) {
      if (entry) {
        let title = entry.label + " " + entry.type;
        if (entry.discoverId) 
          title = title + " dataset " + entry.discoverId;
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
        store.commit("splitFlow/assignOrSwapIdToSlot",
          {slot: slot, id: value});
        Vue.nextTick(() => {
          setTimeout(() => {
            for (let i = 0; i < this.$refs.content.length; i++) {
              this.$refs.content[i].onResize();
            }
          }, 1200);
        });
      }
    },
  },
  computed: {
    // This computed property populates filter data's entry object with $data from this sidebar
    slotInfo: function() {
      return store.state.splitFlow.slotInfo;
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
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
  height: calc(50% - 30px);
  left: 0px;
  top: 30px;
  z-index: 2;
}

.contentvuer.twohorpanel-2 {
  width: 100%;
  height: calc(50% - 30px);
  left: 0px;
  top: calc(50% + 30px);
  border-top: 1px solid rgb(220, 223, 230);
}

.contentvuer.twovertpanel-1 {
  width: 50%;
  height: calc(100% - 30px);
  left: 0px;
  top: 30px;
  z-index: 2;
}

.contentvuer.twovertpanel-2 {
  width: 50%;
  height: calc(100% - 30px);
  left: 50%;
  top: 30px;
  border-left: 1px solid rgb(220, 223, 230);
}

.contentvuer.threepanel-2 {
  width: 50%;
  height: calc(50% - 30px);
  left: 50%;
  top: 30px;
  border-left: 1px solid rgb(220, 223, 230);
}

.contentvuer.threepanel-3 {
  width: 50%;
  height: calc(50% - 30px);
  left: 50%;
  top: calc(50% + 30px);
  border-top: 1px solid rgb(220, 223, 230);
  border-left: 1px solid rgb(220, 223, 230);
}

.contentvuer.fourpanel-1 {
  width: 50%;
  height: calc(50% - 30px);
  left: 0px;
  top: 30px;
  border-top: 1px solid rgb(220, 223, 230);
  z-index: 2;
}

.contentvuer.fourpanel-4 {
  width: 50%;
  height: calc(50% - 30px);
  left: 0px;
  top: calc(50% + 30px);
  border-top: 1px solid rgb(220, 223, 230);
  z-index: 2;
}

.contentvuer.inactive {
  display: none;
  width: 0%;
  height: 0%;
  left: 0px;
  top: 30px;
}

.toolbar {
  position: absolute;
  transition: all 1s ease;
  height: 29px;
  border-bottom: 1px solid rgb(220, 223, 230);
  z-index:1000;
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
  width: 50%;
}

.toolbar.twovertpanel-2 {
  width: 50%;
  left: 50%;
  top: 0px;
  border-left: 1px solid rgb(220, 223, 230);
}

.toolbar.threepanel-3 {
  width: 50%;
  left: 50%;
  top: 50%;
  border-top: 1px solid rgb(220, 223, 230);
  border-left: 1px solid rgb(220, 223, 230);
}

.toolbar.fourpanel-4 {
  width: 50%;
  left: 0px;
  top: 50%;
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
  position: absolute;
  margin-left:8px;
  margin-top:2px;
}

.select-box >>> .el-input__inner {
  color: rgb(48, 49, 51);
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

<style scoped src='splitpanes/dist/splitpanes.css'>
</style>

