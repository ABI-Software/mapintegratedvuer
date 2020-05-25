<template>
  <div>
    <TooltipVuer :placement="placement" :visible="visible" :content="tContent" 
      :position="tStyle" @onActionClick="onActionClick" @onClose="onTooltipClose"
      :displayCloseButton="displayCloseButton" ref="tooltip"/>
  </div>
</template>


<script>
/* eslint-disable no-alert, no-console */
import '@abi-software/maptooltip';
import '@abi-software/maptooltip/dist/maptooltip.css';
import EventBus from './EventBus';

/**
 * Component of the popover interface.
 */
export default {
  name: "MapPopover",
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
        if (resource.data && resource.data.id) {
          term = resource.data.id;
          label = resource.data.id;
        } else if (resource.feature) {
          term = resource.feature.models;
          label = resource.feature.label;
          dataset = resource.feature.dataset;
          scaffold = resource.feature.scaffold;
        }
        if (term || label) {
          let data = this.fetchContent(term, label, dataset, scaffold);
          if (data) {
            this.tContent = data;
            return true;
          }
        }
      }
      return false;
    },
    updateFromTerm: function(term) {
      let data = this.fetchContent(term);
      if (data) {
        this.tContent = data;
        return true;
      }
    return false;
    },
    fetchContent: function(term, label, dataset, scaffold) {
      if (term || label) {
        let data = {};
        switch (term) {
          case "UBERON:0000948":
          case "UBERON:0002080":
          case "UBERON:0002084":
            data.title = "Mapping of ICN Neurons in a 3D Rat Heart";
            data.description = "The distribution of neurons in the intrinsic cardiac nervous system (ICN) were mapped and visualized in a 3D reconstruction of a male rat heart.";
            data.actions = [
              {
                title: "View 3D scaffold",
                label: "Heart",
                resource: "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/others/29_Jan_2020/heartICN_metadata.json",
                type: "Scaffold"
              },
              {
                title: "View 3D scaffold with ICN data",
                label: "Heart",
                resource: "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/rat_hearts/may-15-integrated/integrated_heart_may_metadata.json",
                type: "Scaffold"
              },
              {
                title: "Search for dataset",
                label: "Heart",
                resource: "https://sparc.science/data?type=dataset&q=heart",
                type: "URL"
              }
            ];
            break;
          case "ICN":
            data.title = "RNA";
            data.description = "The distribution of neurons in the intrinsic cardiac nervous system (ICN) were mapped and visualized in a 3D reconstruction of a male rat heart.";
            data.actions = [
              {
                title: "View plot",
                label: "ICN",
                resource: "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/ISAN/csv-data/use-case-4/RNA_Seq.csv",
                type: "Plot",
                plotType: "heatmap",
                datasetTitle: "Molecular Phenotype Distribution of Single Rat Intracardiac Neurons",
                datasetDescription: "Images collected from serial cryostat sectioning of a cryopreserved heart was used to reconstruct the 3D context. Transcriptional profiles taken from isolated single neurons and mapped back into the previously generated 3D context.",
                datasetUrl: "https://discover.blackfynn.com/datasets/29",
                datasetImage: "https://assets.discover.blackfynn.com/dataset-assets/29/6/revisions/1/banner.jpg"
              },
              {
                title: "Search for dataset",
                resource: "https://sparc.science/data?type=dataset&q=icn",
                type: "URL"
              }
            ];
            break;
          case "UBERON:0000945":
            data.title = "Stomach";
            data.description = "Scaffolds of the stomach";
            data.actions = [
              {
                title: "View generic stomach scaffold",
                label: "Stomach",
                resource: "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/others/rat_stomach/stomach_exploding/stomach_exploding_metadata.json",
                type: "Scaffold"
              },
              {
                title: "View scaffold with fitted neurites",
                label: "Stomach",
                resource: "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/ISAN/scaffold/stomach_lines/stomach_metadata.json",
                type: "Scaffold"
              },
              {
                title: "Search for dataset",
                label: "Stomach",
                resource: "https://sparc.science/data?type=dataset&q=stomach",
                type: "URL"
              }
            ];
            break;
          default:
            if (label)
              data.title = label;
            else
              data.title = term;
            data.description = "";
            if (label) {
              if (dataset) {
                data.actions = [
                  {
                    title: "View dataset",
                    label: "dataset",
                    resource: dataset,
                    type: "URL"
                  }
                ];
                this.onActionClick(data.actions[0]);
              } else if (scaffold) {
                // temporary changes to get circleon flatmap to response
                if (scaffold == "heart") {
                  data.actions = [
                    {
                      title: "View 3D scaffold",
                      label: "Heart",
                      resource: "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/others/29_Jan_2020/heartICN_metadata.json",
                      type: "Scaffold"
                    }
                  ];
                  this.onActionClick(data.actions[0]);
                }
              } else {
                data.actions = [
                  {
                    title: "Search for dataset",
                    label: "dataset",
                    resource: "https://sparc.science/data?type=dataset&q=" + label,
                    type: "URL"
                  }
                ];
              }
            } else {
              data.actions = [];
            }
            break;
        }
        return data;
      }
      return undefined;
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
