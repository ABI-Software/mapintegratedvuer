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
          :label="getEntryTitle(entry)"
          :value="entry.id"
        />
      </el-select>
      <div v-else class="toolbar-title">
        {{ getEntryTitle(entry) }}
      </div>
    </div>
    <el-row class="icon-group">
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
      <el-popover class="tooltip" content="Close and remove" placement="bottom-end" :show-after="helpDelay"
        :teleported=false trigger="hover" popper-class="header-popper" >
        <template #reference>
          <map-svg-icon icon="close" class="header-icon"
            v-show="(activeView !== 'singlepanel') && (entry.mode !== 'main')"
            @click="closeAndRemove()"/>
          </template>
      </el-popover>

    </el-row>

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
  InfoFilled as ElIconInfoFilled,
} from '@element-plus/icons-vue'
import {
  ElInput as Input,
  ElOption as Option,
  ElPopover as Popover,
  ElRow as Row,
  ElSelect as Select,
} from "element-plus";

export default {
  name: "ContentBar",
  components: {
    ElIconArrowDown,
    ElIconArrowUp,
    ElIconInfoFilled,
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
    }
  },
  computed: {
    ...mapStores(useEntriesStore, useSettingsStore, useSplitFlowStore),
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
        NL_LINK_PREFIX: this.settingsStore.nlLinkPrefix,
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
      return this.entriesStore.entries;
    },
  },
  methods: {
    closeAndRemove: function() {
      this.splitFlowStore.closeSlot({ id: this.entry.id, entries: this.entries});
      EventBus.emit("RemoveEntryRequest", this.entry.id);
    },
    getEntryTitle: function(entry) {
      if (entry) {
        let title = entry.label ? entry.label + " ": '';
        let type = entry.type;
        if (type == "Scaffold")
          type = "3D Scaffold";
        title += type;
        if (entry.datasetId)
          title += " (" + entry.datasetId + ")";
        else if (entry.discoverId)
          title += " (" + entry.discoverId + ")";
        return title;
      }
      return "Viewer";
    },
    viewerChanged: function(value) {
      if (this.entry.id && this.entry.id != value) {
        this.splitFlowStore.assignOrSwapPaneWithIds({
          source: this.entry.id,
          target: value
        });
        this.$nextTick(() => {
          EventBus.emit('connectivity-info-close');
          setTimeout(() => {
            this.$emit("chooser-changed");
          }, 1200);
        });
        //this.contextCardVisible = false; // Hide all context cards when switching viewers
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


.toolbar-title {
  width: 160px;
  height: 20px;
  color: $app-primary-color;
  font-size: 14px;
  font-weight: normal;
  line-height: 20px;
  margin-left: 1rem;
  margin-top: 4px;
}

.toolbar-flex-container {
  display:flex;
  flex-direction: row;
  .select-box {
    max-width: 300px;
    z-index: 5;
    :deep(.el-select__wrapper) {
      color: $app-primary-color;
      height: 29px;
      min-height: 29px;
      line-height: 29px;
      font-weight: 500;
      margin-top: 1px;
      margin-left: 8px;
      padding-left: 8px;
      padding-right: 8px;
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

.hide{
  color: $app-primary-color;
  cursor: pointer;
  margin-right: 6px;
  margin-top: 8px;
}

.icon-group {
  position: relative;
  top: auto;
  font-size: 12px;
  align-items: center;

  :deep(.el-tooltip__trigger) {
    height: 100%;
    display: flex;
    align-items: center;
  }

  .hide {
    margin-top: 0;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 4px;
  }
}

.info-icon {
  margin-top: 2px;
  margin-right: 8px;
  font-size: 28px;
  color: $app-primary-color;
  cursor: pointer;
  &::before { // since the icon is a font, we need to adjust the vertical alignment
    position: relative;
    top: -2px;
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
