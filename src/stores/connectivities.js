import { defineStore } from 'pinia';

export const useConnectivitiesStore = defineStore('connectivities', {
  state: () => {
    return {
      activeConnectivityKeys: [],
      globalConnectivities: {},
      filterOptions: {},
      filterSources: {},
    };
  },
  getters: {
    getUniqueConnectivitiesByKeys: (state) => {
      const combinedConnectivities = state.activeConnectivityKeys.reduce((acc, uuid) => {
        const connectivities = state.globalConnectivities[uuid];
        if (!connectivities) return acc;

        for (const connectivity of connectivities) {
          const key = connectivity.id;

          acc[key] = acc[key] ?
            { ...acc[key], ...connectivity } :
            { ...connectivity };
        }

        return acc;
      }, {});
      return Object.values(combinedConnectivities);
    },
    getUniqueFilterOptionsByKeys: (state) => {
      const uniqueFilterOptions = state.activeConnectivityKeys.reduce((acc, uuid) => {
        const filters = state.filterOptions[uuid];
        if (!filters) return acc;

        for (const filter of filters) {
          if (acc[filter.key]) {
            const mergedChildren = [...acc[filter.key].children, ...filter.children];
            const uniqueChildren = Array.from(
              new Map(mergedChildren.map(child => [child.key, child])).values()
            );
            acc[filter.key].children = uniqueChildren;
          } else {
            acc[filter.key] = { ...filter };
          }
        }

        return acc;
      }, {});
      return Object.values(uniqueFilterOptions);
    },
    getUniqueFilterSourcesByKeys: (state) => {
      const uniqueFilterSources = state.activeConnectivityKeys.reduce((acc, uuid) => {
        const filters = state.filterSources[uuid];
        if (!filters) return acc;

        for (const [filter, options] of Object.entries(filters)) {
          if (!acc[filter]) acc[filter] = {};

          for (const [option, ids] of Object.entries(options)) {
            acc[filter][option] = acc[filter][option]
              ? Array.from(new Set([...acc[filter][option], ...ids]))
              : [...ids];
          }
        }

        return acc;
      }, {});
      return uniqueFilterSources;
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
    updateFilterSources(filterSources) {
      this.filterSources = filterSources;
    },
  },
});
