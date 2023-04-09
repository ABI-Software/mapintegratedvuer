<template>
  <div :class="[{'draggable':  topLevelControls ==  false}, 'header']">
    <div class="switch-control">
      <el-switch
        v-if="syncMode"
        class="switch"
        v-model="independent"
        active-text="Independent"
        :width=30
        inactive-text="Linked">
      </el-switch>
      <el-popover v-if="syncMode" class="tooltip"
        placement="bottom-end" :open-delay="helpDelay"
        :appendToBody=false trigger="hover" popper-class="header-popper">
        <div>
            When in Linked mode the two maps will interact 
            <br>
            together. Select an organ in one and it will
            <br>
            be automatically selected in the other.
            <br>
            In Independent mode the maps will work separately."
          </div>
        <map-svg-icon icon="help"  slot="reference" class="sync-help header-icon"/>
      </el-popover>
    </div>
    <el-row class="icon-group">
      <el-popover
        ref="viewPopover"
        placement="bottom"
        width="133"
        :appendToBody=false
        trigger="click"
        popper-class="view-icon-popover">
        <el-row :gutter="20"
          v-for="item in viewIcons"
          :key="item.name"
          :class="[{ 'active': item.icon ==  activeView},
            {'disabled': item.min > numberOfEntries},
            'view-icon-row']"
          @click.native="viewClicked(item.icon)"
        >
          <el-col :span="4">
            <map-svg-icon :icon="item.icon"
              class="view-icon"/>
          </el-col>
          <el-col :offset="2" :span="18" class="view-text">
            {{item.name}}
          </el-col>
        </el-row>
      </el-popover>
      <el-popover class="tooltip"  content="Split screen" placement="bottom-end"
        :open-delay="helpDelay" :appendToBody=false trigger="hover"
        popper-class="header-popper"
        v-show="topLevelControls">
        <map-svg-icon :icon="activeView"
          v-popover:viewPopover
          :class="[{'disabled': (1 >= numberOfEntries)},
            'header-icon']"
          slot="reference"/>
      </el-popover>
      <el-popover class="tooltip" content="Help" placement="bottom-end" :open-delay="helpDelay"
        :appendToBody=false trigger="hover" popper-class="header-popper" v-show="showHelpIcon" >
        <map-svg-icon icon="tooltips" slot="reference" class="header-icon" @click.native="startHelp()"/>
      </el-popover>
      <el-popover v-show="!isFullscreen && topLevelControls" class="tooltip"
        content="Fullscreen" placement="bottom-end" :open-delay="helpDelay"
        :appendToBody=false trigger="hover" popper-class="header-popper">
          <map-svg-icon icon="fullScreen"  slot="reference" class="header-icon" @click.native="onFullscreen"/>
      </el-popover>
      <el-popover v-show="isFullscreen && topLevelControls" class="tooltip"
        content="Exit fullscreen" placement="bottom-end" :open-delay="helpDelay"
        :appendToBody=false trigger="hover" popper-class="header-popper">
          <map-svg-icon icon="closeFullScreen" slot="reference" class="header-icon"
            @click.native="onFullscreen"/>
      </el-popover>
      <el-popover
        ref="linkPopover"
        placement="bottom-end"
        width="400"
        :appendToBody=false
        trigger="click"
        popper-class="link-popover"
      >
        <el-row :gutter="20"
          v-loading="loadingLink"
          element-loading-text="Creating link..."
          element-loading-spinner="el-icon-loading">
          <el-col :span="20">
            <el-input
              class="link-input"
              size="mini"
              placeholder="Permanant Link Here"
              :readonly=true
              v-model="shareLink"
              ref="linkInput">
            </el-input>
          </el-col>
          <el-col :span="4">
            <el-popover class="tooltip" content="Copy link" placement="bottom-end"
              :open-delay="helpDelay" :appendToBody=false trigger="hover"
              popper-class="header-popper">
            <el-button slot="reference" class="copy-button"
              icon="el-icon-document-copy" size="mini"
              @click="copyShareLink"></el-button>
            </el-popover>
          </el-col>
        </el-row>
      </el-popover>
      <el-popover class="tooltip"  content="Get permalink" placement="bottom-end"
        :open-delay="helpDelay" :appendToBody=false trigger="hover"
        popper-class="header-popper"
        v-show="topLevelControls && shareLink">
        <map-svg-icon icon="permalink"
          v-popover:linkPopover
          class="header-icon"
          @click.native="getShareLink"
          slot="reference"/>
      </el-popover>
      <el-popover class="tooltip" content="Close" placement="bottom-end" :open-delay="helpDelay"
        :appendToBody=false trigger="hover" popper-class="header-popper" v-show="showIcons">
        <map-svg-icon icon="close" slot="reference" class="header-icon" @click.native="close"/>
      </el-popover>
    </el-row>
  </div>
