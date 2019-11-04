const fs = require('fs');
const path = require('path');

const partialResolver = require('./build/partialResolver');

module.exports = {
  entry: './src/preview/app.js',
  mode: 'development',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'app.js'
  },
  resolve: {
    extensions: ['.hbs', '.js', '.css', '.html'],
  },
  module: {
    rules: [
      {
        test: /\.(html)$/,
        loader: 'html-loader'
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.hbs$/,
        loader: "handlebars-loader",
        options: {
          partialResolver: function(partial, callback) {
            const pathOnDisk = path.resolve(__dirname, 'build', partialResolver[partial]);
            callback(null, pathOnDisk);
          }
        }
      },
    ],
  },
};
