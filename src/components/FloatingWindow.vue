<script setup>
import { ref, toRefs } from 'vue';
import { useDraggable } from '@vueuse/core';

const props = defineProps(['windowData']);
const emit = defineEmits(['closeWindow', 'mouseDown']);
const { windowData } = toRefs(props);

// 1. Create a template ref for the DOM element
const el = ref(null);

// 2. Create a "handle" ref so the user can only drag by the header
const handle = ref(null);

// 3. Activate draggable logic
// We set initialValue to the props so it opens where we want
const { x, y, style } = useDraggable(el, {
  initialValue: { x: windowData.value.x, y: windowData.value.y },
  handle: handle, // Only drag when clicking the header
  preventDefault: true
});
</script>

<template>
  <div 
    ref="el" 
    class="floating-window" 
    :style="[style, { zIndex: windowData.zIndex }]"
    @mousedown="emit('mouseDown', windowData.id)"
  >
    <div ref="handle" class="window-header">
      <span>{{ windowData.title }}</span>
      <button @click.stop="emit('closeWindow', windowData.id)">×</button>
    </div>

    <div class="window-body">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.floating-window {
  position: absolute; /* Fixed relative to viewport */
  width: 400px;
  min-width: 200px;
  height: 300px;
  min-height: 150px;
  background: white;
  border: 1px solid #ccc;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  resize: both; /* Allow resizing */
  overflow: hidden; /* Prevent content overflow */
}

.window-header {
  background: #f0f0f0;
  padding: 8px;
  cursor: grab; /* Shows user it is draggable */
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #ddd;
  user-select: none;
}

.window-header:active {
  cursor: grabbing;
}

.window-body {
  flex-grow: 1;
  width: 100%;
  height: 100%;
  position: relative;
  padding: 10px;
  /* overflow: hidden; Important for Plotly resizing */
}
</style>
