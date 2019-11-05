const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: './build/preview.js',
  mode: 'development',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'app.js'
  },
  resolve: {
    extensions: ['.js'],
  },
  target: 'node',
  externals: [nodeExternals()],
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    function(compiler) {
      console.log("~~~~ file dependencies?", this.fileDependencies)
      console.log("~~~~ contextDependencies?", this.contextDependencies)
      // compiler.plugin("after-compiler", function() {
        // this.fileDependencies.push("/path/to/my/file");
        // this.contextDependencies.push("/path/to/my/folder");
      // }
    },
  ],
};
