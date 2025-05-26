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
        @species-changed="speciesChanged"
        :visible="isIdVisible(entry.id)"
      />
    </div>
  </div>
</template>


<script>
/* eslint-disable no-alert, no-console */
import ContentVuer from "./ContentVuer.vue";
import CustomSplitter from "./CustomSplitter.vue";
import EventBus from './EventBus';
import { mapStores } from 'pinia';
import { useSplitFlowStore } from '../stores/splitFlow';
import { useConnectivitiesStore } from '../stores/connectivities';

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
    speciesChanged: function (species) {
      this.$emit("species-changed", species);
    },
    getClass: function(id) {
      if (this.isIdVisible(id)) {
        return this.getRefsName(id);
      } else {
        return "inactive";
      }
    },
    getRefsName: function(id) {
      const refName = this.splitFlowStore.getPaneNameById(id);
      if (refName) {
        if (!(refName in this.styles)) {
          this.styles[refName] = {};
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
      const refName = this.splitFlowStore.getPaneNameById(id);
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
    setStyles: function(refName, rect) {
      if (this.$refs && this.$refs.tabContainer) {
        const bound = this.$refs.tabContainer.getBoundingClientRect();
        const style = {};
        style["width"] = `${rect.width}px`;
        style["left"] = `${rect.left - bound.left}px`;
        style["height"] = `${rect.height}px`;
        style["top"] = `${rect.top - bound.top}px`;
        style["display"] = "block";
        this.styles[refName] = style;
      }
    },
    hidePane: function(refName) {
      if (this.$refs && ('tabContainer' in this.$refs)) {
        const style = {};
        style["display"] = "none";
        this.styles[refName] = style;
      }
    },
    resize: function() {
      this.__userResize__ = true;
    },
    resized: function(splitterName, event) {
      if (this.__userResize__) {
        this.splitFlowStore.setSplitter({
          name: splitterName,
          value: event[0].size
        });
      }
      this.__userResize__ = false;
    },
    onSpeciesLayoutConnectivityUpdate: function () {
      let activePaneIDs = [];
      let availablePaneIDs = [];
      let combinedConnectivities = [];
      let sckanVersion = '';
      let uuid = '';

      for (const key in this.customLayout) {
        if (this.customLayout[key].id) {
          availablePaneIDs.push(this.customLayout[key].id);
        }
      }

      switch (this.activeView) {
        case 'singlepanel': {
          activePaneIDs = availablePaneIDs.slice(0, 1);
        } break;
        case '2horpanel':
        case '2vertpanel': {
          activePaneIDs = availablePaneIDs.slice(0, 2);
        } break;
        case '3panel': {
          activePaneIDs = availablePaneIDs.slice(0, 3);
        } break;
        case '4panel': {
          activePaneIDs = availablePaneIDs.slice(0, 4);
        } break;
        case '5panel': {
          activePaneIDs = availablePaneIDs.slice(0, 5);
        } break;
        case '6panelVertical':
        case '6panel': {
          activePaneIDs = availablePaneIDs.slice(0, 6);
        } break;
        default:
          break;
      }

      const uuids = Array.from(
        new Set(
          this.entries
            .filter(entry => activePaneIDs.includes(entry.id) && entry.uuid)
            .map(entry => entry.uuid)
        )
      );

      this.entries.forEach((entry) => {
        if (entry.sckanVersion in this.connectivitiesStore.globalConnectivities) {
          sckanVersion = entry.sckanVersion;
        }
      });

      // mix connectivites of available maps
      if (uuids.length) {
        this.connectivitiesStore.updateActiveConnectivityKeys(uuids);
        const uniqueConnectivities = this.connectivitiesStore.getUniqueConnectivitiesByKeys;

        EventBus.emit("connectivity-knowledge", {
          data: uniqueConnectivities
        });
      } else {
        if (sckanVersion) {
          EventBus.emit("connectivity-knowledge", {
            data: this.connectivitiesStore.globalConnectivities[sckanVersion]
          });
          this.connectivitiesStore.updateActiveConnectivityKeys([sckanVersion]);
        } else {
          console.warn(`There has no connectivity to show!`);
        }
      }
    },
  },
  computed: {
    ...mapStores(useSplitFlowStore, useConnectivitiesStore),
    activeView: function() {
      return this.splitFlowStore.activeView;
    },
    customLayout: function() {
      return this.splitFlowStore.customLayout;
    },
    horizontal() {
      if (this.splitFlowStore.activeView === "2horpanel") {
        return true;
      }
      return false;
    },
    splitters() {
      return this.splitFlowStore.splitters;
    },
    globalCallback() {
      return this.splitFlowStore.globalCallback;
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
    EventBus.on("PaneResize", payload => {
      this.setStyles(payload.refName, payload.rect);
    });
    EventBus.on("PaneUnmounted", payload => {
      this.hidePane(payload.refName);
    });
    EventBus.on('species-layout-connectivity-update', () => {
      this.onSpeciesLayoutConnectivityUpdate();
    })
  },
};
</script>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
:deep(.splitpanes.default-theme .splitpanes__pane) {
  background-color: #ccc !important;
  position: relative;
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
