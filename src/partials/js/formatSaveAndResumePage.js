$ = jQuery;

function formatSaveAndResumePage() {
  // Remove "Your Email Address" placeholder text
  $('.fs-form-input.fs-form-dialog__password').removeAttr('placeholder');

  // Move "Without the link..." message after the link
  var withoutTheLinkMessage = $($('.fs-thin-indicators.fs-thin-indicators--style_error')[0]);
  var withoutTheLinkMessageParent = $(withoutTheLinkMessage.parent());
  withoutTheLinkMessage.detach().appendTo(withoutTheLinkMessageParent);

  // Make a better email input label
  var oldEmailLabel = $('.fs-form-label.fs-form-dialog__password-label');
  oldEmailLabel.remove();
  var emailInput = $('.fs-form-input.fs-form-dialog__password');
  var emailInputId = "save-and-resume-email-input";
  emailInput
    .attr('id', emailInputId)
    .attr('aria-required', "true")
  var newEmailLabel = $( "<label/>", {
    "class": "coa-save-and-resume-label",
    "for": emailInputId,
    "text": "Want us to email you this link?",
  })
  var newEmailHelperText = $( "<div/>", {
    "class": "coa-save-and-resume-helper-text",
    "text": "Enter your email below and click 'Send save and resume link'.",
  })
  newEmailLabel.insertBefore(emailInput);
  newEmailHelperText.insertBefore(emailInput);

  // Add Error message to before email Input field
  var errorMessageContainer = $('.fs-thick-indicators.fs-thick-indicators--style_error')
  errorMessageContainer.detach().insertBefore(emailInput);

  // Remove Formstack content and svg from errorMessageContainer
  errorMessageContainer.empty()
  errorMessageContainer.text("Please enter an email address.")
}
formatSaveAndResumePage();
