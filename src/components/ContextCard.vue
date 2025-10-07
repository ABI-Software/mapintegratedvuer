<template>
  <div class="context-card-container"  ref="container">
    <div v-show="showContextCard">
      <div v-if="showDetails && Object.keys(contextData).length !== 0" v-loading="loading" class="context-card" >
        <div class="card-left">
          <img :src="banner" class="context-image">
        </div>
        <div class="card-right scrollbar">
          <div>
            <div class="title">{{contextData.heading}}</div>
            <div v-html="parseMarkdown(contextData.description)"/>
            <!-- <br/> -->
          </div>
        </div>
        <div class="card-bottom">
          <div v-loading="loadingOriginalSource">
            <el-collapse v-if="originalSource && originalSource.length" v-model="activeName">
              <el-collapse-item title="View/Hide source data links" name="sourceDataLinks">
                <ul class="source-data-list">
                  <template v-for="(source, i) in originalSource" :key="'source-'+ i">
                    <li>
                      <a v-if="source && source.path" :href="generateFileLink(source)" target="_blank">View {{source.name}}</a>
                    </li>
                  </template>
                </ul>
              </el-collapse-item>
            </el-collapse>
          </div>
          <div v-if="flatmapSource && flatmapSource.length" class="flatmap-entry">
            Associated flatmaps from source:
            <ul class="source-data-list">
              <template v-for="(source, i) in flatmapSource" :key="'flatmap-' + i">
                <li>
                  <span @click="flatmapClick(source)">
                    For {{ source.name }}
                  </span>
                </li>
              </template>
            </ul>
          </div>
          <div>
            <!-- Show sampeles and views seperately if they do not match -->
            <template v-if="!samplesUnderViews">
              <div v-if="contextData.views && contextData.views.length > 0" class="subtitle">Scaffold Views</div>
              <template v-for="(view, i) in contextData.views" :key="i+'_1'">
                <div @click="openViewFile(view)" class="context-card-view">
                  <img class="view-image" :src="getFileFromPath(view.thumbnail)">
                  <div class="view-description">{{view.description}}</div>
                </div>
                <div class="padding"/>
              </template>
              <div style="margin-bottom: 16px;"/>
              <div v-if="contextData.samples && contextData.samples.length > 0" class="subtitle">Samples on Scaffold</div>
              <template v-for="(sample, i) in contextData.samples" :key="i+'_3'">
                  <span class="context-card-item cursor-pointer" @click="toggleSampleDetails(i)">
                    <div v-bind:key="i+'_6'" style="display: flex">
                      <div v-if="sample.color" class="color-box" :style="'background-color:'+ sample.color"></div>
                      <img class="key-image" v-else-if="sample.thumbnail" :src="getFileFromPath(sample.thumbnail)">
                      {{sample.heading}}
                      <i class="el-icon-warning-outline info"></i>
                    </div>
                  </span>
                  <div v-if="sampleDetails[i]" v-html="sample.description"/>
                  <a v-if="sampleDetails[i] && sample.path" :href="generateFileLink(sample)" target="_blank">View Source</a>
                  <div class="padding"/>
              </template>
            </template>

            <!-- Show samples under views if the ids match -->
            <template v-else>
              <div v-if="contextData.views && contextData.views.length > 0" class="subtitle">Scaffold Views</div>
              <template v-for="(view, i) in contextData.views" :key="i+'_1'">
                <span  @click="viewClicked(view, i)" class="context-card-view">
                  <img class="view-image" :src="getFileFromPath(view.thumbnail)"/>
                  <div class="view-description">{{view.description}}<i class="el-icon-warning-outline info"></i> </div>
                </span>
                <div v-if="sampleDetails[i]" v-html="samplesMatching(view.id).description"/>
                <a v-bind:key="i+'_5'" v-if="sampleDetails[i] && samplesMatching(view.id).path" :href="generateFileLink(samplesMatching(view.id))" target="_blank">View Source</a>
                <div class="padding"/>

                <!-- Extra padding if sample details is open -->
                <div v-if="sampleDetails[i]" class="padding"/>
              </template>
            </template>
          </div>
        </div>
      </div>

      <!-- Copy to clipboard button container -->
      <div class="float-button-container">
        <CopyToClipboard :content="copyContent" @copied="onCopied" theme="light" />
      </div>
    </div>
  </div>
</template>


<script>
/* eslint-disable no-alert, no-console */
import { CopyToClipboard } from "@abi-software/map-utilities";
import { mapStores } from 'pinia';
import tagging from '../services/tagging';
import '@abi-software/map-utilities/dist/style.css';
import EventBus from './EventBus';
//provide the s3Bucket related methods and data.
import S3Bucket from "../mixins/S3Bucket.vue";
import { useSettingsStore } from '../stores/settings';

