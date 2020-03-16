<template>
  <div>
    <el-row class="content">
      <div class="title" v-for="title in dialogTitles" :key="title">
        <div  class="title-text">
          {{title}}
        </div>
      </div>
    </el-row>
    <el-row class="icon-group">
      <el-button class="icon-transform" icon="el-icon-copy-document" size="medium" type="text" @click="onMaximise"></el-button>
      <el-button icon="el-icon-remove-outline" size="medium" type="text" @click="onMinimise"></el-button>
      <el-button icon="el-icon-close" size="medium" type="text" @click="onClose"></el-button>
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
  props: {dialogTitles: Array},
  methods: {
    onMaximise: function() {
      this.$emit("maximise");
    },
    onMinimise: function() {
      this.$emit("minimise");
    },
    onClose: function() {
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
  border-bottom: solid 1px #dcdfe6;
  display:inline-block;
}

.title-text {
  padding-top:9px;
  text-align:center;
}

.parent-dialog:hover .title-text {
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

</style>
