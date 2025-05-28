import { defineStore } from 'pinia';

const getUniqueItemsByKeys = (state, sourceKey, itemKey) => {
  let combinedItems = [];
  state.activeConnectivityKeys.forEach((uuid) => {
    if (uuid in state[sourceKey]) {
      const items = state[sourceKey][uuid];
      combinedItems.push(...items);
    }
  });
  const uniqueItems = Array.from(
    new Map(combinedItems.map((item) => [item[itemKey], item])).values()
  );
  return uniqueItems;
}

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
      return getUniqueItemsByKeys(state, 'globalConnectivities', 'id');
    },

    getUniqueFiltersByKeys: (state) => {
      return getUniqueItemsByKeys(state, 'filterOptions', 'key');
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
