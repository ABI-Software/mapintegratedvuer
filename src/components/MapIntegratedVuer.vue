<template>
  <div class="map-container" ref="container">
    <NavBar></NavBar>
    <div class="map-app">
      <div style="position:absolute;height: 100%;width:100%">
        <FloatingDialog v-for="(item, order) in testEntries" :entry="item" :index="order" :key="item.resource" v-on:mousedown.native="dialogClicked(order)"/>
      </div>
      <el-tabs
        v-if="tabOn"
        v-model="editableTabsValue"
        :tab-position="tabPosition"
        @edit="handleTabsEdit"
        style="top:10%;height: 90%;"
        class="my-tabs">
        <el-tab-pane
          v-for="item in editableTabs"
          :key="item.name"
          :label="item.title"
          :name="item.name"
          :closable="item.closable"
          style="height:100%"
        >
          <TabContent
            :entry="item"
            @resource-selected="resourceSelected(item.name, $event)"
            @pane-changed="paneChanged(item.name, $event)"/>
        </el-tab-pane>
      </el-tabs>
    </div>

  </div>
</template>

<script>
/* eslint-disable no-alert, no-console */
import TabContent from './TabContent.vue';
import FloatingDialog from './FloatingDialog.vue';
import NavBar from './NavBar';
import Vue from "vue";
import {
  Tabs,
  TabPane
} from "element-ui";
import "element-ui/lib/theme-chalk/index.css";
import lang from "element-ui/lib/locale/lang/en";
import locale from "element-ui/lib/locale";
locale.use(lang);
Vue.use(Tabs);
Vue.use(TabPane);

export default {
  name: "MapIntegratedVuer",
  components: {
    FloatingDialog,
    TabContent,
    NavBar
  },
  methods: {
    dialogClicked: function(order) {
      if (this.zIndex !== this.testEntries[order].zIndex) {
        this.zIndex++;
        this.testEntries[order].zIndex = this.zIndex;
      }
    },
    getTabArrayWithName: function(name) {
      for (let i = 0; i < this.editableTabs.length; i++) {
        if (name === this.editableTabs[i].name) {
          return this.editableTabs[i];
        }
      }
      return undefined;
    },
    addPaneToTab: function(name, type, resource) {
      if (resource) {
        let tabArray = this.getTabArrayWithName(name);
        if (tabArray) {
            tabArray.panes.push(
              {resource: resource,
              type: type});
        }
      }
    },
    removePaneFromTab: function(name, paneIndex) {
      let tabArray = this.getTabArrayWithName(name);
      if (tabArray) {
          tabArray.panes.splice(paneIndex-1, 1);
      }
    },
    createTabFromPane: function(name, paneIndex) {
      let tabArray = this.getTabArrayWithName(name);
      if (tabArray) {
        let item = tabArray.panes.slice(paneIndex-1, paneIndex);
        let newTabName = ++this.index + '';
        this.editableTabs.push({
          title: 'New Tab',
          name: newTabName,
          panes: item,
          closable: true
        });
        this.editableTabsValue = newTabName;
      }
    },
    paneChanged: function(tabName, result) {
      if (result.action == "onclose") {
        this.removePaneFromTab(tabName, result.paneIndex);
      } else if (result.action == "ondock") {
        this.createTabFromPane(tabName, result.paneIndex);
      }
    },
    resourceSelected: function(tabName, result) {
      if (result.type == "Flatmap") {
        let resource = result.resource;
        let newResource = undefined;
        let viewerType = "Scaffold";
        switch (resource.resource[0]) {
          case "UBERON:0000945": //stomach
            newResource = "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/ISAN/scaffold/stomach_lines/stomach_metadata.json";
            break;
          case "UBERON:0000948": //heart
            newResource = "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/ISAN/scaffold/use_case4/rat_heart_metadata.json";
            break;
          case "UBERON:0001155": //colon
            newResource = "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/ISAN/scaffold/colon/colonLines_metadata.json";
            break;
          case "UBERON:0002048": //lungs
            newResource = "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/ISAN/scaffold/lungs/lungs_metadata.json";
            break;
          case "UBERON:0002440":
          case "FMA:6474": //stellate
            newResource = "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/ISAN/csv-data/use-case-2/Sample_1_18907001_channel_1.csv";
            viewerType = "Plot";
            //newResource = "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/ISAN/scaffold/stellate/stellate_metadata.json";
            break;
          default:
            break;
        }
        this.addPaneToTab(tabName, viewerType, newResource);
      }
    },
    handleTabsEdit: function(targetName, action) {
      if (action === 'remove') {
        let tabs = this.editableTabs;
        let activeName = this.editableTabsValue;
        if (activeName === targetName) {
          tabs.forEach((tab, index) => {
            if (tab.name === targetName) {
              let nextTab = tabs[index + 1] || tabs[index - 1];
              if (nextTab) {
                activeName = nextTab.name;
              }
            }
          });
        }
        this.editableTabsValue = activeName;
        this.editableTabs = tabs.filter(tab => tab.name !== targetName);
      }
    }
  },
  data: function() {
    return {
      species:"Human",
      tabPosition:"top",
      editableTabsValue: '1',
      editableTabs: [{
        title: 'Flatmap',
        name: '1',
        panes: [{resource: "NCBITaxon:9606",
                type: "Flatmap"}],
        closable: false
      }],
      zIndex: 3,
      testEntries: [
        { resource: "NCBITaxon:9606", availableSpecies : {"Human":{taxo: "NCBITaxon:9606", iconClass:"icon-mapicon_human"},
          "Rat":{taxo: "NCBITaxon:10114", iconClass:"icon-mapicon_rat"} }, type: "Flatmap", zIndex:1},
        {resource: "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/ISAN/scaffold/use_case4/rat_heart_metadata.json", type: "Scaffold", zIndex:2},
        {resource: "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/ISAN/csv-data/use-case-4/RNA_Seq.csv", plotType:"heatmap", type: "Plot", zIndex:3}],
      index: 1,
      tabOn: true
}
  },
  watch: {
    species: function (val) {
      let taxo = "NCBITaxon:9606";
      switch (val) {
        case "Human":
          taxo = "NCBITaxon:9606";
          break;
        case "Rat":
          taxo = "NCBITaxon:10114";
          break;
        default:
          break;
      }
      console.log(taxo);
      this.editableTabs[0].panes[0].resource = taxo;
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
.map-container {
  height: 100%;
  width: 100%;
}

.my-tabs .el-tabs__content{
  height:100%;
}

.map-app {
  position:absolute;
  height: calc(100% - 84px);
  width:calc(100% - 54px);
  margin-top:19px;
  margin-left:26px;
  margin-right:26px;
  border: solid 1px #dcdfe6;
}

</style>
