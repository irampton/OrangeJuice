const { randomInt } = require( '../led-scripts-helper' );

module.exports = {
    id: "blink",
    name: "Blink",
    animate: true,
    options: [
        { id: "speed", name: "Speed", type: "number", default: 1 },
        { id: "order", name: "Color Order", type: "select", default: 'linear', options: [
                { value: "linear", name: "Linear" },
                { value: "random", name: "Random" }
            ]
        }
    ],
    Create: function ( colorArray, { speed, order } ) {
        this.colorArray = [...colorArray];
        this.speed = speed ?? 1;
        this.interval = 1 / this.speed * 1000;
        this.colorIndex = order === "random" ? randomInt( 0, this.colorArray.length - 1 ) : 0;
        this.step = function ( callback ) {
            if ( this.colorIndex === this.colorArray.length ) {
                this.currentStep = 0;
            }
            callback( new Array( this.colorArray.length ).fill( this.colorArray[this.colorIndex] ) );
            if ( order === "random" ) {
                this.colorIndex = randomInt( 0, this.colorArray.length - 1 );
            } else {
                this.colorIndex++;
            }
        }
    }
};