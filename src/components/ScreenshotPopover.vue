<template>
  <div class="screenshot-popover-container" data-screenshot-ignore>
    <el-popover
      v-if="triggerRef"
      ref="popover"
      :virtual-ref="triggerRef"
      :placement="placement"
      width="280"
      :teleported="false"
      trigger="click"
      popper-class="screenshot-popover"
      virtual-triggering
      :disabled="disabled || capturing"
      @show="onShow"
    >
      <div class="screenshot-popover-inner">
        <h4>{{ title }}</h4>
        <div class="screenshot-popover-block">
          <h5>Resolution</h5>
          <el-radio-group v-model="scale" size="small">
            <el-radio-button v-for="item in scales" :key="item" :value="item">
              {{ item }}x
            </el-radio-button>
          </el-radio-group>
        </div>
        <div v-if="hasLegend" class="screenshot-popover-block">
          <h5>Legend</h5>
          <el-radio-group v-model="legend" size="small">
            <el-radio-button v-for="item in legendModes" :key="item.value" :value="item.value">
              {{ item.label }}
            </el-radio-button>
          </el-radio-group>
        </div>
        <div v-if="getLegendMode() !== 'only'" class="screenshot-popover-block">
          <h5>Header</h5>
          <el-radio-group v-model="toolbar" size="small">
            <el-radio-button :value="false">Hide</el-radio-button>
            <el-radio-button :value="true">Include</el-radio-button>
          </el-radio-group>
        </div>
        <div v-if="shortcut" class="screenshot-popover-block is-stacked">
          <h5>Shortcut ({{ shortcutLabel }})</h5>
          <small class="screenshot-description">
            To capture a tooltip on Flatmap, choose your settings here, then hover over the feature
            or connection in the Flatmap and press the shortcut.
          </small>
        </div>
        <div class="screenshot-popover-footer">
          <div class="screenshot-info">
            <template v-if="outputSize.width">
              <template v-if="outputSize.count > 1">
                {{ outputSize.count }} PNG files, up to
              </template>
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
            :icon="ElIconDownload"
            :loading="capturing"
            @click="onCapture()"
          >
            Download
          </el-button>
        </div>
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
          :class="{ disabled: disabled, 'is-capturing': capturing }"
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
import { Camera as ElIconCamera, Download as ElIconDownload } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import 'element-plus/es/components/message/style/css';
import 'element-plus/es/components/message-box/style/css';
import { useSettingsStore } from '../stores/settings';
import {
  SCREENSHOT_SCALES,
  SCREENSHOT_LEGEND_MODES,
  findLegends,
  getOutputSize,
} from '../services/screenshot';

// Safari and every iOS browser use WebKit, which has lower canvas memory limits.
const isWebKit = () => navigator.vendor === 'Apple Computer, Inc.';

/**
 * Explain a failed capture and what the user can do about it.
 * @param {Error} error - usually a `ScreenshotError` from the screenshot service.
 * @param {Number} scale - the requested resolution.
 * @returns {Object} { title, message, inline } where `inline` is the short
 *   version shown in the popover.
 */
