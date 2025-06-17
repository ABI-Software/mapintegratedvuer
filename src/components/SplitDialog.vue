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
      styles: { },
      query: "",
      filter: [],
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

        const uniqueFilters = this.connectivitiesStore.getUniqueFilterOptionsByKeys;
        EventBus.emit("connectivity-filter-options", uniqueFilters);
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
    getSearchedId: function (flatmap, term) {
      let ids = [];
      const searchResult = flatmap.mapImp.search(term);
      const featureIds = searchResult.__featureIds || searchResult.featureIds;
      featureIds.forEach((id) => {
        const annotation = flatmap.mapImp.annotation(id);
        const compareRanges = [
          annotation.id,
          annotation.name,
          annotation.label,
          annotation.models,
          annotation.source
        ];
        const isMatched = compareRanges.some((item) => {
          return item && item.toLowerCase().includes(term.toLowerCase())
        });
        if (isMatched && annotation.models && !ids.includes(annotation.models)) {
          ids.push(annotation.models);
        }
      });
      return ids;
    },
    connectivityQueryFilter: async function (data) {
      const activeContents = this.getActiveContents();
      let searchOrders = [], searchHighlights = [], searchResults = [];

      for (const activeContent of activeContents) {
        const viewer = activeContent.$refs.viewer;

        if (viewer) {
          const multiflatmap = viewer.$refs.multiflatmap;
          const flatmap = viewer.$refs.flatmap;
          let currentFlatmap = null;

          if (multiflatmap) {
            const _currentFlatmap = multiflatmap.getCurrentFlatmap();
            if (_currentFlatmap && _currentFlatmap.mapImp) {
              currentFlatmap = _currentFlatmap;
            }
          }
          if (flatmap && flatmap.mapImp) {
            currentFlatmap = flatmap;
          }

          const uniqueFilters = this.connectivitiesStore.getUniqueFilterOptionsByKeys;
          const uniqueFilterSources = this.connectivitiesStore.getUniqueFilterSourcesByKeys;
          if (currentFlatmap && currentFlatmap.$el.checkVisibility()) {
            let results = this.connectivitiesStore.getUniqueConnectivitiesByKeys;
            if (data) {
              this.query = data.query;
              let filters = {}
              data.filter.forEach((item) => {
                const facetKey = item.facetPropPath.split('.').pop();;
                if (!(facetKey in filters)) {
                  filters[facetKey] = [];
                }
                const matchedFilter = uniqueFilters.find(filter => filter.key.includes(facetKey));
                if (matchedFilter) {
                  matchedFilter.children.forEach((child) => {
                    if (child.label === item.facet && child.key) {
                      const childKey = child.key.split('.').pop();
                      filters[facetKey].push(childKey);
                    }
                  });
                }
              });
              let ids = [];
              for (const [key, value] of Object.entries(filters)) {
                if (value.length) {
                  let valueToIds = [];
                  // within AND
                  value.forEach((v) => valueToIds.push(...uniqueFilterSources[key][v]));
                  ids.push(valueToIds);
                }
              }
              // between AND
              this.filter = ids.length ?
                [...new Set(ids.reduce((acc, curr) => acc.filter(id => curr.includes(id))))] :
                [];
              if (data.type === "query-update") {
                this.query = data.value;
              } else if (data.type === "filter-update") {
                this.filter = data.value;
              }
            }
            if (this.query) {
              let options = {};
              const searchTerms = this.query.split(",").map((term) => term.trim());
              const nestedIds = [];
              for (let index = 0; index < searchTerms.length; index++) {
                nestedIds.push(this.getSearchedId(currentFlatmap, searchTerms[index]));
              }
              const ids = [...new Set(nestedIds.flat())];
              searchOrders.push(...ids);
              const paths = await currentFlatmap.retrieveConnectedPaths(ids, options);
              searchHighlights.push(...paths);
              results = results.filter((item) => paths.includes(item.id));
            }
            if (this.filter.length) {
              searchHighlights.push(...this.filter);
              results = results.filter((item) => this.filter.includes(item.id));
            }
            searchResults.push(...results);
          }
        }
      }

      const uniqueOrders = [...new Set(searchOrders)];
      const uniqueHighlights = [...new Set(searchHighlights)];
      let uniqueResults = Array.from(
        new Map(searchResults.map((item) => [item.id, item])).values()
      );
      // Ensure that the results always show search items first
      // and the rest ordered by alphabetical order
      uniqueResults = [
        ...uniqueResults.filter((r) => uniqueOrders.includes(r.id)),
        ...uniqueResults.filter((r) => !uniqueOrders.includes(r.id))
      ];

      const connectivitiesPayload = {
        highlight: uniqueHighlights,
        data: uniqueResults,
      };

      EventBus.emit("connectivity-knowledge", connectivitiesPayload);
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
    EventBus.on("connectivity-query-filter", (payload) => {
      this.connectivityQueryFilter(payload);
    });
    //The followings are migrated from ContentVuer and its child components to here
    EventBus.on("hoverUpdate", () => {
      const contents = this.getActiveContents();
      contents.forEach((content) => {
        content.onHoverUpdate();
      });
    });
    EventBus.on("startHelp", () => {
      const contents = this.getActiveContents();
      contents.forEach((content) => {
        content.onStartHelp();
      });
    });
    EventBus.on('connectivity-item-close', () => {
      const contents = this.getActiveContents();
      contents.forEach((content) => {
        content.onConnectivityItemClose();
      });
    });
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
