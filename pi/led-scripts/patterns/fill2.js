module.exports = {
    'id': "fill2",
    'name': "Fill 2",
    'options': [
        {'id': "color1", 'name': "Color #1", 'type': "color", 'default': "000000"},
        {'id': "color2", 'name': "Color #2", 'type': "color", 'default': "000000"}
    ],
    'generate': (numLEDs, options) => {
        let arr = [];
        for (let i = 0; i < Math.ceil(numLEDs / 2); i++) {
            arr.push(options.color1);
            arr.push(options.color2);
        }
        return arr;
    }
};