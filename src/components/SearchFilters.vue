<template>
  <div class="filters">Filters will go here!
        <div class="search-feedback">
        <div class="filters-row-1">
        <el-select class="filter-select" v-model="speciesSelected" placeholder="Selecte Species"
      multiple
      filterable
      default-first-option>
             <el-option
            v-for="item in species"
            :key="item"
            :label="item"
            :value="item">
          </el-option>
           </el-select>
           <el-select class="filter-select" v-model="organSelected" placeholder="Select Organ" 
                 multiple
      filterable
      default-first-option> 
             <el-option
            v-for="item in organ"
            :key="item"
            :label="item"
            :value="item">
          </el-option>
           </el-select>
           <el-select class="filter-select" v-model="regionSelected" placeholder="Select Region"
                 multiple
      filterable
      default-first-option>
             <el-option
            v-for="item in regions"
            :key="item"
            :label="item"
            :value="item">
          </el-option>
           </el-select>
           </div>

        <span v-if="entry.numberOfHits > 0" class="dataset-results-feedback">{{entry.numberOfHits }} Datasets for '{{entry.lastSearch}}' | Showing </span>
        <span v-if="entry.numberOfHits  > 0"> 
          <el-select class="number-shown-select" v-model="numberShown" placeholder="10">
             <el-option
            v-for="item in numberDatasetsShown"
            :key="item"
            :label="item"
            :value="item">
          </el-option>
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
  data: function() {
    return {
      speciesSelected: [],
      organSelected: [],
      regionSelected: [],
      numberShown: 10,
      species: ['All species', 'Mouse', 'Pig', 'Human'],
      organ: ['All organs', 'Heart', 'Lung', 'Stomach', 'Urinary tract', 'Pancreas', 'Colon'],
      regions: ['Left ventricle', 'Right ventricle', 'ICN', 'Left atrium'],
      numberDatasetsShown: ['10', '20'],
      defaultSelect: "10",
    }
  },
  methods: {
    
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

.filter-select{
  width: 120px;
  height: 40px;
  margin-right: 16px;
  border-radius: 4px;
  border: solid 1px #8300bf;
  background-color: var(--white);
  font-weight: 500;
  color: #8300bf;
}

.filter-select >>> .el-input__inner{
  color: #8300bf;
  padding-top: 0.25em;
}

.filter-select >>> .el-select-dropdown__item.selected {
  color: #8300bf;
  font-weight: normal;
  font-family: Helvetica !important;
}

.search-feedback{
  text-align: left;
}

>>> .el-select.number-shown-select {
  width: 68px;
  height: 26px;
}
</style>
