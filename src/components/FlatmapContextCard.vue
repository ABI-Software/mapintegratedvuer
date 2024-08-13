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

    <!-- Copy to clipboard button container -->
    <div class="float-button-container">
      <CopyToClipboard :content="copyContent" theme="light" />
    </div>
  </div>
</template>


<script>
/* eslint-disable no-alert, no-console */
import {
  ElLoading as Loading
} from "element-plus";
import { CopyToClipboard } from "@abi-software/map-utilities";
import '@abi-software/map-utilities/dist/style.css';

export default {
  name: "FlatmapContextCard",
  components: {
    Loading,
    CopyToClipboard,
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
      loading: false,
      copyContent: '',
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
  mounted: function () {
    this.updateCopyContent();
  },
  methods: {
    updateCopyContent: function () {
      const contentArray = [];

      // Use <div> instead of <h1>..<h6> or <p>
      // to avoid default formatting on font size and margin

      contentArray.push(`<div><strong>Flatmap Provenance</strong></div>`);

      let versionContent = `<div>SCKAN version:</div>`;
      versionContent += `\n`;
      versionContent += `<div><a href="${this.sckanReleaseLink}">${this.sckanReleaseLink}</a></div>`;
      contentArray.push(versionContent);

      let publishedContent = `<div>Published on:</div>`;
      publishedContent += `\n`;
      publishedContent += `<div>${this.flatmapPublishedDisplay}</div>`;
      contentArray.push(publishedContent);

      let publicationContent = `<div>View publication:</div>`;
      publicationContent += `\n`;
      publicationContent += `<div><a href="${this.flatmapSource}">${this.flatmapSource}</a></div>`;
      contentArray.push(publicationContent);

      this.copyContent = contentArray.join('\n\n<br>');
    },
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">


.flatmap-context-card{
  background-color: white;
  font-size: 12px;
  position: relative;
  display: flex;
  width: 100%;
  max-height: 258px;
  padding: 10px;
}

.card-right {
  flex: 1;
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

.float-button-container {
  position: absolute;
  bottom: 6px;
  right: 12px;
  opacity: 0;
  visibility: hidden;

  .flatmap-context-card:hover & {
    opacity: 1;
    visibility: visible;
  }
}
</style>
