const { Color } = require( '@orangejedi/yacml' );

module.exports = {
    id: "brightness",
    name: "Brightness",
    options: [
        { id: "level", name: "Brightness Level", type: "number", default: 100, min: 0, max: 100 }
    ],
    modify: ( arr, { level } ) => {
        return arr.map( v => new Color( v, 'hex' ).brightness( level ).getHex( false ) );
    }
};