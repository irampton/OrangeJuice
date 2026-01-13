const { Color } = require( '../YACML' );
const { randomInt } = require( '../led-scripts-helper' );

module.exports = {
    id: "color-spin",
    name: "Color Spin",
    animate: true,
    options: [
        { id: "speed", name: "Color Shift Speed", type: "number", default: 4 },
        { id: "speedVariation", name: "Shift Speed Variation", type: "number", default: 0 },
        { id: "spinSpeed", name: "Spin Speed", type: "number", default: 1 },
        { id: "reverse", name: "Reverse", type: "checkbox", default: false },
        {
            id: "colorCount",
            name: "Colors On Ring",
            type: "select",
            default: 2,
            options: [
                { value: 2, name: "2" },
                { value: 3, name: "3" },
                { value: 4, name: "4" }
            ]
        }
    ],
    Create: function ( colorArray, { numLEDs, speed, speedVariation, spinSpeed, reverse, colorCount } ) {
        this.patternArray = colorArray.length ? [...colorArray] : [ '#000000' ];
        this.numLEDs = Number( numLEDs ) || this.patternArray.length || 1;
        this.outputArray = new Array( this.numLEDs );
        this.steps = 30;
        this.interval = 1000 / this.steps;
        this.reverse = reverse ?? false;
        this.spinSpeed = Number( spinSpeed ) || 0;
        this.baseSpeed = Math.max( 0.05, Number( speed ) || 0.05 );
        this.speedVariation = Math.max( 0, Number( speedVariation ) || 0 );
        this.colorCount = Math.min( 4, Math.max( 2, Number( colorCount ) || 2 ) );
        this.minAnchorDistance = this.colorCount === 2 ? 4 : 2;
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

        this.distCW = ( from, to ) => {
            return to >= from ? ( to - from ) : ( this.numLEDs - ( from - to ) );
        };

        this.ringMinDist = ( a, b ) => {
            const cw = this.distCW( a, b );
            const ccw = this.numLEDs - cw;
            return Math.min( cw, ccw );
        };

        this.pickColors = ( count, exclude ) => {
            const picked = [];
            let guard = 0;
            while ( picked.length < count && guard < 50 ) {
                const candidate = this.pickColor();
                if ( candidate === exclude ) {
                    guard++;
                    continue;
                }
                if ( !picked.includes( candidate ) || this.patternArray.length < count ) {
                    picked.push( candidate );
                }
                guard++;
            }
            while ( picked.length < count ) {
                picked.push( this.patternArray[picked.length % this.patternArray.length] );
            }
            return picked;
        };

        this.pickAnchors = ( count ) => {
            let minDist = this.minAnchorDistance;
            if ( this.numLEDs < count * minDist ) {
                minDist = Math.max( 1, Math.floor( this.numLEDs / count ) );
            }
            let positions = [];
            while ( positions.length < count && minDist > 0 ) {
                positions = [];
                let guard = 0;
                while ( positions.length < count && guard < 300 ) {
                    const candidate = randomInt( 0, this.numLEDs );
                    let ok = true;
                    for ( let i = 0; i < positions.length; i++ ) {
                        if ( this.ringMinDist( candidate, positions[i] ) < minDist ) {
                            ok = false;
                            break;
                        }
                    }
                    if ( ok ) {
                        positions.push( candidate );
                    }
                    guard++;
                }
                if ( positions.length < count ) {
                    minDist -= 1;
                }
            }
            if ( positions.length < count ) {
                positions = [];
                for ( let i = 0; i < count; i++ ) {
                    positions.push( Math.floor( ( i * this.numLEDs ) / count ) );
                }
            }
            positions.sort( ( a, b ) => a - b );
            return positions;
        };

        this.buildGradient = ( colors, positions ) => {
            const out = new Array( this.numLEDs );
            for ( let i = 0; i < this.numLEDs; i++ ) {
                out[i] = colors[0];
            }
            for ( let i = 0; i < positions.length; i++ ) {
                const next = ( i + 1 ) % positions.length;
                const a = positions[i];
                const b = positions[next];
                const steps = this.distCW( a, b );
                for ( let s = 0; s <= steps; s++ ) {
                    const led = ( a + s ) % this.numLEDs;
                    const amt = steps === 0 ? 0 : ( s / steps );
                    out[led] = new Color( colors[i], 'hex' )
                        .lerp( new Color( colors[next], 'hex' ), amt )
                        .getHex();
                }
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

        this.currentColors = this.pickColors( this.colorCount );
        this.currentAnchors = this.pickAnchors( this.colorCount );
        this.targetColors = this.pickColors( this.colorCount );
        this.targetAnchors = this.pickAnchors( this.colorCount );
        this.currentGradient = this.buildGradient( this.currentColors, this.currentAnchors );
        this.targetGradient = this.buildGradient( this.targetColors, this.targetAnchors );
        this.fadeProgress = 0;
        this.shiftDuration = this.nextDuration();
        this.fadeStep = 1 / ( this.shiftDuration * this.steps );
        this.blendedGradient = new Array( this.numLEDs );

        this.step = function ( callback ) {
            this.fadeProgress += this.fadeStep;
            if ( this.fadeProgress >= 1 ) {
                this.fadeProgress = 0;
                this.currentColors = this.targetColors;
                this.currentAnchors = this.targetAnchors;
                this.currentGradient = this.targetGradient;
                this.targetColors = this.pickColors( this.colorCount );
                this.targetAnchors = this.pickAnchors( this.colorCount );
                this.targetGradient = this.buildGradient( this.targetColors, this.targetAnchors );
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
                        .getHex();
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
                        .getHex();
                }
            }

            callback( this.outputArray );
        };
    }
};
