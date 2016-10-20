////// adapted from https://github.com/wheany/js-png-encoder/blob/master/generatepng.js

// var zlib = require("zlibjs");
var zlib = require("./zlib/deflate.min.js");


var Png4Pebble=(function() {
    'use strict';
    var CRC_TABLE = [],
        SIGNATURE = String.fromCharCode(137, 80, 78, 71, 13, 10, 26, 10),
        NO_FILTER = 0,
        PEBBLE_PALETTE = [],
        constructor = function() {
        },
        make_crc_table = function() {
            var n, c, k;
            for (n = 0; n < 256; n++) {
                c = n;
                for (k = 0; k < 8; k++) {
                    if (c & 1) {
                        c = 0xedb88320 ^ (c >>> 1);
                    } else {
                        c = c >>> 1;
                    }
                }
                CRC_TABLE[n] = c;
            }
        },
        make_pebble_palette = function() {
            for(var i=0; i<64; i++){
                PEBBLE_PALETTE.push(((i >> 4) & 0x3) * 85);
                PEBBLE_PALETTE.push(((i >> 2) & 0x3) * 85);
                PEBBLE_PALETTE.push(((i >> 0) & 0x3) * 85);
            }
        },
        map_color_to_palette = function(palette, red, green, blue) {
            var diffR,diffG,diffB,diffDistance,mappedColor;
            var distance=3*0xFF*0xFF;
            for(var i=0;i<palette.length;i+=3){
                diffR=( palette[i]     - red );
                diffG=( palette[i+1]   - green );
                diffB=( palette[i+2]   - blue );
                diffDistance = diffR*diffR + diffG*diffG + diffB*diffB;
                if( diffDistance < distance  ){ 
                    distance=diffDistance; 
                    mappedColor=i/3; 
                };
            }
            return(mappedColor);
        },
        update_crc = function(crc, buf) {
            var c = crc,
                n, b;
            for (n = 0; n < buf.length; n++) {
                b = buf.charCodeAt(n);
                c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
            }
            return c;
        },
        crc = function crc(buf) {
            return update_crc(0xffffffff, buf) ^ 0xffffffff;
        },
        dwordAsString = function(dword) {
            return String.fromCharCode((dword & 0xFF000000) >>> 24, (dword & 0x00FF0000) >>> 16, (dword & 0x0000FF00) >>> 8, (dword & 0x000000FF));
        },
        createChunk = function(length, type, data) {
            var CRC = crc(type + data);
            return dwordAsString(length) +
                type +
                data +
                dwordAsString(CRC);
        },
        IEND,
        createIHDR = function(width, height, bitdepth) {
            var IHDRdata;
            IHDRdata = dwordAsString(width);
            IHDRdata += dwordAsString(height);
            // bit depth
            IHDRdata += String.fromCharCode(bitdepth);
            // color type: 3=indexed
            IHDRdata += String.fromCharCode(3);
            // compression method: 0=deflate, only allowed value
            IHDRdata += String.fromCharCode(0);
            // filtering: 0=adaptive, only allowed value
            IHDRdata += String.fromCharCode(0);
            // interlacing: 0=none
            IHDRdata += String.fromCharCode(0);
            return createChunk(13, 'IHDR', IHDRdata);
        },
        png = function(width, height, rgb) {
            var IHDR,
                PLTE,
                IDAT,
                scanlines = '',
                y,
                x,
                compressedScanlines = '',
                png_palette = new Object(),
                png_palette_buff = '',
                paletteIdx = 0;

            var getColorIdx = function(red, green, blue) {
                var color = (((red << 8) | green) << 8) | blue;
                if (typeof png_palette[color] == "undefined") {
                    var mappedColorId = map_color_to_palette(PEBBLE_PALETTE, red, green, blue);
                    
                    red     = PEBBLE_PALETTE[3*mappedColorId + 0];
                    green   = PEBBLE_PALETTE[3*mappedColorId + 1];
                    blue    = PEBBLE_PALETTE[3*mappedColorId + 2];

                    var color_to_pebble = (((red << 8) | green) << 8) | blue;
                    if (typeof png_palette[color_to_pebble] == "undefined") {
                        png_palette_buff += String.fromCharCode(red);
                        png_palette_buff += String.fromCharCode(green);
                        png_palette_buff += String.fromCharCode(blue);
                        png_palette[color_to_pebble] = paletteIdx++;
                    }
                    png_palette[color] = png_palette[color_to_pebble];
                    
                }
                return png_palette[color];
            }

            var numcomponents = rgb.length / (height*width);

            // compute the reduced palette
            for (y = 0; y < height*width; y++) {
                getColorIdx(rgb[numcomponents * y] & 0xff, rgb[numcomponents * y + 1] & 0xff, rgb[numcomponents * y + 2] & 0xff);
            }

            var nb_colors = png_palette_buff.length / 3;
            var bitdepth  = 1;
            if(nb_colors > 16){
                bitdepth = 8;
            }
            else if(nb_colors > 4){
                bitdepth = 4;
            }
            else if(nb_colors > 2){
                bitdepth = 2;
            }
                    
            var scanlines_arr = [];
            var curr_byte  = 0;
            var bit_offset = 0;
                
            for (y = 0; y < height; y++) {
                scanlines_arr.push(NO_FILTER);
                bit_offset = 0;
                curr_byte  = 0;
                for (x = 0; x < width; x++) {
                    bit_offset += bitdepth;
                    curr_byte  += getColorIdx(rgb[numcomponents * (y * width + x)] & 0xff, rgb[numcomponents * (y * width + x) + 1] & 0xff, rgb[numcomponents * (y * width + x) + 2] & 0xff) << (8 - bit_offset);
                    if(bit_offset == 8){
                        scanlines_arr.push(curr_byte);
                        curr_byte   = 0;
                        bit_offset  = 0;
                    }
                }
                if(bit_offset > 0){
                    scanlines_arr.push(curr_byte);
                }
            }

            var compressed = new zlib.Deflate(scanlines_arr).compress();
            for (var i = 0; i < compressed.length; i++) {
                compressedScanlines += String.fromCharCode(compressed[i]);
            }

            IHDR = createIHDR(width, height, bitdepth);
            PLTE = createChunk(png_palette_buff.length, 'PLTE', png_palette_buff);
            IDAT = createChunk(compressedScanlines.length, 'IDAT', compressedScanlines);
            return SIGNATURE + IHDR + PLTE + IDAT + IEND;
        };
    make_crc_table();
    make_pebble_palette();
    IEND = createChunk(0, 'IEND', '');
    return {
        png : png
    };
})();

module.exports = Png4Pebble;