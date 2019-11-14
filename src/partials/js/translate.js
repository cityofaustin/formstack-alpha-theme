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

// Handle locale-specific style/content requirements
function translate () {
  // Set "(Required)" text
  $('.fsRequiredMarker').text("(" + getDefinition("required") + ")")
}
translate();
