const nodeExternals = require('webpack-node-externals');
const path = require('path');
const { VueLoaderPlugin } = require('vue-loader');

module.exports = {
  mode: 'development',
  entry: 'app.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.esm.js' // 'vue/dist/vue.common.js' for webpack 1
    }
  },
  devtool: 'inline-cheap-module-source-map',
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.js$/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ['@vue/cli-plugin-babel/preset'],
            plugins: [
              [
                "component",
                {
                  libraryName: "element-ui",
                  styleLibraryName: "theme-chalk"
                }
              ]
            ]
          },
        }
      },
      {
        test: /\.(woff|woff2|eot|ttf|svg|png|jpg|jpeg)(\?.*$|$)/,
        loader: "file-loader"
      },
      {
        test: /\.css$/,
        loaders: ['vue-style-loader', 'css-loader', 'resolve-url-loader'],
      }
    ]
  },
  plugins: [
    new VueLoaderPlugin()
  ],
  resolve: {
    extensions: ['*', '.js', '.vue', '.json']
  },
  externals: [nodeExternals({
    whitelist: [/\.(?!(?:jsx?|json)$).{1,5}$/i],
  })],
}
