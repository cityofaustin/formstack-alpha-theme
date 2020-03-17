// "lang" attribute seems like the most reliable way to find out what language a form is using.
// Fallback to "en" just in case
var locale = jQuery(".fsRowBody").attr("lang")

// No programatic way to check for locale on "Save and Resume" Page.
// For now, we have to use jQuery to check for text.
if (!locale) {
  var saveAndResumePageTitle = jQuery(".module-main__dialog-top-left")
  if (
    saveAndResumePageTitle &&
    saveAndResumePageTitle.text() === "Guardar y reanudar más tarde"
  ) {
    locale = "es"
  } else {
    // Fallback to "en", just in case
    locale = "en"
  }
}

var translations = [
  {
    // Set "(Required)" text
    "query": ".fsRequiredMarker",
    "en": "(Required)",
    "es": "(Obligatoria)",
  },
  {
    // Fix capitalization on "Save and Resume" Button
    "query": "div.fsSaveIncomplete>a",
    "en": "Save and resume later",
    "es": null,
  },
  {
    // Set "Save and resume later" text on modal, with correct capitalization
    "query": ".fs-ngdialog-content>.fs-form-dialog__title",
    "en": "Save and resume later",
    "es": null, // Spanish capitalization is already correct, doesn't need to be modified
  },
  {
    // Set title on "Save and Resume" Page with correct capitalization
    "query": ".module-main__dialog-top-left",
    "en": "Save and resume later",
    "es": null, // Spanish capitalization is already correct, doesn't need to be modified
  },
  {
    // Text for custom element added by formatSaveAndResumePage.js
    "query": ".coa-save-and-resume-label",
    "en": "Want us to email you this link?",
    "es": "¿Desea que le enviaremos por correo electrónico este enlace?",
  },
  {
    // Text for custom element added by formatSaveAndResumePage.js
    "query": ".coa-save-and-resume-helper-text",
    "en": "Enter your email below and click 'Send save and resume link'.",
    "es": "Ingrese su correo electrónico a continuación y haga clic en 'Enviar guardar y reanudar enlace'.",
  },
  {
    // Error Message for "Save and Resume" Page email input
    "query": ".coa-save-and-resume-error-message",
    "en": "Please enter an email address.",
    "es": "Por favor introduzca una dirección de correo eléctronico.",
  }
]

translations.forEach((translation) => {
  var content = translation[locale];
  if (content) {
    jQuery(translation["query"]).text(content)
  }
})
