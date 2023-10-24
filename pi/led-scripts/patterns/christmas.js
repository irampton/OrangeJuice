module.exports = {
    'id': "christmas",
    'name': "Christmas",
    'options': [],
    'generate': ( numLEDs, options ) => {
        let arr = [];
        for ( let i = 0; i < Math.ceil( numLEDs / 3 ); i++ ) {
            arr.push( "ff0000" );
            arr.push( "ffffff" );
            arr.push( "00ff00" );
        }
        return arr;
    }
};