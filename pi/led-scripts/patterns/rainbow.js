const colorLibrary = require( "../color-library" );

module.exports = {
    'id': "rainbow",
    'name': "Rainbow",
    'options': [
        { 'id': "multiplier", 'name': "Multiply Length", 'type': "number", 'default': 1 }
    ],
    'generate': ( numLEDs, options ) => {
        let arr = [];
        let length = numLEDs * options.multiplier;
        for ( let i = 0; i < length; i++ ) {
            arr.push( colorLibrary.hue( i / length * 360 ) );
        }
        while ( arr.length < numLEDs ) {
            arr.push( ...arr );
        }
        return arr;
    }
};