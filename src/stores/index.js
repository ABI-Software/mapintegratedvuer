import Vue from 'vue';
import Vuex from 'vuex';
import entries from './modules/entries';
import settings from './modules/settings';
import splitFlow from './modules/splitFlow';
Vue.use(Vuex);

export const store = new Vuex.Store({
  modules: {
    entries,
    splitFlow,
    settings,
  }
});

export default store;
