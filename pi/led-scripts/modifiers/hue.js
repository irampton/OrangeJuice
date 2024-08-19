const { Color } = require( '@orangejedi/yacml' );

module.exports = {
    id: "hue-shift",
    name: "Hue",
    options: [
        { id: "shift", name: "Hue Shift", type: "number", default: 0, min: 0, max: 360 }
    ],
    modify: ( arr, { shift } ) => {
        return arr.map( v => new Color( v, 'hex' ).shiftHue( Number( shift ) ).getHex( false ) );
    }
};