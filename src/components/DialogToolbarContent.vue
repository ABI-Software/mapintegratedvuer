<template>
  <div class="header">
    <map-svg-sprite-color />
    <search-controls
      @search="$emit('local-search', {term: $event});"
      @fetch-suggestions="$emit('fetch-suggestions', {data: $event});"
      :failedSearch="failedSearch"
    />

    <el-row class="icon-group">
      <div class="viewing-mode-selector">
        Viewing Mode:
        <el-dropdown
          :teleported="false"
          trigger="hover"
          class="toolbar-dropdown"
          popper-class="toolbar-dropdown-popper"
          :hide-on-click="false"
          :disabled="!mapLoaded"
          placement="bottom-end"
        >
        <span class="el-dropdown-link">
          <el-icon class="el-icon--left" v-if="globalSettings.viewingMode === 'Exploration'">
            <el-icon-compass />
          </el-icon>
          <el-icon class="el-icon--left" v-if="globalSettings.viewingMode === 'Neuron Connection'">
            <el-icon-share />
          </el-icon>
          <el-icon class="el-icon--left" v-if="globalSettings.viewingMode === 'Annotation'">
            <el-icon-edit-pen />
          </el-icon>
          {{ globalSettings.viewingMode }}
          <template v-if="globalSettings.viewingMode === 'Neuron Connection'">
            &nbsp;
            <small class="toolbar-dropdown-badge"><em>{{ globalSettings.connectionType }}</em></small>
          </template>
          <el-icon class="el-icon--right">
            <el-icon-arrow-down />
          </el-icon>
        </span>
        <template #dropdown>
          <h4>Viewing Mode:</h4>
          <el-dropdown-menu>
            <el-dropdown-item v-for="(value, key, index) in viewingModes"
              :key="key"
              @click="updateViewingMode($event, key)"
              :class="{'is-selected': globalSettings.viewingMode === key }"
            >
              <h5>
                <el-icon class="el-icon--left" v-if="key === 'Exploration'">
                  <el-icon-compass />
                </el-icon>
                <el-icon class="el-icon--left" v-if="key === 'Neuron Connection'">
                  <el-icon-share />
                </el-icon>
                <el-icon class="el-icon--left" v-if="key === 'Annotation'">
                  <el-icon-edit-pen />
                </el-icon>
                {{ key }}
              </h5>
              <small class="el-option__description">
                <template v-if="key === 'Annotation'">
                  <template v-if="authorisedUser">
                    {{ value[1] }}
                  </template>
                  <template v-else>
                    {{ value[0] }}
                  </template>
                  <template v-if="offlineAnnotationEnabled">
                    (Anonymous annotate)
                  </template>
                </template>
                <template v-else>
                  {{ value }}
                </template>
              </small>
              <!-- <template v-if="key === 'Exploration'">
                <div class="setting-popover-block" v-if="'displayMarkers' in globalSettings">
                  <el-popover
                    class="tooltip"
                    content="Switch to Exploration mode to enable."
                    :teleported="false"
                    popper-class="header-popper"
                    :offset="4"
                    :disabled="globalSettings.viewingMode === 'Exploration'"
                  >
                    <template #reference>
                      <el-checkbox
                        v-model="globalSettings.displayMarkers"
                        @change="updateGlobalSettings('displayMarkers')"
                        size="small"
                        :disabled="globalSettings.viewingMode !== 'Exploration'"
                      >
                        Display Map Markers
                      </el-checkbox>
                    </template>
                  </el-popover>
                </div>
              </template> -->
              <template v-if="key === 'Neuron Connection'">
                <div class="setting-popover-block" v-if="'connectionType' in globalSettings">
                  <el-radio-group
                    v-model="globalSettings.connectionType"
                    @change="updateGlobalSettings('connectionType')"
                  >
                    <el-radio-button value="Origin" size="small">Origin</el-radio-button>
                    <el-radio-button value="Via" size="small">Via</el-radio-button>
                    <el-radio-button value="Destination" size="small">Destination</el-radio-button>
                    <el-radio-button value="All" size="small">All</el-radio-button>
                  </el-radio-group>
                  <div class="el-radio__description">
                    <small v-if="globalSettings.connectionType === 'Origin'">
                      Neuron populations beginning at a location.
                    </small>
                    <small v-else-if="globalSettings.connectionType === 'Via'">
                      Neuron populations that run through a location.
                    </small>
                    <small v-else-if="globalSettings.connectionType === 'Destination'">
                      Neuron populations terminating at a location.
                    </small>
                    <small v-else>
                      Neuron populations associated with a location.
                    </small>
                  </div>
                </div>
              </template>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
        </el-dropdown>
      </div>

      <el-popover
        v-if="activeViewRef"
        :virtual-ref="activeViewRef"
        ref="viewPopover"
        placement="bottom"
        width="133"
        :teleported=false
        trigger="click"
        popper-class="view-icon-popover"
        virtual-triggering
        >
        <el-row :gutter="20"
          v-for="item in viewIcons"
          :key="item.name"
          :class="[{ 'active': item.icon ==  activeView},
            {'disabled': item.min > numberOfEntries},
            'view-icon-row']"
          @click="viewClicked(item.icon)"
        >
          <el-col :span="4">
            <map-svg-icon :icon="item.icon"
              class="view-icon"/>
          </el-col>
          <el-col :offset="2" :span="18" class="view-text">
            {{item.name}}
          </el-col>
        </el-row>
      </el-popover>
      <el-popover class="tooltip" content="Split screen" placement="bottom-end"
        :show-after="helpDelay" :teleported=false trigger="hover"
        popper-class="header-popper"
      >
        <template #reference>
          <map-svg-icon :icon="activeView"
          ref="activeViewRef"
          :class="[{'disabled': (1 >= numberOfEntries)},
            'header-icon', 'splitscreen-icon']"
          />
        </template>
      </el-popover>

      <el-popover class="tooltip" content="Help" placement="bottom-end" :show-after="helpDelay"
        :teleported=false trigger="hover" popper-class="header-popper" >
        <template #reference>
          <map-svg-icon icon="tooltips" class="header-icon" @click="startHelp()"/>
        </template>
      </el-popover>
      <el-popover class="tooltip"
        content="Fullscreen" placement="bottom-end" :show-after="helpDelay"
        :teleported=false trigger="hover" popper-class="header-popper">
        <template #reference>
          <map-svg-icon v-show="!isFullscreen" icon="fullScreen" class="header-icon" @click="onFullscreen"/>
        </template>
      </el-popover>
      <el-popover class="tooltip"
        content="Exit fullscreen" placement="bottom-end" :show-after="helpDelay"
        :teleported=false trigger="hover" popper-class="header-popper">
        <template #reference>
          <map-svg-icon v-show="isFullscreen" icon="closeFullScreen" class="header-icon"
            @click="onFullscreen"/>
        </template>
      </el-popover>
      <el-popover
        v-if="permalinkRef"
        ref="linkPopover"
        :virtual-ref="permalinkRef"
        placement="bottom-end"
        width="400"
        :teleported=false
        trigger="click"
        popper-class="link-popover"
        virtual-triggering
      >
        <template v-if="displayShareOptions">
          <el-row>
            <el-col :offset="3" :span="8">
              <el-button
                type="primary"
                size="small"
                @click="getShareLink(exportAnnotation)"
                class="share-options"
              >
                Create Permalink
              </el-button>
            </el-col>
            <el-col :span="10">
              <el-popover class="tooltip"
                placement="bottom-end"
                :show-after="helpDelay" :teleported=false trigger="hover"
                popper-class="header-popper"
              >
                <template #reference>
                  <el-checkbox
                    v-model="exportAnnotation"
                    size="small"
                  >
                    Export Annotations
                  </el-checkbox>
                </template>
                <template #default>
                  Create a permalink with anonymous annotations.
                  <br>
                  NOTE: Annotations will only be stored for
                  <br>
                  30 days on the server.
                </template>
              </el-popover>
            </el-col>
        </el-row>
        </template>
        <template v-else>
          <el-row :gutter="20"
            v-loading="loadingLink"
            element-loading-text="Creating link...">
            <el-col :span="20">
              <el-input
                class="link-input"
                size="small"
                placeholder="Permanant Link Here"
                :readonly=true
                v-model="shareLink"
                ref="linkInput">
              </el-input>
            </el-col>
            <el-col :span="4">
              <el-popover class="tooltip" content="Copy link" placement="bottom-end"
                :show-after="helpDelay" :teleported=false trigger="hover"
                popper-class="header-popper">
                <template #reference>
                  <el-button class="copy-button"
                    :icon="ElIconCopyDocument" size="small"
                    @click="copyShareLink"></el-button>
                </template>
              </el-popover>
            </el-col>
          </el-row>
        </template>
      </el-popover>
      <el-popover class="tooltip"  content="Get permalink" placement="bottom-end"
        :show-after="helpDelay" :teleported=false trigger="hover"
        popper-class="header-popper"
        >
        <template #reference>
          <map-svg-icon icon="permalink"
            ref="permalinkRef"
            class="header-icon"
            @click="requestShareLink"
            v-show="shareLink"
          />
        </template>
      </el-popover>
      <el-popover class="tooltip" content="Close" placement="bottom-end" :show-after="helpDelay"
        :teleported=false trigger="hover" popper-class="header-popper">
        <template #reference>
          <map-svg-icon icon="close" class="header-icon" @click="close" v-show="showIcons"/>
        </template>
      </el-popover>

      <el-popover
        v-if="globalSettingRef"
        :virtual-ref="globalSettingRef"
        ref="settingPopover"
        placement="bottom"
        width="230"
        :teleported=false
        trigger="click"
        popper-class="setting-popover"
        virtual-triggering
        :disabled="!mapLoaded"
        >
        <div class="setting-popover-inner">
          <h4>Display options:</h4>
          <!-- <div class="setting-popover-block" v-if="'displayMarkers' in globalSettings">
            <el-checkbox
              v-model="globalSettings.displayMarkers"
              @change="updateGlobalSettings('displayMarkers')"
            >
              Display Map Markers
            </el-checkbox>
          </div> -->
          <!-- <div class="setting-popover-block" v-if="'highlightConnectedPaths' in globalSettings || 'highlightDOIPaths' in globalSettings">
            <h5>Card Hover</h5>
            <el-checkbox
              v-if="'highlightConnectedPaths' in globalSettings"
              v-model="globalSettings.highlightConnectedPaths"
              @change="updateGlobalSettings('highlightConnectedPaths')"
            >
              Highlight Connected Paths
            </el-checkbox>
            <el-checkbox
              v-if="'highlightDOIPaths' in globalSettings"
              v-model="globalSettings.highlightDOIPaths"
              @change="updateGlobalSettings('highlightDOIPaths')"
            >
              Highlight DOI Paths
            </el-checkbox>
          </div> -->
          <!-- <div class="setting-popover-block" v-if="'interactiveMode' in globalSettings">
            <h5>Interactive Mode</h5>
            <el-radio-group
              v-model="globalSettings.interactiveMode"
              @change="updateGlobalSettings('interactiveMode')"
            >
              <el-radio value="dataset">Dataset Exploration</el-radio>
              <el-radio value="connectivity">Connectivity Exploration</el-radio>
              <el-radio value="multiscale">Multiscale Model</el-radio>
            </el-radio-group>
          </div> -->

          <div class="setting-popover-block" v-if="'flightPathDisplay' in globalSettings">
            <h5>Flight path</h5>
            <el-radio-group
              v-model="globalSettings.flightPathDisplay"
              @change="updateGlobalSettings('flightPathDisplay')"
            >
              <el-radio :value="false">2D</el-radio>
              <el-radio :value="true">3D</el-radio>
            </el-radio-group>
          </div>
          <div class="setting-popover-block" v-if="'organsDisplay' in globalSettings">
            <h5>Organs</h5>
            <el-radio-group
              v-model="globalSettings.organsDisplay"
              @change="updateGlobalSettings('organsDisplay')"
            >
              <el-radio :value="true">Color</el-radio>
              <el-radio :value="false">Grayscale</el-radio>
            </el-radio-group>
          </div>
          <div class="setting-popover-block" v-if="'outlinesDisplay' in globalSettings">
            <h5>Apply outlines</h5>
            <el-radio-group
              v-model="globalSettings.outlinesDisplay"
              @change="updateGlobalSettings('outlinesDisplay')"
            >
              <el-radio :value="true">Show</el-radio>
              <el-radio :value="false">Hide</el-radio>
            </el-radio-group>
          </div>
          <div class="setting-popover-block" v-if="'backgroundDisplay' in globalSettings">
            <h5>Background color</h5>
            <el-radio-group
              class="bg-color-radio-group"
              v-model="globalSettings.backgroundDisplay"
              @change="updateGlobalSettings('backgroundDisplay')"
            >
              <el-radio value="white" class="bg-color-radio">
                <span style="--bg-color: white">white</span>
              </el-radio>
              <el-radio value="lightskyblue" class="bg-color-radio">
                <span style="--bg-color: lightskyblue">lightskyblue</span>
              </el-radio>
              <el-radio value="black" class="bg-color-radio">
                <span style="--bg-color: black">black</span>
              </el-radio>
            </el-radio-group>
          </div>
        </div>
      </el-popover>
      <el-popover
        v-if="showGlobalSettings"
        class="tooltip"
        content="Global Settings"
        placement="bottom-end"
        :show-after="helpDelay"
        :teleported=false
        trigger="hover"
        popper-class="header-popper"
        :disabled="!mapLoaded"
      >
        <template #reference>
          <el-icon
            ref="globalSettingRef"
            :disabled="!mapLoaded"
            class="header-icon"
            :class="{'disabled': !mapLoaded}"
          >
            <el-icon-more-filled />
          </el-icon>
        </template>
      </el-popover>

    </el-row>
  </div>
