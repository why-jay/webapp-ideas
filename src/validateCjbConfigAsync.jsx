const cjb = require('chcokr-js-build');

/**
 * Runs the following validations against the target project's
 * `cjbConfig.js/jsx`.
 *
 * - It must pass all of CJB's validations as defined in the CJB API's function
 * `validateCjbConfig()`.
 * - It must export *string* property `cwbBrowsers`.
 * The string should follow a format defined at
 * https://github.com/ai/browserslist.
 * - Its exported property `webpackConifgs` must define entry point `cwbStart`.
 *
 * @returns {void}
 */
async function validateCjbConfigAsync() {
  // cjb.getCjbConfigAsync() runs CJB's cjbConfig.js/jsx validations
  const projectCjbConfig = await cjb.getCjbConfigAsync();

  if (!projectCjbConfig.cwbBrowsers) {
    throw new Error('cjbConfig.js/jsx must export *string* property' +
      ' `cwbBrowsers`. The string should follow a format defined at' +
      ' https://github.com/ai/browserslist');
  }

  if (!projectCjbConfig.webpackConfigs.cwbStart) {
    throw new Error('cjbConfig.js/jsx\'s exported property `webpackConfigs`' +
      ' must define entry point `cwbStart`.');
  }
}

module.exports = validateCjbConfigAsync;
