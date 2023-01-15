const {rgbToHex, kelvinToRgb, brightness} = require("../color-library");

module.exports = {
    'id': "brightness-kelvin",
    'name': "Color Temperature & Brightness",
    'options': [
        {'id': "kelvin", 'name': "Temperature (k)", 'type': "number", "default": 6500, "min": 1000, "max": 40000},
        {'id': "brightness", 'name': "Brightness", 'type': "number", 'default': 100}
    ],
    'generate': (numLEDs, options) => {
        let color = rgbToHex(brightness(kelvinToRgb(options.kelvin),options.brightness / 100));
        let arr = [];
        for (let i = 0; i < numLEDs; i++) {
            arr.push(color);
        }
        return arr;
    }
};