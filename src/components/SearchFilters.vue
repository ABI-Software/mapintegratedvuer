<template>
  <div class="filters">
    <div class="filter-collapsed" @click="showFilters = !showFilters">Filter</div>
    <div v-if="showFilters" class="search-filters">
      <div class="filters-row-1">
        <el-select
          class="filter-select"
          v-model="speciesSelected"
          @change="speciesFilterSearch($event)"
          placeholder="Selecte Species"
          default-first-option
        >
          <el-option v-for="item in species" :key="item" :label="item" :value="item"></el-option>
        </el-select>
        <el-select
          class="filter-select"
          v-model="organSelected"
          placeholder="Select Organ"
          multiple
          filterable
          default-first-option
        >
          <el-option v-for="item in organ" :key="item" :label="item" :value="item"></el-option>
        </el-select>
        <el-select
          class="filter-select"
          v-model="regionSelected"
          placeholder="Select Region"
          multiple
          filterable
          default-first-option
        >
          <el-option v-for="item in regions" :key="item" :label="item" :value="item"></el-option>
        </el-select>
      </div>
      <div class="filters-row-2">
        <el-select
          class="filter-select"
          v-model="genderSelected"
          @change="genderFilterSearch($event)"
          placeholder="Select Gender"
          default-first-option
        >
          <el-option v-for="item in gender" :key="item" :label="item" :value="item"></el-option>
        </el-select>
      </div>

      <span
        
        class="dataset-results-feedback"
      >{{entry.numberOfHits }} Datasets for '{{entry.lastSearch}}' | Showing</span>
      <span v-if="entry.numberOfHits  > 0">
        <el-select class="number-shown-select" v-model="numberShown" placeholder="10">
          <el-option v-for="item in numberDatasetsShown" :key="item" :label="item" :value="item"></el-option>
        </el-select>
      </span>
    </div>
  </div>
</template>


<script>
/* eslint-disable no-alert, no-console */
import Vue from "vue";
import { Link, Icon, Card, Button, Select } from "element-ui";
import "element-ui/lib/theme-chalk/index.css";
import lang from "element-ui/lib/locale/lang/en";
import locale from "element-ui/lib/locale";

locale.use(lang);
Vue.use(Link);
Vue.use(Icon);
Vue.use(Card);
Vue.use(Button);
Vue.use(Select);

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
      gender: ["All sex", "Male", "Female", "Uknown"],
      numberDatasetsShown: ["10", "20"],
      defaultSelect: "10",
    };
  },
  methods: {
    getSpecies: function () {
      var species = ["All species"];
      this.callSciCrunch(api_location, facet_endpoint, "species").then(
        (species_terms) => {
          species_terms.forEach((element) => {
            species.push(element["key"]);
          });
          this.species = [...new Set(species)]
        }
      );
    },
    speciesFilterSearch: function (event) {
      this.$emit('filterResults', {'facet': event, 'term':'species'})
    },
    genderFilterSearch: function (event) {
      this.$emit('filterResults', {'facet': event, 'term':'gender'})
    },
    getGenders: function () {
      var gender = ["All sex"];
      this.callSciCrunch(api_location, facet_endpoint, "gender").then(
        (gender_terms) => {
          gender_terms.forEach((element) => {
            gender.push(element["key"]);
          });
          this.gender = [...new Set(gender)]
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
    this.getSpecies();
    this.getGenders();
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.filter-collapsed {
  font-family: Asap;
  font-size: 14px;
  font-weight: 500;
  font-stretch: normal;
  font-style: normal;
  line-height: normal;
  letter-spacing: normal;
  color: #292b66;
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

>>> .el-select.number-shown-select {
  width: 68px;
  height: 26px;
}
</style>
