import { defineStore } from 'pinia'
import { ref } from 'vue'
import EventBus from '../components/EventBus'
import { useEntriesStore } from '../stores/entries';
// import { wasmService } from '@/services/wasmService'

export const useSimulationStore = defineStore('simulation', () => {
  const currentData = ref(null)
  const windows = ref([])
  const entriesStore = useEntriesStore();

  // The argument 'req' is automatically inferred as SimulationRequest
  function processRequest(req) {
    // strict check against the literal type
    if (req.id !== 'nz.ac.auckland.simulation-data-request') return

    console.log('Processing simulation request:', req)
    console.log(entriesStore.entries);
    // TypeScript knows 'req' has the correct shape for the service
    const result = wasmService.getData([req])
    currentData.value = result
  }

  function initListeners() {
    EventBus.on('simulation-request', processRequest)
  }

  function cleanupListeners() {
    EventBus.off('simulation-request', processRequest);
  }

  return { 
    currentData,
    windows,
    initListeners, 
    cleanupListeners 
  }
})
