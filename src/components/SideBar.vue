<template>
  <div v-if="sideBarOpen" class="side-bar">
    <el-card class="box-card">
      <div slot="header" class="header">
        <el-input
          class="search-input"
          placeholder="Search"
          v-model="searchInput"
          @keyup.native="searchSciCrunch"
          clearable
        ></el-input>
        <el-button @click="searchSciCrunch">Search</el-button>
        <i class="el-icon-close" style="float: right; padding: 3px 0" @click="close"></i>
      </div>

      <div class="content">
          <div v-for="o in results" :key="o.id" class="step-item">
            <DatasetCard :entry="o"></DatasetCard>
          </div>
      </div>
    </el-card>
  </div>
</template>


<script>
/* eslint-disable no-alert, no-console */
import Vue from "vue";
import { Link, Icon, Card, Button, Select, Input } from "element-ui";
import "element-ui/lib/theme-chalk/index.css";
import lang from "element-ui/lib/locale/lang/en";
import locale from "element-ui/lib/locale";
import DatasetCard from './DatasetCard'

locale.use(lang);
Vue.use(Link);
Vue.use(Icon);
Vue.use(Card);
Vue.use(Button);
Vue.use(Select);
Vue.use(Input);

var api_location = "http://localhost:8089/search/";

export default {
  components: { DatasetCard },
  name: "SideBar",
  props: {
    /**
     * Object containing information for
     * the required viewing.
     */
    entry: Object,
  },
  data: function () {
    return {
      searchInput: "",
      results: [],
      sideBarOpen: true
    };
  },
  methods: {
    close: function () {
      this.sideBarOpen = false
    },
    searchSciCrunch: function (event = false) {
      if (event.keyCode === 13 || event instanceof MouseEvent) {
        this.callSciCrunch();
      }
    },
    callSciCrunch: function () {
      fetch(api_location + this.searchInput)
        .then((response) => response.json())
        .then((data) => {
          this.results = [];
          let id = 0;
          data.forEach((element) => {
            this.results.push({ 
              description: element.name,
              id: id
            });
            id++;
          });
        });
        console.log(this.results)
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

.side-bar{
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
  border: solid 1px var(--pale-grey);
  background-color: #f7faff;
}
.step-item {
  font-size: 14px;
  margin-bottom: 18px;
  text-align: left;
}
.search-input {
  width: 298px;
  height: 40px;
  padding-right: 14px;
  align-items: left;
}

.header {
  height: 50px;
  border: solid 1px #292b66;
  background-color: #292b66;
  text-align: left;
}

>>> .el-card__header {
  background-color: #292b66;
  border: solid 1px #292b66;
}
.el-icon-close {
  font-size: 32px;
  width: 16px;
  height: 16px;
  color: #f9f9fa;
  padding-right: 32px;
}

.content {
  width: 518px;
  height: 1000px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
  border: solid 1px var(--pale-grey);
  background-color: #ffffff;
  padding-top: 40px;
}

.box-card {
  width: 560px;
  height: 866px;
  overflow: auto;
}

.active {
  width: 380px !important;
  height: 380px !important;
}
</style>
