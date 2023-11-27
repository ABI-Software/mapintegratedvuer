/* eslint-disable no-alert, no-console */
import Vue from "vue";

const presetLayouts = (view) => {
  switch (view) {
    case "2horpanel":
      return {
        "split-1": {content: false, horizontal: true, children: ["pane-1", "pane-2"]},
        "pane-1": {content: true,  id: 1},
        "pane-2": {content: true,  id: 2},
      };
    case "2vertpanel": 
      return {
        "split-1": {content: false, horizontal: false, children: ["pane-1", "pane-2"]},
        "pane-1": {content: true,  id: 1},
        "pane-2": {content: true,  id: 2},
      }
    case "3panel": 
      return {
        "split-1": {content: false, horizontal: false, children: ["pane-1", "split-2"]},
        "split-2": {content: false, horizontal: true, children: ["pane-2", "pane-3"]},
        "pane-1": {content: true,  id: 1},
        "pane-2": {content: true,  id: 2},
        "pane-3": {content: true,  id: 3},
      }
    case "4panel": 
      return {
        "split-1": {content: false, horizontal: false, children: ["split-3", "split-2"]},
        "split-2": {content: false, horizontal: true, children: ["pane-2", "pane-3"]},
        "split-3": {content: false, horizontal: true, children: ["pane-1", "pane-4"]},
        "pane-1": {content: true,  id: 1},
        "pane-2": {content: true,  id: 2},
        "pane-3": {content: true,  id: 3},
        "pane-4": {content: true,  id: 3},
      }
    case "singlepanel":
    default:
      return {
        "split-1": {content: false, horizontal: false, children: ["pane-1"]},
        "pane-1": {content: true,  id: 1},
    }
  }
}

//A method to assign unused entry to pane with duplicated id
const autoAssignEntryIdsToPane = (entries, layout) => {
  const assignedIds  = [];
  const invalidIdKeys = [];
  for (const [key, value] of Object.entries(layout)) {
    if (value.content) {
      if (assignedIds.includes(value.id)) {
        //id has got an assigned pane, cache it and find one
        //later
        invalidIdKeys.push(key);
      } else {
        assignedIds.push(value.id);
      }
    }
  }
  invalidIdKeys.forEach((key) => {
    let done = false;
    for (let i = 0; i < entries.length || !done; i++) {
      if (!(assignedIds.includes(entries[i].id))) {
        layout[key].id = entries[i].id;
        assignedIds.push(entries.id);
        done = true;
      }
    }
  });
}

const extractPaneInfo = (layout) => {
  const panes = {};
  for (const [key, value] of Object.entries(layout)) {
    if (value.content) {
      panes[key] = value;
    }
  }
  return panes;
}

const newLayoutWithOrigInfo = (original, activeView) => {
  const panes = extractPaneInfo(original);
  const customLayout = presetLayouts(activeView);
  for (const [key, value] of Object.entries(panes)) {
    customLayout[key] = value;
  }
  return customLayout;
}

const findKeyWithId = (layout, id) => {
  return Object.keys(layout).find(key => layout[key]["id"] === id);
}

const state = () => ({
  activeView: "singlepanel",
  viewIcons: [
    { icon: "singlepanel", name: "Single view", min: 1 },
    { icon: "2horpanel", name: "Horizontal split", min: 2 },
    { icon: "2vertpanel", name: "Vertical split", min: 2 },
    { icon: "3panel", name: "Three panes", min: 3 },
    { icon: "4panel", name: "Four panes", min: 4 },
    //{ icon: "customise", name: "Customise", min: 2 }
  ],
  customLayout: {
    "split-1": {content: false, horizontal: false, children: ["pane-1"]},
    "pane-1": {content: true,  id: 1},
    /*
    Example layout

    "split-1": {content: false, horizontal: true, children: ["split-2", "pane-1"]},
    "split-2": {content: false, horizontal: false, children: ["pane-2", "pane-3"]},
    "pane-1": {content: true,  id: 1},
    "pane-2": {content: true,  id: 2},
    "pane-3": {content: true,  id: 3},
    */
  },
  splitters: { "first": 50, "second": 50, "third": 50 },
  globalCallback: false,
  syncMode: false,
});

