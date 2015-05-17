const runCLIAsync = require('./runCLIAsync.jsx');

const cjb = require('chcokr-js-build');

(async function () {
  try {

    await runCLIAsync();

  } catch(err) {
    cjb.utils.handleError(err);
  }
})();
