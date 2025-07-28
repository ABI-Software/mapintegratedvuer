import { defineStore } from 'pinia';
import {
  getAvailableTermsForSpecies,
} from "../components/SimulatedData.js";
import EventBus from '../components/EventBus.js';

/* eslint-disable no-alert, no-console */
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
        "pane-4": {content: true,  id: 4},
      }
    case "5panel":
      return {
        "split-1": {content: false, horizontal: true, children: ["split-3", "split-2"]},
        "split-2": {content: false, horizontal: false, children: ["pane-2", "pane-3"]},
        "split-3": {content: false, horizontal: false, children: ["pane-1","pane-4", "pane-5"]},
        "pane-1": {content: true,  id: 1},
        "pane-2": {content: true,  id: 2},
        "pane-3": {content: true,  id: 3},
        "pane-4": {content: true,  id: 4},
        "pane-5": {content: true,  id: 5},
      }
    case "6panel":
      return {
        "split-1": {content: false, horizontal: true, children: ["split-3", "split-2"]},
        "split-2": {content: false, horizontal: false, children: ["pane-2", "pane-3", "pane-5"]},
        "split-3": {content: false, horizontal: false, children: ["pane-1","pane-4", "pane-6"]},
        "pane-1": {content: true,  id: 1},
        "pane-2": {content: true,  id: 2},
        "pane-3": {content: true,  id: 3},
        "pane-4": {content: true,  id: 4},
        "pane-5": {content: true,  id: 5},
        "pane-6": {content: true,  id: 6},
      }
    case "6panelVertical":
      return {
        "split-1": {content: false, horizontal: false, children: ["split-3", "split-2"]},
        "split-2": {content: false, horizontal: true, children: ["pane-2", "pane-3", "pane-5"]},
        "split-3": {content: false, horizontal: true, children: ["pane-1","pane-4", "pane-6"]},
        "pane-1": {content: true,  id: 1},
        "pane-2": {content: true,  id: 2},
        "pane-3": {content: true,  id: 3},
        "pane-4": {content: true,  id: 4},
        "pane-5": {content: true,  id: 5},
        "pane-6": {content: true,  id: 6},
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
      if ((1 > value.id) || assignedIds.includes(value.id)) {
        //id has got an assigned pane or pane contains an invalid id,
        //cache it and find one later 
        invalidIdKeys.push(key);
      } else {
        assignedIds.push(value.id);
      }
    }
  }

  invalidIdKeys.forEach((key) => {
    let done = false;
    for (let i = 0; i < entries.length && !done; i++) {
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

const getOriginalState = () => {
  return {
    activeView: "singlepanel",
    idNamePair: {},
    viewIcons: [
      { icon: "singlepanel", name: "Single view", min: 1 },
      { icon: "2horpanel", name: "Horizontal split", min: 2 },
      { icon: "2vertpanel", name: "Vertical split", min: 2 },
      { icon: "3panel", name: "Three panes", min: 3 },
      { icon: "4panel", name: "Four panes", min: 4 },
      { icon: "5panel", name: "Five panes", min: 5 },
      { icon: "6panel", name: "Six (horizontal)", min: 6 },
      { icon: "6panelVertical", name: "Six (vertical)", min: 6 },
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
  };
}

export const useSplitFlowStore = defineStore('splitFlow', {
  state: () => {
    return getOriginalState();
  },
  getters: {
    getPaneNameById: (state) => (id) => {
      return findKeyWithId(state.customLayout, id);
    },
    getState: (state) => () => {
      return {
        activeView: state.activeView,
        splitters: state.splitters,
        customLayout: state.customLayout,
      };
    },
    isPaneActive: (state) => (panelName) => {
      const layout = presetLayouts(state.activeView);
      return (Object.keys(layout).includes(panelName));
    },
  },
  actions: {
    assignOrSwapPaneWithIds(payload) {
      let sourceKey = findKeyWithId(this.customLayout, payload.source);
      let targetKey = findKeyWithId(this.customLayout, payload.target);
      if (targetKey) {
        this.customLayout[targetKey].id = payload.source;
      }
      if (sourceKey) {
        this.customLayout[sourceKey].id = payload.target;
      }
      this.updateSplitPanels();
    },
    getAvailableTerms(apiLocation) {
      let terms = getAvailableTermsForSpecies();
      for (let i = 0; i < terms.length; i++) {
        this.idNamePair[terms[i].id] = terms[i].name;
      }
      if (apiLocation) {
        if (this._controller) this._controller.abort();
        this._controller = new AbortController();
        let signal = this._controller.signal;
        fetch(`${apiLocation}get-organ-curies`, {
          signal,
        })
          .then(response => response.json())
          .then(data => {
            this._controller = undefined;
            data.uberon.array.forEach(pair => {
              this.idNamePair[pair.id.toUpperCase()] =
                pair.name.charAt(0).toUpperCase() + pair.name.slice(1);
            });
            return;
          });
      }
    },
    updateActiveView(payload) {
      this.activeView = payload.view;
      const customLayout = newLayoutWithOrigInfo(
        this.customLayout, this.activeView);
      autoAssignEntryIdsToPane(payload.entries, customLayout);
      for (const [key, value] of Object.entries(customLayout)) {
        this.customLayout[key] = value;
      }
      this.updateSplitPanels();
    },
    setSplitter(payload) {
      if (this.splitters[payload.name])
        this.splitters[payload.name] = payload.value;
    },
    setState(newState) {
      if (newState) {
        let customLayout = undefined;
        if (newState.activeView) {
          this.activeView = newState.activeView;
        }
        if (newState.customLayout) {
          customLayout = newState.customLayout;
        } else {
          customLayout = presetLayouts(this.activeView);
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
                case "fifth": {
                  if("pane-5" in customLayout)
                    customLayout["pane-5"].id = newState.slotInfo[i].id;
                } break;
                case "sixth": {
                  if("pane-6" in customLayout)
                    customLayout["pane-6"].id = newState.slotInfo[i].id;
                } break;
                default:
                  break;
              }
            }
          }
        }
        for (const [key, value] of Object.entries(customLayout)) {
          this.customLayout[key] = value;
        }
        for (const [key, value] of Object.entries(newState.splitters)) {
          this.splitters[key] = value;
        }
      }
    },
    setIdToPrimaryPane(id) {
      const currentKey = findKeyWithId(this.customLayout, id);
      const firstPaneId = this.customLayout["pane-1"].id;
      this.customLayout["pane-1"].id = id;
      if (currentKey) {
        this.customLayout[currentKey].id = firstPaneId;
      }
    },
    reset() {
      const original = getOriginalState();
      this.activeView = original.activeView;
      this.customLayout = original.customLayout;
      this.splitters = original.splitters;
    },
    closeSlot(payload) {
      if (payload) {
        let availableId = 0;
        if (payload.entries) {
          for (let i = 0; i < payload.entries.length &&
            availableId == 0; i++) {
            //Find the first entry not currently in use
            if ((payload.entries[i].id !== payload.id) &&
              findKeyWithId(this.customLayout, payload.entries[i].id) === undefined) {
              availableId = payload.entries[i].id;
            }
          }
        }
        //Switch the view
        if (this.activeView !== "customise") {
          //closePaneWithStandardLayout
          const pView = this.activeView;
          switch (this.activeView) {
            case "2horpanel":
            case "2vertpanel":
              this.activeView = "singlepanel";
              break;
            case "3panel":
              this.activeView = "2vertpanel";
              break;
            case "4panel":
              this.activeView = "3panel";
              break;
            case "5panel":
              this.activeView = "4panel";
              break;
            case "6panelVertical":
            case "6panel":
              this.activeView = "5panel";
              break;
            default:
              break;
          }
          const customLayout = newLayoutWithOrigInfo(
            this.customLayout, this.activeView);
          const key = findKeyWithId(this.customLayout, payload.id);
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
                case "5panel": {
                  customLayout["pane-1"].id = customLayout["pane-2"].id;
                  customLayout["pane-2"].id = customLayout["pane-3"].id;
                  customLayout["pane-3"].id = customLayout["pane-4"].id;
                  customLayout["pane-4"].id = customLayout["pane-5"].id;
                  customLayout["pane-5"].id = availableId;
                } break;
                case "6panelVertical":
                case "6panel":
                {
                  customLayout["pane-1"].id = customLayout["pane-2"].id;
                  customLayout["pane-2"].id = customLayout["pane-3"].id;
                  customLayout["pane-3"].id = customLayout["pane-4"].id;
                  customLayout["pane-4"].id = customLayout["pane-5"].id;
                  customLayout["pane-5"].id = customLayout["pane-6"].id;
                  customLayout["pane-6"].id = availableId;
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
                case "5panel": {
                  customLayout["pane-2"].id = customLayout["pane-3"].id;
                  customLayout["pane-3"].id = customLayout["pane-4"].id;
                  customLayout["pane-4"].id = customLayout["pane-5"].id;
                  customLayout["pane-5"].id = availableId;
                } break;
                case "6panelVertical":
                case "6panel":
                {
                  customLayout["pane-2"].id = customLayout["pane-3"].id;
                  customLayout["pane-3"].id = customLayout["pane-4"].id;
                  customLayout["pane-4"].id = customLayout["pane-5"].id;
                  customLayout["pane-5"].id = customLayout["pane-6"].id;
                  customLayout["pane-6"].id = availableId;
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
                case "5panel": {
                  customLayout["pane-3"].id = customLayout["pane-4"].id;
                  customLayout["pane-4"].id = customLayout["pane-5"].id;
                  customLayout["pane-5"].id = availableId;
                } break;
                case "6panelVertical":
                case "6panel":
                {
                  customLayout["pane-3"].id = customLayout["pane-4"].id;
                  customLayout["pane-4"].id = customLayout["pane-5"].id;
                  customLayout["pane-5"].id = customLayout["pane-6"].id;
                  customLayout["pane-6"].id = availableId;
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
                case "5panel": {
                  customLayout["pane-4"].id = customLayout["pane-5"].id;
                  customLayout["pane-5"].id = availableId;
                } break;
                case "6panelVertical":
                case "6panel": {
                  customLayout["pane-4"].id = customLayout["pane-5"].id;
                  customLayout["pane-5"].id = customLayout["pane-6"].id;
                  customLayout["pane-6"].id = availableId;
                } break;
                default:
                  break;
              }
            } break;
            case "pane-5": {
              switch (pView) {
                case "5panel": {
                  customLayout["pane-5"].id = availableId;
                } break;
                case "6panelVertical":
                case "6panel": {
                  customLayout["pane-5"].id = customLayout["pane-6"].id;
                  customLayout["pane-6"].id = availableId;
                } break;
                default:
                  break;
              }
            } break;
            case "pane-6" : {
              switch (pView) {
                case "6panelVertical":
                case "6panel":
                {
                  customLayout["pane-6"].id = availableId;
                } break;
                default:
                  break;
              }
            } break;
            default:
              break;
          }
          for (const [key, value] of Object.entries(customLayout)) {
            this.customLayout[key] = value;
          }
        }
      }
    },
    updateSplitPanels() {
      EventBus.emit('species-layout-connectivity-update');
    },
  }
});
