const fs = require('fs');
const path = require('path');
const hbs = require('hbs');
const hbsutils = require('hbs-utils')(hbs);
const app = require('express')();
const dotenv = require('dotenv');
dotenv.config();

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
    return splitPartialPath[splitPartialPath.length - 1];
  },
  // Register any .css, .js, or .html file in /src/partials
  match: /(.css|.js|.html)$/,
}
hbsutils.registerWatchedPartials(partialsDir, options)

app.set("view engine", "hbs");
app.set('views', __dirname + '/../src/');

app.get('/', (req,res) => {
  res.render('root');
});

const port = process.env.FORMSTACK_PREVIEW_PORT || 5000
app.listen(port);
console.log(`Serving form preview at http://localhost:${port}`)