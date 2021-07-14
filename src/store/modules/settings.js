/* eslint-disable no-alert, no-console */
const state = () => ({
  shareLink: undefined,
  api: undefined,
  flatmapAPI: undefined,
  facets: {'species':[], 'gender':[], 'organ':[]}
});

const mutations = {
  updateShareLink(state, newLink) {
    state.shareLink = newLink;
  },
  updateAPI(state, api) {
    state.api = api;
  },
  updateFlatmapAPI(state, flatmapAPI) {
    state.flatmapAPI = flatmapAPI;
  },
  updateFacets(state, facetsIn) {
    // The following codes aim to minimise changes on the array
    let facets = {'species':[], 'gender':[], 'organ':[]};
    //First add missing item
    if (facetsIn) {
      facetsIn.forEach(e => {
        switch (e.term) {
          case 'species':
            if (e.facet !== 'All Species') {
              facets.species.push(e.facet);
              if (!state.facets.species.includes(e.facet)) {
                state.facets.species.push(e.facet);
              }
            }
            break;
          case 'gender':
            if (e.facet !== 'All Gender') {
              facets.gender.push(e.facet);
              if (!state.facets.species.includes(e.facet))
                state.facets.gender.push(e.facet);
            }
            break;
          case 'organ':
            if (e.facet !== 'All Organ') {
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
