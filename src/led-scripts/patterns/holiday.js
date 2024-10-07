const { Color } = require( "@orangejedi/yacml" );
module.exports = {
    id: "holiday",
    name: "Holiday",
    options: [
        {
            id: "holidayName", name: "Holiday", type: "select", default: "", options: [
                { value: "valentine", name: "Valentine's Day" },
                { value: "independence", name: "4th of July" },
                { value: "halloween", name: "Halloween" },
                { value: "christmas", name: "Christmas" }
            ]
        },
        { id: "brightness", name: "Brightness", type: "number", default: 100 },
    ],
    generate: ( numLEDs, { holidayName, brightness } ) => {
        let arr = [];
        switch ( holidayName ) {
            case "valentine":
                for ( let i = 0; i < Math.ceil( numLEDs / 2 ); i++ ) {
                    arr.push( "E05394" );
                    arr.push( "ffffff" );
                }
                break;
            case "independence":
                for ( let i = 0; i < Math.ceil( numLEDs / 2 ); i++ ) {
                    arr.push( "ff0000" );
                    arr.push( "ffffff" );
                    arr.push( "0000ff" );
                }
                break;
            case "halloween":
                for ( let i = 0; i < Math.ceil( numLEDs / 2 ); i++ ) {
                    arr.push( "8a39e1" );
                    arr.push( "fc7c38" );
                }
                break;
            case "christmas":
                for ( let i = 0; i < Math.ceil( numLEDs / 3 ); i++ ) {
                    arr.push( "ff0000" );
                    arr.push( "ffffff" );
                    arr.push( "00ff00" );
                }
                break;
        }

        return arr.map( c => new Color( c, 'hex' ).brightness( brightness ).getHex( false ) );
    }
};