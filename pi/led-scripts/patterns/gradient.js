const { Color } = require( '@orangejedi/yacml' );

module.exports = {
    'id': "gradient",
    'name': "Gradient",
    'options': [
        { 'id': "color1", 'name': "Color #1", 'type': "color", 'default': "000000" },
        { 'id': "color2", 'name': "Color #2", 'type': "color", 'default': "000000" }
    ],
    'generate': ( numLEDs, options ) => {
        let arr = [];
        let color1 = new Color( options.color1, 'hex' );
        let color2 = new Color( options.color2, 'hex' );

        for ( let i = 0; i < numLEDs; i++ ) {
            arr.push( color1.lerp( color2, i / (numLEDs - 1) ).getHex( false ) );
        }

        return arr;
    }
};