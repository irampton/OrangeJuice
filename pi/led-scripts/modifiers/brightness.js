const { Color } = require( '@orangejedi/yacml' );

module.exports = {
    'id': "brightness",
    'name': "Brightness",
    'animate': false,
    'options': [
        { 'id': "level", 'name': "Brightness Level", 'type': "number", 'default': 100, "min": 0, "max": 100 }
    ],
    'modify': ( arr, options ) => {
        let tempArr = [...arr];
        for ( let i = 0; i < tempArr.length; i++ ) {
            tempArr[i] = new Color( tempArr[i], 'hex' ).brightness( options.level ).getHex( false );
        }
        return tempArr;
    }
};

function toHex( number ) {
    let hex = number.toString( 16 );
    return hex.length === 1 ? "0" + hex : hex;
}