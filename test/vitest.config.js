import { defineConfig, mergeConfig } from 'vitest/config'
import rootConfig from '../vite.config.js'

// defineWorkspace provides a nice type hinting DX
export default defineConfig(configEnv => mergeConfig(
  rootConfig(configEnv),
  defineConfig({
    test: {
      include: ['unit/*.spec.js'],
      // it is recommended to define a name when using inline configs
      name: 'mapvuer-test',
      environment: 'happy-dom',
      globals: true,
      setupFiles: ['unit/setup.js'],
      server: {
        deps: {
          inline: [ 'element-plus', "mathjax-full" ]
        }
      },
      alias: {
        'RegisterHTMLHandler': 'mathjax-full/js/handlers/html'
      }
    },
    plugins: [
      {
        name: 'virtual-modules',
        resolveId(id) {
          if (id === 'RegisterHTMLHandler')
            return true
        }
      }
    ]
  })
))
