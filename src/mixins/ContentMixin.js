import { getAvailableTermsForSpecies, getInteractiveAction, getParentsRegion } from "../components/SimulatedData.js";
import EventBus from "../components/EventBus";
import store from "../store";

/* eslint-disable no-alert, no-console */
export default {
  props: {
    /**
     * Object containing information for
     * the required viewing.
     */
    entry: Object,
    visible: {
      type: Boolean,
      default: true,
    },
  },
  computed: {
    syncMode() {
      return store.state.splitFlow.syncMode;
    },
  },
  mounted: function () {
    EventBus.$on("startHelp", () => {
      this.startHelp();
    });
  },
  methods: {
    toggleSyncMode: function () {
      return;
    },
    getState: function () {
      return undefined;
    },
    /**
     * Perform a local search on this contentvuer
     */
    search: function () {
      return false;
    },
    /**
     * Callback when the vuers emit a selected event.
     */
    resourceSelected: function (type, resource) {
      // Skip processing if resources already has actions
      if (this.resourceHasAction(resource)) {
        EventBus.$emit("PopoverActionClick", resource);
        return;
      }

      let returnedAction = undefined;
      let action = "none";
      let fireResourceSelected = false;
      const result = {
        paneIndex: this.entry.id,
        type: type,
        resource: resource,
        internalName: undefined,
        eventType: undefined,
      };

      if (type == "MultiFlatmap" || type == "Flatmap") {
        result.internalName = this.idNamePair[resource.feature.models];
        if (resource.eventType == "click") {
          result.eventType = "selected";
          if (resource.feature.type == "marker") {
            returnedAction = {};
            returnedAction.type = "Facet";
            returnedAction.label = this.idNamePair[resource.feature.models];
            fireResourceSelected = true;
            if (type == "MultiFlatmap") {
              const flatmap =
                this.$refs.multiflatmap.getCurrentFlatmap().mapImp;
              flatmap.clearSearchResults();
            }
          } else if (resource.feature.type == "feature") {
            // Do no open scaffold in sync map
            if (this.syncMode) {
              fireResourceSelected = true;
            } else {
              action = "scaffold";
            }
          }
        } else if (resource.eventType == "mouseenter") {
          result.eventType = "highlighted";
          fireResourceSelected = true;
        }
      } else if (type == "Scaffold") {
        if (resource && resource[0]) result.internalName = resource[0].data.id;
        result.eventType = "selected";
        fireResourceSelected = true;
        action = "search";
      }
      if (returnedAction === undefined)
        returnedAction = getInteractiveAction(result, action);
      if (returnedAction) EventBus.$emit("PopoverActionClick", returnedAction);
      if (fireResourceSelected) this.$emit("resource-selected", result);
    },
    resourceHasAction: function (resource) {
      return (
        resource.type === "URL" ||
        resource.type === "Search" ||
        resource.type === "Neuron Search"
      );
    },
    /**
     * Check if this viewer is currently visible
     */
    isVisible: function() {
      let slot = store.getters["splitFlow/getSlotById"](this.entry.id);
      if (slot) return store.getters["splitFlow/isSlotActive"](slot);
      return false;
    },
    /**
     * Get the term to zoom/highlight in a synchronisation event,
     * if it cannot be found in the map, it will perform several
     * calls to try to ge a valid name/id.
     */
    getNameAndIdFromSyncData: async function(data) {
      let name = data.internalName;
      if (name === undefined && data.resource) {
        name = data.resource.label;
      }
      let id = undefined;
      if (data.resource && data.resource.resource) {
        id = data.resource.resource[0];
      }
      if (this.entry.type === "Scaffold") {
        const objects = this.$refs.scaffold.findObjectsWithGroupName(name);
        // If a region is not found use a hardcoded list to determine
        // its parents region first
        if (objects.length === 0) {
          let matched = getParentsRegion(name);
          if (matched) {
            return matched;
          }
          // Hardcoded list failed - use an endpoint to find its parents
          if (id && data.eventType === "selected") {
            return fetch(`${this.apiLocation}get-related-terms/${id}`)
              .then((response) => response.json())
              .then((data) => {
                if (data.uberon.array.length > 0) {
                  name = data.uberon.array[0].name.charAt(0).toUpperCase() + data.uberon.array[0].name.slice(1);
                  id = data.uberon.array[0].id.toUpperCase();
                  return {id, name};
                }
              }
            );
          }
        }
      } else if (this.entry.type === "MultiFlatmap") {
        if (name === "Bladder") {
          name = "Urinary Bladder";
        }
      }
      return {id, name};
    },
    zoomToFeatures: function() {
      return;
    },
    handleSyncMouseEvent: async function (data) {
      let info = await this.getNameAndIdFromSyncData(data);
      if (data.eventType === "highlighted") {
        this.highlightFeatures(info);
      } else if (data.eventType === "selected") {
        this.zoomToFeatures(info, true);
      }
    },
    /**
     * Handle sync pan zoom event
     */
     handleSyncPanZoomEvent: function () {
      return;
    },
    highlightFeatures: function() {
      return;
    },
    receiveSynchronisedEvent: async function (data) {
      if (data.paneIndex !== this.entry.id) {
        if (data.eventType == "panZoom") {
          this.handleSyncPanZoomEvent(data);
        } else {
          this.handleSyncMouseEvent(data);
        }
      } else {
        if (data.eventType == "selected") {
          let info = await this.getNameAndIdFromSyncData(data);
          this.zoomToFeatures(info, false);
        }
      }
    },
    requestSynchronisedEvent: function () {
      return;
    },
    updateMarkers: function (component) {
      let map = component.mapImp;
      map.clearMarkers();
      let params = [];
      //Use the default list of uberons before we get the list from
      //the api
      let terms = getAvailableTermsForSpecies();
      for (let i = 0; i < terms.length; i++) {
        map.addMarker(terms[i].id, terms[i].type);
        this.idNamePair[terms[i].id] = terms[i].name;
      }
      if (this.apiLocation) {
        store.state.settings.facets.species.forEach((e) => {
          params.push(
            encodeURIComponent("species") + "=" + encodeURIComponent(e)
          );
        });
        if (this._controller) this._controller.abort();
        this._controller = new AbortController();
        let signal = this._controller.signal;
        fetch(`${this.apiLocation}get-organ-curies?${params.join("&")}`, {
          signal,
        })
          .then((response) => response.json())
          .then((data) => {
            this._controller = undefined;
            data.uberon.array.forEach((pair) => {
              this.idNamePair[pair.id.toUpperCase()] =
                pair.name.charAt(0).toUpperCase() + pair.name.slice(1);
              map.addMarker(pair.id.toUpperCase(), "simulation");
            });
            return;
          }
        );
      }
    },
    onResize: function () {
      return;
    },
    startHelp: function () {
      if (this.isInHelp === false) {
        this.helpMode = true;
        window.addEventListener("mousedown", this.endHelp);
        this.isInHelp = true;
      }
    },
    endHelp: function () {
      window.removeEventListener("mousedown", this.endHelp);
      this.helpMode = false;
      setTimeout(() => {
        this.isInHelp = false;
      }, 200);
    },
  },
  data: function () {
    return {
      apiLocation: process.env.VUE_APP_API_LOCATION,
      activeSpecies: "Rat",
      scaffoldCamera: undefined,
      mainStyle: {
        height: this.entry.datasetTitle ? "calc(100% - 30px)" : "100%",
        width: "100%",
        bottom: "0px",
      },
      helpMode: false,
      idNamePair: {},
      mouseHovered: false,
      scaffoldLoaded: false,
      isInHelp: false
    };
  },
  created: function () {
    this.flatmapAPI = undefined;
    this.apiLocation = undefined;
    if (store.state.settings.flatmapAPI)
      this.flatmapAPI = store.state.settings.flatmapAPI;
    if (store.state.settings.sparcApi)
      this.apiLocation = store.state.settings.sparcApi;
  },
}
