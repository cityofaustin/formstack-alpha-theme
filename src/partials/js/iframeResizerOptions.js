window.iFrameResizer = {
  onMessage: function(message) {
    console.log("~~~ Got a message from parent: ", message)
  },
  onReady: function() {
    debugger;
    console.log("Now we're ready.")
  },
  readyCallback: function() {
    console.log("~~maybe?")
  }
}
