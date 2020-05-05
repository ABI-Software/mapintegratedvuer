<template>
    <div style="height: 100%;width:100%;z-index:1" ref="MapApp">
      <FloatingFlow @onFullscreen="onFullscreen"/>
    </div>
</template>

<script>
/* eslint-disable no-alert, no-console */
import FloatingFlow from './FloatingFlow';

/**
 * Content of the app. More work flows will be added here.
 */
export default {
  name: "MapContent",
  components: {
    FloatingFlow
  },
  methods: {
    onFullscreen: function() {
      let mapApp = this.$refs.MapApp;
      if (document.fullscreenElement || document.webkitFullscreenElement ||
        document.mozFullScreenElement || document.msFullscreenElement ) {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.mozCancelFullScreen) { /* Firefox */
          document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE/Edge */
          document.msExitFullscreen();
        }
      } else {
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
  }
};
</script>

