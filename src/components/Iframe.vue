<template>
  <div class="map-iframe-container">
      <iframe class="my-iframe"  :src="url"></iframe>
  </div>
</template>

<script>
/* eslint-disable no-alert, no-console */

export default {
  name: "IframeVuer",
  props: { 
    url: String,
  },

};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

.map-iframe-container {
  height: 100%;
  width: 100%;
}

.my-iframe {
  height:100%;
  width:100%;
  position:relative;
  border-width:0px;
}
</style>
