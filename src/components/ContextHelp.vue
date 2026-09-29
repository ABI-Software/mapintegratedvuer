<template>
  <div v-if="showHelp" class="content-container">
    <el-card
      class="box-card"
      @mouseover="isActive = true"
      @mouseleave="isActive = false"
      :class="{ active: isActive }"
    >
      <template v-slot:header>
        <div class="header">
          <span>Needing some help?</span>
          <i class="el-icon-close" style="float: right; padding: 3px 0" @click="close"></i>
        </div>
      </template>
      <div class="content">
        <div v-for="o in steps" :key="o" class="step-item">{{ o.description }}</div>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'ContextHelp',
  props: {
    /**
     * Object containing information for
     * the required viewing.
     */
    entry: Object,
  },
  data: function () {
    return {
      isActive: false,
      showHelp: true,
      steps: [],
    };
  },
  methods: {
    close: function () {
      this.showHelp = false;
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.step-item {
  font-size: 14px;
  margin-bottom: 18px;
  text-align: left;
}

.header {
  height: 20px;
}

.box-card {
  width: 280px;
  height: 280px;
  overflow: auto;
}

.active {
  width: 380px !important;
  height: 380px !important;
}
</style>
