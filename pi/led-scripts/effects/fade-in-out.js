const { Color } = require( '@orangejedi/yacml' );

module.exports = {
    'id': "fade-in-out",
    'name': "Fade In and Out",
    'animate': true,
    'options': [
        { 'id': "minTime", 'name': "Min Time", 'type': "number", 'default': 5 },
        { 'id': "maxTime", 'name': "Max Time", 'type': "number", 'default': 10 }
    ],
    "Create": function ( colorArray, options ) {
        this.patternArray = [...colorArray];
        this.minTime = Number( options.minTime );
        this.maxTime = Number( options.maxTime );
        this.steps = 24;
        this.fadeInterval = randomNum( this.minTime, this.maxTime );
        this.fadeAt = this.fadeInterval;
        this.interval = 1000 / this.steps;
        this.step = function ( callback ) {
            let out = [...this.patternArray];
            this.fadeAt -= 1 / this.steps;
            if ( this.fadeAt <= 0 ) {
                this.fadeInterval = randomNum( this.minTime, this.maxTime );
                this.fadeAt = this.fadeInterval;
                callback( out.fill( "000000" ) );
            } else {
                const fadeAmount = 1 - Math.abs( ((1 - this.fadeAt / this.fadeInterval) - .5) * 2 );
                callback( out.map( v => new Color( v, 'hex' ).brightness( fadeAmount * 100 ).getHex( false ) ) );
            }
        }
    }
}

function randomNum( low, high ) {
    return (Math.floor( Math.random() * (high - low) * 10 ) / 10 + low);
}