const { Color } = require( '@orangejedi/yacml' );

module.exports = {
    'id': "gradient",
    'name': "Gradient",
    'options': [
        { id: "colors", name: "Colors", type: "colorArray", default: [ "000000", "ffffff" ] },
        { id: "continues", name: "Treat identical, sequential colors as one unit", type: "checkbox", default: true }
    ],
    'generate': ( numLEDs, { colors, continues } ) => {
        let avgLength = Math.floor( numLEDs / ( colors.length - 1 ) )
        let seqLengths = [];
        for ( let i = 0; i < colors.length - 1; i++ ) {
            let len = avgLength;
            if ( continues ) {
                while ( colors[i] === colors[i + 1] ) {
                    len += avgLength;
                    i++;
                }
            }
            seqLengths.push( len );
        }
        seqLengths[seqLengths.length - 1] += numLEDs % ( colors.length - 1 );

        let colorArray = colors.map( c => new Color( c, 'hex' ) );

        let arr = [];
        let offset = 0;
        for ( let i = 0; i < seqLengths.length; i++ ) {
            let newOffset = Math.floor( seqLengths[i] / avgLength ) - 1;
            ;
            for ( let j = 0; j < seqLengths[i]; j++ ) {
                arr.push( colorArray[i + offset].lerp( colorArray[i + 1 + newOffset + offset], j / ( seqLengths[i] - ( seqLengths.length - 1 === i ? 1 : 0 ) ) ).getHex( false ) );
            }
            offset += newOffset;
        }
        return arr;
    }
};