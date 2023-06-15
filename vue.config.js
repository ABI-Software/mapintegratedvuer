const nodeExternals = require('webpack-node-externals');

module.exports = {
  pluginOptions: {
    webpackBundleAnalyzer: {
      openAnalyzer: false
    }
  },
    chainWebpack: config => {
      // GraphQL Loader
      config.module
        .rule('shader')
        .test(/\.(vs|fs)$/i)
        .use('raw-loader')
          .loader('raw-loader')
          .end()
      const fontsRule = config.module.rule('fonts')
      fontsRule.uses.clear()
      config.module
        .rule('fonts')
        .test(/\.(ttf|otf|eot|woff|woff2)$/)
        .use('base64-inline-loader')
        .loader('base64-inline-loader')
        .tap(options => {
          // modify the options...
          return options
        })
        .end()
    },
    devServer: {
      disableHostCheck: true
  },
  configureWebpack: config => {
    if(process.env.NODE_ENV === 'production') {
      //By including element-ui and all abi projects, the problem with element-ui
      //stylesheet can be avoided.
<<<<<<< HEAD
      config.externals =  [ nodeExternals({allowlist: [/^element-ui/, /^@abi-software/]}) ];
=======
      config.externals =  [ nodeExternals({allowlist: [/^element-ui/, /^@abi-software/, /^marked/ ]}) ];
>>>>>>> 23591fba1ff9bad23bcaec47011181c2fc7f50b2
    }
  },
  css: {
    //Import variables into all stylesheets.
    loaderOptions: {
      sass: {
        prependData: `@import '@/assets/styles';`
      }
    }
  }
}
