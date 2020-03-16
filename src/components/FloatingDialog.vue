<template>
  <vue-draggable-resizable :style="style" :w="500" :h="500" :resizable="true" @dragstop="onDragstop" @resizing="onResize" :parent="true" drag-handle=".dialog-header" class-name="parent-dialog">
    <el-container style="height:100%;background:white;">
      <el-header :v-if="showHeader" style="text-align: left; font-size: 14px;padding:0" height="40px" class="dialog-header">
        <DialogToolbarContent :dialogTitles="[entry.type]"  @maximise="onMaximise" @minimise="onMinimise" @close="onClose"/>         
      </el-header>
      <el-main class="dialog-main">
        <MultiFlatmapVuer v-if="entry.type === 'Flatmap'" :availableSpecies="entry.availableSpecies" @resource-selected="resourceSelected(entry.type, $event)"  :name="entry.resource"  style="height:100%;width:100%;"/>
        <ScaffoldVuer v-else-if="entry.type === 'Scaffold'" :url="entry.resource" @scaffold-selected="resourceSelected(entry.type, $event)" ref="scaffold" />
        <PlotVuer v-else-if="entry.type === 'Plot'" :url="entry.resource" :plotType="entry.plotType"></PlotVuer>
      </el-main>
    </el-container>
  </vue-draggable-resizable>
</template>


<script>
/* eslint-disable no-alert, no-console */
import Vue from "vue";
import VueDraggableResizable from 'vue-draggable-resizable';
import DialogToolbarContent from './DialogToolbarContent';
import '@abi-software/flatmapvuer';
import '@abi-software/flatmapvuer/dist/flatmapvuer.css';
import '@abi-software/scaffoldvuer';
import '@abi-software/scaffoldvuer/dist/scaffoldvuer.css';
import '@tehsurfer/plotvuer'
import '@tehsurfer/plotvuer/dist/plotvuer.css'
import {
  Container,
  Header,
  Icon,
  Main,
  Row
} from "element-ui";
Vue.component('vue-draggable-resizable', VueDraggableResizable);
Vue.use(Container);
Vue.use(Header);
Vue.use(Icon);
Vue.use(Main);
Vue.use(Row);
import 'vue-draggable-resizable/dist/VueDraggableResizable.css'

export default {
  name: "FloatingDialog",
  props: {entry: Object, index: Number,
    showHeader: {
      type: Boolean,
      default: true,
    },
  },
  components: {
    DialogToolbarContent
  },
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
    },
    onMaximise: function() {
      console.log("maximise");
    },
    onMinimise: function() {
      console.log("minimise");
    },
    onClose: function() {
      console.log("close");
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
  color: #333;
  line-height: 20px;
  border-bottom: solid 0.7px #dcdfe6;
  background-color: #f5f7fa;
}

.dialog-main {
  padding:0px;
}

.parent-dialog {
  border: solid 1px #dcdfe6;
  box-shadow: 0 1px 8px 0 rgba(0, 0, 0, 0.06);
} 

.parent-dialog:hover .title-text {
  color:#8300bf;
}

>>> input {
  font-family: inherit;
}

</style>
