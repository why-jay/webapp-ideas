const createSingleWebpackConfigAsync =
  require('./createSingleWebpackConfigAsync.jsx');
const runDistServerAsync = require('./runDistServerAsync.jsx');
const validateCjbConfigAsync = require('./validateCjbConfigAsync.jsx');

const Bluebird = require('bluebird');
const cjb = require('chcokr-js-build');
const fs = Bluebird.promisifyAll(require('fs'));
const path = require('path');
const rimrafAsync = Bluebird.promisify(require('rimraf'));

const cwd = process.cwd();

/**
 * Runs the following tasks in order:
 *
 * - CJB: check certain paths exist (refer to CJB's docs for CJB tasks)
 * - Validate `cjbConfig.js/jsx` according to `validateCjbConfigAsync()`
 * - CJB: install pre-commit hook
 * - CJB: try Babel compilaion on select files
 * - CJB: run ESLint on select files
 * - Then one of the following:
 *  - If `process.argv[2]` is `"wds"`, imports property `cwbStart` from
 *  cjbConfig.js/jsx, modify it through `createSingleWebpackConfigAsync()`, and
 *  then invokes CJB's webpack-dev-server with the final modified config.
 *  - If `process.argv[2]` is `"distserver"`, invokes `runDistServerAsync()`
 *  - Otherwise, deletes dist/, copies the contents of this repo's
 *  dist/.gitignore over to the project's dist/.gitignore (after creating the
 *  path), modifies the webpack config of entry point specified in
 *  cjbConfig.js/jsx through `createSingleWebpackConfigAsync()`, and runs each
 *  webpack configuration one by one (thereby creating each bundle).
 *
 * @returns {void}
 */
async function runCLIAsync() {
  try {

    await cjb.checkPathsExistAsync();

    await validateCjbConfigAsync();

    await cjb.installPrecommitHookAsync();

    await cjb.runBabelAsync();

    await cjb.runEslintAsync();

    const cjbWebpackConfigs = await cjb.getModifiedWebpackConfigsAsync();

    if (process.argv[2] === 'wds') {

      const cwbStartWebpackConfig = cjbWebpackConfigs.cwbStart;
      const cwbWebpackConfig =
        await createSingleWebpackConfigAsync(true, cwbStartWebpackConfig);
      await cjb.runWebpackDevServerAsync(cwbWebpackConfig);

    } else if (process.argv[2] === 'distserver') {

      await runDistServerAsync();

    } else {

      console.log('Deleting dist/');
      await rimrafAsync(path.join(cwd, 'dist'));
      console.log('Rewriting dist/.gitignore');
      await fs.mkdirAsync(path.join(cwd, 'dist'));
      await fs.writeFileAsync(
        path.join(cwd, 'dist', '.gitignore'),
        require('raw!../dist/.gitignore')
      );

      const cwbWebpackConfigs = {};
      for (let entryPointName of Object.keys(cjbWebpackConfigs)) {
        cwbWebpackConfigs[entryPointName] =
          await createSingleWebpackConfigAsync(
            false,
            cjbWebpackConfigs[entryPointName]
          );
      }
      await cjb.runWebpackAsync(cwbWebpackConfigs);

    }

  } catch(err) {
    cjb.utils.handleError(err);
  }
}

module.exports = runCLIAsync;
