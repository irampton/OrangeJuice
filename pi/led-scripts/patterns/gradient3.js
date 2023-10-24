const {Color} = require('@orangejedi/yacml');

module.exports = {
    'id': "gradient3",
    'name': "3 Color Gradient",
    'options': [
        {'id': "color1", 'name': "Color #1", 'type': "color", 'default': "000000"},
        {'id': "color2", 'name': "Color #2", 'type': "color", 'default': "000000"},
        {'id': "color3", 'name': "Color #3", 'type': "color", 'default': "000000"},
        {'id': "distance", 'name': "Distance", 'type': "number", 'default': .5},
        {'id': "duplicate", 'name': "Duplicate Middle", 'type': "checkbox", 'default': false},
        {'id': "hitLast", 'name': "Hit last color", 'type': "checkbox", 'default': false},
    ],
    'generate': (numLEDs, options) => {
        let arr = [];
        let color1 = new Color(options.color1, 'hex');
        let color2 = new Color(options.color2, 'hex');
        let color3 = new Color(options.color3, 'hex');
        let distance = Number(options.distance);

        let firstGap = Math.floor(numLEDs * distance) + (options.hitLast && !options.duplicate ? 1 : 0);
        let secondGap = numLEDs - firstGap;
        for (let i = 0; i < firstGap; i++) {
            arr.push(color1.lerp(color2, i / (firstGap - 1)).getHex(false));
        }
        for (let i = (options.duplicate ? 0 : 1); i <= secondGap + (options.duplicate ? 1 : 0); i++) {
            arr.push(color2.lerp(color3, i / (secondGap - (options.duplicate ? 1 : 0) + (options.hitLast ? 1 : 0))).getHex(false));
        }

        return arr;
    }
};