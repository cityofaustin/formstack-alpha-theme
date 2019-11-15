const fs = require('fs');
const path = require('path');
const uglifycss = require('uglifycss');
const Handlebars = require('handlebars');

console.log("Starting build");

function readFile(absolutePath) {
  return fs.readFileSync(absolutePath, 'utf8').toString()
}

// Register all .js, .css, and .html files in /src/partials as Partials to be used in /src/root.hbs
const partialsDir = path.resolve(__dirname, '../src/partials')
for (let dir of fs.readdirSync(partialsDir)) {
  let subDir = path.resolve(partialsDir, dir)
  if (fs.lstatSync(subDir).isDirectory()) {
    for (let file of fs.readdirSync(subDir)) {
      if (file.match(/(\.css|\.js|\.html)$/)) {
        /*
          Ex:
          file = iframeResizer.js
          partialName = iframeResizer
          partialContents = readFile("../src/partials/js/iframeResizer.js")
          Handlebars.registerPartial(partialName, partialContents)
          will register the contents of "../src/partials/js/iframeResizer.js"
          as the Partial "{{> iframeResizer }}"
        */
        const partialName = path.basename(file, path.extname(file));
        let partialContents = readFile(path.resolve(subDir, file));
        if (file.match(/\.css$/)){
          // Compresses css partials
          partialContents = uglifycss.processString(partialContents, {
            "uglyComments": true,
          })
        }
        Handlebars.registerPartial(partialName, partialContents);
      }
    }
  }
}

// Render the template
function renderTemplate(templateName) {
  const templateFile = readFile(path.resolve(__dirname, `../src/${templateName}.hbs`));
  const template = Handlebars.compile(templateFile);
  const data = {
    isProduction: true,
  };
  const generatedHtml = template(data);
  fs.writeFileSync(path.resolve(__dirname, `../theme/${templateName}.html`), generatedHtml);

  console.log(`Alpha theme ${templateName} written to /theme/${templateName}.html`);
}

renderTemplate('header');
renderTemplate('footer');
