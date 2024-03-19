# MapIntegratedVuer Live Demo

## Live Demo

<div class="demo-map-container">
  <div class="demo-map-container-inner">
    <ClientOnly>
      <MapContent
        ref="map"
        :startingMap="startingMap"
        :options="options"
        :state="state"
        :shareLink="shareLink"
        @updateShareLinkRequested="updateUUID"
        @isReady="mapIsReady"
      />
    </ClientOnly>
  </div>
</div>

<script setup>
  import { defineClientComponent } from 'vitepress'
  import { createApp } from 'vue'
  import { createPinia } from 'pinia'

  import './demo-styles.css'

  const MapContent = defineClientComponent(() => {
    return import('../src/components/MapContent.vue')
  })

  const pinia = createPinia()
  const app = createApp(MapContent)

  app.use(pinia)
</script>

<script>
  export default {
    data: function() {
      return {
        options: {
          sparcApi: 'VITE_API_LOCATION',
          algoliaIndex: 'VITE_ALGOLIA_INDEX',
          algoliaKey: 'VITE_ALGOLIA_KEY',
          algoliaId: 'VITE_ALGOLIA_ID',
          pennsieveApi: 'VITE_PENNSIEVE_API_LOCATION',
          flatmapAPI: 'VITE_FLATMAPAPI_LOCATION',
          nlLinkPrefix: 'VITE_NL_LINK_PREFIX',
          rootUrl: 'meta.env.VITE_ROOT_URL',
        }
      }
    }
  }
</script>

## Code Preview

```js-vue
  <div class="your-map-container">
    <MapContent
      ref="map"
      :startingMap="startingMap"
      :options="options"
      :state="state"
      :shareLink="shareLink"
      @updateShareLinkRequested="updateUUID"
      @isReady="mapIsReady"
    />
  </div>

  <script>
    import { MapContent } from '@abi-software/mapintegratedvuer';

    export default {
      components: { MapContent },
      data: function () {
        return {
          options: {
            sparcApi: 'VITE_API_LOCATION',
            algoliaIndex: 'VITE_ALGOLIA_INDEX',
            algoliaKey: 'VITE_ALGOLIA_KEY',
            algoliaId: 'VITE_ALGOLIA_ID',
            pennsieveApi: 'VITE_PENNSIEVE_API_LOCATION',
            flatmapAPI: 'VITE_FLATMAPAPI_LOCATION',
            nlLinkPrefix: 'VITE_NL_LINK_PREFIX',
            rootUrl: 'meta.env.VITE_ROOT_URL',
          }
        }
      }
    }
  </script>
```