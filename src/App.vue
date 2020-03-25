<template>
  <div id="app">
    <MapIntegratedVuer />
  </div>
</template>

<script>
import MapIntegratedVuer from './components/MapIntegratedVuer.vue'
import '../assets/fonts.css'
import  './styleguide.css'
import '../assets/mapicon-species-style.css'

export default {
  name: 'app',
  components: {
    MapIntegratedVuer
  }
}
</script>

<style>
#app {
  font-family: Helvetica, 'Avenir',  Arial, sans-serif;
  letter-spacing: 0.08em;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  height:100%;
  width: 100%;
  position:absolute;
}
body {
  margin: 0px;
}
</style>
