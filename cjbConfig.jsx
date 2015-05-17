const webpack = require('webpack');

module.exports.webpackConfigs = {
  bin: {
    entry: './src/bin.jsx',
    target: 'node',
    output: {
      filename: 'bin.js'
    },
    plugins: [
      new webpack.BannerPlugin(
        '#!/usr/bin/env node',
        {raw: true, entryOnly: false}
      )
    ]
  }
};
