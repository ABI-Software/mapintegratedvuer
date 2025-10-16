<template>
  <el-container style="height: 100%; background: white">
    <el-header
      ref="header"
      style="text-align: left; font-size: 14px; padding: 0"
      height="32px"
      class="dialog-header"
    >
      <DialogToolbarContent
        :numberOfEntries="entries.length"
        @onFullscreen="onFullscreen"
        @local-search="onDisplaySearch"
        @fetch-suggestions="fetchSuggestions"
        ref="dialogToolbar"
      />
    </el-header>
    <el-main class="dialog-main">
      <div
        style="width: 100%; height: 100%; position: relative; overflow: hidden"
      >
        <SideBar
          ref="sideBar"
          :envVars="envVars"
          :visible="sideBarVisibility"
          :class="['side-bar', { 'start-up': startUp }]"
          :open-at-start="startUp"
          :annotationEntry="annotationEntry"
          :createData="createData"
          :connectivityEntry="connectivityEntry"
          :connectivityKnowledge="connectivityKnowledge"
          :filterOptions="filterOptions"
          :showVisibilityFilter="showVisibilityFilter"
          @tabClicked="onSidebarTabClicked"
          @tabClosed="onSidebarTabClosed"
          @actionClick="actionClick"
          @search-changed="searchChanged($event)"
          @anatomy-in-datasets="updateMarkers($event)"
          @annotation-submitted="onAnnotationSubmitted"
          @confirm-create="onConfirmCreate"
          @cancel-create="onCancelCreate"
          @confirm-delete="onConfirmDelete"
          @number-of-datasets-for-anatomies="updateScaffoldMarkers($event)"
          @hover-changed="hoverChanged($event)"
          @contextUpdate="contextUpdate($event)"
          @datalink-clicked="datalinkClicked($event)"
          @show-connectivity="onShowConnectivity"
          @show-reference-connectivities="onShowReferenceConnectivities"
          @connectivity-hovered="onConnectivityHovered"
          @connectivity-collapse-change="onConnectivityCollapseChange"
          @connectivity-source-change="onConnectivitySourceChange"
          @filter-visibility="onFilterVisibility"
          @connectivity-item-close="onConnectivityItemClose"
          @trackEvent="trackEvent"
        />
        <SplitDialog
          :entries="entries"
          ref="splitdialog"
          @resource-selected="resourceSelected"
          @species-changed="speciesChanged"
        />
      </div>
    </el-main>
  </el-container>
</template>

<script>
/* eslint-disable no-alert, no-console */
import { provide, markRaw } from 'vue'
import Tagging from '../services/tagging.js';
import DialogToolbarContent from "./DialogToolbarContent.vue";
import EventBus from "./EventBus";
import SplitDialog from "./SplitDialog.vue";
// import contextCards from './context-cards'
import { SideBar } from "@abi-software/map-side-bar";
import "@abi-software/map-side-bar/dist/style.css";
import {
  capitalise,
  getNewMapEntry,
  initialDefaultState,
  intersectArrays,
} from "./scripts/utilities.js";
import { AnnotationService } from '@abi-software/sparc-annotation'
import { mapStores } from 'pinia';
import { useEntriesStore } from '../stores/entries';
import { useMainStore } from '../stores/index'
import { useSettingsStore } from '../stores/settings';
import { useSplitFlowStore } from '../stores/splitFlow';
import {
  ElContainer as Container,
  ElHeader as Header,
  ElMain as Main,
} from "element-plus";

const getAllFacetLabels = (children) => {
  const labels = [];
  if (children) {
    children.forEach((child) => {
      if (child.label) {
        labels.push(child.label.toLowerCase());
      }
      labels.push(...getAllFacetLabels(child.children));
    });
  }
  return labels;
}


const getAnatomyTermsForFilters = (action, availableNameCurieMapping) => {
  const facets = [];
  for (const facet of action.facets) {
    if (facet in availableNameCurieMapping) {
      facets.push(availableNameCurieMapping[facet]);
    } else {
      facets.push(facet);
    }
  }
  return facets;
}

/**
 * Component of the floating dialogs.
 */
