<template>
  <div v-loading="loading" class="flatmap-context-card" >
    <div class="card-right scrollbar">
      <div class="title">Flatmap Provenance</div>
        SCKAN version: <a :href="sckanReleaseLink" target="_blank"> {{sckanReleaseDisplay}} </a>
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
import {
  ElLoading as Loading
} from "element-plus";

export default {
  name: "FlatmapContextCard",
  components: {
    Loading,
  },
  props: {
    /**
     * Object containing information for
     * the required viewing. Can be retrieved from a flatmap
     */
    mapImpProv: Object,
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
      if(this.mapImpProv){
        flatmapPublished = new Date(this.mapImpProv.created).toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        })
      }
      return flatmapPublished 
    },
    sckanReleaseDisplay: function() {
      let sckanRelease = "Unknown"
      if(this.mapImpProv){
        sckanRelease = this.mapImpProv.connectivity?.npo.date
        if (!sckanRelease) {
          let sckanCreated = this.mapImpProv.sckan?.created ? this.mapImpProv.sckan.created : this.mapImpProv.sckan
          let isoTime = sckanCreated.replace(',', '.') // Date time does not accept commas but Sckan uses them
          sckanRelease = new Date(isoTime).toLocaleDateString('en-US', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
          })
        }
        if (!sckanRelease) {
          sckanRelease = "Unknown";
        }
      }
      return sckanRelease 
    },
    sckanReleaseLink: function() {
      let sckanLink = "Unknown"
      if(this.mapImpProv){
        sckanLink = this.mapImpProv.connectivity?.npo.path
        if (!sckanLink) {
          sckanLink = this.mapImpProv.sckan?.release
        }
        if (!sckanLink) {
          sckanLink = "Unknown"
        }
      }
      return sckanLink
    },
    flatmapSource: function() {
      let flatmapSource = "Unknown"
      if(this.mapImpProv){
        flatmapSource = this.mapImpProv.source
      }
      return flatmapSource
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">


.flatmap-context-card{
  background-color: white;
  max-height: 10  50px;
  font-size: 12px;
  position: relative;
  display: flex;
  width: 100%;
  max-height: 258px;
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

.title{
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
