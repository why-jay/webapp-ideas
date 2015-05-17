const Bluebird = require('bluebird');
const cjb = require('chcokr-js-build');
const compress = require('compression');
const express = require('express');
const path = require('path');

const cwd = process.cwd();

/**
 * Runs an Express.js server purposed for simulating a CDN fine-tuned for CWB,
 * on the port specified by the exported property `CWB_DIST_SERVER_PORT` in the
 * project's `environment.js/jsx`.
 * It exposes every file in `dist/`.
 * Features of this server:
 *
 * - Everything is gzipped
 * - All files but `dist/index.html` is sent with a max-age of 365 days.
 * - `dist/index.html` comes with a max-age of 10 minutes.
 *
 * @returns {void}
 * @throws {Error} When environment.js/jsx does not export property
 * CWB_DIST_SERVER_PORT
 * @throws {Error} When environment.js/jsx's exported property
 * CWB_DIST_SERVER_PORT isn't an integer
 */
async function runDistServerAsync() {
  try {

    const projectEnv = await cjb.getProjectEnvAsync();
    if (!projectEnv.CWB_DIST_SERVER_PORT) {
      throw new Error('To use the dist server, environment.js/jsx must export' +
        'property CWB_DIST_SERVER_PORT');
    }
    if (!Number.isInteger(projectEnv.CWB_DIST_SERVER_PORT)) {
      throw new Error('environment.js/jsx property CWB_DIST_SERVER_PORT must' +
        ' bean integer');
    }
    const port = projectEnv.CWB_DIST_SERVER_PORT;

    const server = Bluebird.promisifyAll(express());

    server.use(compress({
      threshold: false // compress everything
    }));

    server.use(express.static(
      path.join(cwd, 'dist'),
      {
        maxAge: '365d', // cache all the static files for a long time,
        setHeaders(res, staticFilePath) { // except index.html.
          if (staticFilePath === path.resolve(cwd, 'dist', 'index.html')) {
            // index.html is cached for 10min.
            res.set('Cache-Control', 'public, max-age=600');
          }
        }
      }
    ));

    await server.listenAsync(port);
    console.log(`Dist server is running at http://localhost:${port}`);
  } catch(err) {
    cjb.utils.handleError(err);
  }
}

module.exports = runDistServerAsync;
