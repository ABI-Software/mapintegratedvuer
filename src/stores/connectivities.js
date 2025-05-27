import { defineStore } from 'pinia';

export const useConnectivitiesStore = defineStore('connectivities', {
  state: () => {
    return {
      globalConnectivities: {},
      activeConnectivityKeys: [],
      filterOptions: {},
    }
  },
  getters: {
    getUniqueConnectivitiesByKeys: (state) => {
      let combinedConnectivities = [];
      state.activeConnectivityKeys.forEach((uuid) => {
        if (uuid in state.globalConnectivities) {
          const connectivity = state.globalConnectivities[uuid];
          combinedConnectivities.push(...connectivity);
        }
      });

      const uniqueConnectivities = Array.from(
        new Map(combinedConnectivities.map((item) => [item.id, item])).values()
      );

      return uniqueConnectivities;
    },
  },
  actions: {
    updateGlobalConnectivities(globalConnectivities) {
      this.globalConnectivities = globalConnectivities;
    },
    updateActiveConnectivityKeys(activeConnectivityKeys) {
      this.activeConnectivityKeys = activeConnectivityKeys;
    },
    updateFilterOptions(filterOptions) {
      this.filterOptions = filterOptions;
    },
  }
});
