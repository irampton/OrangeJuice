module.exports = {
    'id': "fillX",
    'name': "Fill X",
    'options': [
        { 'id': "colors", 'name': "Colors", 'type': "colorArray", 'default': [ "000000", "000000", "000000" ] },
    ],
    'generate': ( numLEDs, options ) => {
        let arr = [];
        for ( let i = 0; i < options.colors.length; i++ ) {
            arr.push( options.colors[i] );
        }
        while ( arr.length < numLEDs ) {
            arr.push( ...arr );
        }
        return arr;
    }
};