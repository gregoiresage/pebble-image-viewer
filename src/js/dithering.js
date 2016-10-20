// Credits : Ivan Kuckir : http://blog.ivank.net/floyd-steinberg-dithering-in-javascript.html

var floydSteinberg = function(sb, w, h, nearestcolor) 
{
   var numcomponents = sb.length / (w * h);
   for(var y=0; y<h; y++)
      for(var x=0; x<w; x++)
      {
         var ci = numcomponents*(y*w+x);               // current buffer index
         for(var comp=0; comp<numcomponents; comp++){
            var cc = sb[ci+comp];         // current color
            var rc = nearestcolor(cc);    // real (rounded) color
            sb[ci+comp] = rc;                  // saving real color
            var err = cc-rc;              // error amount
            if(x+1<w)   sb[ci+comp+1] += (err*7)>>4;  // if right neighbour exists
            if(y+1==h)  continue;   // if we are in the last line
            if(x  >0)   sb[ci+comp+numcomponents*w-1] += (err*3)>>4;  // bottom left neighbour
                        sb[ci+comp+numcomponents*w  ] += (err*5)>>4;  // bottom neighbour
            if(x+1<w)   sb[ci+comp+numcomponents*w+1] += (err*1)>>4;  // bottom right neighbour
         }
      }
}

var pebble_nearest_color_to_pebble_palette = function(component)
{
   return Math.floor((component + 42) / 85) * 85;
}

var pebble_nearest_color_to_black_white = function(component)
{
   return (component<128?0:255);
}


module.exports = {
  floydSteinberg: floydSteinberg,
  pebble_nearest_color_to_pebble_palette: pebble_nearest_color_to_pebble_palette,
  pebble_nearest_color_to_black_white: pebble_nearest_color_to_black_white
}
