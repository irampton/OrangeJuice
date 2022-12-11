module.exports = {
    'id': "fill3",
    'name': "Fill 3",
    'options': [
        {'id': "color1", 'name': "Color #1", 'type': "color", 'default': "000000"},
        {'id': "color2", 'name': "Color #2", 'type': "color", 'default': "000000"},
        {'id': "color3", 'name': "Color #3", 'type': "color", 'default': "000000"}
    ],
    'generate': (numLEDs, options) => {
        let arr = [];
        for (let i = 0; i < Math.ceil(numLEDs / 3); i++) {
            arr.push(options.color1);
            arr.push(options.color2);
            arr.push(options.color3);
        }
        return arr;
    }
};