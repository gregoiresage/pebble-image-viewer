var options = JSON.parse(localStorage.getItem('options'));
if (options === null) 
  options = { "url" : "http://lorempixel.com/144/168/"};

var CHUNK_SIZE = 1500;
var DOWNLOAD_TIMEOUT = 20000;

function sendBitmap(bitmap){
  var i = 0;
  var nextSize = bitmap.length-i > CHUNK_SIZE ? CHUNK_SIZE : bitmap.length-i;
  var sliced = bitmap.slice(i, i + nextSize);

  MessageQueue.sendAppMessage({"size": bitmap.length});

  var success = function(){
    if(i>=bitmap.length)
      return;
    i += nextSize;
    console.log(i + "/" + bitmap.length);
    nextSize = bitmap.length-i > CHUNK_SIZE ? CHUNK_SIZE : bitmap.length-i;
    sliced = bitmap.slice(i, i + nextSize);
    MessageQueue.sendAppMessage(
      {
      "index":i,
      "chunk":sliced
      },
      success,
      null
      );
  };

  MessageQueue.sendAppMessage(
      {
      "index":i,
      "chunk":sliced
      },
      success,
      null
      );
}

function convertImage(rgbaPixels, numComponents, width, height){

  var watch_info;
  if(Pebble.getActiveWatchInfo) {
    watch_info = Pebble.getActiveWatchInfo() || { 'platform' : 'aplite'};
  } else {
    watch_info = { 'platform' : 'aplite'};
  }

  var ratio = Math.min(144 / width,168 / height);
  var ratio = Math.min(ratio,1);

  var final_width = Math.floor(width * ratio);
  var final_height = Math.floor(height * ratio);
  var final_pixels = [];
  var bitmap = [];

  if(watch_info.platform === 'aplite') {
    var grey_pixels = greyScale(rgbaPixels, width, height, numComponents);
    ScaleRect(final_pixels, grey_pixels, width, height, final_width, final_height, 1);
    floydSteinbergBW(final_pixels, final_width, final_height);
    bitmap = toPBI(final_pixels, final_width, final_height);
  }
  else {
    ScaleRect(final_pixels, rgbaPixels, width, height, final_width, final_height, numComponents);
    var png = generatePngForPebble(final_width, final_height, final_pixels);
    for(var i=0; i<png.length; i++){
      bitmap.push(png.charCodeAt(i));
    }
  }

  return bitmap;
}

function getPbiImage(url){
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  xhr.responseType = "arraybuffer";
  xhr.onload = function() {
    if(xhr.status == 200 && xhr.response) {
      clearTimeout(xhrTimeout); // got response, no more need in timeout
      var data = new Uint8Array(xhr.response);
      var bitmap = [];
      for(var i=0; i<data.byteLength; i++) {
        bitmap.push(data[i]);
      }
      sendBitmap(bitmap);
    }
  };

  var xhrTimeout = setTimeout(function() {
    MessageQueue.sendAppMessage({"message":"Error : Timeout"}, null, null);
  }, DOWNLOAD_TIMEOUT);

  xhr.send(null);
}

function getGifImage(url){
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  xhr.responseType = "arraybuffer";
  xhr.onload = function() {
    clearTimeout(xhrTimeout); // got response, no more need in timeout

    MessageQueue.sendAppMessage({"message":"Decoding image..."}, null, null);

    var data = new Uint8Array(xhr.response || xhr.mozResponseArrayBuffer);
    var gr = new GifReader(data);
    console.log("Gif size : "+ gr.width  +" " + gr.height);

    var pixels = [];
    gr.decodeAndBlitFrameRGBA(0, pixels);

    var bitmap = convertImage(pixels, 4, gr.width, gr.height);

    sendBitmap(bitmap);
  };

  var xhrTimeout = setTimeout(function() {
    MessageQueue.sendAppMessage({"message":"Error : Timeout"}, null, null);
  }, DOWNLOAD_TIMEOUT);

  xhr.send(null);
}

function getJpegImage(url){
  var j = new JpegImage();
  j.onload = function() {
    clearTimeout(xhrTimeout); // got response, no more need in timeout

    MessageQueue.sendAppMessage({"message":"Decoding image..."}, null, null);

    console.log("Jpeg size : " + j.width + "x" + j.height);

    var pixels = j.getData(j.width, j.height);

    var bitmap = convertImage(pixels, 3, j.width, j.height);

    sendBitmap(bitmap);    
  };

  var xhrTimeout = setTimeout(function() {
    MessageQueue.sendAppMessage({"message":"Error : Timeout"}, null, null);
  }, DOWNLOAD_TIMEOUT);

  try{
    j.load(url);
  }catch(e){
    console.log("Error : " + e);
  }
}

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function getImage(url){
  console.log("Image URL : "+ url);
  MessageQueue.sendAppMessage({"message":"Downloading image..."}, null, null);

  if(endsWith(url, ".pbi")){
    getPbiImage(url);
  }
  else if(endsWith(url, ".gif") || endsWith(url, ".GIF")){
    getGifImage(url);
  }
  else if(endsWith(url, ".jpg") || endsWith(url, ".jpeg") || endsWith(url, ".JPG") || endsWith(url, ".JPEG")){
    getJpegImage(url);
  }
  else {
    getJpegImage(url);
  }
}

Pebble.addEventListener("ready", function(e) {
  // console.log("Ready to go!");  
});

Pebble.addEventListener("appmessage", function(e) {
  getImage(options.url);
});

Pebble.addEventListener('showConfiguration', function(e) {
  var uri = 'http://petitpepito.free.fr/config/imageviewer_config.html';
  Pebble.openURL(uri);
});

Pebble.addEventListener('webviewclosed', function(e) {
  if (e.response) {
    options = JSON.parse(decodeURIComponent(e.response));
    localStorage.setItem('options', JSON.stringify(options));
    getImage(options.url);
  } 
});

