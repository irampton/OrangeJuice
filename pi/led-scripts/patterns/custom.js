module.exports = {
    'id': "custom",
    'name': "Custom",
    'options': [
        { 'id': "arr", 'name': "Array", 'type': "text", 'default': "[]" }
    ],
    'generate': ( numLEDs, options ) => {
        return options.arr;
    }
};