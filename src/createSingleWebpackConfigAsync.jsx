const cjb = require('chcokr-js-build');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

/**
 * Creates a separate copy of the given `webpackConfig` object, makes the
 * following modifications to the object, runs that modified object through
 * CJB's manipulations for `"browser"` target, and returns the final result.
 *
 * ### `module.loaders`
 *
 * The following loaders are added at the **end** of the `module.loaders` array
 * (order: the last one in this list will be the last one in the
 * `module.loaders` array).
 *
 * If `isWdsMode` is true:
 *
 * ```
 * {
 *   test: /\.css/,
 *   loader: 'style!css!autoprefixer?' +
 *     'browsers=<cjbConfig.js/jsx's `cwbBrowsers`>'
 * }
 * ```
 * ```
 * {
 *   test: /\.scss/,
 *   loader: 'style!css!autoprefixer?' +
 *     'browsers=<cjbConfig.js/jsx's `cwbBrowsers`>'
 *     '!sass?sourceMap=true'
 * }
 * ```
 *
 * If `isWdsMode` is false:
 *
 * ```
 * {
 *   test: /\.css/,
 *   loader: ExtractPlugin.extract('style', 'css!autoprefixer?' +
 *     'browsers=<cjbConfig.js/jsx's `cwbBrowsers`>'
 * }
 * ```
 * ```
 * {
 *   test: /\.scss/,
 *   loader: ExtractPlugin.extract('style', 'css!autoprefixer?' +
 *     'browsers=<cjbConfig.js/jsx's `cwbBrowsers`>'
 *     '!sass?sourceMap=true'
 * }
 * ```
 *
 * ### `output.filename`
 *
 * `output.filename` is set to `index-<hash of index.jsx bundle>.js`.
 *
 * ### `plugins`
 *
 * The following plugins are added at the **beginning** of the `plugins` array,
 * in this order:
 *
 * ```
 * new HtmlPlugin({
 *   filename: 'index.html',
 *   templateContent: <contents of this repo's src/indexTemplate.html>,
 *
 *   // custom option, will be used inside the indexTemplate.html template
 *   isWdsMode,
 *
 *   // custom option, will be used inside the indexTemplate.html template
 *   timestamp
 * })
 * ```
 * ```
 * new webpack.DefinePlugin({
 *   'process.env': {
 *     NODE_ENV: JSON.stringify(isWdsMode ? 'development' : 'production')
 *   }
 * })
 * ```
 *
 * The following are additionally added if `isWdsMode` is `false`.
 *
 * ```
 * new webpack.optimize.DedupePlugin()
 * ```
 * ```
 * new webpack.optimize.OccurenceOrderPlugin()
 * ```
 * ```
 * new webpack.optimize.UglifyJsPlugin({output: {comments: false}})
 * ```
 * ```
 * new ExtractTextPlugin(
 *   `index-<timestamp at time of build>.css`,
 *   {allChunks: true}
 * )
 * ```
 *
 * @param {boolean} isWdsMode Whether the result of this build will be used
 * on a webpack-dev-server.
 * @param {webpackConfig} config The `webpackConfig` property of a
 * `cjbConfig.js/jsx`.
 * @returns {object} A new config object which all properties of `config`
 * have been copied into and the aforementioned modifications have been made to.
 */
async function createSingleWebpackConfigAsync(isWdsMode, config) {
  const newConfig = Object.assign({}, config);
  const timestamp = Date.now();

  if (!newConfig.module) {
    newConfig.module = {};
  }

  const projectCjbConfig = await cjb.getCjbConfigAsync();

  if (!newConfig.module.loaders) {
    newConfig.module.loaders = [];
  }
  const autoprefixerStr =
    `autoprefixer?browsers=${projectCjbConfig.cwbBrowsers}`;
  newConfig.module.loaders = [
    {
      test: /\.css/,
      loader: isWdsMode ? `style!css!${autoprefixerStr}` :
        ExtractTextPlugin.extract('style', `css!${autoprefixerStr}`)
    },
    {
      test: /\.scss/,
      loader: isWdsMode ? `style!css!${autoprefixerStr}!sass?sourceMap=true` :
        ExtractTextPlugin.extract(
          'style',
          `css!${autoprefixerStr}!sass?sourceMap=true`
        )
    },
    ...newConfig.module.loaders
  ];

  if (!newConfig.output) {
    newConfig.output = {};
  }

  newConfig.output.filename = `index-[hash].js`;

  if (!newConfig.plugins) {
    newConfig.plugins = [];
  }
  newConfig.plugins = [
    new HtmlPlugin({
      filename: 'index.html',
      templateContent: require('raw!./indexTemplate.html'),

      // custom option, will be used inside the indexTemplate.html template
      isWdsMode,

      // custom option, will be used inside the indexTemplate.htsml template
      timestamp
    }),
    new webpack.DefinePlugin({
      'process.env': { // eslint-disable-line object-shorthand
                       // (why is this a violation?)
        NODE_ENV: JSON.stringify(isWdsMode ? 'development' : 'production')
      }
    }),
    ...(isWdsMode ? [] : [
      new webpack.optimize.DedupePlugin(),
      new webpack.optimize.OccurenceOrderPlugin(),
      new webpack.optimize.UglifyJsPlugin({output: {comments: false}}),
      new ExtractTextPlugin(`index-${timestamp}.css`, {allChunks: true})
    ]),
    ...newConfig.plugins
  ];

  return newConfig;
}

module.exports = createSingleWebpackConfigAsync;
