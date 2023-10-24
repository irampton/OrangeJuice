const {Color} = require('@orangejedi/yacml');

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
            arr.push(new Color(options.color, 'hex').brightness(options.brightness).getHex(false));
        }
        return arr;
    }
};