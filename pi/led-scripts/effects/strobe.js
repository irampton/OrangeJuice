const { gcd } = require( "../led-scripts-helper" );

module.exports = {
    'id': "strobe",
    'name': "Strobe",
    'animate': true,
    'options': [
        { 'id': "on", 'name': "On Time", 'type': "number", 'default': 1 },
        { 'id': "off", 'name': "Off Time", 'type': "number", 'default': 1 }
    ],
    "Create": function ( colorArray, { on, off } ) {
        this.patternArray = [...colorArray];
        this.blankArray = new Array( this.patternArray.length ).fill( '000000' );
        this.on = Number( on );
        this.off = Number( off );
        this.interval = gcd( this.on * 1000, this.off * 1000 );
        if ( this.interval < 1000 / 24 ) {
            this.interval = 1000 / 24;
        }
        this.counter = 0;
        this.step = function ( callback ) {
            this.counter += this.interval / 1000;
            if ( this.counter > this.on ) {
                this.counter = -1 * this.off;
            }
            if ( this.counter > 0 ) {
                callback( this.patternArray );
            } else {
                callback( this.blankArray );
            }
        }
    }
}