const state = () => ({
  shareLink: undefined,
});

const mutations = {
  updateShareLink(state, newLink) {
    state.shareLink = newLink;
  }
};

export default {
  namespaced: true,
  state,
  mutations
}
