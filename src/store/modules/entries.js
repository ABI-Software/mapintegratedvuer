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
  updateViewForEntry(state, {id, viewUrl}) {
    // Update the scaffold with a view url
    const entry = state.entries.find(entry => entry.id === id);
    Vue.set(entry, 'viewUrl', viewUrl);
    entry.viewUrl = viewUrl;
  },
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
};
