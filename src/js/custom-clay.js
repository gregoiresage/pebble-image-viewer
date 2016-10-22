// custom-function.js
module.exports = function(minified) {
 
  var clayConfig = this;
 
  function urlChanged() {
    minified.$('#myimage')[0].src  = this.get();
  }

  clayConfig.on(clayConfig.EVENTS.AFTER_BUILD, function() {
    var url = clayConfig.getItemByMessageKey('url');
    urlChanged.call(url);
    url.on('change', urlChanged);
  }); 
 
}