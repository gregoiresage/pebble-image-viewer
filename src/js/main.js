var options = JSON.parse(localStorage.getItem('options'));
if (options === null) 
  options = { "url" : "http://lorempixel.com/144/168/"};

var CHUNK_SIZE = 1500;
var DOWNLOAD_TIMEOUT = 20000;

function getFile(){
  var address = options.url;
  console.log("URL :  " + options.url);

  sendMessage({"message":"Downloading image..."}, null, null);
  var j = new JpegImage();
  j.onload = function() {
    clearTimeout(xhrTimeout); // got response, no more need in timeout

    sendMessage({"message":"Decoding image..."}, null, null);

    console.log("Size " + j.width + "x" + j.height);

    var ratioX = 144 / j.width;
    var ratioY = 168 / j.height;
    var ratio = ratioX < ratioY ? ratioX : ratioY;

    var width = Math.floor(j.width * ratio);
    var height = Math.floor(j.height * ratio);

    var data = j.getData(width, height);

    var grey_scale = greyScale(data, width, height);
    floydSteinberg(grey_scale, width, height);

    var bitmap = toPebbleBitmap(grey_scale, width, height);

    var i = 0;
    var nextSize = bitmap.length-i > CHUNK_SIZE ? CHUNK_SIZE : bitmap.length-i;
    var sliced = bitmap.slice(i, i + nextSize);

    var success = function(){
      if(i>=bitmap.length)
        return;
      i += nextSize;
      console.log(i + "/" + bitmap.length);
      nextSize = bitmap.length-i > CHUNK_SIZE ? CHUNK_SIZE : bitmap.length-i;
      sliced = bitmap.slice(i, i + nextSize);
      sendMessage(
        {
        "index":i,
        "chunk":sliced
        },
        success,
        null
        );
    };

    // var error = function(){
    //   sendMessage(
    //     {
    //     "index":i,
    //     "chunk":sliced
    //     },
    //     success,
    //     error
    //     );
    // }

    sendMessage(
        {
        "index":i,
        "chunk":sliced
        },
        success,
        null
        );
  };

  var xhrTimeout = setTimeout(function() {
    sendMessage({"message":"Error : Timeout"}, null, null);
  }, DOWNLOAD_TIMEOUT);

  j.load(address);
}

Pebble.addEventListener("ready", function(e) {
  // console.log("Ready to go!");  
});

Pebble.addEventListener("appmessage", function(e) {
  getFile();
});

function sendMessage(data, success, failure) {
  Pebble.sendAppMessage(
    data,
    function(e) {
      // console.log("Successfully delivered message with transactionId=" + e.data.transactionId);
      if(success)
        success();
    },
    function(e) {
      console.log("Unable to deliver message with transactionId=" + e.data.transactionId + " Error is: " + e.error.message);
      if(failure)
          failure();
    });
}

Pebble.addEventListener('showConfiguration', function(e) {
  var uri = 'http://petitpepito.free.fr/config/imageviewer_config.html';
  Pebble.openURL(uri);
});

Pebble.addEventListener('webviewclosed', function(e) {
  if (e.response) {
    options = JSON.parse(decodeURIComponent(e.response));
    localStorage.setItem('options', JSON.stringify(options));
    getFile();
  } 
});