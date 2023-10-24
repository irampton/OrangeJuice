const {Color} = require('@orangejedi/yacml');

module.exports = {
    'id': "brightness-kelvin",
    'name': "Color Temperature & Brightness",
    'options': [
        {'id': "kelvin", 'name': "Temperature (k)", 'type': "number", "default": 6500, "min": 1000, "max": 40000},
        {'id': "brightness", 'name': "Brightness", 'type': "number", 'default': 100}
    ],
    'generate': (numLEDs, options) => {
        let color = new Color(options.kelvin, 'kelvin').brightness(options.brightness).getHex(false);
        let arr = [];
        for (let i = 0; i < numLEDs; i++) {
            arr.push(color);
        }
        return arr;
    }
};