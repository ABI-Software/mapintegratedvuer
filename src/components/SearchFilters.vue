<template>
  <div class="filters">
    <transition name="el-zoom-in-top">
      <div v-show="showFilters" class="search-filters transition-box">
          <el-cascader
          class="cascader"
          placeholder="Filter"
      :options="options"
          :props="propss"
          @change="cascadeEvent($event)"
          :show-all-levels="false">
        </el-cascader>
      </div>
    </transition>

    <div class="filter-collapsed" @click="showFilters = !showFilters">
      <img class="filter-icon" :src="require('../../assets/noun-filter.svg')"/>
      Filter
     </div>
    
    <span
        class="dataset-results-feedback"
      >{{entry.numberOfHits }} Datasets for '{{entry.lastSearch}}' | Showing</span>
      <span v-if="entry.lastSearch  !== ''">
        <el-select class="number-shown-select" v-model="numberShown" placeholder="10" @change="numberShownChanged($event)">
          <el-option v-for="item in numberDatasetsShown" :key="item" :label="item" :value="item"></el-option>
        </el-select>
      </span>
  </div>
</template>


<script>
/* eslint-disable no-alert, no-console */
import Vue from "vue";
import { Link, Icon, Card, Button, Select, Cascader } from "element-ui";
import "element-ui/lib/theme-chalk/index.css";
import lang from "element-ui/lib/locale/lang/en";
import locale from "element-ui/lib/locale";

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
      speciesSelected: [],
      organSelected: [],
      regionSelected: [],
      genderSelected: [],
      numberShown: 10,
      species: ["All species", "Mouse", "Pig", "Human"],
      organ: [
        "All organs",
        "Heart",
        "Lung",
        "Stomach",
        "Urinary tract",
        "Pancreas",
        "Colon",
      ],
      regions: [
        "All regions",
        "Left ventricle",
        "Right ventricle",
        "ICN",
        "Left atrium",
      ],
      facets: ['species', 'gender'],
      gender: ["All sex", "Male", "Female", "Uknown"],
      numberDatasetsShown: ["10", "20"],
      defaultSelect: "10",
      propss: { multiple: true },
      options: [{
        value: 1,
        label: 'Species',
        children: [{
        }]
      }]
    };
  },
  methods: {
    populateCascader: function () {
      var value = 1
      this.options = []
      this.facets.forEach((term)=>{
        this.getFacet(term).then((facets)=>{
          this.options.push({
            value: value,
            label: term,
            children: []
          })
          value++;
          facets.forEach((facet)=>{
            this.options[this.options.length-1].children.push({
              value: value,
              label: facet, 
            })
            value++;
          })
        })
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
    getSpecies: function () {
      var species = ["All species"];
      this.callSciCrunch(api_location, facet_endpoint, "species").then(
        (species_terms) => {
          species_terms.forEach((element) => {
            species.push(element["key"]);
          });
          this.species = [...new Set(species)];
        }
      );
    },
    cascadeEvent: function(event){
      var output = { facet: undefined, term: undefined }
      let id = event[0][1]
      for(let i in this.options){
        for(let j in this.options[i].children){
          if(this.options[i].children[j].value == id){
            output.facet = this.options[i].children[j].label
            output.term = this.options[i].label
          }
        }
      }
      this.$emit("filterResults", output);
      this.showFilters = false;

    },
    speciesFilterSearch: function (event) {
      this.$emit("filterResults", { facet: event, term: "species" });
    },
    genderFilterSearch: function (event) {
      this.$emit("filterResults", { facet: event, term: "gender" });
    },
    numberShownChanged: function (event){
      this.$emit("numberPerPage", event);
    },
    getGenders: function () {
      var gender = ["All sex"];
      this.callSciCrunch(api_location, facet_endpoint, "gender").then(
        (gender_terms) => {
          gender_terms.forEach((element) => {
            gender.push(element["key"]);
          });
          this.gender = [...new Set(gender)];
        }
      );
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
  },
  mounted: function () {
    this.populateCascader();
    this.getSpecies();
    this.getGenders();
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.filters{
    justify-content: center;
    align-items: center;
}

.filter-icon{
  width: 40px;
  height: 24px;
  color: #292b66;
  transform: scale(1.5);
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
  text-align: right;
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
        -moz-transition: height 0.5s;
    -ms-transition: height 0.5s;
    -o-transition: height 0.5s;
    -webkit-transition: height 0.5s;
    transition: height 0.5s;
}

.number-shown-select >>> .el-input__inner{
  width: 68px;
  height: 32px;
  color: #8300bf;
}

</style>
