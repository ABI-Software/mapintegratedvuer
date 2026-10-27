<template>
  <div class="help-mode-menu">
    <h4>Help</h4>
    <div class="help-mode-menu-block">
      <h5>Guided tour</h5>
      <div v-if="views.length > 1" class="help-mode-menu-field">
        <span>View</span>
        <el-select v-model="view" size="small" :teleported="false">
          <el-option label="All views" value="all" />
          <el-option
            v-for="item in views"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </div>
      <div class="help-mode-menu-field">
        <span>Area</span>
        <el-select v-model="area" size="small" :teleported="false">
          <el-option label="All areas" value="all" />
          <el-option v-for="item in areas" :key="item.key" :label="item.label" :value="item.key" />
        </el-select>
      </div>
      <div class="help-mode-menu-actions">
        <el-button size="small" type="primary" @click="startTour">Start tour</el-button>
      </div>
    </div>
    <div class="help-mode-menu-block">
      <h5>Hover for help</h5>
      <small>Point at any highlighted control to see what it does.</small>
      <div class="help-mode-menu-actions">
        <el-button size="small" type="primary" @click="$emit('start-hover')">Start</el-button>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * The menu shown when clicking "Help" in the toolbar, to choose the view and the area
 * of the guided tour or to start the hover help.
 */
export default {
  name: 'HelpModeMenu',
  props: {
    /**
     * The opened views, `[{ value, label }]`.
     */
    views: {
      type: Array,
      default: () => [],
    },
    /**
     * Function returning the areas `[{ key, label }]` with help for the given view.
     */
    getAreas: {
      type: Function,
      default: () => [],
    },
  },
  emits: ['start-tour', 'start-hover'],
  data: function () {
    return {
      view: 'all',
      area: 'all',
    };
  },
  computed: {
    areas: function () {
      return this.getAreas(this.view);
    },
  },
  watch: {
    views: function () {
      this.view = 'all';
      this.area = 'all';
    },
    areas: function (areas) {
      if (!areas.some((item) => item.key === this.area)) this.area = 'all';
    },
  },
  methods: {
    startTour: function () {
      this.$emit('start-tour', { view: this.view, area: this.area });
    },
  },
};
</script>

<style scoped lang="scss">
.help-mode-menu {
  width: 240px;
  padding: 0.5rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  h4 {
    margin: 0;
    font-size: 16px;
    color: $app-primary-color;
    text-align: center;
  }

  h5 {
    margin: 0;
    font-size: 14px;
    font-weight: 500;
    color: $app-primary-color;
  }

  small {
    color: #606266;
    line-height: 1.4;
  }
}

.help-mode-menu-block {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.help-mode-menu-field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 12px;

  > span {
    width: 32px;
    flex-shrink: 0;
  }

  .el-select {
    flex: 1;
  }
}

.help-mode-menu-actions {
  display: flex;
  justify-content: flex-end;

  .el-button--primary {
    background-color: $app-primary-color;
    border-color: $app-primary-color;

    &:hover {
      background-color: #ac76c5;
      border-color: #ac76c5;
    }
  }
}
</style>
