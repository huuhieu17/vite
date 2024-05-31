import {defineConfig, transformWithEsbuild, loadEnv} from "vite"
import { resolve } from "node:path";
import react from "@vitejs/plugin-react"
import path from "path";
import commonjs from "vite-plugin-commonjs";
import svgr from "vite-plugin-svgr";
import progress from "vite-plugin-progress"
import preload from "vite-plugin-preload";
import posthtml from '@vituum/vite-plugin-posthtml'
// https://vitejs.dev/config/
export default defineConfig(({mode}) => {
  process.env = {...process.env, ...loadEnv(mode, process.cwd())};
 return {
  // publicDir: "/public",
  // esbuild: {loader: "jsx", include: /src\/.*\.jsx?$/, exclude: [],},
  optimizeDeps: {
    force: true,
      esbuildOptions: {
      loader: {
        ".js": "jsx",
      },
    },
  },
  define: {
    "process": process,
  },
  plugins: [
    // Resolve js to jsx
    {
      name: "treat-js-files-as-jsx",
      async transform(code, id) {
        if (!id.match(/src\/.*\.js$/)) return null

        // Use the exposed transform from vite, instead of directly
        // transforming with esbuild
        return transformWithEsbuild(code, id, {
          loader: "jsx",
          jsx: "automatic",
        })
      },
    },
    // lingui
    react({
      babel: {
        plugins: ["macros"],
      },
    }),
    // Fix import svg vite
    svgr({
      svgrOptions: {exportType: "named", ref: true, svgo: false, titleProp: true, jsx: true},
      include: "**/*.svg",
    }),
    commonjs(),
    progress(),
    preload(),
    // import html
    {
      name: "htmlImport",
      /**
       * Checks to ensure that a html file is being imported.
       * If it is then it alters the code being passed as being a string being exported by default.
       * @param {string} code The file as a string.
       * @param {string} id The absolute path.
       * @returns {{code: string}}
       */
      transform(code, id) {
        if (/^.*\.html$/g.test(id)) {
          code = `export default \`${code}\``
        }
        return { code }
      }
    },
    posthtml()

  ],
    css: {
    postcss: {
      plugins: [],
    },
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
      scss: {
      },
    },
  },
  resolve: {
    alias: [
      {find: "@", replacement: path.resolve(__dirname, "src")},
      {
        find: /^@\//,
        replacement: `${path.resolve(__dirname, "src")}/`,
      },
      {find: /^~/, replacement: ""},
    ],
      extensions: [".js", ".jsx", ".ts", ".tsx"],
  },

  assetsInclude: "**/*.html",

  build: {
    // lib: {
    //   entry: resolve("src", "index.jsx"),
    //   name: ['es', 'umd']
    // },
    // rollupOptions: {
    //   // overwrite default .html entry
    //   input: '/src/index.jsx',
    // },
  },
  server: {
    port: 4000,
      watch: {
      usePolling: true
    },
    hmr: true,
      proxy: {
      '/api': process.env.VITE_APP_GATEWAY_URL,
    }
  },
  preview: {
    port: 4005,
  },

}})
