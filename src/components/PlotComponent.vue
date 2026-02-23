<script setup>
import { ref, onMounted, watch } from 'vue';
import Plotly from 'plotly.js-dist-min';
import { useResizeObserver, useDebounceFn } from '@vueuse/core';

const props = defineProps(['data']);
const plotContainer = ref(null);

const drawPlot = () => {
  if (!plotContainer.value) return;
  
  const plotData = [{
    x: props.data?.x || [],
    y: props.data?.y || [],
    type: 'scatter'
  }];

  const layout = {
    margin: { t: 20, r: 20, b: 40, l: 40 }, // Tight margins for small windows
    autosize: true 
  };
  
  const config = { responsive: true }; // Helps with window resize, but not enough for container resize

  Plotly.newPlot(plotContainer.value, plotData, layout, config);
};

// Debounce this so we don't spam Plotly while the user is actively dragging
const handleResize = useDebounceFn(() => {
  if (plotContainer.value) {
    Plotly.Plots.resize(plotContainer.value);
  }
}, 50); // 50ms delay

// Observe resizes, useResizeObserver automatically cleans up when component unmounts
useResizeObserver(plotContainer, () => {
  handleResize();
});

onMounted(() => {
  drawPlot();
});

watch(() => props.data, drawPlot, { deep: true });
</script>

<template>
  <div ref="plotContainer" class="plot-container"></div>
</template>

<style scoped>
.plot-container {
  width: 100%;
  height: 100%;
}
</style>
