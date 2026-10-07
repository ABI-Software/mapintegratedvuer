<template>
  <div class="screenshot-popover-container" data-screenshot-ignore>
    <el-popover
      v-if="triggerRef"
      ref="popover"
      :virtual-ref="triggerRef"
      :placement="placement"
      width="260"
      :teleported="false"
      trigger="click"
      popper-class="screenshot-popover"
      virtual-triggering
      :disabled="disabled"
      @show="onShow"
    >
      <div class="screenshot-popover-inner">
        <div class="screenshot-title">{{ title }}</div>
        <div class="screenshot-row">
          <span class="screenshot-label">Resolution</span>
          <el-radio-group v-model="scale" size="small">
            <el-radio-button v-for="item in scales" :key="item" :value="item">
              {{ item }}x
            </el-radio-button>
          </el-radio-group>
        </div>
        <div v-if="hasLegend" class="screenshot-row">
          <span class="screenshot-label">Legend</span>
          <el-radio-group v-model="legend" size="small">
            <el-radio-button v-for="item in legendModes" :key="item.value" :value="item.value">
              {{ item.label }}
            </el-radio-button>
          </el-radio-group>
        </div>
        <div class="screenshot-info">
          <template v-if="outputSize.width">
            <template v-if="outputSize.count > 1">{{ outputSize.count }} PNG files, up to</template>
            <template v-else>PNG,</template>
            {{ outputSize.width }} × {{ outputSize.height }} px
          </template>
          <div v-if="outputSize.clamped" class="screenshot-warning">
            Reduced to fit browser limits.
          </div>
          <div v-if="errorMessage" class="screenshot-warning">
            {{ errorMessage }}
          </div>
        </div>
        <el-button
          type="primary"
          size="small"
          class="screenshot-download"
          :loading="capturing"
          @click="onCapture()"
        >
          Download
        </el-button>
      </div>
    </el-popover>
    <el-popover
      class="tooltip"
      :content="tooltipText"
      :placement="placement"
      :show-after="helpDelay"
      :teleported="false"
      trigger="hover"
      popper-class="header-popper"
      :disabled="disabled"
    >
      <template #reference>
        <el-icon
          ref="triggerRef"
          class="header-icon screenshot-icon"
          :class="{ disabled: disabled }"
        >
          <el-icon-camera />
        </el-icon>
      </template>
    </el-popover>
  </div>
</template>

<script>
import { shallowRef } from 'vue';
import { mapStores } from 'pinia';
import { Camera as ElIconCamera } from '@element-plus/icons-vue';
import { useSettingsStore } from '../stores/settings';
import {
  SCREENSHOT_SCALES,
  SCREENSHOT_LEGEND_MODES,
  findLegends,
  getOutputSize,
} from '../services/screenshot';

const LEGEND_LABELS = {
  exclude: 'Hide',
  include: 'Include',
  only: 'Only',
};

/**
 * Camera button with a popover to choose the resolution
 * before capturing a screenshot.
 */
