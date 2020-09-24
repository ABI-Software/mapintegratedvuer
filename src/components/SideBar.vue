<template>
  <div>
    <div v-if="!drawerOpen" @click="close" class="open-tab">
      <i class="el-icon-arrow-left"></i>
    </div>
    <el-drawer
      class="side-bar"
      :visible.sync="drawerOpen"
      :appendToBody="false"
      :size="'550'"
      :with-header="false"
      :wrapperClosable="false"
      v-if="isDrawer"
    >
      <el-card class="box-card">
        <div slot="header" class="header">
          <el-input
            class="search-input"
            placeholder="Search"
            v-model="searchInput"
            @keyup.native="searchEvent"
            clearable
          ></el-input>
          <el-button @click="searchEvent">Search</el-button>
          <i class="el-icon-copy-document" style="float: right; padding: 3px 0" @click="dock"></i>
        </div>
        <SearchFilters class="filters" :entry="filterEntry" @filterResults="filterUpdate" @numberPerPage="numberPerPageUpdate"></SearchFilters>
        <el-pagination class="pagination" hide-on-single-page small layout="prev, pager, next" :total="numberOfHits" @current-change="pageChange"></el-pagination>
        <div class="wrapper">
          <div class="wrapper-left">
            <i class="el-icon-arrow-right" @click="close"></i>
          </div>
          <div class="wrapper-right">
            <div class="content scrollbar"  v-loading="loadingCards">
              <div class="card-container">
                <span v-if="results.length > 0" class="dataset-table-title">Title</span>
                <span v-if="results.length > 0" class="image-table-title">Image</span>
              </div>
              <div v-for="o in results" :key="o.id" class="step-item">
                <DatasetCard :entry="o"></DatasetCard>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </el-drawer>
    <el-card v-if="!isDrawer" class="box-card">
        <div slot="header" class="header">
          <el-input
            class="search-input"
            placeholder="Search"
            v-model="searchInput"
            @keyup.native="searchEvent"
            clearable
          ></el-input>
          <el-button @click="searchEvent">Search</el-button>
        </div>
        <SearchFilters class="filters" :entry="filterEntry" @filterResults="filterUpdate" @numberPerPage="numberPerPageUpdate"></SearchFilters>
        <el-pagination class="pagination" hide-on-single-page small layout="prev, pager, next" :total="numberOfHits" @current-change="pageChange"></el-pagination>
        <div class="wrapper">
          <div class="wrapper-left">
          </div>
          <div class="wrapper-right">
            <div class="content scrollbar"  v-loading="loadingCards">
              <div class="card-container">
                <span v-if="results.length > 0" class="dataset-table-title">Title</span>
                <span v-if="results.length > 0" class="image-table-title">Image</span>
              </div>
              <div v-for="o in results" :key="o.id" class="step-item">
                <DatasetCard :entry="o"></DatasetCard>
              </div>
            </div>
          </div>
        </div>
      </el-card>
  </div>
</template>


<script>
/* eslint-disable no-alert, no-console */
import Vue from "vue";
import {
  Link,
  Icon,
  Card,
  Button,
  Select,
  Input,
  Drawer,
  Pagination,
  Loading,
} from "element-ui";
import "element-ui/lib/theme-chalk/index.css";
import lang from "element-ui/lib/locale/lang/en";
import locale from "element-ui/lib/locale";
import SearchFilters from "./SearchFilters";
import DatasetCard from "./DatasetCard";
import EventBus from './EventBus';

locale.use(lang);
Vue.use(Link);
Vue.use(Icon);
Vue.use(Card);
Vue.use(Button);
Vue.use(Select);
Vue.use(Input);
Vue.use(Drawer);
Vue.use(Pagination);
Vue.use(Loading)

var api_location = process.env.VUE_APP_API_LOCATION + "filter-search/";

var initial_state = {
      searchInput: "",
      lastSearch: "",
      results: [],
      drawerOpen: false,
      numberOfHits: 0,
      filter:{},
      loadingCards: false,
      numberPerPage: 10,
      page: 1,
      start: 0
}

