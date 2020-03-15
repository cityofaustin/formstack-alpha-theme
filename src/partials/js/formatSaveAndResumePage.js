function formatSaveAndResumePage() {
  // Remove "Your Email Address" placeholder text
  jQuery('.fs-form-input.fs-form-dialog__password').removeAttr('placeholder');

  // Move "Without the link..." message after the link
  var withoutTheLinkMessage = jQuery(jQuery('.fs-thin-indicators.fs-thin-indicators--style_error')[0]);
  var withoutTheLinkMessageParent = jQuery(withoutTheLinkMessage.parent());
  withoutTheLinkMessage.detach().appendTo(withoutTheLinkMessageParent);

  // Make a better email input label
  var oldEmailLabel = jQuery('.fs-form-label.fs-form-dialog__password-label');
  oldEmailLabel.remove();
  // Before we get to the "Save and Resume" Page, the modal (.fs-form-input.fs-form-dialog__password) will contain a hidden email input (with .fs-form-dialog--hidden)
  // We don't want to add new labels to the hidden field on the modal
  var emailInput = jQuery('.fs-form-input.fs-form-dialog__password:not(.fs-form-dialog--hidden)');
  if (emailInput.length) {
    emailInput.attr('aria-required', "true")
    // Text is added by "translate.js"
    var newEmailLabel = jQuery( "<label/>", {
      "class": "coa-save-and-resume-label",
      "for": "email",
    })
    var newEmailHelperText = jQuery( "<div/>", {
      "class": "coa-save-and-resume-helper-text",
    })
    newEmailLabel.insertBefore(emailInput);
    newEmailHelperText.insertBefore(emailInput);
  }

  // Add Error message to before email Input field
  var errorMessageContainer = jQuery('.fs-thick-indicators.fs-thick-indicators--style_error')
  errorMessageContainer.detach().insertBefore(emailInput);

  // Use material icon for error message
  errorMessageContainer.empty()
  errorMessageContainer.append(
    jQuery("<i/>", {
      "class": "material-icons coa-error-icon",
      "text": "error_outline",
    })
  )
  errorMessageContainer.append("<div class='coa-save-and-resume-error-message'></div>")
}
formatSaveAndResumePage();
