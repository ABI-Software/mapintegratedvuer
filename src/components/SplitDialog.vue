<template>
  <div class="tab-container" ref="container">
    <div v-for="item in slotInfo" :key="item.name" :class="[getToolbarClass(item.name), 'toolbar']">
      <div class="toolbar-title">
        {{ getTitle(item)}}
      </div>
    </div>
    <div v-for="item in entries" :key="item.id" :class="[getClass(item.id), 'contentvuer']">
      <ContentVuer
        :key="item.id"
        :entry="item"
        ref="content"
        @resource-selected="resourceSelected"
        @flatmapChanged="flatmapChanged"
        :visible="isVisible(item.id)"
      />
    </div>
  </div>
</template>


<script>
/* eslint-disable no-alert, no-console */
import ContentVuer from "./ContentVuer";
import store from "../store";

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
    /**
     * Callback when the vuers emit a selected event.
     */
    resourceSelected: function(result) {
      this.$emit("resource-selected", result);
    },
    flatmapChanged: function() {
      this.$emit("flatmapChanged");
    },
    getClass: function(id) {
      let slot = store.getters["splitFlow/getSlotById"](id);
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
      return "inactive";
    },
    isVisible: function(id) {
      let slot = store.getters["splitFlow/getSlotById"](id);
      return store.getters["splitFlow/isSlotActive"](slot);
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
    getTitle: function(slot) {
      let entry = this.entries.find(entry => entry.id === slot.id);
      if (entry)
        return entry.label + " " + entry.type;
      else
        return "Viewer";
    }
  },
  computed: {
    // This computed property populates filter data's entry object with $data from this sidebar
    slotInfo: function () {
      return store.state.splitFlow.slotInfo;
    },
  },
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
  top: 30px;
  z-index:2;
}

.contentvuer.twohorpanel-1 {
  width: 100%;
  height: calc(50% - 30px);
  top: 30px;
  z-index:2;
}

.contentvuer.twohorpanel-2 {
  width: 100%;
  height: calc(50% - 30px);
  top: calc(50% + 30px);
  border-top: 1px solid rgb(220, 223, 230);
}

.contentvuer.twovertpanel-1 {
  width: 50%;
  height: calc(100% - 30px);
  top: 30px;
  z-index:2;
}

.contentvuer.twovertpanel-2 {
  width: 50%;
  height: calc(100% - 30px);
  top: 30px;
  left: 50%;
  border-left: 1px solid rgb(220, 223, 230);
}

.contentvuer.threepanel-2 {
  width: 50%;
  height: calc(50% - 30px);
  top: 30px;
  left: 50%;
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
  top: 30px;
  z-index:2;
}

.contentvuer.fourpanel-4 {
  width: 50%;
  height: calc(50% - 30px);
  top: calc(50% + 30px);
  border-top: 1px solid rgb(220, 223, 230);
  z-index:2;
}

.contentvuer.inactive {
  display: none;
  width: 0%;
  height: 0%;
}

.toolbar {
  position: absolute;
  transition: all 1s ease;
  height: 29px;
  border-bottom: 1px solid rgb(220, 223, 230);
}

.toolbar.singlepanel-1 {
  width: 100%;
}

.toolbar.twohorpanel-2 {
  width: 100%;
  top: 50%;
  border-top: 1px solid rgb(220, 223, 230);
}

.toolbar.twovertpanel-1 {
  width: 50%;
}

.toolbar.twovertpanel-2 {
  width: 50%;
  left: 50%;
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
  height: 50%;
  top: 50%;
  border-top: 1px solid rgb(220, 223, 230);
}

.toolbar.inactive {
  display: none;
  width: 0%;
  height: 0%;
}

.toolbar-title {
  width: 107px;
  height: 20px;
  color: rgb(131, 0, 191);
  font-size: 14px;
  font-weight: normal;
  line-height: 20px;
  margin-left:11px;
  margin-top:4px;
}
</style>

<style scoped src='splitpanes/dist/splitpanes.css'>
</style>

