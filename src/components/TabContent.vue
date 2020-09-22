<template>
  <div class="tab-container" ref="container">
     <splitpanes class="default-theme" :horizontal="horizontal">
      <pane v-for="(child, index) in entry.panes" :key="child.resource">
        <FlatmapVuer v-if="child.type === 'Flatmap'" :entry="child.resource" @resource-selected="resourceSelected(index+1, child.type, $event)"  :name="child.resource"  style="height:100%;width:100%;"/>
        <ScaffoldVuer v-else-if="child.type === 'Scaffold'" :url="child.resource" @scaffold-selected="resourceSelected(index+1, child.type, $event)" ref="scaffold" />
        <PlotVuer v-else-if="child.type === 'Plot'" :url="child.resource"></PlotVuer>
        <el-button-group v-if="index>0" class="button-group">
          <el-button type="primary" @click="dock(index+1)" size="mini" icon="el-icon-caret-top"></el-button>
          <el-button type="primary" @click="close(index+1)" size="mini" icon="el-icon-close"></el-button>
        </el-button-group>
      </pane>
    </splitpanes>
    <el-dialog
      v-if="overlay"
      title="3D-Scaffold"
      :visible="visibleFlag"
      :modal="modalFlag"
      :modal-append-to-body="appendToBody"
      top="20px"
      width="80%"
      center
      @close="dialogClose">
      <div class="scaffoldDialog" :style="computedStyle">
        <ScaffoldVuer :url="scaffoldURL" ref="scaffold"/>
      </div>
    </el-dialog>
  </div>
</template>


<script>
/* eslint-disable no-alert, no-console */
import { FlatmapVuer, MultiFlatmapVuer } from '@abi-software/flatmapvuer';
import { ScaffoldVuer } from '@abi-software/scaffoldvuer';
import { PlotVuer } from '@abi-software/plotvuer';
import { Splitpanes, Pane } from 'splitpanes';

import Vue from "vue";
import {
  Button,
  ButtonGroup,
  Dialog,
  Icon,
  FlatmapVuer,
  MultiFlatmapVuer,
  ScaffoldVuer,
  PlotVuer,
} from "element-ui";
import lang from "element-ui/lib/locale/lang/en";
import locale from "element-ui/lib/locale";
locale.use(lang);
Vue.use(Button);
Vue.use(ButtonGroup);
Vue.use(Dialog);
Vue.use(Icon);


export default {
  name: "TabContent",
  components: { Splitpanes, Pane },
  props: {entry: Object},
  methods: {
    close: function(index) {
      const result = {action: "onclose", paneIndex: index};
      this.$emit("pane-changed", result);
    },
    dock: function(index) {
      const result = {action: "ondock", paneIndex: index};
      this.$emit("pane-changed", result);
    },
    resourceSelected: function(index, type, resource) {
        const result = {paneIndex: index, type: type, resource: resource};
        this.$emit("resource-selected", result);
    },
    dialogClose: function() {
      this.visibleFlag = false;
    },
  },
  data: function() {
    return {
      horizontal: false,
      appendToBody: false,
      visibleFlag: false,
      modalFlag: true,
      scaffoldURL: undefined,
      overlay: false,
      computedStyle: {height:"500px"}
    }
  },
  mounted: function() {
    if (this.$refs.container) {
      let calculatedHeight = Math.floor(this.$refs.container.clientHeight * 0.8);
      this.computedStyle.height = calculatedHeight +"px";
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.tab-container {
  height: 100%;
  width: 100%;
}

.scaffoldDialog {
  width:100%;
  min-height:500px;
}

.multipane {
  height:100%;
}

.splitpanes.default-theme .splitpanes__pane {
  background-color: white;
  position:relative;
}

.splitpanes.default-theme .splitpanes__splitter {
  background-color: #f5f7fa;
}

.button-group {
  position: absolute;
  top:1%;
  right:1%;
}
</style>
<style scoped src="@abi-software/flatmapvuer/dist/flatmapvuer.css">
</style>
<style scoped src="@abi-software/scaffoldvuer/dist/scaffoldvuer.css">
</style>
<style scoped src="@abi-software/plotvuer/dist/plotvuer.css">
</style>
<style scoped src='splitpanes/dist/splitpanes.css'>
</style>
<style scoped src='element-ui/lib/theme-chalk/button.css'>
</style>
<style scoped src='element-ui/lib/theme-chalk/button-group.css'>
</style>
<style scoped src='element-ui/lib/theme-chalk/dialog.css'>
</style>
<style scoped src='element-ui/lib/theme-chalk/icon.css'>
</style>
