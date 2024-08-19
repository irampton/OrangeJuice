const { Color } = require( '@orangejedi/yacml' );

module.exports = {
    id: "saturation-shift",
    name: "Saturation",
    options: [
        { id: "sat", name: "Saturation Amount", type: "number", default: 100, min: 0, max: 200 }
    ],
    modify: ( arr, { sat } ) => {
        const amount = Number( sat ) / 100;
        return arr.map( v => {
            let newColor = new Color( v, 'hex' ).getHSL();
            newColor[1] *= amount;
            if ( newColor[1] < 0 ) {
                newColor[1] = 0;
            }
            if ( newColor[1] > 100 ) {
                newColor[1] = 100;
            }
            return new Color( newColor, 'hsl' ).getHex( false );
        } );
    }
};