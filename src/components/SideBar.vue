<template>
<el-drawer class="side-bar"
  :visible.sync="drawerOpen"
  :appendToBody=false
  :size="'550'"
  :with-header="false">
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
      <SearchFilters class="filters" :entry="filterEntry"></SearchFilters>
      <div class="content">
        <span v-if="results.length > 0" class="dataset-table-title">Title</span>
        <span v-if="results.length > 0" class="dataset-table-title">Image</span>
          <div v-for="o in results" :key="o.id" class="step-item">
            <DatasetCard :entry="o"></DatasetCard>
          </div>
      </div>
    </el-card>
  </el-drawer>
</template>


<script>
/* eslint-disable no-alert, no-console */
import Vue from "vue";
import { Link, Icon, Card, Button, Select, Input, Drawer } from "element-ui";
import "element-ui/lib/theme-chalk/index.css";
import lang from "element-ui/lib/locale/lang/en";
import locale from "element-ui/lib/locale";
import SearchFilters from './SearchFilters'
import DatasetCard from './DatasetCard';

locale.use(lang);
Vue.use(Link);
Vue.use(Icon);
Vue.use(Card);
Vue.use(Button);
Vue.use(Select);
Vue.use(Input);
Vue.use(Drawer);

var api_location = "http://localhost:8089/search/";

export default {
  components: { SearchFilters, DatasetCard },
  name: "SideBar",
  props: ['visible', 'search'],
  data: function () {
    return {
      searchInput: '',
      lastSearch: '',
      results: [],
      drawerOpen: false,
      numberOfHits: 0
    };
  },
  computed: {
    filterEntry: function(){
      return {
        results: this.results,
        lastSearch: this.lastSearch,
        numberOfHits: this.numberOfHits,
      }
    },
  },
  watch: {
    search: function(val){
      console.log('search change found')
      this.searchInput = val;
      this.lastSearch = val;
    }
  },
  methods: {
    close: function () {
      this.drawerOpen = false
    },
    open: function(){
      this.drawerOpen = true
      this.callSciCrunch()
    },
    searchSciCrunch: function (event = false) {
      if (event.keyCode === 13 || event instanceof MouseEvent) {
        this.callSciCrunch();
      }
    },
    callSciCrunch: function () {
      this.lastSearch = this.searchInput
      fetch(api_location + this.searchInput)
        .then((response) => response.json())
        .then((data) => {
          this.results = [];
          let id = 0;
          this.numberOfHits = data.numberOfHits
          data.results.forEach((element) => {
            console.log(element)
            this.results.push({ 
              description: element.name,
              contributors: element.contributors,
              numberSamples: Array.isArray(element.sample) ? element.sample.length : 1,
              sexes: element.attributes ? [...new Set(element.attributes.map((v) => v.sex.value))] : undefined, // This processing only includes each gender once into 'sexes'
              age: element.attributes ? ('ageCategory' in element.attributes[0] ? element.attributes[0].ageCategory.value : undefined) : undefined,
              updated: element.updated[0].timestamp.split('T')[0],
              url: element.current[0].uri,
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

.filters{
  height: 190px;
  witdth: 518px;
}

.dataset-results-feedback{
  width: 215px;
  height: 16px;
  font-family: Asap;
  font-size: 14px;
  font-weight: 500;
  font-stretch: normal;
  font-style: normal;
  line-height: normal;
  letter-spacing: normal;
  color: #292b66;
}

.dataset-table-title{
  width: 28px;
  height: 16px;
  font-family: Asap;
  text-align: left !important;
  padding-left: 16px;
  padding-right: 70px;
  font-size: 14px;
  font-weight: 500;
  font-stretch: normal;
  font-style: normal;
  line-height: normal;
  letter-spacing: normal;
  color: var(--slate-grey);
}

.image-table-title{
  width: 39px;
  height: 16px;
  padding-left: 50px;
  font-family: Asap;
  font-size: 14px;
  font-weight: 500;
  font-stretch: normal;
  font-style: normal;
  line-height: normal;
  letter-spacing: normal;
  color: var(--slate-grey);
}


>>> .el-card__header {
  background-color: #292b66;
  border: solid 1px #292b66;
}

>>> .el-card__body{
 background-color: #F7FAFF; 
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
  padding-top: 18px;
}

.box-card {
  height: 100%;
  overflow: auto;
}

.active {
  width: 380px !important;
  height: 380px !important;
}
</style>
