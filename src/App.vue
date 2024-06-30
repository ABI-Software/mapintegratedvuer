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
              <el-row class="row" :gutter="20">
                <el-button @click="saveSettings()" size="small">Save Settings</el-button>
                <el-button @click="restoreSettings()" size="small">Restore Settings</el-button>
                <el-button @click="getShareableURL()" size="small">Get Link</el-button>
              </el-row>
              <el-row class="row" :gutter="20">
                <el-button @click="setMultiFlatmap()" size="small">Set MultiFlatmap</el-button>
                <el-button @click="setLegacyMultiFlatmap()" size="small">Set Legacy MultiFlatmap</el-button>
                <el-button @click="setScaffold()" size="small">Set To Scaffold</el-button>
                <el-button @click="setFlatmap()" size="small">Set Flatmap</el-button>
                <el-button @click="setSearch()" size="small">Set Search</el-button>
              </el-row>
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
        @updateShareLinkRequested="updateUUID"
        @isReady="mapIsReady"
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
      ElIconSetting: shallowRef(ElIconSetting)
    }
  },
  computed: {
    shareLink: function() {
      if (this.uuid)
        return this.prefix +"?id=" + this.uuid;
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
    saveSettings: function() {
      this.mapSettings.push(this.$refs.map.getState());
    },
    restoreSettings: function() {
      if (this.mapSettings.length > 0)
        this.$refs.map.setState(this.mapSettings.pop());
    },
    updateUUID: function() {
      let xmlhttp = new XMLHttpRequest();
      let url = this.api + 'map/getshareid';
      let state = this.$refs.map.getState();
      xmlhttp.open('POST', url, true);
      //Send the proper header information along with the request
      xmlhttp.setRequestHeader('Content-type', 'application/json');
      xmlhttp.onreadystatechange = () => {//Call a function when the state changes.
          if(xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            let state = JSON.parse(xmlhttp.responseText);
            this.uuid = state.uuid;
          }
      }
      xmlhttp.send(JSON.stringify({"state": state}));

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
    setSearch: function() {
      this.$refs.map.openSearch([], "10.26275/1uno-tynt");
    },
    mapIsReady: function() {
      console.log("map is ready")
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
                this.state = state.state;
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
#app {
  height:100%;
  width: 100%;
  position:absolute;
  font-family: "Asap",sans-serif;
  --el-color-primary: #8300BF;
  --el-color-primary-light-7: #dab3ec;
  --el-color-primary-light-8: #e6ccf2;
  --el-color-primary-light-9: #f3e6f9;
}

body {
  margin: 0px;
}

.map-app {
  position:absolute;
  height: calc(100% - 104px);
  width:calc(100% - 54px);
  margin-top:20px;
  margin-left:26px;
  margin-right:26px;
  border: solid 1px #dcdfe6;
  box-shadow: 0 1px 8px 0 rgba(0, 0, 0, 0.06);
}

.popover{
  top:10px;
  right:50%;
  position:absolute;
  z-index:1000;
}

.row {
  margin-bottom: 5px;
  &:last-child {
    margin-bottom: 0;
  }
}

.button-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height:50px;
}


.options-container{
  text-align: center;
}

.map-icon {
  color: $app-primary-color!important;
}
</style>
