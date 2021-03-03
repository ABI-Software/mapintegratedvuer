<template>
  <div class="tab-container" ref="container">
     <splitpanes class="default-theme" :horizontal="horizontal">
      <pane v-for="item in entries" :index="item.id" ref="dialogs" :key="item.id">
        <ContentVuer :entry="item" ref="content" @resource-selected="resourceSelected"
          @flatmapChanged="flatmapChanged"/>
      </pane>
    </splitpanes>
  </div>
</template>


<script>
/* eslint-disable no-alert, no-console */
import { Splitpanes, Pane } from 'splitpanes';
import ContentVuer from './ContentVuer';

export default {
  name: "SplitDialog",
  components: {
    ContentVuer,
    Splitpanes,
    Pane
  },
  props: {
    entries: {
      type: Array,
      default: function () {
        return [];
      }
    },
  },
  methods: {
    /**
     * Callback when the vuers emit a selected event.
     */
    resourceSelected: function(result) {
      this.$emit("resource-selected", result);
    },
    flatmapChanged: function(){
      this.$emit("flatmapChanged");
    }
  },
  data: function() {
    return {
      horizontal: false,
    }
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.tab-container {
  position:absolute;
  width:100%!important;
  height:100%!important;
  left:0px!important;
  top:0px!important;
}

>>> .splitpanes.default-theme .splitpanes__pane {
  background-color: white;
  position:relative;
}

>>> .splitpanes__splitter {
  background: rgb(220, 223, 230);
}

>>> .splitpanes--horizontal {
  height: 1px;
}

>>> .splitpanes--vertical {
  width: 1px;
}

.button-group {
  position: absolute;
  top:1%;
  right:1%;
}
</style>

<style scoped src='splitpanes/dist/splitpanes.css'>
</style>

