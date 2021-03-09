/* eslint-disable no-alert, no-console */
const state = () => ({
  shareLink: undefined,
  api: undefined,
  flatmapAPI: undefined,
  activeView: "singlepanel",
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
  updateActiveView(state, activeView) {
    state.activeView = activeView;
  },
};

export default {
  namespaced: true,
  state,
  mutations
}
