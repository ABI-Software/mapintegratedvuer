<template>
  <div>
    <div class="toolbar-flex-container">
      <el-select
        ref="contentSelect"
        :teleported="false"
        :model-value="entry.id"
        placeholder="Select"
        class="select-box"
        popper-class="viewer_dropdown"
        @change="viewerChanged($event)"
      >
        <el-option
          v-for="entry in entries"
          :key="entry.id"
          :label="getTitle(entry)"
          :value="entry.id"
        >
          <span class="option-label">
            <span class="option-title">{{ getTitle(entry) }}</span>
            <span
              v-if="hasSourceInfo(entry)"
              class="source-chip"
              @click.stop="openSourceInfo(entry)"
            >
              {{ getSourceTitle(entry) }}
            </span>
          </span>
        </el-option>
        <el-option
          v-for="group in openMapGroups"
          :key="group.label"
          :value="group.label"
          :label="group.label"
          disabled
          class="submenu-parent"
        >
          <el-popover
            placement="right-start"
            trigger="hover"
            :show-after="120"
            :offset="-40"
            popper-class="submenu-flyout"
            ref="openMapPopover"
          >
            <template #default>
              <ul class="submenu-list">
                <li
                  v-for="option in group.options"
                  :key="option.value"
                  class="submenu-item"
                  @click="openMapOption(group, option)"
                >
                  {{ option.label }}
                </li>
              </ul>
            </template>
            <template #reference>
              <span class="submenu-label">
                {{ group.label }}
                <el-icon class="submenu-arrow"><el-icon-arrow-right /></el-icon>
              </span>
            </template>
          </el-popover>
        </el-option>
      </el-select>
      <div class="information-group shrink">
        <el-popover
          placement="bottom"
          :teleported="false"
          trigger="manual"
          :width="setPopperWidth(slot.id)"
          :offset="0"
          popper-class="context-card-popover"
          :popper-options="popperOptions"
          :visible="contextCardVisible"
        >
          <template #default v-if="contextCardEntry">
            <flatmap-context-card
              class="flatmap-context-card"
              v-if="(contextCardEntry.type == 'Flatmap' ||
                contextCardEntry.type == 'MultiFlatmap')"
              :mapImpProv="contextCardEntry.mapImpProv"
            />
            <context-card
              v-if="contextCardEntry.type.toLowerCase() == 'scaffold'"
              :entry="contextCardEntry"
              :envVars="envVars"
              class="context-card"
              @context-ready="contextCardVisible = true"
              @scaffold-view-clicked="$emit('scaffold-view-clicked', $event)"
            />
          </template>
          <template #reference>
            <div v-show="contextCardEntry">
              <div v-show="contextCardVisible" class="information" @click="contextCardVisible = false">
                Hide information
                <el-icon><el-icon-arrow-up /></el-icon>
              </div>
              <div v-show="!contextCardVisible" class="information" @click="contextCardVisible = true">
                Show information
                <el-icon><el-icon-arrow-down /></el-icon>
              </div>
            </div>
          </template>
        </el-popover>
      </div>
      <el-popover class="tooltip" content="Close and remove" placement="bottom-end" :show-after="helpDelay"
        :teleported=false trigger="hover" popper-class="header-popper" >
        <template #reference>
          <map-svg-icon icon="close-no-bk" class="header-icon rightmost"
            v-show="(activeView !== 'singlepanel') && ((entry.mode !== 'main') || allClosable )"
            @click="closeAndRemove()"/>
          </template>
      </el-popover>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-alert, no-console */
