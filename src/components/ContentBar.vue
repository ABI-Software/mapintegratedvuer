<template>
  <div>
    <div class="toolbar-flex-container">
      <el-select
        v-if="entries.length > 1"
        :popper-append-to-body="false"
        :value="entry.id"
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
      <div v-show="contextCardEntry && contextCardVisible" class="hide" @click="contextCardVisible = false">
        Hide information
        <i class="el-icon-arrow-up"></i>
      </div>
      <div v-show="contextCardEntry && !contextCardVisible" class="hide" @click="contextCardVisible = true">
        Show information
        <i class="el-icon-arrow-down"></i>
      </div>
      <el-popover
        placement="bottom"
        :appendToBody="false"
        trigger="manual"
        :width="setPopperWidth(slot.id)"
        offset=0
        class="context-card-popover"
        :popper-options="popperOptions"
        v-model="contextCardVisible"
      >
        <template v-if="contextCardEntry">
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
        <div class="el-icon-info info-icon"
          slot="reference"
          @click="contextCardVisible = !contextCardVisible"
          v-show="contextCardEntry"
        >
        </div>
      </el-popover>
      <el-popover class="tooltip" content="Close and remove" placement="bottom-end" :open-delay="helpDelay"
        :appendToBody=false trigger="hover" popper-class="header-popper" >
        <map-svg-icon icon="close" slot="reference" class="header-icon"
          v-if="(activeView !== 'singlepanel') && (entry.mode !== 'main')"
          @click.native="closeAndRemove()"/>
      </el-popover>
    </el-row>
  </div>
</template>


<script>
/* eslint-disable no-alert, no-console */
import Vue from "vue";
import EventBus from './EventBus';
import store from "../store";
import ContextCard from "./ContextCard";
import FlatmapContextCard from './FlatmapContextCard.vue';
import { Input, Option, Popover, Row, Select } from "element-ui";
import lang from "element-ui/lib/locale/lang/en";
import locale from "element-ui/lib/locale";

locale.use(lang);
Vue.use(Input);
Vue.use(Option);
Vue.use(Select);
Vue.use(Popover);
Vue.use(Row);

export default {
  name: "ContentBar",
  components: {
    ContextCard,
    FlatmapContextCard
  },
  props: {
    entry: Object,
  },
  data: function() {
    return {
      contextCardVisible: false,
      slot:{

      },
      boundariesElement: null, // this is set @hook:mounted by the parent component via the 'setBoundary' method
      showDetails: true,
      contextCardEntry: undefined,
    }
  },
  computed: {
    helpDelay() {
      return store.state.settings.helpDelay;
    },
    activeView: function() {
      return store.state.splitFlow.activeView;
    },
    envVars: function () {
      return {
        API_LOCATION: store.state.settings.sparcApi,
        ALGOLIA_INDEX: store.state.settings.algoliaIndex,
        ALGOLIA_KEY: store.state.settings.algoliaKey,
        ALGOLIA_ID: store.state.settings.algoliaId,
        PENNSIEVE_API_LOCATION: store.state.settings.pennsieveApi,
        NL_LINK_PREFIX: store.state.settings.nlLinkPrefix,
        ROOT_URL: store.state.settings.rootUrl,
      };
    },
    popperOptions: function() { 
      return { 
        preventOverflow: {
          enabled: true,
          boundariesElement: this.boundariesElement,
        }
      }
    },
    entries: function() {
      return store.state.entries.entries;
    },
  },
  methods: {
    closeAndRemove: function() {
      store.commit("splitFlow/closeSlot", 
        { id: this.entry.id, entries: this.entries});
      EventBus.$emit("RemoveEntryRequest", this.entry.id);
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
        store.commit("splitFlow/assignOrSwapSlotWithIds", {
          source: this.entry.id,
          target: value
        });
        Vue.nextTick(() => {
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
@import "~element-ui/packages/theme-chalk/src/input";
@import "~element-ui/packages/theme-chalk/src/option";
@import "~element-ui/packages/theme-chalk/src/select";
@import "../assets/header-icon.scss";


.toolbar-title {
  width: 160px;
  height: 20px;
  color: $app-primary-color;
  font-size: 14px;
  font-weight: normal;
  line-height: 20px;
  margin-left: 11px;
  margin-top: 4px;
}

.toolbar-flex-container {
  display:flex;
  flex-direction: row;
  .select-box {
    width: 200px;
    border-radius: 4px;
    border: 1px solid rgb(144, 147, 153);
    background-color: $background;
    font-weight: 500;
    color: rgb(48, 49, 51);
    margin-left: 8px;
    margin-top: 3px;
    margin-bottom: 2px;
    z-index: 5;
    ::v-deep .el-input__inner {
      width:177px;
      color: $app-primary-color;
      height: 24px;
      padding-left: 4px;
      padding-right: 8px;
      background-color: $background;
      border-style: none;
    }
    
    ::v-deep .el-input__icon {
      line-height: 24px;
      color: $lightGrey;
    }
  }
  i .select-box ::v-deep .el-input__icon {
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
    &.selected {
      color: $app-primary-color;
      font-weight: normal;
    }
  }
}

.hide{
  color: $app-primary-color;
  cursor: pointer;
  margin-right: 6px;
  margin-top: 3px;
}

.icon-group {
  font-size: 12px;
}

.info-icon {
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

.context-card-popover ::v-deep .el-popover{
  max-width: calc(100vw - 100px);
  padding-right: 0px;
}
</style>
