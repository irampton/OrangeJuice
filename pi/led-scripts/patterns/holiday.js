module.exports = {
    id: "holiday",
    name: "Holiday",
    options: [
        {
            id: "holidayName", name: "Holiday", type: "select", default: "christmas", options: [
                { value: "halloween", name: "Halloween" },
                { value: "christmas", name: "Christmas" }
            ]
        },
    ],
    generate: ( numLEDs, { holidayName } ) => {
        let arr = [];
        switch ( holidayName ) {
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
        return arr;
    }
};