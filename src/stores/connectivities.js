import { defineStore } from 'pinia';

export const useConnectivitiesStore = defineStore('connectivities', {
  state: () => {
    return {
      globalConnectivities: {},
      activeConnectivityKey: '',
    }
  },
  getters: {

  },
  actions: {
    updateGlobalConnectivities(globalConnectivities) {
      this.globalConnectivities = globalConnectivities;
    },
    updateActiveConnectivityKey(activeConnectivityKey) {
      this.activeConnectivityKey = activeConnectivityKey;
    },
  }
});
