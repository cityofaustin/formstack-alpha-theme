$ = jQuery;

// gracias: https://stackoverflow.com/questions/326069/how-to-identify-if-a-webpage-is-being-loaded-inside-an-iframe-or-directly-into-t
function inIframe () {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}

if (inIframe()) {
  // Remove form's margin and padding if we are embedded within an iFrame
  $('.fsBody .fsForm').css({
    margin: "0px",
    padding: "0px",
  })
  $('.fsBody').css({
    padding: "0px",
  })
}