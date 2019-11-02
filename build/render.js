const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

function readFile(relativePath) {
  return fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8').toString()
}

// Allows us to import iframeResizer js as {{> iframeResizer }}
Handlebars.registerPartial('iframeResizer', readFile('../src/js/iframeResizer.js'));
// Allows us to import defaultFormstackStyles as {{> defaultFormstackStyles }}
Handlebars.registerPartial('defaultFormstackStyles', readFile('../src/css/default.formstack.css'));
// Allows us to import Formstack style overrides as {{> overrideStyles }}
Handlebars.registerPartial('overrideStyles', readFile('../src/css/override.css'));

// Render the template
const index = readFile('../src/html/index.html');
const template = Handlebars.compile(index);
const data = {} // Allow future option of plugging in variables into handlebar builds
var generatedHtml = template(data);
fs.writeFileSync(path.resolve(__dirname, "./alpha_theme_header.html"), generatedHtml)