export default {
  name: "SplitFlow",
  components: {
    Container,
    Header,
    Main,
    DialogToolbarContent,
    SplitDialog,
    SideBar,
  },
  setup() {
    const mainStore = useMainStore();
    provide('userApiKey', mainStore.userToken);
    const settings = useSettingsStore();
    let annotator = markRaw(new AnnotationService(`${settings.flatmapAPI}annotator`));
    provide('$annotator', annotator)
    return { annotator }
  },
  props: {
    state: {
      type: Object,
      default: undefined,
    }
  },
  data: function () {
    return {
      availableFacets: undefined,
      availableNameCurieMapping: undefined,
      sideBarVisibility: true,
      startUp: true,
      sidebarStateRestored: false,
      sidebarAnnotationState: false,
      search: '',
      expanded: '',
      filterTriggered: false,
      connectivityEntry: [],
      annotationEntry: [],
      annotationCallback: undefined,
      confirmCreateCallback: undefined,
      cancelCreateCallback: undefined,
      confirmDeleteCallback: undefined,
      confirmCommentCallback: undefined,
      createData: {},
      connectivityProcessed: false,
      connectivityHighlight: [],
      connectivityKnowledge: [],
      connectivityExplorerClicked: [], // to support multi views
      showVisibilityFilter: false,
      filterVisibility: true,
      filterOptions: [],
      annotationHighlight: [],
    }
  },
  watch: {
    state: {
      handler: function (value) {
        if (value) {
          if (!this._externalStateSet) this.setState(value);
          this._externalStateSet = true;
          this.updateGlobalSettingsFromState(value);
        }
      },
      immediate: true,
    },
    connectivityHighlight: {
      handler: function () {
        this.hoverChanged({ tabType: 'connectivity' });
        this.onFilterVisibility(this.filterVisibility);
      },
    },
    annotationHighlight: {
      handler: function () {
        this.hoverChanged({ tabType: 'annotation' });
      },
    },
  },
  methods: {
    onFilterVisibility: function (state) {
      this.filterVisibility = state;
      const filterExpression = {
        OR: [
          { NOT: { 'tile-layer': 'pathways' } },
          { NOT: { 'HAS': 'nerves' } },
          {
            AND: [
              { 'tile-layer': 'pathways' },
              { 'models': this.connectivityHighlight }
            ]
          }
        ]
      };
      const validFilter = this.filterVisibility && this.connectivityProcessed;
      const payload = validFilter ? filterExpression : undefined;
      EventBus.emit('filter-visibility', payload);
    },
    onConnectivityCollapseChange: function (payload) {
      this.expanded = payload.id
      const splitdialog = this.$refs.splitdialog;
      if (splitdialog) {
        const activeContents = splitdialog.getActiveContents();
        const hasFlatmap = activeContents.find(c => c.viewerType.includes('Flatmap'));
        const hasHumanMaleFlatmap = activeContents.find(c => c.activeSpecies === "Human Male");
        let nonFlatmapLoad = false
        activeContents.forEach(content => {
          const isFlatmap = content.viewerType === 'Flatmap' || content.viewerType === 'MultiFlatmap';
          // minimise connectivity detail fetch
          const shouldLoad =
            (hasFlatmap && isFlatmap) ||
            (hasFlatmap && !hasHumanMaleFlatmap && !isFlatmap && !nonFlatmapLoad) ||
            (!hasFlatmap && !nonFlatmapLoad);

          if (shouldLoad) {
            this.connectivityExplorerClicked.push(true);
            content.onLoadConnectivityDetail({ data: [payload] });
            if (!isFlatmap) nonFlatmapLoad = true;
          }
        });
      }
    },
    onConnectivityItemClose: function () {
      EventBus.emit('connectivity-item-close');
    },
    getActiveFlatmaps: function () {
      const activeFlatmaps = [];
      let splitdialog = this.$refs.splitdialog;

      if (splitdialog) {
        const activeContents = splitdialog.getActiveContents();

        activeContents.forEach(content => {
          if (content?.$refs['viewer']) {
            const contentViewer = content.$refs['viewer'];
            const flatmapRef = contentViewer.flatmapRef;
            const multiflatmapRef = contentViewer.multiflatmapRef;
            let flatmap = null;

            if (flatmapRef) flatmap = flatmapRef;
            if (multiflatmapRef) flatmap = multiflatmapRef.getCurrentFlatmap();

            if (flatmap) {
              activeFlatmaps.push(flatmap);
            }
          }
        });
      }
      return activeFlatmaps;
    },
    /**
     * Callback when an action is performed (open new dialogs).
     */
    actionClick: function (action) {
      if (action) {
        if (!this.availableFacets || (this.availableFacets.length === 0)) {
          const availableFacetsRaw = localStorage.getItem('available-anatomy-facets');
          const availableFacetsAll = availableFacetsRaw ? JSON.parse(availableFacetsRaw) : [];

          // get label values
          this.availableFacets = markRaw([...new Set(getAllFacetLabels(availableFacetsAll))]);
        }

        if (!this.availableNameCurieMapping || (Object.keys(this.availableNameCurieMapping).length === 0)) {
          const availableDataRaw = localStorage.getItem('available-name-curie-mapping');
          const availableData = availableDataRaw ? JSON.parse(availableDataRaw) : {};

          // get label values
          this.availableNameCurieMapping = markRaw(availableData);
        }

        if (action.type == "Search") {
          if (action.nervePath) {
            this.openSearch([action.filter], action.label);
          } else {
            this.openSearch([], action.term);
            // GA Tagging
            // Event tracking for map action search/filter data
            const eventName = action.featuredDataset
              ? 'portal_maps_featured_dataset_search'
              : 'portal_maps_action_search';
            Tagging.sendEvent({
              'event': 'interaction_event',
              'event_name': eventName,
              'category': action.term || 'filter',
              'location': 'map_location_pin'
            });
            this.filterTriggered = true;
          }
        } else if (action.type == "URL") {
          window.open(action.resource, "_blank");
        } else if (action.type == "Facet") {
          if (this.$refs.sideBar) {
            const sendAction = {
              facetPropPath: "anatomy.organ.category.name",
              facetSubPropPath: "anatomy.organ.name",
              term: "Anatomical structure",
            };
            const filters = [];
            const facets = getAnatomyTermsForFilters(action, this.availableNameCurieMapping);
            const facetString = action.facets.join(', ');
            facets.forEach(facet => filters.push({...sendAction, facet}));
            this.$refs.sideBar.addFilter(filters);
            // GA Tagging
            // Event tracking for map action search/filter data
            Tagging.sendEvent({
              'event': 'interaction_event',
              'event_name': 'portal_maps_action_filter',
              'category': facetString || 'filter_reset',
              'location': 'map_location_pin'
            });
            this.filterTriggered = true;
          }
        } else if (action.type == "Facets") {
          const facets = [];
          const facetsArray = getAnatomyTermsForFilters(action, this.availableNameCurieMapping);
          const filterValuesArray = intersectArrays(this.availableFacets, facetsArray);
          const filterValues = filterValuesArray.join(', ');

          this.settingsStore.facets.species.forEach(e => {
            facets.push({
              facet: capitalise(e),
              term: "Species",
              facetPropPath: "organisms.primary.species.name",
            });
          });
          facets.push(
            ...filterValuesArray.map(val => ({
              facet: capitalise(val),
              term: "Anatomical structure",
              facetPropPath: "anatomy.organ.category.name",
              facetSubPropPath: "anatomy.organ.name",
            }))
          );
          this.openSearch(facets, "")
          // GA Tagging
          // Event tracking for map action search/filter data
          Tagging.sendEvent({
            'event': 'interaction_event',
            'event_name': 'portal_maps_action_filter',
            'category': filterValues || 'filter_reset',
            'location': 'map_popup_button'
          });
          this.filterTriggered = true;
        } else {
          this.trackGalleryClick(action);
          this.createNewEntry(action);
        }
      }
    },
    trackGalleryClick: function (action) {
      const categoryValues = [];
      const { label, type, datasetId, discoverId, resource } = action;
      let filePath = '';
      let id = datasetId ? datasetId : discoverId;
      if (label) categoryValues.push(label);
      if (type) categoryValues.push(type);
      if (datasetId) categoryValues.push('(' + id + ')');
      if (resource) {
        if (type === "Plot") {
          filePath = resource.dataSource.url;
        } else {
          filePath = typeof resource === 'string' ? resource : resource.share_link;
        }
      }

      // GA Tagging
      // Event tracking for map sidebar gallery click
      Tagging.sendEvent({
        'event': 'interaction_event',
        'event_name': 'portal_maps_gallery_click',
        'category': categoryValues.join(' '),
        'location': 'map_sidebar_gallery',
        'dataset_id': id ? id + '' : '', // change to string format
        'file_path': filePath,
      });
    },
    onDisplaySearch: function (payload, tracking = true) {
      let searchFound = false;
      //Search all active viewers when global callback is on
      let splitdialog = this.$refs.splitdialog;
      if (splitdialog) {
        const activeContents = splitdialog.getActiveContents();
        activeContents.forEach(content => {
          if (content.search(payload.term)) {
            searchFound = true;
          }
        });
      }
      this.$refs.dialogToolbar.setFailedSearch(searchFound ? undefined : payload.term);

      if (tracking) {
        // GA Tagging
        // Event tracking for map on display search
        Tagging.sendEvent({
          'event': 'interaction_event',
          'event_name': 'portal_maps_display_search',
          'category': payload.term,
          'location': 'map_toolbar'
        });
      }
    },
    fetchSuggestions: function(payload) {
      const suggestions = [];
      //Search all active viewers when global callback is on
      let splitdialog = this.$refs.splitdialog;
      const activeContents = splitdialog.getActiveContents();
      //Push new suggestions into the pre-existing suggestions array
      activeContents.forEach(content => content.searchSuggestions(payload.data.term, suggestions));
      const parsed = [];
      //Remove double quote as it is used as a speical character
      suggestions.forEach(suggestion => {
        parsed.push(suggestion.replaceAll("\"", ""));
      });
      const unique = new Set(parsed);
      suggestions.length = 0;
      for (const item of unique) {
        suggestions.push({"value": "\"" + item +"\""});
      }
      payload.data.cb(suggestions);
    },
    /**
     * This event is emitted when the show connectivity button in sidebar is clicked.
     * This will move the map to the highlighted connectivity area.
     * @arg featureIds
     */
    onShowConnectivity: function (featureIds) {
      if (featureIds.length) {
        const splitFlowState = this.splitFlowStore.getState();
        const activeView = splitFlowState?.activeView || '';
        // offset sidebar only on singlepanel and 2horpanel views
        EventBus.emit('show-connectivity', {
          featureIds: featureIds,
          offset: activeView === 'singlepanel' || activeView === '2horpanel'
        });
      }
    },
    openConnectivityInfo: function (payload) {
      // expand connectivity card and show connectivity info
      // if expanded exist, payload should be an array of one element
      // skip payload not match the expanded in multiple views
      const isMatched = payload.some(entry => entry.featureId[0] === this.expanded);
      if (this.expanded && this.connectivityExplorerClicked.length && !isMatched) {
        this.connectivityExplorerClicked.pop();
        return;
      }
      this.connectivityEntry = payload.map(entry => {
        let result = {
          ...entry,
          label: entry.title,
          id: entry.featureId[0],
        }
        const ck = this.connectivityKnowledge.find(ck => ck.id === result.id);
        if (entry.ready) {
          result['nerve-label'] = entry['nerve-label'] || ck['nerve-label'];
        }
        return result;
      });
      if (this.connectivityExplorerClicked.length) {
        // only remove clicked if not placeholder entry
        if (this.connectivityEntry.every(entry => entry.ready)) {
          this.connectivityExplorerClicked.pop();
        }
      } else {
        // click on the flatmap paths/features directly
        // or onDisplaySearch is performed
        this.connectivityKnowledge = this.connectivityEntry;
        if (this.connectivityKnowledge.every(ck => ck.ready)) {
          this.connectivityHighlight = this.connectivityKnowledge.map(ck => ck.id);
          this.connectivityProcessed = true;
        }
        if (this.$refs.sideBar) {
          this.$refs.sideBar.tabClicked({ id: 2, type: 'connectivityExplorer' });
          this.$refs.sideBar.setDrawerOpen(true);
        }
      }
    },
    openAnnotation: function (payload) {
      this.annotationEntry = payload.annotationEntry;
      // If drawing, `entry.models` may be undefined; use an empty array instead of [undefined]
      // to prevent errors on highlight
      this.annotationHighlight = this.annotationEntry.map(entry => entry.models).filter(Boolean);
      if (payload.commitCallback) {
        this.annotationCallback = markRaw(payload.commitCallback);
      }
      if (!payload.createData) {
        this.createData = markRaw({});
      } else {
        this.createData = markRaw(payload.createData);
      }
      if (payload.confirmCreate) {
        this.confirmCreateCallback = markRaw(payload.confirmCreate);
      }
      if (payload.cancelCreate) {
        this.cancelCreateCallback = markRaw(payload.cancelCreate);
      }
      if (payload.confirmDelete) {
        this.confirmDeleteCallback = markRaw(payload.confirmDelete);
      }
      if (payload.confirmComment) {
        this.confirmCommentCallback = markRaw(payload.confirmComment);
      }
      if (this.$refs.sideBar) {
        this.$refs.sideBar.tabClicked({id: 3, type: 'annotation'});
        this.$refs.sideBar.setDrawerOpen(true);
      }
    },
    onShowReferenceConnectivities: function (refSource) {
      EventBus.emit('show-reference-connectivities', refSource);
    },
    onConnectivityHovered: function (data) {
      EventBus.emit('connectivity-hovered', data);
    },
    onConnectivitySourceChange: function (data) {
      this.connectivityExplorerClicked.push(true);
      EventBus.emit('connectivity-source-change', data);
    },
    hoverChanged: function (data) {
      let hoverAnatomies = [], hoverOrgans = [], hoverDOI = '', hoverConnectivity = [];
      if (data.tabType === 'dataset') {
        hoverAnatomies = data.anatomy ? data.anatomy : [];
        hoverOrgans = data.organs ? data.organs : [];
        hoverDOI = data.doi ? data.doi : '';
      } else if (data.tabType === 'connectivity') {
        hoverConnectivity = data.id ? [data.id] : this.connectivityHighlight;
        hoverOrgans = data['nerve-label'] ? data['nerve-label'].flatMap(nerve => nerve.subNerves) : [];
      } else if (data.tabType === 'annotation') {
        hoverConnectivity = data.models ? [data.models] : this.annotationHighlight;
      }
      this.settingsStore.updateHoverFeatures(hoverAnatomies, hoverOrgans, hoverDOI, hoverConnectivity);
      EventBus.emit("hoverUpdate", { connectivityProcessed: this.connectivityProcessed });
    },
    searchChanged: function (data) {
      if (data.tabType === 'dataset') {
        if (data && data.type == "reset-update") {
          this.settingsStore.updateAppliedFacets([]);
        }
        if (data && data.type == "query-update") {
          this.search = data.value;
          if (this.search && !this.filterTriggered) {
            // GA Tagging
            // Event tracking for map action search/filter data
            Tagging.sendEvent({
              'event': 'interaction_event',
              'event_name': 'portal_maps_action_search',
              'category': this.search,
              'location': 'map_sidebar_dataset_search'
            });
          }
          this.filterTriggered = false; // reset for next action
        }
        if (data && data.type == "filter-update") {
          this.settingsStore.updateFacets(data.value);
          // Remove filter event from maps' popup
          if (!this.filterTriggered) {
            const filterValuesArray = data.value.filter((val) => {
              return val.facet && val.facet.toLowerCase() !== 'show all';
            }).map((val) => val.facet);
            const labels = filterValuesArray.map((val) => val.toLowerCase());
            const newFacets = [...new Set([...labels])];
            this.settingsStore.updateAppliedFacets(newFacets);
            const filterValues = filterValuesArray.join(', ');
            // GA Tagging
            // Event tracking for map action search/filter data
            Tagging.sendEvent({
              'event': 'interaction_event',
              'event_name': 'portal_maps_action_filter',
              'category': filterValues || 'filter_reset',
              'location': 'map_sidebar_dataset_filter'
            });
          }
          this.filterTriggered = false; // reset for next action
        }
      } else if (data.tabType === 'connectivity') {
        if (data && data.type == "reset-update") {
          const activeFlatmaps = this.getActiveFlatmaps();
          activeFlatmaps.forEach((activeFlatmap) => {
            activeFlatmap.resetConnectivityfilters(data.value);
          });
        } else {
          this.expanded = '';
          this.connectivityEntry = [];
          // update connectivity filters in flatmap
          const activeFlatmaps = this.getActiveFlatmaps();
          activeFlatmaps.forEach((activeFlatmap) => {
            activeFlatmap.updateConnectivityFilters(data.filter);
          });
          EventBus.emit("connectivity-query-filter", data);

          const filterValues = data.filter.filter(f => (f.facet && f.facet.toLowerCase() !== 'show all'))
            .map((f) => f.tagLabel)
            .join(', ');
          const searchValue = data.query;

          if (filterValues) {
            Tagging.sendEvent({
              'event': 'interaction_event',
              'event_name': 'portal_maps_action_filter',
              'category': filterValues,
              'location': 'map_sidebar_connectivity_filter'
            });
          }

          if (searchValue) {
            Tagging.sendEvent({
              'event': 'interaction_event',
              'event_name': 'portal_maps_action_search',
              'category': searchValue,
              'location': 'map_sidebar_connectivity_search'
            });
          }
        }
      }
    },
    updateMarkers: function (data) {
      this.settingsStore.updateMarkers(data);
      EventBus.emit("markerUpdate");
    },
    updateScaffoldMarkers: function (data) {
      this.settingsStore.updateNumberOfDatasetsForFacets(data);
    },
    getNewEntryId: function() {
      if (this.entries.length) {
        return (this.entries[this.entries.length - 1]).id + 1;
      }
      return 1;
    },
    /**
     * Add new entry which will sequentially create a
     * new dialog.
     */
    createNewEntry: function (data) {
      let newEntry = {};
      newEntry.viewUrl = undefined;
      newEntry.state = undefined;
      Object.assign(newEntry, data);
      newEntry.mode = "normal";
      newEntry.id = this.getNewEntryId();
      newEntry.discoverId = data.discoverId;
      this.entriesStore.addNewEntry(newEntry);
      this.splitFlowStore.setIdToPrimaryPane(newEntry.id);
      //close sidebar on entry creation to see the context card
      if (this.$refs.sideBar) {
        this.$refs.sideBar.setDrawerOpen(false);
      }

      return newEntry.id;
    },
    openNewMap: async function (type) {
      const entry = await getNewMapEntry(type, this.settingsStore.sparcApi);
      this.createNewEntry(entry);
      if (entry.contextCard) {
        EventBus.emit("contextUpdate", entry.contextCard);
      }
    },
    openSearch: function (facets, query) {
      // Keep the species facets currently unused
      // let facets = [{facet: "All species", facetPropPath: 'organisms.primary.species.name', term:'species'}];
      // this.settingsStore.facets.species.forEach(e => {
      //   facets.push({facet: e, facetPropPath: 'organisms.primary.species.name', term:'species'});
      // });
      this.search = query;
      this._facets = facets;
      if (this.$refs && this.$refs.sideBar) {
        this.$refs.sideBar.openSearch(facets, query);
        this.$refs.sideBar.tabClicked({id:  1, type: 'datasetExplorer'});
      }
      this.startUp = false;
    },
    onFullscreen: function (val) {
      this.$emit("onFullscreen", val);
    },
    resetApp: function () {
      this.setState(initialDefaultState());
    },
    setIdToPrimaryPane: function (id) {
      this.splitFlowStore.setIdToPrimaryPane(id);
    },
    restoreConnectivityEntries: function (connectivityEntries) {
      const activeFlatmaps = this.getActiveFlatmaps();
      activeFlatmaps.forEach((activeFlatmap) => {
        const featureIds = connectivityEntries.map((entry) => {
          const featureId = activeFlatmap.mapImp.modelFeatureIds(entry)[0];
          const feature = activeFlatmap.mapImp.featureProperties(featureId);
          const data = {
            resource: [feature.models],
            feature: feature,
            label: feature.label,
            provenanceTaxonomy: feature.taxons,
            alert: feature.alert,
          };
          return data;
        });
        activeFlatmap.checkAndCreatePopups(featureIds, true)
      });
    },
    restoreSidebarState: function (state) {
      // Restore sidebar state only if
      // - there is sidebar state
      // - sidebar component is loaded
      // - connectivity knowledge is loaded
      // - if sidebar state is not restored yet
      const sidebarState = state?.sidebar;
      if (!this.sidebarStateRestored && sidebarState && this.$refs.sideBar && this.connectivityKnowledge?.length) {
        if (sidebarState.connectivityEntries?.length) {
          this.restoreConnectivityEntries(sidebarState.connectivityEntries);
        } else if (sidebarState.annotationEntries?.length && state.annotationId) {
          // Restore annotation state only if the state has annotationId
          this.restoreConnectivityEntries(sidebarState.annotationEntries);
          this.sidebarAnnotationState = true;
        } else {
          this.$refs.sideBar.setState(sidebarState);
        }
        this.sidebarStateRestored = true;
      }
    },
    setState: function (state) {
      this.entriesStore.setAll(state.entries);
      //Support both old and new permalink.
      if (state.splitFlow) {
        this.splitFlowStore.setState(state.splitFlow);
      }
      else {
        this.entries.forEach(entry => this.splitFlowStore.setIdToPrimaryPane(entry.id));
      }

      this.restoreSidebarState(state);
      this.updateGlobalSettingsFromState(state);
    },
    getState: function (anonymousAnnotations = false) {
      let state = JSON.parse(JSON.stringify(this.entriesStore.$state));
      let splitdialog = this.$refs.splitdialog;
      let dialogStates = splitdialog.getContentsState();
      if (state.entries.length === dialogStates.length) {
        for (let i = 0; i < dialogStates.length; i++) {
          const entry = state.entries[i];
          entry.state = dialogStates[i];
          //We do not want to serialise the following properties
          if (entry.type === "Scaffold" && "viewUrl" in entry)
            delete entry.viewUrl;
          if (entry.type === "MultiFlatmap" && "uberonId" in entry)
            delete entry.uberonId;
          if (anonymousAnnotations === false) {
            if (entry.type === "Scaffold" && entry?.state?.offlineAnnotations) {
              delete entry.state.offlineAnnotations;
            } else if (entry?.state?.state?.offlineAnnotations) {
              delete entry.state.state.offlineAnnotations;
            }
          }
        }
      }
      state.splitFlow = this.splitFlowStore.getState();
      state.globalSettings = this.settingsStore.getGlobalSettings();
      if (this.$refs.sideBar) {
        state.sidebar = this.$refs.sideBar.getState();
      }
      return state;
    },
    removeEntry: function (id) {
      let index = this.entriesStore.findIndexOfId(id);
      this.entriesStore.destroyEntry(index);
    },
    resourceSelected: function (result) {
      this.$emit("resource-selected", result);
    },
    speciesChanged: function (species) {
      if (this.$refs.sideBar) {
        // Use to update the connectivity when switch species
        // Wait for provenance info with uuid update
        this.$nextTick(() => {
          EventBus.emit('species-layout-connectivity-update');
          this.$refs.sideBar.close();
        })
      }
    },
    contextUpdate: function (payload) {
      EventBus.emit("contextUpdate", payload);
    },
    datalinkClicked: function (payload) {
      // payload is dataset URL
      const datasetURL = payload || '';
      const substringA = 'datasets/';
      const substringB = '?type=dataset';
      const datasetId = datasetURL.substring(
        datasetURL.indexOf(substringA) + substringA.length,
        datasetURL.indexOf(substringB)
      );

      // GA Tagging
      // Event tracking for map sidebar gallery dataset click
      Tagging.sendEvent({
        'event': 'interaction_event',
        'event_name': 'portal_maps_gallery_click',
        'category': datasetURL,
        'location': 'map_sidebar_gallery',
        'dataset_id': datasetId || ''
      });
    },
    onAnnotationSubmitted: function(annotation) {
      if (this.annotationCallback) {
        this.annotationCallback(annotation);
      } else if (this.confirmCommentCallback) {
        this.confirmCommentCallback(annotation)
      }
    },
    onConfirmCreate: function(payload) {
      if (this.confirmCreateCallback) {
        this.confirmCreateCallback(payload);
      }
    },
    onCancelCreate: function() {
      if (this.cancelCreateCallback) {
        this.cancelCreateCallback();
      }
    },
    onConfirmDelete: function(payload) {
      if (this.confirmDeleteCallback) {
        this.confirmDeleteCallback(payload);
      }
    },
    onSidebarTabClicked: function (tab) {
      let globalSettings = { ...this.settingsStore.globalSettings };

      if ('interactiveMode' in globalSettings) {
        if (tab.id === 1 && tab.type === 'datasetExplorer') {
          globalSettings.interactiveMode = 'dataset';
        } else if (tab.id === 2 && tab.type === 'connectivityExplorer') {
          globalSettings.interactiveMode = 'connectivity';
        }
        this.settingsStore.updateGlobalSettings(globalSettings);
      }

      this.$refs.dialogToolbar.loadGlobalSettings();
    },
    onSidebarTabClosed: function (tab) {
      if (tab.id === 3 && tab.type === "annotation") {
        EventBus.emit('sidebar-annotation-close');
      }
    },
    updateGlobalSettingsFromState: function (state) {
      if (state?.globalSettings) {
        this.settingsStore.updateGlobalSettings(state.globalSettings);
      }
    },
    trackEvent: function (data) {
      Tagging.sendEvent(data);
    },
    updateFlatmapMinimap: function () {
      const splitdialog = this.$refs.splitdialog;

      if (splitdialog) {
        splitdialog.updateFlatmapMinimap();
      }
    },
  },
  created: function () {
    this._facets = [];
    this._externalStateSet = false;
  },
  mounted: function () {
    EventBus.on("CreateNewEntry", newView => {
      this.createNewEntry(newView);
    });
    EventBus.on("RemoveEntryRequest", id => {
      this.removeEntry(id);
    });
    EventBus.on("PopoverActionClick", payload => {
      this.actionClick(payload);
    });
    EventBus.on('annotation-open', payload => {
      this.openAnnotation(payload);
    });
    EventBus.on('sidebar-annotation-close', () => {
      const globalSettings = { ...this.settingsStore.globalSettings };
      const { interactiveMode, viewingMode } = globalSettings;

      // Sidebar annotation close event emits whenever viewing mode is changed.
      // if annotation state is being restored on first load for annotation viewing mode,
      // open the anootation tab and return.
      if (this.sidebarAnnotationState && viewingMode === 'Annotation') {
        this.sidebarAnnotationState = false;
        this.$refs.sideBar.tabClicked({id: 3, type: 'annotation'});
        return;
      }

      this.annotationEntry = [];
      this.createData = {};

      if (this.$refs.sideBar) {
        if (interactiveMode === "dataset") {
          this.$refs.sideBar.tabClicked({id:  1, type: 'datasetExplorer'});
        } else if (interactiveMode === "connectivity") {
          this.$refs.sideBar.tabClicked({id:  2, type: 'connectivityExplorer'});
        }

        this.$refs.sideBar.closeConnectivity();
        EventBus.emit('connectivity-item-close');
      }
    });
    EventBus.on('update-offline-annotation-enabled', (payload) => {
      this.settingsStore.updateOfflineAnnotationEnabled(payload);
    });
    EventBus.on('connectivity-info-open', payload => {
      this.openConnectivityInfo(payload);
    });
    EventBus.on('connectivity-info-close', payload => {
      if (this.$refs.sideBar) {
        this.connectivityProcessed = false;
        this.$refs.sideBar.resetConnectivitySearch();
      }
    });
    EventBus.on('connectivity-error', payload => {
      if (this.$refs.sideBar) {
        this.$refs.sideBar.updateConnectivityError(payload.data);
      }
    });
    EventBus.on('neuron-connection-feature-click', payload => {
      if (this.$refs.sideBar) {
        const { filters, search } = payload;
        this.$refs.sideBar.openConnectivitySearch(filters, search);
        this.$refs.sideBar.tabClicked({ id: 2, type: 'connectivityExplorer' });
        this.$refs.sideBar.setDrawerOpen(true);
      }
    });
    EventBus.on("OpenNewMap", type => {
      this.updateFlatmapMinimap();
      this.openNewMap(type);
    });
    EventBus.on("startHelp", () => {
      if (this.$refs.sideBar) {
        this.$refs.sideBar.close();
      }
    });
    EventBus.on("connectivity-knowledge", payload => {
      this.connectivityKnowledge = payload.data;
      this.connectivityHighlight = payload.highlight;
      this.connectivityProcessed = payload.processed;

      // Restore sidebar state if it exists and not restored yet
      // after loading connectivity knowledge
      this.restoreSidebarState(this.state);
    })
    EventBus.on("modeUpdate", payload => {
      if (payload === "dataset") {
        this.$refs.sideBar.tabClicked({id:  1, type: 'datasetExplorer'});
      } else if (payload === "connectivity") {
        this.$refs.sideBar.tabClicked({id:  2, type: 'connectivityExplorer'});
      }
    })
    EventBus.on("connectivity-filter-options", payload => {
      this.filterOptions = payload;
    })
    this.$nextTick(() => {
      if (this.search === "" && this._facets.length === 0) {
        if (this.$refs.sideBar) {
          this.$refs.sideBar.close();
        }
        setTimeout(() => {
          this.startUp = false;
        }, 2000);
      } else this.openSearch(this._facets, this.search);
    });
  },
  computed: {
    ...mapStores(useEntriesStore, useSettingsStore, useSplitFlowStore),
    envVars: function () {
      return {
        API_LOCATION: this.settingsStore.sparcApi,
        ALGOLIA_INDEX: this.settingsStore.algoliaIndex,
        ALGOLIA_KEY: this.settingsStore.algoliaKey,
        ALGOLIA_ID: this.settingsStore.algoliaId,
        PENNSIEVE_API_LOCATION: this.settingsStore.pennsieveApi,
        NL_LINK_PREFIX: this.settingsStore.nlLinkPrefix,
        ROOT_URL: this.settingsStore.rootUrl,
        FLATMAPAPI_LOCATION: this.settingsStore.flatmapAPI,
      };
    },
    entries: function() {
      return this.entriesStore.entries;
    },
  },
};
</script>

<style scoped lang="scss">
.dialog-header {
  color: #333;
  line-height: 20px;
  border-bottom: solid 0.7px #dcdfe6;
  background-color: #f5f7fa;
}

.dialog-main {
  padding: 0px;
  width: 100%;
  height: 100%;
}

.start-up {
  :deep(.el-drawer__open) {
    .el-drawer {
      &.rtl {
        animation: unset;
      }
    }
  }
  :deep(.el-drawer-fade-leave-active) {
    animation: unset;
  }
  :deep(.el-drawer) {
    &.rtl {
      animation: rtl-drawer-out 2s linear;
    }
  }

  :deep(.el-drawer__wrapper) {
    &.side-bar {
      display: block !important;
    }
  }
}

</style>
