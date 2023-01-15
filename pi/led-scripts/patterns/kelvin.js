const {rgbToHex, kelvinToRgb} = require("../color-library");

module.exports = {
    'id': "kelvin",
    'name': "Color Temperature",
    'options': [
        {'id': "kelvin", 'name': "Temperature (k)", 'type': "number", "default": 6500, "min": 1000, "max": 40000}
    ],
    'generate': (numLEDs, options) => {
        let color = rgbToHex(kelvinToRgb(options.kelvin));
        let arr = [];
        for (let i = 0; i < numLEDs; i++) {
            arr.push(color);
        }
        return arr;
    }
};