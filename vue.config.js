module.exports = {
    chainWebpack: config => {
      // GraphQL Loader
      config.module
        .rule('shader')
        .test(/\.(vs|fs)$/i)
        .use('raw-loader')
          .loader('raw-loader')
          .end()
        .rule('fonts')
        .test(/\.(woff|woff2|eot|ttf|svg)(\?.*$|$)/)
        .use('file-loader')
          .loader('file-loader')
          .end()

    },
    devServer: {
      disableHostCheck: true
  }
}