<template>
  <div class="filters">
    <transition name="el-zoom-in-top">
      <span v-show="showFilters" class="search-filters transition-box">
          <el-cascader
          class="cascader"
          v-model="cascadeSelected"
          placeholder=""
          :collapse-tags="true"
          :options="options"
          :props="props"
          @change="cascadeEvent($event)"
          :show-all-levels="false"
          :append-to-body="false">
        </el-cascader>
        <div v-if="cascadeSelected.length === 0" class="filter-default-value"> 
          <svg-icon icon="noun-filter" class="filter-icon-inside" />
          Apply Filters
        </div>
      </span>
    </transition>

      <el-select class="number-shown-select"  v-model="numberShown" placeholder="10" @change="numberShownChanged($event)">
        <el-option v-for="item in numberDatasetsShown" :key="item" :label="item" :value="item"></el-option>
      </el-select>
      <span
        class="dataset-results-feedback"
      >{{this.numberOfResultsText}}</span>
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
import store from '../store';

locale.use(lang);
Vue.use(Link);
Vue.use(Icon);
Vue.use(Card);
Vue.use(Button);
Vue.use(Select);
Vue.use(Cascader)

var capitalise = function(string){
  return string.replace(/\b\w/g, v => v.toUpperCase())
}

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
      showFilters: true,
      cascadeSelected: [],
      numberShown: 10,
      filters: [],
      facets: ['Species', 'Gender', 'Genotype', 'Datasets'],
      numberDatasetsShown: ["10", "20", "50"],
      props: { multiple: true },
      options: [{
        value: 1,
        label: 'Species',
        children: [{
        }]
      }],
    };
  },
  computed: {
    numberOfResultsText: function(){
      return `${this.entry.numberOfHits} results | Showing`
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
                label: capitalise(labels[j]), // Capitalisation is to match design specs
              })
              value++;
            }
          })
          )
        }
        Promise.allSettled(promiseList).then(()=>{resolve()})
      })
    },
    getFacet: function (facetLabel) {
      if (facetLabel === 'Datasets') {
        // The datasets facet doesn't exist on SciCrunch yet, so manually set it
        // for now.
        return new Promise((resolve) => {
          resolve([...new Set([`All ${facetLabel}`, "Scaffolds", "Simulations"])]);
        });
      }
      return new Promise((resolve) => {
        var facets = [`All ${facetLabel}`];
        let facet = facetLabel.toLowerCase()
        this.callSciCrunch(this.apiLocation, this.facetEndpoint, facet).then(
          (facet_terms) => {
            facet_terms.forEach((element) => {
              facets.push(element["key"]);
            });
            resolve([...new Set(facets)]);
          }
        );
      })
    },
    // switchFacetToRequest is used to set 'All' to lowercase. Api will not be case sensitive soon and this can be removed
    switchFacetToRequest: function(facet){
      if (!facet.includes('All')){
        return facet.toLowerCase()
      } else {
        return facet
      }
    },
    // switchTermToRequest is used to remove the count for sending a request to scicrunch
    switchTermToRequest: function(term){
      return term.split(' ')[0].toLowerCase()
    },
    updateLabels: function(counter){
      for( let i in counter){
        if( counter[i] > 0){
          this.options[i].label = this.options[i].label.split(' ')[0] + ` (${counter[i]})`
        } else {
          this.options[i].label = this.options[i].label.split(' ')[0]
        }
      }
    },
    cascadeEvent: function(event){
      // If filters have been cleared, send an empty object
      if(event[0] === undefined){
       this.$emit("filterResults", {});
       this.updateLabels([0,0,0,0]) // reset label counts
       return
      }
      this.filters = []
      // Label counts is used to show user how many are at each nested level.
      //    i.e.: if 3 species are selected it will show 'Species (3)' in the cascader
      let labelCounts = [0,0,0,0]
      // event[0][1] contains the index of the latest addition
      for(let i in this.options){
        for(let j in this.options[i].children){
          for(let k in event){
            if(event[k] !== undefined){
              var id = event[k][1]
              if(this.options[i].children[j].value == id){
                let output = {}
                output.facet = this.switchFacetToRequest(this.options[i].children[j].label)
                output.term = this.switchTermToRequest(this.options[i].label)
                this.filters.push(output)
                labelCounts[i] += 1
              }
            }
          }
        }
      }
      this.updateLabels(labelCounts)
      this.$emit("filterResults", this.filters);
    },
    numberShownChanged: function (event){
      this.$emit("numberPerPage", event);
    },
    callSciCrunch: function (apiLocation, endpoint, term) {
      return new Promise((resolve) => {
        fetch(apiLocation + endpoint + term)
          .then((response) => response.json())
          .then((data) => {
            resolve(data);
          });
      });
    },
    setCascader: function(tagName){
      let labelCounts = [0,0,0,0]
      for(let i in this.options){
        for(let j in this.options[i].children){
          if(tagName === this.options[i].children[j].label){
            this.cascadeSelected = [[Number(i)+1,this.options[i].children[j].value]]
            labelCounts[i] += 1
          }
        }
      }
      this.updateLabels(labelCounts)
    }
  },
  created: function() {
    //Create non-reactive local variables
    this.apiLocation = "";
    this.facetEndpoint = "get-facets/";
    if (store.state.settings.api)
      this.apiLocation = store.state.settings.api;
  },
  mounted: function () {
    this.populateCascader().then(()=>{
      this.setCascader(this.entry.filterFacet);
    })
    EventBus.$on('filterUiUpdate', (payLoad) => {
      this.setCascader(payLoad);
    })
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

.filter-icon{
  width: 12px;
  height: 12px;
  color: #292b66;
  transform: scale(2);
  bottom: -10px;
}

.filter-default-value{
  pointer-events: none;
  position: absolute;
  top: 0;
  left: 0;
  padding-top: 10px;
  padding-left: 16px;
}

.filter-icon-inside{
  width: 12px;
  height: 12px;
  color: #292b66;
  transform: scale(2);
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
  float: right;
  text-align: right;
  color: rgb(48, 49, 51);
  font-family: Asap;
  font-size: 18px;
  font-weight: 500;
  padding-top: 8px;
}

.search-filters {
  position: relative;
  float:left;
  padding-right: 15px;
  padding-bottom: 12px;
}

.number-shown-select{
  float: right;
}

.number-shown-select >>> .el-input__inner{
  width: 68px;
  height: 40px;
  color: rgb(48, 49, 51);
}

.search-filters >>> .el-cascader-node.is-active{
  color: #8300bf;
}

.search-filters >>> .el-cascader-node.in-active-path{
  color: #8300bf;
}

.search-filters >>> .el-checkbox__input.is-checked > .el-checkbox__inner {
  background-color: #8300bf;
  border-color: #8300bf;
}

</style>
