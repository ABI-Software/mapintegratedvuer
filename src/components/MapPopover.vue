<template>
  <div>
    <TooltipVuer :placement="placement" :visible="visible" :content="tContent" 
      :position="tStyle" @onActionClick="onActionClick" @onClose="onTooltipClose"/>
  </div>
</template>


<script>
/* eslint-disable no-alert, no-console */
import '@abi-software/maptooltip';
import '@abi-software/maptooltip/dist/maptooltip.css';

export default {
  name: "MapPopover",
  props: {
    selectedResource: Object,
    placement: String,
    tooltipCoords: Object,
    visible: Boolean
  },
  methods: {
    onActionClick: function(action) {
      this.$emit("onActionClick", action);
    },
    onTooltipClose: function() {
      this.$emit("onTooltipClose");
    },
    updateTooltipContent: function(result) {
      if (result.resource) {
        let resource = result.resource;
        if (Array.isArray(resource) && resource[0])
          resource = resource[0];
        let term = undefined;
        if (resource.data && resource.data.id)
          term = resource.data.id;
        else if (resource.resource && resource.resource[0])
          term = resource.resource[0];
        if (term) {
          let data = this.fetchContent(term);
          if (data) {
            this.tContent = data;
            return true;
          }
        }
      }
      return false;
    },
    fetchContent: function(term) {
      if (term) {
        let data = {};
        if (term === "UBERON:0000948") {
          console.log(term)
          data.title = "Mapping of ICN Neurons in a 3D Rat Heart";
          data.description = "The distribution of neurons in the intrinsic cardiac nervous system (ICN) were mapped and visualized in a 3D reconstruction of a male rat heart.";
          data.actions = [
            {
              title: "View 3D scaffold",
              resource: "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/others/29_Jan_2020/heartICN_metadata.json",
              type: "Scaffold"
            },
            {
              title: "View dataset",
              resource: "https://sparc.science/datasets/37?type=dataset",
              type: "URL"
            }
          ];
          return data;
        } else if (term === "ICN") { 
          data.title = "RNA";
          data.description = "The distribution of neurons in the intrinsic cardiac nervous system (ICN) were mapped and visualized in a 3D reconstruction of a male rat heart.";
          data.actions = [
            {
              title: "View plot",
              type: "Plot",
              plotType: "heatmap"
            }
          ];
        } else {
          data.title = term;
          data.description = "";
          data.actions = [ ];
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
        top: "200px",
        left: "400px",
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

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

.content {
  width:calc(100% - 120px);
}

.title {
  width: 101px;
  height: 38px;
  border-right: solid 1px #dcdfe6;
  background-color: white;
  display:inline-block;
}

.title:hover {
  cursor: pointer;
}

.title-text {
  padding-top:9px;
  text-align:center;
}

.parent-dialog:hover .title-text {
  color:#8300bf;
}

.highlightText {
  color:#8300bf;
}

.icon-group {
  position:absolute;
  top:-2px;
  right:16px;
}

.icon-group >>> .el-button--text {
  color:#606266;
  font-size: 1.5em;
}

.icon-group >>> .el-button--text:hover {
  color:#8300bf;
}

.icon-transform {
  -moz-transform: rotate(90deg);
  -webkit-transform: rotate(90deg);
  -o-transform: rotate(90deg);
  -ms-transform: rotate(90deg);
  transform: rotate(90deg);
}

.header:hover {
  cursor:grab;
}

.header:active {
  cursor:grabbing;
}

</style>
