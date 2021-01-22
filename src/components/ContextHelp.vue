<template>
  <div v-if="showHelp" class="content-container">
    <el-card class="box-card"
      @mouseover.native="isActive = true"
      @mouseleave.native="isActive = false"
      v-bind:class="{active: isActive}">
      <div slot="header" class="header">
        <span>Needing some help?</span>
        <i class="el-icon-close" style="float: right; padding: 3px 0" @click="close"></i>
      </div>
      <div class="content">
      <div v-for="o in steps" :key="o" class="step-item">{{o.description}}</div>
      </div>
    </el-card>
  </div>
</template>

<script>
/* eslint-disable no-alert, no-console */
import Vue from "vue";
import { Link, Icon, Card, Button, Select } from "element-ui";
import "element-ui/lib/theme-chalk/index.css";
import lang from "element-ui/lib/locale/lang/en";
import locale from "element-ui/lib/locale";

locale.use(lang);
Vue.use(Link);
Vue.use(Icon);
Vue.use(Card);
Vue.use(Button);
Vue.use(Select);

export default {
  name: "ContextHelp",
  props: {
    /**
     * Object containing information for
     * the required viewing.
     */
    entry: Object
  },
  data: function() {
    return  {
      isActive: false,
      showHelp: true,
      steps: [
      ]
    }
  },
  methods: {
      close: function(){
        this.showHelp = false
      },

  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.step-item {
  font-size: 14px;
  margin-bottom: 18px;
  text-align: left;
}

.header{
  height: 20px;
}

.box-card {
  width: 280px;
  height: 280px;
  overflow: auto;
}

.active {
    width: 380px !important;
    height: 380px !important;
}
</style>
