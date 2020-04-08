<template>
  <vue-draggable-resizable :style="style" :w="820" :h="545"  :x="80" :resizable="true" 
    @dragstop="onDragstop" @resizing="onResize" :parent="true" drag-handle=".dialog-header" 
    :class-name="className" class-name-handle="my-handle">
    <el-container style="height:100%;background:white;">
      <el-header v-if="entry.mode==='normal'" style="text-align: left; font-size: 14px;padding:0" height="40px" class="dialog-header">
        <DialogToolbarContent :dialogTitles="[indexTitle]"  @maximise="onMaximise" @minimise="onMinimise" 
          @close="onClose"/>         
      </el-header>
      <el-main class="dialog-main" :style="mainStyle">
        <MultiFlatmapVuer v-if="entry.type === 'Flatmap'" :availableSpecies="entry.availableSpecies" 
          @resource-selected="resourceSelected(entry.type, $event)"  :name="entry.resource" 
          style="height:100%;width:100%;" :initial="entry.resource"
          ref="flatmap"/>
        <ScaffoldVuer v-else-if="entry.type === 'Scaffold'" :url="entry.resource" 
          @scaffold-selected="resourceSelected(entry.type, $event)" ref="scaffold" />
        <PlotVuer v-else-if="entry.type === 'Plot'" :url="entry.resource" :plotType="entry.plotType"></PlotVuer>
        <div>
          <TooltipVuer v-if="(entry.type === ('Flatmap')) || (entry.type === ('Scaffold'))" 
            :placement="tPlacement" :visible="tVisible" :content="tContent" 
            :position="tStyle" @onActionClick="onActionClick" @onClose="onTooltipClose"/>
          </div>
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
import VueDraggableResizable from 'vue-draggable-resizable';
import DialogToolbarContent from './DialogToolbarContent';
import '@abi-software/flatmapvuer';
import '@abi-software/flatmapvuer/dist/flatmapvuer.css';
import '@abi-software/scaffoldvuer';
import '@abi-software/scaffoldvuer/dist/scaffoldvuer.css';
import '@abi-software/maptooltip';
import '@abi-software/maptooltip/dist/maptooltip.css';
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
    DialogToolbarContent
  },
  methods: {
    onActionClick: function(action) {
      this.$emit("onActionClick", action);
    },
    onTooltipClose: function() {
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
          let coords = this.$refs.scaffold.getCoordinatesOfSelected();
          if (coords) {
            this.tooltipLeft = Math.floor(coords.x);
            this.tooltipTop = Math.floor(coords.y);
            this.tVisible = true;
          }
        } else {
          this.tVisible = false;
        }
      } else if (this.entry.type === 'Flatmap'){
        console.log(this.$refs.flatmap)
        let coords = this.$refs.flatmap.getCoordinatesOfLastClick();
        if (coords) {
          this.tooltipLeft = Math.floor(coords.x);
          this.tooltipTop = Math.floor(coords.y);
          this.tVisible = true;
        }
      } else {
        this.tooltipLeft = Math.floor(0);
        this.tooltipTop = Math.floor(300);
        this.tVisible = true;
      }
    },
    fetchContent: function(term) {
      if (term) {
        let data = {};
        if (term === "UBERON:0000948") {
          console.log(term)
          data.title = "Mapping of ICN Neurons in a 3D Rat Heart";
          data.description = "The distribution of neurons in the intrinsic cardiac nervous system (ICN) were mapped and visualized in a 3D reconstruction of a male rat heart.";
          data.actions = [
            {
              title: "View 3D scaffold",
              resource: "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/others/29_Jan_2020/heartICN_metadata.json",
              type: "Scaffold"
            },
            {
              title: "View dataset",
              resource: "https://sparc.science/datasets/37?type=dataset",
              type: "URL"
            }
          ];
          return data;
        } else if (term === "ICN") { 
          data.title = "RNA";
          data.description = "The distribution of neurons in the intrinsic cardiac nervous system (ICN) were mapped and visualized in a 3D reconstruction of a male rat heart.";
          data.actions = [
            {
              title: "View plot",
              resource: "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/ISAN/csv-data/use-case-4/RNA_Seq.csv",
              type: "Plot",
              plotType: "heatmap"
            }
          ];
        } else {
          data.title = term;
          data.description = "";
          data.actions = [ ];
        }
        return data;
      }
      return undefined;
    },
    updateTooltipContent: function(result) {
      if (result.resource) {
        let resource = result.resource;
        if (Array.isArray(resource) && resource[0])
          resource = resource[0];
        let term = undefined;
        if (resource.data && resource.data.id)
          term = resource.data.id;
        else if (resource.resource && resource.resource[0])
          term = resource.resource[0];
        if (term) {
          let data = this.fetchContent(term);
          if (data) {
            this.tContent = data;
            return true;
          }
        }
      }
      return false;
    },
    resourceSelected: function(type, resource) {
      const result = {paneIndex: this.index, type: type, resource: resource};
      if (this.updateTooltipContent(result)) {
        this.showTooltip(result);
      }
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
      tooltipTop: 0,
      tooltipLeft:0, 
      tPlacement: "bottom",
      tContent: {
        title: "Test",
        description: "Description", 
        actions: [
          {
            title: "View 3D scaffold",
            url: "placeholder"
          },
          {
            title: "View plot",
            url: "placeholder"
          }
        ]
      },
      tVisible: false,
      tStyle: {
        top: "200px",
        left: "400px",
        position: "absolute"
      }
    }
  },
  mounted: function() {
    this.isReady = true;
    if (this.entry.mode === "main")
      this.className = "parent-dialog-full";
    if (this.entry.type === 'Scaffold') 
      this.scaffoldCamera = this.$refs.scaffold.$module.scene.getZincCameraControls();
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
    },
    tooltipTop: function() {
      this.tStyle.top = this.tooltipTop + "px";
    },
    tooltipLeft: function() {
      this.tStyle.left = this.tooltipLeft + "px";
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
