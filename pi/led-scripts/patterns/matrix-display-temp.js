const {Color} = require('@orangejedi/yacml');

module.exports = {
    'id': "matrix-display-temp",
    'name': "Matrix Display Temp",
    'options': [
        { 'id': "temp", 'name': "Temperature", 'type': "num", 'default': "0" },
        { 'id': "color", 'name': "Fill Color", 'type': "color", 'default': "000000" },
        { 'id': "hideFirstSpace", 'name': "Hide First Space", 'type': "bool", 'default': false },
        { 'id': "leftAlign", 'name': "Left Align Text", 'type': "bool", 'default': false }
    ],
    'hide': true,
    'generate': ( numLEDs, options ) => {
        let matrix = [];
        for ( let i = 0; i < options.temp.toString().length; i++ ) {
            if ( !options.hideFirstSpace || i > 0 ) {
                matrix.push( [0, 0, 0, 0, 0, 0, 0, 0] );
            }
            let digit = options.temp.toString()[i];
            for ( let j = 0; j < numbers[digit].length; j++ ) {
                let arr = [];
                numbers[digit][j].forEach( ( digit ) => {
                    if ( options.color[i] != "" && digit === 1 ) {
                        arr.push( options.color[i] );
                    } else {
                        arr.push( 0 );
                    }
                } );
                matrix.push( arr );
            }

        }
        if ( matrix.length > 32 ) {
            matrix = matrix.slice( 0, 29 );
        }
        if ( matrix.length < 32 && options.leftAlign ) {
            for ( let i = 0; i <= 32 - matrix.length; i++ ) {
                matrix.push( [0, 0, 0, 0, 0, 0, 0, 0] );
            }
        }
        matrix.reverse();
        let arr = [];
        for ( let i = 0; i < matrix.length; i++ ) {
            if ( i % 2 !== 0 ) {
                matrix[i].reverse();
            }
            for ( let j = 0; j < matrix[i].length; j++ ) {
                if ( matrix[i][j] === 0 ) {
                    arr.push( "000000" );
                } else {
                    arr.push(new Color(matrix[i][j], 'hex').brightness((options?.brightness ?? .2) * 100).getHex(false));
                }
            }

        }
        return arr;
    }
};

const numbers = {
    "0": [
        [0, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 0, 0, 0, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 0, 0]
    ],
    "1": [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0]
    ],
    "2": [
        [0, 1, 1, 1, 0, 1, 0, 0],
        [0, 1, 0, 1, 0, 1, 0, 0],
        [0, 1, 0, 1, 1, 1, 0, 0]
    ],
    "3": [
        [0, 1, 0, 1, 0, 1, 0, 0],
        [0, 1, 0, 1, 0, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 0, 0]
    ],
    "4": [
        [0, 0, 0, 1, 1, 1, 0, 0],
        [0, 0, 0, 1, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 0, 0]
    ],
    "5": [
        [0, 1, 0, 1, 1, 1, 0, 0],
        [0, 1, 0, 1, 0, 1, 0, 0],
        [0, 1, 1, 1, 0, 1, 0, 0]
    ],
    "6": [
        [0, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 0, 1, 0, 0, 0, 0],
        [0, 1, 1, 1, 0, 0, 0, 0]
    ],
    "7": [
        [0, 0, 0, 0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 0, 0]
    ],
    "8": [
        [0, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 0, 1, 0, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 0, 0]
    ],
    "9": [
        [0, 0, 0, 1, 1, 1, 0, 0],
        [0, 0, 0, 1, 0, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 0, 0]
    ],
    ":": [
        [0, 1, 1, 0, 1, 1, 0, 0],
    ],
    " ": [
        [0, 0, 0, 0, 0, 0, 0, 0],
    ],
    "^": [
    ],
    "D": [
        [0, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 0, 0, 0, 1, 0, 0],
        [0, 0, 1, 1, 1, 0, 0, 0]
    ],
    "E": [
        [0, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 0, 1, 0, 1, 0, 0],
        [0, 1, 0, 1, 0, 1, 0, 0]
    ],
    "H": [
        [0, 1, 1, 1, 1, 1, 0, 0],
        [0, 0, 0, 1, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 0, 0]
    ],
    "M": [
        [0, 1, 1, 1, 1, 1, 0, 0],
        [0, 0, 0, 1, 1, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 0, 0]
    ],
    "N": [
        [0, 1, 1, 1, 1, 1, 0, 0],
        [0, 0, 1, 1, 1, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 0, 0]
    ],
    "O": [
        [0, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 0, 0, 0, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 0, 0]
    ],
    "P": [
        [0, 1, 1, 1, 1, 1, 0, 0],
        [0, 0, 0, 1, 0, 1, 0, 0],
        [0, 0, 0, 1, 1, 1, 0, 0]
    ],
    "R": [
        [0, 1, 1, 1, 1, 1, 0, 0],
        [0, 0, 1, 1, 0, 1, 0, 0],
        [0, 1, 0, 1, 1, 1, 0, 0]
    ],
    "S": [
        [0, 1, 0, 1, 1, 1, 0, 0],
        [0, 1, 0, 1, 0, 1, 0, 0],
        [0, 1, 1, 1, 0, 1, 0, 0]
    ],
    "T": [
        [0, 0, 0, 0, 0, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 0, 0],
        [0, 0, 0, 0, 0, 1, 0, 0]
    ],
    "U": [
        [0, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 0, 0]
    ],
    "W": [
        [0, 1, 1, 1, 1, 1, 0, 0],
        [0, 0, 1, 1, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 0, 0]
    ],

}