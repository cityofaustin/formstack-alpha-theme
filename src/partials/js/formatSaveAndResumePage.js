$ = jQuery;

function formatSaveAndResumePage() {
  // Remove "Your Email Address" placeholder text
  $('.fs-form-input.fs-form-dialog__password').removeAttr('placeholder');

  // Move "Without the link..." message after the link
  var withoutTheLinkMessage = $($('.fs-thin-indicators.fs-thin-indicators--style_error')[0]);
  var withoutTheLinkMessageParent = $(withoutTheLinkMessage.parent());
  withoutTheLinkMessage.detach().appendTo(withoutTheLinkMessageParent);
}
formatSaveAndResumePage();
