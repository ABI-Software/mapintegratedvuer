<template>
  
  <div id="app">
    <MapIntegratedVuer />
  </div>
</template>

<script>
import MapIntegratedVuer from './components/MapIntegratedVuer.vue'



export default {
  name: 'app',
  components: {
    MapIntegratedVuer
  }
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Asap&display=swap');

#app {
  font-family:'Avenir',  Arial, sans-serif;
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
