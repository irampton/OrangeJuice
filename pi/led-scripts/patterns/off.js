module.exports = {
    'id': "off",
    'name': "Off",
    'options': [],
    'generate': ( numLEDs, options ) => {
        let arr = [];
        for ( let i = 0; i < numLEDs; i++ ) {
            arr.push( "000000" );
        }
        return arr;
    }
};