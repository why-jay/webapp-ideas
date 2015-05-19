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
 *  - Otherwise:
 *   - deletes dist/
 *   - copies the contents of this repo's dist/.gitignore over to the project's
 *   dist/.gitignore (after creating the path)
 *   - modifies the webpack config of entry point specified in cjbConfig.js/jsx
 *   through `createSingleWebpackConfigAsync()`
 *   - creates a temporary clone of the specified entry file
 *   - adds the following text to the top of the temporary file
 *   ```JS
 *    // Start: CWB-generated output
 *    require('chcokr-webapp-build/dist/polyfill.js');
 *    require('chcokr-webapp-build/dist/polyfill.css');
 *    // End: CWB-generated output
 *   ```
 *   - invokes webpack from that entry point with the final modified webpack
 *   configuration
 *   - of course, if multiple entry points have been defined, each bundle gets
 *   built one by one
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

      for (let entryPointName of Object.keys(cjbWebpackConfigs)) {
        const config = await createSingleWebpackConfigAsync(
          false,
          cjbWebpackConfigs[entryPointName]
        );
        await cjb.runWebpackAsync(
          config,
          '// Start: CWB-generated output\n' +
            "require('chcokr-webapp-build/dist/polyfill.jsx');\n" +
            '// End: CWB-generated output\n'
        );
      }

    }

  } catch(err) {
    cjb.utils.handleError(err);
  }
}

module.exports = runCLIAsync;
