<template>
  <div class="banner-container" ref="container">
    
    <el-menu
      :default-active="activeIndex"
      class="navbar"
      mode="horizontal"
      @select="handleSelect"
    >
      <el-menu-item index="1" class="sparc-menu-item">
        <img :src="sparcLogo" class="sparc-navbar-logo"/>
      </el-menu-item>
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
      <el-menu-item index="10" class="align-right">Sign Up</el-menu-item>
      <el-menu-item index="9" class="align-right">Login</el-menu-item>
      <el-menu-item index="8" class="align-right" icon="el-icon-search">
        <i class="el-icon-search"></i>
      </el-menu-item>
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
      activeIndex: "1",
      sparcLogo: require('../../assets/sparc-logo-primary.svg')
    };
  },
  mounted: function() {}
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.navbar{
  min-width: 950px;
}
.tab-container {
  height: 100%;
  width: 100%;
}
.align-right{
  float: right;
}
.sparc-navbar-logo{
  padding-top: 4px;
  width: 38px;
}
</style>
