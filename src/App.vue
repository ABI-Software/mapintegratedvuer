<template>

  <div id="app">
    <svg-sprite-color />
    <el-popover
      placement="bottom"
      trigger="click"
      width=500
      class="popover"
      :appendToBody=false
      >
      <div class="options-container">
        <el-row :gutter="20">
          <el-button @click="saveSettings()" size="mini">Save Settings</el-button>
          <el-button @click="restoreSettings()" size="mini">Restore Settings</el-button>
          <el-button @click="getShareableURL()" size="mini">Get Link</el-button>
        </el-row>
      </div>
      <el-button icon="el-icon-setting" slot="reference">Options</el-button>
    </el-popover>
    <div class="map-app">
      <MapContent ref="map" :api="api" :state="state" :shareLink="shareLink" :flatmapAPI="flatmapAPI" @updateShareLinkRequested="updateUUID"/>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-alert, no-console */
import MapContent from './components/MapContent.vue';
import Vue from "vue";
import {
  Popover,
  Row,
} from 'element-ui';
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
      flatmapAPI: process.env.VUE_APP_FLATMAPAPI_LOCATION 
    }
  },
  computed: {
    shareLink: function() {
      if (this.uuid)
        return this.prefix +"?id=" + this.uuid;
      return this.prefix;
    }
  },
  methods: {
    saveSettings: function() {
      this._mapSettings.push(this.$refs.map.getState());
    },
    restoreSettings: function() {
      if (this._mapSettings.length > 0)
        this.$refs.map.setState(this._mapSettings.pop());
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

    }
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
    this._mapSettings = [];
  },
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Asap&display=swap');

#app {
  height:100%;
  width: 100%;
  position:absolute;
}
body {
  font-family: "Asap",sans-serif;
  line-height: 1.5rem;
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

.el-row {
  margin-bottom: 5px;
  &:last-child {
    margin-bottom: 0;
  }
}

.options-container{

  text-align: center;
}
</style>
