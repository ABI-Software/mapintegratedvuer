<template>
    <vue-draggable-resizable :style="style" :w="500" :h="500" :resizable="true" @dragstop="onDragstop" @resizing="onResize" :parent="true" drag-handle=".dialog-header" class-name="resizeable-class">
      <el-container style="height:100%;background:white;">
        <el-header style="text-align: left; font-size: 12px" height="30px" class="dialog-header">
          Place Holder
        </el-header>
        <el-main class="dialog-main">
          <FlatmapVuer v-if="entry.type === 'Flatmap'" :entry="entry.resource" @resource-selected="resourceSelected(entry.type, $event)"  :name="entry.resource"  style="height:100%;width:100%;"/>
          <ScaffoldVuer v-else-if="entry.type === 'Scaffold'" :url="entry.resource" @scaffold-selected="resourceSelected(entry.type, $event)" ref="scaffold" />
          <PlotVuer v-else-if="entry.type === 'Plot'" :url="entry.resource"></PlotVuer>
        </el-main>
      </el-container>
    </vue-draggable-resizable>
</template>


<script>
/* eslint-disable no-alert, no-console */
import Vue from "vue";
import VueDraggableResizable from 'vue-draggable-resizable';
import '@abi-software/flatmapvuer';
import '@abi-software/flatmapvuer/dist/flatmapvuer.css';
import '@abi-software/scaffoldvuer';
import '@abi-software/scaffoldvuer/dist/scaffoldvuer.css';
import '@tehsurfer/plotvuer'
import '@tehsurfer/plotvuer/dist/plotvuer.css'
import {
  Container,
  Header,
  Main
} from "element-ui";
Vue.component('vue-draggable-resizable', VueDraggableResizable);
Vue.use(Container);
Vue.use(Header);
Vue.use(Main);
import 'vue-draggable-resizable/dist/VueDraggableResizable.css'

export default {
  name: "FloatingDialog",
  props: {entry: Object, index: Number},
  methods: {
    onResize: function (x, y, width, height) {
      this.x = x
      this.y = y
      this.width = width
      this.height = height
    },
    onDragstop: function (x, y) {
      if (this.entry.type === 'Scaffold') 
        this.scaffoldCamera.onResize();
      this.x = x
      this.y = y
    },
    resourceSelected: function(type, resource) {
        const result = {paneIndex: this.index, type: type, resource: resource};
        this.$emit("resource-selected", result);
    }
  },
  data: function() {
    return {
      isReady: false,
      myElement: undefined,
      scaffoldCamera: undefined,
      style: {zIndex: this.entry.zIndex}
    }
  },
  mounted: function() {
    this.isReady = true;
    if (this.entry.type === 'Scaffold') 
      this.scaffoldCamera = this.$refs.scaffold.$module.scene.getZincCameraControls();
  },
  watch: {
    "entry.zIndex": function() {
      this.style.zIndex = this.entry.zIndex;

    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.dialog-container {
  height: 100%;
  width: 100%;
}

.dialog-header {
  background-color: #B3C0D1;
  color: #333;
  line-height: 20px;
}

.dialog-main {
  padding:0px;
}

.resizeable-class {
    border: 1px solid black;
    -webkit-transition: background-color 200ms linear;
    -ms-transition: background-color 200ms linear;
    transition: background-color 200ms linear;
}

</style>
