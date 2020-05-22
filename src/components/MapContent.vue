<template>
    <div style="height: 100%;width:100%;z-index:1" ref="MapApp">
      <FloatingFlow @onFullscreen="onFullscreen" ref="flow"/> 
      <tutorial :parentRefs="this.$refs"></tutorial>
    </div>
</template>

<script>
/* eslint-disable no-alert, no-console */
import FloatingFlow from './FloatingFlow';
import Tutorial from './Tutorial.vue'
import '../../assets/mapicon-species-style.css'

/**
 * Content of the app. More work flows will be added here.
 */
export default {
  name: "MapContent",
  components: {
    FloatingFlow,
    Tutorial
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
    }
  }
};
</script>