const getters = {
  getPaneNameById: (state) => (id) => {
    return findKeyWithId(state.customLayout, id);
  },
  getState: (state) => () => {
    return {
      activeView: state.activeView,
      splitters: state.splitters,
      globalCallback: state.globalCallback,
      customLayout: state.customLayout,
      syncMode: state.syncMode,
    };
  },
}

const mutations = {
  assignOrSwapPaneWithIds(state, payload) {
    let sourceKey = findKeyWithId(state.customLayout, payload.source);
    let targetKey = findKeyWithId(state.customLayout, payload.target);
    // Check if it is on syncMode
    if (state.syncMode && (!(targetKey || sourceKey))) {
      //exit syncMod if the two panel in sync mode are not swapping
      state.syncMode = false;
      state.globalCallback = false;
    }
    if (targetKey) {
      state.customLayout[targetKey].id = payload.source;
    }
    if (sourceKey) {
      state.customLayout[sourceKey].id = payload.target;
    }
  },
  toggleGlobalCallback(state, flag) {
    state.globalCallback = flag;
  },
  updateActiveView(state, payload) {
    //Deactivate sync mode if current or future view
    //is not in 2 split panels/
    if (state.syncMode) {
      const view1 = state.viewIcons.find(
        view => state.activeView === view.icon);
      const view2 = state.viewIcons.find(
        view => payload.view === view.icon);
      if (!(view1.min == 2 && view2.min == 2)) {
        state.syncMode = false;
        state.globalCallback = false;
      }
    }
    state.activeView = payload.view;
    const customLayout = newLayoutWithOrigInfo(
      state.customLayout, state.activeView);
    autoAssignEntryIdsToPane(payload.entries, customLayout);
    for (const [key, value] of Object.entries(customLayout)) {
      Vue.set(state.customLayout, key, value);
    }
  },
  setSplitter(state, payload) {
    if (state.splitters[payload.name])
      state.splitters[payload.name] = payload.value;
  },
  setState(state, newState) {
    if (newState) {
      let customLayout = undefined;
      if (newState.activeView) {
        state.activeView = newState.activeView;
      }
      if (newState.customLayout) {
        customLayout = newState.customLayout;
      } else {
        customLayout = presetLayouts(state.activeView);
        console.log(newState, customLayout)
        if (newState.slotInfo) {
          for (let i = 0; i < newState.slotInfo.length; i++) {
            switch (newState.slotInfo[i].name) {
              case "first": {
                customLayout["pane-1"].id = newState.slotInfo[i].id;
              } break;
              case "second": {
                if("pane-2" in customLayout)
                  customLayout["pane-2"].id = newState.slotInfo[i].id;
              } break;
              case "thrid": {
                if("pane-3" in customLayout)
                  customLayout["pane-3"].id = newState.slotInfo[i].id;
              } break;
              case "fourth": {
                if("pane-4" in customLayout)
                  customLayout["pane-4"].id = newState.slotInfo[i].id;
              } break;
              default:
                break;
            }
          }
        }
      }
      for (const [key, value] of Object.entries(customLayout)) {
        Vue.set(state.customLayout, key, value);
      }
      if (newState.globalCallback) {
        state.globalCallback = newState.globalCallback;
      }
      for (const [key, value] of Object.entries(newState.splitters)) {
        state.splitters[key] = value;
      }
      if (newState.syncMode) {
        state.syncMode = newState.syncMode;
      }
    }
  },
  setIdToPrimaryPane(state, id) {
    const currentKey = findKeyWithId(state.customLayout, id);
    const firstPaneId = state.customLayout["pane-1"].id;
    state.customLayout["pane-1"].id = id;
    if (currentKey) {
      state.customLayout[currentKey].id = firstPaneId;
    }
  },
  setSyncMode(state, payload) {
    if (payload) {
      //Force the second slot to be the new viewer in payload and change the 
      //view to the payload's layout
      //state.customLayout["pane-2"].id = id;
      if (payload.flag === true) {
        state.activeView = payload.layout;
        //Extract pane info form original state and copy to the new layout
        const customLayout = newLayoutWithOrigInfo(
          state.customLayout, state.activeView);
        const originalKey = findKeyWithId(customLayout, 1);
        const firstPaneId = customLayout["pane-1"].id;
        if (originalKey !== "pane-1") {
          customLayout["pane-1"].id = firstPaneId;
        }
        customLayout["pane-1"].id = 1;
        customLayout["pane-2"].id = payload.newId;
        for (const [key, value] of Object.entries(customLayout)) {
          Vue.set(state.customLayout, key, value);
        }
        state.syncMode = true;
        state.globalCallback = true;
      } else {
        state.activeView = "singlepanel";
        const customLayout = newLayoutWithOrigInfo(
          state.customLayout, state.activeView);
        for (const [key, value] of Object.entries(customLayout)) {
          Vue.set(state.customLayout, key, value);
        }
        state.syncMode = false;
        state.globalCallback = false;
      }
    }
  },
  closeSlot(state, payload) {
    if (payload) {
      state.syncMode = false;
      state.globalCallback = false;
      let availableId = 0;
      //Primary id cannot be changed
      if (payload.id === 1) {
        availableId = 1;
      } else if (payload.entries) {
        for (let i = 0; i < payload.entries.length &&
          availableId == 0; i++) {
          //Find the first entry not currently in use
          if (findKeyWithId(payload.entries[i].id) === undefined) {
            availableId = payload.entries[i].id;
          }
        }
      }
      //Switch the view
      if (state.activeView !== "customise") {
        //closePaneWithStandardLayout
        const pView = state.activeView;
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
        const customLayout = newLayoutWithOrigInfo(
          state.customLayout, state.activeView);
        const key = findKeyWithId(customLayout, payload.id);
      
        // The following move the entry id to the appropriate slot
        // and remove the target id
        switch (key) {
          case "pane-1": {
            switch (pView) {
              case "2horpanel":
              case "2vertpanel": {
                customLayout["pane-1"].id = customLayout["pane-2"].id;
                customLayout["pane-2"].id = availableId;
              } break;
              case "3panel": {
                customLayout["pane-1"].id = customLayout["pane-2"].id;
                customLayout["pane-2"].id = customLayout["pane-3"].id;
                customLayout["pane-3"].id = availableId;
              } break;
              case "4panel": {
                customLayout["pane-1"].id = customLayout["pane-2"].id;
                customLayout["pane-2"].id = customLayout["pane-3"].id;
                customLayout["pane-3"].id = customLayout["pane-4"].id;
                customLayout["pane-4"].id = availableId;
              } break;
              default:
                break;
            }
          } break;
          case "pane-2": {
            switch (pView) {
              case "2horpanel":
              case "2vertpanel": {
                customLayout["pane-2"].id = availableId;
              } break;
              case "3panel": {
                customLayout["pane-2"].id = customLayout["pane-3"].id;
                customLayout["pane-3"].id = availableId;
              } break;
              case "4panel": {
                customLayout["pane-2"].id = customLayout["pane-3"].id;
                customLayout["pane-3"].id = customLayout["pane-4"].id;
                customLayout["pane-4"].id = availableId;
              } break;
              default:
                break;
            }
          } break;
          case "pane-3": {
            switch (pView) {
              case "3panel": {
                customLayout["pane-3"].id = availableId;
              } break;
              case "4panel": {
                customLayout["pane-3"].id = customLayout["pane-4"].id;
                customLayout["pane-4"].id = availableId;
              } break;
              default:
                break;
            }
          } break;
          case "pane-4": {
            switch (pView) {
              case "4panel": {
                customLayout["pane-4"].id = availableId;
              } break;
              default:
                break;
            }
          } break;
          default:
            break;
        }
        for (const [key, value] of Object.entries(customLayout)) {
          Vue.set(state.customLayout, key, value);
        }
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
