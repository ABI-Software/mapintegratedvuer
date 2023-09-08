<template>
  <div v-loading="loading" class="flatmap-context-card" >
    <div class="card-right scrollbar">
      <div class="title">Flatmap Provenance</div>
        SKAN version: <a :href="skanReleaseLink" target="_blank"> {{skanReleaseDisplay}} </a>
        <br>
        Published on:
        {{flatmapPublishedDisplay}}
        <br>
        View publication <a :href="flatmapSource" target="_blank">here</a>
      <br/>
    </div>
  </div>
</template>


<script>
/* eslint-disable no-alert, no-console */
import Vue from "vue";
import { Link, Icon, Card, Button, Select, Input } from "element-ui";
import lang from "element-ui/lib/locale/lang/en";
import locale from "element-ui/lib/locale";

locale.use(lang);
Vue.use(Link);
Vue.use(Icon);
Vue.use(Card);
Vue.use(Button);
Vue.use(Select);
Vue.use(Input);


export default {
  name: "contextCard",
  props: {
    /**
     * Object containing information for
     * the required viewing. Can be retrieved from a flatmap
     */
    mapImp: Object,
  },
  data: function () {
    return {
      contextData: {},
      showDetails: true,
      showContextCard: true,
      sampleDetails: {},
      loading: false
    };
  },
  computed: {
    flatmapPublishedDisplay: function() {
      let flatmapPublished = "Unknown"
      if(this.mapImp && this.mapImp.provenance){
        flatmapPublished = new Date(this.mapImp.provenance.created).toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        })
      }
      return flatmapPublished 
    },
    skanReleaseDisplay: function() {
      let skanRelease = "Unknown"
      if(this.mapImp && this.mapImp.provenance){
        let isoTime = this.mapImp.provenance.sckan.created.replace(',', '.') // Date time does not accept commas but Sckan uses them
        skanRelease = new Date(isoTime).toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        })
      }
      return skanRelease 
    },
    skanReleaseLink: function() {
      let skanRelease = "Unknown"
      if(this.mapImp && this.mapImp.provenance){
        skanRelease = this.mapImp.provenance.sckan.release
      }
      return skanRelease 
    },
    flatmapSource: function() {
      let flatmapSource = "Unknown"
      if(this.mapImp && this.mapImp.provenance){
        flatmapSource = this.mapImp.provenance.source
      }
      return flatmapSource
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import "~element-ui/packages/theme-chalk/src/button";
@import "~element-ui/packages/theme-chalk/src/card";
@import "~element-ui/packages/theme-chalk/src/icon";
@import "~element-ui/packages/theme-chalk/src/input";
@import "~element-ui/packages/theme-chalk/src/link";
@import "~element-ui/packages/theme-chalk/src/select";

.hide{
  color: #e4e7ed;
  cursor: pointer;
}

.flatmap-context-card{
  background-color: white;
  max-height: 10  50px;
  font-size: 12px;
  position: relative;
  display: flex;
  width: 100%;
  max-height: 258px;
}

.color-box {
  width: 16px;
  height: 16px;
  border: solid 1px $app-primary-color;
  border-radius: 2px;
  margin-right: 8px;
}

.card-right {
  flex: 1.3;
  padding-left: 6px;
  // overflow-y: scroll;
  scrollbar-width: thin;
}

.cursor-pointer {
  cursor: pointer;
}

.info{
  transform: rotate(180deg);
  color: $app-primary-color;
  margin-left: 8px;
}

.padding {
  padding-bottom: 8px;
}

.title{
  font-weight: bold;
}

.subtitle{
  font-weight: bold;
}

.scrollbar::-webkit-scrollbar-track {
  border-radius: 10px;
  background-color: #f5f5f5;
}

.scrollbar::-webkit-scrollbar {
  width: 12px;
  right: -12px;
  background-color: #f5f5f5;
}

.scrollbar::-webkit-scrollbar-thumb {
  border-radius: 4px;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.06);
  background-color: #979797;
}

</style>
