import { defineConfig } from 'vite'
import rootConfig from './vite.config.js'

// defineWorkspace provides a nice type hinting DX
export default defineConfig((configEnv) => {
  const config = rootConfig(configEnv);
  config.build = {
    outDir: "test-html"
  };

  return config;
})
