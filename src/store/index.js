import Vue from 'vue';
import Vuex from 'vuex';
import settings from './modules/settings';
import splitFlow from './modules/splitFlow';
Vue.use(Vuex);

export const store = new Vuex.Store({
  modules: {
    splitFlow,
    settings,
  }
});

export default store;
