<template>
  <div>
    <div id='heart' class="heart-invis"></div>
    <div id='pathway' class="pathway-invis"></div>
    <div id='icn' class="icn-invis"></div>
    <div id='rna' class="rna-invis"></div>
    <v-tour ref='tour'  name="onboarding-tour" :steps="steps" :callbacks="tourCallbacks" :options="options">
    </v-tour>

  </div>
</template>

<script>
/* eslint-disable no-alert, no-console */
import VueTour from '@tehsurfer/vue-tour';
import tourSteps from './tourSteps';
import Vue from "vue";
import {
  Container,
  Header,
  Main
} from "element-ui";
Vue.use(Container);
Vue.use(Header);
Vue.use(Main);
Vue.use(VueTour);

export default {
  name: "Tutorial",
  props: ['parentRefs'],
  methods: {
    /**
     * Callback when an action is performed (open new dialogs).
     */
    checkForFirstTimeVisitor(){
      var hasVisted = localStorage.getItem('hasVisitedMaps')
      if (hasVisted === null || hasVisted === false){
          localStorage.setItem('hasVisitedMaps', true);
          this.startTutorial();
      }
    },
    startTutorial: function(){
      setTimeout( ()=>{this.fadeOut(this.$refs.tour.$el.querySelector('.v-step'))},4500)
      this.tour.start();
    },
    fadeOut: function(target){
      target.style.transition = '1s';
      target.style.opacity = 0;
    },
    previousStepCallback: function(currentStep){
      console.log(currentStep);
    },
    nextStepCallback: function(currentStep){
      console.log(currentStep);
    },

      
      
  },
  data: function() {
    return {
      flow: undefined,
      steps: tourSteps,
      tour: this.$tours['onboarding-tour'],
      options: {
        labels:{
          buttonStop:" OK! "
        }
      }
    }
  },
  mounted: function() {
    this.flow = this.parentRefs.flow
    this.tour = this.$tours['onboarding-tour'];
    this.checkForFirstTimeVisitor();
  }
};
</script>

<style scoped>

.dialog-header {
  color: #333;
  line-height: 20px;
  border-bottom: solid 0.7px #dcdfe6;
  background-color: #f5f7fa;
}

.dialog-main {
  padding:0px;
  width:100%;
  height:100%;
}

.heart-invis {
  position: absolute;
  right:40%;
  top:65%;
  height: 0px;
  width: 0px;
}

.pathway-invis {
  position: absolute;
  right:30%;
  top:50%;
  height: 0px;
  width: 0px;
}

.icn-invis {
  position: absolute;
  right:50%;
  top:45%;
  height: 0px;
  width: 0px;
}

.rna-invis {
  position: absolute;
  right:60%;
  top:45%;
  height: 0px;
  width: 0px;
}

</style>
<style scoped src='@tehsurfer/vue-tour/dist/vue-tour.css'>
</style>
