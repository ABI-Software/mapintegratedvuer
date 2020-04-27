<template>
  <vue-draggable-resizable :style="style" :w="1600" :h="1100" :x="initialX" :y="initialY" :resizable="true" 
    @dragstop="onDragstop" @resizing="onResize" :parent="true" drag-handle=".dialog-header" 
    :class-name="className" class-name-handle="my-handle">
    <el-container style="height:100%;background:white;">
      <el-header v-if="entry.mode==='normal'" style="text-align: left; font-size: 14px;padding:0" 
        height="40px" class="dialog-header">
        <DialogToolbarContent :dialogTitles="[indexTitle]"  @maximise="onMaximise" @minimise="onMinimise" 
          @close="onClose"/>
      </el-header>
      
      <el-main class="dialog-main" :style="mainStyle">
        <DatasetHeader v-if="entry.datasetTitle" class="dataset-header" :title="entry.datasetTitle" :url="entry.datasetUrl"></DatasetHeader>
        <MultiFlatmapVuer v-if="entry.type === 'Flatmap'" :availableSpecies="entry.availableSpecies" 
          @resource-selected="resourceSelected(entry.type, $event)"  :name="entry.resource" 
          style="height:100%;width:100%;" :initial="entry.resource"
          ref="flatmap"/>
        <ScaffoldVuer v-else-if="entry.type === 'Scaffold'" :url="entry.resource" 
          @scaffold-selected="resourceSelected(entry.type, $event)" ref="scaffold" />
        <PlotVuer v-else-if="entry.type === 'Plot'" :url="entry.resource" :plotType="entry.plotType"></PlotVuer>
        <MapPopover v-if="(entry.type === ('Flatmap')) || (entry.type === ('Scaffold'))"
          :selectedResource="selectedResource" :placement="tPlacement"
          :tooltipCoords="tooltipCoords" :visible="tVisible"
          @onActionClick="onActionClick" @onClose="onTooltipClose"
          :displayCloseButton="entry.type === 'Scaffold'"
          ref="popover"/>
      </el-main>
    </el-container>
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
import MapPopover from './MapPopover';
import DatasetHeader from './DatasetHeader';
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
  Icon,
  Main
} from "element-ui";
Vue.component('vue-draggable-resizable', VueDraggableResizable);
Vue.use(Container);
Vue.use(Header);
Vue.use(Icon);
Vue.use(Main);
import 'vue-draggable-resizable/dist/VueDraggableResizable.css'

export default {
  name: "FloatingDialog",
  props: {entry: Object, index: Number,
    showHeader: {
      type: Boolean,
      default: true,
    }
  },
  components: {
    DialogToolbarContent,
    MapPopover,
    DatasetHeader
  },
  methods: {
    onActionClick: function(action) {
      this.$emit("onActionClick", action);
    },
    onTooltipClose: function() {
      console.log(this.tVisible)
      this.tVisible = false;
    },
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
    showTooltip: function(result) {
      if (this.entry.type === 'Scaffold') {
        if (result.resource && result.resource.length > 0) {
          this.tVisible = true;
        } else {
          this.tVisible = false;
        }
      } else if (this.entry.type === 'Flatmap'){
        const elm = this.$refs.popover.getTooltipContentElm();
        this.$refs.flatmap.showPopup(result.resource.feature.id, elm,
          {anchor: "top"});
      } else {
        this.tooltipCoords.x = 0;
        this.tooltipCoords.y = 300;
        this.tVisible = true;
      }
    },
    resourceSelected: function(type, resource) {
      const result = {paneIndex: this.index, type: type, resource: resource};
      this.selectedResource = result;
      this.showTooltip(result);
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
    }
  },
  data: function() {
    return {
      isReady: false,
      myElement: undefined,
      scaffoldCamera: undefined,
      style: {zIndex: this.entry.zIndex},
      mainStyle: {overflow: this.entry.type === 'Scaffold' ? "hidden" : "auto"},
      className: "parent-dialog",
      indexTitle: {title: this.entry.type, id: this.index},
      selectedResource: undefined,
      tooltipCoords: {x: 0, y: 0},
      tPlacement: "bottom",
      tVisible: false,
      initialX: 0,
      initialY: 0
    }
  },

  mounted: function() {
    this.isReady = true;
    if (this.entry.mode === "main")
      this.className = "parent-dialog-full";
    if (this.entry.type === 'Scaffold') {
      this.scaffoldCamera = this.$refs.scaffold.$module.scene.getZincCameraControls();
      this.tooltipCoords = this.$refs.scaffold.getDynamicSelectedCoordinates();
    }
  },
  watch: {
    "entry.zIndex": function() {
      this.style.zIndex = this.entry.zIndex;
    },
    "entry.mode": function(val) {
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
}

.dialog-main {
  padding:0px;
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

.dataset-header{
  width: 100%;
  height: 25px;
  text-align: left;
  padding-left: 55px;
  padding-top: 10px;
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
