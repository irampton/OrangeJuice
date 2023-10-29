const { Color } = require( '@orangejedi/yacml' );

module.exports = {
    'id': "rainbow",
    'name': "Rainbow",
    'options': [
        { 'id': "multiplier", 'name': "Multiply Length", 'type': "number", 'default': 1 },
        { 'id': "useNumLEDs", 'name': "Don't Use Strip Length", 'type': "checkbox", 'default': false }
    ],
    'generate': ( numLEDs, options ) => {
        let arr = [];
        let length = ( !options.useNumLEDs ? numLEDs : 1 ) * options.multiplier;
        for ( let i = 0; i < length; i++ ) {
            arr.push( new Color( i / length * 360 ).getHex( false ) );
        }
        while ( arr.length < numLEDs ) {
            arr.push( ...arr );
        }
        return arr;
    }
};