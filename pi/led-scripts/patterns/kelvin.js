const { Color } = require( '@orangejedi/yacml' );

module.exports = {
    'id': "kelvin",
    'name': "Color Temperature",
    'options': [
        { 'id': "kelvin", 'name': "Temperature (k)", 'type': "number", "default": 6500, "min": 1000, "max": 40000 }
    ],
    'generate': ( numLEDs, options ) => {
        let color = new Color( options.kelvin, 'kelvin' ).getHex( false );
        let arr = [];
        for ( let i = 0; i < numLEDs; i++ ) {
            arr.push( color );
        }
        return arr;
    }
};