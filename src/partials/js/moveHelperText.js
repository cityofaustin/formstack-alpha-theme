// Moves helper text from below its field to above its field
var helperTexts = jQuery(".fsSupporting");
for (i=0; i < helperTexts.length; i++) {
  var helperText = jQuery(helperTexts[i]);
  var parent = helperText.parent();
  helperText.detach();
  var label = parent.children('.fsLabel');
  if (label.length) {
    // If the field's label is in the helperText's parent
    // then insert the helperText after the label
    helperText.insertAfter(label);
  } else {
    // If the field's label is not in the helperText's parent
    // (for ex: in <fieldset/> structures)
    // then insert the helper text at the top of the parent element
    helperText.prependTo(parent);
  }
}
