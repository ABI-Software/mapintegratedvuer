<template>
  <div class="content-container">
    <el-card class="box-card">
      <div slot="header" class="header">
        <el-input placeholder="Search" v-model="searchInput" @keyup.native="searchSciCrunch" clearable></el-input>
        <el-button @click="searchSciCrunch">Search</el-button>
      </div>
      <div class="content">
      <div v-for="o in steps" :key="o" class="step-item">{{o.description}}</div>
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

locale.use(lang);
Vue.use(Link);
Vue.use(Icon);
Vue.use(Card);
Vue.use(Button);
Vue.use(Select);
Vue.use(Input);

var api_location = 'http://localhost:8089/search/'


export default {
  name: "DatasetCard",
  props: {
    /**
     * Object containing information for
     * the required viewing.
     */
    entry: Object
  },
  data: function() { 
    return  {
      searchInput: '',
      steps: [{description: '1. Start off by selecting a point on the scaffold with data'},
      {description: '2. Try opening up the scaffoldvuer by clicking "View Scaffold"'},
      {description: '3. This window is the scaffold viewer. Use click and drag with mouse to rotate the model'},
      {description: '4. Find a point with data on the scaffold'},
      {description: '5. Click on the point to bring up a dailogue of options with the data'},
      {description: '6. Try viewing the data by clicking "View Plot"'},
      {description: '7. Explore the data in the pop up plot'},
      ]
    }
  },
  methods: {
      searchSciCrunch: function(event = false){
        if (event.keyCode === 13 || event instanceof MouseEvent){
          this.callSciCrunch()
        }
      },
      callSciCrunch: function(){
        fetch(api_location + this.searchInput)
            .then(response => response.json())
            .then(data => {
              this.steps = []
              data.forEach(element => {
                this.steps.push({'description': element.name})
              });
            });
      }
      
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.step-item {
  font-size: 14px;
  margin-bottom: 18px;
  text-align: left;
}

.header{
  height: 20px;
}

.box-card {
  width: 280px;
  height: 280px;
  overflow: auto;
}

.active {
    width: 380px !important;
    height: 380px !important;
}
</style>
