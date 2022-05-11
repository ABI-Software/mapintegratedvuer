/* eslint-disable no-alert, no-console */

const state = () => ({
  activeView: "singlepanel",
  slotInfo: [
    { name: "first", id: 1, activation: 1 },
    { name: "second", id: 0, activation: 2 },
    { name: "third", id: 0, activation: 3 },
    { name: "fourth", id: 0, activation: 4 }
  ],
  viewIcons: [
    { icon: "singlepanel", name: "Single view", min: 1 },
    { icon: "2horpanel", name: "Horizontal split", min: 2 },
    { icon: "2vertpanel", name: "Vertical split", min: 2 },
    { icon: "3panel", name: "Three panes", min: 3 },
    { icon: "4panel", name: "Four panes", min: 4 }
  ],
  splitters: { "first": 50, "second": 50, "third": 50 },
  globalCallback: false,
  syncMode: false,
});

const getters = {
  getFirstAvailableSlot: (state) => () => {
    return state.slotInfo.find(slot => slot.id === 0);
  },
  getIdbySlotName: (state) => (name) => {
    let slot = state.slotInfo.find(slot => slot.name === name);
    return slot !== undefined ? slot.id : undefined;
  },
  getSlotById: (state) => (id) => {
    let slot = state.slotInfo.find(slot => slot.id === id);
    return slot;
  },
  getSlotByName: (state) => (name) => {
    let slot = state.slotInfo.find(slot => slot.name === name);
    return slot;
  },
  getActiveEntriesId: (state) => () => {
    const ids = [];
    const view = state.viewIcons.find(view => state.activeView === view.icon);
    state.slotInfo.forEach(slot => {
      if (view.min >= slot.activation)
        ids.push(slot.id);
    });
    return ids;
  },
  isSlotActive: (state) => (slot) => {
    if (slot) {
      let view = state.viewIcons.find(view => state.activeView === view.icon);
      return (view.min >= slot.activation);
    }
    return false;
  },
  isEntryActive: (state) => (entry) => {
    let slot = state.slotInfo.find(slot => slot.id === entry.id);
    if (slot) {
      let view = state.viewIcons.find(view => state.activeView === view.icon);
      return (view.min >= slot.activation);
    }
    return false;
  },
  getState: (state) => () => {
    return {
      activeView: state.activeView, slotInfo: state.slotInfo,
      splitters: state.splitters,
      globalCallback: state.globalCallback,
      syncMode: state.syncMode,
    };
  },
}

