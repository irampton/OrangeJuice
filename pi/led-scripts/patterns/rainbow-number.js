const colorLibrary = require( "../color-library" );

module.exports = {
    'id': "rainbow-num",
    'name': "Rainbow Number",
    'options': [
        { 'id': "num", 'name': "Number in Rainbow", 'type': "number", 'default': 16 }
    ],
    'generate': ( numLEDs, options ) => {
        let arr = [];
        for ( let i = 0; i < options.num; i++ ) {
            arr.push( colorLibrary.hue( i / options.num * 360 ) );
        }
        while ( arr.length < numLEDs ) {
            arr.push( ...arr );
        }
        return arr;
    }
};