const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

module.exports = (config) => {
  const production = process.env.NODE_ENV === 'production';
  const webpackConfig = { ...config };
  // FilenameHash
  webpackConfig.output.chunkFilename = '[name].[chunkhash].js';
  if (production) {
    if (webpackConfig.module) {
      // ClassnameHash
      webpackConfig.module.rules.map((t) => {
        const item = { ...t };
        if (String(item.test) === '/\\.less$/' || String(item.test) === '/\\.css/') {
          item.use.filter(iitem => iitem.loader.includes('css'))[0].options.localIdentName = '[hash:base64:5]';
        }
        return item;
      });
    }
    webpackConfig.plugins.push(new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: false,
    }));
  }

  webpackConfig.plugins = webpackConfig.plugins.concat([
    new CopyWebpackPlugin([
      {
        from: 'public',
        to: webpackConfig.output.outputPath,
      },
    ]),
    new HtmlWebpackPlugin({
      template: `${__dirname}/src/index.ejs`,
      filename: production ? 'index.html' : 'index.html',
      minify: production ? {
        collapseWhitespace: true,
      } : null,
      hash: true,
    }),
  ]);

  // Alias
  webpackConfig.resolve.alias = {
    components: `${__dirname}/src/components`,
    utils: `${__dirname}/src/utils`,
    config: `${__dirname}/src/utils/config`,
    services: `${__dirname}/src/services`,
    models: `${__dirname}/src/models`,
    mock: `${__dirname}/mock`,
    routes: `${__dirname}/src/routes`,
    themes: `${__dirname}/src/themes`,
  };

  return webpackConfig;
};
