import { defineStore } from 'pinia';
import { listsAreEqual } from "../components/scripts/utilities";

function mergeConnectivityEntries(existingEntries = [], incomingEntries = []) {
  const merged = new Map();

  [...existingEntries, ...incomingEntries].forEach((entry) => {
    if (!entry || entry.id === undefined) {
      return;
    }

    const existing = merged.get(entry.id);
    merged.set(entry.id, existing ? {
      ...existing,
      ...entry,
      'nerve-label': entry['nerve-label'] || existing['nerve-label'],
      'long-label': entry['long-label'] || existing['long-label'],
      'expert-consultants': entry['expert-consultants'] || existing['expert-consultants'],
    } : { ...entry });
  });

  return Array.from(merged.values());
}

export const useConnectivitiesStore = defineStore('connectivities', {
  state: () => {
    return {
      activeConnectivityKeys: [],
      globalConnectivities: {},
      filterOptions: {},
      filterSources: {},
      connectivitiesUpdated: true,
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
      return Object.values(combinedConnectivities).sort((a, b) => a.label.localeCompare(b.label));
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
      if (!listsAreEqual(this.activeConnectivityKeys, activeConnectivityKeys)) {
        this.activeConnectivityKeys = activeConnectivityKeys;
        return true;
      } else if (this.connectivitiesUpdated) {
        this.connectivitiesUpdated = !activeConnectivityKeys.every(ele => ele in this.globalConnectivities);
        return true;
      }
      return false;
    },
    updateGlobalConnectivities(globalConnectivities) {
      if (globalConnectivities) {
        // Each viewer (MultiFlatmap/Flatmap/Scaffold) only knows about its own
        // uuid/sckanVersion key(s) when it calls this action, and its local
        // snapshot may be stale for the same entry set. Merge by key and by id
        // so a later flatmap update does not wipe richer scaffold metadata such
        // as nerve-label.
        const merged = { ...this.globalConnectivities };

        Object.entries(globalConnectivities).forEach(([uuid, entries]) => {
          const existingEntries = merged[uuid] || [];
          merged[uuid] = mergeConnectivityEntries(existingEntries, entries || []);
        });

        if (JSON.stringify(merged) !== JSON.stringify(this.globalConnectivities)) {
          this.globalConnectivities = merged;
          this.connectivitiesUpdated = true;
        }
      }
    },
    updateFilterOptions(filterOptions) {
      this.filterOptions = filterOptions;
    },
    updateFilterSources(filterSources) {
      this.filterSources = filterSources;
    },
  },
});
