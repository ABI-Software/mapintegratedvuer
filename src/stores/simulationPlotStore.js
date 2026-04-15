import { defineStore } from 'pinia'
import { ref } from 'vue'
import EventBus from '../components/EventBus'

const BASE_Z_INDEX = 100

export const useSimulationPlotStore = defineStore('simulationPlot', () => {
  const windows = ref([])
  const zStack = ref([])
  const simulationEntries = ref({})

  function initListeners() {
    EventBus.on('simulation-response', handleSimulationResponse)
    EventBus.on('simulation-ready', handleSimulationReady)
  }

  function cleanupListeners() {
    EventBus.off('simulation-response', handleSimulationResponse)
    EventBus.off('simulation-ready', handleSimulationReady)
  }

  function removeWindow(windowId) {
    const targetWindow = windows.value.find(win => win.id === windowId)
    if (!targetWindow) return
    windows.value = windows.value.filter((win) => win.id !== windowId)
    zStack.value = zStack.value.filter((stackId) => stackId !== windowId)
    EventBus.emit('plot-window-closed', { id: targetWindow.id})
  }

  function refreshZIndices() {
    windows.value.forEach((win) => {
      // Find where this window sits in the stack
      const stackIndex = zStack.value.indexOf(win.id)

      // If found, assign zIndex. If not (error case), keep it low.
      if (stackIndex !== -1) {
        win.zIndex = BASE_Z_INDEX + stackIndex
      }
    })
  }

  function bringToFront(windowId) {
    const stackIndex = zStack.value.indexOf(windowId)
    if (stackIndex === -1) return // Should not happen

    zStack.value.splice(stackIndex, 1)

    zStack.value.push(windowId)

    refreshZIndices()
  }

  function handleSimulationReady(data) {
    simulationEntries.value[data.resourceId] = { ready: data.ready, entryId: data.entryId }
  }

  function runExperimentalData(data) {
    if (!data.resource || !simulationEntries.value[data.resource]?.ready) return false
    EventBus.emit('simulation-experimental-data', {
      targetEntryId: simulationEntries.value[data.resource].entryId,
      action: data,
    })
    return true
  }


  function requestSimulation(data) {
    if (data.protocol === null || !simulationEntries.value[data.protocol?.resource]?.ready) return

    let targetWindow = windows.value.find(win => win.id === data.windowId)
    if (!targetWindow) {
      targetWindow = {
        label: data.label,
        id: data.windowId,
        ownerId: data.ownerId,
        data: null,
        zIndex: BASE_Z_INDEX,
        x: data.position.x + data.offset.left,
        y: data.position.y + data.offset.top,
      }
      windows.value.push(targetWindow)
      zStack.value.push(targetWindow.id)
      refreshZIndices()
    } else {
      bringToFront(targetWindow.id)
    }

    EventBus.emit('simulation-data-request', {
      id: 'nz.ac.auckland.simulation-data-request',
      version: '0.1.0',
      payload: data,
    })
  }

  function handleSimulationResponse(response) {
    if (response.id !== 'nz.ac.auckland.simulation-data-response') return
    const targetWindow = windows.value.find(win => win.id === response.payload.windowId)

    if (targetWindow) {
      targetWindow.data = response.payload.data
    } else {
      console.warn('Received simulation response for unknown window ID:', response.payload.windowId)
    }
  }

  return {
    windows,
    bringToFront,
    cleanupListeners,
    handleSimulationResponse,
    requestSimulation,
    runExperimentalData,
    initListeners,
    removeWindow,
  }
})