export default {
  name: 'ScreenshotPopover',
  components: {
    ElIconCamera,
  },
  props: {
    /**
     * Async function called with `{ scale, legend, source }` to perform the capture.
     */
    capture: {
      type: Function,
      required: true,
    },
    /**
     * Function returning the element to be captured, used for size preview
     * and to check whether it has a legend.
     */
    getTarget: {
      type: Function,
      default: undefined,
    },
    title: {
      type: String,
      default: 'Download screenshot',
    },
    tooltip: {
      type: String,
      default: 'Download screenshot',
    },
    placement: {
      type: String,
      default: 'bottom-end',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    /**
     * Enable the Alt/Option + Shift + S keyboard shortcut,
     * which captures with the last used options.
     */
    shortcut: {
      type: Boolean,
      default: false,
    },
  },
  data: function () {
    return {
      triggerRef: undefined,
      scales: SCREENSHOT_SCALES,
      scale: 1,
      legendModes: SCREENSHOT_LEGEND_MODES.map((value) => ({ value, label: LEGEND_LABELS[value] })),
      legend: SCREENSHOT_LEGEND_MODES[0],
      hasLegend: false,
      capturing: false,
      errorMessage: '',
      outputSize: { width: 0, height: 0, clamped: false, count: 0 },
    };
  },
  computed: {
    ...mapStores(useSettingsStore),
    helpDelay() {
      return this.settingsStore.helpDelay;
    },
    tooltipText() {
      if (!this.shortcut) {
        return this.tooltip;
      }
      const platform = navigator.userAgentData?.platform || navigator.platform || '';
      const isMac = /mac/i.test(platform);
      return `${this.tooltip} (${isMac ? '⌥⇧S' : 'Alt+Shift+S'})`;
    },
  },
  watch: {
    scale: function (value) {
      // Remember the selection so reopening and the shortcut reuse it
      this.settingsStore.updateScreenshotOptions({ scale: value });
      this.updateOutputSize();
    },
    legend: function (value) {
      this.settingsStore.updateScreenshotOptions({ legend: value });
      this.updateOutputSize();
    },
  },
  methods: {
    loadSavedOptions: function () {
      const { scale, legend } = this.settingsStore.screenshot;
      this.scale = SCREENSHOT_SCALES.includes(scale) ? scale : SCREENSHOT_SCALES[0];
      this.legend = SCREENSHOT_LEGEND_MODES.includes(legend) ? legend : SCREENSHOT_LEGEND_MODES[0];
      this.hasLegend = findLegends(this.getTarget?.()).length > 0;
    },
    /**
     * The legend option only applies when the target has a legend.
     */
    getLegendMode: function () {
      return this.hasLegend ? this.legend : 'exclude';
    },
    onShow: function () {
      this.loadSavedOptions();
      this.errorMessage = '';
      this.updateOutputSize();
    },
    onKeydown: function (event) {
      // Match on `code`, as Option changes `key` on macOS
      const isShortcut =
        event.altKey && event.shiftKey && !event.ctrlKey && !event.metaKey && event.code === 'KeyS';
      if (!isShortcut || event.repeat || this.disabled || this.capturing) {
        return;
      }
      if (event.target?.closest?.('input, textarea, select, [contenteditable]')) {
        return;
      }
      event.preventDefault();
      this.loadSavedOptions();
      this.onCapture('shortcut');
    },
    updateOutputSize: function () {
      const target = this.getTarget?.();
      this.outputSize = getOutputSize(target, this.scale, this.getLegendMode());
    },
    onCapture: async function (source = 'button') {
      this.capturing = true;
      this.errorMessage = '';
      try {
        this.$refs.popover?.hide();
        await this.capture({ scale: this.scale, legend: this.getLegendMode(), source });
      } catch (error) {
        console.error('Screenshot failed', error);
        this.errorMessage =
          error?.message === 'No legend to capture'
            ? 'There is no legend to capture.'
            : 'Screenshot failed. Please try a lower resolution.';
        this.$refs.popover?.show?.();
      } finally {
        this.capturing = false;
      }
    },
  },
  mounted: function () {
    this.triggerRef = shallowRef(this.$refs.triggerRef);
    if (this.shortcut) {
      document.addEventListener('keydown', this.onKeydown);
    }
  },
  beforeUnmount: function () {
    document.removeEventListener('keydown', this.onKeydown);
  },
};
</script>

<style scoped lang="scss">
@use '../assets/header-icon.scss';

.screenshot-popover-container {
  display: flex;
  align-items: center;
}

.screenshot-icon {
  padding: 3px;
  box-sizing: border-box;
}

.screenshot-popover-inner {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
}

.screenshot-title {
  font-weight: 500;
  font-size: 14px;
}

.screenshot-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.screenshot-label {
  color: #303133;
}

.screenshot-info {
  color: #606266;
}

.screenshot-warning {
  color: #e6a23c;
}

.screenshot-download.el-button {
  align-self: flex-end;
  font-family: inherit;

  &:hover {
    background-color: $app-primary-color;
    border-color: $app-primary-color;
  }
}

:deep(.screenshot-popover.el-popper) {
  padding: 12px;
  border: 1px solid $app-primary-color;
  .el-popper__arrow:before {
    border-color: $app-primary-color;
  }
}

:deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background-color: $app-primary-color;
  border-color: $app-primary-color;
  box-shadow: -1px 0 0 0 $app-primary-color;
}
</style>
