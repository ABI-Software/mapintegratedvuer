import { defineStore } from 'pinia';

export const useConnectivitiesStore = defineStore('connectivities', {
  state: () => {
    return {
      activeConnectivityKeys: [],
      globalConnectivities: {},
      filterOptions: {},
    }
  },
  getters: {
    getUniqueConnectivitiesByKeys: (state) => {
      let combinedConnectivities = [];
      state.activeConnectivityKeys.forEach((uuid) => {
        if (uuid in state['globalConnectivities']) {
          const connectivities = state['globalConnectivities'][uuid];
          combinedConnectivities.push(...connectivities);
        }
      });
      const uniqueConnectivities = Array.from(
        new Map(combinedConnectivities.map((item) => [item['id'], item])).values()
      );
      return uniqueConnectivities;
    },
    getUniqueFilterOptionsByKeys: (state) => {
      const uniqueFilterOptions = state.activeConnectivityKeys.reduce((acc, uuid) => {
        const filters = state.filterOptions[uuid];
        if (!filters) return acc;

        for (const filter of filters) {
          const existing = acc[filter.key];

          if (!existing) {
            acc[filter.key] = { ...filter };
          } else {
            const mergedChildren = [...existing.children, ...filter.children];
            const uniqueChildren = Array.from(
              new Map(mergedChildren.map(child => [child.key, child])).values()
            );
            existing.children = uniqueChildren;
          }
        }

        return acc;
      }, {});
      return Object.values(uniqueFilterOptions);
    },
      );
    },
  },
  actions: {
    updateActiveConnectivityKeys(activeConnectivityKeys) {
      this.activeConnectivityKeys = activeConnectivityKeys;
    },
    updateGlobalConnectivities(globalConnectivities) {
      this.globalConnectivities = globalConnectivities;
    },
    updateFilterOptions(filterOptions) {
      this.filterOptions = filterOptions;
    },
  }
});
