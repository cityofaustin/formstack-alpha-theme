$ = jQuery;

// "lang" attribute seems like the most reliable way to find out what language a form is using.
// Fallback to "en" just in case
var locale = $(".fsRowBody").attr("lang") || "en";

var langDefinitions = {
  "required": {
    "en": "Required",
    "es": "Obligatoria"
  }
}

function getDefinition(val) {
  var definition = langDefinitions[val];
  if (definition) {
    return definition[locale] || definition["en"];
  } else {
    return "";
  }
}

// Adjust height of address fields in Spanish to match height of "Código postal (Zip Code)" label
// But only adjust height of fields that are on the same line as zip code.
// Recalculate on screen size change.
function adjustAddressLabels() {
  if (locale === "es") {
    $('.fsFieldZip').each(function(i){
      var zipField = $(this);
      var zipLabel = zipField.children('label')
      var zipLabelHeight = zipLabel.height();
      if (zipLabelHeight) {
        var zipLabelTop = zipLabel.position().top;
        zipField.siblings().each(function(i){
          var sibling = $(this);
          var siblingLabel = sibling.children('label');
          if (siblingLabel.position().top === zipLabelTop) {
            siblingLabel.height(zipLabelHeight);
          } else {
            siblingLabel.height('auto');
          }
        });
      }
    });
  }
}

// Handle locale-specific style/content requirements
function translate () {
  // Set "(Required)" text
  $('.fsRequiredMarker').text("(" + getDefinition("required") + ")")

  adjustAddressLabels();
}
translate();

// Readjust address labels on resize
// (only works for non-iframed forms)
window.addEventListener('resize', adjustAddressLabels, false);
