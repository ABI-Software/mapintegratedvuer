import { defineStore } from 'pinia';

/* eslint-disable no-alert, no-console */

export const useSettingsStore = defineStore('settings', {
  state: () => {
    return {
      shareLink: undefined,
      sparcApi: undefined,
      algoliaIndex: "k-core_dev_published_time_desc",
      algoliaKey: undefined,
      algoliaId: undefined,
      pennsieveApi: undefined,
      flatmapAPI: undefined,
      nlLinkPrefix: undefined,
      mapManager: undefined,
      rootUrl: undefined,
      facets: { species: [], gender: [], organ: [] },
      appliedFacets: [],
      numberOfDatasetsForFacets: [],
      markers: [],
      hoverAnatomies: [],
      hoverOrgans: [],
      hoverDOI: '',
      hoverConnectivity: [],
      featuredMarkers: [],
      featuredMarkerIdentifiers: [],
      featuredMarkerDois: [],
      featuredMarkerSpecies: [],
      featuredDatasetIdentifiers: [],
      helpDelay: 0,
      useHelpModeDialog: false,
      connectivityInfoSidebar: true,
      annotationSidebar: true,
      allClosable: true,
      offlineAnnotationEnabled: false,
      displayMinimap: true,
      globalSettings: {
        displayMarkers: true, // comment out to hide in settings
        // highlightConnectedPaths: false, // comment out to hide in settings
        // highlightDOIPaths: false, // comment out to hide in settings
        interactiveMode: 'dataset', // dataset, connectivity, multiscale // comment out to hide in settings
        viewingMode: 'Exploration',
        flightPathDisplay: false,
        organsDisplay: true,
        outlinesDisplay: true,
        backgroundDisplay: 'white',
        connectionType: 'All', // 'Origin', 'Via', 'Destination', 'All
      },
    }
  },
  getters: {
    isFeaturedMarkerIdentifier: state => identifier => {
      // state.featuredMarkerIdentifiers can be nested array
      const flatIds = state.featuredMarkerIdentifiers.flat(Infinity);
      return flatIds.includes(identifier);
    },
    featuredMarkerDoi: state => identifier => {
      const index = state.featuredMarkerIdentifiers.findIndex(
        element => element == identifier
      );
      return state.featuredMarkerDois[index];
    },
    getGlobalSettings: state => () => {
      const globalSettings = {};
      for (const [key, value] of Object.entries(state.globalSettings)) {
        globalSettings[key] = value;
      }
      return globalSettings;
    },
    getUpdatedGlobalSettingsKey: state => settings => {
      let updatedSettings = [];
      for (const [key, value] of Object.entries(settings)) {
        const attribute = state.globalSettings[key];
        if (attribute === undefined || (attribute !== value)) {
          updatedSettings.push(key);
        }
      }
      return updatedSettings;
    },
    hasAppliedFacets: state => facets => {
      for (const facet of facets) {
        for (const appliedFacet of state.appliedFacets) {
          if (facet && appliedFacet && facet.toLowerCase() === appliedFacet.toLowerCase()) {
            return true;
          }
        }
      }
      return false;
    }
  },
  actions: {
    updateShareLink(newLink) {
      this.shareLink = newLink;
    },
    updateSparcAPI(api) {
      this.sparcApi = api;
    },
    updateAlgoliaIndex(algoliaIndex) {
      this.algoliaIndex = algoliaIndex;
    },
    updateAlgoliaKey(algoliaKey) {
      this.algoliaKey = algoliaKey;
    },
    updateAlgoliaId(algoliaId) {
      this.algoliaId = algoliaId;
    },
    updatePennsieveApi(pennsieveApi) {
      this.pennsieveApi = pennsieveApi;
    },
    updateFlatmapAPI(flatmapAPI) {
      this.flatmapAPI = flatmapAPI;
    },
    updateMapManager(mapManager) {
      this.mapManager = mapManager;
    },
    updateNLLinkPrefix(nlLinkPrefix) {
      this.nlLinkPrefix = nlLinkPrefix;
    },
    updateRootUrl(rootUrl) {
      this.rootUrl = rootUrl;
    },
    updateMarkers(markers) {
      this.markers = markers;
    },
    updateHoverFeatures(anatomies, organs, doi, connectivity) {
      this.hoverAnatomies = anatomies;
      this.hoverOrgans = organs;
      this.hoverDOI = doi;
      this.hoverConnectivity = connectivity;
    },
    updateFeatured(datasetIdentifiers) {
      this.featuredMarkerIdentifiers = new Array(datasetIdentifiers.length);
      this.featuredMarkers = new Array(datasetIdentifiers.length);
      this.featuredMarkerDois = new Array(datasetIdentifiers.length);
      this.featuredMarkerSpecies = new Array(datasetIdentifiers.length);
      this.featuredDatasetIdentifiers = datasetIdentifiers;
    },
    updateFeaturedMarker(payload) {
      const index = this.featuredDatasetIdentifiers.findIndex(
        element => element == payload.identifier
      );
      this.featuredMarkers[index] = payload.marker;
      this.featuredMarkerDois[index] = payload.doi;
      this.featuredMarkerSpecies[index] = payload.species;
    },
    updateFeaturedMarkerIdentifier(payload) {
      this.featuredMarkerIdentifiers[payload.index] = payload.markerIdentifier;
    },
    resetFeaturedMarkerIdentifier() {
      this.featuredMarkerIdentifiers = new Array(
        this.featuredDatasetIdentifiers.length
      );
    },
    updateAppliedFacets(facetsIn) {
      this.appliedFacets = facetsIn;
    },
    updateFacets(facetsIn) {
      // The following codes aim to minimise changes on the array
      let facets = { species: [], gender: [], organ: [] };
      //First add missing item
      if (facetsIn) {
        facetsIn.forEach(e => {
          switch (e.term.toLowerCase()) {
            case "species":
              if (e.facet.toLowerCase() !== "show all") {
                facets.species.push(e.facet);
                if (!this.facets.species.includes(e.facet)) {
                  this.facets.species.push(e.facet);
                }
              } else {
                this.facets.species = [];
              }
              break;
            case "gender":
              if (e.facet.toLowerCase() !== "show all") {
                facets.gender.push(e.facet);
                if (!this.facets.species.includes(e.facet))
                  this.facets.gender.push(e.facet);
              }
              break;
            case "organ":
              if (e.facet.toLowerCase() !== "show all") {
                facets.organ.push(e.facet);
                if (!this.facets.species.includes(e.facet))
                  this.facets.organ.push(e.facet);
              }
              break;
            default:
              break;
          }
        });
        //Remove item not in list
        for (const [key, arr] of Object.entries(this.facets)) {
          let i = 0;
          for (i = arr.length - 1; i >= 0; i -= 1) {
            const index = facets[key].indexOf(arr[i]);
            if (index == -1) {
              arr.splice(i, 1);
            }
          }
        }
      }
    },
    updateNumberOfDatasetsForFacets(numberOfDatasetsForFacets) {
      this.numberOfDatasetsForFacets = numberOfDatasetsForFacets;
    },
    updateUseHelpModeDialog(helpModeOption) {
      this.useHelpModeDialog = helpModeOption;
    },
    updateConnectivityInfoSidebar(connectivityInfoSidebar) {
      this.connectivityInfoSidebar = connectivityInfoSidebar;
    },
    updateAnnotationSidebar(annotationSidebar) {
      this.annotationSidebar = annotationSidebar;
    },
    updateAllClosable(allClosable) {
      this.allClosable = allClosable;
    },
    updateOfflineAnnotationEnabled(offlineAnnotationEnabled) {
      this.offlineAnnotationEnabled = offlineAnnotationEnabled;
    },
    updateDisplayMinimap(displayMinimap) {
      this.displayMinimap = displayMinimap;
    },
    updateGlobalSettings(globalSettings) {
      for (const [key, value] of Object.entries(globalSettings)) {
        this.globalSettings[key] = value;
      }
    },
  }
});
