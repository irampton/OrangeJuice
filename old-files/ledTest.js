const ws281x = require('rpi-ws281x-native');

const numPixels = 128;

//let x = ws281x.init({count: numPixels, gpio: 18, invert: false, brightness: 255, stripType: "ws2812"});

let channels = ws281x.init({
    dma: 10,
    freq: 800000,
    channels: [
        {count: numPixels, gpio: 18, invert: false, brightness: 100, stripType: 'ws2812'}
    ]
});

let channel = channels[0];

const colorArray = channel.array;


let testArr = [
    '#6d8092', '#6d8092', '#6a8395', '#6a8395', '#6f9089',
    '#6f9089', '#5777a8', '#5777a8', '#5777a8', '#5777a8',
    '#6f9089', '#6f9089', '#6a8395', '#6a8395', '#6d8092',
    '#6d8092', '#92a15e', '#92a15e', '#00000',  '#00000',
    '#00000',  '#00000',  '#748b81', '#748b81', '#748b81',
    '#748b81', '#00000',  '#00000',  '#00000',  '#00000',
    '#92a15e', '#92a15e', '#abb847', '#abb847', '#00000',
    '#00000',  '#00000',  '#00000',  '#99a857', '#99a857',
    '#99a857', '#99a857', '#00000',  '#00000',  '#00000',
    '#00000',  '#abb847', '#abb847', '#9eb54a', '#9eb54a',
    '#9fbb44', '#9fbb44', '#a4ad52', '#a4ad52', '#a7b847',
    '#a7b847', '#a7b847', '#a7b847', '#a4ad52', '#a4ad52',
    '#9fbb44', '#9fbb44', '#9eb54a', '#9eb54a'
]

for (let i = 0; i < channel.count; i++) {
    colorArray[i] = parseInt(testArr[i % 64].slice(1,7),16);
}
ws281x.render();

setTimeout(()=>{ws281x.reset();ws281x.finalize();}, 10000);