# MapIntegratedVuer Live Demo

## Live Demo

<div class="demo-map-container">
  <div class="demo-map-container-inner">
    <ClientOnly>
      <iframe
        src="https://mapintegratedvuer-mapcore-754fcb3bf891.herokuapp.com"
      >
      </iframe>
    </ClientOnly>
  </div>
</div>
<p>
  Live demo full page URL:
  <a href="https://mapintegratedvuer-mapcore-754fcb3bf891.herokuapp.com" target="_blank">
  https://mapintegratedvuer-mapcore-754fcb3bf891.herokuapp.com
  </a>
</p>

<script setup>
  import './demo-styles.css'
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
            rootUrl: 'meta.env.VITE_ROOT_URL',
          }
        }
      }
    }
  </script>
```

