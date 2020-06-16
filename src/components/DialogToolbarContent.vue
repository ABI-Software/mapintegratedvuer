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
      <el-popover content="Help" placement="bottom-end"
        :appendToBody=false trigger="hover" popper-class="header-popper" v-if="showHelpIcon" >
        <el-button class="header-icon" slot="reference" icon="el-icon-question" size="medium" type="text" @click="startHelp(activeId)"></el-button>
      </el-popover>
      <el-popover content="Toggle fullscreen" placement="bottom-end"
        :appendToBody=false trigger="hover" popper-class="header-popper" v-if="showFullscreenIcon">
        <el-button class="header-icon" slot="reference" icon="el-icon-full-screen" size="medium" type="text" @click="onFullscreen"></el-button>
      </el-popover>
      <el-popover content="Maximize" placement="bottom-end"
        :appendToBody=false trigger="hover" popper-class="header-popper" v-if="showIcons">
        <el-button slot="reference" class="icon-transform" icon="el-icon-copy-document" size="medium" type="text" @click="maximise"></el-button>
      </el-popover>
      <el-popover content="Minimize" placement="bottom-end"
        :appendToBody=false trigger="hover" popper-class="header-popper" v-if="showIcons">
        <el-button class="header-icon" slot="reference" icon="el-icon-remove-outline" size="medium" type="text" @click="minimise"></el-button>
      </el-popover>
      <el-popover content="Close" placement="bottbottom-endom"
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
import {
  Button,
  Icon,
  Popover,
  Row
} from "element-ui";
Vue.use(Button);
Vue.use(Icon);
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
    showFullscreenIcon: {
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

</style>
