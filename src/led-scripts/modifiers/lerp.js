const { Color } = require( '@orangejedi/yacml' );

module.exports = {
    id: "lerp-shift",
    name: "Lerp",
    options: [
        { id: "color", name: "Lerp to", type: "color", default: "ff0000" },
        { id: "amount", name: "Percent Lerped", type: "number", default: 10, min: 0, max: 100 }
    ],
    modify: ( arr, { color, amount } ) => {
        const lerpColor = new Color(color, 'hex');
        return arr.map( v => new Color( v, 'hex' ).lerp(lerpColor, Number( amount ) / 100 ).getHex( false ) );
    }
};