export default {
  components: { SearchFilters, DatasetCard },
  name: "SideBar",
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    isDrawer: {
      type: Boolean,
      default: true
    },
    entry: {
      type: Object,
      default: () => (initial_state)
    }
  },
  data: function () {
    return {...this.entry}
  },
  computed: {
    filterEntry: function () {
      return {
        results: this.results,
        lastSearch: this.lastSearch,
        numberOfHits: this.numberOfHits,
      };
    },
  },
  watch: {
    search: function (val) {
      this.searchInput = val;
      this.lastSearch = val;
    },
  },
  methods: {
    close: function () {
      this.drawerOpen = !this.drawerOpen;
      if(this.drawerOpen){
        this.openSearch(this.searchInput);
      }
    },
    openSearch: function (search) {
      this.drawerOpen = true;
      if (this.searchInput !== search){
        this.searchInput = search;
        this.searchSciCrunch(search);
      }
    },
    dock: function(){
      EventBus.$emit("PopoverActionClick", {'type': 'Search', 'entry':this.$data});
      this.drawerOpen = false;
    },
    searchEvent: function (event = false) {
      if (event.keyCode === 13 || event instanceof MouseEvent) {
        this.searchSciCrunch(this.searchInput);
      }
    },
    filterUpdate: function(filter){
      if(filter.facet === undefined){
        this.filter = {}
      } else {
        this.filter = filter
      }
      this.searchSciCrunch(this.searchInput)
    },
    numberPerPageUpdate: function (val) {
      this.numberPerPage = val;
      this.pageChange(1);
    },
    pageChange: function(page){
      this.start = (page-1) * this.numberPerPage;
      this.searchSciCrunch(this.searchInput);
    },
    searchSciCrunch: function (search) {
      this.loadingCards = true;
      let params = this.filter;
      params.size = this.numberPerPage;
      params.start = this.start;
      this.callSciCrunch(api_location, search, params).then((result) => {
        this.resultsProcessing(result);
        this.loadingCards = false;
      });
    },
    resultsProcessing: function (data) {
      this.lastSearch = this.searchInput
      this.results = [];
      let id = 0;
      this.numberOfHits = data.numberOfHits;
      if (data.results.length === 0){
        return
      }
      data.results.forEach((element) => {
        this.results.push({
          description: element.name,
          contributors: element.contributors,
          numberSamples: Array.isArray(element.sample)
            ? element.sample.length
            : 1,
          sexes: element.attributes
            ? element.attributes.sex
              ? [...new Set(element.attributes.map((v) => v.sex.value))]
              : undefined
            : undefined, // This processing only includes each gender once into 'sexes'
          age: element.attributes
            ? "ageCategory" in element.attributes[0]
              ? element.attributes[0].ageCategory.value
              : undefined
            : undefined,
          updated: element.updated[0].timestamp.split("T")[0],
          url: element.current[0].uri,
          datasetId: element.identifier,
          id: id,
        });
        id++;
      });
    },
    callSciCrunch: function (api_location, search, params={}) {
      return new Promise((resolve) => {
        var endpoint = api_location;
        // Add parameters if we are sent them
        if (search !== '' && Object.entries(params).length !== 0){
          endpoint = api_location + search + '/?' + (new URLSearchParams(params)).toString();
        }
        fetch(endpoint)
          .then((response) => response.json())
          .then((data) => {
            resolve(data);
          });
      });
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.side-bar{
  position: relative;
  height: 100%;
}

.open-tab{
  width: 20px;
  height: 40px;
  z-index: 25;
  position: absolute;
  top: calc(50vh - 80px);
  right: 0px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
  border: solid 1px var(--pale-grey);
  background-color: #F7FAFF;
  text-align: center;
  vertical-align: middle;
  cursor: pointer;
}

.el-icon-arrow-left{
  font-size: 20px;
  padding-top: 8px;
  color: #292b66;
}

.box-card{
  pointer-events: auto;
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

.filters {
  witdth: 518px;
}

.pagination {
  padding-top: 10px;
  background-color: #F7FAFF;
}

.pagination>>>button{
  background-color: #F7FAFF !important;
}
.pagination>>>li{
  background-color: #F7FAFF !important;
}
.pagination>>>li.active{
  color: var(--vibrant-purple);
}

.dataset-results-feedback {
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

.card-container {
  display: flex;
  position: sticky;
  top:0;
  background-color: white;
  z-index: 300;
  padding-top: 10px;
  height: 20px;
  border-bottom: 1px solid var(--pale-grey);
}

.dataset-table-title {
  flex: 1.3;
  height: 16px;
  font-family: Asap;
  text-align: left !important;
  padding-left: 16px;
  font-size: 14px;
  font-weight: 500;
  font-stretch: normal;
  font-style: normal;
  line-height: normal;
  letter-spacing: normal;
  color: var(--slate-grey);
}

.image-table-title {
  flex: 1;
  padding-left: 16px;
  font-family: Asap;
  text-align: left !important;
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

>>> .el-card__body {
  background-color: #f7faff;
}

.wrapper{
  display: flex;
  flex-direction: row;
}

.el-icon-copy-document{
  cursor: pointer;
  font-size: 32px;
  width: 16px;
  height: 16px;
  color: #f9f9fa;
  padding-right: 32px;
}

.el-icon-arrow-right{
  cursor: pointer;
  font-size: 20px;
  top: 50%; 
  position: absolute;
  left: 0;
}

.content {
  width: 518px;
  height: 48rem;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
  border: solid 1px var(--pale-grey);
  background-color: #ffffff;
  overflow-y: scroll;
}

.box-card {
  height: 100%;
  overflow: auto;
}

.active {
  width: 380px !important;
  height: 380px !important;
}

.scrollbar::-webkit-scrollbar-track {
  border-radius: 10px;
  background-color: #f5f5f5;
}

.scrollbar::-webkit-scrollbar {
  width: 12px;
  background-color: #f5f5f5;
}

.scrollbar::-webkit-scrollbar-thumb {
  border-radius: 4px;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.06);
  background-color: #979797;
}

>>> .el-input__suffix{
  padding-right: 10px;
}

</style>
<style>
.v-modal{
  pointer-events: none;
  opacity: 0;
}
.el-drawer__wrapper{
  pointer-events: none;
}
</style>