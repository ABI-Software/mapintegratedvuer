<template>
  <div class="map-container" ref="container">
    <NavBar></NavBar>
    <div class="map-app">
      <MapContent />
    </div>
  </div>
</template>

<script>
/* eslint-disable no-alert, no-console */
import MapContent from './MapContent.vue';
import NavBar from './NavBar';

export default {
  /**
   * The integrated webapp including the navigation bar.
   * This does not get publish.
   */
  name: "MapIntegratedVuer",
  components: {
    MapContent,
    NavBar
  }
};
</script>

<style>
.map-container {
  height: 100%;
  width: 100%;
}

.map-app {
  position:absolute;
  height: calc(100% - 104px);
  width:calc(100% - 54px);
  margin-top:19px;
  margin-left:26px;
  margin-right:26px;
  border: solid 1px #dcdfe6;
  box-shadow: 0 1px 8px 0 rgba(0, 0, 0, 0.06);
}

</style>
<style src="@/../assets/styleguide.css">
</style>
