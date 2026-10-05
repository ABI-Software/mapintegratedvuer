<template>
  <div class="screenshot-popover-container" data-screenshot-ignore>
    <el-popover
      v-if="triggerRef"
      ref="popover"
      :virtual-ref="triggerRef"
      :placement="placement"
      width="240"
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
        <div class="screenshot-info">
          <template v-if="outputSize.width">
            PNG, {{ outputSize.width }} × {{ outputSize.height }} px
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
          @click="onCapture"
        >
          Download
        </el-button>
      </div>
    </el-popover>
    <el-popover
      class="tooltip"
      :content="tooltip"
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
import { SCREENSHOT_SCALES, getOutputSize } from '../services/screenshot';

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
     * Async function called with `{ scale }` to perform the capture.
     */
    capture: {
      type: Function,
      required: true,
    },
    /**
     * Function returning the element to be captured, used for size preview.
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
  },
  data: function () {
    return {
      triggerRef: undefined,
      scales: SCREENSHOT_SCALES,
      scale: 1,
      capturing: false,
      errorMessage: '',
      outputSize: { width: 0, height: 0, clamped: false },
    };
  },
  computed: {
    ...mapStores(useSettingsStore),
    helpDelay() {
      return this.settingsStore.helpDelay;
    },
  },
  watch: {
    scale: function () {
      this.updateOutputSize();
    },
  },
  methods: {
    onShow: function () {
      const { scale } = this.settingsStore.screenshot;
      this.scale = SCREENSHOT_SCALES.includes(scale) ? scale : SCREENSHOT_SCALES[0];
      this.errorMessage = '';
      this.updateOutputSize();
    },
    updateOutputSize: function () {
      const target = this.getTarget?.();
      this.outputSize = getOutputSize(target, this.scale);
    },
    onCapture: async function () {
      this.capturing = true;
      this.errorMessage = '';
      try {
        this.$refs.popover?.hide();
        await this.capture({ scale: this.scale });
      } catch (error) {
        console.error('Screenshot failed', error);
        this.errorMessage = 'Screenshot failed. Please try a lower resolution.';
        this.$refs.popover?.show?.();
      } finally {
        this.capturing = false;
      }
    },
  },
  mounted: function () {
    this.triggerRef = shallowRef(this.$refs.triggerRef);
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
