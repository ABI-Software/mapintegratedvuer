/* eslint-disable no-alert, no-console */
const state = () => ({
  activeView: "singlepanel",
});

const mutations = {
  updateActiveView(state, activeView) {
    state.activeView = activeView;
  },
};

export default {
  namespaced: true,
  state,
  mutations
}
