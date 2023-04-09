<template>
  <div id="app">
    <link rel="stylesheet"
      href="https://fonts.googleapis.com/css?family=Asap:400,400i,500,600,700&display=swap">
    <map-svg-sprite-color />
    <el-popover
      placement="bottom"
      trigger="click"
      width=500
      class="popover"
      :appendToBody=false
      >
      <div class="options-container">
        <el-row class="row" :gutter="20">
          <el-button @click="saveSettings()" size="mini">Save Settings</el-button>
          <el-button @click="restoreSettings()" size="mini">Restore Settings</el-button>
          <el-button @click="getShareableURL()" size="mini">Get Link</el-button>
        </el-row>
        <el-row class="row" :gutter="20">
          <el-button @click="setMultiFlatmap()" size="mini">Set MultiFlatmap</el-button>
          <el-button @click="setLegacyMultiFlatmap()" size="mini">Set Legacy MultiFlatmap</el-button>
          <el-button @click="setScaffold()" size="mini">Set To Scaffold</el-button>
          <el-button @click="setSearch()" size="mini">Set Search</el-button>
        </el-row>
      </div>
      <el-button icon="el-icon-setting" slot="reference">Options</el-button>
    </el-popover>
    <div class="map-app">
      <MapContent ref="map" :options="options" :state="state" :shareLink="shareLink" @updateShareLinkRequested="updateUUID"/>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-alert, no-console */
import MapContent from './components/MapContent.vue';
import Vue from "vue";
import {
  Button,
  Col,
  Popover,
  Row,
} from 'element-ui';
Vue.use(Button);
Vue.use(Col);
Vue.use(Popover);
Vue.use(Row);

export default {
  name: 'app',
  components: {
    MapContent
  },
  data: function() {
    return {
      uuid: undefined,
      state: undefined,
      prefix: "/map",
      api: process.env.VUE_APP_API_LOCATION,
      mapSettings: [],
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
        sparcApi: process.env.VUE_APP_API_LOCATION,
        algoliaIndex: process.env.VUE_APP_ALGOLIA_INDEX,
        algoliaKey: process.env.VUE_APP_ALGOLIA_KEY,
        algoliaId: process.env.VUE_APP_ALGOLIA_ID,
        pennsieveApi: process.env.VUE_APP_PENNSIEVE_API_LOCATION,
        flatmapAPI: process.env.VUE_APP_FLATMAPAPI_LOCATION,
        nlLinkPrefix: process.env.VUE_APP_NL_LINK_PREFIX,
        rootUrl: process.env.VUE_APP_ROOT_URL,
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
          organ: "heart"
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
  },
  created: function() {
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
  },
  mounted: function() {
    //this.setMultiFlatmap();
    //this.setScaffold();
    //window.map = this.$refs.map
    //this.setSearch();
  },
}
</script>

<style lang="scss">
@import "~element-ui/packages/theme-chalk/src/button";
@import "~element-ui/packages/theme-chalk/src/popover";
@import "~element-ui/packages/theme-chalk/src/row";

#app {
  height:100%;
  width: 100%;
  position:absolute;
  font-family: "Asap",sans-serif;
}

body {
  margin: 0px;
}

.map-app {
  position:absolute;
  height: calc(100% - 104px);
  width:calc(100% - 54px);
  margin-top:70px;
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

.options-container{
  text-align: center;
}

.map-icon {
  color: $app-primary-color!important;
}
</style>
