const { Color } = require( '@orangejedi/yacml' );

module.exports = {
    'id': "fade-in-out-random",
    'name': "Fade In and Out Random",
    'animate': true,
    'options': [
        { 'id': "minTime", 'name': "Min Time", 'type': "number", 'default': 5 },
        { 'id': "maxTime", 'name': "Max Time", 'type': "number", 'default': 10 }
    ],
    "Create": function ( colorArray, options ) {
        this.patternArray = [...colorArray];
        this.outputArray = new Array( colorArray.length );
        this.color = this.patternArray[randomInt( 0, this.patternArray.length - 1 )];
        this.minTime = Number( options.minTime );
        this.maxTime = Number( options.maxTime );
        this.steps = 24;
        this.fadeInterval = randomNum( this.minTime, this.maxTime );
        this.fadeAt = this.fadeInterval;
        this.interval = 1000 / this.steps;
        this.step = function ( callback ) {
            this.fadeAt -= 1 / this.steps;
            if ( this.fadeAt <= 0 ) {
                this.color = this.patternArray[randomInt( 0, this.patternArray.length - 1 )];
                this.fadeInterval = randomNum( this.minTime, this.maxTime );
                this.fadeAt = this.fadeInterval;
                callback( this.outputArray.fill( "000000" ) );
            } else {
                const fadeAmount = 1 - Math.abs( ((1 - this.fadeAt / this.fadeInterval) - .5) * 2 );
                const adjustedColor = new Color( this.color, 'hex' ).brightness( fadeAmount * 100 ).getHex( false );
                callback( this.outputArray.fill( adjustedColor ) );
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