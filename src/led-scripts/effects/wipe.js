const { randomInt } = require( "../led-scripts-helper" );
module.exports = {
    id: "wipe",
    name: "Wipe",
    animate: true,
    options: [
        { id: "speed", name: "Speed", type: "number", default: 1 },
        { id: "order", name: "Color Order", type: "select", default: 'linear', options: [
                { value: "linear", name: "Linear" },
                { value: "random", name: "Random" }
            ]
        }
    ],
    Create: function ( colorArray, { speed, order, numLEDs } ) {
        this.numLeds = numLEDs;
        this.patternArray = [...colorArray];
        this.colorArray = new Array( this.patternArray.length ).fill( this.patternArray[0] );
        this.speed = speed ?? 1;
        this.interval = 1 / this.speed * 1000 / colorArray.length;
        this.currentStep = 0;
        this.currentLight = this.numLeds - 1;
        this.step = function ( callback ) {
            if ( this.currentLight >= this.numLeds ) {
                this.currentLight = 0;
                if ( order === "random" ) {
                    this.currentStep = randomInt( 0, this.patternArray.length );
                } else {
                    this.currentStep++;
                }
            }
            if ( this.currentStep >= this.patternArray.length ) {
                this.currentStep = 0;
            }
            this.colorArray[this.currentLight] = this.patternArray[this.currentStep];
            this.currentLight++;
            callback( this.colorArray );
        }
    }
};