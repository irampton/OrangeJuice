const ws281x = require( '@simontaga/rpi-ws281x-native' );

module.exports = function ( arr ) {
    //check that the right channels are used
    //https://github.com/jgarff/rpi_ws281x?tab=readme-ov-file#gpio-usage
    if ( arr.length === 1 ) {
        if ( ![ 12, 18, 40, 52, 21, 31, 10, 38 ].includes( arr[0].pin ) ) {
            throw "invalid GPIO pin";
        }
    } else if ( arr.length === 2 ) {
        if ( ![ 12, 18, 40, 52 ].includes( arr[0].pin ) ) {
            throw "invalid GPIO pin #1";
        }
        if ( ![ 13, 19, 41, 45, 53 ].includes( arr[1].pin ) ) {
            throw "invalid GPIO pin #2";
        }
    } else{
        throw "Failed to initialize GPIO LED control. Please use only 1 or 2 pins";
    }

    let channels = ws281x.init( {
        dma: 10,
        freq: 800000,
        channels: arr.map( ( { numPixels, pin } ) => {
            return { count: numPixels, gpio: pin, invert: false, brightness: 255, stripType: ws281x.stripType.WS2812 };
        } )
    } )

    return arr.map( ( v, i ) => {
        return {
            updateLEDs: function ( arr ) {
                for ( let j = 0; j < arr.length; j++ ) {
                    channels[i].array[j] = parseInt( arr[j], 16 );
                }
                ws281x.render();
            }
        }
    } );
}