<template>
  <el-dialog title="Neuron information" width="30%" :visible.sync="dialogVisible" :modal=false :append-to-body=false center>
    <el-row :gutter="10">
      <el-col :span="8">Name</el-col>
      <el-col :span="16">Vagus nerve</el-col>
    </el-row>
    <el-row style="margin-top:10px">
      <el-col :span="8">Nerve Ending</el-col>
      <el-col :span="16">Region1, Region2</el-col>
    </el-row>
    <el-row style="margin-top:10px">
      <el-col :span="8">Nerve branching</el-col>
      <el-col :span="16">Other nerves</el-col>
    </el-row>
    <el-row style="margin-top:10px">
      <el-col :span="8">Related Datasets</el-col>
      <el-col :span="16">16, 60, 90, 169</el-col>
    </el-row>

    <el-row style="margin-top:20px">
      <el-button type="primary" @click="dialogVisible = false">Confirm</el-button>
    </el-row>
  </el-dialog>
</template>


<script>
/* eslint-disable no-alert, no-console */
import Vue from "vue";
import { Button, Col, Dialog, Row } from "element-ui";
import lang from "element-ui/lib/locale/lang/en";
import locale from "element-ui/lib/locale";

locale.use(lang);
Vue.use(Button);
Vue.use(Col);
Vue.use(Dialog);
Vue.use(Row);

export default {
  name: "InformationDialog",
  props: {
    entry: Object,
  },
  data: function() {
    return  {
      dialogVisible: false,
    }
  },
  methods: {
    display: function(){
      this.dialogVisible = true
    },
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import "~element-ui/packages/theme-chalk/src/button";
@import "~element-ui/packages/theme-chalk/src/col";
@import "~element-ui/packages/theme-chalk/src/dialog";
@import "~element-ui/packages/theme-chalk/src/row";
</style>
