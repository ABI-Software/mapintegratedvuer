<template>
  <div class="header">
    <el-row class="content">
      <div class="title" v-for="title in dialogTitles" :key="title.id">
        <div class="title-text" v-bind:class="{ highlightText : (title.id==activeId) }" v-on:click="titleClicked(title.id)">
          {{title.title}}
        </div>
      </div>
    </el-row>
    <el-row class="icon-group" >
      <el-button class="icon-transform" icon="el-icon-help" v-if="showHelpIcon" size="medium" type="text" @click="startTutorial"></el-button>
      <el-button icon="el-icon-full-screen" size="medium" type="text" v-if="showFullscreenIcon" @click="onFullscreen"></el-button>
      <el-button class="icon-transform" icon="el-icon-copy-document" v-if="showIcons" size="medium" type="text" @click="maximise"></el-button>
      <el-button icon="el-icon-remove-outline" size="medium" v-if="showIcons" type="text" @click="minimise"></el-button>
      <el-button icon="el-icon-close" size="medium" v-if="showIcons" type="text" @click="close"></el-button>
    </el-row>
  </div>
</template>


<script>
/* eslint-disable no-alert, no-console */
import Vue from "vue";
import {
  Button,
  Icon,
  Row
} from "element-ui";
Vue.use(Button);
Vue.use(Icon);
Vue.use(Row);

export default {
  name: "DialogToolbarContent",
  props: {
    dialogTitles: Array, 
    showIcons: {
      type: Boolean,
      default: true
    },
    showFullscreenIcon: {
      type: Boolean,
      default: false
    },
    activeId: {
      type: Number,
      default: -1
    },
    showHelpIcon: {
      type: Boolean,
      default: false
    },
  },
  methods: {
    titleClicked: function(id) {
      this.$emit("titleClicked", id);
    },
    startTutorial: function(){
      this.$emit("startTutorial")
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
  padding-top:9px;
  text-align:center;
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
}

.header:hover {
  cursor:grab;
}

.header:active {
  cursor:grabbing;
}

</style>
