# MapIntegratedVuer Live Demo

## Live Demo

<div class="demo-map-container">
  <div class="demo-map-container-inner">
    <ClientOnly>
      <iframe
        src="https://mapcore-demo.org/current/mapintegratedvuer/"
      >
      </iframe>
    </ClientOnly>
  </div>
</div>
<p>
  Live demo full page URL:
  <a href="https://mapcore-demo.org/current/mapintegratedvuer/" target="_blank">
  https://mapcore-demo.org/current/mapintegratedvuer
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
            // Optional: default resolution for the screenshot download
            // scale: multiplier on the device pixel ratio (default 1)
            screenshot: { scale: 1 },
          }
        }
      }
    }
  </script>
```

## Screenshots

Each viewer pane has a camera button in its header that downloads a screenshot of that pane.
The camera button in the top toolbar downloads all visible panes together, including the sidebar if it is open.
Screenshots are saved as PNG. Pick the resolution (1x to 4x the device pixel ratio) before downloading; higher resolutions suit printing.
On-screen controls such as zoom buttons and settings panels are left out of the image.
Very large outputs are reduced automatically to stay within browser canvas limits.

Screenshots can also be triggered programmatically:

```js
// All visible panes
this.$refs.map.captureScreenshot({ scale: 3 });
// A single pane, by entry id
this.$refs.map.captureScreenshot({ paneId: 1, scale: 2 });
```
