const fs = require('fs');
const path = require('path');
const hbs = require('hbs');
const hbsutils = require('hbs-utils')(hbs);
const app = require('express')();
const dotenv = require('dotenv');
dotenv.config();

// Set up hot reload middleware
(function() {
  const webpack = require('webpack');
  const webpackConfig = require('../webpack.config');
  const compiler = webpack(webpackConfig);
  app.use(require("webpack-dev-middleware")(compiler, {
    noInfo: true,
    publicPath: webpackConfig.output.publicPath,
  }));
})()

// require('file!../src/partials/css/override.css');
// require('../src/partials/css/override.css');

/*
  "hbsutils" library will watch for changes to any registered partial files.
  This allows you to see style changes in realtime without needing to
  restart your node express server.
*/
const partialsDir = path.resolve(__dirname, '../src/partials/');
const options = {
  // Return name of partial from its path
  name: function(partialPath) {
    const splitPartialPath = partialPath.split('/');
    console.log(`~~~~ for sure registered: ${splitPartialPath[splitPartialPath.length - 1]}`)
    return splitPartialPath[splitPartialPath.length - 1];
  },
  // Register any .css, .js, or .html file in /src/partials
  match: /(.css|.js|.html)$/,
  onChange: function(name) {
    console.log("~~~~ hbs: hey this changed:", name)
  }
}
hbsutils.registerWatchedPartials(partialsDir, options)

// Start express server with Handlebars view engine
app.set("view engine", "hbs");
app.set('views', __dirname + '/../src/');
app.get('/', (req,res) => {
  res.render('root');
});
const port = process.env.FORMSTACK_PREVIEW_PORT || 5000
app.listen(port);
console.log(`Serving form preview at http://localhost:${port}`)
