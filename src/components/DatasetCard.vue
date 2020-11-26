<template>
  <div class="dataset-card-container"  ref="container">
    <div v-bind:class=" expanded ? 'dataset-card-expanded' : 'dataset-card'"  ref="card">
      <div v-if="entry.id !== 0" class="seperator-path"></div>
      <div class="card" >
        <span class="card-left" >
          <div class="title" @click="cardClicked">{{entry.description}}</div>
          <div class="details">{{entry.contributors[0].name}}; {{entry.contributors[1].name}}</div>
          <div class="details">{{entry.numberSamples}} sample(s)</div>
          <div class="details"><template v-for="(organ, i) in entry.organs"><template v-if="i !== 0">, </template>{{organ}}</template></div>
          <div class="details"><template v-for="(sex, i) in entry.sexes"><template v-if="i !== 0">, </template>{{sex}}</template></div>
          <div v-if="entry.ages" class="details"><template v-for="(sex, i) in entry.ages"><template v-if="i !== 0">, </template>{{sex}}</template></div>
          <div class="details">Last updated: {{entry.updated}}</div>
        </span>
        <span class="card-right">
          <img svg-inline class="banner-img" :src="thumbnail" @click="cardClicked"/>
          <el-button @click="openPlot" size="mini" class="button" icon="el-icon-view">Plot</el-button>
          <div v-if="entry.scaffold">
            <el-button @click="openScaffold" size="mini" class="button" icon="el-icon-view">Scaffold</el-button>
            <el-button @click="openDataset" size="mini" class="button" icon="el-icon-coin">Dataset</el-button>
          </div>
        </span>
      </div>
        <p v-if="(cardOverflow && !expanded)" class="read-more"><el-button @click="expand" class="button">Read more...</el-button></p>
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
import EventBus from "./EventBus"
import scaffoldMetaMap from './scaffold-meta-map';

locale.use(lang);
Vue.use(Link);
Vue.use(Icon);
Vue.use(Card);
Vue.use(Button);
Vue.use(Select);
Vue.use(Input);

var capitalise = function(string){
  return string.replace(/\b\w/g, v => v.toUpperCase())
}

var api_location = process.env.VUE_APP_API_LOCATION;

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
      thumbnail: require('@/../assets/missing-image.svg'),
      dataLocation: this.entry.doi,
      discoverId: undefined,
      cardOverflow: false,
      expanded: false
    };
  },
  methods: {
    cardClicked: function(){
      if(this.entry.scaffold){
        this.openScaffold()
      }else{
        this.openDataset()
      }
    },
    openScaffold: function(){
      let action = {
          label: capitalise(this.entry.organs[0]),
          resource: this.getScaffoldPath(this.discoverId, this.entry.scaffolds[0].dataset.path),
          title: "View 3D scaffold",
          type: "Scaffold"
        }
        EventBus.$emit("PopoverActionClick", action)
    },
    openPlot: function(){
      let action = {
          label: capitalise(this.entry.organs[0]),
          resource: 'http://localhost:8000/s3-resource/29/6/files/derivative/HB-ICN-NegDDCT-data.csv',
          title: "View 3D scaffold",
          type: "Plot"
        }
        EventBus.$emit("PopoverActionClick", action)
    },
    openDataset: function(){
      window.open(this.dataLocation,'_blank');
    },
    getScaffoldPath: function(discoverId, scaffoldPath){
      let id = discoverId
      let path = `${api_location}s3-resource/${id}/${scaffoldMetaMap[id].version}/files/${scaffoldPath}/${scaffoldMetaMap[id].meta_file}`
      return path 
    },
    isOverflown: function(el){
      return el.clientHeight < el.scrollHeight
    },
    expand: function() {
      this.expanded = true
    },
    splitDOI: function(doi){
      return [doi.split('/')[doi.split('/').length-2], doi.split('/')[doi.split('/').length-1]]
    },
    getBanner: function () {
      let doi = this.splitDOI(this.entry.doi)
      fetch(`https://api.blackfynn.io/discover/datasets/doi/${doi[0]}/${doi[1]}`)
        .then((response) =>{ 
          if (!response.ok){
            throw Error(response.statusText)
          } else {
             return response.json()
          }
        })
        .then((data) => {
          this.thumbnail = data.banner
          this.discoverId = data.id
          this.dataLocation = `https://sparc.science/datasets/${data.id}?type=dataset`
        })
        .catch(() => {
          //set defaults if we hit an error
          this.thumbnail = require('@/../assets/missing-image.svg')
          this.discoverId = undefined
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
      this.cardOverflow = false
      this.expanded = false
      this.cardOverflow = this.isOverflown(this.$refs.card)
      this.getBanner()
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
  height: 20px;
  margin: 0; padding: 20px 66px; 
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

.button{
  font-family: Asap;
  font-size: 14px;
  font-weight: normal;
  font-stretch: normal;
  font-style: normal;
  line-height: normal;
  letter-spacing: normal;
  color: var(--vibrant-purple);
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