import { marked } from 'marked'
import xss from 'xss'

const addFilesToPathIfMissing = function(path){
  if (!path.includes('files')){
    return 'files/' + path
  } else {
    return path
  }
}

const convertBackslashToForwardSlash = function(path){
  path = path.replaceAll('\\','/')
  path = path.replaceAll('\\\\', '/')
  return path
}

// const switchPathToDirectory = function(path){
//   let newPath = path.split('/')
//   newPath.pop()
//   return newPath.join('/')
// }


export default {
  name: "contextCard",
  components: {
    CopyToClipboard,
  },
  mixins: [S3Bucket],
  props: {
    /**
     * Object containing information for
     * the required viewing.
     */
    entry: Object,
    envVars: Object,
  },
  data: function () {
    return {
      contextData: {},
      showDetails: true,
      showContextCard: true,
      sampleDetails: {},
      loading: false,
      loadingOriginalSource: true,
      originalSource: [],
      flatmapSource: [],
      activeName: "",
      copyContent: "",
    };
  },
  watch: {
    'entry.contextCardUrl': {
      handler(val){
        if (val) {
          // used for hardcoding data
          if (val === true){
            console.error('asked for hardcoding but none provided')
          } else {
            this.getContextFile(val)
            this.showContextCard = true
          }
        } else {
          this.showContextCard = false
        }
      },
      immediate: true
    },
    'entry.s3uri': {
      handler(val){
        this.updateS3Bucket(val);
      },
      immediate: true
    }
  },
  computed: {
    ...mapStores(useSettingsStore),
    flatmapAPI: function() {
      return this.settingsStore.flatmapAPI;
    },
    samplesUnderViews: function(){
      if (this.contextData){
        if (this.contextData.samplesUnderViews){
          return true
        } else {
          let viewId = this.contextData.views?.map(v=>v.id) || [];
          let samplesView = this.contextData.samples?.map(s=>s.view) || [];

          // get matching values
          let matching = viewId.filter(v=>samplesView.includes(v))

          // check all arrays have the same length (which means all values are in all three)
          if ( viewId.length === matching.length && matching.length === samplesView.length){
            return true
          }
        }
      }
      return false;
    },
    banner: function(){
      if (this.contextData.banner){
        return this.getFileFromPath(this.contextData.banner)
      } else if (this.contextData && this.contextData.views && this.contextData.views.length > 0) {
        if(this.contextData.views[0].thumbnail){
          return this.getFileFromPath(this.contextData.views[0].thumbnail)
        }
      }
      return this.entry.banner
    },
  },
  methods: {
    flatmapClick: function(source) {
      const newView = {
        type: "Flatmap",
        resource: source.flatmapUUID,
        label: this.contextData.heading
      };
      EventBus.emit("CreateNewEntry", newView);
    },
    updateCopyContent: function () {
      const contentArray = [];

      // Use <div> instead of <h1>..<h6> or <p>
      // to avoid default formatting on font size and margin

      if (this.contextData.heading) {
        contentArray.push(`<div><strong>${this.contextData.heading}</strong></div>`);
      }

      if (this.contextData.description) {
        contentArray.push(`<div>${this.contextData.description}</div>`);
      }

      if (this.originalSource && this.originalSource.length) {
        let sourceDataLinks = '<div><strong>Source data links</strong></div>';
        const sourceLinks = [];

        this.originalSource.forEach((source, i) => {
          const path = this.generateFileLink(source);
          let sourceContent = `<div>${source.name}</div>`;
          sourceContent += `\n`;
          sourceContent += `<div><a href="${path}">${path}</a></div>`;
          sourceLinks.push(`<li>${sourceContent}</li>`);
        });
        sourceDataLinks += '\n\n';
        sourceDataLinks += `<ul>${sourceLinks.join('\n')}</ul>`;
        contentArray.push(sourceDataLinks);
      }

      if (this.flatmapSource && this.flatmapSource.length) {
        let flatmapDataLinks = '<div><strong>Associated flatmaps from source</strong></div>';
        const flatmapLinks = [];

        this.flatmapSource.forEach((source, i) => {
          const path = this.generateFileLink(source);
          let flatmapContent = `<div>${source.name}</div>`;
          let flatmapSource = this.flatmapAPI ? 
            `${this.flatmapAPI}viewer?id=${source.flatmapUUID}` : source.flatmapUUID;
          flatmapContent += `\n`;
          flatmapContent += `<div><a href="${flatmapSource}">${flatmapSource}</a></div>`;
          flatmapLinks.push(`<li>${flatmapContent}</li>`);
        });
        flatmapDataLinks += '\n\n';
        flatmapDataLinks += `<ul>${flatmapLinks.join('\n')}</ul>`;
        contentArray.push(flatmapDataLinks);
      }

      if (this.contextData.views?.length) {
        let scaffoldViews = '<div><strong>Scaffold Views</strong></div>';
        const views = [];

        this.contextData.views.forEach((view, i) => {
          const viewContents = [];
          const viewPath = this.getFileFromPath(view.path);
          let viewContent = `<div>${view.description}</div>`;
          viewContent += `\n`;
          viewContent += `<div><a href="${viewPath}">${viewPath}</a></div>`;
          viewContents.push(viewContent);

          if (this.samplesUnderViews) {
            const description = this.samplesMatching(view.id).description;
            let sampleContent = `<div>${description}</div>`;

            if (this.samplesMatching(view.id).path) {
              sampleContent += `\n`;
              const url = this.generateFileLink(this.samplesMatching(view.id));
              sampleContent += `<div><a href="${url}">${url}</a></div>`;
            }
            viewContents.push(sampleContent);
          }
          const viewContentStr = viewContents.join('\n');
          views.push(`<li>${viewContentStr}</li>`);
        });
        scaffoldViews += '\n\n';
        scaffoldViews += `<ul>${views.join('\n')}</ul>`;
        contentArray.push(scaffoldViews);
      }

      if (!this.samplesUnderViews) {
        if (this.contextData.samples?.length) {
          let sampleViews = '<div><strong>Samples on Scaffold</strong></div>';
          const samples = [];

          this.contextData.samples.forEach((sample, i) => {
            let sampleContents = '';
            sampleContents += `<div>${sample.heading}</div>`;
            sampleContents += `\n`;
            sampleContents += `<div>${sample.description}</div>`;
            if (sample.path) {
              const url = this.generateFileLink(sample);
              sampleContents += `\n`;
              sampleContents += `<div><a href="${url}">${url}</a></div>`;
            }
            samples.push(`<li>${sampleContents}</li>`);
          });
          sampleViews += '\n\n';
          sampleViews += `<ul>${samples.join('\n')}</ul>`;
          contentArray.push(sampleViews);
        }
      }

      return contentArray.join('\n\n<br>');
    },
    samplesMatching: function(viewId){
      if (this.contextData && this.contextData.samples){
        return this.contextData.samples.filter(s=>s.view == viewId)[0]
      }
      else return []
    },
    viewClicked: function(view, i){
      this.openViewFile(view)
      this.toggleSampleDetails(i)
    },
    getContextFile: function (contextFileUrl) {
      this.loading = true
      fetch(contextFileUrl)
        .then((response) =>{
          if (!response.ok){
            throw Error(response.statusText)
          } else {
             return response.json()
          }
        })
        .then((data) => {
          this.contextData = data
          this.loading = false
          this.addDiscoverIdsToContextData()
        })
        .catch((err) => {
          //set defaults if we hit an error
          console.error('caught error!', err)
          this.loading = false
        });
    },
    removeDoubleFilesPath: function(path){
      if (path) {
        if (path.includes('files/')){
          return path.replace('files/', '')
        } else if (path.includes('files\\')) {
          return path.replace('files\\', '')
        } else {
          return path
        }
      }
    },
    toggleSampleDetails: function(i){
      if (this.sampleDetails[i] === undefined){
        this.sampleDetails[i] = true;
      } else {
        this.sampleDetails[i] = !this.sampleDetails[i];
      }
    },
    getFileFromPath: function(path){
      // for hardcoded data
      if(this.entry.contextCardUrl === true){
        return path
      }
      path = this.removeDoubleFilesPath(path)
      return  `${this.envVars.API_LOCATION}s3-resource/${this.getS3Prefix()}files/${path}${this.getS3Args()}`
    },
    //  This is used later when generateing links to the resource on sparc.science (see generateFileLink)
    addDiscoverIdsToContextData(){
      this.contextData.samples.forEach((sample, i)=>{
        if (sample && sample.doi && sample.doi !== ""){
          fetch(`${this.envVars.PENNSIEVE_API_LOCATION}/discover/datasets/doi/${this.splitDoiFromUrl(sample.doi)}`)
          .then((response) => response.json())
          .then((data) => {
            this.contextData.samples[i].discoverId = data.id
            this.contextData.samples[i].version = data.version
          })
        } else {
            this.contextData.samples[i].discoverId = this.entry.discoverId
            this.contextData.samples[i].version = this.entry.version
        }
      })
    },
    processPathForUrl(path){
      path = convertBackslashToForwardSlash(path)
      path = addFilesToPathIfMissing(path)
      return encodeURIComponent(path)
    },
    splitDoiFromUrl(url){
      return url.split('https://doi.org/').pop()
    },
    generateFileLink(sample){
      const path = this.processPathForUrl(sample.path);
      let link = `${this.envVars.ROOT_URL}/datasets/file/${sample.discoverId}/${sample.version}` + '?path=';
      link = link + path;
      return link;
    },
    parseMarkdown(markdown){
      const returned_data = xss(marked.parse(markdown))
      this.$emit('context-ready')
      return returned_data
    },
    openViewFile: function(view){
      // note that we assume that the view file is in the same directory as the scaffold (viewUrls take relative paths)
      const viewUrl = this.getFileFromPath(view.path)
      this.$emit("scaffold-view-clicked", viewUrl);
    },
    getOriginalSource: function() {
      const discoverId = this.entry.discoverId
      const filesPos = 'files/'.length
      const path =  this.entry.resource.substring(
        this.entry.resource.indexOf("files/") + filesPos,
        this.entry.resource.lastIndexOf("?"))
      const params = new URLSearchParams({
        discoverId,
        path
      });
      const url = `${this.envVars.API_LOCATION}/file_info/get_original_source?${params.toString()}`
      fetch(url)
        .then((response) =>{
          if (!response.ok){
            throw Error(response.statusText)
          } else {
             return response.json()
          }
        })
        .then((data) => {
          this.loadingOriginalSource = false
          if (data.result) {
            data.result.forEach(result => {
              if (result.flatmapUUID) {
                this.flatmapSource.push(result)
              } else {
                this.originalSource.push(result)
              }
            })
            if (this.flatmapSource.length || this.originalSource.length) {
              this.copyContent = this.updateCopyContent()
            }
          }
          this.loadingOriginalSource = false
        })
        .catch((err) => {
          //set defaults if we hit an error
          console.error('caught error!', err)
          this.loadingOriginalSource = false
        });
    },
    onCopied: function () {
      const { label, type, discoverId } = this.entry;
      const category = type ? `${label} ${type}` : label;
      tagging.sendEvent({
        'event': 'interaction_event',
        'event_name': `portal_maps_context_card_copy`,
        'category': category || '',
        'location': 'map_toolbar',
        'dataset_id': discoverId ? discoverId + '' : '',
      });
    }
  },
  mounted: function() {
    this.copyContent = this.updateCopyContent()
    this.getOriginalSource()
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">

.hide{
  color: #e4e7ed;
  cursor: pointer;
}

.context-card-container {
  width: 100%;
  height: 100%;
  display: flex;
  font-family: Asap, sans-serif;
  justify-content: center;
  align-items: center;
  // text-align: initial; // default is justify
  word-break: initial;

  :deep(.el-collapse-item__header) {
    font-family: Asap, sans-serif;
    font-size: 14px;
    color: #606266;
    font-weight: 400;
  }
}

.context-card{
  background-color: white;
  font-size: 14px;
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  width: 100%;
  max-height: 258px;
  overflow-y: auto;
  scrollbar-width: thin;
  box-sizing: border-box;

  &:not(.context-card-container) {
    padding: 10px;
  }
}

.context-card-view{
  cursor: pointer;
  margin-bottom: 8px;
  display: flex;
  gap: 8px;
}

.view-image {
  width: 34px;
  height: auto;
}

.view-descriptions {
  flex: 8;
}

.context-card :deep(.el-card__body) {
  margin: 0px;
  display: flex;
  width: 516px;
}

.context-image{
  width: 150px;
  height: auto;
}

.color-box {
  width: 16px;
  height: 16px;
  border: solid 1px $app-primary-color;
  border-radius: 2px;
  margin-right: 8px;
}

.card-left{
  flex: 0.8
}

.card-right {
  flex: 1.5;
  word-break: normal !important;

  :deep(p:last-child) {
    margin-bottom: 0;
  }
}

.card-bottom {
  flex: 0 0 100%;
  max-width: 100%;
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
  margin-bottom: 8px;
}

.title{
  font-weight: bold;
}

.subtitle{
  font-weight: bold;
  margin-bottom: 8px;
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

  .context-card-container:hover & {
    opacity: 1;
    visibility: visible;
  }
}
 
.flatmap-entry {
  margin-top: 16px;
}

.context-card-container {
  a {
    color: #8300BF;
  }
}

.source-data-list {
  span {
    color: #8300BF;
    text-decoration: underline;
    cursor: pointer;
  }
}
</style>
