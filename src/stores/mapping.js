import { defineStore } from 'pinia'
import { MappingService } from '../services/mapping'

export const useMappingStore = defineStore('mapping', {
  state: () => ({
    elementMap: new Map(),
  }),

  actions: {
    async initializeMapping() {
      this.elementMap.clear()

      // Find which file to load
      const index = await MappingService.getMappingIndex()

      if (index) {
        // Parse and store
        this.elementMap = await MappingService.loadMapping(index)
        console.log('this element map:')
        console.log(this.elementMap)
      } else {
        console.warn('No index found.')
      }
    },

    // Helper to get data for a specific element ID
    mapToCellMLIdentifiers(flatmapUuid, flatmapElementId) {
      return this.elementMap.get(flatmapUuid).get(flatmapElementId)
    },
  },
})
