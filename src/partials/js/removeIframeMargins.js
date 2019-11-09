// gracias: https://stackoverflow.com/questions/326069/how-to-identify-if-a-webpage-is-being-loaded-inside-an-iframe-or-directly-into-t
function inIframe () {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}

if (inIframe()) {
  console.log("~~~ We are in an iframe")
} else {
  console.log("~~~ We are not in an iframe")
}
