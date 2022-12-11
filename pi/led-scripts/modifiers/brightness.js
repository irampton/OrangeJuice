const colorLibrary = require("../color-library");
const {brightness} = require("../color-library");

module.exports = {
    'id': "brightness",
    'name': "Brightness",
    'animate': false,
    'options': [
        {'id': "level", 'name': "Brightness Level", 'type': "number", 'default': 100, "min": 0, "max": 100}
    ],
    'modify': (arr, options) => {
        let tempArr = [...arr];
        for (let i = 0; i < tempArr.length; i++) {
            tempArr[i] = colorLibrary.rgbToHex(brightness(colorLibrary.hexToRgb(tempArr[i]),options.level / 100))
        }
        return tempArr;
    }
};

function toHex(number){
    let hex = number.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
}