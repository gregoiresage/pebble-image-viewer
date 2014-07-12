// Scaline & ScaleRect algorithms from : http://www.compuphase.com/graphic/scale.htm 

function ScaleLine(Target, Source, SrcWidth, TgtWidth, offset_target, offset_source)
{
  var NumPixels = TgtWidth;
  var IntPart = Math.floor(SrcWidth / TgtWidth);
  var FractPart = SrcWidth % TgtWidth;
  var E = 0;

  var i_target = offset_target;
  var i_source = offset_source;

  while (NumPixels-- > 0) {
    Target[i_target++] = Source[i_source];
    i_source += IntPart;
    E += FractPart;
    if (E >= TgtWidth) {
      E -= TgtWidth;
      i_source++;
    } /* if */
  } /* while */
}

function ScaleRect(Target, Source, SrcWidth, SrcHeight, TgtWidth, TgtHeight)
{
  var NumPixels = TgtHeight;
  var IntPart = Math.floor(SrcHeight / TgtHeight) * SrcWidth;
  var FractPart = SrcHeight % TgtHeight;
  var E = 0;

  var i_target = 0;
  var i_source = 0;

  while (NumPixels-- > 0) {
    ScaleLine(Target, Source, SrcWidth, TgtWidth, i_target, i_source);
    PrevSource = Source;

    i_target += TgtWidth;
    i_source += IntPart;
    E += FractPart;
    if (E >= TgtHeight) {
      E -= TgtHeight;
      i_source += SrcWidth;
    } /* if */
  } /* while */
}

function greyScale(rgba_input, w, h, nb_components){
   var result = [];  // Array of bytes that we produce
   for(var y = 0; y < h; y++){
      for(var x = 0; x < w; x++){
         var i = (y * nb_components) * w + x * nb_components;
         result[y * w + x] = Math.floor(0.299*rgba_input[i] + 0.587*rgba_input[i + 1] + 0.114*rgba_input[i + 2]);        
      }
   }  
   return result;
}

