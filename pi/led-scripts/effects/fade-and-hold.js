const { Color } = require( '@orangejedi/yacml' );

module.exports = {
    'id': "fade-hold",
    'name': "Fade and Hold",
    'animate': true,
    'options': [
        { 'id': "fadeSpeed", 'name': "Fade Speed", 'type': "number", 'default': 2 },
        { 'id': "minTime", 'name': "Min Hold Time", 'type': "number", 'default': 5 },
        { 'id': "maxTime", 'name': "Max Hold Time", 'type': "number", 'default': 10 }
    ],
    "Create": function ( colorArray, options ) {
        this.patternArray = [...colorArray];
        this.minTime = Number( options.minTime );
        this.maxTime = Number( options.maxTime );
        this.steps = 24;
        this.fadeSpeed = Number( options.fadeSpeed );
        this.holdInterval = randomNum( this.minTime, this.maxTime );
        this.counter = this.fadeSpeed;
        this.stage = "fade-in";
        this.interval = 1000 / this.steps;
        this.step = function ( callback ) {
            let out = [...this.patternArray];
            this.counter -= 1 / this.steps;
            switch ( this.stage ) {
                case 'holding':
                    if ( this.counter <= 0 ) {
                        this.holdInterval = randomNum( this.minTime, this.maxTime );
                        this.counter = this.fadeSpeed;
                        this.stage = "fade-out";
                    }
                    callback( out );
                    return;
                case 'fade-in':
                    if ( this.counter <= 0 ) {
                        this.counter = this.holdInterval;
                        this.stage = "holding";
                        callback( out );
                        return;
                    }
                    const fadeInAmount = 1 - this.counter / this.fadeSpeed;
                    callback( out.map( v => new Color( v, 'hex' ).brightness( fadeInAmount * 100 ).getHex( false ) ) );
                    return;
                case 'fade-out':
                    if ( this.counter <= -1 * this.fadeSpeed / 8 ) {
                        this.counter = this.fadeSpeed;
                        this.stage = "fade-in";
                        callback( out.fill( "000000" ) );
                        return;
                    }
                    const fadeOutAmount = this.counter / this.fadeSpeed;
                    if(fadeOutAmount < 0){
                        callback( out.fill( "000000" ) );
                        return;
                    }
                    callback( out.map( v => new Color( v, 'hex' ).brightness( fadeOutAmount * 100 ).getHex( false ) ) );
                    return;
            }
        }
    }
}

function randomNum( low, high ) {
    return (Math.floor( Math.random() * (high - low) * 10 ) / 10 + low);
}