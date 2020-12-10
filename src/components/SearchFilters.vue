<template>
  <div class="filters">
    <transition name="el-zoom-in-top">
      <div v-show="showFilters" class="search-filters transition-box">
          <el-cascader
          class="cascader"
          v-model="cascadeSelected"
          placeholder="Filter"
          :options="options"
          :props="props"
          @change="cascadeEvent($event)"
          :show-all-levels="false"
          :append-to-body="false">
        </el-cascader>
      </div>
    </transition>
    <div class="filter-collapsed" @click="showFilters = !showFilters">
      <img svg-inline class="filter-icon" src='@/../assets/noun-filter.svg'/>
      Filter
     </div>
    
    <span
        class="dataset-results-feedback"
      >{{this.numberOfDatasetsResultText}}</span>
      <el-select class="number-shown-select"  v-model="numberShown" placeholder="10" @change="numberShownChanged($event)">
        <el-option v-for="item in numberDatasetsShown" :key="item" :label="item" :value="item"></el-option>
      </el-select>
  </div>
</template>


<script>
/* eslint-disable no-alert, no-console */
import Vue from "vue";
import { Link, Icon, Card, Button, Select, Cascader } from "element-ui";
import "element-ui/lib/theme-chalk/index.css";
import lang from "element-ui/lib/locale/lang/en";
import locale from "element-ui/lib/locale";
import EventBus from './EventBus';

locale.use(lang);
Vue.use(Link);
Vue.use(Icon);
Vue.use(Card);
Vue.use(Button);
Vue.use(Select);
Vue.use(Cascader)

const api_location = process.env.VUE_APP_API_LOCATION;
const facet_endpoint = "get-facets/";

export default {
  name: "SearchFilters",
  components: {},
  props: {
    /**
     * Object containing information for
     * the required viewing.
     */
    entry: Object,
  },
  data: function () {
    return {
      showFilters: false,
      cascadeSelected: [],
      numberShown: 10,
      filters: [],
      facets: ['species', 'gender', 'genotype'],
      numberDatasetsShown: ["10", "20", "50"],
      props: { multiple: true },
      options: [{
        value: 1,
        label: 'Species',
        children: [{
        }]
      }]
    };
  },
  computed: {
    numberOfDatasetsResultText: function(){
      var searchTermConfirmation = ''
      if (this.entry.lastSearch !== ''){
        searchTermConfirmation = `for '${this.entry.lastSearch}'`
      }
      return `${this.entry.numberOfHits} Datasets ${searchTermConfirmation} | Showing`
    }
  },
  methods: {
    populateCascader: function () {
      return new Promise( (resolve) => {
        var value = 1
        this.options = []
        for(let i in this.facets){
          this.options.push({
              value: value,
              label: this.facets[i],
              children: []
            })
            value++;
        }
        var promiseList = []
        for(let i in this.facets){
          // Create a promise for each facet request
          promiseList.push(this.getFacet(this.facets[i]).then((labels)=>{
            // Populate children of each facet with scicrunch's facets 
            for(let j in labels){
              this.options[i].children.push({
                value: value,
                label: labels[j], 
              })
              value++;
            }
          })
          )
        }
        Promise.allSettled(promiseList).then(()=>{resolve()})
      })
    },
    getFacet: function (facet) {
      return new Promise((resolve) => {
        var facets = [`All ${facet}`];
        this.callSciCrunch(api_location, facet_endpoint, facet).then(
          (facet_terms) => {
            facet_terms.forEach((element) => {
              facets.push(element["key"]);
            });
            resolve([...new Set(facets)]);
          }
        );
      })
    },
    cascadeEvent: function(event){
      // If filters have been cleared, send an empty object
      if(event[0] === undefined){
       this.$emit("filterResults", {});
       return 
      }
      this.filters = []
      // event[0][1] contains the index of the latest addition
      for(let i in this.options){
        for(let j in this.options[i].children){
          for(let k in event){
            if(event[k] !== undefined){
              var id = event[k][1]
              if(this.options[i].children[j].value == id){
                let output = {}
                output.facet = this.options[i].children[j].label
                output.term = this.options[i].label
                this.filters.push(output)
              }
            }
          }
        }
      }
      // // Don't send a filter if all is selected
      // if(output.facet.includes('All')){
      //   output = {}
      // }
      this.$emit("filterResults", this.filters);
    },
    numberShownChanged: function (event){
      this.$emit("numberPerPage", event);
    },
    callSciCrunch: function (api_location, endpoint, term) {
      return new Promise((resolve) => {
        fetch(api_location + endpoint + term)
          .then((response) => response.json())
          .then((data) => {
            resolve(data);
          });
      });
    },
    setCascader: function(tagName){
      for(let i in this.options){
        for(let j in this.options[i].children){
          if(tagName === this.options[i].children[j].label){
            this.cascadeSelected = [[Number(i)+1,this.options[i].children[j].value]]
          }
        }
      }
      this.showFilters = true
    }
  },
  mounted: function () {
    this.populateCascader().then(()=>{
      this.setCascader(this.entry.filterFacet)
    })
    EventBus.$on('filterUiUpdate', (payLoad) => {
      this.setCascader(payLoad);
    })
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.filters{
    justify-content: center;
    align-items: center;
    padding-bottom: 10px;
}

.filter-icon{
  width: 12px;
  height: 12px;
  color: #292b66;
  transform: scale(2);
  bottom: -10px;
}

.cascader {
  font-family: Asap;
  font-size: 14px;
  font-weight: 500;
  font-stretch: normal;
  font-style: normal;
  line-height: normal;
  letter-spacing: normal;
  color: #292b66; 
  text-align: center;
  padding-bottom: 6px;
}

.cascader >>> .el-scrollbar__wrap{
  overflow-x: hidden;
  margin-bottom: 2px !important;
}

.cascader >>> li[aria-owns*="cascader"] > .el-checkbox {
  display: none;
}

.dataset-results-feedback{
  text-align: left;
}

.filter-collapsed {
  font-family: Asap;
  font-size: 16px;
  font-weight: 500;
  font-stretch: normal;
  font-style: normal;
  line-height: normal;
  letter-spacing: normal;
  color: #292b66;
  width: 100px;
  float: right;
  cursor: pointer;
}

.filter-select {
  width: 120px;
  height: 40px;
  margin-right: 16px;
  border-radius: 4px;
  border: solid 1px #8300bf;
  background-color: var(--white);
  font-weight: 500;
  color: #8300bf;
}

.filters-row-2 {
  padding-top: 16px;
}

.filter-select >>> .el-input__inner {
  color: #8300bf;
  padding-top: 0.25em;
}

.filter-select >>> .el-select-dropdown__item.selected {
  color: #8300bf;
  font-weight: normal;
  font-family: Asap !important;
}

.search-filters {
  text-align: left;
}

.number-shown-select >>> .el-input__inner{
  width: 68px;
  height: 32px;
  color: #8300bf;
}

</style>
