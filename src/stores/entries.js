import { defineStore } from 'pinia';
import { initialDefaultState } from "../components/scripts/utilities";
import { getKnowledgeSourceFromProvenance } from '@abi-software/flatmapvuer/src/services/flatmapKnowledge.js';

/* eslint-disable no-alert, no-console */

export const useEntriesStore = defineStore('entries', {
  state: () => {
    return initialDefaultState();
  },
  getters: {
    findIndexOfId: (state) => id => {
      for (let i = 0; i < state.entries.length; i++) {
        if (state.entries[i].id == id) {
          return i;
        }
      }
      return -1;
    },
  },
  actions: {
    addNewEntry(entry) {
      this.entries.push(entry);
    },
    destroyEntry(index) {
      if (index > -1) {
        this.entries.splice(index, 1);
      }
    },
    setAll(newEntries) {
      this.entries = [];
      Object.assign(this.entries, newEntries);
    },
    updateViewForEntry( {id, viewUrl}) {
      // Update the scaffold with a view url
      const entry = this.entries.find(entry => entry.id === id);
      entry.viewUrl = viewUrl;
    },
    updateMapForEntry(entry, prov) {
      if (entry.id === prov.id) {
        const sckanVersion = getKnowledgeSourceFromProvenance(prov.prov);
        entry['uuid'] = prov.prov.uuid;
        entry['sckanVersion'] = sckanVersion;
      }
    },
  }
});