const mutations = {
  assignIdToSlot(state, payload) {
    state.slotInfo.find(
      slotInfo => slotInfo.name === payload.slot.name).id = payload.id;
  },
  assignOrSwapIdToSlot(state, payload) {
    let targetSlot = state.slotInfo.find(slot => slot.id === payload.id);
    // Check if it is on syncMode
    if (state.syncMode) {
      if (targetSlot) {
        //exit syncMod if the two panel in sync mode are not swapping
        if (!((targetSlot.name == "first" && payload.slot.name == "second") ||
          (targetSlot.name == "second" && payload.slot.name == "first"))) {
          state.syncMode = false;
          state.globalCallback = false;
        }
      }
    }
    if (targetSlot)
      targetSlot.id = payload.slot.id;
    payload.slot.id = payload.id;
  },
  changeViewByAvailabilty(state) {
    let count = 0;
    for (let i = 0; i < state.slotInfo.length; i++) {
      if (state.slotInfo[i].id > 0)
        count++;
    }
    let view = state.viewIcons.find(view => view.min === count);
    if (view)
      state.activeView = view.icon;
  },
  toggleGlobalCallback(state, flag) {
    state.globalCallback = flag;
  },
  updateActiveView(state, activeView) {
    if (state.syncMode) {
      const view1 = state.viewIcons.find(
        view => state.activeView === view.icon);
      const view2 = state.viewIcons.find(
        view => activeView === view.icon);
      if (!(view1.min == 2 && view2.min == 2)) {
        state.syncMode = false;
        state.globalCallback = false;
      }
    }
    state.activeView = activeView;
  },
  setSplitter(state, payload) {
    if (state.splitters[payload.name])
      state.splitters[payload.name] = payload.value;
  },
  setState(state, newState) {
    if (newState) {
      if (newState.activeView)
        state.activeView = newState.activeView;
      if (newState.globalCallback)
        state.globalCallback = newState.globalCallback;
      if (newState.syncMode)
        state.syncMode = newState.syncMode;
      for (let i = 0; i < state.slotInfo.length; i++) {
        state.slotInfo[i].id = newState.slotInfo[i].id;
      }
      for (const [key, value] of Object.entries(newState.splitters)) {
        state.splitters[key] = value;
      }
    }
  },
  setIdToPrimarySlot(state, id) {
    let availableSlot = state.slotInfo.find(slot => slot.id === 0);
    let primarySlot = state.slotInfo.find(
      slotInfo => slotInfo.name === "first");
    if (availableSlot) {
      availableSlot.id = primarySlot.id;
    }
    primarySlot.id = id;
  },
  setIdToSlot(state, payload) {
    let availableSlot = state.slotInfo.find(slot => slot.id === 0);
    let slot = state.slotInfo.find(
      slotInfo => slotInfo.name === payload.slotName);
    if (slot) {
      if (availableSlot) {
        availableSlot.id = slot.id;
      }
      slot.id = payload.id;
    }
  },
  setSyncMode(state, payload) {
    if (payload) {
      let secondSlot = state.slotInfo.find(slot => slot.name === "second");
      if (payload.flag === true) {
        let firstSlot = state.slotInfo.find(slot => slot.name === "first");
        let firstSlotId = firstSlot.id;
        let originalSlot = state.slotInfo.find(slot => slot.id === 1);
        secondSlot.id = payload.newId;
        if (originalSlot.name !== "first")
          originalSlot.id = firstSlotId;
        firstSlot.id = 1;
        state.syncMode = true;
        state.activeView = payload.layout;
        state.globalCallback = true;
      } else {
        state.activeView = "singlepanel";
        state.syncMode = false;
        state.globalCallback = false;
      }
    }
  },
  closeSlot(state, payload) {
    if (payload) {
      state.syncMode = false;
      state.globalCallback = false;
      //Find the next available id to fill empty slot
      //Set to 1 if the slot being closed is the primary
      //view
      let availableId = 0;
      if (payload.id === 1) {
        availableId = 1;
      } else if (payload.entries) {
        for (let i = 0; i < payload.entries.length &&
          availableId == 0; i++) {
          if (state.slotInfo.find(slot => slot.id ===
            payload.entries[i].id) === undefined) {
            availableId = payload.entries[i].id;
          }
        }
      }
      let slot = state.slotInfo.find(
        slotInfo => slotInfo.name === payload.slotName);
      let secondSlot = state.slotInfo.find(
        slotInfo => slotInfo.name === "second");
      let thirdSlot = state.slotInfo.find(
        slotInfo => slotInfo.name === "third");
      let fourthSlot = state.slotInfo.find(
        slotInfo => slotInfo.name === "fourth");
      switch (slot.name) {
        case "first": {
          switch (state.activeView) {
            case "2horpanel":
            case "2vertpanel": {
              slot.id = secondSlot.Id;
              secondSlot.id = availableId;
            } break;
            case "3panel": {
              slot.id = secondSlot.Id;
              secondSlot.Id = thirdSlot.id;
              thirdSlot.id = availableId;
            } break;
            case "4panel": {
              slot.id = secondSlot.Id;
              secondSlot.Id = thirdSlot.id;
              thirdSlot.id = fourthSlot.id;
              fourthSlot.id = availableId;
            } break;
            default:
              break;
          }
        } break;
        case "second": {
          switch (state.activeView) {
            case "2horpanel":
            case "2vertpanel": {
              slot.id = availableId;
            } break;
            case "3panel": {
              slot.id = thirdSlot.id;
              thirdSlot.id = fourthSlot.id;
              fourthSlot.id = availableId;
            } break;
            case "4panel": {
              slot.id = thirdSlot.id;
              thirdSlot.id = fourthSlot.id;
              fourthSlot.id = availableId;
            } break;
            default:
              break;
          }
        } break;
        case "third": {
          switch (state.activeView) {
            case "3panel":
            case "4panel": {
              slot.id = fourthSlot.id;
              fourthSlot.id = availableId;
            } break;
            default:
              break;
          }
        } break;
        case "fourth": {
          switch (state.activeView) {
            case "4panel": {
              slot.id = availableId;
            } break;
            default:
              break;
          }
        } break;
        default:
          break;
      }
      switch (state.activeView) {
        case "2horpanel":
        case "2vertpanel":
          state.activeView = "singlepanel";
          break;
        case "3panel":
          state.activeView = "2vertpanel";
          break;
        case "4panel":
          state.activeView = "3panel";
          break;
        default:
          break;
      }
    }
  },
};

export default {
  namespaced: true,
  state,
  getters,
  mutations
}
