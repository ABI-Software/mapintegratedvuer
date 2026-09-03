import path from "path";
import { defineConfig } from 'vite'
import rootConfig from './vite.config.js'

// defineWorkspace provides a nice type hinting DX
export default defineConfig((configEnv) => {
  const config = rootConfig(configEnv);
  config.build = {
    lib: {
      entry: path.resolve(import.meta.dirname, "./src/components/index.js"),
      name: "MapintegratedVuer",
      fileName: "mapintegratedvuer",
    },
    rollupOptions: {
      external: [
        "vue",
        "pinia",
        "@abi-software/flatmapvuer",
        "@abi-software/plotvuer",
        "@abi-software/scaffoldvuer",
        "@abi-software/simulationvuer",
        "@abi-software/flatmapvuer/dist/style.css",
        "@abi-software/plotvuer/dist/style.css",
        "@abi-software/scaffoldvuer/dist/style.css",
        "@abi-software/simulationvuer/dist/style.css",
      ],
      output: {
        globals: {
          vue: "Vue",
          pinia: "pinia",
          "@abi-software/flatmapvuer": "flatmapvuer",
          "@abi-software/plotvuer": "plotvuer",
          "@abi-software/scaffoldvuer": "scaffoldvuer",
          "@abi-software/simulationvuer": "simulationvuer",
        },
        // keep css output name stable for the "./dist/style.css" export/import paths
        assetFileNames: (assetInfo) =>
          assetInfo.name?.endsWith(".css")
            ? "style.css"
            : "assets/[name][extname]",
      },
    },
  };

  return config;
})
