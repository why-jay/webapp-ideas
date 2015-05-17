const webpack = require('webpack');

module.exports.target = 'node';

module.exports.webpackConfigs = {
  bin: {
    entry: './src/bin.jsx',
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
