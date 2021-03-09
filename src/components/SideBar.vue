<template>
  <div>
    <div v-if="!drawerOpen" @click="close" class="open-tab">
      <i class="el-icon-arrow-left"></i>
    </div>

    <el-drawer
      custom-class="my-drawer"
      class="side-bar"
      :visible.sync="drawerOpen"
      :appendToBody="false"
      :modal-append-to-body="false"
      size=550
      :with-header="false"
      :wrapperClosable="false"
      :modal="false"
    >
    <div>
      <div v-if="drawerOpen" @click="close" class="close-tab">
        <i class="el-icon-arrow-right"></i>
      </div>
        <el-card class="box-card">
          <div slot="header" class="header">
            <el-input
              class="search-input"
              placeholder="Search"
              v-model="searchInput"
              @keyup.native="searchEvent"
              clearable
              @clear="clearSearchClicked"
            ></el-input>
            <el-button class="button" @click="searchEvent">Search</el-button>
          </div>
          <SearchFilters class="filters" ref="filtersRef" :entry="filterEntry" @filterResults="filterUpdate" @numberPerPage="numberPerPageUpdate"></SearchFilters>
          <div class="content scrollbar"  v-loading="loadingCards" ref="content">
            <div class="error-feedback" v-if="results.length === 0 && !loadingCards && !sciCrunchError">
              No results found - Please change your search / filter criteria.
            </div>
            <div class="error-feedback" v-if="sciCrunchError">{{sciCrunchError}}</div>
            <div v-for="o in results" :key="o.id" class="step-item">
              <DatasetCard :entry="o"></DatasetCard>
            </div>
            <el-pagination
              class="pagination"
              :current-page.sync="page"
              hide-on-single-page
              large
              layout="prev, pager, next"
              :page-size="numberPerPage"
              :total="numberOfHits"
              @current-change="pageChange">
            </el-pagination>
          </div>
        </el-card>
      </div>
    </el-drawer>
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
import store from '../store';

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

// handleErrors: A custom fetch error handler to recieve messages from the server
//    even when an error is found
var handleErrors = async function(response) {
    if (!response.ok) {
      let parse = await response.json()
      if (parse){
        throw new Error(parse.message)
      } else {
        throw new Error(response)
      }
    }
  return response;
}

