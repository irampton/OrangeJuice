const { Color } = require( '@orangejedi/yacml' );

module.exports = {
    id: "rainbow",
    name: "Rainbow",
    options: [
        { id: "multiplier", name: "Multiply Length", type: "number", default: 1 }
    ],
    generate: ( numLEDs, { multiplier } ) => {
        let length = Math.floor( numLEDs * multiplier );
        let colors = new Array( length ).map( ( v, index ) => new Color( index / length * 360 ).getHex( false ) );

        let arr = [];
        do {
            arr.push( ...colors );
        } while ( arr.length < numLEDs )
        return arr;
    }
};