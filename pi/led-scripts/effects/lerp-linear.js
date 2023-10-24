const { Color } = require( '@orangejedi/yacml' );
const { randomNum } = require( '../led-scripts-helper' );

module.exports = {
    'id': "lerp-linear",
    'name': "Lerp (Linear)",
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
        this.colorAt = 0;
        this.color2 = this.patternArray[this.colorAt % this.patternArray.length];
        this.newColor = () => {
            this.colorAt++;
            this.color1 = this.color2
            this.color2 = this.color2 = this.patternArray[this.colorAt % this.patternArray.length];
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