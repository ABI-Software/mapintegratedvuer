<template>
  <div id="app">
    <link rel="stylesheet"
      href="https://fonts.googleapis.com/css?family=Asap:400,400i,500,600,700&display=swap">
      <div class="button-container">
        <el-popover
          placement="bottom"
          trigger="click"
          width=500
          class="popover"
          :teleported=false
          >
            <div class="options-container">
              <div class="row">
                <el-button @click="saveSettings()" size="small">Save Settings</el-button>
                <el-button @click="restoreSettings()" size="small">Restore Settings</el-button>
                <el-button @click="getShareableURL()" size="small">Get Link</el-button>
              </div>
              <div class="row">
                <el-button @click="setMultiFlatmap()" size="small">Set MultiFlatmap</el-button>
                <el-button @click="setLegacyMultiFlatmap()" size="small">Set Legacy MultiFlatmap</el-button>
                <el-button @click="setScaffold()" size="small">Set To Scaffold</el-button>
                <el-button @click="setWholebody()" size="small">Set to Wholebody</el-button>
                <el-button @click="setFlatmap()" size="small">Set Flatmap</el-button>
                <el-button @click="setSearch()" size="small">Set Search</el-button>
              </div>
            </div>
            <template #reference>

                <el-button class="options-button" :icon="ElIconSetting">Options</el-button>

            </template>
        </el-popover>
      </div>
    <div class="map-app">
      <MapContent
        ref="map"
        :startingMap="startingMap"
        :options="options"
        :state="state"
        :shareLink="shareLink"
        :useHelpModeDialog="true"
        :connectivityInfoSidebar="true"
        :allClosable="false"
        :showGlobalSettings="true"
        :showOpenMapButton="true"
        @updateShareLinkRequested="updateUUID"
        @isReady="viewerIsReady"
        @mapLoaded="mapIsLoaded"
      />
    </div>
  </div>
</template>

<script>
/* eslint-disable no-alert, no-console */
import { shallowRef } from 'vue';
import MapContent from './components/MapContent.vue';
import { Setting as ElIconSetting } from '@element-plus/icons-vue'
import {
  ElButton as Button,
  ElCol as Col,
  ElPopover as Popover,
  ElRow as Row,
} from 'element-plus';


const getAnnotationId = (api, withAnnotation) => {
  return new Promise((resolve) => {
    let anonymousAnnotations = JSON.parse(sessionStorage.getItem('anonymous-annotation')) || undefined;
    if (withAnnotation && anonymousAnnotations) {
      let maxRetry = 3;
      const annotationUrl = api + '/annotation/getshareid';
      const getId = (attempt) => {
        fetch(annotationUrl, {
          method: 'POST',
          headers: {
            'Content-type': 'application/json',
          },
          body: JSON.stringify({ state: anonymousAnnotations }),
        }).then((response) => {
          if (response.ok) {
            return response.json();
          }
          throw new Error('Unsuccessful attempt to get annotation id')
        })
        .then((data) => {
          resolve(data.uuid);
        })
        .catch((error) => {
          if (maxRetry > attempt) {
            getId(attempt + 1);
          } else {
            resolve(undefined);
          }
        })
      }
      getId(1);
    } else {
      resolve(undefined);
    }
  });
}

const getAnnotationState = (api, annotationId) => {
  return new Promise((resolve) => {
    let maxRetry = 3;
    const annotationUrl = api + '/annotation/getstate';
    const getState = (attempt) => {
      fetch(annotationUrl, {
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify({ uuid: annotationId }),
      }).then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Unsuccessful attempt to get annotations');
      })
      .then((data) => {
        resolve(data);
      })
      .catch((error) => {
        console.log(`Unable to get annotation state: attempt ${attempt} of ${maxRetry}`);
        if (maxRetry > attempt) {
          getState(attempt + 1);
        } else {
          resolve(undefined);
        }
      })
    }
    getState(1);
  });
}

