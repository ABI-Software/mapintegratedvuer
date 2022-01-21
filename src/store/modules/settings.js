/* eslint-disable no-alert, no-console */
const state = () => ({
  shareLink: undefined,
  sparcApi: undefined,
  algoliaIndex: 'k-core_dev_published_time_desc',
  algoliaKey: undefined,
  algoliaId: undefined,
  pennsieveApi: undefined,
  flatmapAPI: undefined,
  facets: {'species':[], 'gender':[], 'organ':[]}
});

const mutations = {
  updateShareLink(state, newLink) {
    state.shareLink = newLink;
  },
  updateSparcAPI(state, api) {
    state.sparcApi = api;
  },
  updateAlgoliaIndex(state, algoliaIndex ) {
    state.algoliaIndex = algoliaIndex 
  },
  updateAlgoliaKey(state, algoliaKey) {
    state.algoliaKey = algoliaKey
  },
  updateAlgoliaId(state, algoliaId) {
    state.algoliaId = algoliaId
  },
  updatePennsieveApi(state, pennsieveApi ) {
    state.pennsieveApi = pennsieveApi 
  },
  updateFlatmapAPI(state, flatmapAPI) {
    state.flatmapAPI = flatmapAPI;
  },
  updateFacets(state, facetsIn) {
    window.fin = facetsIn
    // The following codes aim to minimise changes on the array
    let facets = {'species':[], 'gender':[], 'organ':[]};
    //First add missing item
    if (facetsIn) {
      facetsIn.forEach(e => {
        switch (e.term) {
          case 'species':
            if (e.facet !== 'show all') {
              facets.species.push(e.facet);
              if (!state.facets.species.includes(e.facet)) {
                state.facets.species.push(e.facet);
              }
            }
            break;
          case 'gender':
            if (e.facet !== 'show all') {
              facets.gender.push(e.facet);
              if (!state.facets.species.includes(e.facet))
                state.facets.gender.push(e.facet);
            }
            break;
          case 'organ':
            if (e.facet !== 'show all') {
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
};

export default {
  namespaced: true,
  state,
  mutations
}
