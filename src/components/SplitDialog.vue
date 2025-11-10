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
import { useSettingsStore } from '../stores/settings';
import { useConnectivitiesStore } from '../stores/connectivities';
import {
  queryPathsByRoute,
  queryAllConnectedPaths,
} from "@abi-software/map-utilities";

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
          if (vuer.visible)
            activeContents.push(vuer);
        });
      }
      return activeContents;
    },
    isIdVisible: function(id) {
      const paneName = this.splitFlowStore.getPaneNameById(id);
      let visible = false;
      if (paneName !== undefined) {
        visible = this.splitFlowStore.isPaneActive(paneName);
      }
      return visible;
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
        // style["display"] = "none";
        style["visibility"] = "hidden";
        style["pointer-events"] = "none";
        style["opacity"] = "0";
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
      let activePaneIDs = this.splitFlowStore.getActivePaneIds();
      // body scaffold id may be a string depends on situation
      const wholeBodyScaffoldIDs = [307, '307'];
      const sckanVersion = Object.keys(this.connectivitiesStore.globalConnectivities)
        .find(key => key.includes('sckan'));
      const uuids = Array.from(
        new Set(
          this.entries
            .filter((entry) => {
              return (
                activePaneIDs.includes(entry.id) &&
                (
                  (
                    entry.uuid &&
                    (entry.type === 'Flatmap' || entry.type === 'MultiFlatmap')
                  ) ||
                  (
                    entry.type === 'Scaffold' && entry.resource &&
                    (entry.isBodyScaffold || wholeBodyScaffoldIDs.includes(entry.discoverId))
                  )
                )
              )
            })
            .map((entry) => {
              if ((entry.type === 'Flatmap' || entry.type === 'MultiFlatmap')) {
                return entry.uuid;
              } else if (entry.type === 'Scaffold') {
                return entry.resource;
              }
            })
        )
      );

      // mix connectivites of available maps
      if (uuids.length) {
        this.connectivitiesStore.updateActiveConnectivityKeys(uuids);

        // emit connectivity-knowledge event will be at connectivityQueryFilter

        const uniqueFilters = this.connectivitiesStore.getUniqueFilterOptionsByKeys;
        EventBus.emit("connectivity-filter-options", uniqueFilters);
      } else {
        const connectivityData = this.connectivitiesStore.globalConnectivities[sckanVersion] || [];
        EventBus.emit("connectivity-knowledge", {
            data: connectivityData,
            highlight: [],
            processed: false,
        });
        EventBus.emit("connectivity-filter-options", []);
        this.connectivitiesStore.updateActiveConnectivityKeys([sckanVersion]);
      }
    },
    getGeneralSearchedId: function (entry, term, type = 'query') {
      const ids = [];
      entry.forEach((data) => {
        let compareRanges = [
          JSON.stringify(data['nerve-label'])
        ];
        if (type = 'query') {
          compareRanges = [
            ...compareRanges,
            data.id,
            data.label,
            data['long-label'],
            JSON.stringify(data['nerves'])
          ]
        }
        const isMatched = compareRanges.some((data) => {
          return data?.toLowerCase().includes(term.toLowerCase())
        });
        if (isMatched && !ids.includes(data.id)) {
          ids.push(data.id);
        }
      });
      return ids;
    },
    /**
     * Search pathways by term with keyword matching.
     *
     * @param {Object} flatmap - The flatmap object
     * @param {String} term - The search term to match against pathway IDs
     * @returns {Array<String>} Array of pathway IDs that match the search criteria
     *
     * Search behavior:
     * 1. Multi-segment search (contains delimiters like '-', ':', '_', '/', etc.):
     *    - Matches the entire pattern within pathway IDs
     *    - Example: "bolew-unbranched", "ilxtr:neuron", "unbranched-4"
     *
     * 2. Short single term (< 3 characters):
     *    - Only matches exact segments between delimiters
     *    - Example: "on" will NOT match "neuron" but would match "ilxtr:on:something"
     *
     * 3. Long single term (≥ 3 characters):
     *    - Matches exact segments OR partial matches within meaningful segments
     *    - Example: "bolew", "unbranched", "neuron" match their respective segments
     */
    searchPathwaysByTerm: function (flatmap, term) {
      const pathwayModels = flatmap.mapImp.pathways?.models;
      if (!pathwayModels || !term) return [];

      const searchTerm = term.toLowerCase();
      const minTermLength = 3;
      const hasDelimiters = /[-_:\s\/]+/.test(searchTerm);

      if (hasDelimiters) {
        return pathwayModels
          .filter((pathway) => {
            const pathwayId = pathway.id?.toLowerCase() || '';
            return pathwayId.includes(searchTerm);
          })
          .map(pathway => pathway.id);
      }

      if (searchTerm.length < minTermLength) {
        return pathwayModels
          .filter((pathway) => {
            const pathwayId = pathway.id?.toLowerCase() || '';
            const segments = pathwayId.split(/[-_:\s\/]+/);
            return segments.includes(searchTerm);
          })
          .map(pathway => pathway.id);
      }

      return pathwayModels
        .filter((pathway) => {
          const pathwayId = pathway.id?.toLowerCase() || '';
          const segments = pathwayId.split(/[-_:\s\/]+/);

          return segments.some(segment =>
            segment === searchTerm ||
            (segment.length >= minTermLength && segment.includes(searchTerm))
          );
        })
        .map(pathway => pathway.id);
    },
    getFlatmapSearchedId: function (flatmap, term) {
      const ids = [];
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
    getLatestFlatmapUUID: async function (flatmapAPI, id) {
      const flatmapResponse = await fetch(flatmapAPI);
      const flatmapJson = await flatmapResponse.json();
      const latestFlatmap = flatmapJson
        .filter(f => f.id === id)
        .sort((a, b) => b.created.localeCompare(a.created))[0];
      const flatmapUUID = latestFlatmap.uuid;
      return flatmapUUID;
    },
    parseSearchTerms: function (query) {
      return query
        .split(",")
        .map(term => term.trim().replace(/["']/g, ""))
        .filter(term => term);
    },
    connectivityQueryFilter: async function (data) {
      this.query = "";
      this.filter = [];
      const activeContents = this.getActiveContents();
      const flatmapAPI = this.settingsStore.flatmapAPI;
      const searchOrders = [], searchResults = [];
      let searchHighlights = [];
      let processed = false;
      let queryIds = [], facetIds = [];
      let sourceId = "";

      const uniqueFilters = this.connectivitiesStore.getUniqueFilterOptionsByKeys;
      const uniqueFilterSources = this.connectivitiesStore.getUniqueFilterSourcesByKeys;
      let results = this.connectivitiesStore.getUniqueConnectivitiesByKeys;

      for (const activeContent of activeContents) {
        const viewer = activeContent.$refs.viewer;
        if (viewer) {
          const multiflatmap = viewer.$refs.multiflatmap;
          const flatmap = viewer.$refs.flatmap;
          const scaffold = viewer.$refs.scaffold;
          const iframe = viewer.$refs.iframe;
          const plot = viewer.$refs.plot;
          const simulation = viewer.$refs.simulation;
          let currentMap = null;
          if (multiflatmap) {
            const _currentMap = multiflatmap.getCurrentFlatmap();
            if (_currentMap && _currentMap.mapImp) {
              currentMap = _currentMap;
              sourceId = currentMap.mapImp.uuid;
            }
          } else if (flatmap && flatmap.mapImp) {
            currentMap = flatmap;
            sourceId = currentMap.mapImp.uuid;
          } else {
            currentMap = scaffold || iframe || plot || simulation;
            sourceId = await this.getLatestFlatmapUUID(flatmapAPI, 'human-flatmap_male');
          }

          const isFlatmap = flatmap || multiflatmap;
          if (data) {
            this.query = data.query;
            // get query search result ids and order
            if (data.query) {
              const searchTerms = this.parseSearchTerms(this.query);
              const nestedIds = [];
              for (let index = 0; index < searchTerms.length; index++) {
                const term = searchTerms[index];
                const searchResult = isFlatmap ?
                  this.getFlatmapSearchedId(currentMap, term) :
                  this.getGeneralSearchedId(results, term, 'query');
                nestedIds.push(searchResult);
                // search if the term is a part of a pathway
                if (isFlatmap) {
                  const pathwayIdsFromTerm = this.searchPathwaysByTerm(currentMap, term);
                  nestedIds.push(...pathwayIdsFromTerm);
                }
              }
              // within query search (split terms by comma) -> OR
              const flatIds = [...new Set(nestedIds.flat())];
              if (flatIds.length) {
                searchOrders.push(...flatIds);
                const ids = isFlatmap ? await queryAllConnectedPaths(flatmapAPI, sourceId, flatIds) : flatIds;
                queryIds.push(...ids);
              }
            }

            const connectivityQueries = {
              origins: [],
              vias: [],
              destinations: [],
              all: [],
            };

            let filters = {};
            if (scaffold) {
              viewer.syncFilter(data.filter);
            }
            // get facet search result ids
            data.filter.forEach((item) => {
              const facetKey = item.facetPropPath.split('.').pop();
              const isNeuronConnection = item.facetPropPath.includes('flatmap.connectivity.source');

              // Neuron Connection is for both scaffold and flatmap
              // origins/vias/destinations/all filter logic
              // generate connectivityQueries to query related ids
              if (isNeuronConnection && item.facet?.toLowerCase() !== 'show all') {
                // string format with a space for CQ
                const feature = item.facet.replace(",\[", ", \[");
                const mode = item.facetPropPath.split('.').pop();

                if (mode === 'origin') {
                  connectivityQueries.origins.push(feature);
                } else if (mode === 'destination') {
                  connectivityQueries.destinations.push(feature);
                } else if (mode === 'via') {
                  connectivityQueries.vias.push(feature);
                } else {
                  const featuresArray = JSON.parse(feature).flat(Infinity);
                  connectivityQueries.all.push(...featuresArray);
                }
              }

              if (scaffold) {
                if (!isNeuronConnection && item.facet?.toLowerCase() !== 'show all') {
                  if (!(facetKey in filters)) {
                    filters[facetKey] = [];
                  }
                  // within facet search category -> OR
                  filters[facetKey].push(...this.getGeneralSearchedId(results, item.facet, 'facet'));
                }
              } else if (isFlatmap) {
                if (!isNeuronConnection) {
                  // all other flatmap filter logic
                  const matchedFilter = uniqueFilters.find(filter => filter.key.includes(facetKey));
                  if (matchedFilter) {
                    matchedFilter.children.forEach((child) => {
                      if (child.label.toLowerCase() === item.facet.toLowerCase() && child.key) {
                        const childKey = child.key.split('.').pop();
                        if (!(facetKey in filters)) {
                          filters[facetKey] = [];
                        }
                        // within facet search category -> OR
                        filters[facetKey].push(...uniqueFilterSources[facetKey][childKey]);
                      }
                    });
                  }
                }
              }
            });

            // query ids for origins/vias/destinations/all filter
            if (
              connectivityQueries.origins.length ||
              connectivityQueries.destinations.length ||
              connectivityQueries.vias.length
            ) {
              const options = {
                flatmapAPI: flatmapAPI,
                knowledgeSource: sourceId,
                origins: connectivityQueries.origins,
                destinations: connectivityQueries.destinations,
                vias: connectivityQueries.vias,
              };
              // expectation
              // result should already applied the following
              // between origins, destinations and vias -> AND
              // within origins, destinations and vias -> OR
              if (!('ovd' in filters)) {
                filters['ovd'] = [];
              }
              filters['ovd'].push(...await queryPathsByRoute(options));
            } else if (connectivityQueries.all.length) {
              if (!('all' in filters)) {
                filters['all'] = [];
              }
              filters['all'].push(...await queryAllConnectedPaths(flatmapAPI, sourceId, connectivityQueries.all));
            }

            const nestedIds = Object.values(filters);
            this.filter = [...this.filter, ...nestedIds];
            // between facet search categories -> AND
            const ids = this.filter.length ? this.filter.reduce((acc, curr) => acc.filter(id => curr.includes(id))) : [];
            facetIds.push(...ids);
          }
        }
      }

      let target;
      if (this.query && !this.filter.length) { // pure query search
        target = queryIds;
      } else if (!this.query && this.filter.length) { // pure facet search
        target = facetIds;
      } else if (this.query && this.filter.length) { // combined query and facet search
        // between query search and facet search -> AND
        target = queryIds.filter(id => facetIds.includes(id));
      }
      // This can be empty array due to the AND operation
      if (target) {
        searchHighlights.push(...target);
        results = results.filter((item) => target.includes(item.id));
        processed = true;
      }
      searchResults.push(...results);

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
        data: uniqueResults,
        highlight: uniqueHighlights,
        processed: processed
      };

      EventBus.emit("connectivity-knowledge", connectivitiesPayload);
    },
    updateFlatmapMinimap: function () {
      const activePaneIDs = this.splitFlowStore.getActivePaneIds();
      let contents = this.$refs['content'];
      let multiFlatmapContents = [];

      // Only multiFlatmap viewer has minimap
      for (let i = 0; i < contents.length; i++) {
        if (contents[i].viewerType === 'MultiFlatmap') {
          multiFlatmapContents.push(contents[i]);
        }
      }

      // Prioritize visible contents so minimap initializes with visible maps first
      multiFlatmapContents.sort((a, b) => {
        return b.visible - a.visible;
      });

      // Disable minimap when there are more than four panel in map-viewer
      const minimapShow = activePaneIDs.length > 4 ? false : true;
      const prevMinimapState = this.settingsStore.displayMinimap;

      this.settingsStore.updateDisplayMinimap(minimapShow);
      multiFlatmapContents.forEach((content) => {
        content.toggleMinimap(minimapShow, prevMinimapState);
      });
    },
  },
  computed: {
    ...mapStores(useSplitFlowStore, useConnectivitiesStore, useSettingsStore),
    horizontal() {
      if (this.splitFlowStore.activeView === "2horpanel") {
        return true;
      }
      return false;
    },
    splitters() {
      return this.splitFlowStore.splitters;
    },
  },
  mounted: function () {
    EventBus.on("PaneResize", payload => {
      this.setStyles(payload.refName, payload.rect);
      this.updateFlatmapMinimap();
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
    EventBus.on("hoverUpdate", (payload) => {
      const contents = this.getActiveContents();
      contents.forEach((content) => {
        content.onHoverUpdate(payload);
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
    EventBus.on('sidebar-annotation-close', () => {
      const contents = this.getActiveContents();
      contents.forEach((content) => {
        content.onSidebarAnnotationClose();
      });
    });
    EventBus.on('globalViewerSettingsUpdate', () => {
      const contents = this.$refs['content'];
      contents.forEach((content) => {
        content.onGlobalViewerSettingsUpdate();
      });
    });
    EventBus.on("markerUpdate", () => {
      const contents = this.$refs['content'];
      contents.forEach((content) => {
        content.onFlatmapMarkerUpdate();
      });
    });
    EventBus.on('connectivity-hovered', (payload) => {
      const contents = this.getActiveContents();
      contents.forEach((content) => {
        content.onShowConnectivityTooltips(payload);
      });
    });
    EventBus.on('connectivity-source-change', (payload) => {
      const contents = this.getActiveContents();
      //Use ongoingSource array to make sure, the knowledge
      //from each source is only loaded once.
      //TODO: This can be improved with using just one viewer to give us
      //the new knowlegdge with the species/sources specified which
      //will require some UI changes on the sidebar
      const ongoingSources = []
      contents.forEach((content) => {
        content.onConnectivitySourceChange(payload, ongoingSources);
      });
    });
    EventBus.on('show-connectivity', (payload) => {
      const contents = this.getActiveContents();
      contents.forEach((content) => {
        content.onShowConnectivity(payload);
      });
    });
    EventBus.on('show-reference-connectivities', (payload) => {
      const contents = this.getActiveContents();
      contents.forEach((content) => {
        content.onShowReferenceConnectivity(payload);
      });
    });
    EventBus.on('filter-visibility', (payload) => {
      const contents = this.getActiveContents();
      contents.forEach((content) => {
        content.onFilterVisibility(payload);
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
  transition: opacity 0s, visibility 0s, left 1s ease, top 1s ease, width 1s ease, height 1s ease;
  background: rgba(255, 255, 255, 1);
  visibility: visible;
  opacity: 1;

  &.inactive {
    // display: none;
    // width: 0%;
    // height: 0%;
    // left: 0px;
    // top: 30px;
    visibility: hidden;
    pointer-events: none;
    opacity: 0;

    canvas {
      display: none;
    }
  }
}
</style>
