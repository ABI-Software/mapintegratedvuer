# MapIntegratedVuer Live Demo

## Live Demo

<div class="demo-map-container">
  <div class="demo-map-container-inner">
    <ClientOnly>
      <div></div>
    </ClientOnly>
  </div>
</div>

<script setup>
import { defineClientComponent } from 'vitepress'

const MapContent = defineClientComponent(() => {
  return import('../src/components/MapContent.vue')
})
</script>

<script>
export default {
  data: function() {
    return {

    };
  }
}
</script>

## Code Preview

```js-vue
  <div class="your-outer-container">
    <FlatmapVuer
      entry="NCBITaxon:10114"
    />
  </div>

  <script>
    import { FlatmapVuer } from '@abi-software/flatmapvuer';
    import '@abi-software/flatmapvuer/dist/style.css';

    export default {
      components: { FlatmapVuer },
      data: function () {
        return {

        }
      }
    }
  </script>
```
