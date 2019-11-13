console.log("~~~~The footer code is getting RUNNNnnnnNNdN")



function addJQuery(cb){
  console.log("~~~ adding jQuery")
  var currentElement = document.currentScript;
  var scriptNode = document.createElement('script');
  scriptNode.setAttribute('src', 'https://code.jquery.com/jquery-3.4.1.min.js');
  scriptNode.setAttribute('integrity', 'sha256-CSXorXvZcTkaix6Yvo6HppcZGetbYMGWSFlBw8HfCJo=');
  scriptNode.setAttribute('crossorigin', 'anonymous');
  scriptNode.setAttribute('async', 'false');
  scriptNode.onload = function() {
    cb
  };
  currentElement.parentNode.insertBefore(scriptNode, currentElement.nextSibling);
  currentElement.parentNode.insertBefore(newish, currentElement.nextSibling);
}

// The js inside the footer requires jQuery.
// jquery is normally loaded by the form body.
// But it isn't loaded by the confirmation page's body, which is when we would need to run addJQuery().
window.jQuery || addJQuery();


// var currentElement = document.currentScript;
// var newish = document.createElement('<script type="text/javascript">console.log("~~~~~~ this is here!")</script>');
// currentElement.parentNode.insertBefore(newish, currentElement.nextSibling);
