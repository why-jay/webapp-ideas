const cjb = require('chcokr-js-build');
const createSingleWebpackConfigAsync =
  require('./createSingleWebpackConfigAsync.jsx');

/**
 * Runs `cjbConfig.js/jsx`'s webpackConfig through CJB's modifications, runs the
 * result through CWB's own modifications, and runs a webpack-dev-server (using
 * CJB) with the final configuration.
 * For the full list of manipulations, see
 * `src/createSingleWebpackConfigAsync.jsx`.
 *
 * @returns {void}
 */
async function runWebpackDevServerAsync() {
  try {

    const webpackConfig = await cjb.getModifiedWebpackConfigsAsync().cwbStart;

    const cwbWebpackConfig =
      createSingleWebpackConfigAsync(true, webpackConfig);

    await cjb.runWebpackDevServerAsync(cwbWebpackConfig);

  } catch (err) {
    cjb.utils.handleError(err);
  }
}

module.exports = runWebpackDevServerAsync;
