import path from "path";
import { defineConfig } from 'vite'
import rootConfig from './vite.config.js'

// defineWorkspace provides a nice type hinting DX
export default defineConfig((configEnv) => {
  const config = rootConfig(configEnv);
  config.build = {
    lib: {
      entry: path.resolve(__dirname, "./src/components/index.js"),
      name: "MapintegratedVuer",
      fileName: "mapintegratedvuer",
    },
    rollupOptions: {
      external: ["vue", "pinia"],
      output: {
        globals: {
          vue: "Vue",
          pinia: "pinia",
        },
      },
    },
  };
  
  return config;
})
