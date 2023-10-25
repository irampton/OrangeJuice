const { Color } = require( '@orangejedi/yacml' );
const { randomNum, randomInt } = require( '../led-scripts-helper' );

module.exports = {
    'id': "twinkle",
    'name': "Twinkle",
    'animate': true,
    'options': [
        { 'id': "speed", 'name': "Twinkle Speed", 'type': "number", 'default': 2 },
        { 'id': "averageBrightness", 'name': "Average Brightness", 'type': "number", 'default': 70 },
        { 'id': "twinkleBrightness", 'name': "Twinkle Brightness", 'type': "number", 'default': 100 },
        { 'id': "minTime", 'name': "Min Hold Time", 'type': "number", 'default': 1 },
        { 'id': "maxTime", 'name': "Max Hold Time", 'type': "number", 'default': 42 }
    ],
    "Create": function ( colorArray, options ) {
        this.speed = options.speed ?? 2;
        this.averageBrightness = options.averageBrightness;
        this.twinkleBrightness = options.twinkleBrightness
        this.minTime = Number( options.minTime );
        this.maxTime = Number( options.maxTime );
        this.patternArray = [...colorArray];
        this.averageColorMap = this.patternArray.map( v => new Color( v, 'hex' ).brightness( this.averageBrightness ).getHex( false ) );
        this.brigtnessMap = new Array( this.patternArray.length ).fill( this.averageBrightness );
        this.timerMap = new Array( this.patternArray.length ).fill( 0 ).map( () => randomNum( this.minTime, this.maxTime ) );
        this.steps = 24;
        this.interval = 1000 / this.steps;
        this.diffrence = (this.twinkleBrightness - this.averageBrightness);
        this.timer = [];
        this.longTimer = [];
        this.onStep = 0;
        this.step = function ( callback ) {
            this.timerMap = this.timerMap.map( v => v <= (this.speed * -2) ? randomNum( this.minTime, this.maxTime ) : v - (1 / this.steps) );
            this.brigtnessMap = this.brigtnessMap.map( ( v, index ) => this.timerMap[index] >= 0 ? this.averageBrightness : ((1 - (Math.abs( this.timerMap[index] + this.speed ) / this.speed)) * this.diffrence) + this.averageBrightness );
            callback( this.patternArray.map( ( v, index ) => this.brigtnessMap[index] === this.averageBrightness ? this.averageColorMap[index] : new Color( v, 'hex' ).brightness( this.brigtnessMap[index] ).getHex( false ) ) );
        }
    }
};