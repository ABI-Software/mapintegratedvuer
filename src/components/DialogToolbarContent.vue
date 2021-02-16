<template>
  <div class="header">
    <el-row class="content">
      <div class="title" v-for="title in dialogTitles" :key="title.id">
        <div  class="title-text-table" v-bind:class="{ highlightText : (title.id==activeId) }" v-on:click="titleClicked(title.id)">
          <div class="title-text">
            {{title.title}}
          </div>
        </div>
      </div>
    </el-row>
  
    <el-row class="icon-group" >
      <el-popover class="tooltip" content="Help" placement="bottom-end" :open-delay="helpDelay"
        :appendToBody=false trigger="hover" popper-class="header-popper" v-show="showHelpIcon" >
        <svg-icon icon="tooltips" slot="reference" class="header-icon" @click.native="startHelp(activeId)"/>
      </el-popover>
      <el-popover v-show="!isFullscreen && topLevelControls" class="tooltip" 
        content="Fullscreen" placement="bottom-end" :open-delay="helpDelay"
        :appendToBody=false trigger="hover" popper-class="header-popper">
          <svg-icon icon="fullScreen"  slot="reference" class="header-icon" @click.native="onFullscreen"/>
      </el-popover>
      <el-popover v-show="isFullscreen && topLevelControls" class="tooltip"
        content="Exit fullscreen" placement="bottom-end" :open-delay="helpDelay"
        :appendToBody=false trigger="hover" popper-class="header-popper">
          <svg-icon icon="closeFullScreen" slot="reference" class="header-icon"
            @click.native="onFullscreen"/>
      </el-popover>
      <el-popover class="tooltip" content="Dock" placement="bottom-end" :open-delay="helpDelay"
        :appendToBody=false trigger="hover" popper-class="header-popper" v-show="!isDocked && showIcons">
        <svg-icon icon="dock" slot="reference" class="header-icon" @click.native="toggleDock"/>
      </el-popover>
      <el-popover class="tooltip" content="Undock" placement="bottom-end" :open-delay="helpDelay"
        :appendToBody=false trigger="hover" popper-class="header-popper" v-show="isDocked && showIcons">
        <svg-icon icon="undock" slot="reference" class="header-icon" @click.native="toggleDock"/>
      </el-popover>
      <el-popover
        ref="linkPopover"
        placement="bottom-end"
        width="400"
        :appendToBody=false
        trigger="click">
        <el-row :gutter="20"
          v-loading="loadingLink"
          element-loading-text="Creating link..."
          element-loading-spinner="el-icon-loading">
          <el-col :span="20">
            <el-input
              class="link-input"
              size="mini"
              placeholder="Permanant Link Here"
              :readonly=true
              v-model="shareLink"
              ref="linkInput">
            </el-input>
          </el-col>
          <el-col :span="4">
            <el-popover class="tooltip" content="Copy link" placement="bottom-end"
              :open-delay="helpDelay" :appendToBody=false trigger="hover"
              popper-class="header-popper">
            <el-button slot="reference" class="copy-button"
              icon="el-icon-document-copy" size="mini"
              @click="copyShareLink"></el-button>
            </el-popover>
          </el-col>
        </el-row>
      </el-popover>
      <el-popover class="tooltip"  content="Get permalink" placement="bottom-end"
        :open-delay="helpDelay" :appendToBody=false trigger="hover"
        popper-class="header-popper"
        v-show="topLevelControls && shareLink">
        <svg-icon icon="permalink"
          v-popover:linkPopover
          class="header-icon" 
          @click.native="getShareLink"
          slot="reference"/>
      </el-popover>
      <el-popover class="tooltip" content="Close" placement="bottom-end" :open-delay="helpDelay"
        :appendToBody=false trigger="hover" popper-class="header-popper" v-show="showIcons">
        <svg-icon icon="close" slot="reference" class="header-icon" @click.native="close"/>
      </el-popover>
    </el-row>
  </div>
</template>


<script>
/* eslint-disable no-alert, no-console */
import Vue from "vue";
import EventBus from './EventBus';
import store from '../store';
import {SvgIcon} from '@abi-software/svg-sprite';

import {
  Button,
  Col,
  Icon,
  Input,
  Popover,
  Row
} from "element-ui";

