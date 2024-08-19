const ws281x = require( '@simontaga/rpi-ws281x-native' );

module.exports = function ( numPixels ) {
    let channels = ws281x.init( {
        dma: 10,
        freq: 800000,
        channels: [
            { count: numPixels, gpio: 18, invert: false, brightness: 255, stripType: ws281x.stripType.WS2812 }
        ]
    } );
    let ledChannel = channels[0];

    this.updateLEDs = function ( arr ) {
        for ( let i = 0; i < arr.length; i++ ) {
            ledChannel.array[i] = parseInt( arr[i], 16 );
        }
        ws281x.render();
    }
    this.numPixels = numPixels;
}