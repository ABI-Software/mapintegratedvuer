<template>
  <div class="tab-container" ref="container">
    <splitpanes class="default-theme" :horizontal="horizontal">
      <pane>
        <splitpanes class="default-theme" :horizontal=true>
          <pane key="one" min-size="200">
            <slot name="first"></slot>
          </pane>
          <pane v-if="isSlotActive('fourth')" key="four" min-size="200">
            <slot name="fourth"></slot>
          </pane>
        </splitpanes>
      </pane>
      <pane v-if="isSlotActive('second')">Placeholder
        <splitpanes class="default-theme" :horizontal=true>
          <pane key="two" min-size="200">
            <slot name="second"></slot>
          </pane>
          <pane v-if="isSlotActive('third')" key="three" min-size="200">
            <slot name="third"></slot>
          </pane>
        </splitpanes>
      </pane>
    </splitpanes>
  </div>
</template>


<script>
/* eslint-disable no-alert, no-console */
import { Splitpanes, Pane } from 'splitpanes';
import store from '../store';

export default {
  name: "SplitDialog",
  components: {
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
  computed: {
    activeView() {
      return store.state.splitFlow.activeView;
    },
  },
  data: function() {
    return {
      horizontal: true,
      two: false,
      three: false,
      four: false
    }
  },
  watch: {
    activeView : function(val) {
      switch(val) {
        case '2horpanel':
          this.horizontal = true;
          this.two = true;
          this.three = false;
          this.four = false;
          break;
        case '2vertpanel':
          this.horizontal = false;
          this.two = true;
          this.three = false;
          this.four = false;
          break;
        case '3panel':
          this.horizontal = false;
          this.two = true;
          this.three = true;
          this.four = false;
          break;
        case '4panel':
          this.horizontal = false;
          this.two = true;
          this.three = true;
          this.four = true;
          break;
        case 'singlepanel':
        default:
          this.two = false;
          this.three = false;
          this.four = false;
      }
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

.portal-target {
  width:100%;
  height:100%;
}

.button-group {
  position: absolute;
  top:1%;
  right:1%;
}
</style>

<style scoped src='splitpanes/dist/splitpanes.css'>
</style>