export default {
  name: 'app',
  components: {
    Button,
    Col,
    Popover,
    Row,
    MapContent,
  },
  data: function() {
    return {
      uuid: undefined,
      state: undefined,
      prefix: "/map",
      api: import.meta.env.VITE_API_LOCATION,
      mapSettings: [],
      startingMap: "AC",
      ElIconSetting: shallowRef(ElIconSetting),
    }
  },
  computed: {
    shareLink: function() {
      if (this.uuid)
        return this.prefix +"#/?id=" + this.uuid;
      return this.prefix;
    },
    options: function() {
      return {
        sparcApi: import.meta.env.VITE_API_LOCATION,
        algoliaIndex: import.meta.env.VITE_ALGOLIA_INDEX,
        algoliaKey: import.meta.env.VITE_ALGOLIA_KEY,
        algoliaId: import.meta.env.VITE_ALGOLIA_ID,
        pennsieveApi: import.meta.env.VITE_PENNSIEVE_API_LOCATION,
        flatmapAPI: import.meta.env.VITE_FLATMAPAPI_LOCATION,
        nlLinkPrefix: import.meta.env.VITE_NL_LINK_PREFIX,
        rootUrl: import.meta.env.VITE_ROOT_URL,
      }
    }
  },
  methods: {
    changeViewingMode: function(modeName) {
      this.$refs.map.changeViewingMode(modeName);
    },
    saveSettings: function() {
      this.mapSettings.push(this.$refs.map.getState());
    },
    restoreSettings: function() {
      if (this.mapSettings.length > 0)
        this.$refs.map.setState(this.mapSettings.pop());
    },
    updateUUID: function(withAnnotation) {
      let url = this.api + 'map/getshareid';
      let state = this.$refs.map.getState(false);

      const maxRetry = 3;
      const getShareLink = (attempt) => {
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-type': 'application/json',
          },
          body: JSON.stringify({ state: state }),
        })
        .then((response) => {
          if (response.ok) {
            return response.json()
          }
          throw new Error('Unsuccessful attempt to get shareid')
        })
        .then((data) => {
          this.uuid = data.uuid
        })
        .catch((error) => {
          console.log(`Unable to create permalink: attempt ${attempt} of ${maxRetry}`)
          if (maxRetry > attempt) {
            getShareLink(attempt + 1)
          }
        })
      }
      getAnnotationId(this.api, withAnnotation).then((annotationId) => {
        if (annotationId) {
          state.annotationId = annotationId;
        }
        getShareLink(1)
      });

    },
    setFlatmap: function() {
      this.$refs.map.setCurrentEntry(
        {
          type: "Flatmap",
          resource: "FunctionalConnectivity",
          label: "Functional"
        }
      );
    },
    setLegacyMultiFlatmap: function() {
      this.$refs.map.setCurrentEntry(
        {
          type: "MultiFlatmap",
          taxo: "NCBITaxon:10114",
          uuid: "01fedbf9-d783-509c-a10c-827941ab13da",
        }
      );
    },
    setMultiFlatmap: function() {
      this.$refs.map.setCurrentEntry(
        {
          type: "MultiFlatmap",
          taxo: "NCBITaxon:9606",
          biologicalSex: "PATO:0000384",
          //organ: "heart"
          organ: "UBERON:0018675"
        }
      );
    },
    setScaffold: function() {
      this.$refs.map.setCurrentEntry(
        {
          type: "Scaffold",
          label: "Colon",
          url: "https://mapcore-demo.org/current/sparc-api-v2/s3-resource/221/3/files/derivative/Scaffolds/mouse_colon_metadata.json",
          viewUrl: "M16_view.json"
        }
      );
    },
    setWholebody: function() {
      this.$refs.map.setCurrentEntry(
        {
          type: "Scaffold",
          label: "Human",
          isBodyScaffold: true
        }
      );
    },
    setSearch: function() {
      this.$refs.map.openSearch([], "10.26275/1uno-tynt");
    },
    mapIsLoaded: function(map) {
      console.log("map is loaded", map)
      // map.changeViewingMode('Annotation')
    },
    viewerIsReady: function() {
      console.log("viewer is ready")
    },
    parseQuery: function () {
      this.$router.isReady().then(() => {
        this.uuid = this.$route.query.id;
        if (window) {
          this.prefix = window.location.origin + window.location.pathname;
        }
        if (this.uuid) {
          let xmlhttp = new XMLHttpRequest();
          let url = this.api + 'map/getstate';
          xmlhttp.open('POST', url, true);
          //Send the proper header information along with the request
          xmlhttp.setRequestHeader('Content-type', 'application/json');
          xmlhttp.onreadystatechange = () => {//Call a function when the state changes.
              if(xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                let state = JSON.parse(xmlhttp.responseText);
                console.log(state)
                if (state?.state?.annotationId) {
                  getAnnotationState(this.api, state.state.annotationId).
                  then((data) => {
                    if (data) {
                      sessionStorage.setItem('anonymous-annotation', JSON.stringify(data.state))
                    }
                    this.state = state.state;
                  });
                } else {
                  this.state = state.state;
                }
              }
          }
          xmlhttp.send(JSON.stringify({"uuid": this.uuid}));
        }
      })
    },
  },
  mounted: function() {
    this.parseQuery();
  },
}
</script>

<style lang="scss">
$button-container-size: 50px;
$gap: 24px;

#app {
  height:100%;
  width: 100%;
  position:absolute;
  font-family: "Asap",sans-serif;
  background-color: #f5f7fa;
  --el-color-primary: #8300BF;
  --el-color-primary-light-7: #dab3ec;
  --el-color-primary-light-8: #e6ccf2;
  --el-color-primary-light-9: #f3e6f9;
}

body {
  margin: 0px;
}

.map-app {
  margin: 0 auto;
  width: calc(100% - #{$gap * 2});
  height: calc(100% - #{$button-container-size + $gap});
  border: solid 1px #dcdfe6;
  box-shadow: 0 1px 8px 0 rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
  position: relative;
}

.popover{
  top:10px;
  right:50%;
  position:absolute;
  z-index:1000;
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;

  + .row {
    margin-top: 12px;
  }

  .el-button + .el-button {
    margin: 0;
  }
}

.button-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: $button-container-size;
}


.options-container{
  text-align: center;
}

.map-icon {
  color: $app-primary-color!important;
}
</style>
