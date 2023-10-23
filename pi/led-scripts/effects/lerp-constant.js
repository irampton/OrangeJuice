const { Color } = require( '@orangejedi/yacml' );

module.exports = {
    'id': "lerp-constant",
    'name': "Lerp",
    'animate': true,
    'options': [
        { 'id': "speed", 'name': "Speed", 'type': "number", 'default': 4 },
    ],
    "Create": function ( colorArray, options ) {
        this.patternArray = [...colorArray];
        this.outputArray = new Array( colorArray.length );
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
        this.step = function ( callback ) {
            this.fadeAt -= 1 / this.steps;
            if ( this.fadeAt <= -1 * this.fadeSpeed / 4 ) {
                this.newColor();
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