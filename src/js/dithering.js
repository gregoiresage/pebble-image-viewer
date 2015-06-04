// Credits : Ivan Kuckir : http://blog.ivank.net/floyd-steinberg-dithering-in-javascript.html

// byte shift by 4 (x = x>>4;) corresponds to integer division by 16

/*
   function converts values from grayscale (0-255) to black and white (0 or 255)
*/
function floydSteinbergBW(sb, w, h)   // source buffer, width, height
{
   for(var y=0; y<h; y++)
      for(var x=0; x<w; x++)
      {
         var ci = y*w+x;               // current buffer index
         var cc = sb[ci];              // current color
         var rc = (cc<128?0:255);      // real (rounded) color
         sb[ci] = rc;                  // saving real color
         var err = cc-rc;              // error amount
         if(x+1<w)   sb[ci  +1] += (err*7)>>4;  // if right neighbour exists
         if(y+1==h)  continue;   // if we are in the last line
         if(x  >0)   sb[ci+w-1] += (err*3)>>4;  // bottom left neighbour
                     sb[ci+w  ] += (err*5)>>4;  // bottom neighbour
         if(x+1<w)   sb[ci+w+1] += (err*1)>>4;  // bottom right neighbour
      }
}

