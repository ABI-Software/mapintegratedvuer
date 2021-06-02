<template>
  <div class="dataset-card-container"  ref="container">
    <div v-bind:class=" expanded ? 'dataset-card-expanded' : 'dataset-card'"  ref="card">
      <div v-if="entry.id !== 0" class="seperator-path"></div>
      <div class="card" >
        <span class="card-left">
          <img svg-inline class="banner-img" :src="thumbnail" @click="openDataset"/>
        </span>
        <div class="card-right" >
          <div class="title" @click="cardClicked">{{entry.description}}</div>
          <div v-if="entry.contributors.length === 1" class="details">{{lastName(entry.contributors[0].name)}}</div>
          <div v-if="entry.contributors.length === 2" class="details">{{lastName(entry.contributors[0].name)}} &amp; {{lastName(entry.contributors[1].name)}}</div>
          <div v-if="entry.contributors.length > 2" class="details">{{lastName(entry.contributors[0].name)}} <em>et al.</em></div>
          <div v-if="entry.numberSamples !== 0" class="details">{{entry.numberSamples}} sample(s)</div>
          <div>
            <el-button v-if="!entry.simulation" @click="openDataset" size="mini" class="button" icon="el-icon-coin">View dataset</el-button>
          </div>
          <div>
            <el-button v-if="entry.scaffold" @click="openScaffold" size="mini" class="button" icon="el-icon-view">View scaffold</el-button>
          </div>
          <div>
            <el-button v-if="hasCSVFile"  @click="openPlot" size="mini" class="button" icon="el-icon-view">View plot</el-button>
          </div>
          <div>
            <el-button v-if="entry.simulation"  @click="openSimulation" size="mini" class="button" icon="el-icon-view">View simulation</el-button>
          </div>
        </div>

      </div>
        <p v-if="(cardOverflow && !expanded)" class="read-more"><el-button @click="expand" class="read-more-button">Read more...</el-button></p>
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
import store from '../store';

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

export default {
  name: "DatasetCard",
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
  computed: {
    hasCSVFile: function(){
      return ( this.entry.csvFiles && this.entry.csvFiles.length !== 0 )
    }
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
          resource: this.getScaffoldPath(this.discoverId, this.version, this.entry.scaffolds[0].dataset.path),
          title: "View 3D scaffold",
          type: "Scaffold"
        }
        EventBus.$emit("PopoverActionClick", action)
    },
    openPlot: function(){
      let action = {
          label: capitalise(this.entry.organs[0]),
          resource: this.getFileFromPath(this.discoverId, this.version, this.entry.csvFiles[0].dataset.path),
          title: "View plot",
          type: "Plot"
        }
        EventBus.$emit("PopoverActionClick", action)
    },
    openDataset: function(){
      window.open(this.dataLocation,'_blank');
    },
    openSimulation: function() {
      let isSedmlResource = false;
      let resource = undefined;
      this.entry.additionalLinks.forEach(function(el) {
        if (el.description == "SED-ML file") {
          isSedmlResource = true;
          resource = el.uri;
        } else if (!isSedmlResource && (el.description == "CellML file")) {
          resource = el.uri;
        }
      });
      let action = {
          label: undefined,
          resource: resource,
          title: "View simulation",
          type: "Simulation"
        }
        EventBus.$emit("PopoverActionClick", action)
    },
    getScaffoldPath: function(discoverId, version, scaffoldPath){
      let id = discoverId
      let path = `${this.apiLocation}s3-resource/${id}/${version}/files/${scaffoldPath}/${scaffoldMetaMap[id].meta_file}`
      return path
    },
    getFileFromPath: function(discoverId, version, path){
      return  `${this.apiLocation}s3-resource/${discoverId}/${version}/files/${path}`
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
      if (this.entry.simulation) {
        // We are dealing with the Fabbri et al. model, so use the schematic on
        // PMR.
        this.thumbnail = "https://models.physiomeproject.org/workspace/486/@@rawfile/55879cbc485e2d4c41f3dc6d60424b849f94c4ee/hSAN%20schematic%20model.png"
        this.discoverId = undefined
        this.version = undefined
        this.dataLocation = this.entry.url.uri
        return
      }
      let doi = this.splitDOI(this.entry.doi)
      fetch(`https://api.pennsieve.io/discover/datasets/doi/${doi[0]}/${doi[1]}`)
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
          this.version = data.version
          this.dataLocation = `https://sparc.science/datasets/${data.id}?type=dataset`
        })
        .catch(() => {
          //set defaults if we hit an error
          this.thumbnail = require('@/../assets/missing-image.svg')
          this.discoverId = undefined
        });
    },
    lastName: function(fullName){
      return fullName.split(',')[0]
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
  },
  created: function () {
    //Create non-reactive local variables
    this.apiLocation = "";
    if (store.state.settings.api)
      this.apiLocation = store.state.settings.api;
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.dataset-card {
  padding-left: 16px;
  position: relative;
}
.seperator-path {
  width: 486px;
  height: 0px;
  border: solid 1px #e4e7ed;
  background-color: #e4e7ed;
}
.title {
  padding-bottom: 5px;
  font-family: Asap;
  font-size: 14px;
  font-weight: bold;
  font-stretch: normal;
  font-style: normal;
  line-height: 1.5;
  letter-spacing: 1.05px;
  color: #484848;
  cursor: pointer;
}
.card {
  padding-top: 18px;
  position: relative;
  display: flex;
}

.card-left{
  flex: 1
}

.card-right {
  flex: 1.3;
  padding-left: 6px;
}

.dataset-card .read-more {
  position: absolute;
  z-index: 9;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 20px;
  margin: 0; padding: 20px 66px;
  /* "transparent" only works here because == rgba(0,0,0,0) */
  background-image: linear-gradient(to bottom, transparent, white);
  pointer-events: none;
}

.read-more-button{
  width: 85px;
  height: 20px;
  font-family: Asap;
  font-size: 14px;
  font-weight: normal;
  font-stretch: normal;
  font-style: normal;
  line-height: normal;
  letter-spacing: normal;
  color: #8300bf;
  padding: 0px;
  pointer-events: all;
  cursor: pointer;
}

.button{
  z-index: 10;
  font-family: Asap;
  font-size: 14px;
  font-weight: normal;
  font-stretch: normal;
  font-style: normal;
  line-height: normal;
  letter-spacing: normal;
  background-color: #8300bf;
  border: #8300bf;
  color: white;
  cursor: pointer;
  margin-top: 8px;
}

.button:hover {
  background-color: #8300bf;
  color: white;
}

.banner-img {
  width: 128px;
  height: 128px;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.25);
  background-color: #ffffff;
  cursor: pointer;
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
