import { defineStore } from 'pinia';

export const useConnectivitiesStore = defineStore('connectivities', {
  state: () => {
    return {
      globalConnectivities: {},
    }
  },
  getters: {

  },
  actions: {
    updateGlobalConnectivities(globalConnectivities) {
      this.globalConnectivities = globalConnectivities;
    }
  },
});
