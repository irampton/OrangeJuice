const colorLibrary = require("../color-library");

module.exports = {
    'id': "brightness-fill",
    'name': "Brightness Fill",
    'options': [
        {'id': "color", 'name': "Fill Color", 'type': "color", 'default': "000000"},
        {'id': "brightness", 'name': "Brightness", 'type': "number", 'default': 100}
    ],
    'generate': (numLEDs, options) => {
        let arr = [];
        for (let i = 0; i < numLEDs; i++) {
            arr.push(colorLibrary.rgbToHex(colorLibrary.brightness(colorLibrary.hexToRgb(options.color),options.brightness / 100)));
        }
        return arr;
    }
};