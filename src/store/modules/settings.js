/* eslint-disable no-alert, no-console */
const state = () => ({
  shareLink: undefined,
  api: undefined,
});

const mutations = {
  updateShareLink(state, newLink) {
    state.shareLink = newLink;
  },
  updateAPI(state, api) {
    state.api = api;
  },
};

export default {
  namespaced: true,
  state,
  mutations
}
