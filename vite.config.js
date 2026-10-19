import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pathSrc = path.resolve(__dirname, './src');

// SimulationVuer (libOpenCOR wasm) needs SharedArrayBuffer, which requires cross-origin isolation.
// Safari/WebKit does not support COEP `credentialless`,
// so serve `require-corp` to WebKit browsers and `credentialless` to the rest.
const isWebKitOnly = (ua = '') => ua.includes('AppleWebKit') && !/(Chrome|Chromium|Edg)\//.test(ua);

const crossOriginIsolation = () => {
  const middleware = (req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader(
      'Cross-Origin-Embedder-Policy',
      isWebKitOnly(req.headers['user-agent']) ? 'require-corp' : 'credentialless',
    );
    res.setHeader('Vary', 'User-Agent');
    next();
  };
  return {
    name: 'cross-origin-isolation',
    configureServer: (server) => {
      server.middlewares.use(middleware);
    },
    configurePreviewServer: (server) => {
      server.middlewares.use(middleware);
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const config = {
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
          additionalData: `@use '@/assets/styles' as *;`,
        },
      },
    },
    plugins: [
      vue(),
      AutoImport({
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        // allow auto load markdown components under `./src/components/`
        extensions: ['vue', 'md'],
        // allow auto import and register components used in markdown
        include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
        resolvers: [
          ElementPlusResolver({
            importStyle: 'sass',
          }),
        ],
        dts: 'src/components.d.ts',
      }),
    ],
    // for cypress component test
    // to prevent reloading after optimized dependencies changed
    optimizeDeps: {
      exclude: ['vue-router'],
    },
    resolve: {
      alias: {
        '@': pathSrc,
      },
    },
  };

  if (command === 'serve') {
    config.server = {
      port: 8081,
    };
    config.plugins.push(crossOriginIsolation());
    config.define = {
      'process.env.HTTP_PROXY': 8081,
      global: 'globalThis',
      // If you want to exposes all env variables, which is not recommended
      // 'process.env': env
    };
  }
  return config;
});
