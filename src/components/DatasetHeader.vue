<template>
  <div class="dataset-title-container" ref="container" @mouseleave="cardDisplayed=false">
    <div @click="openCard($event)" class="dataset-link">
      <el-link class="dataset-title">
        {{entry.datasetTitle}}
        <i v-show="!cardDisplayed && (entry.datasetImage || entry.datasetDescription)" class="el-icon-arrow-down el-icon--right"></i>
        <i v-show="cardDisplayed && (entry.datasetImage || entry.datasetDescription)" class="el-icon-arrow-up el-icon--right"></i>
      </el-link>
      <el-card v-show="cardDisplayed" :body-style="{ padding: '0px' }" class="dataset-card" ref="card">
        <img :src="entry.datasetImage" class="image"/>
        <div style="padding: 14px;">
          <span class="dataset-description">{{entry.datasetDescription}}</span>
          <div >
            <el-button class="button" @click="openDatasetUrl()">Get Dataset</el-button>
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
import lang from "element-ui/lib/locale/lang/en";
import locale from "element-ui/lib/locale";

locale.use(lang);
Vue.use(Link);
Vue.use(Icon);
Vue.use(Card);
Vue.use(Button);
Vue.use(Select);

export default {
  name: "DatasetHeader",
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
      cardDisplayed: false
    }
  },
  methods: {
    switchCardDisplay: function(){
      this.cardDisplayed = !this.cardDisplayed;
    },
    openCard: function(event){
      if (this.entry.datasetImage || this.entry.datasetDescription) {
        this.cardDisplayed = true;
        this.$refs.card.$el.style.left = event.layerX + 'px';
        this.$refs.card.$el.style.top = event.layerY + 'px';
      } else {
        this.openDatasetUrl();
      }
    },
    openDatasetUrl: function(){
      if (this.entry.datasetUrl)
        window.open(this.entry.datasetUrl, '_blank');
      this.cardDisplayed = false;
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.dataset-link{
  text-align:center;
}
.dataset-title-container{
  padding: 3px;
}
.dataset-title{
  font: HelveticaNeue-Medium;
  font-size: 16px;
  color: #606266;
}
.dataset-card{
  width: 230px;
  position: absolute;
  z-index: 10;
}
.image{
  width: 100%;
  display: block;
}
.dataset-description{
  font-size: 10px;
}
</style>