</template>


<script>
/* eslint-disable no-alert, no-console */
import Vue from "vue";
import EventBus from './EventBus';
import store from '../store';
import {MapSvgIcon} from '@abi-software/svg-sprite';

import {
  Button,
  Col,
  Icon,
  Input,
  Popover,
  Radio,
  Row,
  Switch
} from "element-ui";

Vue.use(Button);
Vue.use(Col);
Vue.use(Icon);
Vue.use(Input);
Vue.use(Popover);
Vue.use(Radio);
Vue.use(Row);
Vue.use(Switch);
/**
 * Cmponent for the header of differnt vuers.
 */
export default {
  name: "DialogToolbarContent",
  components: {
    MapSvgIcon,
  },
  props: {
    /**
     * Array of titles.
     */
    numberOfEntries: {
      type: Number,
      default: 0
    },
    /**
     * Display icons for docking, undocking and etc.
     */
    showIcons: {
      type: Boolean,
      default: true

    },
    topLevelControls: {
      type: Boolean,
      default: true
    },
    /**
     * The current active title.
     */
    activeId: {
      type: Number,
      default: -1
    },
    showHelpIcon: {
      type: Boolean,
      default: true
    },
  },
  computed: {
    activeView() {
      return store.state.splitFlow.activeView;
    },
    helpDelay() {
      return store.state.settings.helpDelay;
    },
    shareLink() {
      return store.state.settings.shareLink;
    },
    syncMode() {
      return store.state.splitFlow.syncMode;
    },
    viewIcons() {
      return store.state.splitFlow.viewIcons;
    },
    globalCallback() {
      return store.state.splitFlow.globalCallback;
    }
  },
  watch: {
    shareLink: function() {
      this.loadingLink = false;
    },
    independent: function(value) {
      let flag = !(value === true);
      if (this.globalCallback !== flag)
        store.commit("splitFlow/toggleGlobalCallback", flag);
    },
    globalCallback: function(value) {
      let flag = !(value === true);
      if (flag !== this.independent)
        this.independent = flag;
    }
  },
  data: function() {
    return {
      isFullscreen: false,
      loadingLink: true,
      shareLinkDisplay: false,
      independent: true,
    }
  },
  methods: {
    titleClicked: function(id) {
      this.$emit("titleClicked", id);
    },
    startHelp: function(){
      EventBus.$emit("startHelp");
    },
    onFullscreen: function() {
      this.$emit("onFullscreen");
      this.isFullscreen = !this.isFullscreen;
    },
    close: function() {
      this.$emit("close");
    },
    copyShareLink: function() {
      if (document) {
        this.$refs.linkInput.$el.querySelector("input").select();
        document.execCommand('copy');
      }
    },
    getShareLink: function() {
      this.loadingLink = true;
      this.shareLinkDisplay = true;
      EventBus.$emit("updateShareLinkRequested");
    },
    viewClicked: function(view) {
      store.commit("splitFlow/updateActiveView", view);
    }
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import "~element-ui/packages/theme-chalk/src/button";
@import "~element-ui/packages/theme-chalk/src/loading";
@import "~element-ui/packages/theme-chalk/src/icon";
@import "~element-ui/packages/theme-chalk/src/input";
@import "~element-ui/packages/theme-chalk/src/popover";
@import "~element-ui/packages/theme-chalk/src/radio";
@import "~element-ui/packages/theme-chalk/src/row";
@import "~element-ui/packages/theme-chalk/src/switch";
@import "../assets/header-icon.scss";

.content {
  width:calc(100% - 120px);
  height:32px;
}

.radio-control {
  position:absolute;
  justify-content: center;
  top: 4px;
  right:12px;
  -moz-user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

.icon-group {
  ::v-deep .el-button--text {
    color:#606266;
    font-size: 1.5em;
    &:hover {
      color: $app-primary-color;
    }
  }
}

.icon-transform {
  -moz-transform: rotate(90deg);
  -webkit-transform: rotate(90deg);
  -o-transform: rotate(90deg);
  -ms-transform: rotate(90deg);
  transform: rotate(90deg);
  padding:10px;
}

.header {
  height:32px;
}

.draggable.header:hover {
  cursor:grab;
}

.draggable.header:active {
  cursor:grabbing;
}

::v-deep .header-popper {
  padding: 6px 4px;
  font-size:12px;
  color: rgb(48, 49, 51);
  background-color: #f3ecf6;
  border: 1px solid $app-primary-color;
  white-space: nowrap;
  min-width: unset;
  &.el-popper[x-placement^=bottom] {
    .popper__arrow {
      border-bottom-color: $app-primary-color !important;
      &:after {
        border-bottom-color: #f3ecf6 !important;
      }
    }
  }
}

::v-deep .link-popover {
  border: 1px solid $app-primary-color;
}

::v-deep .el-loading-spinner {
  i, .el-loading-text {
    color: $app-primary-color;
  }
}

.copy-button {
  color:#FFFFFF;
  background-color:$app-primary-color;
  &:hover, &:focus {
    color:#FFFFFF;
    background-color:$app-primary-color;
    box-shadow: -3px 2px 4px #000000; 
  }
}

.link-input {
  ::v-deep .el-input__inner {
    color:#303133;
    &:focus {
      border-color:$app-primary-color;
    }
  }
}

.view-icon-row {
  height: 32px;
  width: 133px;
  border-radius: 4px;
  border: 1px solid rgb(151, 151, 151);
  font-size: 14px;
  margin:8px 0px 0px 0px!important;
  cursor: pointer;

  &.active {
    border: 1px solid $app-primary-color;
    background: rgba(131, 0, 191, 0.1);
  }
}

.view-icon {
  font-size: 1.7em;
  color: $app-primary-color;
  padding-top:3px;
}

.view-text {
  letter-spacing:0px;
  font-size:11px;
  line-height:14px;
  font-family:'Asap', 'Avenir',  Arial, sans-serif;
  font-weight:550;
  padding-top:7px;
}

::v-deep .view-icon-popover {
  border: 1px solid $app-primary-color;
  box-shadow: 0px 2px 12px 0px rgba(0, 0, 0, 0.06);
  padding: 4px 8px 12px 8px;
  min-width:unset!important;
  cursor:default;
  &.el-popper[x-placement^=bottom] {
    .popper__arrow {
      border-bottom-color: $app-primary-color !important;
      &:after {
        border-bottom-color: #fff !important;
      }
    }
  }
}

.switch-control {
  width:250px;
  top:2px;
  left: calc(50% - 60px);
  position: absolute;
  .sync-help {
    left:5px;
  }
}

.switch {
  padding-right: 0.5rem;
  padding-left: 0.5rem;
  border-radius: 4px;
  border: 1px solid rgb(220, 223, 230);
  vertical-align: baseline;
  ::v-deep .el-switch__label.is-active {
    color: $purple;
  }
  ::v-deep .el-switch__core {
    background: $app-primary-color;
    border: 1px solid $lightGrey;
    height: 14px;
    &::before {
      content: "";
      position:absolute;
      top: -3px;
      left: -1px;
      border-radius: 100%;
      -webkit-transition: all .3s;
      transition: all .3s;
      width: 19px;
      height: 19px;
      background-color: $app-primary-color;
    }
    &::after {
      top: -2px;
      left: 0px;
      width: 17px;
      height: 17px;
      background-color: $cochlear;
    }
  }
  ::v-deep &.is-checked {
    .el-switch__core {
      border: 1px solid $lightGrey;
      background: $cochlear;
      &::before {
        left: 100%;
        margin-left:-17px;
      }    
      &::after {
        left: 100%;
        margin-left: -16px;
      }
    }
  }
}

.sync-help {
  margin-left: 5px;
}

</style>
