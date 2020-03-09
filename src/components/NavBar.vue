<template>
  <div class="banner-container" ref="container">
    <el-menu
      :default-active="activeIndex"
      class="el-menu-demo"
      mode="horizontal"
      @select="handleSelect"
    >
      <el-menu-item index="1" class="sparc-menu-item">Logo</el-menu-item>
      <el-menu-item index="2">About</el-menu-item>
      <el-submenu index="3">
        <template slot="title">Explore data</template>
        <el-menu-item index="3-1">item one</el-menu-item>
        <el-menu-item index="3-2">item two</el-menu-item>
        <el-menu-item index="3-3">item three</el-menu-item>
      </el-submenu>
      <el-submenu index="4">
        <template slot="title">Learn</template>
        <el-menu-item index="4-1">item one</el-menu-item>
        <el-menu-item index="4-2">item two</el-menu-item>
        <el-menu-item index="4-3">item three</el-menu-item>
      </el-submenu>
      <el-menu-item index="5">News</el-menu-item>
      <el-submenu index="6">
        <template slot="title">Community</template>
        <el-menu-item index="6-1">item one</el-menu-item>
        <el-menu-item index="6-2">item two</el-menu-item>
        <el-menu-item index="6-3">item three</el-menu-item>
      </el-submenu>
      <el-submenu index="7">
        <template slot="title">Support</template>
        <el-menu-item index="7-1">item one</el-menu-item>
        <el-menu-item index="7-2">item two</el-menu-item>
        <el-menu-item index="7-3">item three</el-menu-item>
      </el-submenu>
      <el-menu-item index="2" align-right>Search</el-menu-item>
    </el-menu>
    <div class="line"></div>
  </div>
</template>


<script>
/* eslint-disable no-alert, no-console */
import Vue from "vue";
import { Menu, MenuItem, Submenu } from "element-ui";
import "element-ui/lib/theme-chalk/index.css";
import lang from "element-ui/lib/locale/lang/en";
import locale from "element-ui/lib/locale";
locale.use(lang);
Vue.use(Menu);
Vue.use(MenuItem);
Vue.use(Submenu);

export default {
  name: "NavBar",
  components: {},
  props: { entry: Object },
  methods: {},
  data: function() {
    return {
      activeIndex: "1"
    };
  },
  mounted: function() {}
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.tab-container {
  height: 100%;
  width: 100%;
}
</style>