var initial_state = {
      searchInput: "",
      lastSearch: "",
      results: [],
      drawerOpen: false,
      numberOfHits: 0,
      filter:{},
      filterFacet: undefined,
      loadingCards: false,
      numberPerPage: 10,
      page: 1,
      pageModel: 1,
      start: 0,
      hasSearched: false,
      sciCrunchError: false
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
    return {
      ...this.entry,
    }
  },
  computed: {
    // This computed property populates filter data's entry object with $data from this sidebar
    filterEntry: function () {
      return {
        results: this.results,
        lastSearch: this.lastSearch,
        numberOfHits: this.numberOfHits,
        filterFacet: this.filterFacet
      };
    },
  },
  methods: {
    close: function () {
      this.drawerOpen = !this.drawerOpen;
      if(this.drawerOpen && !this.hasSearched){
        this.openSearch(this.searchInput);
      }
    },
    openSearch: function (search, filter=undefined) {
      this.drawerOpen = true;
      this.searchInput = search;
      this.resetPageNavigation()
      this.searchSciCrunch(search, filter);
      if (filter){
        this.filterFacet = filter[0].facet;
        EventBus.$emit("filterUiUpdate", filter[0].facet);
      }
    },
    clearSearchClicked: function(){
      this.searchInput = ''
      this.resetPageNavigation()
      this.searchSciCrunch(this.searchInput)
    },
    dock: function(){
      EventBus.$emit("PopoverActionClick", {'type': 'Search', 'entry':this.$data});
      this.drawerOpen = false;
    },
    searchEvent: function (event = false) {
      if (event.keyCode === 13 || event instanceof MouseEvent) {
        this.resetPageNavigation()
        this.searchSciCrunch(this.searchInput);
      }
    },
    filterUpdate: function(filter){
      this.resetPageNavigation()
      this.searchSciCrunch(this.searchInput, filter);
      this.filter = filter
    },
    numberPerPageUpdate: function (val) {
      this.numberPerPage = val;
      this.pageChange(1);
    },
    pageChange: function(page){
      this.start = (page-1) * this.numberPerPage;
      this.searchSciCrunch(this.searchInput);
    },
    searchSciCrunch: function (search, filter=undefined) {
      this.loadingCards = true;
      this.results = [];
      this.disableCards();
      let params = this.createParams(filter, this.start, this.numberPerPage)
      this.callSciCrunch(this.apiLocation, this.searchEndpoint, search, params).then((result) => {
        this.sciCrunchError = false
        this.resultsProcessing(result)
        this.$refs.content.style['overflow-y'] = 'scroll'
      }).catch((result) => {
        this.sciCrunchError = result.message
      }).finally(() => {
        this.loadingCards = false
      })
    },
    disableCards: function(){
      if(this.$refs.content){
        this.$refs.content.scroll({top:0, behavior:'smooth'})
        this.$refs.content.style['overflow-y'] = 'hidden'
      }
    },
    resetPageNavigation: function(){
      this.start = 0
      this.page = 1
    },
    createParams: function(filter, start, size){
      var params = {}
      if (filter !== undefined){
        params = filter
      } else {
         params = this.filter;
      }
      if(params.length > 0){
        for(let i in params){
          if(params[i].start){
            params[i].start = start
            params[i].size = size
          }
        }
      } else {
        params.start = start
        params.size = size
        params = [params]
      }
      return params
    },
    resultsProcessing: function (data) {
      // Manually add an entry for the Fabbri et al. model since it's not yet
      // referenced by SciCrunch.
      this.results = [];
      let id = 0;
      this.results.push({
        description: "Computational analysis of the human sinus node action potential: model development and effects of mutations",
        contributors: [{name: "Fabbri, Alan"}, {name: "Fantini, Matteo"}, {name: "Wilders, Ronald"}, {name: "Severi, Stefano"}],
        numberSamples: 0,
        sexes: undefined,
        organs: ["heart"],
        ages: undefined,
        updated: undefined,
        url: {uri: "https://models.physiomeproject.org/e/611"},
        datasetId: undefined,
        csvFiles: undefined,
        id: id++,
        doi: "https://doi.org/10.1113/jp273259",
        scaffold: false,
        scaffolds: false,
        simulation: true
      });
      // Add the entries retrieved from SciCrunch.
      this.lastSearch = this.searchInput
      this.numberOfHits = data.numberOfHits;
      if (data.results.length === 0){
        return
      }
      data.results.forEach((element) => {
        this.results.push({
          description: element.name,
          contributors: element.contributors,
          numberSamples: Array.isArray(element.samples)
            ? element.samples.length
            : 1,
          sexes: element.samples
            ? element.samples[0].sex
              ? [...new Set(element.samples.map((v) => v.sex.value))]
              : undefined
            : undefined, // This processing only includes each gender once into 'sexes'
          organs: element.organs
            ? [...new Set(element.organs.map((v) => v.name))]
            : undefined,
          ages: element.samples
            ? "ageCategory" in element.samples[0]
              ? [...new Set(element.samples.map((v) => v.ageCategory.value))]
              : undefined
            : undefined,
          updated: element.updated[0].timestamp.split("T")[0],
          url: element.uri[0],
          datasetId: element.identifier,
          csvFiles: element.csvFiles,
          id: id++,
          doi: element.doi,
          scaffold: element.scaffolds ? true : false,
          scaffolds: element.scaffolds ? element.scaffolds : false
        });
      });
    },
    createfilterParams: function(params){
      var paramsString = ''
      for(let param in params){
        paramsString += (new URLSearchParams(params[param])).toString()
        paramsString += '&'
      }
      paramsString = paramsString.slice(0, -1);
      return paramsString
    },
    callSciCrunch: function (apiLocation, searchEndpoint, search, params={}) {
      return new Promise((resolve, reject) => {
        var endpoint = apiLocation + searchEndpoint;
        // Add parameters if we are sent them
        if (search !== '' && Object.entries(params).length !== 0){
          endpoint = endpoint + search + '/?' + this.createfilterParams(params)
        } else {
          endpoint = endpoint + '?' + this.createfilterParams(params)
        }

        fetch(endpoint)
          .then(handleErrors)
          .then((response) => response.json())
          .then((data) => resolve(data))
          .catch((data) => reject(data))
      });
    },
  },
  created: function () {
    //Create non-reactive local variables
    this.apiLocation = "";
    this.searchEndpoint = "filter-search/";
    if (store.state.settings.api)
      this.apiLocation = store.state.settings.api;
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.side-bar{
  position: relative;
  height: 100%;
  pointer-events: none;
}

.side-bar >>> .el-drawer:focus{
  outline:none;
}

.open-tab{
  width: 20px;
  height: 40px;
  z-index: 8;
  position: absolute;
  top: calc(50vh - 80px);
  right: 0px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
  border: solid 1px #e4e7ed;
  background-color: #F7FAFF;
  text-align: center;
  vertical-align: middle;
  cursor: pointer;
  pointer-events: auto;
}

.el-icon-arrow-left{
  font-size: 20px;
  padding-top: 8px;
  color: #292b66;
}

.el-icon-arrow-right{
  font-size: 20px;
  padding-top: 8px;
  color: #292b66;
  cursor: pointer;
  pointer-events: auto;
}

.close-tab{
  float: left;
  flex: 1;
  width: 20px;
  height: 40px;
  z-index: 8;
  margin-top: calc(50vh - 80px);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
  border: solid 1px #e4e7ed;
  border-right: 0;
  background-color: #F7FAFF;
  text-align: center;
  vertical-align: middle;
  cursor: pointer;
  pointer-events: auto;
}

.button{
  background-color: #8300bf;
  border: #8300bf;
  color: white;
}

.box-card {
  flex: 3;
  height: 100%;
  overflow: hidden;
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
  border: solid 1px #292b66;
  background-color: #292b66;
  text-align: left;
}

.pagination {
  padding-bottom: 16px;
  background-color: white;
  text-align:center;
}

.pagination>>>button{
  background-color: white !important;
}
.pagination>>>li{
  background-color: white !important;
}
.pagination>>>li.active{
  color: #8300bf;
}

.error-feedback{
  font-family: Asap;
  font-size: 14px;
  font-style: italic;
  padding-top: 15px;
}

>>> .el-card__header {
  background-color: #292b66;
  border: solid 1px #292b66;
}

>>> .el-card__body {
  background-color: #f7faff;
  height: calc(100% - 8rem);
  overflow-y: hidden;
}

.content {
  width: 518px;
  height: calc(100vh - 20rem);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
  border: solid 1px #e4e7ed;
  background-color: #ffffff;
  overflow-y: scroll;
  scrollbar-width: thin;
}

.scrollbar::-webkit-scrollbar-track {
  border-radius: 10px;
  background-color: #f5f5f5;
}

.scrollbar::-webkit-scrollbar {
  width: 12px;
  right: -12px;
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

>>> .my-drawer {
  background: rgba(0,0,0,0);
  box-shadow: none;
}

</style>
