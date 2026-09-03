import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pathSrc = path.resolve(__dirname, "./src");

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
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
      Components({
        // allow auto load markdown components under `./src/components/`
        extensions: ["vue", "md"],
        // allow auto import and register components used in markdown
        include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
        resolvers: [
          ElementPlusResolver({
            importStyle: "sass",
          }),
        ],
        dts: "src/components.d.ts",
      }),

      // https://github.com/antfu/unocss
      // see unocss.config.ts for config
    ],
    // for cypress component test
    // to prevent reloading after optimized dependencies changed
    optimizeDeps: {
      exclude: ["vue-router"],
    },
    preview: {
      allowedHosts: ['mapintegratedvuer-mapcore-754fcb3bf891.herokuapp.com'],
    },
    resolve: {
      alias: {
        "@": pathSrc,
      },
    },
  };

  if (command === "serve") {
    config.server = {
      port: 8081,
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "credentialless",
      },
    };
    config.define = {
      "process.env.HTTP_PROXY": 8081,
      global: "globalThis",
      // If you want to exposes all env variables, which is not recommended
      // 'process.env': env
    };
  }
  return config;
});
