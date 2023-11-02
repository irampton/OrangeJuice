const { Color } = require( '@orangejedi/yacml' );

module.exports = {
    'id': "rainbow_advanced",
    'name': "Rainbow (Advanced)",
    'options': [
        { 'id': "multiplier", 'name': "Multiply Length", 'type': "number", 'default': 1 },
        { 'id': "useNumLEDs", 'name': "Don't Use Strip Length", 'type': "checkbox", 'default': false },
        {
            id: "handleExtra", name: "Handle Extra Space", type: "select", default: "repeat", options: [
                { value: "repeat", name: "Repeat rainbow" },
                { value: "blank", name: "Fill with blanks" },
                { value: "none", name: "Leave as it" }
            ]
        },
        { 'id': "color1", 'name': "Starting Color", 'type': "color", 'default': "#ff0000" },
        { 'id': "color2", 'name': "Ending Color", 'type': "color", 'default': "#ff0000" },
        { 'id': "reverseDirection", 'name': "Reverse Direction", 'type': "checkbox", 'default': false },
        { 'id': "doubleBack", 'name': "Double Back", 'type': "checkbox", 'default': false },
    ],
    'generate': ( numLEDs, options ) => {
        let arr = [];
        let startColor = new Color( options.reverseDirection ? options.color2 : options.color1, 'hex' );
        let endColor = new Color( options.reverseDirection ? options.color1 : options.color2, 'hex' );
        let hueDifference = startColor.getHSL()[0] < endColor.getHSL()[0] ? endColor.getHSL()[0] - startColor.getHSL()[0] : endColor.getHSL()[0] + 360 - startColor.getHSL()[0];
        let length = Math.floor( ( !options.useNumLEDs ? numLEDs : 1 ) * options.multiplier / ( options.doubleBack ? 2 : 1 ) );
        for ( let i = 0; i < length; i++ ) {
            arr.push( new Color( [
                Math.abs( i / ( length - ( hueDifference === 360 ? 0 : 1 ) ) * hueDifference + startColor.getHSL()[0] % 360 ),
                ( endColor.getHSL()[1] - startColor.getHSL()[1] ) * ( i / ( length - 1 ) ) + startColor.getHSL()[1],
                ( endColor.getHSL()[2] - startColor.getHSL()[2] ) * ( i / ( length - 1 ) ) + startColor.getHSL()[2]
            ], 'hsl' ).getHex( false ) );
        }
        if ( options.reverseDirection ) {
            arr.reverse();
        }
        if ( options.doubleBack ) {
            let tempArr = [ ...arr ];
            arr.push( ...tempArr.reverse() );
        }
        if ( options.handleExtra === "blank" ) {
            for ( let i = length; i < numLEDs; i++ ) {
                arr.push( "000000" );
            }
        }
        while ( arr.length < numLEDs && options.handleExtra === "repeat") {
            arr.push( ...arr );
        }
        return arr;
    }
};