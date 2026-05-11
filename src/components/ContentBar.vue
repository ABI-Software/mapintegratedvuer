<template>
  <div>
    <div class="toolbar-flex-container">
      <el-select
        v-if="entries.length > 1"
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
        />
      </el-select>
      <div v-else class="toolbar-title shrink">
        {{ getEntryTitle(entry) }}
      </div>
      <el-button
        v-if="hasSourceInfo"
        round
        size="small"
        class="source-chip shrink"
        @click="openSourceInfo"
      >
        {{ getSourceTitle }}
      </el-button>
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
              <div v-show="contextCardVisible" class="hide" @click="contextCardVisible = false">
                Hide information
                <el-icon><el-icon-arrow-up /></el-icon>
              </div>
              <div v-show="!contextCardVisible" class="hide" @click="contextCardVisible = true">
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
} from '@element-plus/icons-vue'
import {
  ElInput as Input,
  ElOption as Option,
  ElPopover as Popover,
  ElRow as Row,
  ElSelect as Select,
} from "element-plus";
import tagging from '../services/tagging';

export default {
  name: "ContentBar",
  components: {
    ElIconArrowDown,
    ElIconArrowUp,
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
    }
  },
  computed: {
    ...mapStores(useEntriesStore, useSettingsStore, useSplitFlowStore),
    allClosable() {
      return this.settingsStore.allClosable;
    },
    getSourceTitle: function() {
      if (this.entry) {
        if (this.entry.doi) {
          return this.entry.doi.replace("https://doi.org/", "");
        } else if (this.entry.connectivityInfo) {
          return "SCKAN";
        }
      }
    },
    hasSourceInfo() {
      return this.entry.doi || this.entry.connectivityInfo;
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
    openSourceInfo: function() {
      if (this.entry.doi) {
        const returnedAction = {
          type: "Search",
          term: this.entry.doi.replace("https://doi.org/", ""),
        };
        EventBus.emit("PopoverActionClick", returnedAction);
      } else if (this.entry.connectivityInfo) {
        EventBus.emit('connectivity-info-open', [this.entry.connectivityInfo]);
      }
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
    overflow:hidden;
  }

  .information-group {
    margin-left: auto;
  }

  .toolbar-title {
    max-width: 160px;
    height: 20px;
    color: $app-primary-color;
    font-size: 14px;
    font-weight: normal;
    line-height: 20px;
    margin-left: 1rem;
    margin-top: 6px;
  }

  .select-box {
    max-width: 200px;
    z-index: 5;
    flex-shrink: 1;
    min-width: 0;
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

  .source-chip {
    padding: 4px;
    margin-left: 2px;
    margin-right:2px;
    background-color: $app-primary-color;
    border-color: $app-primary-color;
    color: #fff;
    font-size: 11px;
    &:hover {
      color: #fff !important;
      background-color: #ac76c5 !important;
      border: 1px solid #ac76c5 !important;
    }
    span {
      text-overflow: ellipsis;
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

  .hide {
    font-size: 12px;
    margin-top: 0;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 4px;
    color: $app-primary-color;
    cursor: pointer;
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
