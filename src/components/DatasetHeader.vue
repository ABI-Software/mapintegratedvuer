<template>
  <div class="dataset-title-container" ref="container" @mouseleave="cardDisplayed=false">
    <div @click="cardDisplayed=true" class="dataset-link">
      <el-link class="dataset-title">
        {{title}}
        <i v-show="!cardDisplayed" class="el-icon-arrow-down el-icon--right"></i>
        <i v-show="cardDisplayed" class="el-icon-arrow-up el-icon--right"></i>
      </el-link>
      <el-card v-show="cardDisplayed" :body-style="{ padding: '0px' }" class="dataset-card">
        <img src="https://assets.discover.blackfynn.com/dataset-assets/75/1/revisions/2/banner.jpg" class="image" />
        <div style="padding: 14px;">
          <span class="dataset-description">{{description}}</span>
          <div >
            <el-button class="button">Get Dataset</el-button>
          </div>
        </div>
      </el-card>
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
Vue.use(Select)

export default {
  name: "DatasetHeader",
  components: {},
  props: ["title", "url", "description"],
  data: function() {
    return {
      cardDisplayed: false
    }
  },
  methods: {
    switchCardDisplay: function(){
      this.cardDisplayed = !this.cardDisplayed
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.dataset-title-container{
  margin: 3px;
}
.dataset-title{
  font: HelveticaNeue-Medium;
  font-size: 16px;
  color: #606266;
}
.dataset-card{
  width: 230px;
  position: absolute;
  z-index: 6;
}
.image{
  width: 100%;
  display: block;
}
.dataset-description{
  margin-bottom: 3px;
}
</style>
