<template>
  <vue-draggable-resizable :style="style" :w="820" :h="545" :x="initialX" :y="initialY" :resizable="true" 
    @dragstop="onDragstop" @resizing="onResize" :parent="true" drag-handle=".dialog-header" 
    :class-name="className" class-name-handle="my-handle">
    <el-container direction="vertical" style="height:100%;background:white;">
      <el-header v-if="entry.mode==='normal'" class="dialog-header" height="40px">
        <DialogToolbarContent :dialogTitles="[indexTitle]"  @maximise="onMaximise" @minimise="onMinimise" 
          @close="onClose" :activeId="index"/>         
      </el-header>
      <el-main class="dialog-main" :style="mainStyle">
        <ContentVuer :entry="entry" ref="content" @resource-selected="resourceSelected"
          @flatmapChanged="flatmapChanged"/>
      </el-main>
    </el-container>
    <!-- Below set the style of the resize cursor -->
    <div slot="tl" class="el-icon-top-left"></div>
    <div slot="tm" class="el-icon-top"></div>
    <div slot="tr" class="el-icon-top-right"></div>
    <div slot="mr" class="el-icon-right"></div>
    <div slot="br" class="el-icon-bottom-right"></div>
    <div slot="bm" class="el-icon-bottom"></div>
    <div slot="bl" class="el-icon-bottom-left"></div>
    <div slot="ml" class="el-icon-back"></div>
  </vue-draggable-resizable>
</template>


<script>
/* eslint-disable no-alert, no-console */
import Vue from "vue";
import DialogToolbarContent from './DialogToolbarContent';
import ContentVuer from './ContentVuer';
import VueDraggableResizable from 'vue-draggable-resizable';
import {
  Container,
  Header,
  Icon,
  Main
} from "element-ui";
Vue.component('vue-draggable-resizable', VueDraggableResizable);
Vue.use(Container);
Vue.use(Header);
Vue.use(Icon);
Vue.use(Main);

/**
 * Vue component of the floating dialog.
 */
export default {
  name: "FloatingDialog",
  props: {
    /**
     * Object containing information for
     * the required viewing.
     */
    entry: Object,
    index: Number,
    /**
     * Flag for toggling the header.
     * True when it is undocked.
     */
    showHeader: {
      type: Boolean,
      default: true,
    }
  },
  components: {
    ContentVuer,
    DialogToolbarContent,
  },
  methods: {
    getVuerByReference: function(refName) {
      return this.$refs.content.$refs[refName];
    },
    getState: function() {
      return this.$refs.content.getState();
    },
    onResize: function (x, y, width, height) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
    },
    onDragstop: function (x, y) {
      this.$refs.content.onResize();
      this.x = x;
      this.y = y;
    },
    /**
     * Callback when the vuers emit a selected event.
     */
    resourceSelected: function(result) {
      this.$emit("resource-selected", result);
    },
    onMaximise: function() {
      this.$emit("maximise");
    },
    onMinimise: function() {
      this.$emit("minimise");
    },
    onClose: function() {
      this.$emit("close");
    },
    flatmapChanged: function(){
      this.$emit("flatmapChanged");
    }
  },
  data: function() {
    return {
      style: {zIndex: this.entry.zIndex},
      mainStyle: {
        overflow: this.entry.type === 'Scaffold' ? "hidden" : "auto",
      },
      /**
       * Control the style of the top compoent.
       * @values parent-dialog, parent-dialog-full
       */
      className: "parent-dialog",
      indexTitle: {title: this.entry.type, id: this.index},
      initialX: 0,
      initialY: 0,
    }
  },
  beforeMount: function() {
    if (this.index > 1) {
      var remainder = (this.index - 2) % 4;
      this.initialX = (remainder + 1) * 40;
      this.initialY = remainder * 40;
    }
  },
  mounted: function() {
    if (this.entry.mode === "main")
      this.className = "parent-dialog-full";
    if (this.entry.label)
      this.indexTitle.title = this.entry.label + " " + this.entry.type;
  },
  watch: {
    "entry.zIndex": {
      handler: function() {
        this.style.zIndex = this.entry.zIndex;
      },
      immediate: true,
    },
    "entry.mode": {
      handler: function(val) {
        switch(val) {
          case "main":
          case "maximised":
            this.className = "parent-dialog-full";
            break;
          case "minimised":
            this.className = "parent-dialog-hidden";
            break;
          default:
            this.className = "parent-dialog";
        }
      },
      immediate: true
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.dialog-header {
  color: #333;
  line-height: 20px;
  border-bottom: solid 0.7px #dcdfe6;
  background-color: #f5f7fa;
  text-align: left; 
  font-size: 14px;
  padding:0;
}
.incorperateHeader{
  height: calc(100%-205px);
  padding:0px;
}
.dialog-main {
  padding:0px;
  height:100%;
}

.parent-dialog {
  border: solid 1px #dcdfe6;
  box-shadow: 0 1px 8px 0 rgba(0, 0, 0, 0.06);
}
.parent-dialog-full {
  width:100%!important;
  height:100%!important;
  left:0px!important;
  top:0px!important;
}
.parent-dialog-hidden {
  visibility:hidden;
}
.parent-dialog-full:hover .title-text {
  color:#8300bf;
}
.parent-dialog:hover .title-text {
  color:#8300bf;
}
>>> input {
  font-family: inherit;
}
>>> .my-handle {
    color:#979797;
    position: absolute;
    border: 0px;
    width:10px;
    height:10px;
    box-sizing: border-box;
}
>>> .my-handle-tl {
  top: -13px;
  left: -13px;
  cursor: nw-resize;
}
>>> .my-handle-tm {
  top: -14px;
  left: 50%;
  margin-left: -7px;
  cursor: n-resize;
}
>>> .my-handle-tr {
  top: -13px;
  right: -8px;
  cursor: ne-resize;
}
>>> .my-handle-ml {
  top: 50%;
  margin-top: -7px;
  left: -14px;
  cursor: w-resize;
}
>>> .my-handle-mr {
  top: 50%;
  margin-top: -7px;
  right: -8px;
  cursor: e-resize;
}
>>> .my-handle-bl {
  bottom: -8px;
  left: -14px;
  cursor: sw-resize;
}
>>> .my-handle-bm {
  bottom: -8px;
  left: 50%;
  margin-left: -7px;
  cursor: s-resize;
}
>>> .my-handle-br {
  bottom: -8px;
  right: -8px;
  cursor: se-resize;
}

</style>
<style scoped src="vue-draggable-resizable/dist/VueDraggableResizable.css">
</style>
