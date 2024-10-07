const { Color } = require( '@orangejedi/yacml' );
const { randomNum, randomInt } = require( '../led-scripts-helper' );

module.exports = {
    id: "breathe",
    name: "Breathe",
    animate: true,
    options: [
        { id: "minFadeSpeed", name: "Min Fade Speed", type: "number", default: 2 },
        { id: "maxFadeSpeed", name: "Max Fade Speed", type: "number", default: 4 },
        { id: "minBrightTime", name: "Min Bright Hold Time", type: "number", default: 1 },
        { id: "maxBrightTime", name: "Max Bright Hold Time", type: "number", default: 2 },
        { id: "minDarkTime", name: "Min Dark Hold Time", type: "number", default: 0 },
        { id: "maxDarkTime", name: "Max Dark Hold Time", type: "number", default: 1 },
        { id: "minBright", name: "Min Brightness", type: "number", default: 0 },
        { id: "maxBright", name: "Max Brightness", type: "number", default: 100 },
        {
            id: "type", name: "Fade Type", type: "select", default: 'normal', options: [
                { value: "normal", name: "Normal" },
                { value: "linear", name: "Linear Color" },
                { value: "random", name: "Random Color" }
            ]
        }
    ],
    Create: function ( colorArray, { minFadeSpeed, maxFadeSpeed, minBrightTime, maxBrightTime, minDarkTime, maxDarkTime, minBright, maxBright, type } ) {
        this.patternArray = [...colorArray];
        this.outputArray = new Array( colorArray.length );
        this.minBrightTime = Number( minBrightTime );
        this.maxBrightTime = Number( maxBrightTime );
        this.minDarkTime = Number( minDarkTime );
        this.maxDarkTime = Number( maxDarkTime );
        this.minFadeSpeed = Number(minFadeSpeed);
        this.maxFadeSpeed = Number (maxFadeSpeed);
        this.minBrightness = Number( minBright );
        this.maxBrightness = Number( maxBright );
        this.fadeSpeed = randomNum(this.minFadeSpeed, this.maxFadeSpeed);
        this.holdBrightInterval = randomNum( this.minBrightTime, this.maxBrightTime );
        this.holdDarkInterval = randomNum( this.minDarkTime, this.maxDarkTime );
        this.bightnessGap = this.maxBrightness - this.minBrightness;
        this.stage = "fade-in";
        this.color = "";
        this.colorAt = 0;
        this.nextCycle = () => {
            this.fadeSpeed = randomNum(this.minFadeSpeed, this.maxFadeSpeed);
            switch ( type ) {
                case "normal":
                    this.outputArray = [...this.patternArray];
                    break;
                case "linear":
                    this.color = this.patternArray[this.colorAt % this.patternArray.length];
                    this.outputArray.fill( this.color );
                    this.colorAt++;
                    break;
                case "random":
                    this.color = this.patternArray[randomInt( 0, this.patternArray.length - 1 )];
                    this.outputArray.fill( this.color );
                    break;
            }
        }
        this.nextCycle();
        this.counter = 0;
        this.steps = 24;
        this.interval = 1000 / this.steps;
        this.step = function ( callback ) {
            let out = [...this.outputArray];
            switch ( this.stage ) {
                case 'fade-in':
                    this.counter += 1 / this.steps;
                    let fadeInAmount = (this.counter / this.fadeSpeed) * this.bightnessGap + this.minBrightness;
                    if ( this.counter >= this.fadeSpeed + this.holdBrightInterval) {
                        this.holdBrightInterval = randomNum( this.minBrightTime, this.maxDarkTime );
                        this.counter = this.fadeSpeed;
                        this.stage = "fade-out";
                    }
                    if( fadeInAmount > this.maxBrightness){
                        fadeInAmount = this.maxBrightness
                    }
                    callback( out.map( v => new Color( v, 'hex' ).brightness( fadeInAmount ).getHex( false ) ) );
                    return;
                case 'fade-out':
                    this.counter -= 1 / this.steps;
                    let fadeOutAmount = (this.counter / this.fadeSpeed) * this.bightnessGap + this.minBrightness;
                    if ( this.counter <= -1 * this.holdDarkInterval ) {
                        this.nextCycle();
                        this.holdDarkInterval = randomNum( this.minDarkTime, this.maxDarkTime );
                        this.counter = 0;
                        this.stage = "fade-in";
                    }
                    if ( fadeOutAmount < this.minBrightness ) {
                        fadeOutAmount = this.minBrightness;
                    }
                    callback( out.map( v => new Color( v, 'hex' ).brightness( fadeOutAmount ).getHex( false ) ) );
                    return;
            }
        }
    }
}