</template>


<script>
/* eslint-disable no-alert, no-console */
import { shallowRef } from 'vue';
import EventBus from './EventBus';
import { mapStores } from 'pinia';
import { useEntriesStore } from '../stores/entries';
import { useSettingsStore } from '../stores/settings';
import { useSplitFlowStore } from '../stores/splitFlow';
import { MapSvgIcon, MapSvgSpriteColor } from '@abi-software/svg-sprite';
import SearchControls from './SearchControls.vue';
import {
  CopyDocument as ElIconCopyDocument,
  MoreFilled as ElIconMoreFilled,
} from '@element-plus/icons-vue';
import {
  ElButton as Button,
  ElCheckbox as Checkbox,
  ElCol as Col,
  ElIcon as Icon,
  ElInput as Input,
  ElPopover as Popover,
  ElRadio as Radio,
  ElRadioGroup as RadioGroup,
  ElRow as Row,
} from "element-plus";
import tagging from '../services/tagging';

/**
 * Cmponent for the header of differnt vuers.
 */
export default {
  name: "DialogToolbarContent",
  components: {
    Button,
    Checkbox,
    Col,
    Icon,
    Input,
    Popover,
    Radio,
    RadioGroup,
    Row,
    MapSvgIcon,
    MapSvgSpriteColor,
    SearchControls,
    ElIconCopyDocument,
  },
  props: {
    /**
     * Array of titles.
     */
    numberOfEntries: {
      type: Number,
      default: 0
    },
    /**
     * Display icons for docking, undocking and etc.
     */
    showIcons: {
      type: Boolean,
      default: false

    },
  },
  inject: ['showGlobalSettings'],
  computed: {
    ...mapStores(useEntriesStore, useSettingsStore, useSplitFlowStore),
    activeView() {
      return this.splitFlowStore.activeView;
    },
    helpDelay() {
      return this.settingsStore.helpDelay;
    },
    shareLink() {
      return this.settingsStore.shareLink;
    },
    offlineAnnotationEnabled() {
      return this.settingsStore.offlineAnnotationEnabled;
    },
    viewIcons() {
      return this.splitFlowStore.viewIcons;
    },
  },
  watch: {
    shareLink: function() {
      this.loadingLink = false;
    },
  },
  data: function() {
    return {
      activeViewRef: undefined,
      displayShareOptions: false,
      ElIconCopyDocument: shallowRef(ElIconCopyDocument),
      exportAnnotation: false,
      failedSearch: undefined,
      globalSettings: {},
      globalSettingRef: undefined,
      isFullscreen: false,
      loadingLink: true,
      permalinkRef: undefined,
      viewingModes: {
        'Exploration': 'Find relevant research and view detail of neural pathways by selecting a pathway to view its connections and data sources',
        'Neuron Connection': 'Discover neuron connections by selecting a feature and viewing its associated network connections',
        'Annotation': ['View feature annotations', 'Add, comment on and view feature annotations']
      },
      authorisedUser: false,
      mapLoaded: false,
    }
  },
  methods: {
    loadGlobalSettings: function () {
      this.globalSettings = {
        ...this.globalSettings,
        ...this.settingsStore.globalSettings
      };
    },
    updateViewingMode: function (event, value) {
      const { target } = event;

      // prevent clicking inner checkbox
      if (!target.closest('.el-checkbox')) {
        this.globalSettings.viewingMode = value;

        if (value === 'Exploration') {
          this.globalSettings.displayMarkers = true;
          this.globalSettings.interactiveMode = 'dataset';
        } else if (value === 'Annotation') {
          this.globalSettings.displayMarkers = false;
          this.globalSettings.interactiveMode = 'dataset';
        } else {
          this.globalSettings.displayMarkers = false;
          this.globalSettings.interactiveMode = 'connectivity';
        }

        this.updateGlobalSettings('viewingMode');
      }
    },
    updateGlobalSettings: function(changedKey) {
      const updatedSettings = this.settingsStore.getUpdatedGlobalSettingsKey(this.globalSettings);
      this.settingsStore.updateGlobalSettings(this.globalSettings);

      // display marker update
      if (updatedSettings.includes('displayMarkers')) {
        EventBus.emit('markerUpdate');
      }
      if (updatedSettings.includes('interactiveMode')) {
        EventBus.emit('modeUpdate', this.globalSettings.interactiveMode);
      }
      // viewing mode update
      if (updatedSettings.includes('viewingMode') ||
        updatedSettings.includes('connectionType') ||
        updatedSettings.includes('flightPathDisplay') ||
        updatedSettings.includes('organsDisplay') ||
        updatedSettings.includes('outlinesDisplay') ||
        updatedSettings.includes('backgroundDisplay')) {
        EventBus.emit('globalViewerSettingsUpdate');
      }

      // GA Tracking
      let category = this.globalSettings[changedKey];

      // Format category for some items
      if (changedKey === 'flightPathDisplay') {
        category = this.globalSettings.flightPathDisplay ? '3D' : '2D';
      }
      if (changedKey === 'organsDisplay') {
        category = this.globalSettings.organsDisplay ? 'Color': 'Grayscale';
      }
      if (changedKey === 'outlinesDisplay') {
        category = this.globalSettings.outlinesDisplay ? 'Show' : 'Hide';
      }

      // Prevent viewing mode clicks on active item
      if (updatedSettings.length) {
        tagging.sendEvent({
          'event': 'interaction_event',
          'event_name': `portal_maps_settings_${changedKey}`,
          'category': category,
          'location': 'map_toolbar'
        });
      }
    },
    titleClicked: function(id) {
      this.$emit("titleClicked", id);
    },
    startHelp: function(){
      EventBus.emit("startHelp");

      // GA Tracking
      tagging.sendEvent({
        'event': 'interaction_event',
        'event_name': `portal_maps_toolbar_help`,
        'category': 'help_mode_start',
        'location': 'map_toolbar'
      });
    },
    onFullscreen: function() {
      this.$emit("onFullscreen");
      this.isFullscreen = !this.isFullscreen;

      // GA Tracking
      // only for fullscreen enter event to prevent duplicate events
      if (this.isFullscreen) {
        tagging.sendEvent({
          'event': 'interaction_event',
          'event_name': `portal_maps_toolbar_fullscreen`,
          'category': this.isFullscreen ? 'enter' : 'exit',
          'location': 'map_toolbar'
        });
      }
    },
    onFullscreenEsc: function () {
      if (!document.fullscreenElement) {
        this.isFullscreen = false;

        // GA Tracking
        tagging.sendEvent({
          'event': 'interaction_event',
          'event_name': `portal_maps_toolbar_fullscreen`,
          'category': this.isFullscreen ? 'enter' : 'exit',
          'location': 'map_toolbar'
        });
      }
    },
    close: function() {
      this.$emit("close");
    },
    copyShareLink: function() {
      if (document) {
        this.$refs.linkInput.$el.querySelector("input").select();
        document.execCommand('copy');

        // GA Tracking
        tagging.sendEvent({
          'event': 'interaction_event',
          'event_name': 'portal_maps_permalink',
          'category': 'permalink_copy',
          'location': 'map_toolbar'
        });
      }
    },
    setFailedSearch: function(result) {
      this.failedSearch = result;
    },
    requestShareLink: function() {
      if (sessionStorage.getItem('anonymous-annotation')) {
        this.displayShareOptions = true;
      } else {
        this.getShareLink(false);
      }
    },
    getShareLink: function(withAnnotation) {
      this.displayShareOptions = false;
      this.loadingLink = true;
      EventBus.emit("updateShareLinkRequested", withAnnotation);

      // GA Tracking
      tagging.sendEvent({
        'event': 'interaction_event',
        'event_name': 'portal_maps_permalink',
        'category': 'permalink_generate',
        'location': 'map_toolbar'
      });
    },
    viewClicked: function(view) {
      const prevActiveView = this.activeView;

      this.splitFlowStore.updateActiveView({
        view,
        entries: this.entriesStore.entries,
      });

      // GA Tracking
      if (view !== prevActiveView) {
        const viewCategory = this.viewIcons.find((item) => item.icon === view);
        tagging.sendEvent({
          'event': 'interaction_event',
          'event_name': `portal_maps_toolbar_split_view`,
          'category': viewCategory?.name || '',
          'location': 'map_toolbar'
        });
      }

      if (this.$refs.viewPopover) {
        this.$refs.viewPopover.hide();
      }
    }
  },
  mounted: function () {
    this.activeViewRef = shallowRef(this.$refs.activeViewRef);
    this.permalinkRef = shallowRef(this.$refs.permalinkRef);
    this.globalSettingRef = shallowRef(this.$refs.globalSettingRef);

    EventBus.on("mapLoaded", (map) => {
      this.mapLoaded = true;
    });

    document.addEventListener('fullscreenchange', this.onFullscreenEsc);

    this.loadGlobalSettings();
  },
  unmounted: function () {
    document.removeEventListener('fullscreenchange', this.onFullscreenEsc);
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@use "../assets/header-icon.scss";

.icon-group {
  :deep(.el-button--text) {
    color:#606266;
    font-size: 1.5em;
    &:hover {
      color: $app-primary-color;
    }
  }
}

.icon-transform {
  -moz-transform: rotate(90deg);
  -webkit-transform: rotate(90deg);
  -o-transform: rotate(90deg);
  -ms-transform: rotate(90deg);
  transform: rotate(90deg);
  padding:10px;
}

.header {
  height:32px;
}

.share-options.el-button {
  font-family: inherit;

  &:hover,
  &:focus {
    background: $app-primary-color;
    box-shadow: -3px 2px 4px #00000040;
    color: #fff;
  }
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

:deep(.link-popover) {
  border: 1px solid $app-primary-color;
}

:deep(.el-loading-spinner) {
  .path {
    stroke: $app-primary-color;
  }
  .el-loading-text {
    color: $app-primary-color;
  }
}

.copy-button {
  color:#FFFFFF;
  background-color:$app-primary-color;
  &:hover, &:focus {
    color:#FFFFFF;
    background-color:$app-primary-color;
    box-shadow: -3px 2px 4px #000000;
  }
}

.link-input {
  :deep(.el-input__inner) {
    color:#303133;
    &:focus {
      border-color:$app-primary-color;
    }
  }
}

.view-icon-row {
  height: 32px;
  width: 133px;
  border-radius: 4px;
  border: 1px solid rgb(151, 151, 151);
  font-size: 14px;
  margin:8px 0px 0px 0px!important;
  cursor: pointer;

  &.active {
    border: 1px solid $app-primary-color;
    background: rgba(131, 0, 191, 0.1);
  }
}

.view-icon {
  font-size: 1.7em;
  height: 24px!important;
  width: 24px!important;
  color: $app-primary-color;
  padding-top:3px;
}

.view-text {
  letter-spacing:0px;
  font-size:11px;
  line-height:14px;
  font-family:'Asap', 'Avenir',  Arial, sans-serif;
  font-weight:550;
  padding-top:7px;
}

:deep(.view-icon-popover.el-popper),
:deep(.setting-popover.el-popper) {
  border: 1px solid $app-primary-color;
  box-shadow: 0px 2px 12px 0px rgba(0, 0, 0, 0.06);
  padding: 4px 8px 12px 8px;
  min-width:unset!important;
  width:unset!important;
  background-color: #f3ecf6;
  cursor:default;
  .el-popper__arrow {
    &:before {
      border-color: $app-primary-color;
      background-color: #f3ecf6;
    }
  }
}

:deep(.setting-popover.el-popper) {
  min-width: 230px !important;
}

.viewing-mode-selector {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}

:deep(.el-popper.el-dropdown__popper.toolbar-dropdown-popper) {
  border: 1px solid $app-primary-color;
  box-shadow: 0px 2px 12px 0px rgba(0, 0, 0, 0.06);
  background-color: #f3ecf6;
  width: 320px;

  h4 {
    line-height: 1.4;
  }

  .el-popper__arrow {
    &:before {
      border-color: $app-primary-color;
      background-color: #f3ecf6;
    }
  }

  .el-dropdown-menu {
    padding: 0;
    background-color: #f3ecf6;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .el-radio-group .el-radio-button {
    --el-radio-button-checked-bg-color: gray;
    --el-radio-button-checked-border-color: gray;
  }

  .el-dropdown-menu__item {
    padding: 0.75rem !important;
    height: auto;
    flex-direction: column;
    align-items: start;
    gap: 0.75rem;
    position: relative;
    transition: all 0.3s ease;

    .el-icon {
      display: inline;
      color: inherit;
      vertical-align: middle;
    }

    > h5,
    > small {
      display: block;
    }

    h5 {
      line-height: 1.5 !important;
    }

    &.is-selected,
    &:hover {
      color: $app-primary-color;
      background-color: #f1e4f6;

      h5 {
        color: inherit;
      }

      .el-radio-group .el-radio-button {
        --el-radio-button-checked-bg-color: #{$app-primary-color};
        --el-radio-button-checked-border-color: #{$app-primary-color};
      }
    }

    &.is-selected {
      > h5 {
        font-weight: 700;
      }
    }
  }

  &:hover {
    .el-dropdown-menu__item {
      opacity: 1;

      &:not(:hover) {
        opacity: 0.75;
      }
    }
  }
}

.toolbar-dropdown-badge {
  color: white;
  background-color: $app-primary-color;
  border-radius: 4px;
  padding: 2px 4px;
}

:deep(.setting-popover.el-popper) {
  padding: 1px !important;
}

:deep(.el-popper.el-dropdown__popper.toolbar-dropdown-popper .el-dropdown__list),
.setting-popover-inner {
  padding: 0.5rem 0.75rem;
  max-height: calc(100vh - 135px);
  overflow-y: auto;
  border-radius: var(--el-popover-border-radius);
  scrollbar-width: thin;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  > h4 {
    margin: 0;
    padding: 0;
    font-size: 16px;
    color: $app-primary-color;
    text-align: center;
  }
}

:deep(.el-popper.el-dropdown__popper.toolbar-dropdown-popper .el-dropdown-menu__item),
.setting-popover-block {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  width: 100%;
  box-sizing: border-box;

  h5 {
    margin: 0;
    padding: 0;
    font-size: 14px;
    font-weight: 500;
    line-height: 32px;
    color: #303133;
  }
}

:deep(.el-loading-spinner) {
  top: 0px;
  scale: 0.7;
}

.el-option__description,
.el-radio__description small {
  display: inline-block;
  font-size: 12px;
  white-space: normal;
  line-height: 1.2;
  height: auto;
  font-weight: normal;
  color: gray;
}

.el-radio__description {
  margin-top: 0.25rem;
  padding-left: 0.25rem;
  font-style: italic;
}

.bg-color-radio-group {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.25rem;

  .el-radio {
    margin-right: 0;
    line-height: 0px;
  }
}

.bg-color-radio {
  position: relative;

  :deep(.el-radio__input) {
    display: none;
  }

  :deep(.el-radio__label) {
    height: auto;
    line-height: 0;
    padding: 4px;

    > span {
      display: block;
      width: 20px;
      height: 20px;
      background-color: var(--bg-color);
      box-shadow: 0px 0px 0px 1px rgb(144, 147, 153);
      font-size: 0px;
      line-height: 0;
      transition: box-shadow 0.3s ease;
    }
  }

  &.is-checked {
    :deep(.el-radio__label) > span {
      background-color: var(--bg-color);
      box-shadow: 0px 0px 0px 2px $app-primary-color;
    }
  }
}

.toolbar-dropdown {
  .el-dropdown-link {
    cursor: pointer;
    color: $app-primary-color;
    display: flex;
    align-items: center;
    height: 24px;
    font-weight: 500;
    outline: none;
  }

  &.is-disabled {
    opacity: 0.5;

    .el-dropdown-link {
      cursor: default;
    }
  }

  :deep(.el-icon) {
    color: $app-primary-color;
  }
}
</style>