import EventBus from './EventBus';
import { MapSvgIcon } from '@abi-software/svg-sprite';
import { mapStores } from 'pinia';
import { useEntriesStore } from '../stores/entries';
import { useSettingsStore } from '../stores/settings';
import { useSplitFlowStore } from '../stores/splitFlow';
import ContextCard from "./ContextCard.vue";
import FlatmapContextCard from './FlatmapContextCard.vue';
import {
  ArrowDown as ElIconArrowDown,
  ArrowUp as ElIconArrowUp,
  ArrowRight as ElIconArrowRight,
} from '@element-plus/icons-vue'
import {
  ElInput as Input,
  ElOption as Option,
  ElPopover as Popover,
  ElRow as Row,
  ElSelect as Select,
} from "element-plus";
import tagging from '../services/tagging';
import { getNewMapEntry, getBodyScaffoldInfo, capitalise } from './scripts/utilities.js';

export default {
  name: "ContentBar",
  components: {
    ElIconArrowDown,
    ElIconArrowUp,
    ElIconArrowRight,
    Input,
    Option,
    Popover,
    Row,
    Select,
    ContextCard,
    FlatmapContextCard,
    MapSvgIcon,
  },
  props: {
    entry: Object,
  },
  data: function() {
    return {
      contextCardVisible: false,
      slot:{

      },
      boundariesElement: null, // this is set @vue:mounted by the parent component via the 'setBoundary' method
      showDetails: true,
      contextCardEntry: undefined,
      titles: [],
      // Base options shown at the bottom of the viewer dropdown. Each group
      // flyouts to its own child options (submenu); clicking a child dispatches
      // to the group's placeholder action method.
      openMapGroups: [
        {
          label: 'Open AC Map',
          action: 'openACMap',
          options: [
            { label: 'Human Female', value: 'Human Female' },
            { label: 'Human Male', value: 'Human Male' },
            { label: 'Rat', value: 'Rat' },
            { label: 'Mouse', value: 'Mouse' },
            { label: 'Pig', value: 'Pig' },
            { label: 'Cat', value: 'Cat' },
          ],
        },
        {
          label: 'Open 3D Map',
          action: 'open3DMap',
          options: [
            { label: 'Human', value: '__open_3d_map_human' },
            { label: 'Rat', value: '__open_3d_map_rat' },
          ],
        },
        {
          label: 'Open FC Map',
          action: 'openFCMap',
          options: [
            { label: 'Functional Connectivity', value: 'Functional Connectivity' },
          ],
        },
      ],
    }
  },
  computed: {
    ...mapStores(useEntriesStore, useSettingsStore, useSplitFlowStore),
    allClosable() {
      return this.settingsStore.allClosable;
    },
    helpDelay() {
      return this.settingsStore.helpDelay;
    },
    activeView: function() {
      return this.splitFlowStore.activeView;
    },
    envVars: function () {
      return {
        API_LOCATION: this.settingsStore.sparcApi,
        ALGOLIA_INDEX: this.settingsStore.algoliaIndex,
        ALGOLIA_KEY: this.settingsStore.algoliaKey,
        ALGOLIA_ID: this.settingsStore.algoliaId,
        PENNSIEVE_API_LOCATION: this.settingsStore.pennsieveApi,
        ROOT_URL: this.settingsStore.rootUrl,
      };
    },
    popperOptions: function() {
      return {
        modifiers: [
          {
            name: 'preventOverflow',
            options: {
              boundary: this.boundariesElement,
            }
          },
          {
            name: 'flip',
            options: {
              boundary: this.boundariesElement,
              flipVariations: false,
              allowedAutoPlacements: ['bottom'],
            }
          },
        ]
      }
    },
    entries: function() {
      this.titles = [];
      return this.entriesStore.entries.map((entry) => {
        const title = this.getEntryTitle(entry);
        this.titles.push({
          id: entry.id,
          title: title,
        });
        return {
          ...entry,
          title: title,
        };
      });
    },
  },
  methods: {
    getSourceTitle: function(entry) {
      if (entry) {
        if (entry.doi) {
          return entry.doi.replace("https://doi.org/", "");
        } else if (entry.connectivityInfo) {
          return "SCKAN";
        }
      }
      return "";
    },
    hasSourceInfo: function(entry) {
      return Boolean(entry && (entry.doi || entry.connectivityInfo));
    },
    openSourceInfo: function(entry) {
      if (entry.doi) {
        const returnedAction = {
          type: "Search",
          term: entry.doi.replace("https://doi.org/", ""),
        };
        EventBus.emit("PopoverActionClick", returnedAction);
      } else if (entry.connectivityInfo) {
        EventBus.emit('connectivity-info-open', [entry.connectivityInfo]);
      }
    },
    // A submenu child option was clicked: run the group's action and close the
    // dropdown so the flyout doesn't linger.
    openMapOption: function(group, option) {
      this[group.action](option);
      const sel = this.$refs.contentSelect;
      if (sel) {
        if (typeof sel.hide === 'function') {
          sel.hide();
        }
        if (typeof sel.blur === 'function') {
          sel.blur();
        }
        if (Object.prototype.hasOwnProperty.call(sel, 'overlayVisible')) {
          try { sel.overlayVisible = false; } catch (e) { /* ignore */ }
        }
      }
      // also hide the submenu popover
      try {
        const idx = this.openMapGroups.indexOf(group);
        const popoverRefs = this.$refs.openMapPopover;
        let pop = null;
        if (Array.isArray(popoverRefs)) {
          pop = popoverRefs[idx];
        } else {
          pop = popoverRefs;
        }
        if (pop && typeof pop.hide === 'function') {
          pop.hide();
        }
      } catch (e) { /* ignore errors */ }
    },
    // Open a AC map for the selected option
    openACMap: async function(option) {
      // Create an AC (MultiFlatmap) entry for the selected species/resource
      const entry = {
        resource: option.value,
        type: "MultiFlatmap",
        mode: "main",
        state: undefined,
        label: "",
        discoverId: undefined,
      };
      EventBus.emit("SetCurrentEntry", entry);
      this.trackOpenMap(`open_AC_map_${option.value}`);
    },
    // Open a 3D map for the selected option
    open3DMap: async function(option) {
      // Infer species from the option value (expecting 'human' or 'rat')
      let species = 'human';
      if (option && option.value && option.value.toLowerCase().includes('rat')) {
        species = 'rat';
      }
      const data = await getBodyScaffoldInfo(this.settingsStore.sparcApi, species);
      const entry = {
        resource: data.url,
        type: 'Scaffold',
        mode: 'main',
        state: undefined,
        label: capitalise(species),
        discoverId: data.datasetInfo ? data.datasetInfo.discoverId : undefined,
        contextCardUrl: data.datasetInfo ? data.datasetInfo.contextCardUrl : undefined,
        s3uri: data.datasetInfo ? data.datasetInfo.s3uri : undefined,
        version: data.datasetInfo ? data.datasetInfo.version : undefined,
        isBodyScaffold: true,
      };
      EventBus.emit('SetCurrentEntry', entry);
      this.trackOpenMap(`open_3D_map_${option.value}`);
    },

    // Open a Functional Connectivity map
    openFCMap: async function(option) {
      const entry = await getNewMapEntry('FC', this.settingsStore.sparcApi);
      EventBus.emit("SetCurrentEntry", entry);
      this.trackOpenMap(`open_FC_map_${option.value}`);
    },
    trackOpenMap: function(category) {
      tagging.sendEvent({
        'event': 'interaction_event',
        'event_name': `portal_maps_toolbar_open_map`,
        'category': category,
        'location': 'map_toolbar'
      });
    },
    closeAndRemove: function() {
      this.splitFlowStore.closeSlot({ id: this.entry.id, entries: this.entries});
      EventBus.emit("RemoveEntryRequest", this.entry.id);
      this.$nextTick(() => {
        this.splitFlowStore.updateSplitPanels();
      });
    },
    getEntryTitle: function(entry) {
      if (entry) {
        let title = entry.label ? entry.label + " ": '';
        let type = entry.type;
        if (type == "Scaffold")
          type = "3D Scaffold";
        title += type;
        if (entry.datasetId)
          title += " - " + entry.datasetId + "";
        else if (entry.discoverId)
          title += " - " + entry.discoverId + "";

        return title;
      }
      return "Viewer";
    },
    getTitle: function(_entry) {
      const {id, title} = _entry;
      const foundTitles = this.titles.filter((t) => t.title === title);

      if (foundTitles.length > 1) {
        const titleList = [];

        for (let i = 0; i < foundTitles.length; i++) {
          const alpha = this.getCharById(i);

          titleList.push({
            id: foundTitles[i].id,
            title: foundTitles[i].title + alpha,
          });
        }

        const titleToReturn = titleList.find(t => t.id === id);
        if (titleToReturn) {
          return titleToReturn.title;
        }
      }

      return title;
    },
    getCharById: function(id) {
      // starts from char 'A'
      const character = ' (' + String.fromCharCode(65 + id) + ')';
      return character;
    },
    viewerChanged: function(value) {
      if (this.entry.id && this.entry.id != value) {
        this.splitFlowStore.assignOrSwapPaneWithIds({
          source: this.entry.id,
          target: value
        });
        this.$nextTick(() => {
          setTimeout(() => {
            this.$emit("chooser-changed");
          }, 1200);
        });
        //this.contextCardVisible = false; // Hide all context cards when switching viewers

        // GA Tracking
        const viewCategory = this.entries.find(entry => entry.id === value);
        tagging.sendEvent({
          'event': 'interaction_event',
          'event_name': `portal_maps_toolbar_viewer_changed`,
          'category': viewCategory?.title || '',
          'location': 'map_toolbar'
        });
      }
    },
    // setPopper with is needed as the flatmap context card does not have an image and has smaller with
    setPopperWidth: function(slotId) {
      let entry = this.entries.find(entry => entry.id === slotId);
      if (entry) {
        if (entry.type == "Flatmap" || entry.type == "MultiFlatmap") {
          return "240px";
        } else {
          return "440px";
        }
      }
    },
    // Set the boundaries element for the popper
    setBoundary: function(boundaryElement) {
      this.boundariesElement = boundaryElement;
    },
    setupFlatmapContextCard: function(mapImpProv) {
      // flatmap context update
      this.contextCardVisible = false; // hide the context card when new map loads
      let contextEntry = Object.assign({mapImpProv: mapImpProv.prov}, this.entry);
      this.contextCardEntry = contextEntry;
    },
    setupScaffoldContextCard: function(){
      // scaffold context update
      if (this.entry.contextCardUrl) {
        this.contextCardEntry = { ...this.entry};
      }
    }
  },
  mounted: function() {
    this.setupScaffoldContextCard();
  }
};
</script>


