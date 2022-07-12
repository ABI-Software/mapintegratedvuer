<template>
  <MultiFlatmapVuer
    :availableSpecies="entry.availableSpecies"
    @flatmapChanged="flatmapChanged"
    @ready="multiFlatmapReady"
    :state="entry.state"
    @resource-selected="resourceSelected(entry.type, $event)"
    :name="entry.resource"
    style="height: 100%; width: 100%"
    :initial="entry.resource"
    :helpMode="helpMode"
    ref="multiflatmap"
    :displayMinimap="true"
    :flatmapAPI="flatmapAPI"
    @pan-zoom-callback="flatmapPanZoomCallback"
  />
</template>

<script>
/* eslint-disable no-alert, no-console */
import { MultiFlatmapVuer } from "@abi-software/flatmapvuer/src/components/index.js";
import ContentMixin from "../../mixins/ContentMixin";
import EventBus from "../EventBus";
import store from "../../store";
import markerZoomLevels from '../markerZoomLevels'
import {getAvailableTermsForSpecies} from '../SimulatedData.js';
export default {
  name: "MultiFlatmap",
  mixins: [ ContentMixin ],
  components: {
    MultiFlatmapVuer,
  },
  methods: {
    /**
     * Toggle sync mode on/off depending on species and current state
     */
    toggleSyncMode: function () {
      if (this.syncMode == false) {
        let action = undefined;
        if (this.activeSpecies === "Rat") {
          action = {
            contextCard: undefined,
            discoverId: undefined,
            label: "Rat Map",
            resource:
              "https://mapcore-bucket1.s3.us-west-2.amazonaws.com/WholeBody/31-May-2021/ratBody/ratBody_syncmap_metadata.json",
            title: "View 3D scaffold",
            layout: "2horpanel",
            type: "SyncMap",
          };
        } else if (this.activeSpecies === "Human") {
          action = {
            contextCard: undefined,
            discoverId: undefined,
            label: "Human Map",
            resource:
              "https://mapcore-bucket1.s3.us-west-2.amazonaws.com/WholeBody/31-May-2021/humanBody/humanBody_syncmap_metadata.json",
            title: "View 3D scaffold",
            layout: "2vertpanel",
            type: "SyncMap",
          };
        }
        if (action)
          EventBus.$emit("SyncModeRequest", { flag: true, action: action });
      } else {
        EventBus.$emit("SyncModeRequest", { flag: false });
      }
    },
    getState: function () {
      return this.$refs.multiflatmap.getState();
    },
    flatmapPanZoomCallback: function (payload) {
      const result = {
        paneIndex: this.entry.id,
        eventType: "panZoom",
        payload: payload,
        type: this.entry.type,
      };
      this.handleSyncPanZoomEvent(result)
      this.$emit("resource-selected", result);
    },
    /**
     * Perform a local search on this contentvuer
     */
    search: function (term) {
      return this.$refs.multiflatmap.getCurrentFlatmap().searchAndShowResult(term);
    },
    /**
     * Handle sync pan zoom event
     */
    handleSyncPanZoomEvent: function (data) {
      //Prevent recursive callback
      if (!this.mouseHovered) {
        if (data.type !== this.entry.type) {
          const zoom = data.payload.zoom;
          const center = data.payload.target;
          const height = this.$el.clientHeight;
          const width = this.$el.clientWidth;
          const max = Math.max(height, width);
          const sW = width / max / zoom;
          const sH = height / max / zoom;
          const origin = [
            center[0] / 2 + 0.5 - sW / 2,
            0.5 - center[1] / 2 - sH / 2,
          ];
          this.$refs.multiflatmap
            .getCurrentFlatmap()
            .mapImp.panZoomTo(origin, [sW, sH]);
        }
        this.flatmapMarkerZoomUpdate() 
      }
    },
    zoomToFeatures: function(info, forceSelect) {
      let name = info.name;
      const flatmap = this.$refs.multiflatmap.getCurrentFlatmap().mapImp;
      if (name) {
        const results = flatmap.search(name);
        if (results.featureIds.length) {
          let externalId = flatmap.modelForFeature(results.featureIds[0]);
          if (externalId) {
            if (forceSelect) {
              flatmap.selectFeatures(externalId);
            }
            flatmap.zoomToFeatures(externalId);
          } else flatmap.clearSearchResults();
        }
      } else {
        flatmap.clearSearchResults();
      }
    },
    highlightFeatures: function(info) {
      let name = info.name;
      const flatmap = this.$refs.multiflatmap.getCurrentFlatmap().mapImp;
      if (name) {
        const results = flatmap.search(name);
        if (results.featureIds[0]) {
          flatmap.highlightFeatures([
            flatmap.modelForFeature(results.featureIds[0]),
          ]);
        }
      }
    },
    flatmapChanged: function (activeSpecies) {
      this.activeSpecies = activeSpecies;
      this.$emit("species-changed", activeSpecies);
      if (!(this.entry.state && (this.entry.state.species === this.activeSpecies))) {
        if (this.syncMode == true)
          this.toggleSyncMode();
      }
    },
    multiFlatmapReady: function (component) {
      this.$refs.multiflatmap.getCurrentFlatmap().enablePanZoomEvents(true); // Use zoom events for dynamic markers
      this.updateMarkers(component);
      //component.addPanZoomEvent();
    },
      updateMarkers: function(component) {
      let map = component.mapImp
      map.clearMarkers();
      let params = [];
      if (this.apiLocation) {
        store.state.settings.facets.species.forEach(e => {
          params.push(encodeURIComponent('species') + '=' + encodeURIComponent(e));
        });
        if (this._controller) 
          this._controller.abort();
        this._controller = new AbortController();
        let signal = this._controller.signal;
        fetch(`${this.apiLocation}get-organ-curies?${params.join('&')}`, {signal})
        .then((response) => response.json())
        .then((data) => {
          this.idNamePair = {}
          this._controller = undefined;
          data.uberon.array.forEach((pair) => {
            let id = pair.id.toUpperCase();
            this.idNamePair[id] = pair.name.charAt(0).toUpperCase() + pair.name.slice(1);
          });
          this.markers = {...this.idNamePair}
          store.commit("settings/updateMarkers", Object.keys(this.markers))
        })
        .catch(err=> {
          if (err.name !== 'AbortError') {
            let terms = getAvailableTermsForSpecies(map.describes);
            for (let i = 0; i < terms.length; i++) {
              map.addMarker(terms[i].id, terms[i].type);
            }
          }
        });
      } else {
        let terms = getAvailableTermsForSpecies(map.describes);
        for (let i = 0; i < terms.length; i++) {
          map.addMarker(terms[i].id, terms[i].type);
        }
      }
    },
    flatmapMarkerZoomUpdate(){
      let flatmapImp = this.getFlatmapImp()
      flatmapImp.clearMarkers()
      let currentZoom = flatmapImp.getZoom()['zoom']
      let markers = store.state.settings.markers
      markers.forEach(id=>{
        markerZoomLevels.map(el=>{
          if (el.id === id && currentZoom >= el.showAtZoom) {
            flatmapImp.addMarker(id, "simulation") 
          }
        })
      })
    },
    getFlatmapImp: function() {
      if (this.entry.type === 'Flatmap') {
        return this.$refs.flatmap.mapImp
      } else if (this.entry.type === 'MultiFlatmap') {
        return this.$refs.multiflatmap.getCurrentFlatmap()['mapImp']
      } else {
        return undefined
      }
    },
    flatmapAreaSearch(){
      this.flatmapImp = this.getFlatmapImp()
      let shownMarkers = this.flatmapImp.visibleMarkerAnatomicalIds()
      let returnedAction = {
        type: "Facets",
        label: "Unused",
        val: shownMarkers.map(marker=>this.idNamePair[marker])
      }
      EventBus.$emit("PopoverActionClick", returnedAction);
    },
  },
  computed: {
    facetSpecies() {
      return store.state.settings.facets.species;
    },
  },
  watch: {
    // disable this now that we pull directly from the sidebar
    // facetSpecies: function () {
    //   this.updateMarkers(this.$refs.multiflatmap.getCurrentFlatmap());
    // },
    syncMode: function (val) {
      if (this.$refs.multiflatmap.getCurrentFlatmap())
        this.$refs.multiflatmap.getCurrentFlatmap().enablePanZoomEvents(val);
    }
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import "~element-ui/packages/theme-chalk/src/button";
</style>

<style src="@/../assets/mapicon-species-style.css">
</style>
