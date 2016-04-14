var path = require('path');

module.exports = {
  entry: './build/client/index.js',
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'build.js'
  },
  module: {
    preLoaders: [
      {
        test: /\.js$/,
        loader: 'source-map-loader'
      }
    ]
  },
  debug: true,
  devtool: 'source-map'
};
