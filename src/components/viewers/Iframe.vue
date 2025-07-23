<template>
  <div class="map-iframe-container">
      <iframe class="my-iframe"  :src="entry.resource.share_link" ref="iframe"></iframe>
  </div>
</template>

<script>
/* eslint-disable no-alert, no-console */
import ContentMixin from "../../mixins/ContentMixin";

export default {
  name: "Iframe",
  mixins: [ ContentMixin ],
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">

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
