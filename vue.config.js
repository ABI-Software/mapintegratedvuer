module.exports = {
    chainWebpack: config => {
      // GraphQL Loader
      config.module
        .rule('shader')
        .test(/\.(vs|fs)$/i)
        .use('raw-loader')
          .loader('raw-loader')
          .end()
    },
    devServer: {
      disableHostCheck: true
  }
}