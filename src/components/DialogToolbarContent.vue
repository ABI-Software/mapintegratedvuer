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
      <el-popover content="Help" placement="bottom-end" :open-delay="helpDelay"
        :appendToBody=false trigger="hover" popper-class="header-popper" v-if="showHelpIcon" >
        <el-button class="header-icon" slot="reference" icon="el-icon-question" size="medium" type="text" @click="startHelp(activeId)"></el-button>
      </el-popover>
      <el-popover content="Toggle fullscreen" placement="bottom-end" :open-delay="helpDelay"
        :appendToBody=false trigger="hover" popper-class="header-popper" v-if="topLevelControls">
        <el-button class="header-icon" slot="reference" icon="el-icon-full-screen" size="medium" type="text" @click="onFullscreen"></el-button>
      </el-popover>
      <el-popover content="Resize" placement="bottom-end" :open-delay="helpDelay"
        :appendToBody=false trigger="hover" popper-class="header-popper" v-if="showIcons">
        <el-button slot="reference" class="icon-transform" icon="el-icon-copy-document" size="medium" type="text" @click="maximise"></el-button>
      </el-popover>
      <el-popover content="Dock" placement="bottom-end" :open-delay="helpDelay"
        :appendToBody=false trigger="hover" popper-class="header-popper" v-if="showIcons">
        <el-button class="header-icon" slot="reference" icon="el-icon-remove-outline" size="medium" type="text" @click="minimise"></el-button>
      </el-popover>
      <el-popover
          ref="linkPopover"
          placement="bottom-end"
          width="400"
          :appendToBody=false
          trigger="click">
          <el-row :gutter="20">
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
              <el-popover content="Copy link" placement="bottom-end" 
                :open-delay="helpDelay" :appendToBody=false trigger="hover"
                popper-class="header-popper">
              <el-button slot="reference" class="copy-button" 
                icon="el-icon-document-copy" size="mini" 
                @click="copyShareLink"></el-button>
              </el-popover>
            </el-col>
          </el-row>
      </el-popover>
      <el-popover content="copy permalink" placement="bottom-end" 
        :open-delay="helpDelay" :appendToBody=false trigger="hover" 
        popper-class="header-popper" 
        v-if="topLevelControls && shareLink">
        <el-button v-popover:linkPopover class="header-icon" slot="reference"
          icon="el-icon-link" size="medium" type="text" @click="getShareLink">
        </el-button>
      </el-popover>
      <el-popover content="Close" placement="bottom-end" :open-delay="helpDelay"
        :appendToBody=false trigger="hover" popper-class="header-popper" v-if="showIcons">
        <el-button class="header-icon" slot="reference" icon="el-icon-close" size="medium" type="text" @click="close"></el-button>
      </el-popover>
    </el-row>
  </div>
</template>


<script>
/* eslint-disable no-alert, no-console */
import Vue from "vue";
import EventBus from './EventBus';
import store from '../store';
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
  data: function() {
    return {
      helpDelay: 500
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
    },
    maximise: function() {
      this.$emit("maximise");
    },
    minimise: function() {
      this.$emit("minimise");
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
      EventBus.$emit("updateShareLinkRequested");
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
  top:-2px;
  right:16px;
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
  padding:9px 10px;
  min-width:100px;
  font-size:12px;
  color: #fff;
  background-color: #8300bf;  
  word-break:keep-all;
}

>>> .header-popper .popper__arrow::after{
  border-bottom-color: #8300bf !important;
}

.header-icon {
  padding-right:10px;
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
</style>
