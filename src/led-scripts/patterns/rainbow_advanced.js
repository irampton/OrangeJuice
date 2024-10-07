const { Color } = require( '@orangejedi/yacml' );

module.exports = {
    id: "rainbow_advanced",
    name: "Rainbow (Advanced)",
    options: [
        { id: "multiplier", name: "Length", type: "number", default: 1 },
        { id: "lengthType", 'name': "Length Type", type: "select", default: "multiply", options: [
                { value: "multiply", name: "Multiply by strip length" },
                { value: "number", name: "Number of LEDs" }
            ]
        },
        {
            id: "handleExtra", name: "Handle Extra Space", type: "select", default: "repeat", options: [
                { value: "repeat", name: "Repeat rainbow" },
                { value: "blank", name: "Fill with blanks" },
                { value: "none", name: "Leave as it" }
            ]
        },
        { id: "color1", name: "Starting Color", type: "color", default: "#ff0000" },
        { id: "color2", name: "Ending Color", type: "color", default: "#ff0000" },
        { id: "reverseDirection", name: "Reverse Direction", type: "checkbox", default: false },
        { id: "doubleBack", name: "Double Back", type: "checkbox", default: false }
    ],
    generate: ( numLEDs, {multiplier, lengthType, handleExtra, color1, color2, reverseDirection, doubleBack } ) => {
        let arr = [];
        let startColor = new Color( reverseDirection ? color2 : color1, 'hex' );
        let endColor = new Color( reverseDirection ? color1 : color2, 'hex' );
        let hueDifference = startColor.getHSL()[0] < endColor.getHSL()[0] ? endColor.getHSL()[0] - startColor.getHSL()[0] : endColor.getHSL()[0] + 360 - startColor.getHSL()[0];
        let length = Math.floor( ( lengthType === "multiply" ? numLEDs : 1 ) * multiplier / ( doubleBack ? 2 : 1 ) );
        for ( let i = 0; i < length; i++ ) {
            arr.push( new Color( [
                Math.abs( i / ( length - ( hueDifference === 360 ? 0 : 1 ) ) * hueDifference + startColor.getHSL()[0] % 360 ),
                ( endColor.getHSL()[1] - startColor.getHSL()[1] ) * ( i / ( length - 1 ) ) + startColor.getHSL()[1],
                ( endColor.getHSL()[2] - startColor.getHSL()[2] ) * ( i / ( length - 1 ) ) + startColor.getHSL()[2]
            ], 'hsl' ).getHex( false ) );
        }
        if ( reverseDirection ) {
            arr.reverse();
        }
        if ( doubleBack ) {
            let tempArr = [ ...arr ];
            arr.push( ...tempArr.reverse() );
        }
        if ( handleExtra === "blank" ) {
            for ( let i = length; i < numLEDs; i++ ) {
                arr.push( "000000" );
            }
        }
        while ( arr.length < numLEDs && handleExtra === "repeat") {
            arr.push( ...arr );
        }
        return arr;
    }
};