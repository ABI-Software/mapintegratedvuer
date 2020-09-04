<template>
  <div class="dataset-card-container"  ref="container">
    <div v-bind:class=" expanded ? 'dataset-card-expanded' : 'dataset-card'"  ref="card">
      <div class="seperator-path"></div>
      <div class="card" >
        <span class="card-left" >
          <div class="title" @click="cardClicked">{{entry.description}}</div>
          <div class="details">{{entry.contributors[0].name}}; {{entry.contributors[1].name}}</div>
          <div class="details">{{entry.numberSamples}} sample(s)</div>
          <div class="details"><template v-for="(sex, i) in entry.sexes"><template v-if="i !== 0">, </template>{{sex}}</template></div>
          <div v-if="entry.age" class="details">{{entry.age}}</div>
          <div class="details">Last updated: {{entry.updated}}</div>
          <p v-if="(cardOverflow && !expanded)" class="read-more"><el-button @click="expand" class="button">Read more...</el-button></p>
        </span>
        <span class="card-right">
          <img class="banner-img" :src="thumbnail" @click="cardClicked"/>
        </span>
      </div>
    </div>
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



var api_location = process.env.VUE_APP_API_LOCATION + "banner/";

export default {
  name: "SideBar",
  props: {
    /**
     * Object containing information for
     * the required viewing.
     */
    entry: Object,
  },
  data: function () {
    return {
      thumbnail: require('../../assets/missing-image.svg'),
      dataLocation: this.entry.url,
      cardOverflow: false,
      expanded: false
    };
  },
  methods: {
    cardClicked: function(){
      window.open(this.dataLocation,'_blank');
    },
    isOverflown: function(el){
      console.log(el.clientHeight , el.scrollHeight)
      return el.clientHeight < el.scrollHeight
    },
    expand: function() {
      this.expanded = true
    },
    getBanner: function () {
      fetch(api_location + this.entry.datasetId)
        .then((response) => response.json())
        .then((data) => {
          this.thumbnail = data.banner
          this.dataLocation = 'https://sparc.science/datasets/' + data.id
        });
    },
  },
  mounted: function(){
    this.getBanner()
    this.cardOverflow = this.isOverflown(this.$refs.card)
  },
  updated: function () {
  },
  watch: { 
    'entry.description': function() { // watch it
      this.getBanner()
      this.cardOverflow = this.isOverflown(this.$refs.card)
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.dataset-card {
  height: 230px;
  padding-left: 16px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
.dataset-card-expanded {
  padding-left: 16px;
  cursor: pointer;
  position: relative;
}
.seperator-path {
  width: 486px;
  height: 0px;
  border: solid 1px var(--pale-grey);
  background-color: var(--pale-grey);
}
.title {
  padding-bottom: 20px;
  font-family: Asap;
  font-size: 14px;
  font-weight: bold;
  font-stretch: normal;
  font-style: normal;
  line-height: 1.5;
  letter-spacing: 1.05px;
  color: #484848;
}
.card {
  padding-top: 22px;
  position: relative;
  display: flex;
}

.card-left{
  flex: 1.3;
}

.dataset-card .read-more { 
  position: absolute; 
  bottom: 0; 
  left: 0;
  width: 100%; 
  text-align: left; 
  margin: 0; padding: 30px 0; 
  /* "transparent" only works here because == rgba(0,0,0,0) */
  background-image: linear-gradient(to bottom, transparent, white);
}

.read-more .button{
  width: 85px;
  height: 20px;
  font-family: Asap;
  font-size: 14px;
  font-weight: normal;
  font-stretch: normal;
  font-style: normal;
  line-height: normal;
  letter-spacing: normal;
  color: var(--vibrant-purple);
  padding: 0px;
}

.card-right {
  flex: 1;
  padding-left: 6px;
}
.banner-img {
  width: 128px;
  height: 128px;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.25);
  background-color: #ffffff;
}
.details{
  font-family: Asap;
  font-size: 14px;
  font-weight: normal;
  font-stretch: normal;
  font-style: normal;
  line-height: 1.5;
  letter-spacing: 1.05px;
  color: #484848;
}
</style>
