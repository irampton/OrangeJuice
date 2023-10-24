const { Color } = require( '@orangejedi/yacml' );

module.exports = {
    'id': "audioVisualizer",
    'name': "Audio Visualizer",
    'options': [
        { 'id': "audioData", 'name': "Audio Data", 'type': "arr", 'default': [] }
    ],
    'hide': true,
    'generate': ( numLEDs, options ) => {
        let arr = [];
        let flatten = Math.round( numLEDs / options.audioData.length + .5 );
        for ( let i = 0; i < numLEDs; i += flatten ) {
            for ( let j = 0; j < flatten; j++ ) {
                arr.push( new Color( options.audioData[i + j] * 360, "hue" ).getHex( false ) );
            }
        }
        return arr;
    }
};

