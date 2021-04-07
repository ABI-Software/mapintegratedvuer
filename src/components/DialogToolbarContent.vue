<template>
  <div :class="[{'draggable':  topLevelControls ==  false}, 'header']">
    <el-row class="content"> 
        <tabs :dialogTitles="dialogTitles" :activeId="activeId" @titleClicked="titleClicked"/>
    </el-row>
  
    <el-row class="icon-group" >
      <el-popover
        ref="viewPopover"
        placement="bottom"
        width="133"
        :appendToBody=false
        trigger="click"
        popper-class="view-icon-popover">
        <el-row :gutter="20"
          v-for="item in viewIcons"
          :key="item.name"
          :class="[{ 'active': item.icon ==  activeView},
            {'disabled': item.min > dialogTitles.length},
            'view-icon-row']"
          @click.native="viewClicked(item.icon)"
        >
          <el-col :span="4">
            <svg-icon :icon="item.icon"
              class="view-icon"/>
          </el-col>
          <el-col :offset="2" :span="18" class="view-text">
            {{item.name}}
          </el-col>
        </el-row>
      </el-popover>
      <el-popover class="tooltip"  content="Change view" placement="bottom-end"
        :open-delay="helpDelay" :appendToBody=false trigger="hover"
        popper-class="header-popper"
        v-show="topLevelControls">
        <svg-icon :icon="activeView"
          v-popover:viewPopover
          :class="[{'disabled': 1 >= dialogTitles.length},
            'header-icon']"
          slot="reference"/>
      </el-popover>
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
        trigger="click"
        popper-class="link-popover"
      >
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
import Tabs from './Tabs'

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
  components: { Tabs },
  props: {
    /**
     * Array of titles.
     */
    dialogTitles: {
      type: Array,
      default: () => []
    },
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
    activeView() {
      return store.state.splitFlow.activeView;
    },
    viewIcons() {
      return store.state.splitFlow.viewIcons;
    }
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
    viewClicked: function(view) {
      store.commit("splitFlow/updateActiveView", view);
    }
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
  height:32px;
}

.icon-group {
  position:absolute;
  display: flex;
  flex-direction: row;
  justify-content: center;
  top: 4px;
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

.header {
  height:32px;
}

.draggable.header:hover {
  cursor:grab;
}

.draggable.header:active {
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

>>> .el-popper[x-placement^=bottom] .popper__arrow {
  border-bottom-color: rgb(131, 0, 191);
}

.header-icon >>> .el-popper[x-placement^=bottom] .popper__arrow:after{
  border-bottom-color: #f3ecf6 !important;
}

>>> .link-popover {
  border: 1px solid rgb(131, 0, 191);
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
  font-family: 'Asap', 'Avenir',  Arial, sans-serif;
}

.view-icon-row {
  height: 32px;
  width: 133px;
  border-radius: 4px;
  border: 1px solid rgb(151, 151, 151);
  font-size: 14px;
  margin:8px 0px 0px 0px!important;
  cursor: pointer;
}

.view-icon-row.active {
  border: 1px solid rgb(131, 0, 191);
  background: rgba(131, 0, 191, 0.1);
}

.header-icon.disabled,
.view-icon-row.disabled {
  cursor: default;
  pointer-events: none;
}

.view-icon {
  font-size: 1.7em;
  color: #8300bf;
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

.header-icon.disabled,
.disabled .view-icon,
.disabled .view-text {
  opacity:0.5;
}

>>> .view-icon-popover {
  border: 1px solid rgb(131, 0, 191);
  box-shadow: 0px 2px 12px 0px rgba(0, 0, 0, 0.06);
  padding: 4px 8px 12px 8px;
  min-width:unset!important;
  cursor:default;
}

>>> .view-icon-popover .el-popper[x-placement^=bottom] .popper__arrow:after{
  border-bottom-color: #fff !important;
}

>>>.el-loading-spinner i{
  color: #8300bf;
}
>>>.el-loading-spinner .el-loading-text {
  color: #8300bf;
}

</style>
