import Vue from "vue";

/* eslint-disable no-alert, no-console */
const state = () => ({
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
  facetLabels: [],
  markers: [],
  featuredMarkers: [],
  featuredMarkerIdentifiers: [],
  featuredMarkerDois: [],
  featuredMarkerSpecies: [],
  featuredDatasetIdentifiers: [],
});

const getters = {
  isFeaturedMarkerIdentifier: state => identifier => {
    return state.featuredMarkerIdentifiers.includes(identifier);
  },
  featuredMarkerDoi: state => identifier => {
    const index = state.featuredMarkerIdentifiers.findIndex(
      element => element == identifier
    );
    return state.featuredMarkerDois[index];
  },
  featuredMarkerSpecies: state => index => {
    return state.featuredMarkerSpecies[index];
  }
};

const mutations = {
  updateShareLink(state, newLink) {
    state.shareLink = newLink;
  },
  updateSparcAPI(state, api) {
    state.sparcApi = api;
  },
  updateAlgoliaIndex(state, algoliaIndex) {
    state.algoliaIndex = algoliaIndex;
  },
  updateAlgoliaKey(state, algoliaKey) {
    state.algoliaKey = algoliaKey;
  },
  updateAlgoliaId(state, algoliaId) {
    state.algoliaId = algoliaId;
  },
  updatePennsieveApi(state, pennsieveApi) {
    state.pennsieveApi = pennsieveApi;
  },
  updateFlatmapAPI(state, flatmapAPI) {
    state.flatmapAPI = flatmapAPI;
  },
  updateNLLinkPrefix(state, nlLinkPrefix) {
    state.nlLinkPrefix = nlLinkPrefix;
  },
  updateRootUrl(state, rootUrl) {
    state.rootUrl = rootUrl;
  },
  updateMarkers(state, markers) {
    state.markers = markers;
  },
  updateFeatured(state, datasetIdentifiers) {
    state.featuredMarkerIdentifiers = new Array(datasetIdentifiers.length);
    state.featuredMarkers = new Array(datasetIdentifiers.length);
    state.featuredMarkerDois = new Array(datasetIdentifiers.length);
    state.featuredMarkerSpecies = new Array(datasetIdentifiers.length);
    state.featuredDatasetIdentifiers = datasetIdentifiers;
  },
  updateFeaturedMarker(state, payload) {
    const index = state.featuredDatasetIdentifiers.findIndex(
      element => element == payload.identifier
    );
    Vue.set(state.featuredMarkers, index, payload.marker);
    state.featuredMarkerDois[index] = payload.doi;
    state.featuredMarkerSpecies[index] = payload.species;
  },
  updateFeaturedMarkerIdentifier(state, payload) {
    state.featuredMarkerIdentifiers[payload.index] = payload.markerIdentifier;
  },
  resetFeaturedMarkerIdentifier(state) {
    state.featuredMarkerIdentifiers = new Array(
      state.featuredDatasetIdentifiers.length
    );
  },

  updateFacets(state, facetsIn) {
    // The following codes aim to minimise changes on the array
    let facets = { species: [], gender: [], organ: [] };
    //First add missing item
    if (facetsIn) {
      facetsIn.forEach(e => {
        switch (e.term.toLowerCase()) {
          case "species":
            if (e.facet.toLowerCase() !== "show all") {
              facets.species.push(e.facet);
              if (!state.facets.species.includes(e.facet)) {
                state.facets.species.push(e.facet);
              }
            } else {
              state.facets.species = [];
            }
            break;
          case "gender":
            if (e.facet.toLowerCase() !== "show all") {
              facets.gender.push(e.facet);
              if (!state.facets.species.includes(e.facet))
                state.facets.gender.push(e.facet);
            }
            break;
          case "organ":
            if (e.facet.toLowerCase() !== "show all") {
              facets.organ.push(e.facet);
              if (!state.facets.species.includes(e.facet))
                state.facets.organ.push(e.facet);
            }
            break;
          default:
            break;
        }
      });
      //Remove item not in list
      for (const [key, arr] of Object.entries(state.facets)) {
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
  updateFacetLabels(state, facetLabels) {
    state.facetLabels = facetLabels;
  }
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
};
