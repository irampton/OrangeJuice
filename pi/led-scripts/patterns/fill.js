module.exports = {
    'id': "fill",
    'name': "Fill",
    'options': [
        {'id': "color", 'name': "Fill Color", 'type': "color", 'default': "000000"}
    ],
    'generate': (numLEDs, options) => {
        let arr = [];
        for (let i = 0; i < numLEDs; i++) {
            arr.push(options.color);
        }
        return arr;
    }
};

