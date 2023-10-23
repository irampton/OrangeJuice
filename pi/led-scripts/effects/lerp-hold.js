const { Color } = require( '@orangejedi/yacml' );

module.exports = {
    'id': "lerp-hold",
    'name': "Lerp Hold",
    'animate': true,
    'options': [
        { 'id': "speed", 'name': "Speed", 'type': "number", 'default': 4 },
        { 'id': "minTime", 'name': "Min Hold Time", 'type': "number", 'default': 5 },
        { 'id': "maxTime", 'name': "Max Hold Time", 'type': "number", 'default': 10 }
    ],
    "Create": function ( colorArray, options ) {
        this.patternArray = [...colorArray];
        this.outputArray = new Array( colorArray.length );
        this.minTime = Number( options.minTime );
        this.maxTime = Number( options.maxTime );
        this.color2 = this.patternArray[randomInt( 0, this.patternArray.length - 1 )];
        this.newColor = () => {
            this.color1 = this.color2
            this.color2 = this.patternArray[randomInt( 0, this.patternArray.length - 1 )];
            let c = 0;
            while ( this.color1 === this.color2 && c < 10 ) {
                this.color2 = this.patternArray[randomInt( 0, this.patternArray.length - 1 )];
                c++;
            }
        }
        this.newColor();
        this.fadeSpeed = Number( options.speed );
        this.fadeAt = this.fadeSpeed;
        this.steps = 24;
        this.interval = 1000 / this.steps;
        this.holdInterval = randomNum( this.minTime, this.maxTime );
        this.step = function ( callback ) {
            this.fadeAt -= 1 / this.steps;
            if ( this.fadeAt <= -1 * this.holdInterval ) {
                this.newColor();
                this.holdInterval = randomNum( this.minTime, this.maxTime );
                this.fadeAt = this.fadeSpeed;
                callback( this.outputArray );
            } else if ( this.fadeAt <= 0 ) {
                callback( this.outputArray.fill( this.color2 ) );
            } else {
                const fadeAmount = 1 - this.fadeAt / this.fadeSpeed;
                const adjustedColor = new Color( this.color1, 'hex' ).lerp( new Color( this.color2, 'hex' ), fadeAmount ).getHex( false );
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