const describeError = (error, scale) => {
  if (error?.code === 'no-legend') {
    return { inline: 'There is no legend to capture.' };
  }
  const otherBrowser = isWebKit()
    ? ' Safari has lower limits for large images, so another browser such as Chrome or Firefox may work better.'
    : '';
  if (error?.code === 'context-lost') {
    return {
      title: 'Screenshot failed',
      message:
        'The viewer ran out of graphics memory while creating the screenshot ' +
        'and cannot be drawn again until the page is reloaded. ' +
        'Please reload the page, then try a lower resolution.' +
        otherBrowser,
      inline: 'Screenshot failed. Please reload the page and try a lower resolution.',
    };
  }
  const lower =
    scale > 1
      ? `This view is too large or complex to capture at ${scale}x in this browser. ` +
        'Please choose a lower resolution and download again.'
      : 'This view is too large or complex to capture in this browser. ' +
        'Please make the window or view smaller, or reload the page and try again.';
  return {
    title: 'Screenshot failed',
    message: lower + otherBrowser,
    inline: 'Screenshot failed. Please try a lower resolution.',
  };
};

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
     * Async function called with `{ scale, legend, toolbar, source }` to perform the capture.
     */
    capture: {
      type: Function,
      required: true,
    },
    /**
     * Function returning the element to be captured, used for size preview
     * and to check whether it has a legend.
     * Called with `{ legend, toolbar }` as the element may depend on them.
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
      ElIconDownload: shallowRef(ElIconDownload),
      scales: SCREENSHOT_SCALES,
      scale: 1,
      legendModes: SCREENSHOT_LEGEND_MODES.map((value) => ({ value, label: LEGEND_LABELS[value] })),
      legend: SCREENSHOT_LEGEND_MODES[0],
      toolbar: false,
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
    shortcutLabel() {
      const platform = navigator.userAgentData?.platform || navigator.platform || '';
      return /mac/i.test(platform) ? '⌥⇧S' : 'Alt+Shift+S';
    },
    tooltipText() {
      if (this.capturing) {
        return 'Capturing screenshot…';
      }
      return this.shortcut ? `${this.tooltip} (${this.shortcutLabel})` : this.tooltip;
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
    toolbar: function (value) {
      this.settingsStore.updateScreenshotOptions({ toolbar: value });
      this.updateOutputSize();
    },
  },
  methods: {
    loadSavedOptions: function () {
      const { scale, legend, toolbar } = this.settingsStore.screenshot;
      this.scale = SCREENSHOT_SCALES.includes(scale) ? scale : SCREENSHOT_SCALES[0];
      this.legend = SCREENSHOT_LEGEND_MODES.includes(legend) ? legend : SCREENSHOT_LEGEND_MODES[0];
      this.toolbar = toolbar === true;
      this.hasLegend = findLegends(this.getTarget?.({ legend: 'only' })).length > 0;
    },
    /**
     * The legend option only applies when the target has a legend.
     */
    getLegendMode: function () {
      return this.hasLegend ? this.legend : 'exclude';
    },
    getOptions: function () {
      return { scale: this.scale, legend: this.getLegendMode(), toolbar: this.toolbar };
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
      const { scale, legend, toolbar } = this.getOptions();
      const target = this.getTarget?.({ legend, toolbar });
      this.outputSize = getOutputSize(target, scale, legend, toolbar);
    },
    onCapture: async function (source = 'button') {
      const options = this.getOptions();
      let failure;
      this.capturing = true;
      this.errorMessage = '';
      try {
        this.$refs.popover?.hide();
        const result = await this.capture({ ...options, source });
        this.notifyReduced(result);
      } catch (error) {
        console.error('Screenshot failed', error);
        failure = describeError(error, options.scale);
        this.errorMessage = failure.inline;
      } finally {
        this.capturing = false;
      }
      if (failure?.message) {
        await ElMessageBox.alert(failure.message, failure.title, {
          type: 'error',
          confirmButtonText: 'OK',
        }).catch(() => {});
      }
      if (failure) {
        // Reopen after `capturing` resets, as the popover is disabled while capturing
        await this.$nextTick();
        this.$refs.popover?.show?.();
      }
    },
    /**
     * Tell the user when the image was saved smaller than the preview,
     * because the browser could not create it at the requested size.
     */
    notifyReduced: function (result) {
      const results = [result].flat().filter(Boolean);
      const reduced = results.find((item) => item.reduced);
      if (!reduced) return;
      ElMessage({
        type: 'warning',
        duration: 8000,
        showClose: true,
        message:
          `The screenshot was too large for this browser and was saved at ` +
          `${reduced.width} × ${reduced.height} px instead. ` +
          `Choose a lower resolution to avoid the wait next time.`,
      });
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

  &.is-capturing {
    position: relative;
    overflow: visible;
    cursor: progress;

    &::after {
      content: '';
      position: absolute;
      inset: -3px;
      border: 2px solid rgba($app-primary-color, 0.2);
      border-top-color: $app-primary-color;
      border-radius: 50%;
      animation: screenshot-spin 0.8s linear infinite;
      pointer-events: none;
    }
  }
}

@keyframes screenshot-spin {
  to {
    transform: rotate(360deg);
  }
}

.screenshot-popover-inner {
  padding: 0.5rem 0.75rem;
  max-height: calc(100vh - 135px);
  overflow-y: auto;
  border-radius: var(--el-popover-border-radius);
  scrollbar-width: thin;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  > h4 {
    margin: 0;
    padding: 0;
    font-size: 16px;
    color: $app-primary-color;
    text-align: center;
  }
}

.screenshot-popover-block {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;

  h5 {
    margin: 0;
    padding: 0;
    font-size: 14px;
    font-weight: 500;
    line-height: 32px;
    color: #303133;
  }

  &.is-stacked {
    flex-direction: column;
    align-items: flex-start;
    gap: 0;
  }
}

.screenshot-description {
  display: inline-block;
  font-size: 12px;
  white-space: normal;
  line-height: 1.2;
  font-weight: normal;
  font-style: italic;
  color: gray;
}

.screenshot-popover-footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.5rem;
}

.screenshot-info {
  font-size: 12px;
  line-height: 1.2;
  font-style: italic;
  color: gray;
}

.screenshot-warning {
  color: #e6a23c;
}

.screenshot-download.el-button {
  flex-shrink: 0;
  margin-left: auto;
  font-family: inherit;

  &:hover {
    background-color: $app-primary-color;
    border-color: $app-primary-color;
  }
}

:deep(.screenshot-popover.el-popper) {
  border: 1px solid $app-primary-color;
  box-shadow: 0px 2px 12px 0px rgba(0, 0, 0, 0.06);
  padding: 1px !important;
  background-color: #f3ecf6;
  cursor: default;

  .el-popper__arrow:before {
    border-color: $app-primary-color;
    background-color: #f3ecf6;
  }
}

:deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background-color: $app-primary-color;
  border-color: $app-primary-color;
  box-shadow: -1px 0 0 0 $app-primary-color;
}
</style>
