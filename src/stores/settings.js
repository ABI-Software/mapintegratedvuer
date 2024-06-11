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
      rootUrl: undefined,
      facets: { species: [], gender: [], organ: [] },
      numberOfDatasetsForFacets: [],
      markers: [],
      hoveredMarkers: [],
      previousHoveredMarkers: null,
      featuredMarkers: [],
      featuredMarkerIdentifiers: [],
      featuredMarkerDois: [],
      featuredMarkerSpecies: [],
      featuredDatasetIdentifiers: [],
      helpDelay: 0,
      useHelpModeDialog: false,
    }
  },
  getters: {
    isFeaturedMarkerIdentifier: state => identifier => {
      return state.featuredMarkerIdentifiers.includes(identifier);
    },
    featuredMarkerDoi: state => identifier => {
      const index = state.featuredMarkerIdentifiers.findIndex(
        element => element == identifier
      );
      return state.featuredMarkerDois[index];
    },
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
    updateNLLinkPrefix(nlLinkPrefix) {
      this.nlLinkPrefix = nlLinkPrefix;
    },
    updateRootUrl(rootUrl) {
      this.rootUrl = rootUrl;
    },
    updateMarkers(markers) {
      this.markers = markers;
    },
    updateHoveredMarkers(markers) {
      this.previousHoveredMarkers = this.hoveredMarkers;
      this.hoveredMarkers = markers;
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
  }
});
