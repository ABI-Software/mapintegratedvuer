<template>
  <div>
    <TooltipVuer :placement="placement" :visible="visible" :content="tContent"
      :position="tStyle" @onActionClick="onActionClick" @onClose="onTooltipClose"
      :displayCloseButton="displayCloseButton" ref="tooltip"/>
  </div>
</template>


<script>
/* eslint-disable no-alert, no-console */
import { TooltipVuer } from '@abi-software/maptooltip';
import '@abi-software/maptooltip/dist/maptooltip.css';
import {simulatedData} from './SimulatedData.js';
import EventBus from './EventBus';

/**
 * Component of the popover interface.
 */
export default {
  name: "MapPopover",
  components: {
    TooltipVuer
  },
  props: {
    /**
     * Contain information of the region of interest.
     */
    selectedResource: Object,
    placement: String,
    tooltipCoords: Object,
    visible: Boolean,
    displayCloseButton: Boolean
  },
  methods: {
    onActionClick: function(action) {
       EventBus.$emit("PopoverActionClick", action);
    },
    onTooltipClose: function() {
      this.$emit("onClose");
    },
    getTooltipContentElm: function() {
      //Not the best way but required to get the content
      //into mapboxgl popup
      return this.$refs.tooltip.$refs.content.$vnode.elm;
    },
    updateTooltipContent: function(result) {
      if (result && result.resource) {

        let resource = result.resource;
        if (Array.isArray(resource) && resource[0])
          resource = resource[0];
        let term = undefined;
        let label = undefined;
        let dataset = undefined;
        let scaffold = undefined;
        let simulations = undefined;
        let taxonomy = resource.taxonomy;
        if (resource.data && resource.data.id) {
          term = resource.data.id;
          label = resource.data.id;
        } else if (resource.feature) {
          term = resource.feature.models;
          label = resource.feature.label;
          dataset = resource.feature.dataset;
          scaffold = resource.feature.scaffold;
          simulations = resource.feature.simulations;
        }
        if (term || label) {
          let data = simulatedData(term, taxonomy, label, dataset, scaffold, simulations);
          if (data) {
            this.tContent = data;
            return true;
          }
        }
      }
      return false;
    },
    updateFromTerm: function(term) {
      let data = simulatedData(term);
      if (data) {
        this.tContent = data;
        return true;
      }
    return false;
    }
  },
  data: function() {
    return {
      tContent: {
        title: "Test",
        description: "Description",
        actions: [
          {
            title: "View 3D scaffold",
            url: "placeholder"
          },
          {
            title: "View plot",
            url: "placeholder"
          }
        ]
      },
      tStyle: {
        top: "0px",
        left: "0px",
        position: "absolute"
      }
    }
  },
  watch: {
    selectedResource: function() {
      this.updateTooltipContent(this.selectedResource);
    },
    "tooltipCoords.x": function() {
      this.tStyle.left = Math.floor(this.tooltipCoords.x) + "px";
    },
    "tooltipCoords.y": function() {
      this.tStyle.top = Math.floor(this.tooltipCoords.y) + "px";
    }
  },
  mounted: function() {
    this.updateTooltipContent(this.selectedResource);
  }
};
</script>

<style scoped>
>>> .el-popover.el-popper {
  position: absolute !important;
  transform: translate3d(-134px, 0px, 0px) !important;
}

</style>
