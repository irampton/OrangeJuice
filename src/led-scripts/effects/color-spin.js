const { Color } = require( '@orangejedi/yacml' );
const { randomInt } = require( '../led-scripts-helper' );

module.exports = {
    id: "color-spin",
    name: "Color Spin",
    animate: true,
    options: [
        { id: "speed", name: "Color Shift Speed", type: "number", default: 4 },
        { id: "speedVariation", name: "Shift Speed Variation", type: "number", default: 0 },
        { id: "spinSpeed", name: "Spin Speed", type: "number", default: 1 },
        { id: "reverse", name: "Reverse", type: "checkbox", default: false }
    ],
    Create: function ( colorArray, { numLEDs, speed, speedVariation, spinSpeed, reverse } ) {
        this.patternArray = colorArray.length ? [...colorArray] : [ '#000000' ];
        this.numLEDs = Number( numLEDs ) || this.patternArray.length || 1;
        this.outputArray = new Array( this.numLEDs );
        this.steps = 24;
        this.interval = 1000 / this.steps;
        this.reverse = reverse ?? false;
        this.spinSpeed = Number( spinSpeed ) || 0;
        this.baseSpeed = Math.max( 0.05, Number( speed ) || 0.05 );
        this.speedVariation = Math.max( 0, Number( speedVariation ) || 0 );
        this.offset = 0;

        this.pickColor = ( exclude ) => {
            if ( this.patternArray.length === 1 ) {
                return this.patternArray[0];
            }
            let color = this.patternArray[randomInt( 0, this.patternArray.length )];
            let guard = 0;
            while ( color === exclude && guard < 10 ) {
                color = this.patternArray[randomInt( 0, this.patternArray.length )];
                guard++;
            }
            return color;
        };

        this.buildGradient = ( colorA, colorB ) => {
            const out = new Array( this.numLEDs );
            for ( let i = 0; i < this.numLEDs; i++ ) {
                const t = i / this.numLEDs;
                const amt = t < 0.5 ? t * 2 : ( t - 0.5 ) * 2;
                const from = t < 0.5 ? colorA : colorB;
                const to = t < 0.5 ? colorB : colorA;
                out[i] = new Color( from, 'hex' ).lerp( new Color( to, 'hex' ), amt ).getHex( false );
            }
            return out;
        };

        this.nextDuration = () => {
            if ( this.speedVariation <= 0 ) {
                return this.baseSpeed;
            }
            const delta = ( Math.random() * 2 - 1 ) * this.speedVariation;
            return Math.max( 0.05, this.baseSpeed + delta );
        };

        this.color1 = this.pickColor();
        this.color2 = this.pickColor( this.color1 );
        this.currentGradient = this.buildGradient( this.color1, this.color2 );
        this.color2 = this.pickColor( this.color1 );
        this.targetGradient = this.buildGradient( this.color1, this.color2 );
        this.fadeProgress = 0;
        this.shiftDuration = this.nextDuration();
        this.fadeStep = 1 / ( this.shiftDuration * this.steps );
        this.blendedGradient = new Array( this.numLEDs );

        this.step = function ( callback ) {
            this.fadeProgress += this.fadeStep;
            if ( this.fadeProgress >= 1 ) {
                this.fadeProgress = 0;
                this.color1 = this.color2;
                this.currentGradient = this.targetGradient;
                this.color2 = this.pickColor( this.color1 );
                this.targetGradient = this.buildGradient( this.color1, this.color2 );
                this.shiftDuration = this.nextDuration();
                this.fadeStep = 1 / ( this.shiftDuration * this.steps );
            }

            for ( let i = 0; i < this.numLEDs; i++ ) {
                const base = this.currentGradient[i];
                const target = this.targetGradient[i];
                if ( this.fadeProgress <= 0 ) {
                    this.blendedGradient[i] = base;
                } else {
                    this.blendedGradient[i] = new Color( base, 'hex' )
                        .lerp( new Color( target, 'hex' ), this.fadeProgress )
                        .getHex( false );
                }
            }

            const spinDelta = ( this.spinSpeed / this.steps ) * ( this.reverse ? -1 : 1 );
            this.offset += spinDelta;
            if ( this.offset < 0 ) {
                this.offset += this.numLEDs;
            } else if ( this.offset >= this.numLEDs ) {
                this.offset -= this.numLEDs;
            }

            for ( let j = 0; j < this.numLEDs; j++ ) {
                let pos = j - this.offset;
                if ( pos < 0 ) {
                    pos += this.numLEDs;
                }
                const i0 = Math.floor( pos );
                const i1 = ( i0 + 1 ) % this.numLEDs;
                const frac = pos - i0;
                if ( frac === 0 ) {
                    this.outputArray[j] = this.blendedGradient[i0];
                } else {
                    this.outputArray[j] = new Color( this.blendedGradient[i0], 'hex' )
                        .lerp( new Color( this.blendedGradient[i1], 'hex' ), frac )
                        .getHex( false );
                }
            }

            callback( this.outputArray );
        };
    }
};
