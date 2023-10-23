const { Color } = require( '@orangejedi/yacml' );

module.exports = {
    'id': "fade-hold-random",
    'name': "Fade and Hold Random",
    'animate': true,
    'options': [
        { 'id': "fadeSpeed", 'name': "Fade Speed", 'type': "number", 'default': 2 },
        { 'id': "minTime", 'name': "Min Hold Time", 'type': "number", 'default': 5 },
        { 'id': "maxTime", 'name': "Max Hold Time", 'type': "number", 'default': 10 }
    ],
    "Create": function ( colorArray, options ) {
        this.patternArray = [...colorArray];
        this.outputArray = new Array( colorArray.length );
        this.minTime = Number( options.minTime );
        this.maxTime = Number( options.maxTime );
        this.color = this.patternArray[randomInt( 0, this.patternArray.length - 1 )];
        this.steps = 24;
        this.fadeSpeed = Number( options.fadeSpeed );
        this.holdInterval = randomNum( this.minTime, this.maxTime );
        this.counter = this.fadeSpeed;
        this.stage = "fade-in";
        this.interval = 1000 / this.steps;
        this.step = function ( callback ) {
            this.counter -= 1 / this.steps;
            switch ( this.stage ) {
                case 'holding':
                    if ( this.counter <= 0 ) {
                        this.holdInterval = randomNum( this.minTime, this.maxTime );
                        this.counter = this.fadeSpeed;
                        this.stage = "fade-out";
                    }
                    callback( this.outputArray );
                    return;
                case 'fade-in':
                    if ( this.counter <= 0 ) {
                        this.counter = this.holdInterval;
                        this.stage = "holding";
                        callback( this.outputArray.fill(this.color) );
                        return;
                    }
                    const fadeInAmount = 1 - this.counter / this.fadeSpeed;
                    callback( this.outputArray.fill( new Color( this.color, 'hex' ).brightness( fadeInAmount * 100 ).getHex( false ) ) );
                    return;
                case 'fade-out':
                    if ( this.counter <= -1 * this.fadeSpeed / 8 ) {
                        this.color = this.patternArray[randomInt( 0, this.patternArray.length - 1 )];
                        this.counter = this.fadeSpeed;
                        this.stage = "fade-in";
                        callback( this.outputArray.fill( "000000" ) );
                        return;
                    }
                    const fadeOutAmount = this.counter / this.fadeSpeed;
                    if(fadeOutAmount < 0){
                        callback( this.outputArray.fill( "000000" ) );
                        return;
                    }
                    callback( this.outputArray.fill( new Color( this.color, 'hex' ).brightness( fadeOutAmount * 100 ).getHex( false ) ) );
                    return;
            }
        }
    }
}

function randomInt( low, high ) {
    return Math.floor( Math.random() * (high - low) ) + low;
}

function randomNum( low, high ) {
    return (Math.floor( Math.random() * (high - low) * 10 ) / 10 + low);
}