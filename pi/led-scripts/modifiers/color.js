const { Color } = require( '@orangejedi/yacml' );

module.exports = {
    'id': "color",
    'name': "Color",
    'animate': false,
    'options': [
        { 'id': "red", 'name': "Red Percent", 'type': "number", 'default': 100, "min": 0, "max": 100 },
        { 'id': "green", 'name': "Green Percent", 'type': "number", 'default': 100, "min": 0, "max": 100 },
        { 'id': "blue", 'name': "Blue Percent", 'type': "number", 'default': 100, "min": 0, "max": 100 },
    ],
    'modify': ( arr, options ) => {
        let tempArr = [ ...arr ];
        for ( let i = 0; i < tempArr.length; i++ ) {
            let color = new Color( tempArr[i], 'hex' ).getRGB();
            color[0] = color[0] * options.red / 100;
            color[1] = color[1] * options.green / 100;
            color[2] = color[2] * options.blue / 100;
            tempArr[i] = new Color( color ).getHex( false );
        }
        return tempArr;
    }
};

function toHex( number ) {
    let hex = number.toString( 16 );
    return hex.length === 1 ? "0" + hex : hex;
}