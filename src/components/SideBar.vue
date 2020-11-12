<template>
  <div>
    <div v-if="!drawerOpen" @click="close" class="open-tab">
      <i class="el-icon-arrow-left"></i>
    </div>
    <el-drawer
      class="side-bar"
      :visible.sync="drawerOpen"
      :appendToBody="false"
      :modal-append-to-body="false"
      :size="'550'"
      :with-header="false"
      :wrapperClosable="false"
      :modal="false"
    >
      <div class="splitter">
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
            <el-button @click="searchEvent">Search</el-button>
          </div>
          <SearchFilters class="filters" ref="filtersRef" :entry="filterEntry" @filterResults="filterUpdate" @numberPerPage="numberPerPageUpdate"></SearchFilters>
          <el-pagination class="pagination" hide-on-single-page small layout="prev, pager, next" :total="numberOfHits" @current-change="pageChange"></el-pagination>
          <div class="content scrollbar"  v-loading="loadingCards" ref="content">
            <div class="card-container">
              <span v-if="results.length > 0" class="dataset-table-title">Title</span>
              <span v-if="results.length > 0" class="image-table-title">Image</span>
            </div>
            <div v-for="o in results" :key="o.id" class="step-item">
              <DatasetCard :entry="o"></DatasetCard>
            </div>
          </div>
        </el-card>
      </div>
    </el-drawer>
    <el-card v-if="!isDrawer" class="box-card">
        <div slot="header" class="header">
          <el-input
            class="search-input"
            placeholder="Search"
            v-model="searchInput"
            @keyup.native="searchEvent"
            clearable
            @clear="clearSearchClicked"
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
      filterFacet: undefined,
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
      if(this.drawerOpen){
        this.openSearch(this.searchInput);
      }
    },
    openSearch: function (search, filter=undefined) {
      this.drawerOpen = true;
      this.searchInput = search;
      this.searchSciCrunch(search, filter);
      this.filterFacet = filter[0].facet;
    },
    clearSearchClicked: function(){
      this.searchInput = ''
      this.searchSciCrunch(this.searchInput)
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
      if(this.$refs.content){
        this.$refs.content.scroll({top:0, behavior:'smooth'})
        this.$refs.content.style['overflow-y'] = 'hidden'
      } 
      let params = {}
      if (filter !== undefined){
        params = filter
      } else {
         params = this.filter;
      }
      params.size = this.numberPerPage;
      params.start = this.start;
      this.callSciCrunch(api_location, search, params).then((result) => {
        this.resultsProcessing(result);
        this.loadingCards = false;
        this.$refs.content.style['overflow-y'] = 'scroll'
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
          numberSamples: Array.isArray(element.samples)
            ? element.samples.length
            : 1,
          sexes: element.samples
            ? element.samples[0].sex
              ? [...new Set(element.samples.map((v) => v.sex.value))]
              : undefined
            : undefined, // This processing only includes each gender once into 'sexes'
          ages: element.samples
            ? "ageCategory" in element.samples[0]
              ? [...new Set(element.samples.map((v) => v.ageCategory.value))]
              : undefined
            : undefined,
          updated: element.updated[0].timestamp.split("T")[0],
          url: element.uri[0],
          datasetId: element.identifier,
          id: id,
          scaffold: element.scaffolds ? true : false,
          scaffolds: element.scaffolds ? element.scaffolds : false
        });
        id++;
      });
    },
    creatfilterParams: function(params){
      var paramsString = ''
      for(let param in params){
        paramsString += (new URLSearchParams(params[param])).toString()
        paramsString += '&'
      }
      paramsString = paramsString.slice(0, -1);
      return paramsString
    },
    callSciCrunch: function (api_location, search, params={}) {
      console.log('search', search, 'params', params)
      return new Promise((resolve) => {
        var endpoint = api_location;
        // Add parameters if we are sent them
        if (search !== '' && Object.entries(params).length !== 0){
          endpoint = api_location + search + '/?' + this.creatfilterParams(params)
        } else {
          endpoint = api_location + '?' + this.creatfilterParams(params)
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
<!-- Not that splitter flex is currently not working as width is defined by 'content' for some reason -->
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

.splitter{
  display: flex;
  flex-direction: row;
}

.close-tab{
  flex: 1;
  width: 20px;
  height: 40px;
  z-index: 10055;
  position: absolute;
  top: calc(50vh - 80px);
  right: 540px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
  border: solid 1px var(--pale-grey);
  background-color: #F7FAFF;
  text-align: center;
  vertical-align: middle;
  cursor: pointer;
  pointer-events: auto;
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
  height: 50px;
  border: solid 1px #292b66;
  background-color: #292b66;
  text-align: left;
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
  height: calc(100% - 8rem);
  overflow-y: hidden;
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

.content {
  width: 518px;
  height: calc(100vh - 19.5rem);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
  border: solid 1px var(--pale-grey);
  background-color: #ffffff;
  overflow-y: scroll;
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

</style>