var Grabber     = require('pebble-image-grabber');
var grabber     = new Grabber();

var Clay        = require('pebble-clay');
var clayConfig  = require('./config');
var customClay  = require('./custom-clay');
var clay        = new Clay(clayConfig, customClay);

