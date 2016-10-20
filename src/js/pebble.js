function pushUInt16(array, value){
   array.push(value >> 0 & 0xFF);
   array.push(value >> 8 & 0xFF);
}

function pushUInt32(array, value){
   array.push(value >> 0 & 0xFF);
   array.push(value >> 8 & 0xFF);
   array.push(value >> 16 & 0xFF);
   array.push(value >> 24 & 0xFF);
}

/**
 * Credits : Damian Mehers : http://blog.evernote.com/tech/2014/04/23/evernote-pebble-update/#bitmaps
 */

function toPBI(bw_input, width, height){
   // Calculate the number of bytes per row, one bit per pixel, padded to 4 bytes
   var rowSizePaddedWords = Math.floor((width + 31) / 32);
   var widthBytes = rowSizePaddedWords * 4;

   var flags = 1 << 12;             // The version number is at bit 12.  Version is 1
   var result = [];                 // Array of bytes that we produce
   pushUInt16(result, widthBytes);  // row_size_bytes
   pushUInt16(result, flags);       // info_flags
   pushUInt16(result, 0);           // bounds.origin.x
   pushUInt16(result, 0);           // bounds.origin.y
   pushUInt16(result, width);       // bounds.size.w
   pushUInt16(result, height);      // bounds.size.h

   var currentInt = 0;
   for(var y = 0; y < height; y++){
      var bit = 0;
      currentInt = 0;
      for(var x = 0; x < width; x++){
         var color = bw_input[y * width + x];
         if (color == 255) { // black pixel
            currentInt |= (1 << bit);
         }
         bit += 1;
         if (bit == 32) {
            bit = 0;
            pushUInt32(result, currentInt);
            currentInt = 0;
         }
      }
      if (bit > 0) {
        pushUInt32(result, currentInt);
      }
   }

   return result;
}


module.exports = {
  toPBI: toPBI
}
