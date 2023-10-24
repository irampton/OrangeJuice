const ws281x = require( 'rpi-ws281x-native' );

const numPixels = 400;

//let x = ws281x.init({count: numPixels, gpio: 18, invert: false, brightness: 255, stripType: "ws2812"});

let channels = ws281x.init( {
    dma: 10,
    freq: 800000,
    channels: [
        { count: numPixels, gpio: 18, invert: false, brightness: 255, stripType: 'ws2812' }
    ]
} );

let channel = channels[0];

const colorArray = channel.array;
for ( let i = 0; i < channel.count; i++ ) {
    colorArray[i] = parseInt( "000000", 16 );
}
ws281x.render();

setTimeout( () => {
    ws281x.reset();
    ws281x.finalize();
}, 50 );