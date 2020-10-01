<template>
  <div class="banner-container" ref="container">
    
    <el-menu
      :default-active="activeIndex"
      class="navbar"
      mode="horizontal"
      menu-trigger="click"
    >
      <el-menu-item index="1" class="sparc-menu-item">
        <img :src="sparcLogo" class="sparc-navbar-logo"/>
      </el-menu-item>
      <el-menu-item index="2">About</el-menu-item>
      <el-submenu index="3">
        <template slot="title">Explore data</template>
          <el-row style="width: 100vw">
            <el-col :span="24/learnCards.length" v-for="item in learnCards" :key="item.title">
              <nav-drop-down-item :image="item.image" :title="item.title" :description="item.description"/>
            </el-col>
          </el-row>
   
      </el-submenu>
      <el-submenu index="4"  >
        <template slot="title"  >Learn</template>
        <el-menu-item index="4-1">item one</el-menu-item>
        <el-menu-item index="4-2">item two</el-menu-item>
        <el-menu-item index="4-3">item three</el-menu-item>
      </el-submenu>
      <el-menu-item index="5">News</el-menu-item>
      <el-submenu index="6" style="">
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
import NavDropDownItem from './NavDropDownItem'
import Vue from "vue";
import { Menu, MenuItem, Submenu, Row, Col} from "element-ui";
import lang from "element-ui/lib/locale/lang/en";
import locale from "element-ui/lib/locale";
import exploreDatasetImage from "../../assets/exploreDataset-192px.png"
import exploreMapImage from "../../assets/exploreData2Dmap-192px.png"

locale.use(lang);
Vue.use(Menu);
Vue.use(MenuItem);
Vue.use(Submenu);
Vue.use(Row)
Vue.use(Col)

export default {
  name: "NavBar",
  components: {NavDropDownItem},
  props: { entry: Object },
  methods: {},
  data: function() {
    return {
      activeIndex: "1",
      sparcLogo: require('../../assets/sparc-logo-primary.svg'),
      learnCards: [
        {
          image: exploreDatasetImage,
          title: 'Datasets',
          description: 'Filter dataset by species, organ, age, and view data type in 3d scaffold, heatmap, and graph. Dive deeper to data modality, sample count, citation, author’s name and date release. '
        },
       {
          image: exploreMapImage,
          title: '2D Flatmap/2D visualisations',
          description: 'Advanced 2d flatmap, visualising anatomical map by species. Navigate organ on the 2d flatmap to download and view dataset, immerse yourself in the 3d scaffold simulation, view heatmap and graph. All type of dataset in one, from the 2d anatomical flatmap. '
        }
      ]
    };
  },
  mounted: function() {}
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.navbar{
  min-width: 1000px;
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
  width: 45px;
}
.grid-content {
  border-radius: 4px;
  min-height: 36px;
}

.el-menu--horizontal .el-menu-item:not(.is-disabled):hover{
  color: var(--vibrant-purple);  
}

.el-submenu.is-opened >>> .el-submenu__title{
  color: var(--vibrant-purple); 
}

.el-submenu__title:hover{
  color: var(--vibrant-purple) !important; 
}
</style>
<style scoped src='element-ui/lib/theme-chalk/menu.css'>
</style>
<style scoped src='element-ui/lib/theme-chalk/menu-item.css'>
</style>
<style scoped src='element-ui/lib/theme-chalk/submenu.css'>
</style>
<style scoped src='element-ui/lib/theme-chalk/row.css'>
</style>
<style scoped src='element-ui/lib/theme-chalk/col.css'>
</style>
