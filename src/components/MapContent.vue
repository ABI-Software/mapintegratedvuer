<template>
    <div class="mapcontent" ref="MapApp">
      <SvgSpriteColor/>
      <FloatingFlow @onFullscreen="onFullscreen" :state="state" ref="flow"/>
    </div>
</template>

<script>
/* eslint-disable no-alert, no-console */
import FloatingFlow from './FloatingFlow';
import EventBus from './EventBus';
import store from '../store';
import {SvgSpriteColor} from '@abi-software/svg-sprite';

/**
 * Content of the app. More work flows will be added here.
 */
export default {
  name: "MapContent",
  components: {
    FloatingFlow,
    SvgSpriteColor,
  },
  props: {
    shareLink: {
      type: String,
      default: undefined
    },
    state: {
      type: Object,
      default: undefined
    },
    api: {
      type: String,
      default: undefined
    },
    flatmapAPI: {
      type: String,
      default: undefined
    }
  },
  methods: {
    isFullscreen: function(){
      return (document.fullscreenElement || document.webkitFullscreenElement ||
        document.mozFullScreenElement || document.msFullscreenElement )
    },
    onFullscreen: function(fullscreenReq) {
      //If a request is sent, try it
      if (fullscreenReq !== undefined){
        if (fullscreenReq && !this.isFullscreen()){
          this.goFullscreen()
        }
        if(!fullscreenReq && this.isFullscreen()){
          this.leaveFullscreen()
        }
      }
      // Else we toggle fullscreen
      else{
        if(this.isFullscreen()){
          this.leaveFullscreen()
        } else {
          this.goFullscreen()
        }
      }
    },
    leaveFullscreen: function(){
      if (this.isFullscreen()) {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.mozCancelFullScreen) { /* Firefox */
          document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE/Edge */
          document.msExitFullscreen();
        }
      }

    },
    goFullscreen: function(){
      let mapApp = this.$refs.MapApp;
      if (mapApp.requestFullscreen) {
        mapApp.requestFullscreen();
      } else if (mapApp.mozRequestFullScreen) { /* Firefox */
        mapApp.mozRequestFullScreen();
      } else if (mapApp.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
        mapApp.webkitRequestFullscreen();
      } else if (parent.msRequestFullscreen) { /* IE/Edge */
        mapApp.msRequestFullscreen();
      }
    },
    setState: function(state){
      return this.$refs.flow.setState(state);
    },
    getState: function(){
      return this.$refs.flow.getState();
    },
  },
  watch: {
    "shareLink" : {
      handler: function (newLink) {
        store.commit("settings/updateShareLink", newLink);
      },
      immediate: true,
    },
  },
  beforeMount: function() {
    if (this.api) {
      store.commit("settings/updateAPI", this.api);
    }
    if (this.flatmapAPI) {
      store.commit("settings/updateFlatmapAPI", this.flatmapAPI);
    }
  },
  mounted: function() {
    EventBus.$on("updateShareLinkRequested", () => {
      this.$emit("updateShareLinkRequested");
    });
  }
}

</script>

<style scoped>
.map-help-dialog{
  position: fixed;
  z-index: 20;
  bottom: 30px;
  right: 30px;
}
.sidebar{
  position: fixed;
  z-index: 8;
  bottom: 0px;
  right: 30px;
}
.mapcontent {
  height: 100%;
  width:100%;
  z-index:1;
}

</style>
<style src="@/../assets/mapicon-species-style.css">
</style>
<style src="@/../assets/styleguide.css">
</style>

