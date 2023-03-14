const { hslToHex, hslToRgb, rgbToHex, brightness} = require("../color-library");

module.exports = {
    'id': "hsl-fill",
    'name': "HSL Fill",
    'options': [
        {'id': "hue", 'name': "Hue", 'type': "number", 'default': 0},
        {'id': "saturation", 'name': "Saturation", 'type': "number", 'default': 0},
        {'id': "lightness", 'name': "Lightness", 'type': "number", 'default': 50},
        {'id': "brightness", 'name': "Brightness", 'type': "number", 'default': 100}
    ],
    'generate': (numLEDs, options) => {
        let color = rgbToHex(brightness(hslToRgb([options.hue,options.saturation,options.lightness]),options.brightness / 100));
        let arr = [];
        for (let i = 0; i < numLEDs; i++) {
            arr.push(color);
        }
        return arr;
    }
};