Vue.use(Button);
Vue.use(Col);
Vue.use(Icon);
Vue.use(Input);
Vue.use(Popover);
Vue.use(Row);
Vue.component('svg-icon', SvgIcon);
/**
 * Cmponent for the header of differnt vuers.
 */
export default {
  name: "DialogToolbarContent",
  props: {
    /**
     * Array of titles.
     */
    dialogTitles: Array,
    /**
     * Display icons for docking, undocking and etc.
     */
    showIcons: {
      type: Boolean,
      default: true

    },
    topLevelControls: {
      type: Boolean,
      default: false
    },
    /**
     * The current active title.
     */
    activeId: {
      type: Number,
      default: -1
    },
    showHelpIcon: {
      type: Boolean,
      default: true
    },
  },
  computed: {
    shareLink() {
      return store.state.settings.shareLink;
    },
  },
  watch: {
    shareLink: function() {
      this.loadingLink = false;
    }
  },
  data: function() {
    return {
      isFullscreen: false,
      isDocked: true,
      helpDelay: 500,
      loadingLink: true,
      shareLinkDisplay: false,
    }
  },
  methods: {
    titleClicked: function(id) {
      this.$emit("titleClicked", id);
    },
    startHelp: function(id){
      EventBus.$emit("startHelp", id);
    },
    onFullscreen: function() {
      this.$emit("onFullscreen");
      this.isFullscreen = !this.isFullscreen;
    },
    toggleDock: function() {
      this.$emit("maximise");
      this.isDocked = true
    },
    minimise: function() {
      this.$emit("minimise");
      this.isDocked = false
    },
    close: function() {
      this.$emit("close");
    },
    copyShareLink: function() {
      if (document) {
        this.$refs.linkInput.$el.querySelector("input").select();
        document.execCommand('copy');
      }
    },
    getShareLink: function() {
      this.loadingLink = true;
      this.shareLinkDisplay = true;
      EventBus.$emit("updateShareLinkRequested");
    },
  },
  mounted: function(){
    if(!this.topLevelControls){
      this.isDocked = false;
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

.content {
  width:calc(100% - 120px);
}

.title {
  width: 101px;
  height: 38px;
  border-right: solid 1px #dcdfe6;
  background-color: white;
  display:inline-block;
}

.title:hover {
  cursor: pointer;
}

.title-text {
  text-align:center;
  display: table-cell;
  vertical-align: middle;
}

.title-text-table {
  display:table;
  height: 100%;
  width: 100%;
}

.parent-dialog:hover .title-text {
  color:#8300bf;
}

.highlightText {
  color:#8300bf;
}

.icon-group {
  position:absolute;
  display: flex;
  flex-direction: row;
  justify-content: center;
  top: 8px;
  right:12px;
}

.icon-group >>> .el-button--text {
  color:#606266;
  font-size: 1.5em;
}

.icon-group >>> .el-button--text:hover {
  color:#8300bf;
}

.icon-transform {
  -moz-transform: rotate(90deg);
  -webkit-transform: rotate(90deg);
  -o-transform: rotate(90deg);
  -ms-transform: rotate(90deg);
  transform: rotate(90deg);
  padding:10px;
}

.header:hover {
  cursor:grab;
}

.header:active {
  cursor:grabbing;
}

>>> .header-popper {
  padding: 6px 4px;
  font-size:12px;
  color: rgb(48, 49, 51);
  background-color: #f3ecf6;
  border: 1px solid rgb(131, 0, 191);
  white-space: nowrap;
  min-width: unset; 
}

>>> .header-popper .popper__arrow::after{
  border-bottom-color: #8300bf !important;
}

.header-icon {
  font-size: 1.8em;
  color: #8300bf;
  margin-right:10px;
  cursor: pointer;
}

.copy-button {
  color:#FFFFFF;
  background-color:#8300bf;
}

.copy-button:hover {
  color:#FFFFFF;
  background-color:#8300bf;
  box-shadow: -3px 2px 4px #000000;
}
.copy-button:focus {
  color:#FFFFFF;
  background-color:#8300bf;
  box-shadow: -3px 2px 4px #000000;
}

.link-input >>> .el-input__inner {
  color:#303133;
}

.link-input >>> .el-input__inner:focus {
  border-color:#8300bf;
}

.tooltip {
  font-family: Asap;
}

>>>.el-loading-spinner i{
  color: #8300bf;
}
>>>.el-loading-spinner .el-loading-text {
  color: #8300bf;
}
</style>
