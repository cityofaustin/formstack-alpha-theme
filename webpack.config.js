const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: {
    bundle: './build/preview.js',
    style: './src/partials/css/override.css',
  },
  mode: 'development',
  // context: path.resolve(__dirname, '../src'),
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'app.js'
  },
  resolve: {
    extensions: ['.js', '.css'],
  },
  target: 'node',
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.css$/,
        include: /src/,
        use: 'file-loader',
        // use: ['style-loader', 'css-loader'],
      },
    ]
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
  ],
};
