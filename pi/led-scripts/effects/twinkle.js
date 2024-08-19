const { Color } = require( '@orangejedi/yacml' );
const { randomNum } = require( '../led-scripts-helper' );

module.exports = {
    id: "twinkle",
    name: "Twinkle",
    animate: true,
    options: [
        { id: "speed", name: "Twinkle Speed", type: "number", default: 2 },
        { id: "averageBrightness", name: "Average Brightness", type: "number", default: 70 },
        { id: "twinkleBrightness", name: "Twinkle Brightness", type: "number", default: 100 },
        { id: "minTime", name: "Min Dim Time", type: "number", default: 1 },
        { id: "maxTime", name: "Max Dim Time", type: "number", default: 8 }
    ],
    "Create": function ( colorArray, { speed, averageBrightness, twinkleBrightness, minTime, maxTime } ) {
        this.speed = speed ?? 2;
        this.averageBrightness = averageBrightness ?? 70;
        this.twinkleBrightness = twinkleBrightness ?? 100;
        this.minTime = Number( minTime ) ?? 1;
        this.maxTime = Number( maxTime ) ?? 8;
        this.patternArray = [...colorArray];
        this.brigtnessMap = new Array( this.patternArray.length ).fill( this.averageBrightness );
        this.timerMap = new Array( this.patternArray.length ).fill( 0 ).map( () => randomNum( this.minTime, this.maxTime ) );
        this.steps = 24;
        this.interval = 1000 / this.steps;
        this.diffrence = (this.twinkleBrightness - this.averageBrightness);
        this.step = function ( callback ) {
            this.timerMap = this.timerMap.map( v => v <= (this.speed * -2) ? randomNum( this.minTime, this.maxTime ) : v - (1 / this.steps) );
            this.brigtnessMap = this.brigtnessMap.map( ( v, index ) => this.timerMap[index] >= 0 ? this.averageBrightness : ((1 - (Math.abs( this.timerMap[index] + this.speed ) / this.speed)) * this.diffrence) + this.averageBrightness );
            callback( this.patternArray.map( ( v, index ) => new Color( v, 'hex' ).brightness( this.brigtnessMap[index] ).getHex( false ) ) );
        }
    }
};