<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@use "../assets/header-icon.scss";


.toolbar-flex-container {
  display:flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: nowrap;
  width: 100%;

  .shrink {
    flex-shrink: 1;
    min-width: 0;
  }

  .information-group {
    margin-left: auto;
    margin-right: 12px;
    height: 100%;
    position: relative;
  }

  .toolbar-title {
    max-width: 160px;
    height: 20px;
    color: $app-primary-color;
    font-size: 14px;
    font-weight: normal;
    line-height: 20px;
    margin-left: 1rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .select-box {
    width: fit-content;
    max-width: 200px;
    min-width: 0;
    z-index: 5;
    flex-shrink: 1;

    :deep(.el-select__wrapper) {
      color: $app-primary-color;
      height: 29px;
      min-height: 29px;
      line-height: 29px;
      font-weight: 500;
      margin-top: 1px;
      margin-left: 8px;
      padding-left: 8px;
      padding-right: 2px;
      box-shadow: none !important;
      background: transparent;
      span {
        color: $app-primary-color;
      }
    }

    :deep(.el-select__placeholder) {
      width: fit-content;
      position: relative;
      top: auto;
      transform: none;
      min-width: 80px;
    }

    :deep(.el-select__caret) {
      color: $app-primary-color;
    }

    :deep(.el-input__icon) {
      line-height: 24px;
      color: $lightGrey;
    }
  }
  i .select-box :deep(.el-input__icon) {
    color: rgb(48, 49, 51);
    height: 24px;
    padding-left: 8px;
    padding-right: 8px;
  }
  .text {
    margin-left: 8px;
    margin-top: 7px;
    font-weight: 500;
    -moz-user-select: none;
    -webkit-user-select: none;
    -ms-user-select: none;
    user-select: none;
    line-height:18px;
  }
  .title {
    width: 140px;
    color: $app-primary-color;
  }

  :deep(.info-icon) {
    margin-top: 6px;
    font-size: 20px;
    color: $app-primary-color;
    &:hover {
      cursor: pointer;
    }
  }

  .option-label {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    width: 100%;

    .option-title {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .source-chip {
    flex-shrink: 0;
    margin-left: auto;
    padding: 1px 6px;
    border-radius: 8px;
    background-color: $app-primary-color;
    color: #fff;
    font-size: 10px;
    line-height: 14px;
    white-space: nowrap;
    cursor: pointer;
    &:hover {
      background-color: #ac76c5;
    }
  }

  :deep(.el-tooltip__trigger) {
    height: 100%;
    display: flex;
    align-items: center;
  }

  .rightmost {
    flex-shrink: 0;
  }

  .information {
    font-size: 12px;
    margin-top: 0;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 4px;
    color: $app-primary-color;
    cursor: pointer;
    line-height: normal;
  }

}

.viewer_dropdown {
  z-index: 5;
  .el-select-dropdown__item {
    white-space: nowrap;
    text-align: left;
    &.is-selected  {
      color: $app-primary-color;
      font-weight: normal;
    }
  }

  // Base "Open ... Map" options: disabled so they can't be selected, but they
  // still receive hover events to reveal their flyout submenu.
  .el-select-dropdown__item.submenu-parent {
    margin-top: 4px;
    border-top: 1px solid #e4e7ed;
    padding: 0;
    cursor: pointer;
    font-family: $font-family;
    font-size: 14px;
    &.is-disabled {
      cursor: pointer;
      color: inherit;
    }
    &:hover {
      background-color: var(--el-fill-color-light);
    }
    .el-tooltip__trigger {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      height: 100%;
      padding: 0 20px;
    }
    .submenu-label {
      color: var(--el-text-color-regular);
      font-weight: normal;
      font-family: $font-family;
      cursor: pointer;
    }
    .submenu-arrow {
      font-size: 12px;
      color: $app-primary-color;
    }
  }
}

.flatmap-context-card {
  width: 240px;
}

.context-card {
  width: 440px;
}

:deep(.header-popper.el-popover.el-popper) {
  padding: 6px 4px;
  font-size:12px;
  color: rgb(48, 49, 51);
  background-color: #f3ecf6;
  border: 1px solid $app-primary-color;
  white-space: nowrap;
  min-width: unset;
  .el-popper__arrow {
    &:before {
      border-color: $app-primary-color;
      background-color: #f3ecf6;
    }
  }
}

:deep(.context-card-popover.el-popover.el-popper) {
  max-width: calc(100vw - 100px);
  padding: 0px;
  width: unset!important;
  background: #fff!important;
}

</style>

<!-- Non-scoped: the submenu flyout is teleported to <body>, outside this
     component's scoped DOM, so its styles must be global. -->
<style lang="scss">
.submenu-flyout.el-popover.el-popper {
  padding: 4px 0;
  min-width: 140px;

  .submenu-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .submenu-item {
    padding: 6px 16px;
    font-size: 14px;
    line-height: 20px;
    white-space: nowrap;
    cursor: pointer;
    font-family: $font-family;
    font-weight: normal;
    &:hover {
      background-color: var(--el-fill-color-light);
    }
  }
}
</style>
