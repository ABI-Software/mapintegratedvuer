import Vue from "vue";
import { initialDefaultState } from "../../components/scripts/utilities.js";

/* eslint-disable no-alert, no-console */
const state = () => ( initialDefaultState() );

const getters = {
  state: state => () => {
    return state;
  },
  findIndexOfId: state => id => {
    for (let i = 0; i < state.entries.length; i++) {
      if (state.entries[i].id == id) {
        return i;
      }
    }
    return -1;
  }
};

const mutations = {
  addNewEntry(state, entry) {
    state.entries.push(entry);
  },
  destroyEntry(state, index) {
    if (index > -1) {
      state.entries.splice(index, 1);
    }
  },
  setAll(state, newEntries) {
    state.entries = [];
    Object.assign(state.entries, newEntries);
  },
  updateScaffoldViewEntry(state, data) {
    // 'Scaffold view' is sent in as 'Scaffold' to scaffoldvuer
    data.type = data.type === "Scaffold View" ? "Scaffold" : data.type;

    // Update the scaffold with a view url
    for (let i in state.entries) {
      if (state.entries[i].resource === data.resource) {
        state.entries[i].viewUrl = data.viewUrl;
        Vue.set(state.entries, i, state.entries[i]); // Need this to keep arrays reactive
      }
    }
  },
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
};
