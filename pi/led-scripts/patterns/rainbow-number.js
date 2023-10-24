const {Color} = require('@orangejedi/yacml');

module.exports = {
    'id': "rainbow-num",
    'name': "Rainbow Number",
    'options': [
        { 'id': "num", 'name': "Number in Rainbow", 'type': "number", 'default': 16 },
        { 'id': "blank", 'name': "Fill remaining with Blanks", 'type': "checkbox", 'default': false }
    ],
    'generate': ( numLEDs, options ) => {
        let arr = [];
        for ( let i = 0; i < options.num; i++ ) {
            arr.push( new Color( i / options.num * 360 ).getHex(false) );
        }
        if(options.blank){
            for ( let i = options.num; i < numLEDs; i++ ) {
                arr.push( "000000" );
            }
        }
        while ( arr.length < numLEDs ) {
            arr.push( ...arr );
        }
        return arr;
    }
};